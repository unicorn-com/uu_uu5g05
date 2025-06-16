import Uu5ObjectStoreDaoWithMemoryFallback from "./uu5-object-store-dao-with-memory-fallback.js";
import Uu5ObjectStoreErrors from "./uu5-object-store-errors.js";

class Uu5ObjectStore {
  static Dao = Uu5ObjectStoreDaoWithMemoryFallback;
  static Errors = Uu5ObjectStoreErrors;
}

export { Uu5ObjectStore };
export default Uu5ObjectStore;
