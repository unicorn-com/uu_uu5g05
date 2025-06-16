import {
  appBaseUri,
  trustedUriRegExp,
  uu5DataMap,
  plus4UGoBaseUri,
  componentUveUri,
  libraryRegistryBaseUri,
  isSimpleRender,
  uuAppEnvironmentGet,
} from "./uu5-environment.js";
import * as constants from "./uu5-environment.js";

const Environment = {
  appBaseUri,
  trustedUriRegExp,
  uu5DataMap,
  plus4UGoBaseUri,
  componentUveUri,
  libraryRegistryBaseUri,

  isMobileApp: navigator.userAgent.search(/uuAppMobileApp/) > -1,
  isSimpleRender,

  get: uuAppEnvironmentGet,
};

Object.defineProperty(Environment, "_constants", {
  value: constants,
  enumerable: false,
});

export { Environment };
export default Environment;
