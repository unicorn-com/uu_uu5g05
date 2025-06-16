import { sessionHolder } from "../providers/session-provider.js";
import { appBaseUri } from "../uu5-environment.js";
import Dao, {
  DEFAULT_PAGE_SIZE,
  INDEX_SUBKEY_FIELD_SEPARATOR,
  INDEX_SUBKEY_SEPARATOR,
  isArrowFn,
  PRIMARY_KEY_PATH,
} from "./uu5-object-store-dao.js";
import Errors from "./uu5-object-store-errors.js";

let dbMap = {};
let lockMap = {};
let txLockMap = {};

// NOTE !!! All data-accessing (dbMap) API/protected methods must use this._internalEnqueueOperation(...) pattern
// (to not break transaction handling).

class DaoInMemory {
  constructor(schemaName, { schemaVersion = 1, schemaMaxAge, origDao } = {}) {
    // NOTE Currently cannot use private fields - see comment in _runInTransaction().
    this._internalSchemaName = schemaName;
    this._internalPrimaryKeyPath = PRIMARY_KEY_PATH;
    this._internalPrimaryKey = this._internalPrimaryKeyPath.join(INDEX_SUBKEY_FIELD_SEPARATOR);
    this._internalOrigDao = origDao;
    this._internalIdCounter = 0;
    // NOTE schemaMaxAge is not handled - data will disappear after page is reloaded.
  }
  // API for consumers

  // createSchema() {}
  // upgradeSchema({ oldVersion }) {}

  async dropSchema() {
    return this._internalEnqueueOperation(async () => {
      let db = await this._internalInitDb();
      if (db === this._explicitMemoryDb) {
        this._explicitMemoryDb = null; // called within explicit transaction
      } else {
        delete dbMap[db.name];
      }
    });
  }

  async close() {
    // no-op
  }

  getSchemaName() {
    return this._internalSchemaName;
  }

  async create(uuObject) {
    return this._insertOne(uuObject);
  }

  /**
   * @param {UuObject[]} uuObjectList
   * @returns {Promise<UuObject[]>}
   */
  async createMany(uuObjectList) {
    try {
      return await this._insertMany(uuObjectList);
    } catch (e) {
      if (e instanceof Errors.InsertManyFailedError) {
        throw new Errors.CreateManyFailedError(e.insertedMap, e.errorMap, e);
      }
      throw e;
    }
  }

  /**
   *
   * @param {string} oid
   * @returns {Promise<UuObject?>}
   */
  async get(oid) {
    return this._findOne({ oid });
  }

  /**
   * @param {UuObject} uuObject
   * @returns {Promise<UuObject>}
   */
  async update(uuObject) {
    return this._internalEnqueueOperation(async () => {
      let { itemMap, indexList } = await this._internalInitDb();
      return this._internalSetOneUuObject(itemMap, indexList, uuObject, { createIfMissing: false, replace: false });
    });
  }

  /**
   * @param {UuObject[]} uuObjectList
   * @returns {Promise<UuObject[]>}
   */
  async updateMany(uuObjectList) {
    return this._internalEnqueueOperation(async () => {
      let db = await this._internalInitDb();
      let { itemMap, indexList } = db;

      let itemMapCopy = { ...itemMap };
      let errorMap = {};
      let itemList = [];
      for (let i = 0; i < uuObjectList.length; i++) {
        let uuObject = uuObjectList[i];
        try {
          let item = this._internalSetOneUuObject(itemMapCopy, indexList, uuObject, {
            createIfMissing: false,
            replace: false,
          });
          itemList.push(item);
        } catch (e) {
          if (!(e instanceof Errors.ObjectStoreError)) {
            errorMap[i] = new Errors.UnexpectedError(e);
          } else {
            errorMap[i] = e;
          }
        }
      }
      // if any insertion fails, we want to not add any of other items, i.e. rollback
      // (and while we're adding them they must know about previously added item for duplicateKey checks)
      if (Object.keys(errorMap).length > 0) {
        throw new Errors.UpdateManyFailedError({}, errorMap);
      }
      Object.assign(db, { itemMap: itemMapCopy, indexList });
      return itemList;
    });
  }

  /**
   * @param {UuObject} uuObject
   * @returns {Promise<UuObject>}
   */
  async replace(uuObject) {
    return this._internalEnqueueOperation(async () => {
      let { itemMap, indexList } = await this._internalInitDb();
      return this._internalSetOneUuObject(itemMap, indexList, uuObject, { createIfMissing: false, replace: true });
    });
  }

  /**
   * @param {UuObject[]} uuObjectList
   * @returns {Promise<UuObject[]>}
   */
  async replaceMany(uuObjectList) {
    return this._internalEnqueueOperation(async () => {
      let db = await this._internalInitDb();
      let { itemMap, indexList } = db;

      let itemMapCopy = { ...itemMap };
      let errorMap = {};
      let itemList = [];
      for (let i = 0; i < uuObjectList.length; i++) {
        let uuObject = uuObjectList[i];
        try {
          let item = this._internalSetOneUuObject(itemMapCopy, indexList, uuObject, {
            createIfMissing: false,
            replace: true,
          });
          itemList.push(item);
        } catch (e) {
          if (!(e instanceof Errors.ObjectStoreError)) {
            errorMap[i] = new Errors.UnexpectedError(e);
          } else {
            errorMap[i] = e;
          }
        }
      }
      // if any insertion fails, we want to not add any of other items, i.e. rollback
      // (and while we're adding them they must know about previously added item for duplicateKey checks)
      if (Object.keys(errorMap).length > 0) {
        throw new Errors.ReplaceManyFailedError({}, errorMap);
      }
      Object.assign(db, { itemMap: itemMapCopy, indexList });
      return itemList;
    });
  }

  /**
   * @param {UuObject} uuObject
   * @returns {Promise<boolean>}
   */
  async delete(uuObject) {
    if (!uuObject?.oid) {
      throw new Errors.MissingAttributeError("oid");
    }
    return this._internalEnqueueOperation(async () => {
      let { itemMap, indexList } = await this._internalInitDb();
      return this._internalDeleteOne(itemMap, indexList, { oid: uuObject.oid }, uuObject.sys?.rev);
    });
  }

  /**
   * @returns {Promise<CursorIterator>}
   */
  async list() {
    return this._findMany({});
  }

  /**
   * @param {{pageIndex: number, pageSize: number}} pageInfo
   * @returns {Promise<{ itemList: UuObject[], pageInfo: { pageIndex: number, pageSize: number, total: number } }>}
   */
  async listPaged(pageInfo = null) {
    return this._findManyPaged({}, pageInfo);
  }

  // API (protected) for developers of classes inherited from our Dao

  /**
   * Creates a non-unique index. This method can be called only from createSchema() or upgradeSchema() method.
   *
   * @param {object} indexFields Map such as { name: 1, surname: 1 }
   */
  _createIndex(indexFields) {
    this._internalCreateIndex(indexFields, false);
  }

  /**
   * Creates a unique index. This method can be called only from createSchema() or upgradeSchema() method.
   *
   * @param {object} indexFields Map such as { name: 1, surname: 1 }
   */
  _createUniqueIndex(indexFields) {
    this._internalCreateIndex(indexFields, true);
  }

  /**
   * Drops the index by its fields. This method can be called only from createSchema() or upgradeSchema() method.
   *
   * @param {object} indexFields Map such as { name: 1, surname: 1 }.
   */
  _dropIndex(indexFields) {
    let db = dbMap[this._internalGetDbName()];
    if (!db?._creating) {
      throw new Errors.InvalidCallError({
        paramMap: { detail: `dropIndex() can be called only during createSchema()/upgradeSchema().` },
      });
    }

    let { keyPathList } = this._internalToKeyPathData(indexFields);

    // ignore index { oid: 1 } as we handle it as { id: 1 }, i.e. as primary key
    if (keyPathList.every((it, i) => this._internalPrimaryKeyPath[i] === it)) {
      return;
    }

    let indexName = this._internalToIndexName(keyPathList);
    db.indexList = db.indexList.filter((it) => it.name !== indexName);
  }

  /**
   * @param {UuObject} uuObject
   * @returns {UuObject}
   */
  async _insertOne(uuObject /* options = null */) {
    return this._internalEnqueueOperation(async () => {
      let { itemMap, indexList } = await this._internalInitDb();
      return this._internalInsertOne(itemMap, indexList, uuObject);
    });
  }

  /**
   * @param {uuObject[]} uuObjectList
   * @returns {Promise<uuObject[]>}
   */
  async _insertMany(uuObjectList) {
    return this._internalEnqueueOperation(async () => {
      let { itemMap, indexList } = await this._internalInitDb();
      let errorMap = {};
      let itemList = [];
      for (let i = 0; i < uuObjectList.length; i++) {
        let uuObject = uuObjectList[i];
        try {
          itemList.push(this._internalInsertOne(itemMap, indexList, uuObject));
        } catch (e) {
          if (e.name === "ConstraintError") {
            errorMap[i] = new Errors.NotUniqueError(e);
          } else if (!(e instanceof Errors.ObjectStoreError)) {
            errorMap[i] = new Errors.UnexpectedError(e);
          } else {
            errorMap[i] = e;
          }
        }
      }
      // if any insertion fails, we want to not add any of other items, i.e. rollback
      // (and while we're adding them they must know about previously added item for duplicateKey checks)
      if (Object.keys(errorMap).length > 0) {
        itemList.forEach((item) => delete itemMap[this._internalGetValueByPath(item, this._internalPrimaryKeyPath)]);
        throw new Errors.InsertManyFailedError({}, errorMap);
      }
      return itemList;
    });
  }

  /**
   * @param filter {object}
   * @returns {Promise<UuObject?}
   */
  async _findOne(filter /*, options = null*/) {
    return this._internalEnqueueOperation(async () => {
      let { itemMap, indexList } = await this._internalInitDb();
      let { keyPathList, valueList } = this._internalCheckFilter(filter, indexList);
      let potentialItem;
      for (let item of Object.values(itemMap)) {
        if (this._internalMatchesFilter(item, keyPathList, valueList)) {
          if (potentialItem) {
            throw new Errors.AmbiguousQueryError();
          }
          potentialItem = item;
        }
      }
      return potentialItem ? this._internalToUuObject(potentialItem) : null;
    });
  }

  /**
   * @param {object} filter
   * @returns {Promise<CursorIterator>}
   */
  async _findMany(filter /*, options = null*/) {
    return this._internalEnqueueOperation(async () => {
      // NOTE We load it as an array not as a cursor, because we do not expect extremely big data volumes on client and iterating over IndexedDB
      // cursor can be a bit slow (each iteration must fire and wait for separate event, i.e. full JS task). So we just convert the array to appropriate API.
      let { itemMap, indexList } = await this._internalInitDb();
      const { itemList } = this._internalFindManyPaged(itemMap, indexList, filter, {
        pageIndex: 0,
        pageSize: undefined,
      });
      return this._internalAsCursorIterator(itemList);
    });
  }

  /**
   * @param {object} filter
   * @param {Partial<PageInfo>} pageInfo
   * @returns {Promise<{itemList: object[], pageInfo: PageInfo}>}
   */
  async _findManyPaged(filter, pageInfo = {} /*, options = null*/) {
    return this._internalEnqueueOperation(async () => {
      let { itemMap, indexList } = await this._internalInitDb();
      return this._internalFindManyPaged(itemMap, indexList, filter, {
        pageIndex: pageInfo?.pageIndex || 0,
        pageSize: pageInfo?.pageSize || DEFAULT_PAGE_SIZE,
      });
    });
  }

  /**
   * @param filter {object}
   * @returns {Promise<number>}
   */
  async _count(filter /*, options = null*/) {
    let result = await this._findManyPaged(filter, { pageSize: 1 });
    return result.pageInfo.total;
  }

  /**
   * @param {*} filter
   * @param {*} update
   * @returns {Promise<object?>}
   */
  async _updateOne(filter, update /*, options = null*/) {
    return this._internalEnqueueOperation(async () => {
      let { itemMap, indexList } = await this._internalInitDb();
      return this._internalSetOne(itemMap, indexList, filter, update, {
        createIfMissing: false,
        replace: false,
        skipRevision: true,
      });
    });
  }

  /**
   * @param {*} filter
   * @param {*} update
   * @returns {Promise<number>}
   */
  async _updateMany(filter, update /*, options = null*/) {
    return this._internalEnqueueOperation(async () => {
      let db = await this._internalInitDb();
      let { itemMap, indexList } = db;
      let { keyPathList, valueList } = this._internalCheckFilter(filter, indexList);

      let itemMapCopy = { ...itemMap };
      let count = 0;
      for (let [id, item] of Object.entries(itemMap)) {
        if (this._internalMatchesFilter(item, keyPathList, valueList)) {
          let updateValue = {
            ...item,
            ...this._internalToDbRecord(update),
          };
          id = Number(id);

          this._internalCheckDuplicateKeys(itemMapCopy, indexList, updateValue, id);
          let updateValueId = this._internalGetValueByPath(updateValue, this._internalPrimaryKeyPath);
          delete itemMapCopy[id];
          itemMapCopy[updateValueId] = updateValue;
          count++;
        }
      }
      Object.assign(db, { itemMap: itemMapCopy, indexList });
      return count;
    });
  }

  /**
   * @param {*} filter
   * @returns {Promise<boolean>}
   */
  async _deleteOne(filter) {
    return this._internalEnqueueOperation(async () => {
      let { itemMap, indexList } = await this._internalInitDb();
      return this._internalDeleteOne(itemMap, indexList, filter, null);
    });
  }

  /**
   * @param {*} filter
   * @returns {Promise<number>}
   */
  async _deleteMany(filter) {
    return this._internalEnqueueOperation(async () => {
      let { itemMap, indexList } = await this._internalInitDb();
      let { keyPathList, valueList } = this._internalCheckFilter(filter, indexList);

      let count = 0;
      for (let [id, item] of Object.entries(itemMap)) {
        if (this._internalMatchesFilter(item, keyPathList, valueList)) {
          delete itemMap[id];
          count++;
        }
      }
      return count;
    });
  }

  async _runInTransaction(callback) {
    // if we're already running in a transaction then do not start any "nested" transaction,
    // instead just run the callback as a part of outer transaction
    if (this._explicitTransaction) return callback.call(this);

    if (process.env.NODE_ENV !== "production" && isArrowFn(callback)) {
      throw new Errors.InvalidCallError({
        paramMap: {
          detail:
            "The 'callback' parameter used for _runInTransaction() must be a non-arrow function - it is intended to be called with altered 'this' scope.",
        },
      });
    }

    // NOTE Similar as in non-in-memory variant. We just have to additionally handle transaction lock
    // (so that parallel operations outside of our transaction will wait for our whole transaction to end - txLockMap).
    // Ordering/queueing operations within transaction uses another set of locks - lockMap.
    let dbName = this._internalGetDbName();
    while (txLockMap[dbName]) await txLockMap[dbName].unlockPromise;
    let unlock;
    let token = {};
    txLockMap[dbName] = { token, unlockPromise: new Promise((resolve) => (unlock = resolve)) };
    let explicitMemoryDao = Object.create(this, { _explicitTransaction: { value: true }, _txToken: { value: token } });
    let origDaoScope = Object.create(this._internalOrigDao, { _explicitMemoryDao: { get: () => explicitMemoryDao } });
    let result;
    try {
      result = await callback.call(origDaoScope);
    } finally {
      delete txLockMap[dbName];
      unlock();
    }
    // commit changes
    if (explicitMemoryDao._explicitMemoryDbName) {
      if (explicitMemoryDao._explicitMemoryDb) {
        dbMap[explicitMemoryDao._explicitMemoryDbName] = explicitMemoryDao._explicitMemoryDb;
      } else {
        delete dbMap[explicitMemoryDao._explicitMemoryDbName];
      }
    }
    return result;
  }

  // private methods

  _internalDeleteOne(itemMap, indexList, filter, revision) {
    let { itemList } = this._internalFindManyPaged(itemMap, indexList, filter, { pageIndex: 0, pageSize: 2 });
    if (itemList.length >= 2) {
      throw new Errors.AmbiguousQueryError();
    }
    let result = false;
    if (itemList.length === 1) {
      let [item] = itemList;
      let id = this._internalGetValueByPath(item, this._internalPrimaryKeyPath);
      if (id != null) {
        if (revision != null && revision !== item.sys?.rev) {
          throw new Errors.ConcurrentModificationError();
        }
        delete itemMap[id];
        result = true;
      }
    }
    return result;
  }

  _internalCreateIndex(indexFields, unique) {
    let db = dbMap[this._internalGetDbName()];
    if (!db?._creating) {
      throw new Errors.InvalidCallError({
        paramMap: {
          detail: `createIndex() can be called only during createSchema()/upgradeSchema().').`,
        },
      });
    }

    let { keyPathList } = this._internalToKeyPathData(indexFields);

    // ignore index { oid: 1 } as we handle it as { id: 1 }, i.e. as primary key
    if (keyPathList.every((it, i) => this._internalPrimaryKeyPath[i] === it)) {
      return;
    }

    let indexName = this._internalToIndexName(keyPathList);
    db.indexList.push({ name: indexName, unique });
  }

  _internalFindManyPaged(itemMap, indexList, filter, pageInfo) {
    let itemList = [];
    let resultPageInfo = { ...pageInfo };
    let total = 0;
    let min = resultPageInfo.pageIndex * (resultPageInfo.pageSize || 0);
    let max = min + (resultPageInfo.pageSize || Infinity);
    let { keyPathList, valueList } = this._internalCheckFilter(filter, indexList);
    for (let item of Object.values(itemMap)) {
      if (this._internalMatchesFilter(item, keyPathList, valueList)) {
        if (min <= total && total < max) itemList.push(this._internalToUuObject(item));
        total++;
      }
    }
    resultPageInfo.total = total;
    return { itemList, pageInfo: resultPageInfo };
  }

  _internalSetOneUuObject(itemMap, indexList, uuObject, opts) {
    if (!uuObject?.oid && !opts?.createIfMissing) {
      throw new Errors.MissingAttributeError("oid");
    }
    let result = this._internalSetOne(itemMap, indexList, { oid: uuObject.oid }, uuObject, opts);
    if (!result) {
      throw new Errors.ConcurrentModificationError();
    }
    return result;
  }

  _internalSetOne(itemMap, indexList, filter, update, { createIfMissing, replace, skipRevision } = {}) {
    let { keyPathList, valueList } = this._internalCheckFilter(filter, indexList);

    let commit;
    for (let [id, item] of Object.entries(itemMap)) {
      if (this._internalMatchesFilter(item, keyPathList, valueList)) {
        if (commit) {
          throw new Errors.AmbiguousQueryError();
        }

        // NOTE "sys" object & revision changes are done always, regardless of revisionStrategy (the strategy
        // just turns on checking of whether the object-to-save has required revision before saving).
        if (!skipRevision && update.sys?.rev != null && update.sys.rev !== item?.sys?.rev) {
          throw new Errors.ConcurrentModificationError();
        }
        let updateValue = {
          ...(replace ? undefined : item),
          ...this._internalToDbRecord(update),
          ...(!skipRevision ? { sys: { ...item.sys, mts: new Date(), rev: item.sys.rev + 1 } } : undefined),
        };
        id = Number(id);

        if (replace) {
          let obj = updateValue;
          for (let i = 0; i < this._internalPrimaryKeyPath.length - 1; i++) {
            let field = this._internalPrimaryKeyPath[i];
            if (!obj[field]) obj[field] = {};
            obj = obj[field];
          }
          let lastField = this._internalPrimaryKeyPath[this._internalPrimaryKeyPath.length - 1];
          if (obj[lastField] === undefined) obj[lastField] = id;
        }
        this._internalCheckDuplicateKeys(itemMap, indexList, updateValue, id);
        let updateValueId = this._internalGetValueByPath(updateValue, this._internalPrimaryKeyPath);
        commit = () => {
          delete itemMap[id];
          itemMap[updateValueId] = updateValue;
          return this._internalToUuObject(updateValue);
        };
      }
    }
    let result = commit?.();
    if (!result && createIfMissing) {
      result = this._internalInsertOne(itemMap, indexList, update);
    } else {
      result ??= null;
    }
    return result;
  }

  _internalInsertOne(itemMap, indexList, uuObject) {
    let dbRecord = this._internalToDbRecord(uuObject);
    this._internalCheckDuplicateKeys(itemMap, indexList, dbRecord);
    let id = this._internalGetValueByPath(dbRecord, this._internalPrimaryKeyPath);
    id = typeof id === "number" ? id : this._internalIdCounter++;
    this._internalIdCounter = Math.max(id + 1, this._internalIdCounter);
    let item = { ...dbRecord, sys: this._internalCreateSys(), id };
    itemMap[item.id] = item;
    return this._internalToUuObject(item);
  }

  _internalGetDbName() {
    let appBasePath = new URL(appBaseUri).pathname.replace(/^\//, "");
    let uuIdentity = sessionHolder.session?.identity?.uuIdentity || "";
    let dbName = appBasePath + "#" + this._internalSchemaName + (uuIdentity ? "#" + uuIdentity : "");
    return dbName;
  }

  _internalCheckFilter(filter, indexList) {
    let { keyPathList, valueList } = this._internalToKeyPathData(filter);
    this._internalCheckIndexPresent(keyPathList, indexList);
    return { keyPathList, valueList };
  }

  _internalMatchesFilter(item, filterKeyPathList, filterValueList) {
    if (filterKeyPathList.length === 0) return true;

    for (let i = 0; i < filterKeyPathList.length; i++) {
      let k = filterKeyPathList[i];
      let v = filterValueList[i];
      if (v === undefined) continue;
      let itemValue = this._internalGetValueByPath(item, k.split(INDEX_SUBKEY_FIELD_SEPARATOR));
      if (itemValue !== v) return false;
    }

    return true;
  }

  _internalToKeyPathData(obj) {
    let keyPathList = [];
    let valueList = [];
    let idOidIndex;
    if (obj && typeof obj === "object") {
      for (let [key, value] of Object.entries(obj)) {
        if (key === "oid") {
          key = "id";
          value = value == null ? value : Number(value);
        }
        // if somebody is using filter such as { id: 10, oid: "10" } or { oid: "10" } then make it work as if it was simply { id: 10 }
        // (we handle oid as transient attribute)
        if (key === "id") {
          if (idOidIndex === undefined) {
            idOidIndex = valueList.length;
          } else if (value !== valueList[idOidIndex]) {
            throw new Errors.InvalidCallError({
              paramMap: {
                detail:
                  "Cannot have 'id' different from 'oid' in this DAO implementation ('oid' is always stringified 'id').",
                value: obj,
              },
            });
          } else {
            continue; // do not add again
          }
        }
        keyPathList.push(key);
        valueList.push(value);
      }
    }

    return { keyPathList, valueList };
  }

  _internalToIndexName(keyPathList) {
    return keyPathList.join(INDEX_SUBKEY_SEPARATOR);
  }

  _internalGetValueByPath(obj, path) {
    let result = obj;
    for (let i = 0; i < path.length && result !== undefined; i++) {
      result = result?.[path[i]];
    }
    return result;
  }

  _internalCreateSys(date = new Date()) {
    return { cts: date, mts: date, rev: 0 };
  }

  _internalToUuObject(dbRecord) {
    let uuObject;
    if (dbRecord?.id !== undefined) uuObject = { ...dbRecord, oid: dbRecord.id + "" };
    else uuObject = dbRecord;
    return uuObject;
  }

  _internalToDbRecord(uuObject) {
    if (!uuObject) return uuObject;
    let { oid, id, ...dbRecord } = uuObject;
    if (id !== undefined && oid !== undefined && ((id === null && oid !== null) || (id !== null && oid !== id + ""))) {
      throw new Errors.InvalidCallError({
        paramMap: {
          detail:
            "Cannot have 'id' different from 'oid' in this DAO implementation ('oid' is always stringified 'id').",
          value: uuObject,
        },
      });
    }
    if (id !== undefined || oid !== undefined) {
      dbRecord.id = id !== undefined ? id : oid != null ? Number(oid) : oid;
    }
    return dbRecord;
  }

  _internalAsCursorIterator(list) {
    let index = -1;
    let result = list;
    Object.defineProperties(result, {
      hasNext: {
        enumerable: false,
        configurable: true,
        value: () => index < list.length - 1,
      },
      next: {
        enumerable: false,
        configurable: true,
        value: async () => list[++index],
      },
      close: {
        enumerable: false,
        configurable: true,
        value: async () => {},
      },
    });
    return result;
  }

  _internalCheckIndexPresent(keyPathList, indexList) {
    if (keyPathList?.length > 0) {
      let indexToUse;
      if (this._internalToIndexName(keyPathList) === this._internalPrimaryKey) {
        indexToUse = this._internalPrimaryKey;
      } else {
        let necessaryKeySet = new Set(keyPathList);
        let usableIndexList = [];
        for (let indexItem of indexList) {
          let index = indexItem.name;
          let remainingKeySet = new Set(necessaryKeySet);
          for (let key of index.split(INDEX_SUBKEY_SEPARATOR, necessaryKeySet.size)) remainingKeySet.delete(key);
          if (remainingKeySet.size === 0) usableIndexList.push(indexItem);
        }
        // prefer unique indices, then it doesn't matter much, e.g. take shortest
        usableIndexList.sort(
          (a, b) =>
            (a.unique ? 0 : 1) - (b.unique ? 0 : 1) || a.name.length - b.name.length || a.name.localeCompare(b.name),
        );
        indexToUse = usableIndexList[0]?.name;
      }
      if (!indexToUse) {
        let suggestedIndex = {};
        for (let subkey of keyPathList) suggestedIndex[subkey] = 1;
        throw new Errors.InvalidCallError({
          paramMap: {
            detail: `Filtering can be used only if there exists an index that covers all filtered fields (1st N fields of index must be same as the fields used in filter) - either remove fields from filter or create the index e.g.: ${JSON.stringify(suggestedIndex)}.`,
          },
        });
      }
    }
  }

  _internalCheckDuplicateKeys(itemMap, indexList, uuObject, skipCheckOnItemWithId = undefined) {
    let id = this._internalGetValueByPath(uuObject, this._internalPrimaryKeyPath);
    // check primary key
    if (id != null && id in itemMap && id !== skipCheckOnItemWithId) {
      throw new Errors.NotUniqueError();
    }
    // check other unique indices too
    for (let { name, unique } of indexList) {
      if (!unique) continue;
      let fieldList = name.split(INDEX_SUBKEY_SEPARATOR);
      let fieldPaths = fieldList.map((field) => field.split(INDEX_SUBKEY_FIELD_SEPARATOR));
      let uuObjectFieldValues = [];
      for (let fieldPath of fieldPaths) uuObjectFieldValues.push(this._internalGetValueByPath(uuObject, fieldPath));
      for (let itemId in itemMap) {
        itemId = Number(itemId);
        if (itemId === skipCheckOnItemWithId || itemId === id) continue;
        let item = itemMap[itemId];
        let ok;
        for (let i = 0; i < fieldPaths.length; i++) {
          let fieldValue = this._internalGetValueByPath(item, fieldPaths[i]);
          if (fieldValue !== uuObjectFieldValues[i]) {
            ok = true;
            break;
          }
        }
        if (!ok) {
          throw new Errors.NotUniqueError();
        }
      }
    }
  }

  async _internalEnqueueOperation(callback) {
    let dbName = this._internalGetDbName();
    while (txLockMap[dbName] && txLockMap[dbName].token !== this._txToken) {
      await txLockMap[dbName].unlockPromise;
    }
    do {
      await lockMap[dbName];
    } while (lockMap[dbName]);
    let unlock;
    lockMap[dbName] = new Promise((resolve) => (unlock = resolve));
    try {
      // acquired DB lock => do the operation
      return await callback.call(this);
    } finally {
      delete lockMap[dbName];
      unlock();
    }
  }

  async _internalInitDb() {
    let dbName = this._explicitMemoryDbName || this._internalGetDbName();
    let db = this._explicitMemoryDb !== undefined ? this._explicitMemoryDb : dbMap[dbName];
    if (!db) {
      dbMap[dbName] = db = { itemMap: {}, indexList: [], name: dbName };
      db._creating = true;
      try {
        await this._internalOrigDao.createSchema?.();
      } finally {
        delete db._creating;
      }
    }
    if (this._explicitTransaction && !this._explicitMemoryDb) {
      this._explicitLock = {};
      this._explicitMemoryDbName = dbName;
      db = this._explicitMemoryDb = { ...db, itemMap: { ...db.itemMap }, indexList: [...db.indexList] }; // copy
    }
    return db;
  }
}

// development check in case that we change API in Uu5ObjectStore.Dao but forget to update it here
if (process.env.NODE_ENV !== "production") {
  for (let property of Object.getOwnPropertyNames(Dao.prototype)) {
    if (property === "constructor" || property.startsWith("_")) continue;
    if (DaoInMemory.prototype[property] === undefined) {
      throw new Error(
        "Invalid implementation - Uu5ObjectStoreDaoInMemory has missing property/method (vs. Uu5ObjectStore.Dao impl.): " +
          property,
      );
    }
  }
}

// dbMap exported for tests only
export { DaoInMemory, dbMap };
export default DaoInMemory;
