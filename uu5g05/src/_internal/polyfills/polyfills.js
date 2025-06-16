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

import regeneratorRuntime from "regenerator-runtime/runtime"; // support for async/await (if changed, search other appearances in the whole project!)

// show error if a library tries to use regeneratorRuntime
const warnedRegeneratorRuntimeMap = {};
const regeneratorRuntimeWithError = new Proxy(regeneratorRuntime, {
  get(target, property, receiver) {
    let stack = new Error("Aaa").stack;
    let relevantLine = stack
      .split("\n")
      .slice(1)
      .find((it) => /https?:/.test(it) && !/uu5g05/.test(it));
    if (relevantLine) {
      let fullUrl = relevantLine.replace(/^.*?(http?s:.*?\.js).*$/, "$1");
      if (fullUrl !== relevantLine) {
        let parts = fullUrl.split("/", 5); // e.g. https://cdn.plus4u.net/uu-plus4upeopleg01/1.5.0
        let versionRoot = parts.join("/");
        if (!warnedRegeneratorRuntimeMap[versionRoot]) {
          warnedRegeneratorRuntimeMap[versionRoot] = true;
          let [, , , library, version] = parts;
          console.error(
            `Detected usage of regenerator-runtime from library ${library} ${version?.replace(
              /\.0\.0$/,
              ".x",
            )}. The library must be rebuilt using uu_appg01_devkit >= 5.9.0 or it might stop working on production soon.`,
            { library, file: fullUrl },
          );
        }
      }
    }
    return target[property];
  },
});

if (typeof global !== "undefined") global.regeneratorRuntime = regeneratorRuntimeWithError;
else if (typeof window !== "undefined") window.regeneratorRuntime = regeneratorRuntimeWithError;
