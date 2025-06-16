import { sessionHolder } from "../providers/session-provider.js";
import { appBaseUri } from "../uu5-environment.js";
import Dao, {
  DEFAULT_PAGE_SIZE,
  INDEX_SUBKEY_FIELD_SEPARATOR,
  INDEX_SUBKEY_SEPARATOR,
  PRIMARY_KEY_PATH,
  REVISION_STRATEGY,
} from "./object-store-dao.js";
import ObjectStoreError from "./object-store-error.js";

let dbMap = {};

class DaoInMemory {
  #schemaName;
  #primaryKeyPath;
  #primaryKey;
  #origDao;
  #idCounter = 0;

  constructor(schemaName, { schemaVersion = 1, schemaMaxAge, origDao } = {}) {
    this.#schemaName = schemaName;
    this.#primaryKeyPath = PRIMARY_KEY_PATH;
    this.#primaryKey = this.#primaryKeyPath.join(INDEX_SUBKEY_FIELD_SEPARATOR);
    this.#origDao = origDao;
    // NOTE schemaMaxAge is not handled - data will disappear after page is reloaded.
  }

  async #initDb() {
    let db = dbMap[this.#getDbName()];
    if (db) await db.initPromise;
    if (!db) {
      dbMap[this.#getDbName()] = db = { itemMap: {}, indexList: [] };
      db.initPromise = (async () => {
        await 0; // this ensures that db.initPromise is available after this line
        await this.#origDao.createSchema?.();
        db.initPromise = undefined;
      })();
      await db.initPromise;
    }
    return db;
  }

  createIndex(indexFields, { unique = false } = {}) {
    let db = dbMap[this.#getDbName()];
    if (!db?.initPromise) {
      throw new ObjectStoreError.InvalidCall({
        paramMap: {
          detail: `createIndex() can be called only during createSchema()/updateSchema().').`,
        },
      });
    }

    let { keyPathList } = this.#toKeyPathData(indexFields);
    let indexName = this.#toIndexName(keyPathList);
    db.indexList.push({ name: indexName, unique });
  }

  dropIndex(indexFieldsOrName) {
    let db = dbMap[this.#getDbName()];
    if (!db?.initPromise) {
      throw new ObjectStoreError.InvalidCall({
        paramMap: { detail: `dropIndex() can be called only during createSchema()/updateSchema().` },
      });
    }

    let indexName = indexFieldsOrName;
    if (typeof indexName !== "string") {
      let { keyPathList } = this.#toKeyPathData(indexName);
      indexName = this.#toIndexName(keyPathList);
    }
    db.indexList = db.indexList.filter((it) => it.name !== indexName);
  }

  async getIndexes() {
    let { indexList } = await this.#initDb();
    return {
      itemList: indexList
        .map((it) => ({
          ...it,
          key: it.name.split(INDEX_SUBKEY_SEPARATOR).reduce((r, it) => ((r[it] = 1), r), {}),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  }

  async dropSchema() {
    await this.#initDb();
    delete dbMap[this.#getDbName()];
  }

  async findOne(filter) {
    let { itemMap, indexList } = await this.#initDb();
    for (let item of Object.values(itemMap)) {
      if (this.#matchesFilter(item, filter, indexList)) return item;
    }
    return null;
  }

  async find(filter, pageInfo = {}) {
    let itemList = [];
    let { itemMap, indexList } = await this.#initDb();
    let resultPageInfo = {
      pageIndex: pageInfo?.pageIndex || 0,
      pageSize: pageInfo?.pageSize || DEFAULT_PAGE_SIZE,
      total: 0,
    };
    let total = 0;
    let min = resultPageInfo.pageIndex * resultPageInfo.pageSize;
    let max = min + resultPageInfo.pageSize;
    for (let item of Object.values(itemMap)) {
      if (this.#matchesFilter(item, filter, indexList)) {
        if (min <= total && total < max) itemList.push(item);
        total++;
      }
    }
    resultPageInfo.total = total;
    return { itemList, pageInfo: resultPageInfo };
  }

  async count(filter) {
    let result = await this.find(filter);
    return result.pageInfo.total;
  }

  async closeDB() {
    await this.#initDb();
  }

  async insertOne(uuObject) {
    let { itemMap, indexList } = await this.#initDb();
    return this.#insertOne(itemMap, indexList, uuObject);
  }

  #insertOne(itemMap, indexList, uuObject, collectList = undefined) {
    this.#checkDuplicateKeys(itemMap, indexList, uuObject);
    let id = this.#getValueByPath(uuObject, this.#primaryKeyPath);
    id = typeof id === "number" ? id : this.#idCounter++;
    this.#idCounter = Math.max(id + 1, this.#idCounter);
    let item = { ...uuObject, sys: this.#createSys(), id };
    let add = () => (itemMap[item.id] = item);
    if (collectList) collectList.push(add);
    else add();
    return item;
  }

  async insertMany(uuObjectList) {
    let { itemMap, indexList } = await this.#initDb();
    let error;
    let itemList = [];
    for (let uuObject of uuObjectList) {
      try {
        itemList.push(this.#insertOne(itemMap, indexList, uuObject));
      } catch (e) {
        error ??= e;
      }
    }
    // if any insertion fails, we want to not add any of other items, i.e. rollback
    // (and while we're adding them they must know about previously added item for duplicateKey checks)
    if (error) {
      itemList.forEach((item) => delete itemMap[this.#getValueByPath(item, this.#primaryKeyPath)]);
      throw error;
    }
    return itemList;
  }

  async deleteOne(filter) {
    let { itemMap } = await this.#initDb();
    let item = await this.findOne(filter);
    if (item) {
      let id = this.#getValueByPath(item, this.#primaryKeyPath);
      if (id != null) delete itemMap[id];
    }
  }

  async deleteMany(filter) {
    let { itemMap, indexList } = await this.#initDb();
    for (let [id, item] of Object.entries(itemMap)) {
      if (this.#matchesFilter(item, filter, indexList)) {
        delete itemMap[id];
      }
    }
  }

  async findOneAndUpdate(filter, uuObject, revisionStrategy = REVISION_STRATEGY.REVISION) {
    return this.#setOne(filter, uuObject, revisionStrategy, { createIfMissing: false, mergeIdOnly: false });
  }

  async insertOrUpdateOne(filter, uuObject) {
    return this.#setOne(filter, uuObject, null, { createIfMissing: true, mergeIdOnly: true });
  }

  async #setOne(filter, uuObject, revisionStrategy, { createIfMissing, mergeIdOnly } = {}) {
    if (revisionStrategy === REVISION_STRATEGY.REVISION && typeof uuObject?.sys?.rev !== "number") {
      throw new ObjectStoreError.MissingRevision();
    }
    let { itemMap, indexList } = await this.#initDb();
    for (let [id, item] of Object.entries(itemMap)) {
      if (this.#matchesFilter(item, filter, indexList)) {
        // NOTE "sys" object & revision changes are done always, regardless of revisionStrategy (the strategy
        // just turns on checking of whether the object-to-save has required revision before saving).
        if (revisionStrategy === REVISION_STRATEGY.REVISION && uuObject.sys.rev !== item?.sys?.rev) {
          throw new ObjectStoreError.InvalidRevision();
        }
        let updateValue = {
          ...(mergeIdOnly ? undefined : item),
          ...uuObject,
          sys: { ...item.sys, mts: new Date(), rev: item.sys.rev + 1 },
        };
        id = Number(id);

        if (mergeIdOnly) {
          let obj = updateValue;
          for (let i = 0; i < this.#primaryKeyPath.length - 1; i++) {
            let field = this.#primaryKeyPath[i];
            if (!obj[field]) obj[field] = {};
            obj = obj[field];
          }
          let lastField = this.#primaryKeyPath[this.#primaryKeyPath.length - 1];
          if (obj[lastField] === undefined) obj[lastField] = id;
        }
        this.#checkDuplicateKeys(itemMap, indexList, updateValue, id);
        let updateValueId = this.#getValueByPath(updateValue, this.#primaryKeyPath);
        delete itemMap[id];
        itemMap[updateValueId] = updateValue;
        return updateValue;
      }
    }
    if (createIfMissing) {
      return this.#insertOne(itemMap, indexList, uuObject);
    } else {
      throw new ObjectStoreError.ObjectNotFound({ paramMap: { filter } });
    }
  }

  #getDbName() {
    let appBasePath = new URL(appBaseUri).pathname.replace(/^\//, "");
    let uuIdentity = sessionHolder.session?.identity?.uuIdentity || "";
    let dbName = appBasePath + "#" + this.#schemaName + (uuIdentity ? "#" + uuIdentity : "");
    return dbName;
  }

  #matchesFilter(item, filter, indexList) {
    this.#checkIndexPresent(filter, indexList);
    if (!filter || typeof filter !== "object") return true;
    for (let [k, v] of Object.entries(filter)) {
      if (v === undefined) continue;
      let itemValue = this.#getValueByPath(item, k.split(INDEX_SUBKEY_FIELD_SEPARATOR));
      if (itemValue !== v) return false;
    }
    return true;
  }

  #getValueByPath(obj, path) {
    let result = obj;
    for (let i = 0; i < path.length && result !== undefined; i++) {
      result = result?.[path[i]];
    }
    return result;
  }

  #createSys(date = new Date()) {
    return { cts: date, mts: date, rev: 0 };
  }

  #checkIndexPresent(filter, indexList) {
    let { keyPathList } = this.#toKeyPathData(filter);
    if (keyPathList?.length > 0) {
      let indexToUse;
      if (this.#toIndexName(keyPathList) === this.#primaryKey) {
        indexToUse = this.#primaryKey;
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
        throw new ObjectStoreError.InvalidCall({
          paramMap: {
            detail: `Filtering can be used only if there exists an index that covers all filtered fields (1st N fields of index must be same as the fields used in filter) - either remove fields from filter or create the index e.g.: ${JSON.stringify(suggestedIndex)}.`,
          },
        });
      }
    }
  }

  #toKeyPathData(obj, keyPathList = [], valueList = [], currentPath = []) {
    return {
      keyPathList: obj && typeof obj === "object" ? Object.keys(obj).filter((key) => obj[key] !== undefined) : [],
      valueList: obj && typeof obj === "object" ? Object.values(obj).filter((value) => value !== undefined) : [],
    };
  }

  #toIndexName(keyPathList) {
    return keyPathList.join(INDEX_SUBKEY_SEPARATOR);
  }

  #checkDuplicateKeys(itemMap, indexList, uuObject, skipCheckOnItemWithId = undefined) {
    let id = this.#getValueByPath(uuObject, this.#primaryKeyPath);
    // check primary key
    if (id != null && id in itemMap && id !== skipCheckOnItemWithId) {
      throw new ObjectStoreError.DuplicateKey({
        paramMap: { key: this.#primaryKey, value: id },
      });
    }
    // check other unique indices too
    for (let { name, unique } of indexList) {
      if (!unique) continue;
      let fieldList = name.split(INDEX_SUBKEY_SEPARATOR);
      let fieldPaths = fieldList.map((field) => field.split(INDEX_SUBKEY_FIELD_SEPARATOR));
      let uuObjectFieldValues = [];
      for (let fieldPath of fieldPaths) uuObjectFieldValues.push(this.#getValueByPath(uuObject, fieldPath));
      for (let itemId in itemMap) {
        itemId = Number(itemId);
        if (itemId === skipCheckOnItemWithId || itemId === id) continue;
        let item = itemMap[itemId];
        let ok;
        for (let i = 0; i < fieldPaths.length; i++) {
          let fieldValue = this.#getValueByPath(item, fieldPaths[i]);
          if (fieldValue !== uuObjectFieldValues[i]) {
            ok = true;
            break;
          }
        }
        if (!ok) {
          throw new ObjectStoreError.DuplicateKey({
            paramMap: {
              key: fieldList.reduce((r, it) => ((r[it] = 1), r), {}),
              value: uuObjectFieldValues.reduce((r, it, i) => ((r[fieldList[i]] = it), r), {}),
            },
          });
        }
      }
    }
  }
}

// development check in case that we change API in ObjectStore.Dao but forget to update it here
if (process.env.NODE_ENV !== "production") {
  for (let property of Object.getOwnPropertyNames(Dao.prototype)) {
    if (property === "constructor" || property.startsWith("_")) continue;
    if (DaoInMemory.prototype[property] === undefined) {
      throw new Error(
        "Invalid implementation - ObjectStoreDaoInMemory has missing property/method (vs. ObjectStore.Dao impl.): " +
          property,
      );
    }
  }
}

// dbMap exported for tests only
export { DaoInMemory, dbMap };
export default DaoInMemory;
