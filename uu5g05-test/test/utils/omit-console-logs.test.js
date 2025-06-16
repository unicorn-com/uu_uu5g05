const { Utils } = require("uu5g05-test");
const { omitConsoleLogs } = Utils;

const CONSOLE_METHODS = ["error", "warn", "log", "info", "debug", "table"];

let origConsoleFns = {};
let beforeOmitConsoleFns = {};
beforeEach(() => {
  for (let k of CONSOLE_METHODS) {
    origConsoleFns[k] = console[k];
    console[k] = beforeOmitConsoleFns[k] = jest.fn(); // prevent displaying anything in console, but allow spying what was called
  }
});
afterEach(() => {
  for (let k in origConsoleFns) console[k] = origConsoleFns[k];
  beforeOmitConsoleFns = {};
});

describe("[uu5g05-test] Utils.omitConsoleLogs", () => {
  it.each(CONSOLE_METHODS.map((it) => [it, it === "error" ? "log" : "error"]))(
    "omitConsoleLogs(string) when using console.%s()",
    async (method, differentMethod) => {
      let rollbackFn = omitConsoleLogs("abc");
      expect(typeof rollbackFn).toBe("function");
      console[method](" abcc");
      console[method](1234, new Error(), {}, "abc");
      expect(beforeOmitConsoleFns[method]).toHaveBeenCalledTimes(0);
      console[method]("not omitted Abc");
      expect(beforeOmitConsoleFns[method]).toHaveBeenCalledTimes(1);
      console[differentMethod](" abcc");
      expect(beforeOmitConsoleFns[differentMethod]).toHaveBeenCalledTimes(0);
      console[differentMethod]("not omitted Abc");
      expect(beforeOmitConsoleFns[differentMethod]).toHaveBeenCalledTimes(1);

      // shouldn't be omitted after rollbacking
      beforeOmitConsoleFns[method].mockClear();
      rollbackFn();
      console[method](" abcc");
      expect(beforeOmitConsoleFns[method]).toHaveBeenCalledTimes(1);
    },
  );

  it.each(CONSOLE_METHODS.map((it) => [it, it === "error" ? "log" : "error"]))(
    "omitConsoleLogs(regexp) when using console.%s()",
    async (method, differentMethod) => {
      let rollbackFn = omitConsoleLogs(/abc?/);
      expect(typeof rollbackFn).toBe("function");
      console[method](" abc");
      console[method](1234, new Error(), {}, "ab");
      expect(beforeOmitConsoleFns[method]).toHaveBeenCalledTimes(0);
      console[method]("not omitted Abc");
      expect(beforeOmitConsoleFns[method]).toHaveBeenCalledTimes(1);
      console[differentMethod](" abc");
      expect(beforeOmitConsoleFns[differentMethod]).toHaveBeenCalledTimes(0);
      console[differentMethod]("not omitted");
      expect(beforeOmitConsoleFns[differentMethod]).toHaveBeenCalledTimes(1);

      // shouldn't be omitted after rollbacking
      beforeOmitConsoleFns[method].mockClear();
      rollbackFn();
      console[method](" abcc");
      expect(beforeOmitConsoleFns[method]).toHaveBeenCalledTimes(1);
    },
  );

  it.each(CONSOLE_METHODS.map((it) => [it, it === "error" ? "log" : "error"]))(
    "omitConsoleLogs(fn) when using console.%s()",
    async (method, differentMethod) => {
      let omissionFn = jest.fn((type, ...args) => type === method); // omit every console[method]() call
      let rollbackFn = omitConsoleLogs(omissionFn);
      expect(typeof rollbackFn).toBe("function");
      console[method](" abc");
      console[method]();
      let testArgs1 = [1234, new Error(), {}, "ab"];
      console[method](...testArgs1);
      expect(beforeOmitConsoleFns[method]).toHaveBeenCalledTimes(0);
      expect(omissionFn).lastCalledWith(method, ...testArgs1);
      console[differentMethod]("not omitted");
      expect(beforeOmitConsoleFns[differentMethod]).toHaveBeenCalledTimes(1);

      // shouldn't be omitted after rollbacking
      beforeOmitConsoleFns[method].mockClear();
      rollbackFn();
      console[method](" abcc");
      expect(beforeOmitConsoleFns[method]).toHaveBeenCalledTimes(1);
    },
  );

  it.each(CONSOLE_METHODS.map((it) => [it, it === "error" ? "log" : "error"]))(
    "multiple omitConsoleLogs() when using console.%s()",
    async (method, differentMethod) => {
      let rollbackForFn = omitConsoleLogs((type, ...args) => args.length > 3); // omit calls with > 3 params
      let rollbackForString = omitConsoleLogs("abc");
      let rollbackForRegExp = omitConsoleLogs(/abc?/);
      console[method](" abc");
      console[method](" ab");
      console[method](1234, new Error(), {}, "ab");
      expect(beforeOmitConsoleFns[method]).toHaveBeenCalledTimes(0);
      console[method]("not omitted");
      expect(beforeOmitConsoleFns[method]).toHaveBeenCalledTimes(1);

      // some shouldn't be omitted after rollbacking
      beforeOmitConsoleFns[method].mockClear();
      rollbackForRegExp();
      console[method](" abc");
      console[method](1234, new Error(), {}, "ab");
      expect(beforeOmitConsoleFns[method]).toHaveBeenCalledTimes(0);
      console[method](" ab");
      expect(beforeOmitConsoleFns[method]).toHaveBeenCalledTimes(1);

      beforeOmitConsoleFns[method].mockClear();
      rollbackForString();
      console[method](1234, new Error(), {}, "ab");
      expect(beforeOmitConsoleFns[method]).toHaveBeenCalledTimes(0);
      console[method](" ab");
      console[method](" abc");
      expect(beforeOmitConsoleFns[method]).toHaveBeenCalledTimes(2);

      beforeOmitConsoleFns[method].mockClear();
      rollbackForFn();
      console[method](" ab");
      console[method](" abc");
      console[method](1234, new Error(), {}, "ab");
      expect(beforeOmitConsoleFns[method]).toHaveBeenCalledTimes(3);
    },
  );
});
