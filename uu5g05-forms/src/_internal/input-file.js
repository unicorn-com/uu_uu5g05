//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils, useRef, useState } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import InputBoxExtension from "./input-box-extension.js";
import FileLink from "./file-link.js";
import importLsi from "../lsi/import-lsi";
//@@viewOff:imports

const INPUT_WIDTH_MAP = {
  xxs: 180,
  xs: 200,
  s: 240,
  m: 240,
  l: 280,
  xl: 280,
};

const { type, ...propTypes } = Uu5Elements.Input.propTypes;
const { type: _type, ...defaultProps } = Uu5Elements.Input.defaultProps;
const DEFAULT_LSI = {
  placeholder: { import: importLsi, path: ["File", "placeholder"] },
  placeholderDnD: { import: importLsi, path: ["File", "placeholderDnD"] },
};

let removeAllFiles = (onChange, value, multiple, inputBoxRef) => {
  return (e) => {
    removeFile(onChange, value, multiple)(e);
    inputBoxRef.current.focus();
  };
};

let removeFile = (onChange, value, multiple, fileToRemove) => {
  return (e) => {
    //e.stopPropagation should be called only when FileLink is on native file input - so when multiple is false
    !multiple && e.stopPropagation();

    let newValue;
    if (Array.isArray(value)) {
      newValue = value.filter((file) => {
        return (
          fileToRemove.name !== file.name ||
          fileToRemove.size !== file.size ||
          fileToRemove.lastModified !== file.lastModified
        );
      });
    }
    if (!newValue || newValue.length === 0) newValue = undefined;
    onChange(new Utils.Event({ value: newValue }, e));
  };
};

function useDnD({ readOnly, onChange }) {
  const [isDragging, setIsDragging] = useState(false);

  let attrs = {};

  if (!readOnly) {
    attrs = {
      onDrop: (e) => {
        onChange(e, e.dataTransfer?.files);
        e.preventDefault();
        setIsDragging(false);
      },
      onDragOver: (e) => {
        // this is necessary for onDrop to work https://stackoverflow.com/questions/50230048/react-ondrop-is-not-firing/50230145
        e.stopPropagation();
        e.preventDefault();
        setIsDragging(true);
      },
      onDragLeave: () => setIsDragging(false),
    };
  }

  return [isDragging, attrs];
}

const FileInput = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "File.Input",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...propTypes,
    value: PropTypes.any,
    accept: PropTypes.string,
    capture: PropTypes.oneOf(["user", "environment"]),
    multiple: PropTypes.bool,
    lsi: PropTypes.object,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...defaultProps,
    iconLeft: "uugds-cloud-upload",
    placeholder: DEFAULT_LSI["placeholder"],
    accept: undefined,
    capture: undefined,
    multiple: false,
    lsi: DEFAULT_LSI,
    width: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      value,
      accept,
      capture,
      multiple,
      id,
      elementAttrs,
      onChange,
      className,
      iconRight,
      iconLeft,
      onIconRightClick,
      onFocus,
      onBlur,
      elementRef,
      placeholder,
      lsi,
      width,
      ...otherProps
    } = props;
    const { readOnly, size } = otherProps;

    let inputRef = useRef();
    let inputBoxRef = useRef();
    let isOpenRef = useRef(false);

    function handleChange(e, files) {
      if (files?.length) {
        let eventData;
        let prevValue;

        if (multiple) {
          let newValue = Array.isArray(value) ? [...value] : [];
          prevValue = Array.isArray(value) ? value : [];
          for (let i = 0; i < files.length; i++) {
            if (
              !prevValue.some((file) => {
                return (
                  files[i].name === file.name &&
                  files[i].size === file.size &&
                  files[i].lastModified === file.lastModified
                );
              })
            ) {
              newValue.push(files[i]);
            }
          }
          eventData = { value: newValue };
        } else {
          eventData = { value: files[0] };
        }
        onChange(new Utils.Event(eventData, e));
        // reset input value so that the same file can be selected again
        e.target.value = "";
      }
    }

    const [isDragging, dndAttrs] = useDnD({ readOnly, onChange: handleChange });

    function openFileSelector() {
      inputRef.current.click();
      isOpenRef.current = true;
    }

    function handleFocus(e) {
      if (!isOpenRef.current && typeof onFocus === "function") onFocus(e);
      isOpenRef.current = false;
    }

    const handleBlur = typeof onBlur === "function" ? (e) => !isOpenRef.current && onBlur(e) : undefined;
    const fullLsi = { ...DEFAULT_LSI, ...lsi };
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const { ref, ...attrs } = Utils.VisualComponent.getAttrs({ ...otherProps, className });
    return (
      //wrapped in div because of withExtensionInput is used and due to flex settings if this component files name when multiple is used are not under the input but next to it
      <div {...attrs} {...dndAttrs}>
        <>
          <InputBoxExtension
            {...otherProps}
            onClick={openFileSelector}
            onEnter={openFileSelector}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={isDragging ? fullLsi["placeholderDnD"] : placeholder}
            iconLeft={value && !multiple ? "uugds-paperclip" : iconLeft}
            iconRight={value && !multiple && !readOnly && !props.required ? "uugds-close" : iconRight}
            onIconRightClick={
              value && !multiple ? removeAllFiles(onChange, value, multiple, inputBoxRef) : onIconRightClick
            }
            elementAttrs={elementAttrs}
            elementRef={Utils.Component.combineRefs(elementRef, inputBoxRef)}
            width={width ?? INPUT_WIDTH_MAP[size]}
          >
            {!multiple && value && <FileLink size={size} file={value} tabIndex={-1} />}
          </InputBoxExtension>
          <input
            {...elementAttrs}
            id={id}
            type="file"
            hidden
            readOnly={readOnly}
            onChange={(e) => handleChange(e, e.target.files)}
            ref={inputRef}
            accept={accept}
            capture={capture}
            multiple={multiple}
            tabIndex={-1}
          />
        </>
        {multiple && value && (
          <div
            className={Config.Css.css({
              marginTop: Uu5Elements.UuGds.getValue(["SpacingPalette", "inline", "d"]), // TODO gds does not specify this, is was 0.4em before
            })}
          >
            {value.map((file) => (
              <FileLink
                key={file.name}
                size={size}
                file={file}
                iconLeft="uugds-paperclip"
                iconRight={readOnly ? undefined : "uugds-close"}
                onIconRightClick={readOnly ? undefined : removeFile(onChange, value, multiple, file)}
              />
            ))}
          </div>
        )}
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { FileInput };
export default FileInput;
