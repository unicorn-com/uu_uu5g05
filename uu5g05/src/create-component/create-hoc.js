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
import createComponent from "./create-component.js";
import createComponentWithRef from "./create-component-with-ref.js";
import Element from "../utils/element.js";
import UtilsComponent from "../utils/component.js";

function createHoc(args, isRef = false) {
  let { getProps, component: Component, ...comp } = args;

  if (typeof getProps !== "function") {
    const msg = 'Function "getProps" is missing.';
    console.error(msg, args);
    throw msg;
  } else if (!Component) {
    const msg = "Component is missing.";
    console.error(msg, args);
    throw msg;
  } else if (Element.isValid(Component)) {
    const msg = `Component is an element like <Component />. Set component without <>.`;
    console.error(msg, args);
    throw msg;
  }

  comp = {
    ...comp,
    render(...params) {
      return <Component {...getProps(...params)} />;
    },
  };

  const Comp = (isRef ? createComponentWithRef : createComponent)(comp);

  UtilsComponent.mergeStatics(Comp, Component);
  Comp.uu5ComponentType = Component.uu5ComponentType;

  return Comp;
}

export { createHoc };
export default createHoc;
