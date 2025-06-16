//@@viewOn:imports
import { createComponent, Utils, withLazy } from "uu5g05";
import Uu5Elements from "uu5g05-elements";

// import editing and forms libraries using lazy loading to allow to use them in edit mode component
// this function directly returns an import of editable component "block-editable.js" that we will create in the next step
const ComponentEditable = withLazy(async () => {
  await Promise.all([
    Utils.Uu5Loader.import("uu5g05-editing"), // includes components essential for edit mode
    Utils.Uu5Loader.import("uu5g05-forms"), // includes inputs that we will use later when we need to define our inputs for editing custom props
  ]);

  return import("./block-editable.js");
});
//@@viewOff:imports

const ITEM_DEFAULT_PROPS = { icon: "uugds-react" };

const Block = createComponent({
  //@@viewOn:statics
  uu5Tag: "Block",
  nestingLevel: ["areaCollection", "area"],
  editMode: {
    customEdit: true,
    startMode: "button",
  },
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    colorScheme: "building",
    significance: "common",
    footer: undefined,
    footerSeparator: false,
    header: undefined,
    headerSeparator: false,
    headerType: undefined,
    level: undefined,
  },
  //@@viewOff:defaultProps

  //@@viewOn:private
  //@@viewOff:private

  //@@viewOn:render
  render(props) {
    const { editMode, children, ...restProps } = props;

    const { headerColorScheme, header, iconList, ...restBlockProps } = restProps;

    return editMode?.edit ? (
      // this one is rendered when panel is in editMode. Doesn't matter if component is edited
      <ComponentEditable
        editMode={editMode}
        componentProps={restProps}
        component={Block}
        itemDefaultProps={ITEM_DEFAULT_PROPS}
      />
    ) : (
      <Uu5Elements.Block
        {...restBlockProps}
        header={
          headerColorScheme ? <Uu5Elements.Text colorScheme={headerColorScheme}>{header}</Uu5Elements.Text> : header
        }
      >
        {iconList?.map((icon, i) => (
          <p key={i}>
            <Uu5Elements.Icon icon={icon.icon} tooltip={icon.tooltip} /> {icon.label}
          </p>
        ))}
        {children}
      </Uu5Elements.Block>
      // this one is rendered for readers
    );
  },
  //@@viewOff:render
});

export { Block };
export default Block;
