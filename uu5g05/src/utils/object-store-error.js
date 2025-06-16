/**
 * @typedef {{ cause: Error?, paramMap: object? }} Uu5ObjectStoreErrorOptions
 */

class ObjectStoreError extends Error {
  static ERROR_PREFIX = "uu5-objectstore/";
  /**
   *
   * @param {string} message
   * @param {Uu5ObjectStoreErrorOptions} opts
   */
  constructor(message, opts) {
    super(message, { cause: opts?.cause });
    this.paramMap = opts?.paramMap;
  }
}

class DuplicateKey extends ObjectStoreError {
  /** @param {Uu5ObjectStoreErrorOptions} opts */
  constructor(opts) {
    super("UuObject attributes violate index uniqueness.", opts);
    this.code = `${ObjectStoreError.ERROR_PREFIX}duplicateKey`;
  }
}

class InvalidCall extends ObjectStoreError {
  /** @param {Uu5ObjectStoreErrorOptions} opts */
  constructor(opts) {
    super(
      "The operation cannot be called in current state." + (opts?.paramMap?.detail ? " " + opts?.paramMap?.detail : ""),
      opts,
    );
    this.code = `${ObjectStoreError.ERROR_PREFIX}invalidCall`;
  }
}

class InvalidRevision extends ObjectStoreError {
  /** @param {Uu5ObjectStoreErrorOptions} opts */
  constructor(opts) {
    super("Revision attribute is not valid (uuObject.sys.rev). Entered value does not match value in database.", opts);
    this.code = `${ObjectStoreError.ERROR_PREFIX}invalidRevision`;
  }
}

class MissingRevision extends ObjectStoreError {
  /** @param {Uu5ObjectStoreErrorOptions} opts */
  constructor(opts) {
    super(
      "Revision attribute is missing (uuObject.sys.rev). Attribute is mandatory when using revision-based strategy.",
      opts,
    );
    this.code = `${ObjectStoreError.ERROR_PREFIX}missingRevision`;
  }
}

class ObjectNotFound extends ObjectStoreError {
  /** @param {Uu5ObjectStoreErrorOptions} opts */
  constructor(opts) {
    super("Failed to update uuObject. UuObject was not found.", opts);
    this.code = `${ObjectStoreError.ERROR_PREFIX}objectNotFound`;
  }
}

ObjectStoreError.DuplicateKey = DuplicateKey;
ObjectStoreError.InvalidCall = InvalidCall;
ObjectStoreError.InvalidRevision = InvalidRevision;
ObjectStoreError.MissingRevision = MissingRevision;
ObjectStoreError.ObjectNotFound = ObjectNotFound;

export { ObjectStoreError };
export default ObjectStoreError;
