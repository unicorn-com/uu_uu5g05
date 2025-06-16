import { Utils, useEffect, useState, Lsi } from "uu5g05";
import Config from "./config/config.js";
import Input from "./input.js";
import Dialog from "./dialog.js";
import importLsi from "./lsi/import-lsi.js";

function addUu5String(data) {
  let result = data;
  if (data) {
    const { uu5Tag, props, children } = data;
    result = {
      uu5Component: data,
      uu5String: Utils.Uu5String.Object.create(uu5Tag, props, { children, isPairedTag: !!children }).toString(),
    };
  }
  return result;
}

function useComponentPaste() {
  const [clipboardData, setClipboardData] = useState();
  const [componentData, setComponentData] = useState(null);
  const [dialogProps, setDialogProps] = useState({
    onClose: () => {},
  });
  const [open, setOpen] = useState(false);

  function handlePaste(e) {
    if (e) {
      const data = Utils.Clipboard.read(e, "uu5Component");

      const clipboardComponentData = {
        text: Utils.Clipboard.read(e, "text"),
        html: Utils.Clipboard.read(e, "html"),
        json: Utils.Clipboard.read(e, "json"),
        image: Utils.Clipboard.read(e, "image"),
        uu5String: Utils.Clipboard.read(e, "uu5String") || Utils.Clipboard.read(e, "uu5string"),
      };

      if (data) {
        e.preventDefault();
        setComponentData(null);

        const clipboardData = data;

        if (clipboardData.length > 1) {
          setClipboardData(clipboardData);
          setDialogProps({
            onClose: () => setClipboardData(null),
            header: <Lsi import={importLsi} path={["useComponentPaste", "pasteAs"]} />,
            actionList: [
              ...(clipboardData
                ? clipboardData.map(({ icon, name, desc, data, significance, colorScheme = "primary" }, i) => {
                    return {
                      icon,
                      colorScheme,
                      significance: significance || (i === 0 ? "highlighted" : "distinct"),
                      children: name,
                      onClick: () => setComponentData({ ...clipboardComponentData, ...addUu5String(data) }),
                      tooltip: desc,
                    };
                  })
                : []),
              {
                children: <Lsi import={importLsi} path={["cancel"]} />,
                onClick: () => setClipboardData(null),
                className: Config.Css.css({ marginTop: 8 }),
              },
            ],
          });
        } else {
          setComponentData({ ...clipboardComponentData, ...addUu5String(clipboardData?.[0]?.data) });
        }
      } else {
        setComponentData(clipboardComponentData);
      }
    } else {
      setDialogProps({
        onClose: () => setOpen(false),
        header: (
          <>
            <Lsi import={importLsi} path={["useComponentPaste", "pasteHere"]} />
            <Input
              type="textarea"
              autoFocus
              width="100%"
              className={Config.Css.css({
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0,
                zIndex: 0,
              })}
            />
          </>
        ),
        actionList: [
          {
            children: <Lsi import={importLsi} path={["cancel"]} />,
            onClick: () => setOpen(false),
            className: Config.Css.css({ zIndex: 1 }),
          },
        ],
      });
      setOpen(true);
    }
  }

  useEffect(() => {
    if (open) {
      const paste = (e) => {
        handlePaste(e);
        setOpen(false);
      };

      Utils.EventManager.register("paste", paste, window);
      return () => Utils.EventManager.unregister("paste", paste, window);
    }
  }, [open]);

  const dialog = <Dialog open={open || !!clipboardData} {...dialogProps} />;

  return {
    data: componentData,
    dialog,
    handlePaste,
  };
}

export { useComponentPaste };
export default useComponentPaste;
