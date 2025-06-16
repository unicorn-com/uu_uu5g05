//@@viewOn:imports
import { createVisualComponent, PropTypes } from "uu5g05";
import Config from "./config/config.js";
import BlockView from "./_internal/block-view.js";
import SectionBlock from "./_internal/section-block.js";
import TitleBlock from "./_internal/title-block.js";
//@@viewOff:imports

//@@viewOn:css
const Css = {
  header: () => Config.Css.css({ wordBreak: "break-word" }),
};
//@@viewOff:css

const Block = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Block",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...BlockView.propTypes,
    headerType: PropTypes.oneOf(["title", "heading"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...BlockView.defaultProps,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { headerType, headerSeparatorColorScheme, borderRadius, ...blockProps } = props;
    const { card, headerSeparator } = blockProps;

    let Component;
    let componentProps = {};

    switch (headerType) {
      case "heading":
        Component = SectionBlock;
        componentProps = {
          headerSeparatorColorScheme: card === "none" && headerSeparator ? headerSeparatorColorScheme : undefined,
        };
        break;
      case "title":
        Component = TitleBlock;
        break;
      default: {
        Component = BlockView;
        const { header } = blockProps;
        componentProps = {
          header: header != null && header !== "" ? <span className={Css.header()}>{header}</span> : header,
        };
      }
    }

    return (
      <Component
        {...blockProps}
        {...componentProps}
        borderRadius={borderRadius === "full" ? undefined : borderRadius}
      />
    );
    //@@viewOff:render
  },
});

Block.View = BlockView;

export { Block };
export default Block;
