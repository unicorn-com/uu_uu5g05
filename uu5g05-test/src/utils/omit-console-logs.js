let omissionFnList = [];
let consoleOrigFnMap;

afterEach(() => {
  omissionFnList = [];
  restoreConsoleFns();
});

function omitConsoleLogs(stringOrRegExpOrFn) {
  let omissionFn;
  if (typeof stringOrRegExpOrFn === "string") {
    omissionFn = (type, ...args) => args.some((arg) => (arg + "").indexOf(stringOrRegExpOrFn) !== -1);
  } else if (stringOrRegExpOrFn instanceof RegExp) {
    omissionFn = (type, ...args) => args.some((arg) => stringOrRegExpOrFn.test(arg + ""));
  } else if (typeof stringOrRegExpOrFn === "function") {
    omissionFn = stringOrRegExpOrFn;
  } else {
    throw new Error(
      "Invalid use of omitConsoleLogs - expected string or regexp or function but got: " + stringOrRegExpOrFn,
    );
  }
  omissionFnList.push(omissionFn);
  overrideConsoleFns();
  return () => {
    let idx = omissionFnList.indexOf(omissionFn);
    if (idx !== -1) omissionFnList.splice(idx, 1);
    if (omissionFnList.length === 0) restoreConsoleFns();
  };
}

function overrideConsoleFns() {
  if (consoleOrigFnMap) return; // already overridden
  consoleOrigFnMap = {};
  ["error", "warn", "log", "info", "debug", "table"].forEach((type) => {
    let origFn = console[type];
    consoleOrigFnMap[type] = origFn;
    console[type] = function (...args) {
      if (omissionFnList.every((fn) => !fn(type, ...args))) return origFn.apply(this, arguments);
    };
  });
}

function restoreConsoleFns() {
  if (!consoleOrigFnMap) return; // already restored
  for (let k in consoleOrigFnMap) console[k] = consoleOrigFnMap[k];
  consoleOrigFnMap = undefined;
}

module.exports = { omitConsoleLogs };
