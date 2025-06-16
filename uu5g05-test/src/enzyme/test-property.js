const React = require("react");
const { cleanupErrorStack } = require("../internal/helpers.js");
const VisualComponentProps = require("./visual-component-props.js");
const { shallow, mount } = require("./core.js");
const { wait } = require("../utils/wait.js");

function withSnapshotComment(value, comment) {
  let result = { comment, value };
  result[SYMBOL_SNAPSHOT_WITH_COMMENT] = true;
  return result;
}

function doMount(component, opt = {}) {
  if (opt.renderer && (typeof opt.renderer !== "string" || !opt.renderer.match(/^(mount|shallow)$/))) {
    throw new Error("Option 'renderer' can be 'mount' or 'shallow', but it is: " + opt.renderer);
  }
  let renderer = opt.renderer === "mount" ? mount : shallow;
  let wrapper = renderer(component, opt.rendererOpt || opt.shallowOpt);
  return wrapper;
}

function takeSnapshot(component, comment, opt = {}, async = false) {
  let resolvedResult;

  async function run() {
    let wrapper = doMount(component, opt);
    let snapshotValue = comment ? withSnapshotComment(wrapper, comment) : wrapper;
    if (async) await wait();
    expect(snapshotValue).toMatchSnapshot();
    let snapshotString = toStringSerializer ? toStringSerializer.lastSnapshotString : null;
    resolvedResult = { wrapper, snapshotString };
    return resolvedResult;
  }

  let result = run();
  return resolvedResult || result;
}

function toSafeJson(value) {
  if (typeof value === "function" && typeof value.toJSON !== "function") return "[Function]";
  try {
    return JSON.stringify(value);
  } catch (e) {
    return value != null ? value + "" : value;
  }
}

let toStringSerializer;
const SYMBOL_SNAPSHOT_STRING = Symbol.for("Uu5Test.Tools.SNAPSHOT_STRING");
const ERROR_MESSAGE_SNAPSHOT_STRING_PREFIX = "Uu5Test.Tools.getSnapshotStringErrorMessage";

class SnapshotToStringSerializer {
  constructor() {
    toStringSerializer = this;
    this.getSnapshotString = this.getSnapshotString.bind(this);
    this.serialize = this.serialize.bind(this);
    this.test = this.test.bind(this);
  }

  getSnapshotString(wrapper, opt = {}) {
    let value = { value: wrapper };
    value[SYMBOL_SNAPSHOT_STRING] = true;
    value.preventSnapshotStore = true;
    try {
      expect(value).toMatchSnapshot();
      return "";
    } catch (e) {
      if (!e || !e.message || !e.message.startsWith(ERROR_MESSAGE_SNAPSHOT_STRING_PREFIX)) throw e;
      return e.message.substr(ERROR_MESSAGE_SNAPSHOT_STRING_PREFIX.length);
    }
  }

  serialize(val, config, indentation, depth, refs, printer) {
    this._nested = true;
    try {
      if (!val || typeof val !== "object" || !(SYMBOL_SNAPSHOT_STRING in val)) {
        val = { value: val, preventSnapshotStore: false };
      }
      let snapshotString = printer(val.value, config, indentation, depth, refs);
      if (val.preventSnapshotStore) {
        throw new Error(ERROR_MESSAGE_SNAPSHOT_STRING_PREFIX + snapshotString);
      }
      if (config.indent !== "") {
        // NOTE During toMatchSnapshot() Jest might do 2 snapshots - if 1st snapshot differs from the stored one, Jest will
        // serialize the object 2nd time using { indent: 0 } option and then unindent stored snapshot and compare the two.
        // In such case we want the 1st snapshot to be remembered.
        this.lastSnapshotString = snapshotString;
      }
      return snapshotString;
    } finally {
      this._nested = false;
    }
  }

  test(val) {
    return !this._nested;
  }
}

const SYMBOL_SNAPSHOT_WITH_COMMENT = Symbol.for("Uu5Test.Tools.SNAPSHOT_WITH_COMMENT");

class SnapshotCommentSerializer {
  print(val, serialize, ...rest) {
    return `/* ${val.comment} */\n` + serialize(val.value);
  }

  test(val) {
    return val && typeof val === "object" && SYMBOL_SNAPSHOT_WITH_COMMENT in val;
  }
}

function testProperty(Component, propName, values, requiredProps = null, opt = {}) {
  let originalSyncStack = new Error().stack;
  !Array.isArray(values) && (values = [values]);

  let { skip, wait: waitOpt, skipRevertedValueSnapshotCheck } = opt;
  values.forEach((value, i) => {
    let testFn = skip ? it.skip : it;
    testFn(`${propName}=${toSafeJson(value)}`, async () => {
      let props = Object.assign({}, requiredProps);
      props[propName] = value;

      // NOTE Distinguishing here so that sync variant is really sync.
      let snapshotResult = takeSnapshot(
        React.createElement(Component, { id: "uuID", ...props }),
        null,
        opt,
        waitOpt || waitOpt === undefined,
      );
      if (waitOpt || waitOpt === undefined) snapshotResult = await snapshotResult;
      let { wrapper, snapshotString } = snapshotResult;

      let nextValue = values[values.length - 1 > i ? i + 1 : i === 0 ? values.length : i - 1];
      if (nextValue === undefined && requiredProps) nextValue = requiredProps[propName];
      if (nextValue !== undefined && nextValue !== value) {
        wrapper.setProps({ [propName]: nextValue });
        if (waitOpt || waitOpt === undefined) await wait();
        wrapper.setProps({ [propName]: value });
        if (waitOpt || waitOpt === undefined) await wait();
        if (!skipRevertedValueSnapshotCheck) {
          let snapshotString2 = toStringSerializer ? toStringSerializer.getSnapshotString(wrapper, opt) : null;
          if (snapshotString2 !== snapshotString) {
            // console.log(snapshotString2, snapshotString);
            let chainProp = `${propName}=${toSafeJson(value)} --> ${propName}=${toSafeJson(
              nextValue,
            )} --> ${propName}=${toSafeJson(value)}`;
            let simpleProp = `${propName}=${toSafeJson(value)}`;
            // TODO Use some diff to show differences.
            let error = new Error(
              `Changing props dynamically from ${chainProp} results in different snapshot than if simply using ${simpleProp}!
/* ${chainProp} */
${snapshotString2}

/* ${simpleProp} */
${snapshotString}`,
            );
            error.code = "PROP_CHANGE_PRODUCES_DIFFERENT_SNAPSHOT";
            error.stack = cleanupErrorStack(originalSyncStack, error.message);
            throw error;
          }
        }
      }
    });
  });
}

function testProperties(Component, config) {
  // guard against most common error
  if (typeof Component === "string") {
    let error = new Error(
      "Invalid arguments to testProperties - 1st argument must be a component class but it is string.",
    );
    error.code = "INVALID_ARGUMENTS";
    error.stack = cleanupErrorStack(error.stack);
    throw error;
  }

  let isAsync = !config.opt || config.opt.wait === undefined || config.opt.wait;
  test(`default props`, async () => {
    let result = takeSnapshot(
      React.createElement(Component, { id: "uuID", ...config.requiredProps }),
      null,
      config.opt,
      isAsync,
    );
    if (isAsync) await result;
  });

  const isVisual = Component?.uu5ComponentType === "visualComponent" || Component?.propTypes?.className;
  const { elementRef, ...props } = isVisual ? { ...VisualComponentProps, ...config.props } : config.props;

  if (isVisual && elementRef == null && Component?.propTypes?.elementRef) {
    test("elementRef", async () => {
      let elementRef = React.createRef();
      let jsx = React.createElement(Component, { ...config.requiredProps, elementRef: elementRef });
      doMount(jsx, { ...config.opt, renderer: "mount" });
      if (isAsync) await wait();
      expect(elementRef.current).toBeTruthy();
    });
  }

  for (let propName in props) {
    let requiredProps = { ...config.requiredProps, ...props[propName].requiredProps };
    testProperty(Component, propName, props[propName].values, requiredProps, {
      ...config.opt,
      ...props[propName].opt,
    });
  }
}

testProperty._SnapshotCommentSerializer = SnapshotCommentSerializer;
testProperty._SnapshotToStringSerializer = SnapshotToStringSerializer;

module.exports = { testProperty, testProperties };
