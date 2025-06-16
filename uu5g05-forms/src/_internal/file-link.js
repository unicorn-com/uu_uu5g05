//@@viewOn:imports
import { createComponent, PropTypes, useUserPreferences, Utils } from "uu5g05";
import Uu5Elements, { Button, UuGds } from "uu5g05-elements";
import Config from "../config/config.js";

//@@viewOff:imports

function getSizeValueAndUnit(size) {
  const sizeList = [
    { unit: "B", rounded: null },
    { unit: "kB", rounded: null },
    { unit: "MB", rounded: 1 },
    { unit: "GB", rounded: 1 },
    { unit: "TB", rounded: 1 },
    { unit: "PB", rounded: 1 },
  ];
  let sizeIndex = 0;
  while (sizeIndex < sizeList.length && size > 1024) {
    sizeIndex++;
    size = size / 1024;
  }

  return {
    value: Math.round(size * 10) / 10,
    ...sizeList[sizeIndex],
  };
}

const Css = {
  main: () =>
    Config.Css.css({
      display: "grid",
      justifyContent: "flex-start",
      gridTemplateColumns: "repeat(4, auto)",
      alignItems: "center",
    }),
  link: () =>
    Config.Css.css({
      display: "flex",
      flex: "0 1 auto",
      whiteSpace: "nowrap",
      minWidth: 0,
    }),
  name: () =>
    Config.Css.css({
      overflow: "hidden",
      textOverflow: "ellipsis",
    }),
};

const FileLink = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "FileLink",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    file: PropTypes.object,
    iconLeft: Button.propTypes.icon,
    iconRight: Button.propTypes.iconRight,
    onIconRightClick: PropTypes.func,
    size: PropTypes.string,
    tabIndex: PropTypes.number,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    file: undefined,
    iconLeft: undefined,
    iconRight: undefined,
    onIconRightClick: undefined,
    size: "m",
    tabIndex: 0,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { file, onIconRightClick, iconLeft, iconRight, size, tabIndex } = props;

    const [{ numberGroupingSeparator, numberDecimalSeparator }] = useUserPreferences();

    let sizeAndUnit = getSizeValueAndUnit(file.size);
    const fileSize = Utils.Number.format(sizeAndUnit.value, {
      groupingSeparator: numberGroupingSeparator,
      decimalSeparator: numberDecimalSeparator,
    });
    const sizeText = fileSize + " " + sizeAndUnit.unit;

    let [name, extension] = file.name.split(/\.(?=[^.]+$)/);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <div className={Css.main()}>
        {iconLeft && <Uu5Elements.Icon icon={iconLeft} />}
        <Uu5Elements.Link
          className={Css.link()}
          href={URL.createObjectURL(file)}
          target="_blank"
          onClick={(e) => e.stopPropagation()}
          tooltip={sizeText}
          elementAttrs={{ tabIndex }}
        >
          <span className={Css.name()}>{name + "."}</span>
          {extension}
        </Uu5Elements.Link>
        <Uu5Elements.Text
          className={Config.Css.css({
            marginLeft: UuGds.getValue(["SpacingPalette", "inline", "d"]), // TODO gds does not specify this
          })}
          colorScheme="building"
          significance="subdued"
        >
          {sizeText}
        </Uu5Elements.Text>
        {iconRight && (
          <Uu5Elements.Button significance="subdued" icon={iconRight} onClick={onIconRightClick} size={size} />
        )}
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export default FileLink;
