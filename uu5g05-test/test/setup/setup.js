const { Session, testProperty } = require("uu5g05-test");

// TODO Next major - remove support for enzyme tests entirely.
const React = require("react");
if (parseInt(React.version) <= 16) {
  // use enzyme-to-json as serializer (handles enzyme wrappers, e.g. expect(wrapper).toMatchSnapshot())
  // NOTE This is required so that enzyme wrappers are converted to modifiable JSON.
  const IGNORE_DEFAULT_PROPS = true;
  expect.addSnapshotSerializer(
    require("enzyme-to-json").createSerializer({ ignoreDefaultProps: IGNORE_DEFAULT_PROPS }),
  );
}

// add serializers (serializing with comment & serializing into string)
expect.addSnapshotSerializer(new testProperty._SnapshotCommentSerializer());
expect.addSnapshotSerializer(new testProperty._SnapshotToStringSerializer());

// let user be logged in automatically in tests
beforeEach(async () => {
  await Session.setIdentity(Session.TEST_IDENTITY);
});
afterEach(async () => {
  Session.reset();
});
