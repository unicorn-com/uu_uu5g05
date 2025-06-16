import Config from "../config/config.js";
import LoggerFactory from "./logger-factory.js";
import ObjectStoreDaoWithMemoryFallback from "./object-store-dao-with-memory-fallback.js";
import ObjectStoreError from "./object-store-error.js";

let warnedDeprecated;

class ObjectStore {
  static get Dao() {
    if (process.env.NODE_ENV !== "production" && !warnedDeprecated) {
      warnedDeprecated = true;
      LoggerFactory.get(Config.TAG + "Utils.ObjectStore.Dao").warn(
        "This class is deprecated. Use Utils.Uu5ObjectStore.Dao instead.",
      );
    }
    return ObjectStoreDaoWithMemoryFallback;
  }
  static Error = ObjectStoreError;
}

export { ObjectStore };
export default ObjectStore;
