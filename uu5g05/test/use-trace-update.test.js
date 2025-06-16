import { useTraceUpdate, Utils as Uu5Utils } from "uu5g05";
import { Test, Utils } from "uu5g05-test";

let logger = Uu5Utils.LoggerFactory.get("Uu5.useTraceUpdate");
let origLog;
beforeEach(() => {
  origLog = logger.log;
  logger.log = jest.fn();
});
afterEach(() => {
  logger.log = origLog;
});

describe("[uu5g05] useTraceUpdate", () => {
  it("props; should log changes", async () => {
    let consoleMessages = [];
    Utils.omitConsoleLogs((type, ...args) => {
      if (args[0]?.match?.(/Changed props:/)) return true;
      consoleMessages.push({ type, args });
      return true;
    });

    const ARRAY = [];
    const OBJ = {};
    let props = { prop1: "a", prop2: null, prop3: 0, prop4: false, prop5: [], prop6: ARRAY, prop7: {}, prop8: OBJ };
    let { rerender } = Test.renderHook((props) => useTraceUpdate(...props), { initialProps: [props] });
    expect(consoleMessages).toEqual([{ type: "log", args: [expect.stringMatching(/mount/i), props] }]);
    consoleMessages = [];

    rerender([{ ...props }]);
    expect(consoleMessages).toEqual([]);
    consoleMessages = [];

    let prevProps = props;
    rerender([(props = { ...props, prop1: "b" })]);
    expect(consoleMessages).toEqual([
      { type: "log", args: [expect.stringMatching(/effect/), { currentProps: props, previousProps: prevProps }] },
      { type: "log", args: [expect.stringMatching(/effect - changed props/)] },
      { type: "table", args: [{ prop1: { previous: "a", current: "b" } }] },
    ]);
    consoleMessages = [];

    prevProps = props;
    rerender([(props = { ...props, prop1: "c", prop4: undefined, prop5: [], prop6: ARRAY, prop7: {} })]);
    expect(consoleMessages).toEqual([
      { type: "log", args: [expect.stringMatching(/effect/), { currentProps: props, previousProps: prevProps }] },
      { type: "log", args: [expect.stringMatching(/effect - changed props/)] },
      {
        type: "table",
        args: [
          {
            prop1: { previous: "b", current: "c" },
            prop4: { previous: false, current: undefined },
            prop5: { previous: [], current: [] },
            prop7: { previous: {}, current: {} },
          },
        ],
      },
    ]);
    consoleMessages = [];

    prevProps = props;
    props = { ...props, new: 123 };
    delete props.prop2;
    rerender([props]);
    expect(consoleMessages).toEqual([
      { type: "log", args: [expect.stringMatching(/effect/), { currentProps: props, previousProps: prevProps }] },
      { type: "log", args: [expect.stringMatching(/effect - changed props/)] },
      {
        type: "table",
        args: [{ new: { previous: undefined, current: 123 }, prop2: { previous: null, current: undefined } }],
      },
    ]);
    consoleMessages = [];
  });
});
