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

import { useMemo, useEffect, useRef, useState } from "../hooks/react-hooks.js";
import createComponent from "../create-component/create-component.js";
import PropTypes from "../prop-types.js";
import Language from "../utils/language.js";
import Config from "../config/config.js";
import LanguageContext, { useLanguageContext } from "../contexts/language-context.js";
import useLanguageList from "../hooks/use-language-list.js";
import useUserPreferences from "../hooks/use-user-preferences.js";
import useValueChange from "../hooks/use-value-change.js";
import { userPreferencesContextDefaultValues } from "../contexts/user-preferences-context.js";

const LanguageProvider = createComponent({
  uu5Tag: Config.TAG + "LanguageProvider",

  propTypes: {
    language: PropTypes.string,
    onChange: PropTypes.func,
  },

  defaultProps: {
    language: undefined,
    onChange: undefined,
  },

  render(props) {
    const { children } = props;
    const [languageList] = useLanguageList();
    const [userPreferences] = useUserPreferences();
    const userLanguageList = userPreferences?.languageList || [];

    let [initialLanguage] = useState(() => props.language || Language.getLanguage());

    // controlled => always use just controlled language (props.language), with onChange if it isn't in languageList
    // !controlled => explicit language > auto language (languageList+userLanguageList+prevLanguage)
    const isControlled = typeof props.onChange === "function";
    const onChange = isControlled
      ? (newLanguage) => {
          let limitedLanguage = limitByLanguageList(
            newLanguage,
            languageList,
            userLanguageList,
            // eslint-disable-next-line no-use-before-define
            language,
            initialLanguage,
          );
          props.onChange({ language: limitedLanguage });
        }
      : null;
    let [explicitOrControlledLanguage, setExplicitOrControlledLanguage] = useValueChange(
      isControlled ? props.language || initialLanguage : props.language,
      onChange,
    );

    let prevLanguageRef = useRef(initialLanguage);
    let prevLanguage = prevLanguageRef.current;
    useEffect(() => {
      // eslint-disable-next-line no-use-before-define
      prevLanguageRef.current = language;
    });

    let language = limitByLanguageList(
      explicitOrControlledLanguage,
      languageList,
      userLanguageList,
      prevLanguage,
      initialLanguage,
    );
    if (explicitOrControlledLanguage && language !== explicitOrControlledLanguage) {
      if (!isControlled) setExplicitOrControlledLanguage(language);
    }

    useEffect(() => {
      if (explicitOrControlledLanguage && language !== explicitOrControlledLanguage) {
        // change in effect (useValueChange's setExplicitOrControlledLanguage() will call onChange, i.e. it changes state of other component)
        if (isControlled) setExplicitOrControlledLanguage(language);
      }
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [explicitOrControlledLanguage, language]);

    const value = useMemo(() => {
      const direction = /^(ar|fa|he|iw|kd|pk|ps|ug|ur|yi)/.test(language) ? "rtl" : "ltr";
      return {
        language,
        setLanguage: setExplicitOrControlledLanguage,
        direction,
      };
    }, [language, setExplicitOrControlledLanguage]);

    // uu5g04 integration
    let parentContextValue = useLanguageContext();
    const uu5g04ScopeRef = useRef();
    useEffect(() => () => uu5g04ScopeRef.current?.onUnmount?.(), []);
    if (LanguageProvider._uu5g04Integrate) {
      LanguageProvider._uu5g04Integrate(value, parentContextValue, uu5g04ScopeRef);
    }

    return (
      <LanguageContext.Provider value={value}>
        {typeof children === "function" ? children(value) : children}
      </LanguageContext.Provider>
    );
  },
});

function limitByLanguageList(explicitLanguage, languageList, userLanguageList, currentLanguage, initialLanguage) {
  let result;
  if (explicitLanguage) {
    result = getLimitedLanguage(languageList, [explicitLanguage], currentLanguage);
    if (result !== explicitLanguage) result = null; // fall back to auto-computation based on intersection of app+user languageList-s
  }
  if (!result) {
    // automatic language computation - always take the 1st user's language (that intersects with app languageList),
    // with fallback to last-used language (prevLanguage)
    let usedUserLanguageList;
    if (userLanguageList === userPreferencesContextDefaultValues.userPreferences.languageList) {
      // if user language list was not set, prefer Utils.Language.getLanguage() before default user language list
      usedUserLanguageList = [initialLanguage, ...userLanguageList];
    } else {
      usedUserLanguageList = userLanguageList;
    }
    result = getLimitedLanguage(languageList, usedUserLanguageList, currentLanguage);
  }
  return result;
}

function getLimitedLanguage(languageList, wantedLanguageList, currentLanguage = undefined) {
  let result;
  if (Array.isArray(languageList)) {
    let languageMap = {};
    for (let lang of languageList) {
      if (typeof lang === "string") {
        languageMap[lang] = lang;
      } else if (lang?.code) {
        languageMap[lang.code] = lang.code;
      }
    }
    result = Language.getItem(
      languageMap,
      wantedLanguageList.join(",") + (currentLanguage ? "," + currentLanguage : ""),
    );
  } else {
    result = wantedLanguageList?.[0];
  }
  return result;
}

export { LanguageProvider };
export default LanguageProvider;
