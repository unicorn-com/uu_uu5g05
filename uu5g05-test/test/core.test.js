const React = require("react");
// const { mount: enzymeMount } = require("enzyme");
// const { mount, shallow, act, wait, waitWhile, waitUntilCalled, waitUntilCalledTimes } = require("uu5g05-test");

class AsyncComponent extends React.Component {
  constructor(props) {
    super(props);
    this._unmounted = false;
    this.state = {};
  }
  componentDidMount() {
    if (!this.props.timeout) {
      Promise.resolve().then(() => !this._unmounted && this.setState({ content: "loaded" }));
    } else {
      this._timeoutId = setTimeout(() => !this._unmounted && this.setState({ content: "loaded" }), this.props.timeout);
    }
  }
  componentWillUnmount() {
    this._unmounted = true;
    clearTimeout(this._timeoutId);
  }
  isUnmounted() {
    return !!this._unmounted;
  }
  render() {
    return this.state.content || "loading";
  }
}

class CallComponent extends React.Component {
  call() {
    this.setState((state) => ({ counter: state ? state.counter + 1 : 1 }));
    if (typeof this.props.onCall === "function") this.props.onCall();
  }
  render() {
    return this.state ? this.state.counter + "" : "0";
  }
}

// TODO Next major - remove. Skipping because we would have to have React 16 in dependencies for these to actually work.
describe.skip("[uu5g05-test] enzyme-based API", () => {
  let wrapper;

  it("mount", async () => {
    wrapper = mount(React.createElement(AsyncComponent));
    expect(wrapper).toBeDefined();
    expect(wrapper.length).toBe(1);
    expect(typeof wrapper.instance).toBe("function");
    let instance = wrapper.instance();
    expect(instance instanceof AsyncComponent).toBeTruthy();

    // component should be in document's DOM
    wrapper = mount(React.createElement("div", { id: "test-id" }));
    expect(document.getElementById("test-id")).toBeTruthy();

    // initial wrapper should have been automatically unmounted
    expect(instance.isUnmounted()).toBe(true);
  });

  it("shallow", async () => {
    wrapper = shallow(React.createElement(AsyncComponent));
    expect(wrapper).toBeDefined();
    expect(wrapper.length).toBe(1);
    expect(typeof wrapper.instance).toBe("function");
    let instance = wrapper.instance();
    expect(instance instanceof AsyncComponent).toBeTruthy();

    wrapper = shallow(React.createElement("div", { id: "test-id" }));

    // initial wrapper should have been automatically unmounted
    expect(instance.isUnmounted()).toBe(true);
  });

  it("act", async () => {
    let HookComponent = React.forwardRef((props, ref) => {
      let [count, setCount] = React.useState(0);
      let [fromEffect, setFromEffect] = React.useState(count); // changed in useEffect
      React.useImperativeHandle(ref, () => ({ setCount }), []);
      React.useEffect(() => setFromEffect(count), [count]);
      return React.createElement("span", null, fromEffect);
    });
    let componentRef = React.createRef();
    let wrapper = enzymeMount(React.createElement(HookComponent, { ref: componentRef })); // mount does "act()" automatically

    // without act() the component would render without calling useEffect yet (i.e. we'll see old value)
    let origConsoleError = console.error;
    console.error = () => {}; // prevent react warning regarding not using act()
    try {
      componentRef.current.setCount(10);
      wrapper.update();
      expect(wrapper.text()).toBe("0");
    } finally {
      console.error = origConsoleError;
    }

    // with act() the component would render including useEffect-s
    act(() => {
      componentRef.current.setCount(30);
    });
    wrapper.update();
    expect(wrapper.text()).toBe("30");
  });

  it("wait", async () => {
    // test basic functionality with Enzyme's mount
    wrapper = enzymeMount(React.createElement(AsyncComponent));
    expect(wrapper.text()).toBe("loading");
    await wait();
    wrapper.update();
    expect(wrapper.text()).toBe("loaded");

    // test that wrapper gets auto-updated when using mount
    wrapper = mount(React.createElement(AsyncComponent));
    expect(wrapper.text()).toBe("loading");
    await wait();
    expect(wrapper.text()).toBe("loaded");

    // test options
    wrapper = mount(React.createElement(AsyncComponent, { timeout: 50 }));
    expect(wrapper.text()).toBe("loading");
    let start = Date.now();
    let isLoaded = false;
    while (!isLoaded && Date.now() - start < 500) {
      await wait(9);
      isLoaded = Date.now() - start >= 50;
      expect(wrapper.text()).toBe(isLoaded ? "loaded" : "loading");
    }
    expect(isLoaded).toBe(true);

    wrapper = mount(React.createElement(AsyncComponent, { timeout: 50 }));
    expect(wrapper.text()).toBe("loading");
    start = Date.now();
    isLoaded = false;
    while (!isLoaded && Date.now() - start < 500) {
      await wait({ timeout: 9, updateWrapper: false });
      isLoaded = Date.now() - start >= 50;
      expect(wrapper.text()).toBe("loading"); // will be reported as loading because we didn't update wrapper
    }
    expect(isLoaded).toBe(true);
    wrapper.update();
    expect(wrapper.text()).toBe("loaded");
  });

  it("waitWhile", async () => {
    // test basic functionality with Enzyme's mount
    wrapper = enzymeMount(React.createElement(AsyncComponent));
    expect(wrapper.text()).toBe("loading");
    await waitWhile(() => {
      wrapper.update();
      return wrapper.text() === "loading";
    });
    expect(wrapper.text()).toBe("loaded");

    // test that wrapper gets auto-updated when using mount
    wrapper = mount(React.createElement(AsyncComponent));
    expect(wrapper.text()).toBe("loading");
    await waitWhile(() => wrapper.text() === "loading");
    expect(wrapper.text()).toBe("loaded");

    // test timed wait
    wrapper = mount(React.createElement(AsyncComponent, { timeout: 10 }));
    expect(wrapper.text()).toBe("loading");
    await waitWhile(() => wrapper.text() === "loading");
    expect(wrapper.text()).toBe("loaded");

    // test timing out
    let ok;
    wrapper = mount(React.createElement(AsyncComponent, { timeout: 100 }));
    expect(wrapper.text()).toBe("loading");
    try {
      await waitWhile(() => wrapper.text() === "loading", { timeout: 10 });
    } catch (e) {
      if (e.code !== "TIMED_OUT") throw e;
      ok = true;
    }
    if (!ok) throw new Error("Test was supposed to time out.");
  });

  it("waitUntilCalled", async () => {
    let mockFn = jest.fn();

    // test basic functionality with Enzyme's mount
    wrapper = enzymeMount(React.createElement(CallComponent, { onCall: mockFn }));
    expect(wrapper.text()).toBe("0");
    setTimeout(() => wrapper.instance().call(), 10);
    await waitUntilCalled(mockFn);
    wrapper.update();
    expect(wrapper.text()).toBe("1");

    // test that wrapper gets auto-updated when using mount
    mockFn.mockClear();
    wrapper = mount(React.createElement(CallComponent, { onCall: mockFn }));
    expect(wrapper.text()).toBe("0");
    setTimeout(() => wrapper.instance().call(), 10);
    await waitUntilCalled(mockFn);
    expect(wrapper.text()).toBe("1");

    // test with updateWrapper
    mockFn.mockClear();
    setTimeout(() => wrapper.instance().call(), 10);
    await waitUntilCalled(mockFn, { updateWrapper: false });
    expect(wrapper.text()).toBe("1");
    wrapper.update();
    expect(wrapper.text()).toBe("2");

    // test timing out
    mockFn.mockClear();
    let ok;
    try {
      await waitUntilCalled(mockFn, { timeout: 10 });
    } catch (e) {
      if (e.code !== "CALL_COUNT_TOO_LOW") throw e;
      ok = true;
    }
    if (!ok) throw new Error("Test was supposed to time out.");
  });

  it("waitUntilCalledTimes", async () => {
    let mockFn = jest.fn();

    // test basic functionality with Enzyme's mount
    wrapper = enzymeMount(React.createElement(CallComponent, { onCall: mockFn }));
    expect(wrapper.text()).toBe("0");
    setTimeout(() => wrapper.instance().call(), 10);
    await waitUntilCalledTimes(mockFn, 1);
    wrapper.update();
    expect(wrapper.text()).toBe("1");

    // test that wrapper gets auto-updated when using mount
    mockFn.mockClear();
    wrapper = mount(React.createElement(CallComponent, { onCall: mockFn }));
    expect(wrapper.text()).toBe("0");
    setTimeout(() => wrapper.instance().call(), 10);
    await waitUntilCalledTimes(mockFn, 1);
    expect(wrapper.text()).toBe("1");

    // test more than 1 call
    mockFn.mockClear();
    wrapper = mount(React.createElement(CallComponent, { onCall: mockFn }));
    expect(wrapper.text()).toBe("0");
    let lastTimeout;
    setTimeout(() => {
      wrapper.instance().call();
      setTimeout(() => {
        wrapper.instance().call();
        setTimeout(() => {
          wrapper.instance().call();
          lastTimeout = setTimeout(() => wrapper.instance().call(), 50); // shouldn't get executed
        }, 10);
      }, 10);
    }, 10);
    await waitUntilCalledTimes(mockFn, 3);
    expect(wrapper.text()).toBe("3");
    expect(lastTimeout).toBeDefined();
    clearTimeout(lastTimeout);

    // test with updateWrapper
    mockFn.mockClear();
    wrapper = mount(React.createElement(CallComponent, { onCall: mockFn }));
    expect(wrapper.text()).toBe("0");
    setTimeout(() => wrapper.instance().call(), 10);
    await waitUntilCalledTimes(mockFn, 1, { updateWrapper: false });
    expect(wrapper.text()).toBe("0");
    wrapper.update();
    expect(wrapper.text()).toBe("1");

    // test timing out
    mockFn.mockClear();
    let ok;
    try {
      await waitUntilCalledTimes(mockFn, 1, { timeout: 10 });
    } catch (e) {
      if (e.code !== "CALL_COUNT_TOO_LOW") throw e;
      ok = true;
    }
    if (!ok) throw new Error("Test was supposed to time out.");
  });
});
