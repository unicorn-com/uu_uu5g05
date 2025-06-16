// import mod from "module";
import { Environment, Utils } from "uu5g05";

const LIB_NAME = process.env.NAME.replace(/-.*/, "");
const get = (name, defaultValue) => Environment.get(`${LIB_NAME}_${name}`, defaultValue);

export const iconLibraryMap = Environment._constants.iconLibraryMap;

export const gdsUri = get("gdsUri", Utils.Uu5Loader?.resolve("uu5g05-elements-gds") ?? null);

export const trustedUriRegExp = Environment.trustedUriRegExp;

export const plus4UGoBaseUri = Environment._constants.plus4UGoBaseUri;
