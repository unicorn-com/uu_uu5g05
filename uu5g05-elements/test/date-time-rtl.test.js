import { LanguageProvider, TimeZoneProvider, UserPreferencesProvider } from "uu5g05";
import { DateTime } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return {};
}
async function setup(
  props = {},
  opts,
  pref = {
    language: "en",
    timeZone: "Europe/Prague",
    longDateFormat: "dddd, MMMM D, Y",
    mediumDateFormat: "MMMM D, Y",
    shortDateFormat: "M/D/Y",
    weekStartDay: 1,
    hourFormat: 12,
  },
) {
  return VisualComponent.setup(
    ({ testId, ...props }) => {
      return (
        <div data-testid={testId}>
          <UserPreferencesProvider
            timeZone={pref.timeZone}
            longDateFormat={pref.longDateFormat}
            mediumDateFormat={pref.mediumDateFormat}
            shortDateFormat={pref.shortDateFormat}
            weekStartDay={pref.weekStartDay}
            hourFormat={pref.hourFormat}
          >
            <LanguageProvider language={pref.language}>
              <TimeZoneProvider timeZone={pref.timeZone}>
                <DateTime {...props} />
              </TimeZoneProvider>
            </LanguageProvider>
          </UserPreferencesProvider>
        </div>
      );
    },
    { ...getDefaultProps(), ...props },
    opts,
  );
}

describe("Uu5Elements.DateTime", () => {
  it("checks value = 2022-02-22T22:22:22.222Z is properly shown", async () => {
    const props = {
      value: "2022-02-22T22:22:22.222Z",
    };
    await setup(props);

    expect(Test.screen.getByText("February 22, 2022 11:22 pm")).toBeInTheDocument();
  });

  it.each([
    ["none", "11:22 pm"],
    ["short", "2/22/2022 11:22 pm"],
    ["medium", "February 22, 2022 11:22 pm"],
    ["long", "Tuesday, February 22, 2022 11:22 pm"],
  ])("checks dateFormat = %s is properly shown", async (dateFormat, value) => {
    const props = { dateFormat, value: "2022-02-22T22:22:22.222Z" };
    await setup(props);

    expect(Test.screen.getByText(value)).toBeInTheDocument();
  });

  it.each([
    ["none", "March 2, 2022"],
    ["short", "March 2, 2022 4:05 am"],
    ["medium", "March 2, 2022 04:05 am"],
    ["long", "March 2, 2022 04:05:06 am"],
  ])("checks timeFormat = %s is properly shown", async (timeFormat, value) => {
    const props = { timeFormat, value: "2022-03-02T04:05:06.789" };
    await setup(props);

    expect(Test.screen.getByText(value)).toBeInTheDocument();
  });

  it.each([
    [11, "February 22, 2022 11:22 pm"],
    [12, "February 22, 2022 11:22 pm"],
    [24, "February 22, 2022 23:22"],
  ])("checks hourFormat = %s is properly shown", async (hourFormat, value) => {
    const props = { hourFormat, value: "2022-02-22T22:22:22.222Z" };
    await setup(props);

    expect(Test.screen.getByText(value)).toBeInTheDocument();
  });

  it("checks timeZone = America/Los_Angeles is properly shown", async () => {
    const props = {
      timeZone: "America/Los_Angeles",
      value: "2022-02-22T22:22:22.222Z",
    };
    await setup(props);

    expect(Test.screen.getByText("February 22, 2022 02:22 pm")).toBeInTheDocument();
  });

  it.each([
    ["DD", "02"],
    ["MMMM", "March"],
    ["[Year]: Y", "Year: 2022"],
  ])("checks format = %s is properly shown", async (format, value) => {
    const props = { format, value: "2022-03-02T04:05:06.789" };
    await setup(props);

    expect(Test.screen.getByText(value)).toBeInTheDocument();
  });

  it("checks user preferences are properly shown", async () => {
    const props = { value: "2022-02-22T22:22:22.222Z" };
    await setup(props, undefined, {
      timeZone: "America/Los_Angeles",
      shortDateFormat: "D-M-Y",
      mediumDateFormat: "DD-MM-Y",
      longDateFormat: "MMMM, dddd, Y",
      weekStartDay: 7,
      hourFormat: 24,
    });

    expect(Test.screen.getByText("22-02-2022 14:22")).toBeInTheDocument();
  });
});
