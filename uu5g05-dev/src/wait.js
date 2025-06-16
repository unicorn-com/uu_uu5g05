async function wait(ts = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ts));
}

export { wait };
export default wait;
