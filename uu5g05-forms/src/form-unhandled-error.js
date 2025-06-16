class UnhandledError extends Error {
  constructor(cause) {
    super("Unhandled form error.", { cause });
  }
}

export { UnhandledError };
export default UnhandledError;
