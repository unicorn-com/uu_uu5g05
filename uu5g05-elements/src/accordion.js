//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes, useState, useEffect } from "uu5g05";
import UuGds from "./_internal/gds";
import Config from "./config/config.js";
import Panel from "./panel.js";
//@@viewOff:imports

//@@viewOn:constants
let warnedDeprecated;
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: () =>
    Config.Css.css({ display: "flex", flexDirection: "column", gap: UuGds.SpacingPalette.getValue(["fixed", "b"]) }),
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const Accordion = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Accordion",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    itemList: PropTypes.arrayOf(
      PropTypes.shape({
        ...Panel.propTypes,
        initialOpen: PropTypes.bool,
        component: PropTypes.oneOfType([PropTypes.elementType, PropTypes.element]),
      }),
    ),
    itemColorScheme: Panel.propTypes.colorScheme,
    itemSignificance: Panel.propTypes.significance,
    borderRadius: Panel.propTypes.borderRadius,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    itemList: [],
    itemColorScheme: "building",
    itemSignificance: "common",
    borderRadius: "moderate",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { itemList, itemColorScheme, itemSignificance, borderRadius } = props;
    const [selected, setSelected] = useState(() => itemList.findIndex(({ initialOpen }) => initialOpen));

    function handleClick(id) {
      return () => setSelected((prev) => (id === prev ? null : id));
    }
    if (process.env.NODE_ENV !== "production") {
      useEffect(() => {
        if (!warnedDeprecated) {
          warnedDeprecated = true;
          if (props.colorScheme != null) {
            Accordion.logger.warn('Property "colorScheme" is deprecated. Please use the itemColorScheme prop.');
          }
          if (props.significance != null) {
            Accordion.logger.warn('Property "significance" is deprecated. Please use the itemSignificance prop.');
          }
        }
      }, []);
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props, Css.main());

    return (
      <div {...attrs}>
        {itemList.map(({ component: Comp = Panel, key, ...item }, i) => {
          key ??= i;
          const compProps = {
            colorScheme: itemColorScheme ?? props.colorScheme,
            significance: itemSignificance ?? props.significance,
            borderRadius,
            ...item,
            open: selected === i,
            onChange: handleClick(i),
            testId: `panel-${i}`,
          };
          if (Utils.Element.isValid(Comp)) {
            return Utils.Element.clone(Comp, { key, ...compProps });
          } else {
            // eslint-disable-next-line react/jsx-key
            return <Comp key={key} {...compProps} />;
          }
        })}
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Accordion };
export default Accordion;
//@@viewOff:exports
