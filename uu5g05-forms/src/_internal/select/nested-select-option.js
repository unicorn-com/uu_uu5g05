//@@viewOn:imports
import { createVisualComponent, PropTypes } from "uu5g05";
import { Breadcrumbs } from "uu5g05-elements";
import Config from "../../config/config.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: () =>
    Config.Css.css({
      flexGrow: 1,
    }),
  breadcrumbs: () =>
    Config.Css.css({
      fontSize: "0.6em",
    }),
};
//@@viewOff:css

//@@viewOn:helpers
function fillItemList(itemList = [], parent = {}) {
  if (parent.value) itemList.push({ children: parent.children });
  if (parent.parent) fillItemList(itemList, parent.parent);
}
//@@viewOff:helpers

const NestedSelectOption = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "NestedSelectOption",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    parentPath: PropTypes.object,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    parentPath: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children, path } = props;
    //@@viewOff:private
    let itemList = [];
    fillItemList(itemList, path);
    itemList.reverse();
    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <div className={Css.main()}>
        {itemList.length ? <Breadcrumbs className={Css.breadcrumbs()} itemList={itemList} /> : null}
        {children}
      </div>
    );
    //@@viewOff:render
  },
});

export { NestedSelectOption };
export default NestedSelectOption;
