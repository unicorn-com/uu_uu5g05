//@@viewOn:imports
import { createComponent, PropTypes, Utils, useWillMount } from "uu5g05";
//@@viewOff:imports

const Uu5Editing = Utils.Uu5Loader.get("uu5g05-editing");
const Uu5Forms = Utils.Uu5Loader.get("uu5g05-forms");

//@@viewOn:statics
//@@viewOff:statics

const BlockEditable = createComponent({
  //@@viewOn:propTypes
  propTypes: {
    editMode: PropTypes.shape({
      edit: PropTypes.bool,
      onEditEnd: PropTypes.func,
    }).isRequired,
    componentProps: PropTypes.object,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    componentProps: {},
  },
  //@@viewOff:defaultProps

  //@@viewOn:private
  //@@viewOff:private

  //@@viewOn:render
  render(props) {
    const { editMode, componentProps, component } = props;

    // signals that editMode component is rendered
    useWillMount(() => {
      if (typeof editMode?.onReady === "function") {
        editMode.onReady(new Utils.Event());
      }
    });

    const tabList = [
      {
        template: "visual",
        layout: {
          xs: `colorScheme, significance, nestingLevel, card, borderRadius, headerType, level, headerColorScheme`,
          m: `colorScheme significance significance,
              nestingLevel . .,
              card borderRadius borderRadius,
              headerType level level,
              headerColorScheme . .`,
        },
        propInputMap: {
          colorScheme: {
            props: {
              valueList: ["building", "meaning"],
            },
          },
          nestingLevel: {
            props: {
              valueList: ["areaCollection", "area", "inline"],
            },
          },
        },
      },
      {
        label: { en: "Basic properties" },
        layout: { xs: `header, headerSeparator, . , footer, footerSeparator, . , disabled` },
      },
    ];

    const propInputMap = {
      footer: {
        component: Uu5Forms.FormText,
        props: {
          label: { en: "Footer" },
        },
      },
      footerSeparator: {
        component: Uu5Forms.FormCheckbox,
        props: ({ componentProps }) => ({
          label: { en: "Show Footer Separator" },
          info: { en: "This input enables / disables the text input for Footer" },
          disabled: !componentProps.footer,
        }),
      },
      header: {
        component: Uu5Forms.FormText,
        props: {
          label: { en: "Header" },
          required: true,
        },
      },
      headerSeparator: {
        component: Uu5Forms.FormCheckbox,
        props: {
          label: { en: "Show header separator" },
          info: { en: "Separator between header and content." },
        },
      },
      headerType: {
        component: Uu5Forms.FormSwitchSelect,
        props: {
          label: { en: "Header Type" },
          itemList: [
            { value: "title", children: "Title" },
            { value: "heading", children: "Heading" },
          ],
        },
      },
      level: {
        component: Uu5Forms.FormSwitchSelect,
        props: ({ componentProps }) => ({
          label: { en: "Header Level" },
          itemList: [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 5 }],
          disabled: componentProps.nestingLevel !== "area",
        }),
      },
      headerColorScheme: {
        component: "colorScheme",
        props: {
          label: { en: "Header Color Scheme" },
          valueList: ["building", "basic"],
        },
      },
      label: {
        component: Uu5Forms.FormText,
        props: {
          label: { en: "Label" },
          required: true,
        },
      },
      tooltip: {
        component: Uu5Forms.FormText,
        props: {
          label: { en: "Tooltip" },
        },
      },
      icon: {
        component: Uu5Forms.FormText,
        props: {
          label: { en: "Icon" },
        },
      },
    };

    const getEditableItemLabel = ({ itemProps, itemIndex }) => {
      console.log("intemProps, itemIndex", itemProps, itemIndex);
      return itemProps.label || `Item ${itemIndex + 1}`;
    };

    const itemTab = {
      label: getEditableItemLabel,
      layout: {
        xs: `label, tooltip, icon`,
        m: `label tooltip icon`,
      },
    };

    console.log("componentProps", componentProps);
    return (
      <Uu5Editing.EditModal
        open={editMode.edit}
        onClose={() => editMode.onEditEnd()}
        onSave={({ props }) => editMode.onEditEnd({ props })}
        uu5Tag={component.uu5Tag}
        props={componentProps}
        defaultProps={component.defaultProps}
        propInputMap={propInputMap}
        tabList={tabList}
        itemPropName="iconList"
        itemTab={itemTab}
        itemDefaultProps={props.itemDefaultProps}
      />
    );
  },
  //@@viewOff:render
});

export { BlockEditable };
export default BlockEditable;
