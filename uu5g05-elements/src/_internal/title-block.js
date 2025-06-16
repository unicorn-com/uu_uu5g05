//@@viewOn:imports
import { createVisualComponent, useEffect } from "uu5g05";
import Config from "../config/config.js";
import BlockView from "./block-view.js";
import Text from "../text.js";
import UuGds from "./gds.js";
//@@viewOff:imports

const TYPES = Object.keys(UuGds.getValue(["Typography", "interface", "title"]));

//@@viewOn:css
const Css = {
  header: () => Config.Css.css({ wordBreak: "break-word" }),
};
//@@viewOff:css

const TitleBlock = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TitleBlock",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...BlockView.propTypes,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...BlockView.defaultProps,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { level = 3, header, ...blockProps } = props;
    const { card, background } = blockProps;

    if (process.env.NODE_ENV !== "production") {
      useEffect(() => {
        if (props.level != null) {
          TitleBlock.logger.warn(
            'Property "level" is deprecated. Block in headerType="title" has fixed size of the header.',
          );
        }
      }, []);
    }

    let textProps = {};
    if (card !== "full") {
      textProps = {
        background,
        colorScheme: "building",
      };
    }

    return (
      <BlockView
        {...blockProps}
        header={
          header != null && header !== "" ? (
            <Text category="interface" segment="title" type={TYPES[level - 1]} {...textProps} className={Css.header()}>
              {header}
            </Text>
          ) : (
            header
          )
        }
      />
    );
    //@@viewOff:render
  },
});

export { TitleBlock };
export default TitleBlock;
