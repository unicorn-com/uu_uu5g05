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

const fs = require("fs");

async function run() {
  // remove uu5g05-elements-gds from externals (it must not be in .tgz's package.json)
  // NOTE We can't do this in prepackage step because that step gets executed sooner than prebuild step
  // (and prebuild needs to add uu5g05-elements-gds to externals).
  if (!process.env.WATCH) console.log("Fixing externals for 'package' step.");
  let pkgJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));
  delete pkgJson.uuBuildSettings.externals["uu5g05-elements-gds"];

  // also remove information about built uu5g05-elements-gds (so that libraries depending on uu5g05-elements
  // don't automatically include -gds in their library descriptors)
  pkgJson.uuBuildSettings.packs = pkgJson.uuBuildSettings.packs.filter(
    (it) => it.libraryGlobalVariable !== "Uu5ElementsGds"
  );

  fs.writeFileSync("package.json", JSON.stringify(pkgJson, null, 2) + "\n", "utf-8");
}

run();
