import { useEffect, useState, Utils } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import { Test, Utils as TestUtils } from "uu5g05-test";

function getDefaultProps() {
  return {};
}

async function nonVisualComponentSetup(Component, props, { wrapper, Wrapper, queries } = {}) {
  let jsx = Utils.Element.create(Component, props);
  wrapper ??= Wrapper;
  if (wrapper) jsx = Utils.Element.create(wrapper, null, jsx);

  const user = Test.userEvent.setup();
  const view = Test.render(jsx, { queries });
  await TestUtils.wait();
  if (wrapper) {
    const { rerender } = view;
    view.rerender = (jsx) => rerender(Utils.Element.create(wrapper, null, jsx));
  }

  return { user, view, props };
}

// async function setup(props = {}, opts) {
//   return nonVisualComponentSetup(Uu5Forms.Form.Provider, { ...getDefaultProps(), ...props }, opts);
// }

async function setupControlledFormProvider(props = {}, opts) {
  let setFormState;
  let result = { formStateRef: {} };
  let ControlledFormProvider = (props) => {
    const [formState0, setFormState0] = useState(props.state);
    setFormState ??= jest.fn(setFormState0);
    result.formStateRef.current = formState0;
    useEffect(() => () => (setFormState = undefined), []);
    return <Uu5Forms.Form.Provider state={formState0} onStateChange={(e) => setFormState(e.data.state)} {...props} />;
  };
  result = {
    ...result,
    ...(await nonVisualComponentSetup(ControlledFormProvider, { ...getDefaultProps(), ...props }, opts)),
  };
  result.setFormState = setFormState;
  return result;
}

describe("Uu5Forms.Form.Provider", () => {
  // TODO Rewrite & integrate enzyme-based tests from (deleted) form-provider.test.js.

  it("controlled - props.state, props.onChange", async () => {
    let nameInputRef = Utils.Component.createRef();
    let ageInputRef = Utils.Component.createRef();
    const { setFormState, formStateRef } = await setupControlledFormProvider({
      children: (
        <>
          <Uu5Forms.FormNumber name="age" initialValue={20} inputRef={ageInputRef} />
          <Uu5Forms.FormText name="name" initialValue="Test name" required inputRef={nameInputRef} />
        </>
      ),
    });
    let formState = formStateRef.current;
    expect(formState).toBeInstanceOf(Uu5Forms.Form.Provider.State);
    expect(formState.value).toEqual({ age: 20, name: "Test name" });
    expect(formState.errorList).toEqual([]);
    expect(formState.submitError).toBeFalsy();
    expect(formState.itemMap).toEqual({
      age: {
        errorList: [],
        initialValue: 20,
        pending: false,
        valid: true,
        value: 20,
      },
      name: {
        errorList: [],
        initialValue: "Test name",
        pending: false,
        valid: true,
        value: "Test name",
      },
    });

    // change state
    expect(typeof formState.update).toBe("function");
    Test.act(() => {
      let newFormState = formState.update(({ setItemValue, setItemState }) => {
        setItemValue("age", 30);
        setItemState("name", {
          value: "John Doe",
          initialValue: "John Doe2",
          errorList: [{ code: "pattern", message: "Not a deer!", feedback: "error" }],
        });
      });
      setFormState(newFormState);
    });
    expect(formStateRef.current).not.toBe(formState);
    formState = formStateRef.current;
    expect(formState?.value).toEqual({ name: "John Doe", age: 30 });
    expect(formState?.itemMap).toEqual({
      age: {
        errorList: [],
        initialValue: 20,
        pending: false,
        valid: true,
        value: 30,
      },
      name: {
        errorList: [{ code: "pattern", message: "Not a deer!", feedback: "error" }],
        initialValue: "John Doe2",
        pending: false,
        valid: false,
        value: "John Doe",
      },
    });
  });
});

describe("Uu5Forms.Form.Provider.State", () => {
  it("constructor() and fields", () => {
    expect(typeof Uu5Forms.Form.Provider.State).toBe("function");
    let state = new Uu5Forms.Form.Provider.State({
      age: 20,
      name: "Test name",
    });
    expect(state.value).toEqual({ age: 20, name: "Test name" });
    expect(state.errorList).toEqual([]);
    expect(state.submitError).toBeFalsy();
    expect(state.itemMap).toEqual({
      age: {
        errorList: [],
        initialValue: 20,
        pending: false,
        valid: true,
        value: 20,
      },
      name: {
        errorList: [],
        initialValue: "Test name",
        pending: false,
        valid: true,
        value: "Test name",
      },
    });
  });

  it("update()", () => {
    expect(typeof Uu5Forms.Form.Provider.State).toBe("function");
    let state = new Uu5Forms.Form.Provider.State({
      age: 20,
      name: "Test name",
    });

    expect(typeof state.update).toBe("function");
    let newState = state.update((...args) => {
      expect(args).toEqual([
        {
          setItemValue: expect.any(Function),
          setItemState: expect.any(Function),
          reset: expect.any(Function),
          resetStep: expect.any(Function),
        },
      ]);
      const [{ setItemValue, setItemState }] = args;
      setItemValue("age", 30);
      setItemState("name", {
        value: "John Doe",
        initialValue: "John Doe2",
        errorList: [{ code: "pattern", message: "Not a deer!", feedback: "error" }],
      });
    });
    expect(newState).toBeInstanceOf(Uu5Forms.Form.Provider.State);
    expect(newState.value).toEqual({ age: 30, name: "John Doe" });
    expect(newState.itemMap).toEqual({
      age: {
        errorList: [],
        initialValue: 20,
        pending: false,
        valid: true,
        value: 30,
      },
      name: {
        errorList: [{ code: "pattern", message: "Not a deer!", feedback: "error" }],
        initialValue: "John Doe2",
        pending: false,
        valid: false,
        value: "John Doe",
      },
    });

    newState = state.update((...args) => {
      const [{ setItemValue, setItemState, reset }] = args;
      setItemValue("age", 25);
      setItemState("name", {
        value: "John Doe",
        initialValue: "John Doe2",
        errorList: [{ code: "pattern", message: "Not a deer!", feedback: "error" }],
      });
      reset();
    });
    expect(newState).toBeInstanceOf(Uu5Forms.Form.Provider.State);
    expect(newState.value).toEqual({ age: 20, name: "John Doe2" });
  });
});
