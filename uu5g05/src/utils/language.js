import EventManager from "./event-manager.js";
import { defaultLanguage } from "../uu5-environment.js";

// !!! Do not rename methods - _register. _unregister, _parseLanguage + API methods are used by uu5g04.
const Language = {
  _register(listener) {
    return EventManager.register("language", listener);
  },

  _unregister(listener) {
    return EventManager.unregister("language", listener);
  },

  setLanguage(language) {
    if (language !== globalLanguage) {
      globalLanguage = language;
      EventManager.trigger("language", { language });
    }
  },

  getLanguage() {
    return globalLanguage;
  },

  _parseLanguage(languagesString) {
    // languagesString = 'cs-CZ,en;q=0.6,sk;q=0.8' => languagesSplitter = ['cs-CZ', 'en;q=0.6', 'sk;q=0.8']
    const languagesSplitter = languagesString.toLowerCase().split(",");

    let languages = {};
    languagesSplitter.forEach((lang) => {
      lang = lang.trim();

      const [langStr, qStr] = lang.split(";");
      let q = 1; // quality factor
      if (qStr) {
        q = +qStr.split("=")[1];
      }

      const languageMap = { q, location: langStr };
      const [language, region] = langStr.split("-");
      languageMap.language = language;
      if (region) {
        languageMap.region = region;
      }

      let selectedLanguage = languages[languageMap.location];
      if (selectedLanguage) {
        selectedLanguage.q < q && (selectedLanguage.q = q);
      } else {
        languages[languageMap.location] = languageMap;
      }
    });

    // [{language: 'cs', location: 'cs-CZ', q: 1.0}, {language: 'sk', q: 0.8}, {language: 'en', q: 0.6}]
    return Object.values(languages).sort((lang1, lang2) => {
      if (lang1.q < lang2.q) {
        return 1;
      } else if (lang1.q > lang2.q) {
        return -1;
      } else {
        return 0;
      }
    });
  },

  // cs
  // cs-cz
  // cs-CZ, sk;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5
  getItem(lsi, language = this.getLanguage()) {
    if (!lsi) return undefined;

    const sortedLanguages = Language._parseLanguage(language);
    const keys = Object.keys(lsi);
    let resLang;

    for (let i = 0; i < sortedLanguages.length; i++) {
      const lang = sortedLanguages[i];

      if (lsi[lang.location]) {
        resLang = lang.location;
        break;
      } else if (lsi[lang.language]) {
        resLang = lang.language;
        break;
      } else {
        let lsiKey = keys.find((key) => key.startsWith(lang.language + "-"));
        if (lsiKey) {
          resLang = lsiKey;
          break;
        }
      }
    }

    if (!resLang && defaultLanguage) {
      if (lsi[defaultLanguage]) {
        resLang = defaultLanguage;
      } else if (lsi[defaultLanguage.split("-")[0]]) {
        resLang = defaultLanguage.split("-")[0];
      }
    }

    let lsiKey = lsi[resLang] ? resLang : lsi[keys[0]] ? keys[0] : null;

    return lsi[lsiKey];
  },
};

let globalLanguage = window.navigator.language.toLowerCase();

export { Language };
export default Language;
