//@@viewOn:imports
import createComponent from "../create-component/create-component.js";
import PropTypes from "../prop-types.js";
import Config from "../config/config.js";
import StringUtil from "../utils/string.js";
import useLsi from "../hooks/use-lsi.js";
//@@viewOff:imports

// NOTE This is Lsi without support for uu5string, ... (to prevent cyclic imports from Content -> DynamicLibraryComponent -> Lsi).
const Lsi = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Lsi",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    lsi: PropTypes.object,
    params: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
      PropTypes.object,
    ]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    lsi: undefined,
    params: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { lsi, params } = props;
    let value = useLsi(lsi);

    if (params && typeof value === "string") {
      params = Array.isArray(params) ? params : [params];
      value = StringUtil.format(value, ...params);
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return value;
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { Lsi };
export default Lsi;
