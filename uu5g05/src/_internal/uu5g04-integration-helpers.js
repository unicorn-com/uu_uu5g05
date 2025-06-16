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

// NOTE This file can be removed when support for g04 will be dropped.

// some uu5g05 hooks need to be overridable in uu5g04 so that interoperability with legacy mixins
// work correctly (e.g. useLevel vs UU5.Common.LevelMixin)
// =>
// 1. allow specifying "_override" key and if it is set then use it instead of g05 hook, otherwise use standard g05 hook
//    (if uu5g04 gets loaded, it'll set it)
// 2. g04 will need raw access to the context (custom Provider) so we'll have to export it (but will do so in ~private field)
function makeHookOverridable(hook) {
  let useOverridableHook = function (...args) {
    let fn = useOverridableHook._override;
    if (fn) return fn(hook, ...args);
    return hook(...args);
  };
  return useOverridableHook;
}

export { makeHookOverridable };
