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

import { createComponent, PropTypes, useMemo } from "uu5g05";
import UuGds from "./_internal/gds.js";
import Config from "./config/config.js";
import SpacingContext from "./spacing-context.js";

const SpacingProvider = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SpacingProvider",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    type: PropTypes.oneOf(["tight", "normal", "loose"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    type: "normal",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { type, children } = props;

    const value = useMemo(() => {
      const values = UuGds.getValue(["SpacingPalette", "adaptive", type]);
      return {
        // BACKWARD COMPATIBILITY with uu5g05 1.6.x
        spaceA: values.d,
        spaceB: values.c,
        spaceC: values.b,
        spaceD: values.a,
        ...values,
        type,
      };
    }, [type]);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <SpacingContext.Provider value={value}>
        {typeof children === "function" ? children(value) : children}
      </SpacingContext.Provider>
    );
    //@@viewOff:render
  },
});

export { SpacingProvider };
export default SpacingProvider;
