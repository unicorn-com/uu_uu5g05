//@@viewOn:imports
import { createVisualComponent, useContentSize, PropTypes, ContentSizeProvider } from "uu5g05";
import { GridTemplate, ScrollableBox } from "uu5g05-elements";
import Config from "../../config/config.js";
import EditModalViewPreview from "./edit-modal-view-preview.js";
//@@viewOff:imports

//@@viewOn:constants
const SMALL_SCREEN = new Set(["xs", "s"]);
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: () => Config.Css.css({ overflow: "hidden" }),
  content: ({ style }) => Config.Css.css({ ...style }),
};
//@@viewOff:css

//@@viewOn:helpers
function withContentSizeProvider(component, wrap = false) {
  if (wrap) return <ContentSizeProvider>{component}</ContentSizeProvider>;
  return component;
}
//@@viewOff:helpers

const EditModalViewContent = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "EditModalViewContent",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    tabList: PropTypes.node,
    tabContent: PropTypes.node,
    preview: EditModalViewPreview.propTypes.preview,
    activeTabKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // string due to tabs for item
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    tabList: undefined,
    tabContent: undefined,
    preview: EditModalViewPreview.defaultProps.preview,
    activeTabKey: 0,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { tabList, tabContent, preview, style, activeTabKey } = props;

    const contentSize = useContentSize();
    //@@viewOff:private

    //@@viewOn:render
    const gridProps = {
      columnGap: 0,
      templateAreas: { xs: "content" },
      templateColumns: { xs: "100%" },
      templateRows: { xs: "minmax(auto, 100%)" },
      contentMap: {
        content: (
          <div className={Config.Css.css({ display: "flex", height: "100%", flexDirection: "column" })}>
            {tabList}
            <ScrollableBox maxHeight="100%" key={activeTabKey}>
              {withContentSizeProvider(<div className={Css.content({ style })}>{tabContent}</div>, preview)}
            </ScrollableBox>
          </div>
        ),
      },
    };

    if (preview) {
      gridProps.templateAreas = {
        xs: "preview, content",
        m: `content ${"preview ".repeat(11)}`,
      };
      gridProps.templateColumns = {
        xs: "100%",
        m: "minmax(380px, 4fr) repeat(7, 1fr)",
        xl: "460px repeat(7, 1fr)",
      };
      gridProps.contentMap.preview = <EditModalViewPreview preview={preview} style={style} />;
      if (!SMALL_SCREEN.has(contentSize)) {
        gridProps.className = Css.main();
        gridProps.contentStyleMap = {
          content: { overflow: "hidden" },
          preview: { overflow: "hidden" },
        };
      }
    }

    return <GridTemplate {...gridProps} />;
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { EditModalViewContent };
export default EditModalViewContent;
//@@viewOff:exports
