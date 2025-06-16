import { Utils, createComponent, createVisualComponent, Environment } from "uu5g05";

const LEVELS = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL", "UNKNOWN", "OFF"];

let loggers = {};
class TestLoggerFactory {
  static get(name) {
    return loggers[name] || (loggers[name] = new TestLogger(name));
  }
}
class TestLogger {
  debug = jest.fn(() => Math.random());
  isDebugLoggable = jest.fn(() => Math.random());
  info = jest.fn(() => Math.random());
  isInfoLoggable = jest.fn(() => Math.random());
  warn = jest.fn(() => Math.random());
  isWarnLoggable = jest.fn(() => Math.random());
  error = jest.fn(() => Math.random());
  isErrorLoggable = jest.fn(() => Math.random());
  log = jest.fn(() => Math.random());
  getName = jest.fn(function () {
    return this._name;
  });
  getLevel = jest.fn(function () {
    return this._level;
  });
  setLevel = jest.fn(function (level) {
    this._level = typeof level === "number" ? level : LEVELS.indexOf(level.toUpperCase());
  });
  constructor(name) {
    this._name = name;
    this._level = 0;
  }
}

beforeAll(() => {
  window.uu5Environment ??= {};
});

afterEach(() => {
  loggers = {};
  Utils.LoggerFactory.init(null);
  for (let k in window.uu5Environment) {
    if (k.match(/logLevel|log_level/)) delete window.uu5Environment[k];
  }
});

describe("[uu5g05] Utils.LoggerFactory", () => {
  it("static get(name); should return logger with expected API", () => {
    let result = Utils.LoggerFactory.get("logger");
    expectLogger(result, "logger");
  });

  it("static get(name, hierarchical); should return logger with expected logLevel", () => {
    let logger;
    logger = Utils.LoggerFactory.get("logger");
    expect(logger.getLevel()).toBe(LEVELS.indexOf(Environment._constants.logLevel.toUpperCase()));

    window.uu5Environment["uu5g05_logLevel_my.nested.logger"] = "INFO";

    logger = Utils.LoggerFactory.get("my.nested.logger.with.extra.levels");
    expect(logger.getLevel()).toBe(LEVELS.indexOf("INFO"));

    logger = Utils.LoggerFactory.get("my.nested");
    expect(logger.getLevel()).toBe(LEVELS.indexOf(Environment._constants.logLevel.toUpperCase()));

    logger = Utils.LoggerFactory.get("my.nested.logger.with.extra.levels2", false);
    expect(logger.getLevel()).toBe(LEVELS.indexOf(Environment._constants.defaultLogLevel.toUpperCase()));

    logger = Utils.LoggerFactory.get("my.nested.logger", false);
    expect(logger.getLevel()).toBe(LEVELS.indexOf("INFO"));
  });

  it("static init(LoggerFactory); should create new loggers using the new factory", () => {
    Utils.LoggerFactory.init(TestLoggerFactory);
    let loggerA = Utils.LoggerFactory.get("logger");
    let loggerB = TestLoggerFactory.get("logger");
    expect(loggerA === loggerB).toBe(true);
  });

  it("static init(LoggerFactory); should re-init existing loggers to forward to loggers from the new factory", () => {
    let existingLogger = Utils.LoggerFactory.get("logger");
    existingLogger.setLevel(LEVELS[0]);
    Utils.LoggerFactory.init(TestLoggerFactory);
    let realLogger = TestLoggerFactory.get("logger");

    for (let method of ["debug", "info", "warn", "error", "log"]) {
      if (method !== "log") {
        let method1 = `is${method.replace(/^./, (m) => m.toUpperCase())}Loggable`;
        let result = existingLogger[method1]();
        expect(realLogger[method1]).toHaveBeenCalledTimes(1);
        expect(realLogger[method1]).lastCalledWith();
        expect(result).toBe(realLogger[method1].mock.results[0].value);
      }

      let err = new Error("abc " + method);
      existingLogger[method]("msg " + method, err);
      expect(realLogger[method]).toHaveBeenCalledTimes(1);
      expect(realLogger[method]).lastCalledWith("msg " + method, err);
    }

    expect(realLogger.getLevel()).toBe(existingLogger.getLevel());
  });

  it("static init() + get(); should return logger with default logLevel if forwarding to different factory", () => {
    Utils.LoggerFactory.init(TestLoggerFactory);
    let realLogger = Utils.LoggerFactory.get("logger");
    expect(realLogger.getLevel()).toBe(LEVELS.indexOf(Environment._constants.logLevel.toUpperCase()));
  });

  it("static init(LoggerFactory); should forward logging of (message, ...args) as (message, error)", () => {
    let existingLogger = Utils.LoggerFactory.get("logger");
    Utils.LoggerFactory.init(TestLoggerFactory);
    let realLogger = TestLoggerFactory.get("logger");

    for (let method of ["debug", "info", "warn", "error", "log"]) {
      // (message) and (message, error) should be passed as-is
      existingLogger[method]("msg " + method);
      expect(realLogger[method]).toHaveBeenCalledTimes(1);
      expect(realLogger[method]).lastCalledWith("msg " + method);
      realLogger[method].mockClear();

      let err = new Error("abc " + method);
      existingLogger[method]("msg " + method, err);
      expect(realLogger[method]).toHaveBeenCalledTimes(1);
      expect(realLogger[method]).lastCalledWith("msg " + method, err);
      realLogger[method].mockClear();

      // (message, xyz, ...) should be passed as (message, error)
      existingLogger[method]("msg " + method, 123);
      expect(realLogger[method]).toHaveBeenCalledTimes(1);
      expect(realLogger[method].mock.calls[0].length).toBe(2);
      expect(realLogger[method].mock.calls[0][0]).toBe("msg " + method);
      expect(realLogger[method].mock.calls[0][1] instanceof Error).toBe(true);
      expect(realLogger[method].mock.calls[0][1].context).toEqual([123]);
      realLogger[method].mockClear();

      existingLogger[method]("msg " + method, { foo: "bar" }, 12345, false);
      expect(realLogger[method]).toHaveBeenCalledTimes(1);
      expect(realLogger[method].mock.calls[0].length).toBe(2);
      expect(realLogger[method].mock.calls[0][0]).toBe("msg " + method);
      expect(realLogger[method].mock.calls[0][1] instanceof Error).toBe(true);
      expect(realLogger[method].mock.calls[0][1].context).toEqual([{ foo: "bar" }, 12345, false]);
      realLogger[method].mockClear();
    }
  });
});

describe("[uu5g05] component and logger integration", () => {
  it("createComponent() should return component with 'logger' field", () => {
    let Component = createComponent({
      displayName: "My.Component",
      render: (props) => props.children,
    });
    expectLogger(Component.logger, "My.Component");

    Component = createComponent({
      uu5Tag: "My.Component",
      render: (props) => props.children,
    });
    expectLogger(Component.logger, "My.Component");
  });

  it("createVisualComponent() should return component with 'logger' field", () => {
    let Component = createVisualComponent({
      displayName: "My.Component",
      render: (props) => props.children,
    });
    expectLogger(Component.logger, "My.Component");

    Component = createVisualComponent({
      uu5Tag: "My.Component",
      render: (props) => props.children,
    });
    expectLogger(Component.logger, "My.Component");
  });
});

function expectLogger(value, loggerName) {
  expect(value).toBeTruthy();
  expect(typeof value.getName).toBe("function");
  expect(typeof value.getLevel).toBe("function");
  expect(typeof value.setLevel).toBe("function");
  expect(typeof value.debug).toBe("function");
  expect(typeof value.isDebugLoggable).toBe("function");
  expect(typeof value.info).toBe("function");
  expect(typeof value.isInfoLoggable).toBe("function");
  expect(typeof value.warn).toBe("function");
  expect(typeof value.isWarnLoggable).toBe("function");
  expect(typeof value.error).toBe("function");
  expect(typeof value.isErrorLoggable).toBe("function");
  expect(typeof value.log).toBe("function");
  expect(value.getName()).toBe(loggerName);
}
