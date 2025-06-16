import { LanguageProvider } from "uu5g05";
import { Alert } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";
import { resetTimers } from "./internal/test-tools.js";

afterEach(resetTimers);

function getDefaultProps() {
  return {};
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Alert, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.Alert", () => {
  VisualComponent.testProperties(setup);
  it("checks default property values", async () => {
    const { element } = await setup();

    expect(element).toHaveGdsShape(["overlay", "light", "important", "distinct"]);
  });

  it("checks header is properly shown", async () => {
    const props = { header: "Header" };
    await setup(props);

    expect(Test.screen.getByText("Header")).toBeInTheDocument();
  });

  it.each([
    ["en", "Title"],
    ["cs", "Nadpis"],
  ])("checks header lsi is properly shown", async (language, header) => {
    const Wrapper = ({ children }) => <LanguageProvider language={language}>{children}</LanguageProvider>;
    const props = { header: { en: "Title", cs: "Nadpis" } };
    await setup(props, { Wrapper });

    expect(Test.screen.getByText(header)).toBeInTheDocument();
  });

  it("checks message is properly shown", async () => {
    const props = { message: "Test" };
    await setup(props);

    expect(Test.screen.getByText("Test")).toBeInTheDocument();
  });

  it.each([
    ["en", "Alert content"],
    ["cs", "Obsah upozornění"],
  ])("checks message lsi is properly shown", async (language, message) => {
    const Wrapper = ({ children }) => <LanguageProvider language={language}>{children}</LanguageProvider>;
    const props = { message: { en: "Alert content", cs: "Obsah upozornění" } };
    await setup(props, { Wrapper });

    expect(Test.screen.getByText(message)).toBeInTheDocument();
  });

  it.each([
    ["error", "negative"],
    ["warning", "warning"],
    ["success", "positive"],
    ["info", "important"],
  ])("checks priority = %s is properly shown", async (priority, colorScheme) => {
    const props = { priority };
    const { element } = await setup(props);

    expect(element).toHaveGdsShape(["overlay", "light", colorScheme, "distinct"]);
  });

  it("checks onClose is properly called", async () => {
    const handleClick = jest.fn();
    jest.useFakeTimers();
    const props = { durationMs: 2000, header: "alert", onClose: handleClick };
    await setup(props);

    Test.fireEvent.click(Test.screen.getByText("alert"));

    Test.act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
