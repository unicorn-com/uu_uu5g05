import { Utils, Environment } from "uu5g05";
import { Utils as TestUtils } from "uu5g05-test";

const LEVELS = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL", "UNKNOWN", "OFF"];

afterEach(() => {
  Utils.LoggerFactory.init(null);
  for (let k in window.uu5Environment) {
    if (k.match(/logLevel|log_level/)) delete window.uu5Environment[k];
  }
});

describe("[uu5g05] Utils.Logger", () => {
  it("logger.getName()", () => {
    let logger = Utils.LoggerFactory.get("logger");
    expect(logger.getName()).toBe("logger");
  });

  it("logger.getLevel()", () => {
    let logger = Utils.LoggerFactory.get("logger");
    expect(logger.getLevel()).toBe(LEVELS.indexOf(Environment._constants.logLevel.toUpperCase()));
  });

  it("logger.setLevel(newLevel)", () => {
    let logger = Utils.LoggerFactory.get("logger");
    logger.setLevel("OFF");
    expect(logger.getLevel()).toBe(LEVELS.indexOf("OFF"));
  });

  it.each([
    ["debug", "debug"],
    ["info", "info"],
    ["warn", "warn"],
    ["error", "error"],
    ["log", "log", "UNKNOWN"],
  ])(
    "logger.%s(message, ...args); should log to console based on logLevel settings",
    (method, expectedConsoleMethod, level = method.toUpperCase()) => {
      let msg = "test message; method=" + method;
      let extraArg1 = new Error("Expected error.");
      let extraArg2 = { foo: "bar" };
      let logger = Utils.LoggerFactory.get("logger");
      logger.setLevel(level);

      let consoleOutputs = [];
      TestUtils.omitConsoleLogs((type, ...args) => {
        consoleOutputs.push({ type, args });
        return true;
      });
      logger[method](msg);
      expect(consoleOutputs).toEqual([{ type: expectedConsoleMethod, args: ["logger: " + msg] }]);
      consoleOutputs.splice(0);

      logger[method](msg, extraArg1);
      expect(consoleOutputs).toEqual([{ type: expectedConsoleMethod, args: ["logger: " + msg, extraArg1] }]);
      consoleOutputs.splice(0);

      logger[method](msg, extraArg1, extraArg2);
      expect(consoleOutputs).toEqual([{ type: expectedConsoleMethod, args: ["logger: " + msg, extraArg1, extraArg2] }]);
      consoleOutputs.splice(0);

      let errorWithAttrs = new Error("Expected error with attrs.");
      errorWithAttrs.code = "errorCode";
      logger[method](msg, 123, errorWithAttrs);
      expect(consoleOutputs).toEqual([
        {
          type: expectedConsoleMethod,
          args: ["logger: " + msg, 123, errorWithAttrs, { message: errorWithAttrs.message, ...errorWithAttrs }],
        },
      ]);
      consoleOutputs.splice(0);

      logger.setLevel(logger.getLevel() + 1);
      logger[method](msg);
      expect(consoleOutputs).toEqual([]);
    },
  );

  it.each([
    ["isDebugLoggable", "debug"],
    ["isInfoLoggable", "info"],
    ["isWarnLoggable", "warn"],
    ["isErrorLoggable", "error"],
  ])("logger.%s(); should return value based on logLevel settings", (method, levelStr) => {
    let logger = Utils.LoggerFactory.get("logger");
    logger.setLevel(levelStr.toUpperCase());

    let result = logger[method]();
    expect(result).toBe(true);

    logger.setLevel(logger.getLevel() + 1);
    result = logger[method]();
    expect(result).toBe(false);
  });
});
