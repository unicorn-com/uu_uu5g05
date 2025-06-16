import { appBaseUri } from "../uu5-environment.js";
import Config from "../config/config.js";
import LoggerFactory from "./logger-factory.js";
import ObjectStoreError from "./object-store-error.js";
import Uu5Loader from "./uu5-loader.js";
import { sessionHolder } from "../providers/session-provider.js";
import EventManager from "./event-manager.js";

// !!! If adding/changing API methods, be sure to add/change them in object-store-dao-in-memory.js too.

const INDEX_SUBKEY_FIELD_SEPARATOR = ".";
const INDEX_SUBKEY_SEPARATOR = ",";
const PRIMARY_KEY_PATH = ["id"];
const DEFAULT_PAGE_SIZE = 1000;
const REVISION_STRATEGY = {
  NONE: null,
  REVISION: "REVISION",
};

const DAO_USAGE_DB_NAME = "uu5ObjectStore";
const DAO_USAGE_SCHEMA_NAME = "schema";
const DAO_USAGE_SCHEMA_VERSION = 1;

let logger;
function getLogger() {
  if (!logger) logger = LoggerFactory.get(Config.TAG + "ObjectStore.Dao");
  return logger;
}

let didSchemaMaxAgeCleanup;

// !!! Declare async methods using "async" keyword, do not just return Promise (so that object-store-dao-with-memory-fallback.js works correctly).
class Dao {
  #schemaName;
  #schemaMaxAge;
  #dbVersion;
  #primaryKeyPath;
  #primaryKey;
  #autoIncrement;
  #dbPromise;
  #dbPromiseDbName;
  #upgradeTransaction;

  constructor(schemaName, { schemaVersion = 1, schemaMaxAge = 30 * 24 * 60 * 60 * 1000 } = {}) {
    this.#schemaName = schemaName;
    // NOTE Exceeding schemaMaxAge makes schema subject to deletion, but it's not strictly enforced, i.e. if user
    // does something with schema, then does nothing for several months and logs in again, the first schema access
    // will find the schema old data (we do not do schemaMaxAge check before each DB access to not slow it down).
    // Our schema will, however, get deleted if user does during those months anything with any other schema (because
    // cleanup checks go over all schemas).
    this.#schemaMaxAge = schemaMaxAge;
    this.#dbVersion = schemaVersion;

    this.#primaryKeyPath = PRIMARY_KEY_PATH;
    this.#primaryKey = this.#primaryKeyPath.join(INDEX_SUBKEY_FIELD_SEPARATOR);
    this.#autoIncrement = true;

    /** @type {Promise<IDBDatabase>} */
    this.#dbPromise = undefined;
    /** @type {IDBTransaction} */
    this.#upgradeTransaction = undefined;

    if (schemaVersion !== 1 && typeof this.updateSchema !== "function") {
      getLogger().error(
        `DAO for schema '${this.#schemaName}' uses schemaVersion > 1 but it does not provide 'updateSchema' function for migrating schema indices/data from older version to this newer version, which is most likely a bug.`,
      );
    }
  }

  /**
   * Creates an index. This method can be called only from createSchema() or updateSchema() method.
   *
   * @param {object} indexFields Map such as { name: 1, surname: 1 }
   * @param {{ unique: boolean }} options Index options.
   */
  createIndex(indexFields, { unique = false } = {}) {
    if (!this.#upgradeTransaction) {
      throw new ObjectStoreError.InvalidCall({
        paramMap: {
          detail: `createIndex() can be called only during createSchema()/updateSchema().').`,
        },
      });
    }

    let { keyPathList } = this.#toKeyPathData(indexFields);
    let indexName = this.#toIndexName(keyPathList);
    this.#upgradeTransaction
      .objectStore(this.#schemaName)
      .createIndex(indexName, keyPathList.length <= 1 ? keyPathList[0] : keyPathList, { unique });
  }

  /**
   * Drops the index by its fields or name. This method can be called only from createSchema() or updateSchema() method.
   *
   * @param {object | string} indexFieldsOrName Map such as { name: 1, surname: 1 } or an index name as returned from Dao.getIndexes()
   * @returns {Promise.<void>}
   */
  dropIndex(indexFieldsOrName) {
    if (!this.#upgradeTransaction) {
      throw new ObjectStoreError.InvalidCall({
        paramMap: { detail: `dropIndex() can be called only during createSchema()/updateSchema().` },
      });
    }

    let indexName = indexFieldsOrName;
    if (typeof indexName !== "string") {
      let { keyPathList } = this.#toKeyPathData(indexName);
      indexName = this.#toIndexName(keyPathList);
    }
    this.#upgradeTransaction.objectStore(this.#schemaName).deleteIndex(indexName);
  }

  /**
   * @returns {Promise<{itemList: string[]}>}
   * */
  async getIndexes() {
    let transaction = await this.#initTransaction("readonly");
    let objectStore = transaction.objectStore(this.#schemaName);
    let itemList = [...objectStore.indexNames].map((indexName) => {
      let { name, unique } = objectStore.index(indexName);
      return { name, unique, key: name.split(INDEX_SUBKEY_SEPARATOR).reduce((r, it) => ((r[it] = 1), r), {}) };
    });
    return { itemList };
  }

  async dropSchema() {
    await this.#waitForRequest(window.indexedDB.deleteDatabase(this.#getDbName()));
  }

  /**
   * @param filter {object}
   * @returns {Promise}
   */
  async findOne(filter) {
    let transaction = await this.#initTransaction("readonly");
    // { name: "A", surname: "B" } => use index `name_surname` (keyPathList is ["name", "surname"]) and query ["A", "B"]
    let { keyPathList, valueList } = this.#toKeyPathData(filter);
    let objectStore = transaction.objectStore(this.#schemaName);
    let { queriable, query } = this.#toQueriable(objectStore, keyPathList, valueList);
    let request = queriable.get(query);
    let value = await this.#waitForRequest(request);
    return value ?? null;
  }

  /**
   * @param {object} filter
   * @param {Partial<PageInfo>} pageInfo
   * @returns {Promise<{itemList: object[], pageInfo: PageInfo}>}
   */
  async find(filter, pageInfo = {}) {
    let { keyPathList, valueList } = this.#toKeyPathData(filter);
    let transaction = await this.#initTransaction("readonly");
    let objectStore = transaction.objectStore(this.#schemaName);
    let { queriable, query } = this.#toQueriable(objectStore, keyPathList, valueList);
    let itemList;
    let resultPageInfo = {
      pageIndex: pageInfo?.pageIndex || 0,
      pageSize: pageInfo?.pageSize || DEFAULT_PAGE_SIZE,
    };
    let totalPromise = this.#waitForRequest(queriable.count(query));
    if (resultPageInfo.pageIndex === 0) {
      let request = queriable.getAll(query, resultPageInfo.pageSize);
      itemList = await this.#waitForRequest(request);
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
      await this.#waitForCursor(cursorRequest, (cursor) => {
        if (!cursor) return false;
        step++;
        if (step === 1) {
          cursor.advance(resultPageInfo.pageIndex * resultPageInfo.pageSize);
        } else if (step === 2 && (queriable.unique || queriable instanceof IDBObjectStore)) {
          // optimized reading thanks to unique index / primary key
          let firstKey = cursor.key;
          let batchRequest = queriable.getAll(IDBKeyRange.lowerBound(firstKey), resultPageInfo.pageSize);
          batchItemList = this.#waitForRequest(batchRequest);
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
    return { itemList, pageInfo: resultPageInfo };
  }

  /**
   * @param filter {object}
   * @returns {Promise<number>}
   */
  async count(filter) {
    let { keyPathList, valueList } = this.#toKeyPathData(filter);
    let transaction = await this.#initTransaction("readonly");
    let objectStore = transaction.objectStore(this.#schemaName);
    let { queriable, query } = this.#toQueriable(objectStore, keyPathList, valueList);
    let request = queriable.count(query);
    let count = await this.#waitForRequest(request);
    return count;
  }

  async closeDB() {
    return this.#close();
  }

  async insertOne(uuObject) {
    let transaction = await this.#initTransaction("readwrite");
    let objectStore = transaction.objectStore(this.#schemaName);
    let key;
    try {
      let sys = this.#createSys();
      let request = objectStore.add({ ...uuObject, sys });
      key = await this.#waitForRequest(request);
    } catch (e) {
      if (e.name === "ConstraintError") {
        throw new ObjectStoreError.DuplicateKey({
          paramMap: { key: this.#primaryKey, value: this.#getValueByPath(uuObject, this.#primaryKeyPath) },
          cause: e,
        });
      }
      throw e;
    }
    return await this.#waitForRequest(objectStore.get(key));
  }

  async insertMany(uuObjectList) {
    let transaction = await this.#initTransaction("readwrite");
    let objectStore = transaction.objectStore(this.#schemaName);
    let sys = this.#createSys();
    return await Promise.all(
      uuObjectList.map(async (uuObject) => {
        let request = objectStore.add({ ...uuObject, sys });
        let key;
        try {
          key = await this.#waitForRequest(request);
        } catch (e) {
          if (e.name === "ConstraintError") {
            throw new ObjectStoreError.DuplicateKey({
              paramMap: { key: this.#primaryKey, value: this.#getValueByPath(uuObject, this.#primaryKeyPath) },
              cause: e,
            });
          }
          throw e;
        }
        return await this.#waitForRequest(objectStore.get(key));
      }),
    );
  }

  async deleteOne(filter) {
    // NOTE no-op if filter doesn't match anything.
    let transaction = await this.#initTransaction("readwrite");
    let objectStore = transaction.objectStore(this.#schemaName);
    let { keyPathList, valueList } = this.#toKeyPathData(filter);
    let { queriable, query } = this.#toQueriable(objectStore, keyPathList, valueList);
    let request = queriable.openCursor(query);
    let waitList = [];
    await this.#waitForCursor(request, (cursor) => {
      if (!cursor) return false;
      waitList.push(this.#waitForRequest(cursor.delete()));
      return false; // no wait for next cursor
    });
    await Promise.all(waitList);
  }

  async deleteMany(filter) {
    let transaction = await this.#initTransaction("readwrite");
    let objectStore = transaction.objectStore(this.#schemaName);
    let { keyPathList, valueList } = this.#toKeyPathData(filter);
    let { queriable, query } = this.#toQueriable(objectStore, keyPathList, valueList);
    if (queriable instanceof IDBObjectStore) {
      // handle deleting of all items from schema explicitly due to `store.delete(null)` not being supported
      // https://w3c.github.io/IndexedDB/#dom-idbobjectstore-delete
      if (query == null) query = IDBKeyRange.lowerBound(-Infinity);
      await this.#waitForRequest(queriable.delete(query));
    } else {
      let waitList = [];
      let request = queriable.openCursor(query);
      await this.#waitForCursor(request, (cursor) => {
        if (!cursor) return false; // nothing more to process
        waitList.push(this.#waitForRequest(cursor.delete()));
        cursor.continue();
        return true; // wait for next cursor
      });
      await Promise.all(waitList);
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
    let transaction = await this.#initTransaction("readwrite");
    let objectStore = transaction.objectStore(this.#schemaName);
    let { keyPathList, valueList } = this.#toKeyPathData(filter);
    let { queriable, query } = this.#toQueriable(objectStore, keyPathList, valueList);
    let request = queriable.openCursor(query); // cursor.update()/.delete() can be called only on normal cursor, not key cursor
    let waitList = [];
    await this.#waitForCursor(request, (cursor) => {
      if (!cursor) return false;
      // NOTE "sys" object & revision changes are done always, regardless of revisionStrategy (the strategy
      // just turns on checking of whether the object-to-save has required revision before saving).
      if (revisionStrategy === REVISION_STRATEGY.REVISION && uuObject.sys.rev !== cursor.value?.sys?.rev) {
        throw new ObjectStoreError.InvalidRevision();
      }
      let updateValue = {
        ...(mergeIdOnly ? undefined : cursor.value),
        ...uuObject,
        sys: { ...cursor.value.sys, mts: new Date(), rev: cursor.value.sys.rev + 1 },
      };
      if (mergeIdOnly) {
        let obj = updateValue;
        for (let i = 0; i < this.#primaryKeyPath.length - 1; i++) {
          let field = this.#primaryKeyPath[i];
          if (!obj[field]) obj[field] = {};
          obj = obj[field];
        }
        let lastField = this.#primaryKeyPath[this.#primaryKeyPath.length - 1];
        if (obj[lastField] === undefined) obj[lastField] = this.#getValueByPath(cursor.value, this.#primaryKeyPath);
      }

      waitList.push(
        this.#waitForRequest(cursor.update(updateValue)).catch((e) => {
          if (e.name === "ConstraintError") {
            throw new ObjectStoreError.DuplicateKey({
              paramMap: { key: this.#primaryKey, value: this.#getValueByPath(updateValue, this.#primaryKeyPath) },
              cause: e,
            });
          }
          throw e;
        }),
      );
      return false; // no wait for next cursor
    });
    if (waitList.length === 0) {
      if (createIfMissing) {
        let sys = this.#createSys();
        let request = objectStore.put({ ...uuObject, sys });
        waitList.push(
          this.#waitForRequest(request).catch((e) => {
            if (e.name === "ConstraintError") {
              throw new ObjectStoreError.DuplicateKey({ cause: e });
            }
            throw e;
          }),
        );
      } else {
        throw new ObjectStoreError.ObjectNotFound({ paramMap: { filter } });
      }
    }

    let [key] = await Promise.all(waitList);
    return await this.#waitForRequest(objectStore.get(key));
  }

  async #initTransaction(mode = "readonly") {
    let transaction = this.#upgradeTransaction || (await this._open()).transaction(this.#schemaName, mode);
    return transaction;
  }

  #getDbName() {
    // NOTE Creating/deleting index is allowed only in "upgrade" transactions which are startable only when opening DB
    // by increasing dbVersion. For simplicity, we'll separate each schema to its own DB so that DAO developer can keep track of
    // his/her schema version (our dbVersion) without colliding with other DAOs.
    let appBasePath = new URL(appBaseUri).pathname.replace(/^\//, "");
    let uuIdentity = sessionHolder.session?.identity?.uuIdentity || "";
    let dbName = appBasePath + "#" + this.#schemaName + (uuIdentity ? "#" + uuIdentity : "");
    return dbName;
  }

  /** @return {Promise<IDBDatabase>} */
  async _open() {
    let dbName = this.#getDbName();
    if (dbName !== this.#dbPromiseDbName) this.#close();
    return (this.#dbPromise ??= new Promise((resolve, reject) => {
      this.#dbPromiseDbName = dbName;
      const idbOpenDbRequest = window.indexedDB.open(dbName, this.#dbVersion);
      idbOpenDbRequest.onsuccess = (e) => {
        const db = idbOpenDbRequest.result;
        this.#upgradeTransaction = undefined;
        this.#updateDaoUsageData(dbName, this.#schemaName, this.#schemaMaxAge); // no await
        // NOTE Scenario: tab 1 has dbVersion=1, tab 2 gets reloaded with newer version of Dao, i.e. dbVersion=2
        // and it'll automatically do upgrade transaction (which needs DB connections to be closed) - tab 1 can either block it
        // (by doing nothing) or it can allow the upgrade (by closing its DB), but if tab 1 doesn't get reloaded and user
        // attempts to use the DB again, it'll already be converted to newer version so opening will fail with VersionError.
        //   => for now do not block, i.e. tab 1 (and any other old tab using the DAO) will show an Alert that app needs to be reloaded
        //      to work correctly (other option would be to block upgrade and show Alert in the tab 2 that user should reload all tabs,
        //      but that is bad UX)
        //      https://w3c.github.io/IndexedDB/#handling-versionchange
        db.onversionchange = () => {
          this.#close();
          this.#showReloadNeeded();
        };
        resolve(db);
      };
      idbOpenDbRequest.onerror = (e) => {
        let { error } = idbOpenDbRequest;
        this.#upgradeTransaction = undefined;
        if (idbOpenDbRequest.error.name === "VersionError") {
          // https://w3c.github.io/IndexedDB/#open-a-database-connection
          // developer used schemaVersion which is older than what's in indexedDB
          //   => try Uu5Loader.refreshCache() so that if user then reloads page, he'll get newest library version
          //      (which will likely be using newest schemaVersion and likely matching user's indexedDB state).
          Uu5Loader.refreshCache();
          this.#showReloadNeeded();
          error = new ObjectStoreError.InvalidCall({
            cause: e,
            paramMap: {
              detail: "Stored DAO schema is already migrated to newer schema version.",
              persistedSchemaVersion: error.oldVersion,
              schemaVersion: this.#dbVersion,
              schemaName: this.#schemaName,
            },
          });
        }
        reject(error);
      };
      idbOpenDbRequest.onupgradeneeded = (e) => {
        const db = idbOpenDbRequest.result;
        this.#upgradeTransaction = idbOpenDbRequest.transaction;
        let result;
        if (!e.oldVersion) {
          db.createObjectStore(this.#schemaName, {
            keyPath: this.#primaryKey,
            autoIncrement: this.#autoIncrement,
          });
          result = this.createSchema?.();
        } else {
          result = this.updateSchema?.({ oldVersion: e.oldVersion });
        }
        // NOTE When Firefox is creating schema for the 1st time, it fails in our e00.html demo due to some sort of async
        // shenanigans. Most likely because demo at some point calls `jokeDao.count()` which tries to re-use this.#upgradeTransaction
        // which is still there (i.e. createSchema() ran, but transaction "complete" event did not fire yet). We'll therefore
        // cleanup our internal #upgradeTransaction field ASAP, i.e. right after createSchema()/updateSchema() finished instead
        // of waiting for "complete" event.
        if (typeof result?.finally === "function") {
          result.finally(() => (this.#upgradeTransaction = undefined));
        } else {
          this.#upgradeTransaction = undefined;
        }
      };
    }));
  }

  async #updateDaoUsageData(dbName, schemaName, schemaMaxAge) {
    const idbOpenDbRequest = this.#openDaoUsageDb();
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
        requestIdleCallback(() => this.#cleanupDaoUsageData());
      }
    };
  }

  async #cleanupDaoUsageData() {
    const idbOpenDbRequest = this.#openDaoUsageDb();
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

  #openDaoUsageDb() {
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

  async #close() {
    let dbPromise = this.#dbPromise;
    if (dbPromise) {
      this.#dbPromise = undefined;
      return dbPromise.then(
        (db) => {
          db.close(); // we actually don't know when the DB closes as browser will wait for transactions to end
          db.onversionchange = undefined;
        },
        (e) => {},
      );
    }
  }

  #waitForRequest(idbRequest) {
    return new Promise((resolve, reject) => {
      idbRequest.onsuccess = (e) => resolve(e.target.result);
      idbRequest.onerror = (e) => reject(e.target.error);
    });
  }

  /**
   *
   * @param {IDBRequest} idbRequest
   * @param {(cursor: IDBCursor) => void} onCursorChange
   * @returns {Promise<any>}
   */
  #waitForCursor(idbRequest, onCursorChange) {
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

  #toKeyPathData(obj, keyPathList = [], valueList = [], currentPath = []) {
    return {
      keyPathList: obj && typeof obj === "object" ? Object.keys(obj).filter((key) => obj[key] !== undefined) : [],
      valueList: obj && typeof obj === "object" ? Object.values(obj).filter((value) => value !== undefined) : [],
    };
  }

  #toIndexName(keyPathList) {
    return keyPathList.join(INDEX_SUBKEY_SEPARATOR);
  }

  /**
   * @param {IDBObjectStore} objectStore
   * @returns {{ queriable: IDBObjectStore | IDBIndex, query: any[]? }}
   */
  #toQueriable(objectStore, keyPathList = undefined, valueList = undefined) {
    let queriable = objectStore;
    let query;
    if (keyPathList?.length > 0) {
      let indexToUse;
      if (this.#toIndexName(keyPathList) === this.#primaryKey) {
        indexToUse = this.#primaryKey;
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
        throw new ObjectStoreError.InvalidCall({
          paramMap: {
            detail: `Filtering can be used only if there exists an index that covers all filtered fields (1st N fields of index must be same as the fields used in filter) - either remove fields from filter or create the index e.g.: ${JSON.stringify(suggestedIndex)}.`,
          },
        });
      }
      query = valueList;
      if (indexToUse !== this.#primaryKey) {
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

  #showReloadNeeded() {
    EventManager.trigger("Uu5.applicationNeedsReload", {});
  }
}

// exported for tests only
function resetSchemaMaxAgeCleanup() {
  didSchemaMaxAgeCleanup = false;
}

export {
  Dao,
  resetSchemaMaxAgeCleanup,
  INDEX_SUBKEY_SEPARATOR,
  INDEX_SUBKEY_FIELD_SEPARATOR,
  REVISION_STRATEGY,
  DEFAULT_PAGE_SIZE,
  PRIMARY_KEY_PATH,
};
export default Dao;
