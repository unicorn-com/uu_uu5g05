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
import Language from "./language";

class Lsi {
  static config = {};
  static default = {};
  static store = {};

  static setDefaultLsi(libraryCode, defaultLsi) {
    Lsi.store[libraryCode] = defaultLsi;
    Lsi.default[libraryCode] = defaultLsi;
  }

  static getMessage(lsi, language) {
    let message;

    if (lsi.import) {
      let lsiValue = Language.getItem(Lsi.store[lsi.import.libraryCode], language);
      // find value by path of keys
      for (let i = 0; i < lsi.path.length; i++) {
        if (lsiValue === undefined) break;
        lsiValue = lsiValue[lsi.path[i]];
      }
      message = lsiValue;
    } else {
      message = Language.getItem(lsi, language);
    }

    return message;
  }

  // addLibraryLsi(libraryCode, defaultLsi, importFn) {
  //   Lsi.config[libraryCode] = { data: defaultLsi, import: importFn };
  // },
}

export { Lsi };
export default Lsi;
