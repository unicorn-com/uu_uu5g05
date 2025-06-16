import { PropTypes, Utils, Lsi, useState } from "uu5g05";
import { Test, act, mount, setInputValue, wait } from "uu5g05-test";

function initTests() {}

const CONFIG = {
  props: {
    autoComplete: {
      values: [true, false],
    },
    value: {
      values: ["abc", ""],
    },
    colorScheme: {
      values: [...PropTypes.COLOR_SCHEME.building, ...PropTypes.COLOR_SCHEME.meaning, ...PropTypes.COLOR_SCHEME.basic],
    },
    significance: {
      values: ["common", "highlighted", "distinct", "subdued"],
    },
    size: {
      values: ["xxs", "xs", "s", "m", "l", "xl"],
    },
    borderRadius: {
      values: ["none", "elementary", "moderate", "expressive", "full"],
    },
    width: {
      values: [200, "100px", "50%"],
    },
    name: {
      values: ["inputName"],
    },
    placeholder: {
      values: ["test placeholder"],
    },
    readOnly: {
      values: [true, false],
    },
    required: {
      values: [true, false],
    },
    autoFocus: {
      values: [true, false],
    },
    disabled: {
      values: [true, false],
    },
  },
  requiredProps: {
    onChange: () => {},
  },
  opt: { renderer: "mount" },
};

function getFocusableElement(wrapper) {
  return wrapper
    .findWhere((it) => {
      let isInput = it.type() === "input" || it.type() === "textarea";
      let domNode = it.getDOMNode();
      let tabIndex = domNode?.tabIndex;
      return (isInput && !domNode?.readOnly) || (!isInput && tabIndex === 0);
    })
    .first();
}

function focusAndBlur(wrapper) {
  let focusableElement = getFocusableElement(wrapper);
  act(() => {
    focusableElement.simulate("focus");
  });
  // NOTE "focus" event on some components remounts the input so we need to find focusable element again.
  wrapper.update();
  focusableElement = getFocusableElement(wrapper);
  act(() => {
    focusableElement.simulate("blur");
  });
}

// Component <=> *Input, e.g. NumberInput, DateInput
function testProperties(
  Component,
  aValidValue,
  theSameValidValueButForHtmlInput = aValidValue,
  requiredProps = CONFIG.requiredProps,
  testsToSkip = [],
) {
  let _it = (name, ...args) => {
    if (!testsToSkip.includes(name)) return it(name, ...args);
  };

  _it("onValidationEnd", async () => {
    let onValidationEnd = jest.fn();
    let wrapper = mount(<Component {...requiredProps} required onValidationEnd={onValidationEnd} />);
    expect(onValidationEnd).toHaveBeenCalledTimes(1);
    expect(onValidationEnd).lastCalledWith(expect.objectContaining({ data: { errorList: [], valid: true } })); // "required" validator is skipped during mount
    onValidationEnd.mockClear();

    focusAndBlur(wrapper);
    expect(onValidationEnd).toHaveBeenCalledTimes(1);
    expect(onValidationEnd).lastCalledWith(
      expect.objectContaining({
        data: {
          errorList: [
            expect.objectContaining({ code: "required", feedback: "error", messageParams: [true], async: false }),
          ],
          valid: false,
        },
      }),
    );

    // if async validation is running and input gets revalidated again, then only 1 onValidationEnd
    // should be triggerred (i.e. the result of latest validation)
    onValidationEnd.mockClear();
    let onValidationStart = jest.fn();
    const ERROR1 = { message: { en: "ERR1" } };
    const ERROR2 = { message: { en: "ERR2" } };
    wrapper.setProps({ onValidationStart, onValidate: async () => ERROR1, required: false });
    expect(onValidationStart).toHaveBeenCalledTimes(1);
    expect(onValidationEnd).toHaveBeenCalledTimes(0);
    wrapper.setProps({ onValidate: async () => ERROR2 });
    onValidationStart.mockClear();
    focusAndBlur(wrapper);
    expect(onValidationStart).toHaveBeenCalledTimes(1);
    await wait();
    expect(onValidationEnd).toHaveBeenCalledTimes(1);
    expect(onValidationEnd).lastCalledWith(
      expect.objectContaining({ data: { errorList: [expect.objectContaining(ERROR2)], valid: false } }),
    );
  });

  _it("onValidationStart", () => {
    let onValidationStart = jest.fn();
    let wrapper = mount(<Component {...requiredProps} required onValidationStart={onValidationStart} />);
    expect(onValidationStart).toHaveBeenCalledTimes(1);
    // there is no event for onValidationStart
    //expect(onValidationStart).lastCalledWith(expect.objectContaining({}));
    onValidationStart.mockClear();

    wrapper.setProps({ required: false, onValidate: async () => true, validateOnChange: true });
    expect(onValidationStart).toHaveBeenCalledTimes(1);
    onValidationStart.mockClear();

    wrapper.setProps({ value: aValidValue });
    expect(onValidationStart).toHaveBeenCalledTimes(1);
    onValidationStart.mockClear();
  });

  _it("onValidate", async () => {
    const ERROR = { message: { en: "EN" }, feedback: "error", messageParams: ["123"], async: true, code: "onValidate" };
    let onValidate1 = jest.fn(() => ERROR);
    let onValidationEnd = jest.fn();
    let wrapper = mount(
      <Component
        {...requiredProps}
        value={aValidValue}
        validateOnChange
        onValidationEnd={onValidationEnd}
        onValidate={onValidate1}
      />,
    );
    expect(onValidate1).toHaveBeenCalledTimes(1);
    expect(onValidate1).lastCalledWith(expect.objectContaining({ data: { value: aValidValue, type: "mount" } }));
    expect(onValidationEnd).lastCalledWith(expect.objectContaining({ data: { errorList: [ERROR], valid: false } }));
    onValidate1.mockClear();

    // changing onValidate shouldn't revalidate immediately ...
    const WARNING = { message: { en: "EN2" }, feedback: "warning", async: true, code: "onValidate" };
    let onValidate2 = jest.fn(() => WARNING);
    wrapper.setProps({ onValidate: onValidate2 });
    expect(onValidate1).toHaveBeenCalledTimes(0);
    expect(onValidate2).toHaveBeenCalledTimes(0);

    // ... but it should use new onValidate in any further validation, e.g. on blur
    focusAndBlur(wrapper);
    expect(onValidate1).toHaveBeenCalledTimes(0);
    expect(onValidate2).toHaveBeenCalledTimes(1);
    expect(onValidate2).lastCalledWith(expect.objectContaining({ data: { value: aValidValue, type: "blur" } }));
    expect(onValidationEnd).lastCalledWith(expect.objectContaining({ data: { errorList: [WARNING], valid: true } }));
    onValidate2.mockClear();

    // changing value does revalidate (because of validateOnChange)
    wrapper.setProps({ value: undefined });
    expect(onValidate2).toHaveBeenCalledTimes(1);
    expect(onValidate2).lastCalledWith(expect.objectContaining({ data: { value: undefined, type: "change" } }));
    onValidate2.mockClear();
    onValidationEnd.mockClear();

    // returning true/undefined from onValidate means input is valid
    wrapper.setProps({ onValidate: () => true });
    focusAndBlur(wrapper);
    expect(onValidationEnd).lastCalledWith(expect.objectContaining({ data: { errorList: [], valid: true } }));
    onValidationEnd.mockClear();
    wrapper.setProps({ onValidate: () => undefined });
    focusAndBlur(wrapper);
    expect(onValidationEnd).lastCalledWith(expect.objectContaining({ data: { errorList: [], valid: true } }));
    onValidationEnd.mockClear();

    // onValidate can be async
    let onValidate3 = jest.fn(async () => ERROR);
    wrapper.setProps({ onValidate: onValidate3 });
    focusAndBlur(wrapper);
    expect(onValidate3).toHaveBeenCalledTimes(1);
    expect(onValidationEnd).toHaveBeenCalledTimes(0);
    await wait();
    expect(onValidationEnd).toHaveBeenCalledTimes(1);
    expect(onValidationEnd).lastCalledWith(expect.objectContaining({ data: { errorList: [ERROR], valid: false } }));

    // onValidate should not be called if sync validators returned an error
    wrapper.setProps({ required: true, value: undefined });
    onValidate3.mockClear();
    focusAndBlur(wrapper);
    expect(onValidate3).toHaveBeenCalledTimes(0);

    // onValidate should be called if sync validators returned a warning only
    wrapper.setProps({ validationMap: { required: { feedback: "warning" } } });
    onValidate3.mockClear();
    focusAndBlur(wrapper);
    expect(onValidate3).toHaveBeenCalledTimes(1);
  });

  _it("validateOnChange", () => {
    let onValidationEnd = jest.fn();
    let wrapper = mount(
      <Component {...requiredProps} required value={aValidValue} validateOnChange onValidationEnd={onValidationEnd} />,
    );
    onValidationEnd.mockClear();
    wrapper.setProps({ value: undefined });
    expect(onValidationEnd).lastCalledWith(
      expect.objectContaining({ data: { errorList: [expect.objectContaining({ code: "required" })], valid: false } }),
    );
    onValidationEnd.mockClear();

    // changing value without validateOnChange shouldn't revalidate
    wrapper.setProps({ validateOnChange: false, value: aValidValue });
    expect(onValidationEnd).toHaveBeenCalledTimes(0);
    onValidationEnd.mockClear();
  });

  _it("validateOnMount", () => {
    let onValidationEnd = jest.fn();
    let wrapper = mount(<Component {...requiredProps} validateOnMount onValidationEnd={onValidationEnd} />);
    expect(onValidationEnd).toHaveBeenCalledTimes(1);
    onValidationEnd.mockClear();
    wrapper.setProps({ validateOnMount: false }); // should do nothing on already mounted component
    expect(onValidationEnd).toHaveBeenCalledTimes(0);
    wrapper.setProps({ validateOnMount: true }); // should do nothing on already mounted component
    expect(onValidationEnd).toHaveBeenCalledTimes(0);

    mount(<Component {...requiredProps} validateOnMount={false} onValidationEnd={onValidationEnd} />);
    expect(onValidationEnd).toHaveBeenCalledTimes(0);
  });

  _it("onChange", () => {
    let onChange = jest.fn();
    let wrapper = mount(<Component {...requiredProps} onChange={onChange} />);
    expect(onChange).toHaveBeenCalledTimes(0);
    setInputValue(wrapper, theSameValidValueButForHtmlInput);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).lastCalledWith(expect.objectContaining({ data: { value: aValidValue } }));
  });

  _it("onFocus", () => {
    let onFocus = jest.fn((e) => e?.persist?.());
    let wrapper = mount(<Component {...requiredProps} value={aValidValue} onFocus={onFocus} />);
    expect(onFocus).toHaveBeenCalledTimes(0);
    let domInput = getFocusableElement(wrapper);
    act(() => {
      domInput.simulate("focus");
    });
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onFocus).lastCalledWith(expect.objectContaining({ type: "focus" }));
  });

  _it("onBlur", () => {
    let onBlur = jest.fn((e) => e?.persist?.());
    let wrapper = mount(<Component {...requiredProps} value={aValidValue} onBlur={onBlur} />);
    expect(onBlur).toHaveBeenCalledTimes(0);
    focusAndBlur(wrapper);
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(onBlur).lastCalledWith(expect.objectContaining({ type: "blur" }));
  });

  _it("required", () => {
    let onValidationEnd = jest.fn();
    let wrapper = mount(<Component {...requiredProps} required onValidationEnd={onValidationEnd} />);
    focusAndBlur(wrapper);
    expect(onValidationEnd).lastCalledWith(
      expect.objectContaining({
        data: {
          errorList: [expect.objectContaining({ code: "required", async: false, messageParams: [true] })],
          valid: false,
        },
      }),
    );

    // blurring should revalidate even "required" validator
    wrapper.setProps({ required: false });
    focusAndBlur(wrapper);
    expect(onValidationEnd).lastCalledWith(expect.objectContaining({ data: { errorList: [], valid: true } }));
  });

  _it("validationMap", async () => {
    let onValidationEnd = jest.fn();
    const ComponentWithRenderedValidationErrors = (props) => {
      const [errorList, setErrorList] = useState([]);
      return (
        <div>
          <Component
            {...props}
            onValidationEnd={(e) => {
              setErrorList(e.data.errorList);
              props.onValidationEnd?.(e);
            }}
          />
          {errorList.map((it, i) => (
            <span key={i}>
              <Lsi lsi={it?.message} params={it?.messageParams} />
            </span>
          ))}
        </div>
      );
    };

    // *Input components should have validationMap on them
    expect(Component.validationMap).toBeTruthy();

    // default validationMap
    let wrapper = mount(
      <ComponentWithRenderedValidationErrors {...requiredProps} required onValidationEnd={onValidationEnd} />,
    );
    onValidationEnd.mockClear(); // validator for "required" doesn't run on mount, others do, so onValidationEnd got called
    focusAndBlur(wrapper);
    expect(onValidationEnd).toHaveBeenCalledTimes(1);
    expect(onValidationEnd).lastCalledWith(
      expect.objectContaining({
        data: {
          errorList: [expect.objectContaining({ ...Component.validationMap.required, code: "required" })],
          valid: false,
        },
      }),
    );
    onValidationEnd.mockClear();

    // changing validationMap prop should re-validate
    wrapper.setProps({ validationMap: { required: { message: { en: "Test message." } } } });
    expect(onValidationEnd).toHaveBeenCalledTimes(1);
    onValidationEnd.mockClear();

    // custom partial validationMap
    wrapper.setProps({ validationMap: { required: { feedback: "warning" } } });
    onValidationEnd.mockClear();
    focusAndBlur(wrapper);
    expect(onValidationEnd).toHaveBeenCalledTimes(1);
    expect(onValidationEnd).lastCalledWith(
      expect.objectContaining({
        data: {
          errorList: [
            expect.objectContaining({ ...Component.validationMap.required, feedback: "warning", code: "required" }),
          ],
          valid: true,
        },
      }),
    );
    onValidationEnd.mockClear();

    // custom full validationMap
    wrapper.setProps({ validationMap: { required: { feedback: "error", message: { en: "Validation error EN" } } } });
    onValidationEnd.mockClear();
    focusAndBlur(wrapper);
    expect(onValidationEnd).toHaveBeenCalledTimes(1);
    expect(onValidationEnd).lastCalledWith(
      expect.objectContaining({
        data: {
          errorList: [
            expect.objectContaining({
              feedback: "error",
              message: expect.any(Object),
              code: "required",
            }),
          ],
          valid: false,
        },
      }),
    );
    await wait();
    // expect(Test.screen.getByText("Validation error EN")).toBeInTheDocument();
    expect(wrapper.text()).toContain("Validation error EN");
    onValidationEnd.mockClear();

    // class-based partial validationMap
    let origValidationMap = Component.validationMap;
    try {
      Component.validationMap = { required: { feedback: "warning" } };
      wrapper.setProps({ validationMap: undefined });
      onValidationEnd.mockClear();
      focusAndBlur(wrapper);
      expect(onValidationEnd).toHaveBeenCalledTimes(1);
      expect(onValidationEnd).lastCalledWith(
        expect.objectContaining({
          data: {
            errorList: [
              expect.objectContaining({ ...origValidationMap.required, feedback: "warning", code: "required" }),
            ],
            valid: true,
          },
        }),
      );

      // class-based full validationMap
      Component.validationMap = { required: { feedback: "error", message: { en: "Validation error EN2" } } };
      wrapper.setProps({ validationMap: undefined }); // cause re-render
      onValidationEnd.mockClear();
      focusAndBlur(wrapper);
      expect(onValidationEnd).toHaveBeenCalledTimes(1);
      expect(onValidationEnd).lastCalledWith(
        expect.objectContaining({
          data: {
            errorList: [
              expect.objectContaining({
                feedback: "error",
                message: expect.any(Object),
                code: "required",
              }),
            ],
            valid: false,
          },
        }),
      );
      await wait();
      // expect(Test.screen.getByText("Validation error EN2")).toBeInTheDocument();
      expect(wrapper.text()).toContain("Validation error EN2");
      onValidationEnd.mockClear();
    } finally {
      Component.validationMap = origValidationMap;
    }
  });

  _it("validationRef", async () => {
    let onValidationStart = jest.fn();
    let onValidationEnd = jest.fn();
    let validationRef = Utils.Component.createRef();
    let wrapper = mount(
      <Component
        {...requiredProps}
        required
        validationRef={validationRef}
        onValidationStart={onValidationStart}
        onValidationEnd={onValidationEnd}
      />,
    );
    await wait();

    // running validationRef.current() should perform validation
    onValidationStart.mockClear();
    onValidationEnd.mockClear();
    expect(typeof validationRef.current).toBe("function");
    let validationPromise;
    act(() => {
      validationPromise = validationRef.current();
    });
    await wait();
    expect(onValidationStart).toHaveBeenCalledTimes(1);
    expect(onValidationEnd).toHaveBeenCalledTimes(1);
    expect(onValidationEnd.mock.calls[0][0]?.data?.errorList?.length).toBe(1);
    // TODO Next major (when validationRef.current() no longer returns array) - use expect().toEqual.
    // expect(onValidationEnd.mock.calls[0][0]?.data).toEqual(onValidationEnd.mock.calls[0][0]?.data);
    expect(await validationPromise).toMatchObject(onValidationEnd.mock.calls[0][0]?.data);

    // support filterFn - validationRef.current(filterFn)
    let filterFn = jest.fn(() => false); // skip all
    onValidationStart.mockClear();
    onValidationEnd.mockClear();
    expect(typeof validationRef.current).toBe("function");
    act(() => {
      validationPromise = validationRef.current(filterFn);
    });
    await wait();
    expect(filterFn.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(filterFn).toHaveBeenCalledWith(expect.objectContaining({ code: "required" })); // at least "required" validation should have been filtered
    expect(onValidationEnd).lastCalledWith(expect.objectContaining({ data: { errorList: [], valid: true } }));
    // TODO Next major (when validationRef.current() no longer returns array) - use expect().toEqual.
    // expect(await validationPromise).toEqual(onValidationEnd.mock.calls[0][0]?.data);
    expect(await validationPromise).toMatchObject(onValidationEnd.mock.calls[0][0]?.data);

    // validationRef can be function
    let validationRefAsFn = jest.fn();
    wrapper.setProps({ validationRef: validationRefAsFn });
    expect(validationRefAsFn).toHaveBeenCalledTimes(1);
    expect(validationRefAsFn).lastCalledWith(expect.any(Function));
    validationRefAsFn.mockClear();
    wrapper.unmount();
    expect(validationRefAsFn).toHaveBeenCalledTimes(1);
    expect(validationRefAsFn).lastCalledWith(undefined);
  });
}

const checkValidationResult = (Component, props, validationResult = true, errorCodeList = []) => {
  it("validation", () => {
    let _validationResult;
    let onValidationEnd = jest.fn((e) => {
      _validationResult = e.data;
    });
    let wrapper = mount(<Component {...props} onValidationEnd={onValidationEnd} />);

    focusAndBlur(wrapper);
    expect(_validationResult.valid).toBe(validationResult);
    expect(_validationResult.errorList).toHaveLength(errorCodeList.length);
    _validationResult.errorList.forEach(({ code }) => {
      expect(errorCodeList).toContain(code);
    });
  });
};

export default { CONFIG, testProperties, initTests, checkValidationResult };
