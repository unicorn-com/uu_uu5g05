/**
 * Copyright (C) 2021 Unicorn a.s.
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public
 * License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later
 * version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License at
 * <https://gnu.org/licenses/> for more details.
 *
 * You may obtain additional information at <https://unicorn.com> or contact Unicorn a.s. at address: V Kapslovne 2767/2,
 * Praha 3, Czech Republic or at the email: info@unicorn.com.
 */

import useLanguage from "../hooks/use-language.js";
import Language from "../utils/language.js";
import { useLayoutEffect, useMemo, useRef, useState } from "../hooks/react-hooks.js";
import Dom from "../utils/dom.js";
import LoggerFactory from "../utils/logger-factory.js";
import Config from "../config/config.js";
import Lsi from "../utils/lsi.js";

const logger = LoggerFactory.get(Config.TAG + "useLazyLsi");

const lsiDefault = Lsi.default;
const lsiConfig = Lsi.config;
const lsiStore = Lsi.store;
const lsiLoading = {};
let warnedMissingValue;

async function lazyLoadLsi(libraryCode, language, importFn, callback) {
  if (lsiLoading[libraryCode]?.[language]) {
    // already loading, so just add next callback to batch
    lsiLoading[libraryCode][language].push(callback);
  } else {
    // init
    lsiLoading[libraryCode] ||= {};
    lsiLoading[libraryCode][language] = [callback];

    // lazy import lsi
    let libraryLsi;
    try {
      const lsi = await importFn(language);
      libraryLsi = lsi.default;
    } catch (e) {
      // logger.warn(`Lsi import for library "${libraryCode}" failed with language "${language}".`, e);

      const [lang1, lang2] = language.split("-");

      if (lang2) {
        try {
          const lsi = await importFn(lang1);
          libraryLsi = lsi.default;
        } catch (e2) {
          logger.warn(`Lsi import for library "${libraryCode}" failed with language "${lang1}".`, e);
        }
      }
    }

    // file does not exist, so take some language which is already loaded
    libraryLsi ||= Language.getItem(lsiStore[libraryCode], language);

    // extend by preset lsi
    if (typeof lsiConfig[libraryCode]?.import === "function") {
      try {
        const lsi = await lsiConfig[libraryCode].import(language);
        libraryLsi = Object.mergeDeep(libraryLsi, lsi.default);
      } catch (e) {
        logger.warn(`Preset Lsi import for library "${libraryCode}" failed with language "${language}".`);
      }
    }

    lsiStore[libraryCode][language] = libraryLsi;

    // trigger all callbacks
    Dom._batchedUpdates(() => {
      lsiLoading[libraryCode][language].forEach((cb) => cb(language));
    });

    // tear down
    delete lsiLoading[libraryCode][language];
    if (!Object.keys(lsiLoading[libraryCode]).length) delete lsiLoading[libraryCode];
  }
}

function useLazyLsi(importFn, path = []) {
  const libraryCode = importFn?.libraryCode;
  const libraryLsi = useMemo(() => {
    if (importFn) {
      if (!lsiStore[libraryCode]) {
        // init setting of default lsi per library
        lsiStore[libraryCode] = lsiDefault[libraryCode];

        // if default preset are set, merge them
        if (lsiConfig[libraryCode]?.data) {
          for (let lang in lsiConfig[libraryCode].data) {
            lsiStore[libraryCode][lang] = Object.mergeDeep(
              lsiStore[libraryCode][lang],
              lsiConfig[libraryCode].data[lang],
            );
          }
        }
      }
      return lsiStore[libraryCode];
    }
  }, [importFn, libraryCode]);

  // wanted language
  const [language] = useLanguage();

  // language that the hook's result was using during last render, i.e. the language that user
  // actually saw (gets reset to undefined after lsi gets lazy-loaded so that language is then chosen
  // without interference of last-rendered language, i.e. just like it would be at mount)
  const lastRenderedLanguageUntilNextLoadRef = useRef();

  // order of preference: `language` -> last rendered language (if `language` is loading) -> en -> first available in libraryLsi (-> final fallback to `language` again)
  // TODO Use updated Utils.Language.getItem() so that if we want e.g. "en" and "en-US" is available then we get that "en-US".
  let renderedLanguage = language;
  let lsiValue;
  if (libraryLsi) {
    let languageList = [
      language,
      lastRenderedLanguageUntilNextLoadRef.current,
      "en",
      Object.keys(libraryLsi)[0],
    ].filter(Boolean);
    for (let candidate of languageList) {
      if (libraryLsi[candidate]) {
        renderedLanguage = candidate;
        break;
      }
    }
    lsiValue = libraryLsi[renderedLanguage];
    if (lsiValue != null) {
      // find value by path of keys
      for (let i = 0; i < path.length; i++) {
        if (lsiValue === undefined) break;
        lsiValue = lsiValue[path[i]];
      }

      if (lsiValue == null) {
        if (process.env.NODE_ENV !== "production") {
          const warnKey = renderedLanguage + " " + path.join(".") + " " + libraryCode;
          if (!warnedMissingValue?.[warnKey]) {
            warnedMissingValue ??= {};
            warnedMissingValue[warnKey] = true;
            logger.warn(
              `Lsi value for language "${renderedLanguage}" for "${path.join(
                ".",
              )}" in library "${libraryCode}" was not found.`,
            );
          }
        }
        renderedLanguage = language;

        // find lsi value in fallback languages
        // this can happen if lsi value is missing for some language
        for (let j = 1; j < languageList.length; j++) {
          lsiValue = libraryLsi[languageList[j]];

          for (let i = 0; i < path.length; i++) {
            if (lsiValue === undefined) break;
            lsiValue = lsiValue[path[i]];
          }

          if (lsiValue != null) {
            renderedLanguage = languageList[j];
            break;
          }
        }
      }
    }
  }
  lastRenderedLanguageUntilNextLoadRef.current = renderedLanguage;

  // if language was changed and it was not loaded yet, load it and rerender the component
  const [, setRefresh] = useState(0);
  useLayoutEffect(() => {
    let cancelled;
    if (importFn && !libraryLsi[language]) {
      lazyLoadLsi(libraryCode, language, importFn, (lang) => {
        if (!cancelled) {
          lastRenderedLanguageUntilNextLoadRef.current = undefined;
          setRefresh((v) => v + 1);
        }
      });
    }
    return () => (cancelled = true);
  }, [language, importFn, libraryLsi, libraryCode]);

  return lsiValue;
}

export { useLazyLsi };
export default useLazyLsi;
