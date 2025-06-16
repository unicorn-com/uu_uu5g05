import { Fragment } from "react";
import { Uu5String as Uu5Stringg01 } from "uu5stringg01";
import { sessionHolder } from "../providers/session-provider.js";
import findComponent from "../_internal/find-component.js";
import ErrorComponent from "../_internal/error.js";
import LsiBasic from "../_internal/lsi-basic.js";
import Lsi from "../config/lsi.js";
import { textEntityDisabled } from "../uu5-environment.js";
import Environment from "../environment.js";
import Element from "./element.js";

const PARENT_REGEXP = /^parent(?:\.([a-zA-Z0-9_$]+(?:\.[a-zA-Z0-9_$]+)*))?$/;
const CHILD_TO_JSX_FN = Symbol("childToJsxFn");
const IS_FAAC_EXPRESSION = Symbol("isFaacExpression");
const REQUIRED_PARENT_STACK_SIZE = Symbol("requiredParentStackSize");
const IS_FAAC_PARENT_STACK = Symbol("faacParentStack");

// add extra template data
const EXTRA_TEMPLATE_DATA = {
  userName: () => {
    let { session } = sessionHolder;
    return session && session.identity ? session.identity.name : "";
  },
  userEmail: () => {
    let { session } = sessionHolder;
    return session?.session?.getAttribute?.("email") ?? "";
  },
  parent: (defaultValue, keyPath = ["parent"], context) => {
    // this template expression is recognized only inside of a prop value and the whole prop value must
    // contain only the expression itself (there must be nothing else there)
    if (context && (context.location !== "prop" || context.matchValue !== context.value)) {
      return context.matchValue;
    }

    let fullPath = keyPath.join(".");
    let originalExpression = "${" + fullPath + (defaultValue != null ? ":" + defaultValue : "") + "}";
    let match = fullPath.match(PARENT_REGEXP);
    let result;
    if (match) {
      result = { subkey: match[1] };
      result.toString = () => originalExpression; // for parsedUu5String.toString() / editable modes
      result[IS_FAAC_EXPRESSION] = true;
      let i = 0;
      while (keyPath[i] === "parent") i++;
      result[REQUIRED_PARENT_STACK_SIZE] = i;
    } else {
      result = originalExpression;
    }
    return result;
  },
};

// mark these extra templates as NOT supporting "copySoft" and "copyHard" template strategies (so they'll be simply preserved as-is)
for (let k in EXTRA_TEMPLATE_DATA) EXTRA_TEMPLATE_DATA[k].supportedStrategyList = [];

const G05_FACTORY = {
  createString(...args) {
    // eslint-disable-next-line no-use-before-define
    return new Uu5String(...args);
  },
  createObject(...args) {
    // eslint-disable-next-line no-use-before-define
    return new Uu5StringObject(...args);
  },
  createProps(...args) {
    // eslint-disable-next-line no-use-before-define
    return new Uu5StringProps(...args);
  },
};

// override _textEntityMap.replace() to take into account Environment setting
const origTextEntityMapReplace = Uu5Stringg01._textEntityMap.replace;
Uu5Stringg01._textEntityMap.replace = function (text) {
  return textEntityDisabled ? text : origTextEntityMapReplace.apply(this, arguments);
};

function buildChildFnPre(componentNameOrTag, props, children, ...args) {
  // uu5g04 integration; must be here (or in uu5stringg01), not in uu5g04, so that using uu5g05 Utils.Uu5String API handles
  // uu5strings with unwanted combination of Loader props too
  if (
    (componentNameOrTag === "UU5.Bricks.Loader" || componentNameOrTag === "UU5.Common.Loader") &&
    props?.method != null &&
    props?.method?.toUpperCase?.() !== "GET"
  ) {
    children = [
      <LsiBasic
        key="0"
        lsi={Lsi.uu5String.invalidTagAttr}
        params={[componentNameOrTag, "method", props?.method + ""]}
      />,
    ];
    componentNameOrTag = window.UU5?.Bricks ? "UU5.Bricks.Error" : ErrorComponent;
    props = {};
  }

  return [componentNameOrTag, props, children, ...args];
}

function getBuildChildFn(opts) {
  let fn =
    opts?.buildChildFn !== undefined
      ? typeof opts.buildChildFn === "function"
        ? opts.buildChildFn
        : (uu5Tag, props, children) => ({ uu5Tag, tag: uu5Tag, props, children })
      : findComponentWithKey;
  return (...args) => fn(...buildChildFnPre(...args));
}

function recurseArray(array, itemCallback) {
  return array.map((it) => (Array.isArray(it) ? recurseArray(it, itemCallback) : itemCallback(it)));
}
function findComponentWithKey(componentNameOrTag, props, children, context) {
  if (context && props?.key === undefined && context.index != null) {
    props = { ...props, key: props.id ?? `uu5string-child_${context.index}` };
  }
  let resolveValue = (valueStack, key) => {
    let parentIndex = 0;
    if (!key) return valueStack[parentIndex];
    let segments = key.split(".");
    while (parentIndex < segments.length && segments[parentIndex] === "parent") parentIndex++;
    let value = valueStack[parentIndex];
    for (let i = parentIndex; i < segments.length && value !== undefined; i++) value = value?.[segments[i]];
    return value;
  };

  // if this is a component which contains children with ${parent.xyz} then provide the function for such children; e.g.
  // <Provider>
  //   Error: ${parent.errorData.error}
  //   <JsonViewer data="${parent}" />
  // </Provider>
  let resultJsxChildren = children;
  let childrenArray = Array.isArray(children) ? children : children != null ? [children] : [];
  // NOTE Scenario: turn on edit mode, uuDcc auto-wraps all components, i.e. our fn is called with equivalent of:
  //   <UuDcc.Bricks.ComponentWrapper>
  //     <JsonViewer data="${parent}" />
  //   </UuDcc.Bricks.ComponentWrapper>
  // but UuDcc.Bricks.ComponentWrapper doesn't support (call) function-as-a-child
  //   => disable faac for this particular usecase
  let canSupportFaac =
    componentNameOrTag !== "UuDcc.Bricks.ComponentWrapper" &&
    componentNameOrTag?.tagName !== "UuDcc.Bricks.ComponentWrapper";
  let requiredParentStackSize = 0;
  if (canSupportFaac) {
    recurseArray(
      childrenArray,
      (child) =>
        (requiredParentStackSize = Math.max(child?.[REQUIRED_PARENT_STACK_SIZE] || 0, requiredParentStackSize)),
    );
  }
  if (requiredParentStackSize > 0) {
    resultJsxChildren = (...faacArgs) => {
      let parentStack = faacArgs[0]?.[IS_FAAC_PARENT_STACK] ? faacArgs.shift() : [];
      let faacArg = faacArgs[0];
      let newParentStack = [faacArg, ...parentStack];
      newParentStack[IS_FAAC_PARENT_STACK] = true;
      return Element.create(
        Fragment,
        undefined,
        ...recurseArray(childrenArray, (it) =>
          it?.[CHILD_TO_JSX_FN] // component with prop with expression
            ? it[CHILD_TO_JSX_FN](newParentStack)
            : it?.[IS_FAAC_EXPRESSION] // expression as a child
              ? resolveValue(newParentStack, it.subkey)
              : it,
        ),
      );
    };
  }

  // if this is a component which uses prop="${parent.xyz}", then build it as a function
  // which spreads the argument to the proper props
  let resultJsx;
  if (props || requiredParentStackSize > 1) {
    let propToFaacKeyMap = {}; // e.g. { value: "abc" } if using `value="${parent.abc}"` prop
    let fallbackProps = { ...props };
    let requiredParentStackSizeOuter = requiredParentStackSize - 1;
    for (let k in props) {
      let v = props[k];
      if (!v?.[IS_FAAC_EXPRESSION]) continue;
      propToFaacKeyMap[k] = v.subkey;
      requiredParentStackSizeOuter = Math.max(requiredParentStackSizeOuter, v[REQUIRED_PARENT_STACK_SIZE]);
      fallbackProps[k] = v.toString();
    }
    if (Object.keys(propToFaacKeyMap).length > 0 || requiredParentStackSizeOuter > 0) {
      // NOTE This serves as a fallback JSX in cases where we don't have parent, i.e.:
      // a) we're in edit mode (in such case uuDcc calls toChildren() for each Uu5StringObject manually, not as a toChildren() for whole subtree)
      // b) we're in uu5string root level
      // In all other cases CHILD_TO_JSX_FN fn will be called from parent component instead.
      resultJsx = findComponent(componentNameOrTag, fallbackProps, resultJsxChildren);
      let childToJsxFn = (parentFaacStack) => {
        let actualProps = { ...props };
        for (let k in propToFaacKeyMap) {
          actualProps[k] = resolveValue(parentFaacStack, propToFaacKeyMap[k]);
        }
        let finalChildren =
          typeof resultJsxChildren === "function"
            ? (faacArg) => resultJsxChildren(parentFaacStack, faacArg)
            : resultJsxChildren;
        return findComponent(componentNameOrTag, actualProps, finalChildren);
      };
      if (!Object.isExtensible(resultJsx)) {
        let copy = {};
        Object.defineProperties(copy, Object.getOwnPropertyDescriptors(resultJsx));
        for (let symbol of Object.getOwnPropertySymbols(resultJsx)) copy[symbol] = resultJsx[symbol];
        resultJsx = copy;
      }
      resultJsx[CHILD_TO_JSX_FN] = childToJsxFn;
      resultJsx[REQUIRED_PARENT_STACK_SIZE] = requiredParentStackSizeOuter;
    }
  }
  if (!resultJsx) {
    resultJsx = findComponent(componentNameOrTag, props, resultJsxChildren);
  }
  return resultJsx;
}

// use default uu5DataMap, use extra fields in templateDataMap & make Uu5String.toChildren() / contentToChildren()
// functions generate JSX elements
class Uu5String extends Uu5Stringg01 {
  constructor(uu5string, opts) {
    super(uu5string, {
      _factory: G05_FACTORY,
      ...opts,
      uu5DataMap: opts?.uu5DataMap !== undefined ? opts.uu5DataMap : Environment.uu5DataMap,
    });
    let origToString = this.toString;
    this.toString = function (opts, ...args) {
      // NOTE Default "templateStrategy" for toString() depends on templateDataMap, but we want to add our templates there
      // so prepare the templateStrategy in a backward compatible way.
      let templateDataMap = opts?.templateDataMap === undefined ? this.templateDataMap || null : opts?.templateDataMap;
      let templateStrategy = opts?.templateStrategy || (templateDataMap === null ? "preserve" : "evaluate"); // "evaluate" due to backward compatibility
      return origToString.call(
        this,
        {
          ...opts,
          templateDataMap: { ...EXTRA_TEMPLATE_DATA, ...templateDataMap },
          templateStrategy,
        },
        ...args,
      );
    }.bind(this);

    let origToChildren = this.toChildren;
    this.toChildren = function (opts, ...args) {
      let templateDataMap = opts?.templateDataMap === undefined ? this.templateDataMap || {} : opts?.templateDataMap;
      return origToChildren.call(
        this,
        {
          ...opts,
          buildChildFn: getBuildChildFn(opts),
          templateDataMap: templateDataMap === null ? templateDataMap : { ...EXTRA_TEMPLATE_DATA, ...templateDataMap },
        },
        ...args,
      );
    }.bind(this);
  }

  static parse(uu5string, opts) {
    return Uu5Stringg01.parse(uu5string, {
      _factory: G05_FACTORY,
      ...opts,
      uu5DataMap: opts?.uu5DataMap !== undefined ? opts.uu5DataMap : Environment.uu5DataMap,
    });
  }

  static parseTagPropsArray(uu5object, opts) {
    return Uu5Stringg01.parseTagPropsArray(uu5object, {
      _factory: G05_FACTORY,
      ...opts,
      uu5DataMap: opts?.uu5DataMap !== undefined ? opts.uu5DataMap : Environment.uu5DataMap,
    });
  }

  static toChildren(uu5string, opts) {
    return Uu5Stringg01.toChildren(uu5string, {
      ...opts,
      buildChildFn: getBuildChildFn(opts),
      templateDataMap: opts?.templateDataMap === null ? null : { ...EXTRA_TEMPLATE_DATA, ...opts?.templateDataMap },
      uu5DataMap: opts?.uu5DataMap !== undefined ? opts.uu5DataMap : Environment.uu5DataMap,
    });
  }

  static toString(uu5string, opts) {
    // NOTE Default "templateStrategy" for toString() depends on templateDataMap, but we want to add our templates there
    // so prepare the templateStrategy in a backward compatible way.
    // NOTE Intentionally `== null` because default templateData for toString() is null.
    let templateStrategy = opts?.templateStrategy || (opts?.templateDataMap == null ? "preserve" : "evaluate"); // "evaluate" due to backward compatibility
    return Uu5Stringg01.toString(uu5string, {
      ...opts,
      templateDataMap: { ...EXTRA_TEMPLATE_DATA, ...opts?.templateDataMap },
      templateStrategy,
    });
  }

  static toObject(uu5string, opts) {
    return Uu5Stringg01.toObject(uu5string, {
      ...opts,
      // NOTE Default "templateStrategy" for toObject() is "preserve" so adding more stuff to templateDataMap doesn't need any special adjustments.
      templateDataMap: { ...EXTRA_TEMPLATE_DATA, ...opts?.templateDataMap },
    });
  }

  static toPlainText(uu5string, opts) {
    return Uu5Stringg01.toPlainText(uu5string, {
      ...opts,
      templateDataMap: opts?.templateDataMap === null ? null : { ...EXTRA_TEMPLATE_DATA, ...opts?.templateDataMap },
      uu5DataMap: opts?.uu5DataMap !== undefined ? opts.uu5DataMap : Environment.uu5DataMap,
    });
  }

  static contentToChildren(content, opts) {
    return Uu5Stringg01.contentToChildren(content, {
      ...opts,
      buildChildFn: getBuildChildFn(opts),
      templateDataMap: opts?.templateDataMap === null ? null : { ...EXTRA_TEMPLATE_DATA, ...opts?.templateDataMap },
      uu5DataMap: opts?.uu5DataMap !== undefined ? opts.uu5DataMap : Environment.uu5DataMap,
    });
  }

  static contentToString(content, opts) {
    // NOTE Default "templateStrategy" for toString() depends on templateDataMap, but we want to add our templates there
    // so prepare the templateStrategy in a backward compatible way.
    // NOTE Intentionally `== null` because default templateData for toString() is null.
    let templateStrategy = opts?.templateStrategy || (opts?.templateDataMap == null ? "preserve" : "evaluate"); // "evaluate" due to backward compatibility
    return Uu5Stringg01.contentToString(content, {
      ...opts,
      templateDataMap: { ...EXTRA_TEMPLATE_DATA, ...opts?.templateDataMap },
      templateStrategy,
    });
  }

  static contentToObject(content, opts) {
    return Uu5Stringg01.contentToObject(content, {
      ...opts,
      // NOTE Default "templateStrategy" for toObject() is "preserve" so adding more stuff to templateDataMap doesn't need any special adjustments.
      templateDataMap: { ...EXTRA_TEMPLATE_DATA, ...opts?.templateDataMap },
    });
  }

  static contentToPlainText(content, opts) {
    return Uu5Stringg01.contentToPlainText(content, {
      ...opts,
      templateDataMap: opts?.templateDataMap === null ? null : { ...EXTRA_TEMPLATE_DATA, ...opts?.templateDataMap },
      uu5DataMap: opts?.uu5DataMap !== undefined ? opts.uu5DataMap : Environment.uu5DataMap,
    });
  }
}

class Uu5StringObject extends Uu5Stringg01.Object {
  constructor(tag, propsString, opts) {
    super(tag, propsString, {
      _factory: G05_FACTORY,
      ...opts,
      uu5DataMap: opts?.uu5DataMap !== undefined ? opts.uu5DataMap : Environment.uu5DataMap,
    });
    let origToChildren = this.toChildren;
    this.toChildren = function (opts, ...args) {
      return origToChildren.call(this, { ...opts, buildChildFn: getBuildChildFn(opts) }, ...args);
    };
  }
  static create(uu5Tag, props, opts) {
    return Uu5Stringg01.Object.create(uu5Tag, props, {
      _factory: G05_FACTORY,
      ...opts,
    });
  }
}

class Uu5StringProps extends Uu5Stringg01.Props {
  constructor(propsString, opts) {
    super(propsString, {
      _factory: G05_FACTORY,
      ...opts,
      uu5DataMap: opts?.uu5DataMap !== undefined ? opts.uu5DataMap : Environment.uu5DataMap,
    });
    let origToChildren = this.toChildren;
    this.toChildren = function (opts, ...args) {
      return origToChildren.call(this, { ...opts, buildChildFn: getBuildChildFn(opts) }, ...args);
    };
  }
}

Uu5String.Object = Uu5StringObject;
Uu5String.Props = Uu5StringProps;

export { Uu5String };
export default Uu5String;
