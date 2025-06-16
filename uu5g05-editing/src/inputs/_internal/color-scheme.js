//@@viewOn:imports
import { createVisualComponent, PropTypes, Lsi, useBackground, useWillMount, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Config from "../../config/config";
import importLsi from "../../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
const COLOR_SCHEME = PropTypes.COLOR_SCHEME;
const SORTED_VALUES = ["meaning", "state", "priority", "basic"];
//@@viewOff:constants

//@@viewOn:css
const Css = {
  colorBox: (styles) =>
    Config.Css.css({
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: Uu5Elements.UuGds.SizingPalette.getValue(["inline", "emphasized"]),
      aspectRatio: 1,
      borderRadius: Uu5Elements.UuGds.getValue(["RadiusPalette", "box", "elementary"]),
      ...styles,
    }),
  text: () =>
    Config.Css.css({
      marginLeft: Uu5Elements.UuGds.SpacingPalette.getValue(["inline", "e"]),
    }),
};
//@@viewOff:css

//@@viewOn:helpers
function getChildrenOfItemList(
  { componentShape, componentSignificance = "common", defaultColorScheme },
  colorList,
  background,
) {
  const adjustedItemList = colorList.map((item) => {
    if (item.heading) return item;

    const colorScheme = item.name;
    const states = Uu5Elements.UuGds.Shape.getValue([componentShape, background, colorScheme, componentSignificance]);
    const styles = Uu5Elements.UuGds.Shape.getStateStyles(states.default, true);
    const complement =
      defaultColorScheme === colorScheme ? <Lsi import={importLsi} path={["FormColorScheme", "default"]} /> : null;

    return {
      value: colorScheme,
      children: (
        <>
          <div className={Css.colorBox(styles)}>
            <Uu5Elements.Text category="interface" segment="content" type="xsmall" bold>
              A
            </Uu5Elements.Text>
          </div>
          <Uu5Elements.Text className={Css.text()}>
            {colorScheme.charAt(0).toUpperCase() + colorScheme.slice(1)}{" "}
            {complement && (
              <Uu5Elements.Badge size="m" colorScheme="neutral" significance="common">
                {complement}
              </Uu5Elements.Badge>
            )}
          </Uu5Elements.Text>
        </>
      ),
    };
  });

  return adjustedItemList;
}

function getItemList(props, background) {
  let valueList = props.valueList;
  const sortedPalette = SORTED_VALUES.filter((v) => valueList.includes(v));

  let paletteMap = {};
  sortedPalette.forEach((palette) => {
    paletteMap[palette] = COLOR_SCHEME[palette].map((color) => ({ name: color }));
  });

  let colorList = [];
  if (valueList.includes("building")) {
    colorList = [{ name: "building" }];
  }
  for (let palette in paletteMap) {
    colorList = [...colorList, { children: palette, heading: true, value: palette }, ...paletteMap[palette]];
  }

  let itemList = getChildrenOfItemList(props, colorList, background);
  if (props.defaultColorScheme === undefined) {
    itemList = [{ value: undefined }, ...itemList]; // undefined due to deselect
  }

  return itemList;
}

const { itemList: _1, ...filteredSelectPropTypes } = Uu5Forms.Select.propTypes;
const { itemList: _1dp, ...filteredSelectDefaultProps } = Uu5Forms.Select.defaultProps;
//@@viewOff:helpers

const ColorScheme = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ColorScheme",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...filteredSelectPropTypes,
    valueList: PropTypes.arrayOf(PropTypes.string),
    componentShape: PropTypes.string,
    defaultColorScheme: PropTypes.string,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...filteredSelectDefaultProps,
    label: <Lsi import={importLsi} path={["FormColorScheme", "label"]} />,
    valueList: ["building", "meaning", "state", "priority", "basic"],
    componentShape: "interactiveElement",
    defaultColorScheme: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { valueList, ...otherProps } = props;
    const background = useBackground();
    const itemList = valueList.length ? getItemList(props, background) : [];

    if (process.env.NODE_ENV !== "production") {
      useWillMount(() => {
        Utils.LoggerFactory.get(Config.TAG + "FormColorScheme").error(
          `WARNING: This component is deprecated. It is recommended to use components from Uu5Editing instead. (https://uuapp.plus4u.net/uu-bookkit-maing01/5ee03d6a2be14b9f8d6e138b3ed3d250)`,
        );
      });
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return <Uu5Forms.Select {...otherProps} itemList={itemList} disableOptionReorder />;
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { ColorScheme };
export default ColorScheme;
//@@viewOff:exports
