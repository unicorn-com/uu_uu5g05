const React = require("react");
const { screen, userEvent } = require("../internal/testing-library.js");
const { render } = require("../internal/render.js");
const { wait } = require("../utils/wait.js");

async function setup(Component, props, { wrapper, Wrapper, queries } = {}) {
  const testId = "component-1";
  const propsToPass = { ...props, testId };

  let jsx = React.createElement(Component, propsToPass);
  wrapper ??= Wrapper;
  if (wrapper) jsx = React.createElement(wrapper, null, jsx);

  const user = userEvent.setup();
  const view = render(jsx, { queries });
  await wait();
  if (wrapper) {
    const { rerender } = view;
    view.rerender = (jsx) => rerender(React.createElement(wrapper, null, jsx));
  }
  const element = screen.getByTestId(testId);

  return { user, view, element, props: propsToPass };
}

module.exports = { setup };
