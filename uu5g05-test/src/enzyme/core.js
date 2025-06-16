const React = require("react");
const ReactDOM = require("react-dom");
const ReactTestUtils = require("react-dom/test-utils");
const { cleanupErrorStack } = require("../internal/helpers.js");

const DEFAULT_TIMEOUT = 100;
// let clearTimeout = global.clearTimeout;

// unmount components after each test
let container;
let lastWrapper;
let inTest = false;

function initTest() {
  beforeEach(() => {
    inTest = true;
  });
  afterEach(() => {
    inTest = false;
  });

  // we want to do automatic unmount of lastWrapper:
  // 1. It must be done as the first thing before any other afterEach() handler can run
  //    (some components might do cleanup / something that needs something that was mocked in one of those beforeEach/afterEach
  //    handlers but it is now destroyed if afterEach() was able to run before unmount).
  // 2. We would need to override 'afterEach' so that our handler runs first (was registered last) - but we don't really know which
  //    handlers are going to run and which one is last due to conditional running when in describe() blocks
  //    ('beforeEach' in describe block is run only for tests inside that block).
  // =>
  //   i.  Do the unmount inside of the test functions (i.e. override registration of functions passed to 'it' / 'test' / ... functions).
  //   ii. Just in case, do the unmount also in 'afterEach' handler too (for cases that there are other
  //       test methods that we didn't override, e.g. test.each()(...) or test.concurrent.only(...), etc.).
  //       This case will have issue as described in point 1.
  wrap("it");
  wrap("it.only");
  wrap("fit");
  wrap("test");
  wrap("test.only");

  function wrap(name) {
    let parts = name.split(".");
    let obj = global;
    while (obj && parts.length > 1) obj = obj[parts.shift()];
    if (obj && typeof obj[parts[0]] === "function") {
      let origFn = obj[parts[0]];
      obj[parts[0]] = function (name, fn, ...args) {
        if (typeof fn !== "function") return origFn.apply(this, arguments);
        return origFn.call(
          this,
          name,
          function (...testArgs) {
            let result;
            try {
              result = fn.apply(this, testArgs);
            } catch (e) {
              try {
                unmount();
              } catch (e2) {}
              throw e;
            }
            if (result && typeof result.then === "function") {
              result = result.then(
                (v) => (unmount(), v),
                (e) => (unmount(), Promise.reject(e)),
              );
            } else {
              unmount();
            }
            return result;
          },
          ...args,
        );
      };
      for (let k in origFn) if (!(k in obj[parts[0]])) obj[parts[0]][k] = origFn[k];
    }
  }

  afterEach(unmount);

  function unmount() {
    if (lastWrapper && lastWrapper.length === 1) lastWrapper.unmount();
    lastWrapper = null;
    if (container) ReactDOM.unmountComponentAtNode(container);
  }
}

function mount(jsx, options) {
  // NOTE Condition for inTest - UU5.Bricks.Page uses shallow outside of test to get an instance of Page component
  // and to pass it in "parent" prop => use minimal mount/shallow (and don't auto-unmount it)
  if (inTest) {
    if (!container) {
      container = document.createElement("div");
      document.body.appendChild(container);
    } else {
      ReactDOM.unmountComponentAtNode(container);
      lastWrapper = null;
    }
  }
  // NOTE Requiring "enzyme" here so that it potentially fails only if developer actively tried to use it
  // (tests with React 18 don't use this method and have no enzyme installed).
  let wrapper = require("enzyme").mount(jsx, { attachTo: container, ...options });
  if (inTest) lastWrapper = wrapper;
  return wrapper;
}

function shallow(jsx, options) {
  // NOTE Condition for inTest - UU5.Bricks.Page uses shallow outside of test to get an instance of Page component
  // and to pass it in "parent" prop => use minimal mount/shallow (and don't auto-unmount it)
  if (lastWrapper) lastWrapper.unmount();
  // NOTE Requiring "enzyme" here so that it potentially fails only if developer actively tried to use it
  // (tests with React 18 don't use this method and have no enzyme installed).
  let wrapper = require("enzyme").shallow(jsx, options);
  if (inTest) lastWrapper = wrapper;
  return wrapper;
}

function act(fn, { updateWrapper = true } = {}) {
  // call react-dom's act() and update wrapper (if any)
  let originalSyncStack = new Error().stack;
  let reactAct = React.act || ReactTestUtils.act;
  let actResult = reactAct(() => {
    let fnResult = fn();
    if (fnResult !== undefined && (!fnResult || typeof fnResult.then !== "function")) {
      // enforce proper behaviour (React logs just warning)
      let error = new Error(
        `The callback passed to act(...) function must return undefined, or a Promise. You returned ${fnResult}`,
      );
      error.code = "INVALID_ARGUMENTS";
      error.stack = cleanupErrorStack(originalSyncStack, error.message);
      throw error;
    }
    return fnResult;
  });
  if (actResult && typeof actResult.then === "function") {
    // NOTE We don't want to access actResult.then() right away because react-dom has
    // overridden this particular "then" to provide warning in case that no-one is doing "await".
    // (And we don't want to do it via simple Promise.resolve().then(...) because that would enqueue
    // it for processing in the next tick and call "then" automatically.)
    let runPromise = () =>
      new Promise((resolve, reject) => {
        actResult.then(
          (v) => {
            if (updateWrapper && lastWrapper) lastWrapper.update();
            resolve(v);
          },
          (e) => {
            if (updateWrapper && lastWrapper) lastWrapper.update();
            reject(e);
          },
        );
      });
    return {
      then: (onResolve, onReject) => runPromise().then(onResolve, onReject),
      catch: (onReject) => runPromise().catch(onReject),
    };
  } else {
    if (updateWrapper && lastWrapper) lastWrapper.update();
  }
  return actResult;
}

// wait() or wait(100) or wait({ timeout: 100, updateWrapper: true })
async function wait(...args) {
  let timeout, updateWrapper;
  if (typeof args[0] === "number") timeout = args.shift();
  else timeout = (args[0] || {}).timeout || 0;
  ({ updateWrapper = true } = args[0] || {});

  if (timeout >= 0) {
    await act(() => new Promise((resolve) => setTimeout(resolve, timeout)), { updateWrapper });
  }
}

async function waitUntilCalled(callbackFn, { timeout = DEFAULT_TIMEOUT, updateWrapper = true } = {}) {
  return waitUntilCalledTimes(callbackFn, 1, { timeout, updateWrapper });
}

async function waitUntilCalledTimes(callbackFn, times, { timeout = DEFAULT_TIMEOUT, updateWrapper = true } = {}) {
  let originalSyncStack = new Error().stack;
  if (callbackFn.mock) {
    let now = Date.now();
    while (Date.now() - now < timeout) {
      if (callbackFn.mock.calls.length >= times) break;
      await wait({ timeout: 2, updateWrapper: false });
    }
    if (callbackFn.mock.calls.length < times) {
      let error = new Error(
        `Mock function should have been called ${times} time(s) but was called only ${callbackFn.mock.calls.length} time(s) within specified timeout (${timeout}ms).`,
      );
      error.code = "CALL_COUNT_TOO_LOW";
      error.stack = cleanupErrorStack(originalSyncStack, error.message);
      throw error;
    }
  }
  if (updateWrapper && lastWrapper) lastWrapper.update();
}

async function waitWhile(conditionFn, { timeout = DEFAULT_TIMEOUT, updateWrapper = true } = {}) {
  let originalSyncStack = new Error().stack;
  let now = Date.now();
  while (Date.now() - now < timeout) {
    let lastResult;
    await act(async () => (lastResult = conditionFn()), { updateWrapper: false });
    if (!(await lastResult)) break;
    await wait({ timeout: 2, updateWrapper });
  }
  if (Date.now() - now >= timeout) {
    let error = new Error(`Conditional wait did not finish within specified timeout (${timeout}ms).`);
    error.code = "TIMED_OUT";
    error.stack = cleanupErrorStack(originalSyncStack, error.message);
    throw error;
  }
  if (updateWrapper && lastWrapper) lastWrapper.update();
}

module.exports = { initTest, mount, shallow, act, wait, waitUntilCalled, waitUntilCalledTimes, waitWhile };
