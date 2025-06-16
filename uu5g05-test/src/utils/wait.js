const { act } = require("../internal/testing-library.js");

let setTimeout = global.setTimeout;

// wait() or wait(100) or wait({ timeout: 100 })
async function wait(...args) {
  let timeout;
  if (typeof args[0] === "number") timeout = args.shift();
  else timeout = (args[0] || {}).timeout || 0;

  while (timeout >= 0) {
    // commit pending React effects every few milliseconds until timeout is reached
    const COMMIT_DELAY = 10;
    await act(() => {
      let delay = Math.min(COMMIT_DELAY, timeout);
      timeout -= delay;
      return new Promise((resolve) => setTimeout(resolve, delay));
    });
    if (timeout === 0) break;
  }
}

module.exports = { wait };
