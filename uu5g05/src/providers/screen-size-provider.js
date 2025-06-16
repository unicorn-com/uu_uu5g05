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

import { useMemo } from "../hooks/react-hooks.js";
import createComponent from "../create-component/create-component.js";
import { useParentSize } from "../_internal/use-parent-size.js";
import PropTypes from "../prop-types.js";
import ScreenSize from "../utils/screen-size.js";
import Config from "../config/config.js";
import { ScreenSizeContext } from "../contexts/screen-size-context.js";
import useValueChange from "../hooks/use-value-change.js";

const ScreenSizeProvider = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ScreenSizeProvider",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    screenSize: PropTypes.oneOf(Object.keys(ScreenSize._SIZE_MAP)),
    onChange: PropTypes.func,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    screenSize: undefined,
    onChange: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children } = props;

    const onChange = typeof props.onChange === "function" ? (screenSize) => props.onChange({ screenSize }) : null;
    const [screenSize, setScreenSize] = useValueChange(props.screenSize, onChange);
    const { Resizer, width } = useParentSize();

    // screenSize prop:
    //   undefined <=> compute from element
    //   null <=> provide null (so that useScreenSize uses screen size)
    //   others <=> as-is
    const usedScreenSize =
      screenSize !== undefined ? screenSize : width != null ? ScreenSize.countSize(width) : undefined;
    const value = useMemo(
      () => (usedScreenSize ? { screenSize: usedScreenSize, setScreenSize } : null),
      [setScreenSize, usedScreenSize],
    );
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <>
        <Resizer />
        {usedScreenSize !== undefined ? (
          <ScreenSizeContext.Provider value={value}>
            {typeof children === "function" ? children(value) : children}
          </ScreenSizeContext.Provider>
        ) : null}
      </>
    );
    //@@viewOff:render
  },
});

export { ScreenSizeProvider };
export default ScreenSizeProvider;
