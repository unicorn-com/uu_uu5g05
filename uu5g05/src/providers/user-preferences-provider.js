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
import UserPreferencesContext, { userPreferencesContextDefaultValues } from "../contexts/user-preferences-context.js";
import useValueChange from "../hooks/use-value-change.js";
import useMemoObject from "../hooks/use-memo-object.js";
import UtilsObject from "../utils/object.js";
import useUserPreferencesCustomData from "../hooks/use-user-preferences-custom-data.js";

//@@viewOff:imports

function setDefaults(obj) {
  for (let k in obj) if (obj[k] == null) obj[k] = userPreferencesContextDefaultValues.userPreferences[k];
  return obj;
}

const UserPreferencesProvider = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "UserPreferencesProvider",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    timeZone: PropTypes.string,
    shortDateFormat: PropTypes.string,
    mediumDateFormat: PropTypes.string,
    longDateFormat: PropTypes.string,
    weekStartDay: PropTypes.number,
    hourFormat: PropTypes.oneOf([12, 24, "12", "24"]),
    languageList: PropTypes.arrayOf(PropTypes.string),
    numberGroupingSeparator: PropTypes.string,
    numberDecimalSeparator: PropTypes.string,
    currency: PropTypes.string,
    currencyGroupingSeparator: PropTypes.string,
    currencyDecimalSeparator: PropTypes.string,
    onChange: PropTypes.func,
    getCustomData: PropTypes.func,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    timeZone: userPreferencesContextDefaultValues.userPreferences.timeZone,
    shortDateFormat: userPreferencesContextDefaultValues.userPreferences.shortDateFormat,
    mediumDateFormat: userPreferencesContextDefaultValues.userPreferences.mediumDateFormat,
    longDateFormat: userPreferencesContextDefaultValues.userPreferences.longDateFormat,
    weekStartDay: userPreferencesContextDefaultValues.userPreferences.weekStartDay,
    hourFormat: userPreferencesContextDefaultValues.userPreferences.hourFormat,
    languageList: userPreferencesContextDefaultValues.userPreferences.languageList,
    numberGroupingSeparator: userPreferencesContextDefaultValues.userPreferences.numberGroupingSeparator,
    numberDecimalSeparator: userPreferencesContextDefaultValues.userPreferences.numberDecimalSeparator,
    currency: userPreferencesContextDefaultValues.userPreferences.currency,
    currencyGroupingSeparator: userPreferencesContextDefaultValues.userPreferences.currencyGroupingSeparator,
    currencyDecimalSeparator: userPreferencesContextDefaultValues.userPreferences.currencyDecimalSeparator,
    onChange: undefined,
    getCustomData: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children } = props;
    const propsUserPreferences = useMemoObject(
      setDefaults({
        timeZone: props.timeZone,
        shortDateFormat: props.shortDateFormat,
        mediumDateFormat: props.mediumDateFormat,
        longDateFormat: props.longDateFormat,
        weekStartDay: props.weekStartDay,
        hourFormat: props.hourFormat,
        languageList: props.languageList,
        numberGroupingSeparator: props.numberGroupingSeparator,
        numberDecimalSeparator: props.numberDecimalSeparator,
        currency: props.currency,
        currencyGroupingSeparator: props.currencyGroupingSeparator,
        currencyDecimalSeparator: props.currencyDecimalSeparator,
      }),
      UtilsObject.shallowEqual,
    );
    const [userPreferences, setUserPreferences] = useValueChange(propsUserPreferences, props.onChange);

    let { get: getCustomData } = useUserPreferencesCustomData();
    if (props.getCustomData != null) getCustomData = props.getCustomData;

    const value = useMemo(() => {
      let up = userPreferences;
      if (typeof userPreferences.hourFormat === "string") {
        up = {
          ...userPreferences,
          hourFormat: +userPreferences.hourFormat,
        };
      }

      return {
        userPreferences: up,
        setUserPreferences,
        getCustomData,
      };
    }, [setUserPreferences, userPreferences, getCustomData]);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <UserPreferencesContext.Provider value={value}>
        {typeof children === "function" ? children(value) : children}
      </UserPreferencesContext.Provider>
    );
    //@@viewOff:render
  },
});

export { UserPreferencesProvider };
export default UserPreferencesProvider;
