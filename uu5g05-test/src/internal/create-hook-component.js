const React = require("react");
const { act } = require("./testing-library.js");

const HookInnerComponent = ({ children, result }) => children(result);

// NOTE Using HookInnerComponent because hooks are allowed to change their state during render
// because it results in re-calling of the Component but not of its subtree - and developers don't
// need to know about these shallow re-renders.
const HookMiddleComponent = ({ children, hookFn, hookFnProps }) =>
  React.createElement(HookInnerComponent, { result: hookFn(hookFnProps) }, children);

const HookOuterComponent = React.forwardRef(({ children, opts, hookFn }, ref) => {
  // HookOuterComponent allows unmounting of the hook and changing its props (HookMiddleComponent)
  let [hookFnProps, setHookFnProps] = React.useState(() => opts?.initialProps);
  let [unmounted, setUnmounted] = React.useState(false);
  React.useImperativeHandle(ref, () => ({ setHookFnProps, unmount: () => setUnmounted(true) }), []);
  return unmounted ? null : React.createElement(HookMiddleComponent, { hookFn, hookFnProps }, children);
});

function createHookComponent(hookFn, opts) {
  let result = React.createRef();
  let hookOuterComponentRef = React.createRef();
  let HookComponent = ({ children }) =>
    React.createElement(HookOuterComponent, { ref: hookOuterComponentRef, opts, hookFn }, (lastHookResult) => {
      result.current = lastHookResult;
      let child;
      if (typeof children === "function") child = children(lastHookResult);
      else child = children;
      return child ?? null;
    });
  return {
    HookComponent,
    // NOTE Keep this API same as returned from renderHook().
    result,
    unmount: () => act(() => hookOuterComponentRef.current?.unmount()),
    rerender: (newHookFnProps) => act(() => hookOuterComponentRef.current?.setHookFnProps(newHookFnProps)),
  };
}

module.exports = { createHookComponent };
