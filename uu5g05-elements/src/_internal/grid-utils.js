import { Utils } from "uu5g05";

const stringifyLayout = (layout) => {
  if (!layout || typeof layout !== "string") return;

  return (
    "'" +
    layout
      .replace(/\r?\n|\r/g, "")
      .split(",")
      .map((row) => row.trim())
      .join("' '") +
    "'"
  );
};

function getTextAlign(justifySelf) {
  if (justifySelf === "start" || justifySelf === "center" || justifySelf === "end") return justifySelf;
}

export const GridUtils = {
  getGridItemStyle: (gridItemSettings = {}, contentSize) => {
    const { gridArea, colSpan, rowSpan, justifySelf: justifySelfProp, alignSelf } = gridItemSettings;

    const colSpanSizeValue = Utils.ScreenSize.getSizeValue(colSpan, contentSize);
    const rowSpanSizeValue = Utils.ScreenSize.getSizeValue(rowSpan, contentSize);
    const justifySelf = Utils.ScreenSize.getSizeValue(justifySelfProp, contentSize);

    return {
      gridArea: gridArea,
      gridColumn: colSpanSizeValue ? `span ${colSpanSizeValue}` : undefined,
      gridRow: rowSpanSizeValue ? `span ${rowSpanSizeValue}` : undefined,
      justifySelf,
      alignSelf: Utils.ScreenSize.getSizeValue(alignSelf, contentSize),
      textAlign: getTextAlign(justifySelf),
    };
  },
  getGridStyle: (gridSettings = {}, contentSize, spacing) => {
    const { display, templateRows, autoRows, templateColumns, autoColumns, templateAreas, rowGap, columnGap, flow } =
      gridSettings;

    const gridTemplateRows = Utils.ScreenSize.getSizeValue(templateRows, contentSize);
    const gridAutoRows = Utils.ScreenSize.getSizeValue(autoRows, contentSize);
    let gridTemplateColumns = Utils.ScreenSize.getSizeValue(templateColumns, contentSize);
    const gridAutoColumns = Utils.ScreenSize.getSizeValue(autoColumns, contentSize);
    const layout = Utils.ScreenSize.getSizeValue(templateAreas, contentSize);
    const gridRowGap = Utils.ScreenSize.getSizeValue(rowGap, contentSize);
    const gridColumnGap = Utils.ScreenSize.getSizeValue(columnGap, contentSize);
    const justifyItems = Utils.ScreenSize.getSizeValue(gridSettings.justifyItems, contentSize);
    const alignItems = Utils.ScreenSize.getSizeValue(gridSettings.alignItems, contentSize);
    const justifyContent = Utils.ScreenSize.getSizeValue(gridSettings.justifyContent, contentSize);
    const alignContent = Utils.ScreenSize.getSizeValue(gridSettings.alignContent, contentSize);
    const gridAutoFlow = Utils.ScreenSize.getSizeValue(flow, contentSize);

    let gridTemplateAreas;
    if (layout) {
      gridTemplateAreas = stringifyLayout(layout);

      if (!gridTemplateColumns) {
        const lengths = layout.split(",").map((v) => v.trim().split(/ +/).length);
        gridTemplateColumns = `repeat(${Math.max(...lengths)}, 1fr)`;
      }
    }

    return {
      justifyItems,
      alignItems,
      justifyContent,
      alignContent,
      display: display === "inline" ? "inline-grid" : "grid",
      gridTemplateRows,
      gridAutoRows,
      gridTemplateAreas,
      gridAutoColumns,
      gridTemplateColumns,
      rowGap: gridRowGap == null ? spacing.c : gridRowGap,
      columnGap: gridColumnGap == null ? spacing.c : gridColumnGap,
      gridAutoFlow,
    };
  },
};
