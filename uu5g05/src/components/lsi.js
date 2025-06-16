//@@viewOn:imports
import createComponent from "../create-component/create-component.js";
import PropTypes from "../prop-types.js";
import Config from "../config/config.js";
import StringUtil from "../utils/string.js";
import Content from "./content.js";
import useLsi from "../hooks/use-lsi.js";
//@@viewOff:imports

const Lsi = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Lsi",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    lsi: PropTypes.lsi,
    params: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool, PropTypes.element])),
      PropTypes.object,
    ]),
    import: PropTypes.func,
    path: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    lsi: undefined,
    params: undefined,
    import: undefined,
    path: [],
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { lsi, params, path, import: importFn, children } = props;
    let value = useLsi(lsi?.import ? lsi.import : importFn || lsi, lsi?.path || path);
    params = lsi?.params || params;

    if (params && typeof value === "string") {
      params = Array.isArray(params) ? params : [params];
      value = StringUtil.format(value, ...params);
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return typeof children === "function" ? (
      children({ value })
    ) : (
      <Content nestingLevel={props.nestingLevel}>{value}</Content>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { Lsi };
export default Lsi;
