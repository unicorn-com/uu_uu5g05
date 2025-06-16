const { cleanupErrorStack } = require("./helpers.js");

// TODO Mocking UuApp Client should be somewhere else (uu_appg01-test?).
// NOTE All root scope variables/functions must have prefix "mock" so that babel-jest doesn't complain.
let mockClient;

function mockThrowErrorFn(method) {
  return (uri) => {
    let error = new Error(
      `Unmocked call detected - Client.${method}(${JSON.stringify(
        uri,
      )}). This is by default disabled. You should mock remote calls (see testing guideline) or, if it was really intended to make unmocked call, then use \`jest.unmock("uu_appg01");\` in the root scope of your test file. Note that this could also happen if your component performs more calls than you mocked.`,
    );
    error.stack = cleanupErrorStack ? cleanupErrorStack(error.stack) : error.stack;
    throw error;
  };
}

try {
  // NOTE Mocking uu_appg01 via jest.doMock can be done only if that module is actually
  // installed. If it is not, Jest resolver will throw an error which has no code so
  // we would have to check the message to identify this scenario (this is the case if the module
  // is re-mapped via moduleNameMapper)
  //   => instead try to resolve the module's package.json which will throw standard error
  // with code MODULE_NOT_FOUND and skip mocking in such case.
  // NOTE Instead of simple "require.resolve" using workaround due to https://github.com/webpack/webpack/issues/4175#issuecomment-342931035
  let requireFunc = typeof __webpack_require__ === "function" ? __non_webpack_require__ : require; // eslint-disable-line no-undef
  requireFunc.resolve("uu_appg01/package.json");

  jest.doMock("uu_appg01", () => {
    let real = jest.requireActual("uu_appg01");
    mockClient = {
      ...real.Client,
      get: jest.fn(mockThrowErrorFn("get")),
      post: jest.fn(mockThrowErrorFn("post")),
      cmdGet: jest.fn(mockThrowErrorFn("cmdGet")),
      cmdPost: jest.fn(mockThrowErrorFn("cmdPost")),
    };
    return {
      ...real,
      Client: mockClient,
    };
  });
} catch (e) {
  if (e.code !== "MODULE_NOT_FOUND") throw e;
}
beforeEach(() => {
  if (mockClient) {
    mockClient.get.mockImplementation(mockThrowErrorFn("get"));
    mockClient.post.mockImplementation(mockThrowErrorFn("post"));
    mockClient.cmdGet.mockImplementation(mockThrowErrorFn("cmdGet"));
    mockClient.cmdPost.mockImplementation(mockThrowErrorFn("cmdPost"));
  }
});
afterEach(() => {
  if (mockClient) {
    mockClient.get.mockRestore();
    mockClient.post.mockRestore();
    mockClient.cmdGet.mockRestore();
    mockClient.cmdPost.mockRestore();
  }
});
