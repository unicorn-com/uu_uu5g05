import Config from "../config/config.js";
import LoggerFactory from "./logger-factory.js";
import Dao from "./uu5-object-store-dao.js";
import DaoInMemory from "./uu5-object-store-dao-in-memory.js";

const AsyncFunction = (async () => {}).constructor;

let shouldUseMemory = window.indexedDB ? undefined : false;
let shouldUseMemoryPromise;

let logger;
function getLogger() {
  if (!logger) logger = LoggerFactory.get(Config.TAG + "Uu5ObjectStore._DaoWithMemoryFallback");
  return logger;
}

// NOTE It's not possible to check *synchronously* whether indexedDB is allowed or not. So we cannot do the check simply
// in Uu5ObjectStore class and switch Dao classes. Instead, we'll do the check once when 1st opening the DB and then potentially
// redirect all operations to memory-based Dao.
class DaoWithMemoryFallback extends Dao {
  constructor(schemaName, options) {
    const { persist = true, ...opts } = options || {};
    super(schemaName, opts);

    this._persist = persist;
    this._constructorArgs = [schemaName, opts];
  }
  async _internalOpen() {
    if (shouldUseMemory === undefined && this._persist) {
      // NOTE If we came here, it must be from super constructor's `this._internalOpen()` call
      // (otherwise an async method such as `insertOne` would first wait for _internalDoCheck and therefore
      // `shouldUseMemory` wouldn't be undefined) => we can just return here.
      await this._internalDoCheck();
      return;
    } else if (shouldUseMemory || !this._persist) {
      return;
    }
    return super._internalOpen();
  }
  async _internalDoCheck() {
    shouldUseMemoryPromise ??= (async () => {
      try {
        // FF 131 with blocked data throws SecurityError during indexedDB.open().
        // Chrome 129 will do indexedDB.open() and the result will have result.error with UnknownError.
        await super._internalOpen();
      } catch (e) {
        if (e.name === "UnknownError" || e.name === "SecurityError") {
          getLogger().warn("Access to indexedDB storage is denied, falling back to in-memory storage.");
          shouldUseMemory = true;
          return;
        }
        // different error - let it fail one more time in next _internalOpen()
      }
      shouldUseMemory = false;
    })();
    await shouldUseMemoryPromise;
  }
  _internalInitMemoryDao() {
    return (this._memoryDao ??= new DaoInMemory(
      this._constructorArgs[0],
      { ...this._constructorArgs[1], origDao: this },
      ...this._constructorArgs.slice(2),
    ));
  }
  _internalRedirect(method, args) {
    if (shouldUseMemory || !this._persist) {
      let memoryDao = this._explicitMemoryDao || this._internalInitMemoryDao();
      return memoryDao[method](...args);
    }
    return Dao.prototype[method].call(this, ...args);
  }
}

// wrap all Dao methods (public && protected) by our check
// NOTE We're assuming no transpilation occurs (otherwise `instanceof AsyncFunction` wouldn't work).
for (let method of Object.getOwnPropertyNames(Dao.prototype)) {
  if (method === "constructor" || method.startsWith("_internal")) continue;
  if (Dao.prototype[method] instanceof AsyncFunction) {
    Object.defineProperty(DaoWithMemoryFallback.prototype, method, {
      enumerable: true,
      configurable: true,
      value: async function (...args) {
        if (shouldUseMemory === undefined && this._persist) await this._internalDoCheck();
        return this._internalRedirect(method, args);
      },
    });
  } else if (Dao.prototype[method] instanceof Function) {
    Object.defineProperty(DaoWithMemoryFallback.prototype, method, {
      enumerable: true,
      configurable: true,
      value: function (...args) {
        // on check, just immediate redirect if we know that memory variant should be used
        // (this is needed for e.g. _createIndex()
        return this._internalRedirect(method, args);
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
