import { Utils, useState } from "uu5g05";
import { Test } from "uu5g05-test";

function withInputController(Input) {
  return (props) => {
    const { value: initValue, onValidationEnd, onChange, feedback, message, messageParams, ...inputProps } = props;
    const [value, setValue] = useState(initValue);
    const [errorList, setErrorList] = useState();

    const handleChange = (e) => {
      typeof onChange === "function" && onChange(e);
      setValue(e.data.value);
    };

    const handleValidationEnd = (e) => {
      typeof onValidationEnd === "function" && onValidationEnd(e);
      setErrorList(e.data.errorList.length ? e.data.errorList : null);
    };

    return (
      <>
        <Input
          {...inputProps}
          value={value}
          feedback={errorList?.[0].feedback || feedback}
          message={errorList?.[0].message || message}
          messageParams={errorList?.[0].messageParams || messageParams}
          onChange={handleChange}
          onValidationEnd={handleValidationEnd}
        />
      </>
    );
  };
}

function testPattern(setup, pattern, code, message) {
  it("checks pattern property is properly validated", async () => {
    const handleValidationEnd = jest.fn();
    const props = { pattern, onValidationEnd: handleValidationEnd };
    const { user, input } = await setup(props);

    await user.type(input, "12345[Tab]");
    // .at(0) seems not to be working properly
    const error = handleValidationEnd.mock.lastCall[0]?.data?.errorList[0];

    expect(error).toMatchObject({ code: code, feedback: "error" });
    if (message) {
      expect(Test.screen.getByText(message)).toBeVisible();
    }
  });
}

function testSpellCheck(setup) {
  it("checks spellcheck property is properly passed to input", async () => {
    const props = { spellCheck: true };
    const { input } = await setup(props);

    expect(input).toHaveAttribute("spellcheck", "true");
  });
}

function testMinLength(setup, { skipMessageTest = false } = {}) {
  it("checks minLength property is properly validated", async () => {
    const handleValidationEnd = jest.fn();
    const minLength = 3;
    const props = { minLength, onValidationEnd: handleValidationEnd };
    const { user, input } = await setup(props);

    await user.type(input, "12[Tab]");
    const error = handleValidationEnd.mock.lastCall[0]?.data?.errorList[0];

    expect(error).toMatchObject({ code: "minLength", feedback: "error" });

    !skipMessageTest &&
      expect(Test.screen.getByText(`Text has to contain at least ${minLength} characters.`)).toBeVisible();
  });
}

function testMaxLength(setup, { skipMessageTest = false } = {}) {
  it("checks maxLength property is properly validated", async () => {
    const handleValidationEnd = jest.fn();
    const maxLength = 3;
    const props = { maxLength, onValidationEnd: handleValidationEnd };
    const { user, input } = await setup(props);

    await user.type(input, "1234[Tab]");

    const error = handleValidationEnd.mock.lastCall[0]?.data?.errorList[0];
    expect(error).toMatchObject({ code: "maxLength", feedback: "error" });

    !skipMessageTest &&
      expect(Test.screen.getByText(`Text has to contain maximum of ${maxLength} characters.`)).toBeVisible();
  });
}

function testAutoComplete(setup) {
  it("checks autoComplete property is properly passed to input", async () => {
    const props = { autoComplete: "name" };
    const { input } = await setup(props);

    expect(input).toHaveAttribute("autoComplete", "name");
  });
}

function testOnValidationStart(setup, { onlyClick = false } = {}) {
  it("checks onValidationStart handler is properly called", async () => {
    const handleValidationStart = jest.fn();
    const props = { onValidationStart: handleValidationStart };
    const { user, input } = await setup(props);

    if (!onlyClick) {
      await user.type(input, "12345[Tab]");
    } else {
      await user.click(input);
      await user.type(input, "[Tab]");
    }

    expect(handleValidationStart).toHaveBeenCalledTimes(2);
  });
}

function testOnValidationEnd(setup, { onlyClick = false } = {}) {
  it("checks onValidationEnd handler is properly called", async () => {
    const handleValidationEnd = jest.fn();
    const props = { onValidationEnd: handleValidationEnd };
    const { user, input } = await setup(props);

    if (!onlyClick) {
      await user.type(input, "12345[Tab]");
    } else {
      await user.click(input);
      await user.type(input, "[Tab]");
    }

    expect(handleValidationEnd).toHaveBeenCalledTimes(2);
  });
}

function testOnValidate(setup, value, { onlyClick = false } = {}) {
  it("checks onValidate handler is properly called", async () => {
    const handleValidate = jest.fn();
    const props = { onValidate: handleValidate, value };
    const { user, input } = await setup(props);

    if (!onlyClick) {
      await user.type(input, "12345[Tab]");
    } else {
      await user.click(input);
      await user.type(input, "[Tab]");
    }

    expect(handleValidate).toHaveBeenCalledTimes(2);
  });

  it("checks onValidate handler is called during mount by default", async () => {
    const handleValidate = jest.fn();
    const props = { onValidate: handleValidate };
    await setup(props);

    expect(handleValidate).toHaveBeenCalledTimes(1);
  });
}

function testValidateOnChange(setup, value = "a") {
  it("checks validateOnChange property is properly working", async () => {
    const handleValidationEnd = jest.fn();
    const props = { onValidationEnd: handleValidationEnd, validateOnChange: true, required: true, value };
    const { user, input } = await setup(props);

    // NOTE E.g. <input type="number"> doesn't allow setting selection and RTL handles it as if cursor
    // was at the start, so we'll reset selection always to start (index 0).
    await user.type(input, "{delete}", { initialSelectionStart: 0, initialSelectionEnd: 0 });

    expect(handleValidationEnd).toBeCalledTimes(2);
    // TODO MFA It seems the validateOnChange is not working
    expect(handleValidationEnd).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ errorList: [expect.objectContaining({ code: "required" })] }),
      }),
    );
  });
}

function testValidateOnMount(setup) {
  it("checks validateOnMount = false turns off validation during mounting", async () => {
    const handleValidate = jest.fn();
    const props = { onValidate: handleValidate, validateOnMount: false };
    await setup(props);

    expect(handleValidate).toHaveBeenCalledTimes(0);
  });
}

function testValidationRef(setup) {
  it("checks validationRef properly works", async () => {
    let validationRef = Utils.Component.createRef();
    const handleValidationStart = jest.fn();
    const props = {
      validationRef: validationRef,
      onValidationStart: handleValidationStart,
      required: true,
    };
    await setup(props);

    expect(typeof validationRef.current).toBe("function");
    expect(handleValidationStart).toHaveBeenCalledTimes(1);
    let errorList;
    await Test.act(async () => {
      errorList = await validationRef.current();
    });
    expect(errorList).toMatchObject({
      valid: false,
      errorList: [
        {
          code: "required",
          feedback: "error",
          messageParams: [true],
          message: expect.any(Object),
          async: false,
        },
      ],
    });
    expect(handleValidationStart).toHaveBeenCalledTimes(2);

    await Test.act(async () => {
      errorList = await validationRef.current(({ code }) => code !== "required");
    });
    expect(errorList).toMatchObject({
      valid: true,
      errorList: [],
    });
    expect(handleValidationStart).toHaveBeenCalledTimes(3);
  });
}

function testSignificance(setup, { itemList, colorScheme } = {}) {
  it.each(itemList)("checks significance = %s is properly shown", async (significance) => {
    const { input } = await setup({ significance });

    expect(input).toHaveGdsShape(["formElement", "light", colorScheme, significance]);
  });
}

function testAutoFocus(setup, { input = false } = {}) {
  it("checks autoFocus property sets focus to input", async () => {
    let testId;
    const { props } = await setup({ autoFocus: true });

    testId = input ? props.testId + "-input-field" : props.testId;

    expect(document.activeElement.getAttribute("data-testid")).toEqual(testId);
  });
}

export {
  withInputController,
  testPattern,
  testSpellCheck,
  testMinLength,
  testMaxLength,
  testAutoComplete,
  testOnValidationStart,
  testOnValidationEnd,
  testOnValidate,
  testValidateOnChange,
  testValidateOnMount,
  testValidationRef,
  testSignificance,
  testAutoFocus,
};
