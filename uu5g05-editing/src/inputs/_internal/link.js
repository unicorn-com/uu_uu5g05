//@@viewOn:imports
import { createVisualComponent, PropTypes, Lsi, Utils, useWillMount } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import { useSpacing } from "uu5g05-elements";
import Config from "../../config/config.js";
import importLsi from "../../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
const itemList = [
  { value: undefined, children: <Lsi import={importLsi} path={["FormLink", "target", "auto"]} /> },
  { value: "_self", children: <Lsi import={importLsi} path={["FormLink", "target", "self"]} /> },
  { value: "_blank", children: <Lsi import={importLsi} path={["FormLink", "target", "blank"]} /> },
];
//@@viewOff:constants

//@@viewOn:css
const Css = {
  margin: ({ spacing }) => Config.Css.css({ marginBottom: spacing.d }),
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const Link = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Link",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    value: PropTypes.shape({ href: PropTypes.string, target: PropTypes.oneOf(["_self", "_blank"]) }),
    onChange: PropTypes.func,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    value: {},
    onChange: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { value, onChange, onBlur, autoFocus } = props;
    const { href, target, label } = value;

    const displayLabel = Object.keys(value).includes("label");
    const spacing = useSpacing();

    function handleChange(e, type) {
      if (typeof onChange === "function") {
        onChange(new Utils.Event({ value: { ...value, [type]: e.data.value } }));
      }
    }

    if (process.env.NODE_ENV !== "production") {
      useWillMount(() => {
        Utils.LoggerFactory.get(Config.TAG + "FormLink").error(
          `WARNING: This component is deprecated. It is recommended to use components from Uu5Editing instead. (https://uuapp.plus4u.net/uu-bookkit-maing01/5ee03d6a2be14b9f8d6e138b3ed3d250)`,
        );
      });
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <div>
        <Uu5Forms.Link
          value={href}
          onChange={(e) => handleChange(e, "href")}
          onBlur={(e) => {
            if (typeof onBlur === "function") onBlur(e);
            if (href && !href.startsWith("http")) {
              onChange(new Utils.Event({ value: { ...value, href: "http://" + href } }));
            }
          }}
          label={<Lsi import={importLsi} path={["FormLink", "href", "label"]} />}
          className={Css.margin({ spacing })}
          autoFocus={autoFocus}
        />
        {displayLabel && (
          <Uu5Forms.Text
            value={label}
            onChange={(e) => handleChange(e, "label")}
            label={<Lsi import={importLsi} path={["FormLink", "labelLink", "label"]} />}
            className={Css.margin({ spacing })}
          />
        )}
        <Uu5Forms.SwitchSelect
          value={target}
          onChange={(e) => handleChange(e, "target")}
          itemList={itemList}
          label={<Lsi import={importLsi} path={["FormLink", "target", "label"]} />}
        />
      </div>
    );
    //@@viewOff:render
  },
});

export { Link };
export default Link;
