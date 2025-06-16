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
import LanguageListContext from "../contexts/language-list-context.js";
import useValueChange from "../hooks/use-value-change.js";

const LanguageListProvider = createComponent({
  uu5Tag: Config.TAG + "LanguageListProvider",

  propTypes: {
    languageList: PropTypes.arrayOf(PropTypes.string),
    onChange: PropTypes.func,
  },

  defaultProps: {
    languageList: undefined,
    onChange: undefined,
  },

  render(props) {
    const { children } = props;

    const onChange = typeof props.onChange === "function" ? (languageList) => props.onChange({ languageList }) : null;
    const [languageList, setLanguageList] = useValueChange(props.languageList, onChange);

    const value = useMemo(() => ({ languageList, setLanguageList }), [languageList, setLanguageList]);

    return (
      <LanguageListContext.Provider value={value}>
        {typeof children === "function" ? children(value) : children}
      </LanguageListContext.Provider>
    );
  },
});

export { LanguageListProvider };
export default LanguageListProvider;
