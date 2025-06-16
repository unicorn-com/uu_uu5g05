const { wait } = require("./utils/wait.js");
const { omitConsoleLogs } = require("./utils/omit-console-logs.js");

const Utils = {
  wait: wait,
  omitConsoleLogs,
};

module.exports = { Utils };
