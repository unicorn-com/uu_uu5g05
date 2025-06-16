/**
 * Copyright (C) 2020 Unicorn a.s.
 *
 * This program is free software; you can use it under the terms of the UAF Open License v01 or
 * any later version. The text of the license is available in the file LICENSE or at www.unicorn.com.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even
 * the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See LICENSE for more details.
 *
 * You may contact Unicorn a.s. at address: V Kapslovne 2767/2, Praha 3, Czech Republic or
 * at the email: info@unicorn.com.
 */

//@@viewOn:imports
import { useMemo } from "../hooks/react-hooks.js";
import createComponent from "../create-component/create-component.js";
import PropTypes from "../prop-types.js";
import Config from "../config/config.js";
import TimeZoneContext from "../contexts/time-zone-context.js";
import useValueChange from "../hooks/use-value-change.js";
import useUserPreferences from "../hooks/use-user-preferences.js";
//@@viewOff:imports

const TimeZoneProvider = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TimeZoneProvider",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    timeZone: PropTypes.string,
    onChange: PropTypes.func,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    timeZone: undefined,
    onChange: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children } = props;
    const [{ timeZone: userPrefTimeZone }] = useUserPreferences();

    const onChange = typeof props.onChange === "function" ? (timeZone) => props.onChange({ timeZone }) : null;
    const [tz, setTimeZone] = useValueChange(props.timeZone, onChange);

    const timeZone = tz || userPrefTimeZone;
    const value = useMemo(() => ({ timeZone, setTimeZone }), [timeZone, setTimeZone]);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <TimeZoneContext.Provider value={value}>
        {typeof children === "function" ? children(value) : children}
      </TimeZoneContext.Provider>
    );
    //@@viewOff:render
  },
});

export { TimeZoneProvider };
export default TimeZoneProvider;
