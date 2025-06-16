import { Utils } from "uu5g05";
import lsiEn from "./en.json";

// TODO Temporarily using string due to devkit Jest tests bug - process.env.NAME is (incorrectly) the name of library
// whose tests are currently running (e.g. uu5g05-forms), not who owns the import-lsi.js file (e.g. uu5g05-elements)
const libraryCode = "uu5g05-forms"; // process.env.NAME;

const importLsi = (lang) => import(`./${lang}.json`);
importLsi.libraryCode = libraryCode;

Utils.Lsi.setDefaultLsi(libraryCode, { en: lsiEn });

export default importLsi;
