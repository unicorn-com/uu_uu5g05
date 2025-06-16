const React = require("react");
const { Utils, Test } = require("uu5g05-test");
const { wait } = Utils;

function AsyncComponent({ timeout = 0 }) {
  const [content, setContent] = React.useState("loading");
  React.useEffect(() => {
    let timeoutId = setTimeout(() => setContent("loaded"), timeout);
    return () => clearTimeout(timeoutId);
  }, []);
  return content;
}

describe("[uu5g05-test] Utils.wait", () => {
  it("wait", async () => {
    // test basic functionality
    let { unmount } = Test.render(React.createElement(AsyncComponent));
    expect(Test.screen.getByText("loading")).toBeInTheDocument();
    await wait();
    expect(Test.screen.getByText("loaded")).toBeInTheDocument();
    unmount();

    // test options
    ({ unmount } = Test.render(React.createElement(AsyncComponent, { timeout: 60 })));
    expect(Test.screen.getByText("loading")).toBeInTheDocument();
    let waitedCount = 0;
    for (; waitedCount < 20; waitedCount++) {
      await wait(9);
      let isLoaded = Test.screen.queryByText("loaded") != null;
      if (isLoaded) break;
    }
    expect(waitedCount).toBeGreaterThan(3);
    unmount();
  });
});
