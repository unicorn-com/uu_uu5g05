//@@viewOn:imports
import { createComponent } from "uu5g05";
import Config from "../../config/config.js";
import { getFlattenList, isMultilevel } from "./multi-level-tools.js";
//@@viewOff:imports

//@@viewOn:helpers
//@@viewOff:helpers

function withFlattenedList(Input) {
  return createComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + `withFlattenedList(${Input.uu5Tag})`,
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: Input.propTypes,
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: Input.defaultProps,
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const { itemList: itemListProp, ...otherProps } = props;

      const multilevel = isMultilevel(itemListProp);
      const itemList = multilevel ? getFlattenList(itemListProp) : itemListProp;
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      return <Input {...otherProps} itemList={itemList} multilevel={multilevel} />;
      //@@viewOff:render
    },
  });
}

//@@viewOn:exports
export { withFlattenedList };
export default withFlattenedList;
//@@viewOff:exports
