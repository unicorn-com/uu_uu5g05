import { UserPreferencesProvider, useState, Fragment } from "uu5g05";
import { Calendar } from "uu5g05-elements";
import { Test, VisualComponent, Utils } from "uu5g05-test";

window.visualViewport = window;

const today = new Date();
const currentDay = today.getDate();

function stateChange(Calendar) {
  return (props) => {
    const { value: initValue, ...calendarProps } = props;
    const [value, setValue] = useState(initValue);

    const handleSelect = (event) => {
      setValue(event.data.value);
      props.onSelect && props.onSelect(event);
    };

    return (
      <>
        <Calendar {...calendarProps} value={value} onSelect={handleSelect} />
      </>
    );
  };
}

function getDefaultProps() {
  return {};
}

async function setup({ ...props }, { Wrapper = Fragment } = {}) {
  return VisualComponent.setup(
    stateChange(Calendar),
    { ...getDefaultProps(), ...props },
    {
      Wrapper: ({ children }) => <Wrapper>{children}</Wrapper>,
    },
  );
}

let origGetBoundingClietRect;
beforeAll(() => {
  origGetBoundingClietRect = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function () {
    let id = this.getAttribute("data-item-id");
    if (id) {
      let height = 300;
      return { height, width: 200, left: 0, top: Number(id) * height, right: 200, bottom: (Number(id) + 1) * height };
    }
    return origGetBoundingClietRect.apply(this, arguments);
  };
});
afterAll(() => {
  HTMLElement.prototype.getBoundingClientRect = origGetBoundingClietRect;
});

describe("Uu5Elements.Calendar", () => {
  VisualComponent.testProperties(setup);

  it("checks current date is properly shown", async () => {
    await setup({ direction: "horizontal" });

    expect(Test.screen.getByTestId("current-day")).toHaveTextContent(currentDay);
    expect(Test.screen.getByTestId("current-day")).toHaveAttribute("aria-current", "date");
  });

  it("checks value is properly shown", async () => {
    const props = { value: "2022-08-23" };
    await setup(props);
    const activeDay = Test.screen.getByRole("button", { name: 23 });

    expect(Test.screen.getByText("August 2022")).toBeInTheDocument();
    expect(activeDay).toHaveAttribute("aria-selected", "true");
  });

  it("checks onSelect is properly called", async () => {
    const handleClick = jest.fn();
    const props = { value: "2022-08-23", onSelect: handleClick };
    let { user } = await setup(props);

    const selectedDay = Test.screen.getByRole("button", { name: 24 });
    await user.click(selectedDay);
    expect(Test.screen.getByRole("button", { name: 24 })).toHaveAttribute("aria-selected", "true");
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("checks horizontal min and max are properly shown", async () => {
    const props = { value: "2022-08-23", min: "2022-08-20", max: "2022-08-30" };
    await setup(props);

    expect(Test.screen.getByRole("button", { name: "previous" })).toBeDisabled();
    expect(Test.screen.getByRole("button", { name: "next" })).toBeDisabled();
    expect(Test.screen.getByRole("button", { name: 19 })).toBeDisabled();
    expect(Test.screen.getByRole("button", { name: 31 })).toBeDisabled();
  });

  it("checks vertical min and max are properly shown", async () => {
    Element.prototype.scrollIntoView = jest.fn();
    const props = { value: "2022-08-23", min: "2022-08-20", max: "2022-08-30", direction: "vertical" };
    await setup(props);

    expect(Test.screen.queryByRole("menuitem", { name: "Sep" })).not.toBeInTheDocument();
    expect(Test.screen.getByRole("menuitem", { name: "Aug" })).toBeInTheDocument();
  });

  it("checks selectionMode = week is properly shown", async () => {
    const handleClick = jest.fn();
    const props = { value: "2023-02-06", selectionMode: "week", onSelect: handleClick };
    const { user } = await setup(props);
    const selectedDay = Test.screen.getByRole("button", { name: 24 });
    await user.click(selectedDay);

    expect(Test.screen.getByRole("button", { name: 20 })).toHaveAttribute("aria-selected", "true");
    expect(Test.screen.getByRole("button", { name: 26 })).toHaveAttribute("aria-selected", "true");
  });

  it("checks selectionMode = weekRange is properly shown", async () => {
    const handleClick = jest.fn();
    const props = { value: "2023-02-06", selectionMode: "weekRange", onSelect: handleClick };
    const { user } = await setup(props);
    const startWeek = Test.screen.getByRole("button", { name: 16 });
    const endWeek = Test.screen.getByRole("button", { name: 24 });
    await user.click(startWeek);
    await user.click(endWeek);

    expect(Test.screen.getByRole("button", { name: 13 })).toHaveAttribute("aria-selected", "true");
    expect(Test.screen.getByRole("button", { name: 26 })).toHaveAttribute("aria-selected", "true");
  });

  it("checks selectionMode = range is properly shown", async () => {
    const props = { value: ["2022-08-23", "2022-08-30"], selectionMode: "range" };
    await setup(props);

    expect(Test.screen.getByRole("button", { name: 23 })).toHaveAttribute("aria-selected", "true");
    expect(Test.screen.getByRole("button", { name: 30 })).toHaveAttribute("aria-selected", "true");
  });

  it("checks displayWeekNumbers is properly shown", async () => {
    const props = { displayWeekNumbers: true };
    await setup(props);

    expect(Test.screen.getByTestId("week-numbers")).toBeInTheDocument();
  });

  it.each([
    ["horizontal", "horizontal-calendar"],
    ["vertical", "vertical-calendar"],
  ])("checks direction is properly shown", async (direction, calendar) => {
    const props = { direction };
    await setup(props);

    expect(Test.screen.getByTestId(calendar)).toBeInTheDocument();
  });

  it("checks displayNavigation is properly shown", async () => {
    const props = { direction: "vertical", displayNavigation: false };
    await setup(props);

    expect(Test.screen.queryByTestId("navigation")).not.toBeInTheDocument();
  });

  it("checks displayPresets is properly shown", async () => {
    const props = { direction: "vertical", displayPresets: true };
    await setup(props);

    expect(Test.screen.getByTestId("presets")).toBeInTheDocument();
  });

  it("checks height is properly shown", async () => {
    const props = { direction: "vertical", height: "350px" };
    await setup(props);

    const elementStyle = window.getComputedStyle(Test.screen.getByTestId("scrollable-box"));
    expect(elementStyle.getPropertyValue("height")).toBe("350px");
  });

  it.each([
    [7, "Su"],
    [1, "Mo"],
  ])("checks week starts with Monday or Sunday", async (weekDayNum, weekDay) => {
    const Wrapper = ({ children }) => (
      <UserPreferencesProvider weekStartDay={weekDayNum}>{children}</UserPreferencesProvider>
    );
    const props = { value: "2022-08-23" };
    await setup(props, { Wrapper });
    const firstDay = Test.screen.getByTestId("week-days").children[0];

    expect(firstDay).toHaveTextContent(weekDay);
  });
});
