import { Utils } from "uu5g05";
import Uu5Elements, { useAlertBus } from "uu5g05-elements";
import { Test } from "uu5g05-test";
import { FALLBACK_ELEMENT_ID } from "../src/use-alert-bus.js";

afterEach(() => {
  let element = document.getElementById(FALLBACK_ELEMENT_ID);
  if (element) {
    Utils.Dom.unTest.render(element);
    element.innerHTML = "";
  }
});

describe(`useAlertBus - outside of AlertBus`, () => {
  it("methods from useAlertBus hook", () => {
    let { result, HookComponent } = Test.createHookComponent(() => useAlertBus());
    Test.render(<HookComponent />);

    expect(result.current).toEqual({
      addAlert: expect.any(Function),
      removeAlert: expect.any(Function),
      updateAlert: expect.any(Function),
    });
  });

  it("addAlert - render alert using addAlert function", () => {
    let { result, HookComponent } = Test.createHookComponent(() => useAlertBus());
    Test.render(<HookComponent />);

    let id;
    Test.act(() => {
      id = result.current.addAlert({ header: "alert 1" });
    });
    expect(document.body).toHaveTextContent("alert 1");
    expect(id).toBeTruthy();

    Test.act(() => {
      id = result.current.addAlert({ header: "alert 2", id: "testId" });
    });
    expect(id).toBe("testId");
  });

  it("removeAlert - remove alert using removeAlert function", () => {
    let { result, HookComponent } = Test.createHookComponent(() => useAlertBus());
    Test.render(<HookComponent />);

    let id;
    Test.act(() => {
      id = result.current.addAlert({ header: "alert 1" });
    });
    expect(document.body).toHaveTextContent("alert 1");
    expect(id).toBeTruthy();
    Test.act(() => {
      result.current.removeAlert(id);
    });
    expect(document.body).not.toHaveTextContent("alert 1");
  });

  it("updateAlert - update displayed alert using updateAlert function", () => {
    let { result, HookComponent } = Test.createHookComponent(() => useAlertBus());
    Test.render(<HookComponent />);

    let id;
    Test.act(() => {
      id = result.current.addAlert({ header: "new alert" });
    });
    expect(document.body).toHaveTextContent("new alert");
    expect(id).toBeTruthy();
    Test.act(() => {
      result.current.updateAlert(id, { header: "update alert" });
    });
    expect(document.body).toHaveTextContent("update alert");
  });
});

describe(`useAlertBus - inside of AlertBus`, () => {
  it("methods from useAlertBus hook", () => {
    let { result, HookComponent } = Test.createHookComponent(() => useAlertBus());
    Test.render(
      <Uu5Elements.AlertBus>
        <HookComponent />
      </Uu5Elements.AlertBus>,
    );

    expect(result.current).toEqual({
      addAlert: expect.any(Function),
      removeAlert: expect.any(Function),
      updateAlert: expect.any(Function),
    });
  });

  it("addAlert - render alert using addAlert function", () => {
    let { result, HookComponent } = Test.createHookComponent(() => useAlertBus());
    Test.render(
      <Uu5Elements.AlertBus>
        <HookComponent />
      </Uu5Elements.AlertBus>,
    );

    let id;
    Test.act(() => {
      id = result.current.addAlert({ header: "alert 1" });
    });
    expect(id).toBeTruthy();
    expect(Test.screen.getByText("alert 1")).toBeInTheDocument();

    Test.act(() => {
      id = result.current.addAlert({ header: "alert 2", id: "testId" });
    });
    expect(id).toBe("testId");
  });

  it("removeAlert - remove alert using removeAlert function", () => {
    let { result, HookComponent } = Test.createHookComponent(() => useAlertBus());
    Test.render(
      <Uu5Elements.AlertBus>
        <HookComponent />
      </Uu5Elements.AlertBus>,
    );

    let id;
    Test.act(() => {
      id = result.current.addAlert({ header: "alert 1" });
    });
    expect(Test.screen.getByText("alert 1")).toBeInTheDocument();
    expect(id).toBeTruthy();

    Test.act(() => {
      result.current.removeAlert(id);
    });
    expect(Test.screen.queryByText("alert 1")).not.toBeInTheDocument();
  });

  it("updateAlert - update displayed alert using updateAlert function", () => {
    let { result, HookComponent } = Test.createHookComponent(() => useAlertBus());
    Test.render(
      <Uu5Elements.AlertBus>
        <HookComponent />
      </Uu5Elements.AlertBus>,
    );

    let id;
    Test.act(() => {
      id = result.current.addAlert({ header: "new alert" });
    });
    expect(Test.screen.getByText("new alert")).toBeInTheDocument();
    expect(id).toBeTruthy();

    Test.act(() => {
      result.current.updateAlert(id, { header: "update alert" });
    });
    expect(Test.screen.getByText("update alert")).toBeInTheDocument();
  });
});
