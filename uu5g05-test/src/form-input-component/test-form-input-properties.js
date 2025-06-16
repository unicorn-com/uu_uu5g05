const React = require("react");
const { waitFor, screen } = require("../internal/testing-library.js");

function testFormInputProperties(setup, { skipProps = [] } = {}) {
  it("checks it is not possible to override width", async () => {
    const props = { width: "100px" };
    const { input } = await setup(props);

    const inputStyle = window.getComputedStyle(input);
    expect(inputStyle.getPropertyValue("width")).toBe("100%");
  });

  !skipProps.includes("label") &&
    it("checks label property is properly shown", async () => {
      const label = "Test label";
      const props = { label };
      await setup(props);

      expect(screen.getByLabelText(label)).toBeVisible();
    });

  it("checks info property as text is properly shown", async () => {
    const label = "Test label";
    const info = "Test info";
    const props = { label, info };
    const { user } = await setup(props);

    await user.pointer({ target: screen.getByRole("button", { name: "Info" }) });

    await waitFor(() => expect(screen.getByText(info)).toBeVisible());
  });

  it("checks info property as lsi is properly shown", async () => {
    const label = "Test label";
    const info = { en: "Test info" };
    const props = { label, info };
    const { user } = await setup(props);

    await user.pointer({ target: screen.getByRole("button", { name: "Info" }) });

    await waitFor(() => expect(screen.getByText(info.en)).toBeVisible());
  });

  it("checks info property as component is properly shown", async () => {
    const label = "Test label";
    const infoText = "Test info";
    const Info = () => React.createElement("span", null, infoText);
    const props = { label, info: React.createElement(Info) };
    const { user } = await setup(props);

    await user.pointer({ target: screen.getByRole("button", { name: "Info" }) });

    await waitFor(() => expect(screen.getByText(infoText)).toBeVisible());
  });

  it("checks message property as text is properly shown", async () => {
    const message = "Test message";
    const props = { message };
    await setup(props);

    expect(screen.getByText(message)).toBeVisible();
  });

  it("checks message property as lsi is properly shown", async () => {
    const message = { en: "Test message" };
    const props = { message };
    await setup(props);

    expect(screen.getByText(message.en)).toBeVisible();
  });

  it("checks message property as component is properly shown", async () => {
    const messageText = "Test message";
    const Message = () => React.createElement("span", null, messageText);
    const props = { message: React.createElement(Message) };
    await setup(props);

    expect(screen.getByText(messageText)).toBeVisible();
  });

  it("checks messageParams property is properly passed to message as lsi", async () => {
    const { Utils } = require("uu5g05");

    const message = { en: "Test %d message %s" };
    const messageParams = [1, "A"];
    const props = { message, messageParams };
    await setup(props);

    const expectedMessage = Utils.String.format(message.en, ...messageParams);
    expect(screen.getByText(expectedMessage)).toBeVisible();
  });

  !skipProps.includes("feedback") &&
    it.each([
      ["error", ["meaning", "negative", "main"]],
      ["warning", ["meaning", "warning", "main"]],
      ["success", ["building", "dark", "softStrongerTransparent"]],
    ])("checks property feedback = %s as text is properly shown", async (feedback, inputColorPath) => {
      const message = "Test message";
      const props = { message, feedback };
      const { input } = await setup(props);

      const messageElement = screen.getByText(message);
      expect(messageElement).toBeVisible();
      // TODO MFA How the message color is set?
      //expect(messageElement).toHaveGdsColor(inputColorPath);
      expect(input).toHaveGdsColor(inputColorPath, "border-color");
    });

  !skipProps.includes("inputRef") &&
    it("checks inputRef property is properly passed to input element", async () => {
      const { Utils } = require("uu5g05");

      const name = "Test name";
      const inputRef = Utils.Component.createRef();
      const props = { name, inputRef };
      const { input } = await setup(props);

      const inputRefName = inputRef.current.getAttribute("name");

      expect(inputRefName).toBe(name);
      expect(inputRefName).toBe(input.getAttribute("name"));
    });

  it("checks inputAttrs property is properly passed to input element", async () => {
    const handleMouseEnter = jest.fn();
    const props = { inputAttrs: { onMouseEnter: handleMouseEnter } };
    const { user, input } = await setup(props);

    await user.pointer({ target: input });

    expect(handleMouseEnter).toHaveBeenCalledTimes(1);
  });
}

module.exports = { testFormInputProperties };
