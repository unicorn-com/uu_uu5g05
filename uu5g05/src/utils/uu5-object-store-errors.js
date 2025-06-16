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

class UnexpectedError extends ObjectStoreError {
  constructor(e) {
    super("Unexpected database error.", { cause: e });
    this.code = `${ObjectStoreError.ERROR_PREFIX}unexpectedError`;
  }
}

class NotUniqueError extends ObjectStoreError {
  constructor(cause) {
    super("Object with same attributes already exists.", { cause });
    this.code = `${ObjectStoreError.ERROR_PREFIX}notUnique`;
  }
}

class InvalidCallError extends ObjectStoreError {
  /** @param {Uu5ObjectStoreErrorOptions} opts */
  constructor(opts) {
    super(
      "The operation cannot be called in current state." + (opts?.paramMap?.detail ? " " + opts?.paramMap?.detail : ""),
      opts,
    );
    this.code = `${ObjectStoreError.ERROR_PREFIX}invalidCall`;
  }
}

class ConcurrentModificationError extends ObjectStoreError {
  constructor() {
    super("Unable to update, object was modified by concurrent process.");
    this.code = `${ObjectStoreError.ERROR_PREFIX}ConcurrentModificationError`;
  }
}

class MissingAttributeError extends ObjectStoreError {
  constructor(attribute) {
    super(`Missing uuObject ${attribute}.`, { paramMap: { attribute } });
    this.code = `${ObjectStoreError.ERROR_PREFIX}missingAttribute`;
  }
}

class CreateManyFailedError extends ObjectStoreError {
  constructor(createdMap, errorMap, cause) {
    super("Create many failed.", { cause });
    this.code = `${ObjectStoreError.ERROR_PREFIX}createManyFailed`;
    this.errorMap = errorMap;
    this.createdMap = createdMap;
  }
}

class InsertManyFailedError extends ObjectStoreError {
  constructor(insertedMap, errorMap, cause) {
    super("Insert many failed.", { cause });
    this.code = `${ObjectStoreError.ERROR_PREFIX}insertManyFailed`;
    this.errorMap = errorMap;
    this.insertedMap = insertedMap;
  }
}

class UpdateManyFailedError extends ObjectStoreError {
  constructor(updatedMap, errorMap, cause) {
    super("Update many failed.", { cause });
    this.code = `${ObjectStoreError.ERROR_PREFIX}updateManyFailed`;
    this.errorMap = errorMap;
    this.updatedMap = updatedMap;
  }
}

class ReplaceManyFailedError extends ObjectStoreError {
  constructor(replacedMap, errorMap, cause) {
    super("Replace many failed.", { cause });
    this.code = `${ObjectStoreError.ERROR_PREFIX}replaceManyFailed`;
    this.errorMap = errorMap;
    this.replacedMap = replacedMap;
  }
}

class AmbiguousQueryError extends ObjectStoreError {
  constructor() {
    super("Query matches more than one result.");
    this.code = `${ObjectStoreError.ERROR_PREFIX}ambiguousQuery`;
  }
}

const Uu5ObjectStoreErrors = {
  ObjectStoreError,
  UnexpectedError,
  NotUniqueError,
  InvalidCallError,
  ConcurrentModificationError,
  MissingAttributeError,
  CreateManyFailedError,
  InsertManyFailedError,
  UpdateManyFailedError,
  ReplaceManyFailedError,
  AmbiguousQueryError,
};

export { Uu5ObjectStoreErrors };
export default Uu5ObjectStoreErrors;
