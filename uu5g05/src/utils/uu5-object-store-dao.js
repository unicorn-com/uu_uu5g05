import { appBaseUri } from "../uu5-environment.js";
import Config from "../config/config.js";
import LoggerFactory from "./logger-factory.js";
import Errors from "./uu5-object-store-errors.js";
import Uu5Loader from "./uu5-loader.js";
import { sessionHolder } from "../providers/session-provider.js";
import EventManager from "./event-manager.js";

// !!! If adding/changing API methods, be sure to add/change them in object-store-dao-in-memory.js too.

/**
 * @typedef {{ oid: string, id: number, sys: { cts: Date, mts: Date, rev: number } }} UuObject
 */
/**
 * @typedef {AsyncIterable & { hasNext: () => boolean, next: () => Promise<UuObject>, close: () => Promise<void> } } CursorIterator
 */

const INDEX_SUBKEY_FIELD_SEPARATOR = ".";
const INDEX_SUBKEY_SEPARATOR = ",";
const PRIMARY_KEY_PATH = ["id"];
const DEFAULT_PAGE_SIZE = 100;
const REVISION_STRATEGY = {
  NONE: null,
  REVISION: "REVISION",
};

const DAO_USAGE_DB_NAME = "uu5ObjectStore";
const DAO_USAGE_SCHEMA_NAME = "schema";
const DAO_USAGE_SCHEMA_VERSION = 1;

let logger;
function getLogger() {
  if (!logger) logger = LoggerFactory.get(Config.TAG + "Uu5ObjectStore.Dao");
  return logger;
}

function isArrowFn(fn) {
  if (typeof fn === "function") {
    let string = fn.toString();
    return !/^(async\s+)?function/.test(string);
  }
  return false;
}

let didSchemaMaxAgeCleanup;

// !!! Declare async methods using "async" keyword, do not just return Promise (so that object-store-dao-with-memory-fallback.js works correctly).
class Dao {
  constructor(schemaName, { schemaVersion = 1, schemaMaxAge = 30 * 24 * 60 * 60 * 1000 } = {}) {
    // NOTE Currently cannot use private fields - see comment in _runInTransaction().
    this._internalSchemaName = schemaName;
    // NOTE Exceeding schemaMaxAge makes schema subject to deletion, but it's not strictly enforced, i.e. if user
    // does something with schema, then does nothing for several months and logs in again, the first schema access
    // will find the schema old data (we do not do schemaMaxAge check before each DB access to not slow it down).
    // Our schema will, however, get deleted if user does during those months anything with any other schema (because
    // cleanup checks go over all schemas).
    this._internalSchemaMaxAge = schemaMaxAge;
    this._internalDbVersion = schemaVersion;

    this._internalPrimaryKeyPath = PRIMARY_KEY_PATH;
    this._internalPrimaryKey = this._internalPrimaryKeyPath.join(INDEX_SUBKEY_FIELD_SEPARATOR);
    this._internalAutoIncrement = true;

    /** @type {Promise<IDBDatabase>} */
    this._internalDbPromise = undefined;
    /** @type {IDBTransaction} */
    this._internalUpgradeTransaction = undefined;

    if (schemaVersion !== 1 && typeof this.upgradeSchema !== "function") {
      getLogger().error(
        `DAO for schema '${this._internalSchemaName}' uses schemaVersion > 1 but it does not provide 'upgradeSchema' function for migrating schema indices/data from older version to this newer version, which is most likely a bug.`,
      );
    }
  }

  // API for consumers

  // createSchema() {}
  // upgradeSchema({ oldVersion }) {}

  async dropSchema() {
    try {
      await this._internalWaitForRequest(window.indexedDB.deleteDatabase(this._internalGetDbName()));
    } catch (e) {
      throw new Errors.UnexpectedError(e);
    }
  }

  async close() {
    return this._internalClose();
  }

  getSchemaName() {
    return this._internalSchemaName;
  }

  /**
   * @returns {Promise<UuObject>}
   */
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
    return this._internalSetOneUuObject(uuObject, { createIfMissing: false, replace: false });
  }

  /**
   * @param {UuObject[]} uuObjectList
   * @returns {Promise<UuObject[]>}
   */
  async updateMany(uuObjectList) {
    let transaction;
    try {
      transaction = await this._internalInitTransaction("readwrite");
      let errorMap = {};
      let itemList = await Promise.all(
        uuObjectList.map(async (uuObject, i) => {
          try {
            return await this._internalSetOneUuObject(uuObject, {
              createIfMissing: false,
              replace: false,
              transaction,
            });
          } catch (e) {
            errorMap[i] = e;
          }
        }),
      );

      if (Object.keys(errorMap).length > 0) {
        throw new Errors.UpdateManyFailedError({}, errorMap);
      }
      return itemList;
    } catch (e) {
      try {
        if (transaction && !transaction.error) transaction.abort();
      } catch (e) {
        // ignore
      }
      if (e instanceof Errors.ObjectStoreError) {
        throw e;
      }
      throw new Errors.UnexpectedError(e);
    }
  }

  /**
   * @param {UuObject} uuObject
   * @returns {Promise<UuObject>}
   */
  async replace(uuObject) {
    return this._internalSetOneUuObject(uuObject, { createIfMissing: false, replace: true });
  }

  /**
   * @param {UuObject[]} uuObjectList
   * @returns {Promise<UuObject[]>}
   */
  async replaceMany(uuObjectList) {
    let transaction;
    try {
      transaction = await this._internalInitTransaction("readwrite");
      let errorMap = {};
      let itemList = await Promise.all(
        uuObjectList.map(async (uuObject, i) => {
          try {
            return await this._internalSetOneUuObject(uuObject, { createIfMissing: false, replace: true, transaction });
          } catch (e) {
            errorMap[i] = e;
          }
        }),
      );

      if (Object.keys(errorMap).length > 0) {
        throw new Errors.ReplaceManyFailedError({}, errorMap);
      }
      return itemList;
    } catch (e) {
      try {
        if (transaction && !transaction.error) transaction.abort();
      } catch (e) {
        // ignore
      }
      if (e instanceof Errors.ObjectStoreError) {
        throw e;
      }
      throw new Errors.UnexpectedError(e);
    }
  }

  /**
   * @param {UuObject} uuObject
   * @returns {Promise<boolean>}
   */
  async delete(uuObject) {
    if (!uuObject?.oid) {
      throw new Errors.MissingAttributeError("oid");
    }
    return await this._internalDeleteOne({ oid: uuObject.oid }, uuObject.sys?.rev);
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
    this._internalCreateIndex(indexFields);
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
    if (!this._internalUpgradeTransaction) {
      throw new Errors.InvalidCallError({
        paramMap: { detail: `_dropIndex() can be called only during createSchema()/upgradeSchema().` },
      });
    }

    let { keyPathList } = this._internalToKeyPathData(indexFields);

    // ignore index { oid: 1 } as we handle it as { id: 1 }, i.e. as primary key
    if (keyPathList.every((it, i) => this._internalPrimaryKeyPath[i] === it)) {
      return;
    }

    let indexName = this._internalToIndexName(keyPathList);
    try {
      this._internalUpgradeTransaction.objectStore(this._internalSchemaName).deleteIndex(indexName);
    } catch (e) {
      throw new Errors.UnexpectedError(e);
    }
  }

  /**
   * @param {UuObject} uuObject
   * @returns {UuObject}
   */
  async _insertOne(uuObject /* options = null */) {
    let transaction;
    try {
      // handles sys attributes
      transaction = await this._internalInitTransaction("readwrite");
      let objectStore = transaction.objectStore(this._internalSchemaName);
      let key;
      try {
        let sys = this._internalCreateSys();
        let request = objectStore.add({ ...this._internalToDbRecord(uuObject), sys });
        key = await this._internalWaitForRequest(request);
      } catch (e) {
        if (e.name === "ConstraintError") {
          throw new Errors.NotUniqueError(e);
        }
        throw e;
      }
      return this._internalToUuObject(await this._internalWaitForRequest(objectStore.get(key)));
    } catch (e) {
      try {
        if (transaction && !transaction.error) transaction.abort();
      } catch (e) {
        // ignore
      }
      if (e instanceof Errors.ObjectStoreError) {
        throw e;
      }
      throw new Errors.UnexpectedError(e);
    }
  }

  /**
   * @param {uuObject[]} uuObjectList
   * @returns {Promise<uuObject[]>}
   */
  async _insertMany(uuObjectList) {
    // handles sys attributes
    let transaction;
    try {
      transaction = await this._internalInitTransaction("readwrite");
      let errorMap = {};
      let objectStore = transaction.objectStore(this._internalSchemaName);
      let sys = this._internalCreateSys();
      let insertedList = await Promise.all(
        uuObjectList.map(async (uuObject, i) => {
          try {
            let request = objectStore.add({ ...this._internalToDbRecord(uuObject), sys });
            let key = await this._internalWaitForRequest(request);
            return this._internalToUuObject(await this._internalWaitForRequest(objectStore.get(key)));
          } catch (e) {
            if (e.name === "ConstraintError") {
              errorMap[i] = new Errors.NotUniqueError(e);
            } else if (!(e instanceof Errors.ObjectStoreError)) {
              errorMap[i] = new Errors.UnexpectedError(e);
            } else {
              errorMap[i] = e;
            }
          }
        }),
      );

      if (Object.keys(errorMap).length > 0) {
        throw new Errors.InsertManyFailedError({}, errorMap);
      }
      return insertedList;
    } catch (e) {
      try {
        if (transaction && !transaction.error) transaction.abort();
      } catch (e) {
        // ignore
      }
      if (e instanceof Errors.ObjectStoreError) {
        throw e;
      }
      throw new Errors.UnexpectedError(e);
    }
  }

  /**
   * @param filter {object}
   * @returns {Promise<UuObject?}
   */
  async _findOne(filter /*, options = null*/) {
    try {
      let transaction = await this._internalInitTransaction("readonly");
      // { name: "A", surname: "B" } => use index `name_surname` (keyPathList is ["name", "surname"]) and query ["A", "B"]
      let { keyPathList, valueList } = this._internalToKeyPathData(filter);
      let objectStore = transaction.objectStore(this._internalSchemaName);
      let { queriable, query } = this._internalToQueriable(objectStore, keyPathList, valueList);
      let request = queriable.getAll(query, 2);
      let list = await this._internalWaitForRequest(request);
      if (list.length > 1) {
        throw new Errors.AmbiguousQueryError();
      }
      let value = this._internalToUuObject(list[0]);
      return value ?? null;
    } catch (e) {
      if (e instanceof Errors.ObjectStoreError) {
        throw e;
      }
      throw new Errors.UnexpectedError(e);
    }
  }

  /**
   * @param {object} filter
   * @returns {Promise<CursorIterator>}
   */
  async _findMany(filter /*, options = null*/) {
    // NOTE We load it as an array not as a cursor, because we do not expect extremely big data volumes on client and iterating over IndexedDB
    // cursor can be a bit slow (each iteration must fire and wait for separate event, i.e. full JS task). So we just convert the array to appropriate API.
    const { itemList } = await this._internalFindManyPaged(filter, {
      pageIndex: 0,
      pageSize: undefined,
    });
    return this._internalAsCursorIterator(itemList);
  }

  /**
   * @param {object} filter
   * @param {Partial<PageInfo>} pageInfo
   * @returns {Promise<{itemList: object[], pageInfo: PageInfo}>}
   */
  async _findManyPaged(filter, pageInfo = {} /*, options = null*/) {
    return this._internalFindManyPaged(filter, {
      pageIndex: pageInfo?.pageIndex || 0,
      pageSize: pageInfo?.pageSize || DEFAULT_PAGE_SIZE,
    });
  }

  /**
   * @param filter {object}
   * @returns {Promise<number>}
   */
  async _count(filter /*, options = null*/) {
    try {
      let { keyPathList, valueList } = this._internalToKeyPathData(filter);
      let transaction = await this._internalInitTransaction("readonly");
      let objectStore = transaction.objectStore(this._internalSchemaName);
      let { queriable, query } = this._internalToQueriable(objectStore, keyPathList, valueList);
      let request = queriable.count(query);
      let count = await this._internalWaitForRequest(request);
      return count;
    } catch (e) {
      if (e instanceof Errors.ObjectStoreError) {
        throw e;
      }
      throw new Errors.UnexpectedError(e);
    }
  }

  /**
   * @param {*} filter
   * @param {*} update
   * @returns {Promise<object?>}
   */
  async _updateOne(filter, update /*, options = null*/) {
    return this._internalSetOne(filter, update, { createIfMissing: false, replace: false, skipRevision: true });
  }

  /**
   * @param {*} filter
   * @param {*} update
   * @returns {Promise<number>}
   */
  async _updateMany(filter, update /*, options = null*/) {
    let transaction;
    try {
      transaction = await this._internalInitTransaction("readwrite");
      let objectStore = transaction.objectStore(this._internalSchemaName);
      let { keyPathList, valueList } = this._internalToKeyPathData(filter);
      let { queriable, query } = this._internalToQueriable(objectStore, keyPathList, valueList);
      let waitList = [];
      let request = queriable.openCursor(query);
      await this._internalWaitForCursor(request, (cursor) => {
        if (!cursor) return false; // nothing more to process
        let updateValue = {
          ...cursor.value,
          ...this._internalToDbRecord(update),
        };
        waitList.push(
          this._internalWaitForRequest(cursor.update(updateValue)).catch((e) => {
            if (e.name === "ConstraintError") {
              throw new Errors.NotUniqueError(e);
            }
            throw e;
          }),
        );
        cursor.continue();
        return true; // wait for next cursor
      });
      await Promise.all(waitList);
      return waitList.length;
    } catch (e) {
      try {
        if (transaction && !transaction.error) transaction.abort();
      } catch (e) {
        // ignore
      }
      if (e instanceof Errors.ObjectStoreError) {
        throw e;
      }
      throw new Errors.UnexpectedError(e);
    }
  }

  /**
   * @param {*} filter
   * @returns {Promise<boolean>}
   */
  async _deleteOne(filter) {
    return this._internalDeleteOne(filter, null);
  }

  /**
   * @param {*} filter
   * @returns {Promise<number>}
   */
  async _deleteMany(filter) {
    let transaction;
    try {
      transaction = await this._internalInitTransaction("readwrite");
      let objectStore = transaction.objectStore(this._internalSchemaName);
      let { keyPathList, valueList } = this._internalToKeyPathData(filter);
      let { queriable, query } = this._internalToQueriable(objectStore, keyPathList, valueList);
      let count;
      if (queriable instanceof IDBObjectStore) {
        // handle deleting of all items from schema explicitly due to `store.delete(null)` not being supported
        // https://w3c.github.io/IndexedDB/#dom-idbobjectstore-delete
        if (query == null) query = IDBKeyRange.lowerBound(-Infinity);
        count = await this._internalWaitForRequest(queriable.count(query));
        await this._internalWaitForRequest(queriable.delete(query));
      } else {
        let waitList = [];
        let request = queriable.openCursor(query);
        await this._internalWaitForCursor(request, (cursor) => {
          if (!cursor) return false; // nothing more to process
          waitList.push(this._internalWaitForRequest(cursor.delete()));
          cursor.continue();
          return true; // wait for next cursor
        });
        await Promise.all(waitList);
        count = waitList.length;
      }
      return count;
    } catch (e) {
      try {
        if (transaction && !transaction.error) transaction.abort();
      } catch (e) {
        // ignore
      }
      if (e instanceof Errors.ObjectStoreError) {
        throw e;
      }
      throw new Errors.UnexpectedError(e);
    }
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

    let explicitTransaction = await this._internalInitTransaction("readwrite");
    try {
      // NOTE We would like here something like Java's ThreadLocal / NodeJS's AsyncLocatStorage.
      // But we don't have that so instead, create another scope which will be used as 'this'
      // for the 'callback' and the scope will contain the indexedDB transaction that will
      // be re-used by invoked DAO methods (re-use is in _internalInitTransaction()). This will work
      // for non-arrow / unbound 'callback' functions only.

      // NOTE Unfortunately, it seems that due to this solution, we cannot use private fields/methods because
      // JS error would be thrown when executing 'callback' having 'this=scope' (because private stuff is not
      // accessible via prototype chain), i.e. all private fields got renamed from #xyz to _internalXyz.
      let scope = Object.create(this, { _explicitTransaction: { get: () => explicitTransaction } });
      return await callback.call(scope);
    } catch (e) {
      try {
        if (!explicitTransaction.error) explicitTransaction.abort();
      } catch (e) {
        // ignore
      }
      throw e;
    }
  }

  // private methods

  async _internalDeleteOne(filter, revision) {
    // NOTE no-op if filter doesn't match anything.
    let transaction;
    try {
      transaction = await this._internalInitTransaction("readwrite");
      let objectStore = transaction.objectStore(this._internalSchemaName);
      let { keyPathList, valueList } = this._internalToKeyPathData(filter);
      let { queriable, query } = this._internalToQueriable(objectStore, keyPathList, valueList);
      let request = queriable.openCursor(query);
      let waitList = [];
      let count = 0;
      await this._internalWaitForCursor(request, (cursor) => {
        if (!cursor) return false;
        if (++count >= 2) {
          throw new Errors.AmbiguousQueryError();
        }
        if (revision != null && revision !== cursor.value?.sys?.rev) {
          throw new Errors.ConcurrentModificationError();
        }
        waitList.push(this._internalWaitForRequest(cursor.delete()));
        cursor.continue();
        return true; // no wait for next cursor
      });
      await Promise.all(waitList);
      let deleted = waitList.length > 0;
      return deleted;
    } catch (e) {
      try {
        if (transaction && !transaction.error) transaction.abort();
      } catch (e) {
        // ignore
      }
      if (e instanceof Errors.ObjectStoreError) {
        throw e;
      }
      throw new Errors.UnexpectedError(e);
    }
  }

  _internalCreateIndex(indexFields, unique) {
    if (!this._internalUpgradeTransaction) {
      throw new Errors.InvalidCallError({
        paramMap: {
          detail: `_createIndex() / _createUniqueIndex() can be called only during createSchema()/upgradeSchema().').`,
        },
      });
    }

    let { keyPathList } = this._internalToKeyPathData(indexFields);

    // ignore index { oid: 1 } as we handle it as { id: 1 }, i.e. as primary key
    if (keyPathList.every((it, i) => this._internalPrimaryKeyPath[i] === it)) {
      return;
    }

    let indexName = this._internalToIndexName(keyPathList);
    try {
      this._internalUpgradeTransaction
        .objectStore(this._internalSchemaName)
        .createIndex(indexName, keyPathList.length <= 1 ? keyPathList[0] : keyPathList, { unique });
    } catch (e) {
      throw new Errors.UnexpectedError(e);
    }
  }

  async _internalFindManyPaged(filter, pageInfo) {
    try {
      let { keyPathList, valueList } = this._internalToKeyPathData(filter);
      let transaction = await this._internalInitTransaction("readonly");
      let objectStore = transaction.objectStore(this._internalSchemaName);
      let { queriable, query } = this._internalToQueriable(objectStore, keyPathList, valueList);
      let itemList;
      let resultPageInfo = { ...pageInfo };
      let totalPromise = this._internalWaitForRequest(queriable.count(query));
      if (resultPageInfo.pageIndex === 0) {
        let request = queriable.getAll(query, resultPageInfo.pageSize);
        itemList = await this._internalWaitForRequest(request);
      } else {
        // NOTE We have to use cursor for skipping N first records. Unfortunately, then we have to read
        // the records 1 by 1 via cursor (upto 'pageSize' count), which in the end will be done via
        // 'pageSize' count of onsuccess events (JS tasks on event loop) which might be a bit slow. But there
        // isn't better API for this yet. There's an optimization in case of unique indices/primary key where
        // we can look up 1st value via cursor and then use getAll(IDBKeyRange.lowerBound(firstKey), pageSize)
        // to get the remaining 'pageSize' count of records (this wouldn't work for non-unique indices because
        // the index key of 1st value can represent multiple records and API doesn't allow us to pass
        // primary key for specifying the exact start).
        // NOTE Non-unique indices could be optimized too, but we would have to change them into unique indices
        // by e.g. adding primaryKey as the last segment of the key:
        //   querying:
        //     before: { name: 1, surname: 1 } -> getAll(["John", "Doe"])
        //     after:  { name: 1, surname: 1, id: 1 } -> getAll(IDBKeyRange.bound(["John", "Doe", -Infinity], ["John", "Doe", []]))
        //   with skipping:
        //     1. look up first primary key via cursor
        //     2. getAll(IDBKeyRange.bound(["John", "Doe", firstPrimaryKey], ["John", "Doe", []]), pageSize)
        itemList = [];
        let cursorRequest = queriable.openCursor(query);
        let batchItemList;
        let step = 0;
        await this._internalWaitForCursor(cursorRequest, (cursor) => {
          if (!cursor) return false;
          step++;
          if (step === 1) {
            cursor.advance(resultPageInfo.pageIndex * resultPageInfo.pageSize);
          } else if (step === 2 && (queriable.unique || queriable instanceof IDBObjectStore)) {
            // optimized reading thanks to unique index / primary key
            let firstKey = cursor.key;
            let batchRequest = queriable.getAll(IDBKeyRange.lowerBound(firstKey), resultPageInfo.pageSize);
            batchItemList = this._internalWaitForRequest(batchRequest);
            return false; // close cursor
          } else {
            // 1 by 1 reading of items from cursor
            itemList.push(cursor.value);
            cursor.continue();
          }
          return itemList.length < resultPageInfo.pageSize;
        });
        if (batchItemList) {
          itemList = await batchItemList;
        }
      }
      resultPageInfo.total = await totalPromise;
      return { itemList: itemList.map((it) => this._internalToUuObject(it)), pageInfo: resultPageInfo };
    } catch (e) {
      if (e instanceof Errors.ObjectStoreError) {
        throw e;
      }
      throw new Errors.UnexpectedError(e);
    }
  }

  async _internalSetOneUuObject(uuObject, opts) {
    if (!uuObject?.oid && !opts?.createIfMissing) {
      throw new Errors.MissingAttributeError("oid");
    }
    let result = await this._internalSetOne({ oid: uuObject.oid }, uuObject, opts);
    if (!result) {
      throw new Errors.ConcurrentModificationError();
    }
    return result;
  }

  async _internalSetOne(filter, update, { createIfMissing, replace, transaction, skipRevision } = {}) {
    try {
      transaction ||= await this._internalInitTransaction("readwrite");
      let objectStore = transaction.objectStore(this._internalSchemaName);
      let { keyPathList, valueList } = this._internalToKeyPathData(filter);
      let { queriable, query } = this._internalToQueriable(objectStore, keyPathList, valueList);
      let request = queriable.openCursor(query); // cursor.update()/.delete() can be called only on normal cursor, not key cursor
      let waitList = [];
      let count = 0;
      await this._internalWaitForCursor(request, (cursor) => {
        if (!cursor) return false;
        if (++count >= 2) {
          throw new Errors.AmbiguousQueryError();
        }
        // NOTE "sys" object & revision changes are done always, regardless of revisionStrategy (the strategy
        // just turns on checking of whether the object-to-save has required revision before saving).
        if (!skipRevision && update.sys?.rev != null && update.sys.rev !== cursor.value?.sys?.rev) {
          throw new Errors.ConcurrentModificationError();
        }
        let updateValue = {
          ...(replace ? undefined : cursor.value),
          ...this._internalToDbRecord(update),
          ...(!skipRevision
            ? { sys: { ...cursor.value.sys, mts: new Date(), rev: cursor.value.sys.rev + 1 } }
            : undefined),
        };
        if (replace) {
          let obj = updateValue;
          for (let i = 0; i < this._internalPrimaryKeyPath.length - 1; i++) {
            let field = this._internalPrimaryKeyPath[i];
            if (!obj[field]) obj[field] = {};
            obj = obj[field];
          }
          let lastField = this._internalPrimaryKeyPath[this._internalPrimaryKeyPath.length - 1];
          if (obj[lastField] === undefined)
            obj[lastField] = this._internalGetValueByPath(cursor.value, this._internalPrimaryKeyPath);
        }

        waitList.push(
          this._internalWaitForRequest(cursor.update(updateValue)).catch((e) => {
            if (e.name === "ConstraintError") {
              throw new Errors.NotUniqueError(e);
            }
            throw e;
          }),
        );
        // wait for one more to check ambiguity
        cursor.continue();
        return true;
      });
      if (waitList.length === 0) {
        if (createIfMissing) {
          let sys = this._internalCreateSys();
          let request = objectStore.put({ ...update, sys });
          waitList.push(
            this._internalWaitForRequest(request).catch((e) => {
              if (e.name === "ConstraintError") {
                throw new Errors.NotUniqueError(e);
              }
              throw e;
            }),
          );
        }
      }

      let result;
      let resolvedList = await Promise.all(waitList);
      if (resolvedList.length > 0) {
        let [key] = resolvedList;
        result = this._internalToUuObject(await this._internalWaitForRequest(objectStore.get(key)));
      } else {
        result = null;
      }
      return result;
    } catch (e) {
      try {
        if (transaction && !transaction.error) transaction.abort();
      } catch (e) {
        // ignore
      }
      if (e instanceof Errors.ObjectStoreError) {
        throw e;
      }
      throw new Errors.UnexpectedError(e);
    }
  }

  /** @return {Promise<IDBDatabase>} */
  async _internalOpen() {
    let dbName = this._internalGetDbName();
    if (dbName !== this._internalDbPromiseDbName) this._internalClose();
    return (this._internalDbPromise ??= new Promise((resolve, reject) => {
      this._internalDbPromiseDbName = dbName;
      const idbOpenDbRequest = window.indexedDB.open(dbName, this._internalDbVersion);
      idbOpenDbRequest.onsuccess = (e) => {
        const db = idbOpenDbRequest.result;
        this._internalUpgradeTransaction = undefined;
        this._internalUpdateDaoUsageData(dbName, this._internalSchemaName, this._internalSchemaMaxAge); // no await
        // NOTE Scenario: tab 1 has dbVersion=1, tab 2 gets reloaded with newer version of Dao, i.e. dbVersion=2
        // and it'll automatically do upgrade transaction (which needs DB connections to be closed) - tab 1 can either block it
        // (by doing nothing) or it can allow the upgrade (by closing its DB), but if tab 1 doesn't get reloaded and user
        // attempts to use the DB again, it'll already be converted to newer version so opening will fail with VersionError.
        //   => for now do not block, i.e. tab 1 (and any other old tab using the DAO) will show an Alert that app needs to be reloaded
        //      to work correctly (other option would be to block upgrade and show Alert in the tab 2 that user should reload all tabs,
        //      but that is bad UX)
        //      https://w3c.github.io/IndexedDB/#handling-versionchange
        db.onversionchange = () => {
          this._internalClose();
          this._internalShowReloadNeeded();
        };
        resolve(db);
      };
      idbOpenDbRequest.onerror = (e) => {
        let { error } = idbOpenDbRequest;
        this._internalUpgradeTransaction = undefined;
        if (idbOpenDbRequest.error.name === "VersionError") {
          // https://w3c.github.io/IndexedDB/#open-a-database-connection
          // developer used schemaVersion which is older than what's in indexedDB
          //   => try Uu5Loader.refreshCache() so that if user then reloads page, he'll get newest library version
          //      (which will likely be using newest schemaVersion and likely matching user's indexedDB state).
          Uu5Loader.refreshCache();
          this._internalShowReloadNeeded();
          error = new Errors.InvalidCallError({
            cause: e,
            paramMap: {
              detail: "Stored DAO schema is already migrated to newer schema version.",
              persistedSchemaVersion: error.oldVersion,
              schemaVersion: this._internalDbVersion,
              schemaName: this._internalSchemaName,
            },
          });
        }
        reject(error);
      };
      idbOpenDbRequest.onupgradeneeded = (e) => {
        const db = idbOpenDbRequest.result;
        this._internalUpgradeTransaction = idbOpenDbRequest.transaction;
        let result;
        if (!e.oldVersion) {
          db.createObjectStore(this._internalSchemaName, {
            keyPath: this._internalPrimaryKey,
            autoIncrement: this._internalAutoIncrement,
          });
          result = this.createSchema?.();
        } else {
          result = this.upgradeSchema?.({ oldVersion: e.oldVersion });
        }
        // NOTE When Firefox is creating schema for the 1st time, it fails in our e00.html demo due to some sort of async
        // shenanigans. Most likely because demo at some point calls `jokeDao.count()` which tries to re-use this._internalUpgradeTransaction
        // which is still there (i.e. createSchema() ran, but transaction "complete" event did not fire yet). We'll therefore
        // cleanup our internal #upgradeTransaction field ASAP, i.e. right after createSchema()/upgradeSchema() finished instead
        // of waiting for "complete" event.
        if (typeof result?.finally === "function") {
          result.finally(() => (this._internalUpgradeTransaction = undefined));
        } else {
          this._internalUpgradeTransaction = undefined;
        }
      };
    }));
  }

  /**
   * @param {"readonly"|"readwrite"} mode
   * @returns {IDBTransaction}
   */
  async _internalInitTransaction(mode = "readonly") {
    // NOTE Transactions are auto-committed after JS task ends (assuming that there're no started/ongoing operations in them).
    let transaction =
      this._internalUpgradeTransaction ||
      this._explicitTransaction ||
      (await this._internalOpen()).transaction(this._internalSchemaName, mode);
    return transaction;
  }

  _internalGetDbName() {
    // NOTE Creating/deleting index is allowed only in "upgrade" transactions which are startable only when opening DB
    // by increasing dbVersion. For simplicity, we'll separate each schema to its own DB so that DAO developer can keep track of
    // his/her schema version (our dbVersion) without colliding with other DAOs.
    let appBasePath = new URL(appBaseUri).pathname.replace(/^\//, "");
    let uuIdentity = sessionHolder.session?.identity?.uuIdentity || "";
    let dbName = appBasePath + "#" + this._internalSchemaName + (uuIdentity ? "#" + uuIdentity : "");
    return dbName;
  }

  async _internalUpdateDaoUsageData(dbName, schemaName, schemaMaxAge) {
    const idbOpenDbRequest = this._internalOpenDaoUsageDb();
    idbOpenDbRequest.onsuccess = (e) => {
      const db = idbOpenDbRequest.result;
      try {
        const transaction = db.transaction(DAO_USAGE_SCHEMA_NAME, "readwrite");
        const objectStore = transaction.objectStore(DAO_USAGE_SCHEMA_NAME);
        const now = Date.now();
        objectStore.put({ dbName, schemaName, cleanupAfter: now + schemaMaxAge });
        transaction.commit();
      } finally {
        db.close();
      }
      if (!didSchemaMaxAgeCleanup) {
        didSchemaMaxAgeCleanup = true;
        requestIdleCallback(() => this._internalCleanupDaoUsageData());
      }
    };
  }

  async _internalCleanupDaoUsageData() {
    const idbOpenDbRequest = this._internalOpenDaoUsageDb();
    idbOpenDbRequest.onsuccess = (e) => {
      const db = idbOpenDbRequest.result;
      try {
        const transaction = db.transaction(DAO_USAGE_SCHEMA_NAME, "readwrite");
        const objectStore = transaction.objectStore(DAO_USAGE_SCHEMA_NAME);
        const now = Date.now();
        objectStore.index("cleanupAfter").getAll(IDBKeyRange.upperBound(now, true)).onsuccess = (e) => {
          let valueList = e.target.result;
          for (let value of valueList) {
            objectStore.delete([value.dbName, value.schemaName]);
            indexedDB.deleteDatabase(value.dbName);
          }
          transaction.commit();
        };
      } finally {
        db.close();
      }
    };
  }

  _internalOpenDaoUsageDb() {
    // NOTE Cannot use Dao class as it's per-uuIdentity and the usageDao should be singleton.
    let idbOpenDbRequest = window.indexedDB.open(DAO_USAGE_DB_NAME, DAO_USAGE_SCHEMA_VERSION);
    idbOpenDbRequest.onupgradeneeded = (e) => {
      if (e.oldVersion < 1) {
        const db = idbOpenDbRequest.result;
        const objectStore = db.createObjectStore(DAO_USAGE_SCHEMA_NAME, { keyPath: ["dbName", "schemaName"] });
        objectStore.createIndex("dbName,schemaName", ["dbName", "schemaName"], { unique: true });
        objectStore.createIndex("cleanupAfter", "cleanupAfter");
      }
    };
    return idbOpenDbRequest;
  }

  async _internalClose() {
    let dbPromise = this._internalDbPromise;
    if (dbPromise) {
      this._internalDbPromise = undefined;
      return dbPromise.then(
        (db) => {
          db.close(); // we actually don't know when the DB closes as browser will wait for transactions to end
          db.onversionchange = undefined;
        },
        (e) => {},
      );
    }
  }

  _internalWaitForRequest(idbRequest) {
    return new Promise((resolve, reject) => {
      idbRequest.onsuccess = (e) => resolve(e.target.result);
      idbRequest.onerror = (e) => reject(e.target.error);
    });
  }

  /**
   *
   * @param {IDBRequest} idbRequest
   * @param {(cursor: IDBCursor) => boolean} onCursorChange
   * @returns {Promise<any>}
   */
  _internalWaitForCursor(idbRequest, onCursorChange) {
    return new Promise((resolve, reject) => {
      idbRequest.onsuccess = (e) => {
        let cursor = e.target.result;
        let waitMore;
        try {
          waitMore = onCursorChange(cursor);
        } catch (e) {
          reject(e);
          return;
        }
        if (!cursor || !waitMore) resolve();
      };
      idbRequest.onerror = (e) => reject(e.target.error);
    });
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

  /**
   * @param {IDBObjectStore} objectStore
   * @returns {{ queriable: IDBObjectStore | IDBIndex, query: any[]? }}
   */
  _internalToQueriable(objectStore, keyPathList = undefined, valueList = undefined) {
    let queriable = objectStore;
    let query;
    if (keyPathList?.length > 0) {
      let indexToUse;
      if (this._internalToIndexName(keyPathList) === this._internalPrimaryKey) {
        indexToUse = this._internalPrimaryKey;
      } else {
        let necessaryKeySet = new Set(keyPathList);
        let usableIndexList = [];
        for (let index of queriable.indexNames) {
          let remainingKeySet = new Set(necessaryKeySet);
          for (let key of index.split(INDEX_SUBKEY_SEPARATOR, necessaryKeySet.size)) remainingKeySet.delete(key);
          if (remainingKeySet.size === 0) usableIndexList.push(queriable.index(index));
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
      query = valueList;
      if (indexToUse !== this._internalPrimaryKey) {
        queriable = queriable.index(indexToUse);
        let indexMap = new Map();
        for (let i = 0; i < keyPathList.length; i++) indexMap.set(keyPathList[i], i);
        let orderedValueList = indexToUse
          .split(INDEX_SUBKEY_SEPARATOR)
          .map((subkey) => valueList?.[indexMap.get(subkey)]);
        let lowerBoundary = orderedValueList.map((it) => (it === undefined ? -Infinity : it));
        let upperBoundary = orderedValueList.map((it) => (it === undefined ? [] : it));
        query = IDBKeyRange.bound(
          lowerBoundary.length === 1 ? lowerBoundary[0] : lowerBoundary,
          upperBoundary.length === 1 ? upperBoundary[0] : upperBoundary,
        );
      } else if (!indexToUse.includes(INDEX_SUBKEY_SEPARATOR)) {
        query = query?.[0];
      }
    }
    return { queriable, query };
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

  _internalShowReloadNeeded() {
    EventManager.trigger("Uu5.applicationNeedsReload", {});
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
}

// exported for tests only
function resetSchemaMaxAgeCleanup() {
  didSchemaMaxAgeCleanup = false;
}

export {
  Dao,
  resetSchemaMaxAgeCleanup,
  isArrowFn,
  INDEX_SUBKEY_SEPARATOR,
  INDEX_SUBKEY_FIELD_SEPARATOR,
  REVISION_STRATEGY,
  DEFAULT_PAGE_SIZE,
  PRIMARY_KEY_PATH,
};
export default Dao;
