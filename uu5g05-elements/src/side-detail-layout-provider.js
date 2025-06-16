//@@viewOn:imports
import { createVisualComponent, useRef, useMemo, useState, PropTypes } from "uu5g05";
import Config from "./config/config.js";
import Drawer from "./drawer";
import SideDetailLayoutContext from "./_internal/side-detail-layout-context";
//@@viewOff:imports

const { open, onClose, content, ...restPropTypes } = Drawer.propTypes;
const { open: _, onClose: __, content: ___, ...restDefaultProps } = Drawer.defaultProps;

const SideDetailLayoutProvider = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SideDetailLayout.Provider",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...restPropTypes,
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]).isRequired,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    position: "right",
    width: "50%",
  },
  //@@viewOff:defaultProps

  render(props) {
    const { children, ...restProps } = props;

    const [open, setOpen] = useState(false);
    const ref = useRef();
    const closeRef = useRef();

    function register(id, onClose) {
      if (closeRef.current) {
        closeRef.current.close();
        closeRef.current = null;
      }
      closeRef.current = { id, close: onClose };
      setOpen(true);
    }

    function unregister(id) {
      let wait;
      if (!closeRef.current || closeRef.current.id === id) {
        closeRef.current = null;
        setOpen(false);
        wait = true;
      }
      return wait;
    }

    const api = useMemo(
      () => ({
        register,
        unregister,
        sideRef: ref,
      }),
      [],
    );

    //@@viewOn:render
    return (
      <Drawer
        {...restProps}
        open={open}
        onClose={() => setOpen(false)}
        content={() => <div ref={ref} className={Config.Css.css({ height: "100%" })} />}
      >
        <SideDetailLayoutContext.Provider value={api}>
          {typeof children === "function" ? children({ ...api, open }) : children}
        </SideDetailLayoutContext.Provider>
      </Drawer>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { SideDetailLayoutProvider };
export default SideDetailLayoutProvider;
//@@viewOff:exports
