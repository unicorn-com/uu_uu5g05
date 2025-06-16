//@@viewOn:imports
import { Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import * as Inputs from "../../inputs/inputs-exports.js";
import importLsi from "../../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:helpers
function getNestingLevelList(nestingLevel) {
  return nestingLevel ? (nestingLevel.includes("inline") ? nestingLevel : [...nestingLevel, "inline"]) : undefined;
}
//@@viewOff:helpers

const TEMPLATE_MAP = {
  general: {
    label: () => <Lsi import={importLsi} path={["templates", "general"]} />,
    layout: {
      xs: `baseUri`,
      m: `baseUri baseUri baseUri baseUri`,
    },
    columns: { m: "repeat(4, 1fr)" },
  },
  visual: {
    label: () => <Lsi import={importLsi} path={["templates", "visual"]} />,
    layout: {
      xs: `colorScheme, significance, nestingLevel, aspectRatio, size, card, borderRadius`,
      m: `colorScheme significance significance,
          nestingLevel aspectRatio size,
          card borderRadius borderRadius`,
    },
    propInputMap: {
      aspectRatio: {
        props: ({ componentProps }) => ({
          disabled: componentProps.nestingLevel !== "box",
        }),
      },
      size: {
        props: ({ componentProps }) => ({
          disabled: componentProps.nestingLevel !== "spot",
        }),
      },
      card: {
        props: ({ componentProps }) => ({
          disabled: componentProps.nestingLevel !== "area",
        }),
      },
      borderRadius: {
        props: ({ componentProps }) => ({
          disabled: componentProps.nestingLevel === "inline" || componentProps.card === "none",
        }),
      },
    },
  },
  system: {
    label: <Lsi import={importLsi} path={["templates", "system"]} />,
    icon: "uugds-settings",
    layout: {
      xs: `id, disabled, hidden, noPrint, nestingLevel, fullTextSearchPriority, className, style`,
      m: `id id,
      disabled hidden,
      nestingLevel noPrint,
      fullTextSearchPriority fullTextSearchPriority,
      className className,
      style style`,
    },
    columns: { m: "repeat(2, 1fr)" },
    propInputMap: {
      nestingLevel: {
        props: ({ nestingLevelList }) => ({ valueList: getNestingLevelList(nestingLevelList) }),
      },
    },
  },
};

const SYSTEM_PROP_MAP = {
  "-": { component: Uu5Elements.Line, props: { significance: "subdued", colorScheme: "building" } },
  aspectRatio: { component: Inputs.FormAspectRatio },
  authorization: { component: Inputs.FormAuthorization },
  baseUri: { component: Inputs.FormBaseUri },
  bid: { component: Inputs.FormBid },
  borderRadius: { component: Inputs.FormBorderRadius },
  card: { component: Inputs.FormCard },
  className: { component: Inputs.FormClassName },
  colorScheme: {
    component: Inputs.FormColorScheme,
    props: ({ componentProps, defaultProps }) => ({
      componentSignificance: componentProps.significance,
      defaultColorScheme: defaultProps.colorScheme,
    }),
  },
  disableUserPreference: { component: Inputs.FormDisableUserPreference },
  disabled: { component: Inputs.FormDisabled },
  fullTextSearchPriority: { component: Inputs.FormFullTextSearchPriority },
  height: { component: Inputs.FormHeight },
  hidden: { component: Inputs.FormHidden },
  id: { component: Inputs.FormId },
  identificationType: { component: Inputs.FormIdentificationType },
  link: { component: Inputs.FormLink },
  nestingLevel: { component: Inputs.FormNestingLevel },
  noPrint: { component: Inputs.FormNoPrint },
  oid: { component: Inputs.FormOid },
  rts: { component: Inputs.FormRts },
  significance: {
    component: Inputs.FormSignificance,
    props: { displayAuto: false },
  },
  size: { component: Inputs.FormSize },
  spacing: { component: Inputs.FormSpaces },
  style: { component: Inputs.FormStyle },
  uu5Id: { component: Inputs.FormUu5Id },
  width: { component: Inputs.FormWidth },
};

//@@viewOn:exports
export { SYSTEM_PROP_MAP, TEMPLATE_MAP };
//@@viewOff:exports
