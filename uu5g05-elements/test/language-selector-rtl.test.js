import { LanguageSelector } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return {
    languageList: ["cs", { code: "en", name: "English" }, { code: "uk", flagUri: "https://cdn.plus4u.net/" }],
  };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(LanguageSelector, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.LanguageSelector", () => {
  VisualComponent.testProperties(setup);

  it("checks languageList is properly shown", async () => {
    const { user } = await setup();

    expect(Test.screen.getByRole("button", { name: "EN-GB" })).toBeInTheDocument();
    expect(Test.screen.queryByText("EN")).not.toBeInTheDocument();
    expect(Test.screen.queryByText("CS")).not.toBeInTheDocument();
    expect(Test.screen.queryByText("UK")).not.toBeInTheDocument();

    await user.click(Test.screen.getByRole("button", { name: "EN-GB" }));

    expect(Test.screen.getByRole("menuitem", { name: "Čeština CS" })).toBeInTheDocument();
    expect(Test.screen.getByRole("menuitem", { name: "English EN" })).toBeInTheDocument();
    expect(Test.screen.getByRole("menuitem", { name: "Українська UK" })).toBeInTheDocument();

    await user.click(Test.screen.getByRole("menuitem", { name: "Čeština CS" }));

    expect(Test.screen.getByRole("button", { name: "CS" })).toBeInTheDocument();
    expect(Test.screen.queryByText("menuitem", { name: "Čeština CS" })).not.toBeInTheDocument();
    expect(Test.screen.queryByText("menuitem", { name: "English EN" })).not.toBeInTheDocument();
    expect(Test.screen.queryByText("menuitem", { name: "Українська UK" })).not.toBeInTheDocument();
  });

  it.each([
    ["code", "EN-GB"],
    ["name", "British English"],
    ["flag", "gb"],
    ["flag-code", "gb EN-GB"],
    ["flag-name", "gb British English"],
  ])("checks labelType = %s is properly shown", async (labelType, label) => {
    await setup({ labelType });

    expect(Test.screen.getByRole("button", { name: label })).toBeInTheDocument();

    if (labelType == "flag" || labelType == "flag-code" || labelType == "flag-name") {
      expect(Test.screen.getByRole("img", { name: "gb" })).toBeInTheDocument();
    }
  });

  it.each([
    ["name", "English"],
    ["name-code", "English EN"],
    ["flag-name", "gb English"],
    ["flag-name-code", "gb English EN"],
  ])("checks itemType = %s is properly shown", async (itemType, item) => {
    const { user } = await setup({ itemType });

    await user.click(Test.screen.getByRole("button", { name: "EN-GB" }));

    expect(Test.screen.getByRole("menuitem", { name: item })).toBeInTheDocument();

    if (itemType == "flag-name" || itemType == "flag-name-code") {
      expect(Test.screen.getByRole("img", { name: "gb" })).toBeInTheDocument();
    }
  });
});
