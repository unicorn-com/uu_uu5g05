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

import Style from "./style.js";
import UtilsCss from "./css.js";
import Config from "../config/config.js";

const Css = {
  noPrint: () => Config.Css.css({ "@media print": { display: "none !important" } }),
};

const VisualComponent = {
  getAttrs(props, defaultClassName) {
    return VisualComponent.splitProps(props, defaultClassName)[0];
  },

  splitProps(props, defaultClassName) {
    let attrs = {};
    // TODO Remove mainAttrs.
    let {
      id,
      className,
      noPrint,
      style,
      disabled,
      hidden,
      elementRef,
      elementAttrs,
      mainAttrs,
      fullTextSearchPriority,
      testId,
      ...componentProps
    } = props;
    elementAttrs ||= mainAttrs;

    // id
    if (id != null) attrs.id = id + "";

    // className & fullTextSearchPriority & noPrint
    let newClassName = UtilsCss.joinClassName(
      defaultClassName,
      typeof fullTextSearchPriority === "number" ? "uu-fulltextsearch-" + fullTextSearchPriority : undefined,
      noPrint ? Css.noPrint() : undefined,
      typeof className === "string" ? className : undefined,
    );
    if (newClassName) attrs.className = newClassName;

    // style
    let reactStyle = style && typeof style === "string" ? Style.parse(style) : style;
    if (reactStyle) attrs.style = reactStyle;

    // disabled
    if (typeof disabled === "boolean") attrs.disabled = disabled;
    // hidden
    if (typeof hidden === "boolean") attrs.hidden = hidden;

    // elementRef
    if (elementRef) attrs.ref = elementRef;

    // elementAttrs
    if (elementAttrs) {
      let { className, style, ...newElementAttrs } = elementAttrs;
      attrs = { ...newElementAttrs, ...attrs };
    }

    // testId
    if (testId) {
      attrs["data-testid"] = testId;
    }

    delete attrs.dangerouslySetInnerHTML;

    const result = [attrs, componentProps];

    result.elementAttrs = attrs;
    result.elementProps = {
      id,
      className: UtilsCss.joinClassName(className, defaultClassName),
      noPrint,
      style,
      disabled,
      hidden,
      elementRef,
      elementAttrs,
      fullTextSearchPriority,
      testId,
    };
    result.componentProps = componentProps;

    return result;
  },
};

export { VisualComponent };
export default VisualComponent;
