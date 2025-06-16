//@@viewOn:imports
import createComponent from "../create-component/create-component.js";
import PropTypes from "../prop-types.js";
import Config from "../config/config.js";
import useContent from "../_internal/use-content.js";
//@@viewOff:imports

const Content = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Content",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    nestingLevel: PropTypes.string,
    childrenNestingLevel: PropTypes.string,
    parent: PropTypes.any,
    fallback: PropTypes.any,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    nestingLevel: undefined,
    childrenNestingLevel: undefined,
    parent: undefined,
    fallback: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let content = useContent(props.children, props);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return content;
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { Content };
export default Content;
