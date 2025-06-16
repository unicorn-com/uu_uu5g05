import createComponent from "../create-component/create-component.js";
import { useLayoutEffect, useMemo } from "../hooks/react-hooks.js";
import { useParentSize } from "../_internal/use-parent-size.js";
import PropTypes from "../prop-types.js";
import Config from "../config/config.js";
import { ContentSizeContext } from "../contexts/content-size-context.js";
import useValueChange from "../hooks/use-value-change.js";
import ScreenSize from "../utils/screen-size";

const ContentSizeProvider = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ContentSizeProvider",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    contentSize: PropTypes.oneOf(Object.keys(ScreenSize._SIZE_MAP)),
    onChange: PropTypes.func,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    contentSize: undefined,
    onChange: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children } = props;

    const onChange = typeof props.onChange === "function" ? (contentSize) => props.onChange({ contentSize }) : null;
    const [contentSize, setContentSize] = useValueChange(props.contentSize, onChange);
    const { Resizer, width } = useParentSize();

    useLayoutEffect(() => {
      const newContentSize = width != null ? ScreenSize.countSize(width) : null;
      if (newContentSize != null && newContentSize !== contentSize) setContentSize(newContentSize);
    }, [contentSize, setContentSize, width]);

    const value = useMemo(() => ({ contentSize }), [contentSize]);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <>
        <Resizer />
        {contentSize != null ? (
          <ContentSizeContext.Provider value={value}>
            {typeof children === "function" ? children(value) : children}
          </ContentSizeContext.Provider>
        ) : null}
      </>
    );
    //@@viewOff:render
  },
});

export { ContentSizeProvider };
export default ContentSizeProvider;
