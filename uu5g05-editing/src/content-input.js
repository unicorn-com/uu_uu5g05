//@@viewOn:imports
import { createVisualComponent, PropTypes, useState, useRef, useEffect } from "uu5g05";
import { Button, Dropdown } from "uu5g05-elements";
import { useToolbarContext } from "./toolbar-context";
import Config from "./config/config.js";
//@@viewOff:imports

const Css = {
  main() {
    return Config.Css.css({
      width: "100%",
      fontSize: "inherit",
      lineHeight: "inherit",
      margin: 0,
      padding: 0,
      minHeight: "1em",
      height: "auto",
      fontWeight: "inherit",
      color: "inherit",
      outline: "none",
      backgroundColor: "transparent",
      border: "solid 0px transparent",
      textAlign: "inherit",
    });
  },
};

//@@viewOn:helpers
//@@viewOff:helpers
const ContentInput = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ContentInput",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    value: PropTypes.string,
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
    placeholder: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    readOnly: PropTypes.bool,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    value: "",
    toolbarItems: [],
    placeholder: undefined,
    readOnly: false,
    onBlur: undefined,
    onChange: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children, toolbarItems, placeholder } = props;
    const [value, setValue] = useState(props.value);
    const [readOnly, setReadOnly] = useState(props.readOnly);
    const [active, setActive] = useState(false);
    const inputRef = useRef();
    const { open, close } = useToolbarContext();

    useEffect(() => {
      return () => {
        if (active) close();
      };
    }, []);

    useEffect(() => {
      if (!readOnly) inputRef.current.focus();
    }, [readOnly]);

    useEffect(() => {
      if (inputRef.current) inputRef.current.setReadOnly = setReadOnly;
    }, [inputRef]);

    const _onChange = (opt) => {
      setValue(opt.target.value);
      if (typeof props.onChange === "function") {
        props.onChange(opt.target.value);
      }
    };

    const _onFocus = () => {
      setActive((prev) => !prev);
      open && toolbarItems.length && open(toolbarItems, inputRef.current);
    };

    const _onBlur = (opt) => {
      if (readOnly) return;

      setActive((prev) => !prev);
      close && close();

      if (typeof props.onBlur === "function") {
        props.onBlur(opt);
      }
    };

    const _getProps = () => {
      return {
        onChange: _onChange,
        onFocus: _onFocus,
        onBlur: _onBlur,
        ref: (r) => (inputRef.current = r),
        value: value,
        readOnly: readOnly,
        className: Css.main(),
      };
    };
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return children({
      children: <input {..._getProps()} placeholder={placeholder} />,
    });
    //@@viewOff:render
  },
});

export { ContentInput };
export default ContentInput;
