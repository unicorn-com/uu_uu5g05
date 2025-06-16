import Config from "../config/config.js";
import LoggerFactory from "./logger-factory.js";
import Dao from "./object-store-dao.js";
import DaoInMemory from "./object-store-dao-in-memory.js";

const AsyncFunction = (async () => {}).constructor;

let shouldUseMemory = window.indexedDB ? undefined : false;
let shouldUseMemoryPromise;

let logger;
function getLogger() {
  if (!logger) logger = LoggerFactory.get(Config.TAG + "ObjectStore._DaoWithMemoryFallback");
  return logger;
}

// NOTE It's not possible to check *synchronously* whether indexedDB is allowed or not. So we cannot do the check simply
// in ObjectStore class and switch Dao classes. Instead, we'll do the check once when 1st opening the DB and then potentially
// redirect all operations to memory-based Dao.
class DaoWithMemoryFallback extends Dao {
  constructor(schemaName, options) {
    const { persist = true, ...opts } = options || {};
    super(schemaName, opts);

    this._persist = persist;
    this._constructorArgs = [schemaName, opts];
  }
  async _open() {
    if (shouldUseMemory === undefined && this._persist) {
      // NOTE If we came here, it must be from super constructor's `this._open()` call
      // (otherwise an async method such as `insertOne` would first wait for _doCheck and therefore
      // `shouldUseMemory` wouldn't be undefined) => we can just return here.
      await this._doCheck();
      return;
    } else if (shouldUseMemory || !this._persist) {
      return;
    }
    return super._open();
  }
  async _doCheck() {
    shouldUseMemoryPromise ??= (async () => {
      try {
        // FF 131 with blocked data throws SecurityError during indexedDB.open().
        // Chrome 129 will do indexedDB.open() and the result will have result.error with UnknownError.
        await super._open();
      } catch (e) {
        if (e.name === "UnknownError" || e.name === "SecurityError") {
          getLogger().warn("Access to indexedDB storage is denied, falling back to in-memory storage.");
          shouldUseMemory = true;
          return;
        }
        // different error - let it fail one more time in next _open()
      }
      shouldUseMemory = false;
    })();
    await shouldUseMemoryPromise;
  }
  _initMemoryDao() {
    return (this._memoryDao ??= new DaoInMemory(
      this._constructorArgs[0],
      { ...this._constructorArgs[1], origDao: this },
      ...this._constructorArgs.slice(2),
    ));
  }
}

// wrap all Dao async methods by our check
// NOTE We're assuming no transpilation occurs (otherwise `instanceof AsyncFunction` wouldn't work).
for (let method of Object.getOwnPropertyNames(Dao.prototype)) {
  if (method === "constructor" || method.startsWith("_")) continue;
  if (Dao.prototype[method] instanceof AsyncFunction) {
    Object.defineProperty(DaoWithMemoryFallback.prototype, method, {
      enumerable: true,
      configurable: true,
      value: async function (...args) {
        if (shouldUseMemory === undefined && this._persist) await this._doCheck();
        if (shouldUseMemory || !this._persist) {
          return this._initMemoryDao()[method](...args);
        }
        return Dao.prototype[method].call(this, ...args);
      },
    });
  } else if (Dao.prototype[method] instanceof Function) {
    Object.defineProperty(DaoWithMemoryFallback.prototype, method, {
      enumerable: true,
      configurable: true,
      value: function (...args) {
        // on check, just immediate redirect if we know that memory variant should be used
        // (this is needed for e.g. createIndex()
        if (shouldUseMemory || !this._persist) {
          return this._initMemoryDao()[method](...args);
        }
        return Dao.prototype[method].call(this, ...args);
      },
    });
  }
}

// exported for tests only
function resetMemoryFallback() {
  shouldUseMemory = undefined;
  shouldUseMemoryPromise = undefined;
}

export { DaoWithMemoryFallback, resetMemoryFallback };
export default DaoWithMemoryFallback;
