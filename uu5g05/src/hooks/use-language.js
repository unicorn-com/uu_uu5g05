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

import { makeHookOverridable } from "../_internal/uu5g04-integration-helpers.js";
import { useState, useEffect, useRef } from "./react-hooks.js";
import Language from "../utils/language.js";
import { useLanguageContext } from "../contexts/language-context.js";

let useLanguage = () => {
  let contextValue = useLanguageContext();

  // uu5g04 support
  const uu5g04ScopeRef = useRef();
  const [uu5g04State, setUu5g04State] = useState();
  useEffect(() => () => uu5g04ScopeRef.current?.onUnmount?.(), []);
  if (useLanguage._uu5g04Integrate) {
    contextValue = useLanguage._uu5g04Integrate(contextValue, uu5g04ScopeRef, uu5g04State, setUu5g04State);
  }

  let { language, setLanguage, direction } = contextValue;
  const [lang, setLang] = useState(() => Language.getLanguage());

  useEffect(() => {
    if (!language) {
      // NOTE Legacy Class components might have called setLanguage() in their componentDidMount() and
      // if they did, it got already processed without us knowing about it => check that the language
      // in our state is still the same and update it if it isn't (same string-value doesn't cause re-render).
      setLang(Language.getLanguage());
      const changeLanguage = ({ language }) => setLang(language);
      Language._register(changeLanguage);
      return () => Language._unregister(changeLanguage);
    }
  }, [language]);

  return [language || lang, setLanguage || Language.setLanguage, { direction }];
};

// TODO After releasing uu5g04 >= 1.58.13 and letting on-premises adopt it, we can remove `makeHookOverridable`
// as the newer uu5g04 no longer uses hook._override API.
// uu5g04 support; must be done here so that if g04 is loaded and does override, then e.g. g05 useLsi will use it too
useLanguage = makeHookOverridable(useLanguage);

export { useLanguage };
export default useLanguage;
