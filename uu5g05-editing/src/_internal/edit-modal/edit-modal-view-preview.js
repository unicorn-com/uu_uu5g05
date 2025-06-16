//@@viewOn:imports
import { createVisualComponent, Lsi, PropTypes, useBackground, useContentSize, Utils } from "uu5g05";
import { ScrollableBox, Text, UuGds } from "uu5g05-elements";
import { useFormApi } from "uu5g05-forms";
import Config from "../../config/config.js";

import importLsi from "../../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
const SMALL_SCREEN = new Set(["xs", "s"]);
//@@viewOff:constants

//@@viewOn:css
const Css = {
  preview: ({ background, separator }) => {
    let border;

    if (separator) {
      const lineStyles = UuGds.Shape.getValue(["line", background, "building", "subdued"]).default;
      border = {
        borderLeftWidth: lineStyles?.border?.width,
        borderLeftStyle: lineStyles?.border?.style,
        borderLeftColor: lineStyles?.colors?.border,
      };
    }

    return Config.Css.css({
      ...border,
      overflow: "hidden",
      height: "100%",
    });
  },
  content: ({ style }) =>
    Config.Css.css({
      ...style,
      height: "100%",
      display: "flex",
      flexDirection: "column",
      gap: UuGds.SpacingPalette.getValue(["fixed", "g"]),
    }),
  previewContainer: () => Config.Css.css({ height: "100%" }),
  title: () =>
    Config.Css.css({
      textTransform: "upperCase",
    }),
};
//@@viewOff:css

const EditModalViewPreview = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "EditModalViewPreview",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    preview: PropTypes.oneOfType([PropTypes.element, PropTypes.elementType]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    preview: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { preview, style } = props;

    const { value } = useFormApi();

    const contentSize = useContentSize();
    const background = useBackground();

    function getPreview() {
      let result;
      let previewProps = { props: value };
      if (Utils.Element.isValid(preview)) {
        // jsx
        result = Utils.Element.clone(preview, previewProps);
      } else {
        let Component = preview;
        result = <Component {...previewProps} />;
      }

      return result;
    }
    //@@viewOff:private

    //@@viewOn:render
    return (
      <div className={Css.preview({ style, background, separator: !SMALL_SCREEN.has(contentSize) })}>
        <ScrollableBox height="100%" maxHeight="100%">
          <div className={Css.content({ style })}>
            <Text className={Css.title()} significance="subdued" category="interface" segment="highlight" type="minor">
              <Lsi import={importLsi} path={["EditModal", "preview"]} />
            </Text>
            <div className={Css.previewContainer()}>{getPreview()}</div>
          </div>
        </ScrollableBox>
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { EditModalViewPreview };
export default EditModalViewPreview;
//@@viewOff:exports
