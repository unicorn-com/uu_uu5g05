import { PropTypes, BackgroundProvider } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config";

function isValidProp(Component, props) {
  let origConsole = window.console;
  let valid = true;
  window.console = { error: () => (valid = false) };
  try {
    PropTypes.resetWarningCache();
    PropTypes.checkPropTypes(Component.propTypes, props, "prop", Component.uu5Tag);
  } finally {
    window.console = origConsole;
  }
  return valid;
}

function copyToClipboard(content) {
  let actualScroll = window.scrollY || document.body.scrollTop || window.pageYOffset;
  let tempElement = document.createElement("textarea");
  tempElement.className = "uu5-common-temp-textarea";
  tempElement.value = content;
  document.body.appendChild(tempElement);
  tempElement.select();
  document.execCommand("copy");

  if (tempElement.remove) {
    tempElement.remove();
  } else {
    tempElement.parentNode.removeChild(tempElement);
  }

  document.documentElement.scrollTop = actualScroll;
  document.body.scrollTop = actualScroll;
}

function Table({ className, rows, columns, columnWidth = 376, rowGap = 4, columnGap = 4 }) {
  let columnSize, rowSize, columns2render;

  if (rows) {
    rowSize = rows.length;
    columnSize = Math.max(...rows.map((row) => row.length));
  } else {
    columnSize = columns.length;
    rowSize = Math.max(...columns.map((column) => column.length));
    columns2render = columns.map((column, i) => {
      if (rowSize !== column.length) {
        column = [...column, ...Array.from({ length: rowSize - column.length }, (x, i) => <span key={"fill-" + i} />)];
      }
      return (
        <div
          key={i}
          className={Config.Css.css({
            display: "grid",
            gridTemplateColumns: "1fr",
            rowGap,
          })}
        >
          {column}
        </div>
      );
    });
  }

  return (
    <div
      className={Config.Css.join(
        Config.Css.css(
          {
            display: "grid",
            gridTemplateColumns: `repeat(auto-fit, minmax(${columnWidth}px, 1fr))`,
            gridTemplateRows: "auto",
            columnGap,
            justifyItems: "stretch",
            alignItems: "center",
          },
          className,
        ),
      )}
    >
      {rows || columns2render}
    </div>
  );
}

const STATE_MAP = { accent: "hover", marked: "pressed", saving: "print" };

function ColorTable({
  children,
  background,
  colorScheme,
  config,
  data,
  significanceList,
  stateMap = STATE_MAP,
  hideSignificance = false,
  hideHeader = false,
  placeItems = "stretch",
}) {
  stateMap = { ...STATE_MAP, ...stateMap };

  const items = [];
  let backgroundColor;

  let significanceKeys = Object.keys(config);
  if (significanceList) significanceKeys = significanceKeys.filter((s) => significanceList.indexOf(s) > -1);
  const significanceCount = significanceKeys.length;
  const stateCountList = significanceKeys.map((significance) => Object.keys(config[significance]).length);
  const stateCount = Math.max(...stateCountList);

  const stateMaxCountI = stateCountList.indexOf(stateCount);
  const stateKeys = [
    ...Object.keys(config[significanceKeys[stateMaxCountI]])
      .map((state) => (stateMap[state] === null ? null : stateMap[state] || state))
      .filter(Boolean),
    "disabled",
  ];

  if (colorScheme) {
    significanceKeys.forEach((significance) => {
      Object.keys(config[significance]).forEach((state) => {
        if (stateMap[state] !== null) {
          items.push(
            children({
              key: significance + state,
              style: config[significance][state],
              data: data ? data[significance][state] : undefined,

              background,
              colorScheme,
              significance,
              state,
            }),
          );
        }
      });

      const state = "disabled";
      items.push(
        children({
          key: significance + state,
          style: config[significance].default,
          data: data ? data[significance].default : undefined,

          background,
          colorScheme,
          significance,
          state,
        }),
      );
    });

    if (background === "dark") {
      backgroundColor = Uu5Elements.UuGds.ColorPalette.getValue(["building", "dark", "main"]);
    } else if (background === "full") {
      backgroundColor = Uu5Elements.UuGds.ColorPalette.getValue(["meaning", "primary", "main"]);
    } else if (background === "soft") {
      backgroundColor = Uu5Elements.UuGds.ColorPalette.getValue(["meaning", "primary", "softSolidLight"]);
    }
  }

  return (
    <Uu5Elements.Grid
      templateColumns={`${hideSignificance ? "0px" : "60px"} repeat(${stateKeys.length}, 1fr)`}
      templateRows={`auto repeat(${significanceCount}, 1fr)`}
      columnGap={4}
      rowGap={4}
      justifyItems="center"
      alignItems="center"
      className={Config.Css.css({ fontSize: 10 })}
    >
      <Uu5Elements.Grid.Item justifySelf="end">{!hideHeader && <b>{colorScheme}</b>}</Uu5Elements.Grid.Item>
      {stateKeys.map((state) => (
        <div key={state} style={{ color: colorScheme ? undefined : "transparent" }}>
          {state}
        </div>
      ))}
      {significanceKeys.map((significance, i) => (
        <Uu5Elements.Grid.Item key={significance} justifySelf="end">
          {hideSignificance ? "" : significance}
        </Uu5Elements.Grid.Item>
      ))}
      <Uu5Elements.Grid
        templateColumns={`repeat(${stateKeys.length}, 1fr)`}
        templateRows={`repeat(${significanceCount}, 1fr)`}
        columnGap={4}
        rowGap={4}
        justifyItems={placeItems}
        alignItems={placeItems}
        className={Config.Css.css({
          gridColumnStart: 2,
          gridColumnEnd: `span ${stateKeys.length}`,
          gridRowStart: 2,
          gridRowEnd: `span ${significanceCount}`,
          width: "100%",
          backgroundColor,
          padding: 4,
        })}
      >
        <BackgroundProvider background={background}>{items}</BackgroundProvider>
      </Uu5Elements.Grid>
    </Uu5Elements.Grid>
  );
}

function ShapeBox({ component: Component, style, data, background, colorScheme, significance, state, ...props }) {
  const properties = `colorScheme="${colorScheme}" significance="${significance}"`;
  const tag = (Component.uu5Tag.match(/\(([^)]+)\)/) || [])[1] || Component.uu5Tag;
  const syntax = `<${tag} ${properties}>
  uu5
</${tag}>`;

  return (
    <Component
      colorScheme={colorScheme}
      significance={significance}
      tooltip={syntax}
      onClick={() => copyToClipboard(properties)}
      disabled={state === "disabled"}
      className={state}
      size="s"
      {...props}
    >
      {props.children || "uu5"}
    </Component>
  );
}

function ColoredGrid({ component, componentProps, shape, data, significanceList, stateMap, columnWidth, placeItems }) {
  const config = Uu5Elements.UuGds.Shape.getValue([shape]);
  const columns = Object.keys(config).map((bg) => {
    return [
      <div key={bg} className={Config.Css.css({ background: "#eee", textAlign: "center", padding: 8 })}>
        <b>{bg}</b>
      </div>,
      ...Object.keys(config[bg]).map((colorScheme) => {
        const mData = data ? data[bg] : null;
        let isValid = isValidProp(component, { background: bg, colorScheme });
        return !isValid ? null : (
          <ColorTable
            key={bg + colorScheme}
            background={bg}
            colorScheme={colorScheme}
            significanceList={significanceList}
            stateMap={stateMap}
            config={config[bg][colorScheme]}
            placeItems={placeItems}
            data={
              mData
                ? {
                    ...(mData.$colorScheme
                      ? JSON.parse(JSON.stringify(mData.$colorScheme).replace("$colorScheme", colorScheme))
                      : null),
                    ...mData[colorScheme],
                  }
                : undefined
            }
          >
            {(props) => <ShapeBox component={component} {...props} {...componentProps} />}
          </ColorTable>
        );
      }),
    ];
  });

  return (
    <Table
      className={Config.Css.css({ padding: 4 })}
      headerRow
      rowGap={16}
      columnGap={8}
      columns={columns}
      columnWidth={columnWidth}
    />
  );
}

export { ColoredGrid };
export default ColoredGrid;
