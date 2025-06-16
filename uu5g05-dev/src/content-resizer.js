//@@viewOn:imports
import {
  createComponent,
  Utils,
  ContentSizeProvider,
  useState,
  useCallback,
  useContentSize,
  useScreenSize,
} from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
//@@viewOff:imports

//@@viewOn:helpers
const BOX_WIDTH = 16;

function ContentSizeValue() {
  return useContentSize();
}

//@@viewOff:helpers

const ContentResizer = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ContentResizer",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children } = props;

    const [width, setWidth] = useState();
    const [screenSize] = useScreenSize();

    const drag = useCallback(
      (e) => {
        setWidth(e.pageX - (BOX_WIDTH * 3) / 2);
      },
      [setWidth],
    );
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(
      props,
      Config.Css.css({ width, paddingRight: (BOX_WIDTH * 3) / 2, position: "relative" }),
    );

    return screenSize === "xs" ? (
      children
    ) : (
      <div {...attrs}>
        <ContentSizeProvider>
          {children}

          <Uu5Elements.Box
            shape="background"
            significance="distinct"
            borderRadius="full"
            className={Config.Css.css({
              position: "absolute",
              zIndex: 10,
              top: 0,
              right: 0,
              cursor: "col-resize",
              width: BOX_WIDTH,
              height: "100%",
              display: "flex",
              justifyContent: "center",
              userSelect: "none",
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
            })}
            elementAttrs={{
              onMouseDown: () => {
                Utils.EventManager.register("mousemove", drag, document);
                const mouseUp = () => {
                  Utils.EventManager.unregister("mousemove", drag, document);
                  Utils.EventManager.unregister("mouseup", mouseUp, document);
                };
                Utils.EventManager.register("mouseup", mouseUp, document);
              },
            }}
          >
            <Uu5Elements.Text
              colorScheme="building"
              category="interface"
              segment="content"
              type="medium"
              className={Config.Css.css({ position: "sticky", top: 48, alignSelf: "start" })}
            >
              <ContentSizeValue />
            </Uu5Elements.Text>
            <Uu5Elements.Icon
              icon="uugds-drag-vertical"
              className={Config.Css.css({ position: "absolute", top: "50%" })}
            />
          </Uu5Elements.Box>
        </ContentSizeProvider>
      </div>
    );
    //@@viewOff:render
  },
});

export { ContentResizer };
export default ContentResizer;
