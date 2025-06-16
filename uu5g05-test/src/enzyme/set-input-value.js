const { act } = require("./core.js");
const { cleanupErrorStack } = require("../internal/helpers.js");

function setInputValue(wrapper, value, focusBeforeSetting = true, blurAfterSetting = true) {
  let input = wrapper
    .findWhere((it) => {
      let isInput = it.type() === "input" || it.type() === "textarea";
      let domNode = it.getDOMNode();
      return isInput && !domNode?.readOnly;
    })
    .first();
  if (input && input.length === 1) {
    if (focusBeforeSetting) {
      act(() => {
        input.simulate("focus");
      });
    }
    input.getDOMNode().value = value;
    act(() => {
      input.simulate("change");
    });
    if (blurAfterSetting) {
      act(() => {
        document.body.dispatchEvent(new MouseEvent("mousedown"));
      });
      act(() => {
        input.simulate("blur");
      });
      act(() => {
        document.body.dispatchEvent(new MouseEvent("mouseup"));
      });
      act(() => {
        document.body.dispatchEvent(new MouseEvent("click"));
      });
    }
  } else {
    let error = new Error("Input not found in specified wrapper.");
    error.code = "INPUT_NOT_FOUND";
    error.stack = cleanupErrorStack(error.stack);
    throw error;
  }
}

module.exports = { setInputValue };
