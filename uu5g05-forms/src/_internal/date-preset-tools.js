import { Lsi, Utils } from "uu5g05";
import { UuDate } from "uu_i18ng01";
import importLsi from "../lsi/import-lsi.js";

export const DefaultPresetMap = {
  date: {
    today: {
      children: <Lsi import={importLsi} path={["datePresets", "today"]} />,
      getValue: () => new UuDate().toIsoString(),
    },
    yesterday: {
      children: <Lsi import={importLsi} path={["datePresets", "yesterday"]} />,
      getValue: () => new UuDate().shiftDay(-1).toIsoString(),
    },
    dayBeforeYesterday: {
      children: <Lsi import={importLsi} path={["datePresets", "dayBeforeYesterday"]} />,
      getValue: () => new UuDate().shiftDay(-2).toIsoString(),
    },
    tomorrow: {
      children: <Lsi import={importLsi} path={["datePresets", "tomorrow"]} />,
      getValue: () => new UuDate().shiftDay(1).toIsoString(),
    },
    nextWeek: {
      children: <Lsi import={importLsi} path={["datePresets", "nextWeek"]} />,
      getValue: () => new UuDate().shiftDay(7).startOfWeek().toIsoString(),
    },
    nextMonth: {
      children: <Lsi import={importLsi} path={["datePresets", "nextMonth"]} />,
      getValue: () => new UuDate().shiftMonth(1).startOfMonth().toIsoString(),
    },
    lastWeek: {
      children: <Lsi import={importLsi} path={["datePresets", "lastWeek"]} />,
      getValue: () => new UuDate().shiftDay(-7).startOfWeek().toIsoString(),
    },
    lastMonth: {
      children: <Lsi import={importLsi} path={["datePresets", "previousMonth"]} />,
      getValue: () => new UuDate().shiftMonth(-1).startOfMonth().toIsoString(),
    },
  },
  dateRange: {
    today: {
      children: <Lsi import={importLsi} path={["datePresets", "today"]} />,
      getValue: () => new UuDate().toIsoString(),
    },
    yesterday: {
      children: <Lsi import={importLsi} path={["datePresets", "yesterday"]} />,
      getValue: () => new UuDate().shiftDay(-1).toIsoString(),
    },
    tomorrow: {
      children: <Lsi import={importLsi} path={["datePresets", "tomorrow"]} />,
      getValue: () => new UuDate().shiftDay(1).toIsoString(),
    },
    nextWeek: {
      children: <Lsi import={importLsi} path={["datePresets", "nextWeek"]} />,
      getValue: () => [
        new UuDate().shiftDay(7).startOfWeek().toIsoString(),
        new UuDate().shiftDay(7).endOfWeek().toIsoString(),
      ],
    },
    nextMonth: {
      children: <Lsi import={importLsi} path={["datePresets", "nextMonth"]} />,
      getValue: () => [
        new UuDate().shiftMonth(1).startOfMonth().toIsoString(),
        new UuDate().shiftMonth(1).endOfMonth().toIsoString(),
      ],
    },
    lastWeek: {
      children: <Lsi import={importLsi} path={["datePresets", "lastWeek"]} />,
      getValue: () => [
        new UuDate().shiftDay(-7).startOfWeek().toIsoString(),
        new UuDate().shiftDay(-7).endOfWeek().toIsoString(),
      ],
    },
    previousMonth: {
      children: <Lsi import={importLsi} path={["datePresets", "previousMonth"]} />,
      getValue: () => [
        new UuDate().shiftMonth(-1).startOfMonth().toIsoString(),
        new UuDate().shiftMonth(-1).endOfMonth().toIsoString(),
      ],
    },
    lastMonth: {
      children: <Lsi import={importLsi} path={["datePresets", "previousMonth"]} />,
      getValue: () => [
        new UuDate().shiftMonth(-1).startOfMonth().toIsoString(),
        new UuDate().shiftMonth(-1).endOfMonth().toIsoString(),
      ],
    },
    last7Days: {
      children: <Lsi import={importLsi} path={["datePresets", "last7Days"]} />,
      getValue: () => [new UuDate().shiftDay(-6).toIsoString(), new UuDate().toIsoString()],
    },
    last30Days: {
      children: <Lsi import={importLsi} path={["datePresets", "last30Days"]} />,
      getValue: () => [new UuDate().shiftDay(-29).toIsoString(), new UuDate().toIsoString()],
    },
    thisMonth: {
      children: <Lsi import={importLsi} path={["datePresets", "thisMonth"]} />,
      getValue: () => [new UuDate().startOfMonth().toIsoString(), new UuDate().endOfMonth().toIsoString()],
    },
  },
  month: {
    thisMonth: {
      children: <Lsi import={importLsi} path={["datePresets", "thisMonth"]} />,
      getValue: () => getMonthFormat(new UuDate().startOfMonth()),
    },
    lastMonth: {
      children: <Lsi import={importLsi} path={["datePresets", "previousMonth"]} />,
      getValue: () => getMonthFormat(new UuDate().shiftMonth(-1).startOfMonth()),
    },
    last3Months: {
      children: <Lsi import={importLsi} path={["datePresets", "last3Months"]} />,
      getValue: () => [
        getMonthFormat(new UuDate().shiftMonth(-3).startOfMonth()),
        getMonthFormat(new UuDate().shiftMonth(-1).endOfMonth()),
      ],
    },
    last6Months: {
      children: <Lsi import={importLsi} path={["datePresets", "last6Months"]} />,
      getValue: () => [
        getMonthFormat(new UuDate().shiftMonth(-6).startOfMonth()),
        getMonthFormat(new UuDate().shiftMonth(-1).endOfMonth()),
      ],
    },
    last12Months: {
      children: <Lsi import={importLsi} path={["datePresets", "last12Months"]} />,
      getValue: () => [
        getMonthFormat(new UuDate().shiftMonth(-12).startOfMonth()),
        getMonthFormat(new UuDate().shiftMonth(-1).endOfMonth()),
      ],
    },
    nextMonth: {
      children: <Lsi import={importLsi} path={["datePresets", "nextMonth"]} />,
      getValue: () => getMonthFormat(new UuDate().shiftMonth(1).startOfMonth()),
    },
    next3Months: {
      children: <Lsi import={importLsi} path={["datePresets", "next3Months"]} />,
      getValue: () => [
        getMonthFormat(new UuDate().shiftMonth(1).startOfMonth()),
        getMonthFormat(new UuDate().shiftMonth(3).endOfMonth()),
      ],
    },
    next6Months: {
      children: <Lsi import={importLsi} path={["datePresets", "next6Months"]} />,
      getValue: () => [
        getMonthFormat(new UuDate().shiftMonth(1).startOfMonth()),
        getMonthFormat(new UuDate().shiftMonth(6).endOfMonth()),
      ],
    },
    next12Months: {
      children: <Lsi import={importLsi} path={["datePresets", "next12Months"]} />,
      getValue: () => [
        getMonthFormat(new UuDate().shiftMonth(1).startOfMonth()),
        getMonthFormat(new UuDate().shiftMonth(12).endOfMonth()),
      ],
    },
  },
  year: {
    thisYear: {
      children: <Lsi import={importLsi} path={["datePresets", "thisYear"]} />,
      getValue: () => getYearFormat(new UuDate().startOfYear()),
    },
    nextYear: {
      children: <Lsi import={importLsi} path={["datePresets", "nextYear"]} />,
      getValue: () => getYearFormat(new UuDate().shiftYear(1).startOfYear()),
    },
    lastYear: {
      children: <Lsi import={importLsi} path={["datePresets", "previousYear"]} />,
      getValue: () => getYearFormat(new UuDate().shiftYear(-1).startOfYear()),
    },
    next2Years: {
      children: <Lsi import={importLsi} path={["datePresets", "next2Years"]} />,
      getValue: () => [
        getYearFormat(new UuDate().shiftYear(1).startOfYear()),
        getYearFormat(new UuDate().shiftYear(2).endOfYear()),
      ],
    },
    next3Years: {
      children: <Lsi import={importLsi} path={["datePresets", "next3Years"]} />,
      getValue: () => [
        getYearFormat(new UuDate().shiftYear(1).startOfYear()),
        getYearFormat(new UuDate().shiftYear(3).endOfYear()),
      ],
    },
    last2Years: {
      children: <Lsi import={importLsi} path={["datePresets", "last2Years"]} />,
      getValue: () => [
        getYearFormat(new UuDate().shiftYear(-2).startOfYear()),
        getYearFormat(new UuDate().shiftYear(-1).endOfYear()),
      ],
    },
    last3Years: {
      children: <Lsi import={importLsi} path={["datePresets", "last3Years"]} />,
      getValue: () => [
        getYearFormat(new UuDate().shiftYear(-3).startOfYear()),
        getYearFormat(new UuDate().shiftYear(-1).endOfYear()),
      ],
    },
  },
  quarter: {
    thisQuarter: {
      children: <Lsi import={importLsi} path={["datePresets", "thisQuarter"]} />,
      getValue: () => getQuarterFormat(new UuDate().startOfMonth()),
    },
    nextQuarter: {
      children: <Lsi import={importLsi} path={["datePresets", "nextQuarter"]} />,
      getValue: () => getQuarterFormat(new UuDate().startOfMonth().shiftMonth(3)),
    },
    lastQuarter: {
      children: <Lsi import={importLsi} path={["datePresets", "previousQuarter"]} />,
      getValue: () => getQuarterFormat(new UuDate().startOfMonth().shiftMonth(-3)),
    },
  },
  week: {
    thisWeek: {
      children: <Lsi import={importLsi} path={["datePresets", "thisWeek"]} />,
      getValue: () => getWeekFormat(new UuDate()),
    },
    nextWeek: {
      children: <Lsi import={importLsi} path={["datePresets", "nextWeek"]} />,
      getValue: () => getWeekFormat(new UuDate().shiftDay(7).startOfWeek()),
    },
    next2Weeks: {
      children: <Lsi import={importLsi} path={["datePresets", "next2Weeks"]} />,
      getValue: () => [
        getWeekFormat(new UuDate().shiftDay(7).startOfWeek()),
        getWeekFormat(new UuDate().shiftDay(14).startOfWeek()),
      ],
    },
    next3Weeks: {
      children: <Lsi import={importLsi} path={["datePresets", "next3Weeks"]} />,
      getValue: () => [
        getWeekFormat(new UuDate().shiftDay(7).startOfWeek()),
        getWeekFormat(new UuDate().shiftDay(21).startOfWeek()),
      ],
    },
    lastWeek: {
      children: <Lsi import={importLsi} path={["datePresets", "lastWeek"]} />,
      getValue: () => getWeekFormat(new UuDate().shiftDay(-7).startOfWeek()),
    },
    last2Weeks: {
      children: <Lsi import={importLsi} path={["datePresets", "last2Weeks"]} />,
      getValue: () => [
        getWeekFormat(new UuDate().shiftDay(-14).startOfWeek()),
        getWeekFormat(new UuDate().shiftDay(-7).startOfWeek()),
      ],
    },
    last3Weeks: {
      children: <Lsi import={importLsi} path={["datePresets", "last3Weeks"]} />,
      getValue: () => [
        getWeekFormat(new UuDate().shiftDay(-21).startOfWeek()),
        getWeekFormat(new UuDate().shiftDay(-7).startOfWeek()),
      ],
    },
  },
};

export function getPresetList(presetList, onSelect, onSelectCallback, key = "date") {
  if (!presetList) return [];

  const newPresetList = [];

  presetList.forEach((item) => {
    let newPreset = item;

    if (typeof item === "string") {
      let defaultPreset = DefaultPresetMap[key][item];

      if (!defaultPreset) return;

      newPreset = {
        children: defaultPreset.children,
        onClick: (e) => {
          onSelect(new Utils.Event({ value: defaultPreset.getValue() }, e));
        },
      };
    }

    newPresetList.push({
      ...newPreset,
      onClick: (e) => {
        newPreset.onClick(e);
        if (typeof onSelectCallback === "function") onSelectCallback();
      },
      size: "xs",
    });
  });

  return newPresetList;
}

function getMonthFormat(date) {
  return date.format(undefined, { format: "YYYY-MM" });
}

function getYearFormat(date) {
  return date.format(undefined, { format: "YYYY" });
}

function getQuarterFormat(date) {
  const year = date.getYear();
  const month = date.getMonth();
  const quarter = Math.ceil(month / 3);

  return `${year}-Q${quarter}`;
}

function getWeekFormat(date) {
  return date.toIsoWeekString(true);
}
