//@@viewOn:imports
import { createVisualComponent, useContentSize, usePreviousValue, useState, PropTypes, Utils } from "uu5g05";
import Config from "./config/config.js";
import Drawer from "./drawer";
import SideDetailLayoutProvider from "./side-detail-layout-provider";
import SideDetailLayoutDetail from "./side-detail-layout-detail";

//@@viewOff:imports

function buildChildren(children, propsToPass) {
  let childrenToRender = children;
  if (typeof children === "function") {
    childrenToRender = children(propsToPass);
  } else if (Utils.Element.isValid(children)) {
    childrenToRender = Utils.Element.clone(children, propsToPass);
  }
  return childrenToRender;
}

const SideDetailLayout = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SideDetailLayout",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...SideDetailLayoutProvider.propTypes,
    detail: PropTypes.oneOfType([PropTypes.func, PropTypes.element]).isRequired,
    initialData: PropTypes.object,
    onlyModal: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...SideDetailLayoutProvider.defaultProps,
    onlyModal: false,
  },
  //@@viewOff:defaultProps

  render(props) {
    const {
      children,
      detail,
      initialDetailData = null,
      initialData = initialDetailData,
      onlyModal,
      ...restProps
    } = props;

    const [detailData, setDetailData] = useState(initialData);
    const prevDetail = usePreviousValue(detailData, detailData);

    const contentSize = useContentSize();

    const openDetail = setDetailData;
    const closeDetail = () => setDetailData(null);

    const childrenApi = {
      detailData,
      onDetailOpen: openDetail,
      // @deprecated
      openDetail(...args) {
        SideDetailLayout.logger.warn(
          "Parameter 'openDetail' in children() in a component '" +
            SideDetailLayout.uu5Tag +
            "' is deprecated, use 'onDetailOpen' instead.",
        );
        return openDetail(...args);
      },
    };

    let childrenToRender = buildChildren(children, childrenApi);

    const { componentProps, elementAttrs } = Utils.VisualComponent.splitProps(restProps);
    const { ...restElementAttrs } = elementAttrs;
    delete restElementAttrs["data-name"];
    if (Object.values(restElementAttrs).find((v) => v !== undefined)) {
      childrenToRender = <div {...elementAttrs}>{childrenToRender}</div>;
    }

    const detailApi = {
      data: detailData || prevDetail,
      onClose: closeDetail,
      // @deprecated
      detailData,
      // @deprecated
      closeDetail(...args) {
        SideDetailLayout.logger.warn(
          "Parameter 'closeDetail' in detail() in a component '" +
            SideDetailLayout.uu5Tag +
            "' is deprecated, use 'onClose' instead.",
        );
        return closeDetail(...args);
      },
    };

    //@@viewOn:render
    let result;
    if (onlyModal || ["xs", "s"].includes(contentSize)) {
      result = (
        <>
          {childrenToRender}
          {detailApi.data
            ? buildChildren(detail, {
                ...detailApi,
                displayAsModal: true,
                open: !!detailData,
                // @deprecated
                type: "modal",
              })
            : null}
        </>
      );
    } else {
      result = (
        <Drawer
          height="100%"
          {...componentProps}
          open={!!detailData}
          onClose={closeDetail}
          content={({ open, type }) =>
            open
              ? buildChildren(detail, {
                  ...detailApi,
                  displayAsModal: false,
                  open,
                  // @deprecated
                  type,
                })
              : undefined
          }
        >
          {childrenToRender}
        </Drawer>
      );
    }

    return result;
    //@@viewOff:render
  },
});

SideDetailLayout.Provider = SideDetailLayoutProvider;
SideDetailLayout.Detail = SideDetailLayoutDetail;

//@@viewOn:exports
export { SideDetailLayout };
export default SideDetailLayout;
//@@viewOff:exports
