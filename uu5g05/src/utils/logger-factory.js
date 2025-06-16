import { ForwardingLogger, Logger } from "./logger.js";
import { logLevel, get, defaultLogLevel } from "../uu5-environment.js";

class LoggerFactory {
  static _loggerMap = {};
  static _forwardToFactory = null;
  static _forwardedLoggers = typeof WeakSet !== "undefined" ? new WeakSet() : new Set();

  static get(name, hierarchical = true) {
    if (this._forwardToFactory) {
      let logger = this._forwardToFactory.get(...arguments);
      if (!this._forwardedLoggers.has(logger)) {
        this._forwardedLoggers.add(logger);
        let { logLevel } = this._getConfig(name, hierarchical);
        if (logLevel != null) logger.setLevel(logLevel);
      }
      return logger;
    }

    let canonicalName = name;
    let loggerItem = this._loggerMap[canonicalName];
    if (!loggerItem) {
      loggerItem = { hierarchical, logger: new ForwardingLogger(new Logger(name)) };
      let { logLevel } = this._getConfig(name, hierarchical);
      if (logLevel != null) loggerItem.logger.setLevel(logLevel);
      this._loggerMap[canonicalName] = loggerItem;
    }
    return loggerItem.logger;
  }

  static init(NewLoggerFactory) {
    this._forwardToFactory = NewLoggerFactory;

    // redirect existing ForwardingLogger-s to the loggers of the NewLoggerFactory
    if (NewLoggerFactory) {
      for (let loggerName in this._loggerMap) {
        let loggerItem = this._loggerMap[loggerName];
        if (loggerItem.logger instanceof ForwardingLogger) {
          let newLogger = NewLoggerFactory.get(loggerItem.logger.getName(), loggerItem.hierarchical);
          newLogger.setLevel(loggerItem.logger.getLevel());
          this._forwardedLoggers.add(newLogger);
          loggerItem.logger.setForwardToLogger(newLogger);
        }
      }
    }
    this._loggerMap = {};
  }

  static _getConfig(name, hierarchical) {
    let canonicalName = name;
    return {
      logLevel: this._getConfigValue(canonicalName, hierarchical),
    };
  }

  static _getConfigValue(keyPrefix, hierarchical) {
    let parts = keyPrefix.split(".");
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let value = get(parts.length > 0 ? "logLevel_" + parts.join(".") : "logLevel");
      if (value !== undefined) return value;
      if (!hierarchical) return defaultLogLevel;
      if (parts.length === 0) return logLevel;
      parts.pop();
    }
  }
}

export { LoggerFactory };
export default LoggerFactory;
