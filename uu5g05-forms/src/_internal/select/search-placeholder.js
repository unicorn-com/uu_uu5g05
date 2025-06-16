//@@viewOn:imports
import { createVisualComponent, Utils, Lsi, PropTypes } from "uu5g05";
import { Icon, UuGds } from "uu5g05-elements";
import Config from "../../config/config.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: ({ isNoResults }) =>
    Config.Css.css({
      display: "flex",
      alignItems: "center",
      textAlign: isNoResults && "center",
      flexGrow: isNoResults && 1,
      justifyContent: isNoResults && "center",
      gap: UuGds.SpacingPalette.getValue(["fixed", "b"]),
    }),
  icon: () =>
    Config.Css.css({
      fontSize: "1.4em",
    }),
};
//@@viewOff:css

const SearchPlaceholder = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SearchPlaceholder",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    lsi: PropTypes.lsi,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const isNoResults = props.lsi.path.includes("noResults");
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    let attrs = Utils.VisualComponent.getAttrs(props, Css.main({ isNoResults }));

    return (
      <div {...attrs}>
        {!isNoResults && <Icon icon="uugds-search" className={Css.icon()} />}
        <Lsi lsi={props.lsi} />
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { SearchPlaceholder };
export default SearchPlaceholder;
//@@viewOff:exports
