import { Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { act, mount } from "uu5g05-test";

const CONFIG = {
  props: {
    // withFormInput
    inputAttrs: {
      values: [{ "data-my": "1" }],
    },
    layout: {
      values: ["vertical", "1:1", "1:2", "2:3"],
    },
    label: {
      values: ["Label", 0, <span key="0">Label</span>, { en: "Label EN" }],
    },
    message: {
      values: ["Message", 0, <span key="0">Message</span>, { en: "Message EN" }],
      opt: { skipRevertedValueSnapshotCheck: true }, // initial render shows message without delay; next renders show it with delay so snapshots would differ
    },
    messageParams: {
      values: [[0], [], ["^abc$"]],
    },
    feedback: {
      values: ["error", "warning", "success"],
    },

    // withInputExtension
    iconLeft: {
      values: ["uugds-pencil"],
    },
    iconRight: {
      values: ["uugds-pencil"],
    },
    iconRightList: {
      values: [[{ icon: "uugds-pencil" }, { icon: "uugds-favorites", onClick: () => {} }]],
    },
    prefix: {
      values: ["prefix test"],
    },
    suffix: {
      values: ["suffix test"],
    },
  },
  requiredProps: {
    onChange: () => {},
  },
  opt: { renderer: "mount" },
};

function testProperties(Component, expectedInputRefTagName, requiredProps = CONFIG.requiredProps, testsToSkip = []) {
  let _it = (name, ...args) => {
    if (!testsToSkip.includes(name)) return it(name, ...args);
  };

  // withFormInput
  _it("info", () => {
    // info is shown after clicking a label icon
    let wrapper = mount(<Component {...requiredProps} label="Label" info="Info" />);
    expect(wrapper.find(Uu5Elements.Popover).length).toBe(0);
    let infoIconWrapper = wrapper.find("label").first().find(Uu5Elements.Icon).first();
    act(() => {
      infoIconWrapper.simulate("click");
    });
    wrapper.update();
    expect(wrapper.find(Uu5Elements.Popover).length).toBe(1);
    expect(wrapper.find(Uu5Elements.Popover).text()).toContain("Info");

    wrapper.setProps({ info: { en: "Info EN" } });
    expect(wrapper.find(Uu5Elements.Popover).length).toBe(1);
    expect(wrapper.find(Uu5Elements.Popover).text()).toContain("Info EN");

    wrapper.setProps({ info: <span>Info2</span> });
    expect(wrapper.find(Uu5Elements.Popover).length).toBe(1);
    expect(wrapper.find(Uu5Elements.Popover).text()).toContain("Info2");

    wrapper.setProps({ info: 0 });
    expect(wrapper.find(Uu5Elements.Popover).length).toBe(1);
    expect(wrapper.find(Uu5Elements.Popover).text()).toContain("0");
  });

  _it("inputRef", () => {
    let ref = Utils.Component.createRef();
    mount(<Component {...requiredProps} inputRef={ref} />);
    expect(ref.current?.tagName).toBe(expectedInputRefTagName);
  });

  // withInputExtension
  _it("onFeedbackClick", () => {
    let onFeedbackClick = jest.fn();
    let wrapper = mount(<Component {...requiredProps} feedback="success" onFeedbackClick={onFeedbackClick} />);
    let feedbackIconWrapper = wrapper
      .find(Uu5Elements.Icon)
      .filterWhere((it) => /circle/.test(it.props().icon))
      .last();
    act(() => {
      feedbackIconWrapper.simulate("click");
    });
    expect(onFeedbackClick).toHaveBeenCalledTimes(1);
    expect(onFeedbackClick).lastCalledWith(expect.objectContaining({ type: "click" }));
  });

  _it("onIconLeftClick", () => {
    let onIconLeftClick = jest.fn();
    let wrapper = mount(<Component {...requiredProps} iconLeft="uugds-pencil" onIconLeftClick={onIconLeftClick} />);
    let iconWrapper = wrapper.find(Uu5Elements.Icon).filterWhere((it) => it.props().icon === "uugds-pencil");
    act(() => {
      iconWrapper.simulate("click");
    });
    expect(onIconLeftClick).toHaveBeenCalledTimes(1);
    expect(onIconLeftClick).lastCalledWith(expect.objectContaining({ type: "click" }));
  });

  _it("onIconRightClick", () => {
    let onIconRightClick = jest.fn();
    let wrapper = mount(<Component {...requiredProps} iconRight="uugds-pencil" onIconRightClick={onIconRightClick} />);
    let iconWrapper = wrapper.find(Uu5Elements.Icon).filterWhere((it) => it.props().icon === "uugds-pencil");
    act(() => {
      iconWrapper.simulate("click");
    });
    expect(onIconRightClick).toHaveBeenCalledTimes(1);
    expect(onIconRightClick).lastCalledWith(expect.objectContaining({ type: "click" }));
  });

  _it("iconRightList", () => {
    let onClick = jest.fn();
    let wrapper = mount(
      <Component {...requiredProps} iconRightList={[{ icon: "uugds-pencil" }, { icon: "uugds-favorites", onClick }]} />,
    );
    let iconWrapper = wrapper.find(Uu5Elements.Icon).filterWhere((it) => it.props().icon === "uugds-favorites");
    act(() => {
      iconWrapper.simulate("click");
    });
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).lastCalledWith(expect.objectContaining({ type: "click" }));
  });
}

export default { CONFIG, testProperties };
