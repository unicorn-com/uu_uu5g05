import { Utils } from "uu5g05";
import { Test } from "uu5g05-test";

function expectApiWithData(uuEvent, expectedData) {
  expect(uuEvent?.data).toEqual(expectedData);
  expect(typeof uuEvent?.stopPropagation).toBe("function");
  expect(typeof uuEvent?.preventDefault).toBe("function");
  expect(typeof uuEvent?.persist).toBe("function");
  expect(typeof uuEvent.defaultPrevented).toMatch(/undefined|boolean/);
}

function testWithNativeEvent(fn) {
  let error;
  let elRef = Utils.Component.createRef();
  Test.render(
    <div
      ref={elRef}
      onClick={(e) => {
        try {
          fn(e);
        } catch (err) {
          error = err;
        }
      }}
    />,
  );
  let user = Test.userEvent.setup();
  user.click(elRef.current);
  if (error) throw error; // throwing error outside of onXyz handler so that JSDOM doesn't trigger onerror handler which logs error duplicitly
}

describe("[uu5g05] Utils.Event", () => {
  it("constructor(data)", async () => {
    let uuEvent = new Utils.Event({ foo: "bar" });
    expectApiWithData(uuEvent, { foo: "bar" });
  });

  it("constructor(event)", async () => {
    testWithNativeEvent((nativeEvent) => {
      let uuEvent = new Utils.Event(nativeEvent);
      expectApiWithData(uuEvent, undefined);
      expect(uuEvent?.type).toEqual("click"); // should have access to all fields of native event
      expect(!!uuEvent?.target).toBeTruthy();
    });
  });

  it("constructor(data, event)", async () => {
    testWithNativeEvent((nativeEvent) => {
      let uuEvent = new Utils.Event({ foo: "bar" }, nativeEvent);
      expectApiWithData(uuEvent, { foo: "bar" });
      expect(uuEvent?.type).toEqual("click"); // should have access to all fields of native event
      expect(!!uuEvent?.target).toBeTruthy();
    });
  });

  it("constructor(data, uuUtilsEvent)", async () => {
    let uuEventOrig = new Utils.Event({ foo: "bar" });
    let uuEvent = new Utils.Event({ foo: "bar2" }, uuEventOrig);
    expectApiWithData(uuEvent, { foo: "bar2" });
    expectApiWithData(uuEventOrig, { foo: "bar" }); // shouldn't affect wrappee data

    testWithNativeEvent((nativeEvent) => {
      let uuEventOrig = new Utils.Event({ foo: "bar" }, nativeEvent);
      let uuEvent = new Utils.Event({ foo: "bar2" }, uuEventOrig);
      expectApiWithData(uuEvent, { foo: "bar2" });
      expectApiWithData(uuEventOrig, { foo: "bar" }); // shouldn't affect wrappee data

      uuEvent.preventDefault();
      expect(nativeEvent.defaultPrevented).toBeTruthy();
    });
  });

  it.each([["stopPropagation"], ["preventDefault"], ["persist"]])(
    "%s() should be forwarded onto underlying native event",
    async (method) => {
      testWithNativeEvent((nativeEvent) => {
        let methodSpy = jest.spyOn(nativeEvent, method);
        let uuEvent = new Utils.Event({ foo: "bar" }, nativeEvent);
        uuEvent[method]();
        expect(methodSpy).toHaveBeenCalledTimes(1);
        expect(methodSpy).lastCalledWith();
      });
    },
  );

  it("defaultPrevented", async (method) => {
    let uuEvent = new Utils.Event();
    uuEvent.preventDefault();
    expect(uuEvent.defaultPrevented).toBeTruthy();

    // with native event (prevent uuEvent)
    testWithNativeEvent((nativeEvent) => {
      uuEvent = new Utils.Event({ foo: "bar" }, nativeEvent);
      uuEvent.preventDefault();
      expect(nativeEvent.defaultPrevented).toBeTruthy();
      expect(uuEvent.defaultPrevented).toBeTruthy();
    });

    // with native event (prevent native event)
    testWithNativeEvent((nativeEvent) => {
      uuEvent = new Utils.Event({ foo: "bar" }, nativeEvent);
      nativeEvent.preventDefault();
      expect(uuEvent.defaultPrevented).toBeTruthy();
      expect(nativeEvent.defaultPrevented).toBeTruthy();
    });
  });

  it("data - can change", async () => {
    let uuEvent = new Utils.Event({ foo: "bar" });
    expect(uuEvent.data).toEqual({ foo: "bar" });
    uuEvent.data = { foo2: "bar2" };
    expect(uuEvent.data).toEqual({ foo2: "bar2" });

    testWithNativeEvent((nativeEvent) => {
      let uuEvent = new Utils.Event({ foo: "bar" }, nativeEvent);
      expect(uuEvent.data).toEqual({ foo: "bar" });
      uuEvent.data = { foo2: "bar2" };
      expect(uuEvent.data).toEqual({ foo2: "bar2" });
    });
  });
});
