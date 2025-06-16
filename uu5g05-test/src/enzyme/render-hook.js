const React = require("react");
const { mount, act } = require("./core.js");
const { cleanupErrorStack } = require("../internal/helpers.js");

const HookOuterComponent = React.forwardRef(({ children, initialHookParams, hook }, ref) => {
  let [hookParams, setHookParams] = React.useState(() => initialHookParams);
  React.useImperativeHandle(ref, () => ({ setHookParams }), []);
  let result = hook(...hookParams);
  // NOTE Using HookInnerComponent to measure render counts of subtrees (hooks are allowed to change their state during render
  // because it results in re-calling of the Component but not of its subtree - we don't want to measure these
  // shallow re-renders).
  // NOTE This also means that we'll collect only "committed" hook results.
  return React.createElement(HookInnerComponent, { result }, children);
});
const HookInnerComponent = ({ children, result }) => children(result);

function renderHook(hook, ...initialHookParams) {
  let { HookComponent, ...result } = initHookRenderer(hook, ...initialHookParams);
  let wrapper = mount(React.createElement(HookComponent));
  return { wrapper, ...result };
}

function initHookRenderer(hook, ...initialHookParams) {
  if (typeof hook !== "function") {
    let error = new Error(
      `Invalid value used as a hook: ${hook}. Are you passing hook parameters but forgot to pass the hook?
Example:
  const { lastResult } = renderHook(useLsi, { "cs": "Ahoj", "en": "Hello" });
  const { lastResult } = initHookRenderer(useLsi, { "cs": "Ahoj", "en": "Hello" });`,
    );
    error.code = "INVALID_ARGUMENTS";
    error.stack = cleanupErrorStack(error.stack);
    throw error;
  }
  if (typeof hook.name === "string" && !hook.name.match(/^use[A-Z]/)) {
    let error = new Error(
      `Invalid value used as a hook (hook name must start with 'use' followed by uppercase letter): "${hook.name}". Are you passing hook parameters but forgot to pass the hook?
Example:
  const { lastResult } = renderHook(useLsi, { "cs": "Ahoj", "en": "Hello" });
  const { lastResult } = initHookRenderer(useLsi, { "cs": "Ahoj", "en": "Hello" });`,
    );
    error.code = "INVALID_ARGUMENTS";
    error.stack = cleanupErrorStack(error.stack);
    throw error;
  }
  let hookResults = [];
  let hookOuterComponentRef = React.createRef();
  let HookComponent = ({ children }) =>
    React.createElement(
      HookOuterComponent,
      { ref: hookOuterComponentRef, initialHookParams: initialHookParams, hook: hook },
      (lastHookResult) => {
        hookResults.push(lastHookResult);
        let child;
        if (typeof children === "function") child = children(lastHookResult);
        else if (children !== undefined) child = children;
        else child = React.createElement("div");
        return child;
      },
    );
  return {
    HookComponent,
    lastResult: () => hookResults[hookResults.length - 1],
    allResults: () => [...hookResults],
    renderCount: () => hookResults.length,
    rerender: (...newHookParams) => {
      if (!hookOuterComponentRef.current) {
        throw new Error("Cannot re-render hook component because it wasn't mounted yet (or is already unmounted)!");
      }
      act(() => hookOuterComponentRef.current.setHookParams(newHookParams));
    },
  };
}

module.exports = { renderHook, initHookRenderer };
