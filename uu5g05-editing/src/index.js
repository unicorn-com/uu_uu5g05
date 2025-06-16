import { Utils } from "uu5g05";

import * as Exports from "./exports.js";
export * from "./exports.js";
export default Exports;

if (process.env.NODE_ENV !== "test") {
  console.log(
    `${process.env.NAME}-${process.env.VERSION} © Unicorn\nTerms of Use: https://unicorn.com/tou/${process.env.NAME}`,
  );
}
Utils.LibraryRegistry.registerLibrary({
  name: process.env.NAME,
  version: process.env.VERSION,
  namespace: process.env.NAMESPACE,
});
