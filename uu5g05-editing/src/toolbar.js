//@@viewOn:imports
import { createComponent, PropTypes, Utils, useRef, useState, useEffect, useElementSize } from "uu5g05";
import { Popover, ActionGroup, Button, Dropdown } from "uu5g05-elements";
import { ToolbarContext } from "./toolbar-context.js";
import Config from "./config/config.js";
//@@viewOff:imports

const Css = {
  popoverContentWrapper(width) {
    return Config.Css.css({
      width: width,
      display: "flex",
      justifyContent: "space-between",
      padding: 8,
    });
  },
};

//@@viewOn:helpers
const getEventPath = (e) => {
  let path = [];
  let node = e.target;
  while (node != document.body && node != document.documentElement && node) {
    path.push(node);
    node = node.parentNode;
  }
  return path;
};
//@@viewOff:helpers

const Toolbar = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Toolbar",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    toolbarItems: PropTypes.arrayOf(
      PropTypes.shape({
        ...Button.propTypes,
        ...Dropdown.propTypes,
        component: PropTypes.component,
        collapsed: PropTypes.bool,
        collapsedIcon: PropTypes.icon,
        collapsedChildren: PropTypes.node,
        order: PropTypes.number,
      }),
    ),
    childProps: PropTypes.object,
    editModalOpen: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    toolbarItems: [],
    childProps: {},
    editModalOpen: false,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children, editModalOpen, onClose } = props;
    const [toolbarItems, setToolbarItems] = useState(props.toolbarItems);
    const activeInputRef = useRef();
    const componentWrapperRef = useRef();
    let { ref, width } = useElementSize();

    useEffect(() => {
      window.addEventListener("mousedown", _handleMouseDown, true);
      return () => window.removeEventListener("mousedown", _handleMouseDown, true);
    }, []);

    const _isBlur = (e) => {
      let result = true;
      let eventPath = getEventPath(e);

      eventPath.every((item) => {
        if (item === componentWrapperRef.current) {
          result = false;
          return false;
        }
        return true;
      });

      return result;
    };

    const _handleMouseDown = (e) => {
      let isBlur = _isBlur(e);

      if (isBlur) {
        _lockInput();
      } else {
        _unlockInput();
      }
    };

    const _lockInput = () => {
      activeInputRef.current && activeInputRef.current.setReadOnly(true);
    };

    const _unlockInput = () => {
      activeInputRef.current && activeInputRef.current.setReadOnly(false);
    };

    const _addToolbarItems = (dynamicContent) => {
      const newItems = dynamicContent.map((item) => {
        if (!item.itemList) return item;
        const itemList = item.itemList.map((itemProps) => {
          const origOnApply = itemProps.onClick;
          return {
            ...itemProps,
            onClick: (...args) => {
              let result = origOnApply(...args);
              Promise.resolve()
                .then(() => result)
                .then(() => _unlockInput());
            },
          };
        });
        return { ...item, itemList };
      });
      setToolbarItems(props.toolbarItems.concat(newItems));
    };

    const _handleOpen = (dynamicContent, newActiveInput) => {
      _addToolbarItems(dynamicContent);
      activeInputRef.current = newActiveInput;
    };

    const _handleClose = () => {
      setToolbarItems(props.toolbarItems);
      activeInputRef.current = undefined;
    };
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <ToolbarContext.Provider
        value={{
          open: _handleOpen,
          close: _handleClose,
        }}
      >
        <div ref={Utils.Component.combineRefs(componentWrapperRef, ref)}>
          {children}
          {!editModalOpen && (
            <Popover element={componentWrapperRef.current} preferredPosition="top-right">
              <div className={Css.popoverContentWrapper(width)}>
                <ActionGroup style={{ flexGrow: 0 }} itemList={toolbarItems} />
                <Button onClick={onClose}>Stop editing</Button>
              </div>
            </Popover>
          )}
        </div>
      </ToolbarContext.Provider>
    );
    //@@viewOff:render
  },
});

export { Toolbar };
export default Toolbar;
