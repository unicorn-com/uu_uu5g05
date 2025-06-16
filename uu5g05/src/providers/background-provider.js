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
import PropTypes from "../prop-types.js";
import Config from "../config/config.js";
import BackgroundContext from "../contexts/background-context.js";

const BackgroundProvider = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "BackgroundProvider",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    background: PropTypes.background,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    background: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { background, children } = props;
    const contextValue = useMemo(() => ({ background }), [background]);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <BackgroundContext.Provider value={contextValue}>
        {typeof children === "function" ? children(contextValue) : children}
      </BackgroundContext.Provider>
    );
    //@@viewOff:render
  },
});

export { BackgroundProvider };
export default BackgroundProvider;
