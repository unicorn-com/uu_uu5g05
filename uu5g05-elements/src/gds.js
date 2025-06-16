// NOTE This file is used in 'npm test' (also in 'npm test' for libraries which depend on this one).
// This file must not used in another building js!!!
import UuGds from "uu_gdsg01-unicorn";
export * from "uu_gdsg01-unicorn";
export default UuGds;

if (typeof global === "undefined") {
  throw new Error("Do not import src/gds.js, use src/_internal/gds.js instead when developing uu5g05-elements!");
}
