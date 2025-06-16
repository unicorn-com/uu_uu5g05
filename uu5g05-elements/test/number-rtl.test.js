import { LanguageProvider, UserPreferencesProvider } from "uu5g05";
import { Number } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return {
    value: 123456.789,
  };
}
async function setup(
  props = {},
  opts,
  pref = { language: "en", numberGroupingSeparator: ",", numberDecimalSeparator: "." },
) {
  return VisualComponent.setup(
    ({ testId, ...props }) => {
      return (
        <div data-testid={testId}>
          <UserPreferencesProvider
            numberGroupingSeparator={pref.numberGroupingSeparator}
            numberDecimalSeparator={pref.numberDecimalSeparator}
            currencyGroupingSeparator={pref.currencyGroupingSeparator}
            currencyDecimalSeparator={pref.currencyDecimalSeparator}
          >
            <LanguageProvider language={pref.language}>
              <Number {...props} />
            </LanguageProvider>
          </UserPreferencesProvider>
        </div>
      );
    },
    { ...getDefaultProps(), ...props },
    opts,
  );
}

describe("Uu5Elements.Number", () => {
  it("checks default property values", async () => {
    await setup();

    expect(Test.screen.getByText("123,456.789")).toBeInTheDocument();
  });

  it.each([
    ["standard", "123,456.789"],
    ["scientific", "1.235E5"],
    ["engineering", "123.457E3"],
  ])("checks notation = %s is properly shown", async (notation, value) => {
    const props = { notation };
    await setup(props);

    expect(Test.screen.getByText(value)).toBeInTheDocument();
  });

  it.each([
    ["short", "123K"],
    ["long", "123 thousand"],
  ])("checks format = %s is properly shown", async (format, value) => {
    const props = { format };
    await setup(props);

    expect(Test.screen.getByText(value)).toBeInTheDocument();
  });

  it.each([
    ["centimeter", "123,456.789 cm"],
    ["liter", "123,456.789 L"],
    ["percent", "123,456.789%"],
  ])("checks unit = %s is properly shown", async (unit, value) => {
    const props = { unit };
    await setup(props);

    expect(Test.screen.getByText(value)).toBeInTheDocument();
  });

  it.each([
    ["long", "123,456.789 liters"],
    ["short", "123,456.789 L"],
    ["narrow", "123,456.789L"],
  ])("checks unitFormat = %s is properly shown", async (unitFormat, value) => {
    const props = { unitFormat, unit: "liter" };
    await setup(props);

    expect(Test.screen.getByText(value)).toBeInTheDocument();
  });

  it.each([
    ["en", "€123,456.79", ",", "."],
    ["cs", "123 456,79 €", " ", ","],
    ["sk", "123 456,79 €", " ", ","],
    ["uk", "123 456,79 EUR", " ", ","],
  ])(
    "checks currency='EUR' in language = %s uses settings from parent UserPreferencesProvider",
    async (language, value, currencyGroupingSeparator, currencyDecimalSeparator) => {
      const props = { currency: "EUR" };
      await setup(props, undefined, { language, currencyGroupingSeparator, currencyDecimalSeparator });

      expect(Test.screen.getByText(value)).toBeInTheDocument();
    },
  );

  it.each([
    ["symbol", "€123,456.79"],
    ["narrowSymbol", "€123,456.79"],
    ["code", "EUR 123,456.79"],
    ["name", "123,456.79 euros"],
  ])("checks currencyFormat = %s is properly shown", async (currencyFormat, value) => {
    const props = { currencyFormat, currency: "EUR" };
    await setup(props);

    expect(Test.screen.getByText(value)).toBeInTheDocument();
  });

  it.each(["ceil", "floor", "expand", "trunc", "halfCeil", "halfFloor", "halfExpand", "halfTrunc", "halfEven"])(
    "checks roundingMode = %s is properly shown",
    async (roundingMode) => {
      const props = { roundingMode, value: 1.4 };
      await setup(props);
      roundingMode == "ceil" || roundingMode == "expand"
        ? expect(Test.screen.getByText("2")).toBeInTheDocument()
        : expect(Test.screen.getByText("1")).toBeInTheDocument();
    },
  );

  it.each([
    [1, "123,460"],
    [-1, "123,456.8"],
  ])("checks roundingPosition = %s is properly shown", async (roundingPosition, value) => {
    const props = { roundingPosition };
    await setup(props);

    expect(Test.screen.getByText(value)).toBeInTheDocument();
  });

  it("checks minDecimalDigits={8} is properly shown", async () => {
    const props = { minDecimalDigits: 8 };
    await setup(props);

    expect(Test.screen.getByText("123,456.78900000")).toBeInTheDocument();
  });

  it("checks maxDecimalDigits={1} is properly shown", async () => {
    const props = { maxDecimalDigits: 2 };
    await setup(props);

    expect(Test.screen.getByText("123,456.79")).toBeInTheDocument();
  });

  it("checks minIntegerDigits={10} is properly shown", async () => {
    const props = { minIntegerDigits: 10 };
    await setup(props);

    expect(Test.screen.getByText("0,000,123,456.789")).toBeInTheDocument();
  });

  it("checks groupingSeparator is properly shown", async () => {
    const props = { groupingSeparator: " " };
    await setup(props);

    expect(Test.screen.getByText("123 456.789")).toBeInTheDocument();
  });

  it("checks decimalSeparator is properly shown", async () => {
    const props = { decimalSeparator: ";" };
    await setup(props);

    expect(Test.screen.getByText("123,456;789")).toBeInTheDocument();
  });

  it("checks user preferences set to cs are properly shown", async () => {
    await setup(undefined, undefined, { language: "cs", numberGroupingSeparator: " ", numberDecimalSeparator: "," });

    expect(Test.screen.getByText("123 456,789")).toBeInTheDocument();
  });
});
