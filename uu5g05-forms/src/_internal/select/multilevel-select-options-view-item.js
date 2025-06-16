//@@viewOn:imports
import { createVisualComponent, PropTypes } from "uu5g05";
import { Badge } from "uu5g05-elements";
import Config from "../../config/config.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: () =>
    Config.Css.css({
      width: "100%",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }),
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const MultilevelSelectOptionsViewItem = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "MultilevelSelectOptionsViewItem",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    itemsCount: PropTypes.number,
    colorScheme: PropTypes.colorScheme,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    itemsCount: 0,
    colorScheme: "primary",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { itemsCount, colorScheme, children } = props;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <div className={Css.main()}>
        {children}
        {itemsCount ? (
          <Badge colorScheme={colorScheme} significance="common" size="m">
            {itemsCount}
          </Badge>
        ) : null}
      </div>
    );
    //@@viewOff:render
  },
});

export { MultilevelSelectOptionsViewItem };
export default MultilevelSelectOptionsViewItem;
