//@@viewOn:imports
import { createVisualComponent, PropTypes, Lsi } from "uu5g05";
import { Button, UuGds } from "uu5g05-elements";
import Config from "../../config/config.js";
import importLsi from "../../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:css
const Css = {
  main: () =>
    Config.Css.css({
      padding: `${UuGds.SpacingPalette.getValue(["fixed", "d"])}px 0`,
      display: "flex",
      flex: 0,
      justifyContent: "center",
      gap: UuGds.SpacingPalette.getValue(["fixed", "d"]),
      marginTop: "auto",
    }),
  button: () =>
    Config.Css.css({
      flex: 1,
    }),
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const InputSelectControls = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputSelectControls",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    onSubmit: PropTypes.func,
    onReset: PropTypes.func,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    onSubmit: undefined,
    onReset: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { onSubmit, onReset } = props;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <div className={Css.main()}>
        {typeof onReset === "function" && (
          <Button onClick={onReset} className={Css.button()}>
            <Lsi import={importLsi} path={["clear"]} />
          </Button>
        )}
        {typeof onSubmit === "function" && (
          <Button onClick={onSubmit} className={Css.button()} colorScheme="primary" significance="highlighted">
            <Lsi import={importLsi} path={["apply"]} />
          </Button>
        )}
      </div>
    );
    //@@viewOff:render
  },
});

export default InputSelectControls;
