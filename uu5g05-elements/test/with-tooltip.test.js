import { Utils } from "uu5g05";
import { withTooltip } from "uu5g05-elements";
import { Test } from "uu5g05-test";

const TestComponent = withTooltip((props) => {
  return props.tooltip;
});

describe(`Uu5Elements.WithTooltip`, () => {
  it(`accepts string tooltip`, () => {
    Test.render(<TestComponent tooltip="test-tooltip" />);
    expect(Test.screen.getByText("test-tooltip")).toBeInTheDocument();
  });

  it(`accepts lsi object tooltip`, () => {
    Utils.Language.setLanguage("en");
    Test.render(<TestComponent tooltip={{ cs: "cs value", en: "en value" }} />);
    expect(Test.screen.getByText("en value")).toBeInTheDocument();
    expect(Test.screen.queryByText("cs value")).not.toBeInTheDocument();

    Test.act(() => {
      Utils.Language.setLanguage("cs");
    });
    expect(Test.screen.queryByText("en value")).not.toBeInTheDocument();
    expect(Test.screen.getByText("cs value")).toBeInTheDocument();
  });
});
