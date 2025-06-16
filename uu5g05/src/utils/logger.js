const LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4, // not used in uu5g05, but it's here for consistent numbering & recognition in case uu5App sets it for uu_appg01 component
  UNKNOWN: 5,
  OFF: 6,
};

class Logger {
  constructor(name) {
    this._name = name;
    this._level = process.env.NODE_ENV === "production" ? LEVELS.ERROR : LEVELS.DEBUG;
  }
  getName() {
    return this._name;
  }
  setLevel(newLevel) {
    let usedLevel = typeof newLevel === "string" ? LEVELS[newLevel.toUpperCase()] : undefined;
    if (usedLevel === undefined) usedLevel = Number(newLevel);
    if (!isNaN(usedLevel)) {
      this._level = usedLevel;
    }
  }
  getLevel() {
    return this._level;
  }

  debug(message, ...args) {
    if (!this.isDebugLoggable()) return;
    console.debug(...this._getLogArgs(message, ...args));
  }
  isDebugLoggable() {
    return this._level <= LEVELS.DEBUG;
  }
  info(message, ...args) {
    if (!this.isInfoLoggable()) return;
    console.info(...this._getLogArgs(message, ...args));
  }
  isInfoLoggable() {
    return this._level <= LEVELS.INFO;
  }
  warn(message, ...args) {
    if (!this.isWarnLoggable()) return;
    console.warn(...this._getLogArgs(message, ...args));
  }
  isWarnLoggable() {
    return this._level <= LEVELS.WARN;
  }
  error(message, ...args) {
    if (!this.isErrorLoggable()) return;
    console.error(...this._getLogArgs(message, ...args));
  }
  isErrorLoggable() {
    return this._level <= LEVELS.ERROR;
  }

  // to be used only during development
  log(...args) {
    if (process.env.NODE_ENV === "production" || this._level > LEVELS.UNKNOWN) return;
    console.log(...this._getLogArgs(...args));
  }

  _getLogArgs(...args) {
    let usedArgs = [];
    for (let arg of args) {
      usedArgs.push(arg);
      if (arg instanceof Error) {
        // if there are extra attributes on the error instance then show them too
        let extraErrorAttrs = { ...arg };
        if (Object.keys(extraErrorAttrs).length > 0) usedArgs.push({ message: arg.message, ...extraErrorAttrs });
      }
    }
    if (typeof usedArgs[0] === "string") usedArgs[0] = this.getName() + ": " + usedArgs[0];
    else usedArgs.unshift(this.getName() + ":");
    return usedArgs;
  }
}

class ForwardingLogger {
  constructor(forwardToLogger) {
    this._forwardToLogger = forwardToLogger;
  }
  setForwardToLogger(forwardToLogger) {
    this._forwardToLogger = forwardToLogger;
  }
}

const logMethods = new Set(["debug", "info", "warn", "error", "log"]);
for (let k of Object.getOwnPropertyNames(Logger.prototype)) {
  if (k === "constructor") continue;
  ForwardingLogger.prototype[k] = function (...args) {
    if (this._forwardToLogger instanceof Logger) return this._forwardToLogger[k](...args);
    // forwarding to "unknown" logger (not uu5g05's) - forward info(msg,extra1,extra2), ... as info(msg, error)
    // where error is instanceof Error and error.context=[extra1,extra2]
    if (k === "log" && process.env.NODE_ENV === "production") return;
    if (!logMethods.has(k)) return this._forwardToLogger[k](...args);
    if (args.length > 1 && !(args.length === 2 && args[1] instanceof Error)) {
      let error = new Error();
      error.stack = "";
      error.context = args.splice(1, args.length - 1);
      args.push(error);
    }
    return this._forwardToLogger[k](...args);
  };
}

export { Logger, ForwardingLogger };
