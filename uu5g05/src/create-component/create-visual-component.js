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

import PropTypes from "../prop-types.js";
import createComponent from "./create-component.js";
import createComponentWithRef from "./create-component-with-ref.js";
import NestingLevel, { DEPRECATED_VALUES } from "../utils/nesting-level.js";
import { useMemo, useRef } from "../hooks/react-hooks.js";

const VISUAL_PROP_TYPES = Object.freeze({
  id: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  disabled: PropTypes.bool,
  hidden: PropTypes.bool,
  elementAttrs: PropTypes.object,
  elementRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  fullTextSearchPriority: PropTypes.oneOf([0, 1, 2, 3, 4, 5]),
  noPrint: PropTypes.bool,
  nestingLevel: PropTypes.oneOf(NestingLevel.valueList.concat(DEPRECATED_VALUES)),
});

const VISUAL_DEFAULT_PROPS = Object.freeze({
  id: undefined,
  className: undefined,
  style: undefined,
  disabled: undefined,
  hidden: undefined,
  elementAttrs: undefined,
  elementRef: undefined,
  fullTextSearchPriority: undefined,
  noPrint: undefined,
  nestingLevel: undefined,
  testId: undefined,
});

function asArray(valueOrList) {
  return valueOrList == null ? [] : Array.isArray(valueOrList) ? valueOrList : [valueOrList];
}

function createVisualComponent(
  component,
  isRef = false /*, { skipColorSchemaCheck, skipNestingLevelDeprecationCheck } = {} */,
) {
  const componentCfg = {
    ...component,
    propTypes: { ...VISUAL_PROP_TYPES, ...component.propTypes },
    defaultProps: { ...VISUAL_DEFAULT_PROPS, ...component.defaultProps },
  };

  if (process.env.NODE_ENV === "development") {
    const render = componentCfg.render;
    if (render) {
      const opts = arguments[2];
      let deprecatedValues;
      if (
        !opts?.skipNestingLevelDeprecationCheck &&
        (deprecatedValues = asArray(componentCfg.nestingLevel).filter((it) => DEPRECATED_VALUES.includes(it))).length
      ) {
        Promise.resolve().then(() => {
          Comp.logger.warn(
            `Deprecated value(s) in static 'nestingLevel' field detected - ${JSON.stringify(
              deprecatedValues.length > 1 ? deprecatedValues : deprecatedValues[0],
            )}. Allowed values: ${JSON.stringify(NestingLevel.valueList)}`,
          );
        });
      }
      const doRender = (props, ...args) => {
        let warnedColorSchemaRef = useRef(opts?.skipColorSchemaCheck); // eslint-disable-line uu5/hooks-rules
        if (!warnedColorSchemaRef.current && "colorSchema" in props) {
          warnedColorSchemaRef.current = true;
          Comp.logger.warn(
            `Legacy prop 'colorSchema=${props.colorSchema}' detected. Did you mean 'colorScheme'? Note that uu5g05 uses uuGds color schemes, some of which differ from uu5g04's.`,
          );
        }

        // NOTE Must use memo otherwise it breaks all optimizations (e.g. Utils.Component.memo() components).
        // eslint-disable-next-line uu5/hooks-rules
        let elementAttrs = useMemo(() => {
          let dataName = component.uu5Tag;
          let propsDataName = props.elementAttrs?.["data-name"] || props.mainAttrs?.["data-name"];
          if (propsDataName) dataName = propsDataName + " -> " + dataName;

          // TODO remove mainAttrs
          return { "data-name": dataName, ...(props.elementAttrs || props.mainAttrs) };
        }, [props.elementAttrs, props.mainAttrs]);
        // eslint-disable-next-line uu5/hooks-rules
        let resultProps = useMemo(() => ({ ...props, elementAttrs }), [elementAttrs, props]);
        return render(resultProps, ...args);
      };
      // NOTE Must use explicitly named arguments, not ...args, because React checks for render.length
      // and with `(props, ...args) => {}` the render.length is 1 (because ...args gets transpiled into
      // a piece of code using "arguments", as if render was `(props) => {}`) and React then warns about
      // not using "ref".
      componentCfg.render = isRef ? (props, ref) => doRender(props, ref) : (props) => doRender(props);
    }
  }

  const Comp = isRef ? createComponentWithRef(componentCfg) : createComponent(componentCfg);
  Comp.uu5ComponentType = "visualComponent";

  return Comp;
}

createVisualComponent.propTypes = VISUAL_PROP_TYPES;
createVisualComponent.defaultProps = VISUAL_DEFAULT_PROPS;

export { createVisualComponent };
export default createVisualComponent;
