//@@viewOn:imports
import { createVisualComponent, useLevel, LevelProvider } from "uu5g05";
import Config from "../config/config.js";
import BlockView from "./block-view.js";
import Text from "../text.js";
//@@viewOff:imports

//@@viewOn:css
const Css = {
  header: () => Config.Css.css({ wordBreak: "break-word" }),
};
//@@viewOff:css

const SectionBlock = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SectionBlock",
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
    const { level: propsLevel, header, children, ...blockProps } = props;
    const { card, background } = blockProps;

    let textProps = {};
    if (card !== "full") {
      textProps = {
        background,
        colorScheme: "building",
      };
    }

    const [parentLevel] = useLevel();
    let level = propsLevel || (parentLevel != null ? parentLevel + 1 : 1); // make my level bigger than parent's
    level = Math.min(Math.max(1, level), 5); // ensure that level is between 1 and 5

    return (
      <BlockView
        {...blockProps}
        header={
          header != null && header !== "" ? (
            <Text category="story" segment="heading" type={"h" + level} {...textProps} className={Css.header()}>
              {header}
            </Text>
          ) : (
            header
          )
        }
      >
        {typeof children === "function" ? (
          (...args) => <LevelProvider level={level}>{children(...args)}</LevelProvider>
        ) : (
          <LevelProvider level={level}>{children}</LevelProvider>
        )}
      </BlockView>
    );
    //@@viewOff:render
  },
});

export { SectionBlock };
export default SectionBlock;
