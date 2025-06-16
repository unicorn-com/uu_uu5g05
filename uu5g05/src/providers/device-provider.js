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

import React from "react";
import { useMemo } from "../hooks/react-hooks.js";
import createComponent from "../create-component/create-component.js";
import PropTypes from "../prop-types.js";
import Config from "../config/config.js";
import { DeviceContext } from "../contexts/device-context.js";
import getDeviceConstantValues from "../_internal/get-device-constant-values.js";

const DeviceProvider = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "DeviceProvider",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    browserName: PropTypes.string,
    platform: PropTypes.string,
    hasTouch: PropTypes.bool,
    hasPointer: PropTypes.bool,
    orientation: PropTypes.oneOf([
      "portrait-primary",
      "portrait-secondary",
      "landscape-primary",
      "landscape-secondary",
    ]),
    isWebView: PropTypes.bool,
    isHeadless: PropTypes.bool,
    isMobileOrTablet: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    browserName: undefined,
    platform: undefined,
    hasTouch: undefined,
    hasPointer: undefined,
    orientation: undefined,
    isWebView: undefined,
    isHeadless: undefined,
    isMobileOrTablet: undefined,
  },
  //@@viewOff:defaultProps

  render({
    browserName,
    platform,
    hasTouch,
    hasPointer,
    orientation,
    isWebView,
    isHeadless,
    isMobileOrTablet,
    children,
  }) {
    //@@viewOn:private
    const value = useMemo(() => {
      let constantValues = getDeviceConstantValues();
      let result = {
        browserName,
        platform,
        hasTouch,
        hasPointer,
        orientation,
        isWebView,
        isHeadless,
        isMobileOrTablet,
      };
      for (let k in result) {
        if (result[k] === undefined) result[k] = constantValues[k];
      }
      return result;
    }, [browserName, hasPointer, hasTouch, isHeadless, isMobileOrTablet, isWebView, orientation, platform]);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <DeviceContext.Provider value={value}>
        {typeof children === "function" ? children(value) : children}
      </DeviceContext.Provider>
    );
    //@@viewOff:render
  },
});

Object.defineProperty(DeviceProvider, "device", {
  get: () => getDeviceConstantValues(),
});

export { DeviceProvider };
export default DeviceProvider;
