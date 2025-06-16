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

import React from "react";
import ReactDOM from "react-dom";
import useLanguage from "./hooks/use-language.js";
import LanguageContext from "./contexts/language-context.js";
import useLevel from "./hooks/use-level.js";
import LevelContext from "./contexts/level-context.js";
import useScreenSize from "./hooks/use-screen-size.js";
import ScreenSizeContext from "./contexts/screen-size-context.js";
import useTimeZone from "./hooks/use-time-zone.js";
import TimeZoneContext from "./contexts/time-zone-context.js";
import useSession from "./hooks/use-session.js";
import SessionContext from "./contexts/session-context.js";
import { sessionHolder } from "./providers/session-provider.js";
import useUserPreferences from "./hooks/use-user-preferences.js";
import UserPreferencesContext from "./contexts/user-preferences-context.js";
import useRouteLeave from "./hooks/use-route-leave.js";
import RouteLeaveContext from "./contexts/route-leave-context.js";
import useRoute from "./hooks/use-route.js";
import RouteContext from "./contexts/route-context.js";
import {
  useDynamicLibraryComponent,
  getComponentByName,
  loadComponentByName,
} from "./hooks/use-dynamic-library-component.js";
import checkTag from "./_internal/check-tag.js";

// provide fns for dynamic library component handling to uu5g04
useDynamicLibraryComponent._getComponentByName = getComponentByName;
useDynamicLibraryComponent._loadComponentByName = loadComponentByName;
useDynamicLibraryComponent._checkTag = checkTag;

function defineContext(hook, Context) {
  Object.defineProperty(hook, "_context", {
    value: Context,
    enumerable: false,
  });
  return hook;
}
const useLanguageUpdated = defineContext(useLanguage, LanguageContext);
const useLevelUpdated = defineContext(useLevel, LevelContext);
const useScreenSizeUpdated = defineContext(useScreenSize, ScreenSizeContext); // no need to be overridable
const useTimeZoneUpdated = defineContext(useTimeZone, TimeZoneContext); // no need to be overridable
const useSessionUpdated = defineContext(useSession, SessionContext); // no need to be overridable
const useUserPreferencesUpdated = defineContext(useUserPreferences, UserPreferencesContext); // no need to be overridable
const useRouteLeaveUpdated = defineContext(useRouteLeave, RouteLeaveContext); // no need to be overridable
const useRouteUpdated = defineContext(useRoute, RouteContext); // no need to be overridable

Object.defineProperty(useSessionUpdated, "_sessionHolder", {
  value: sessionHolder,
  enumerable: false,
});

// !!! If anything is added here, make sure to add it to exports.js too.
export { useLanguageUpdated as useLanguage };
export { useLevelUpdated as useLevel };
export { useScreenSizeUpdated as useScreenSize };
export { useTimeZoneUpdated as useTimeZone };
export { useSessionUpdated as useSession };
export { useUserPreferencesUpdated as useUserPreferences };
export { useRouteLeaveUpdated as useRouteLeave };
export { useRouteUpdated as useRoute };
export { useDynamicLibraryComponent };
export { React as _react }; // uu5g04 needs to access React.Component, React.PureComponent, React.version
export { ReactDOM as _reactDom }; // uu5g04 needs to polyfill ReactDOM.findDOMNode for React >= 19
