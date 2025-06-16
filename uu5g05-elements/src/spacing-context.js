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

import { Utils } from "uu5g05";
import UuGds from "./_internal/gds.js";

const values = UuGds.getValue(["SpacingPalette", "adaptive", "normal"]);

const [SpacingContext, useSpacingContext] = Utils.Context.create({
  type: "normal",
  // BACKWARD COMPATIBILITY with uu5g05 1.6.x
  spaceA: values.d,
  spaceB: values.c,
  spaceC: values.b,
  spaceD: values.a,
  ...values,
});

export { SpacingContext, useSpacingContext };
export default SpacingContext;
