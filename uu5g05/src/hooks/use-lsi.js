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

import useLanguage from "./use-language.js";
import Language from "../utils/language.js";
import useLazyLsi from "../_internal/use-lazy-lsi.js";

function _useLsi(lsi) {
  const [language] = useLanguage();
  return lsi && typeof lsi === "object" ? Language.getItem(lsi, language) : lsi;
}

function useLsi(lsi, path = undefined) {
  let importFn;
  if (typeof lsi === "function") {
    importFn = lsi;
    lsi = null;
  } else if (typeof lsi === "object" && lsi?.import) {
    importFn = lsi.import;
    path = lsi.path;
    lsi = null;
  }

  const syncValue = _useLsi(lsi);
  const asyncValue = useLazyLsi(importFn, path);

  return syncValue || asyncValue;
}

export { useLsi };
export default useLsi;
