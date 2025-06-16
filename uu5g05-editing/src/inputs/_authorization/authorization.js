//@@viewOn:imports
import { createVisualComponent, Lsi, PropTypes, useWillMount, Utils } from "uu5g05";
import Uu5Elements, { useSpacing } from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import AuthorizationRoles from "./authorization-roles";
import AuthorizationProfile from "./authorization-profile";
import Helper from "./authorization-helper.js";
import Config from "../../config/config";
import importLsi from "../../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
const ITEM_LIST = [
  { value: Helper.NONE, children: <Lsi import={importLsi} path={["FormAuthorization", "none"]} /> },
  { value: Helper.ROLES, children: <Lsi import={importLsi} path={["FormAuthorization", "roles"]} /> },
  { value: Helper.PROFILES, children: <Lsi import={importLsi} path={["FormAuthorization", "profiles"]} /> },
];
//@@viewOff:constants

//@@viewOn:css
const Css = {
  message: ({ spacing }) =>
    Config.Css.css({
      marginTop: Uu5Elements.UuGds.SpacingPalette.getValue(["inline", "d"]),
      marginBottom: spacing.d,
    }),
};
//@@viewOff:css

//@@viewOn:helpers
function getItemList(authorizationOptionList) {
  return ITEM_LIST.filter((item) => authorizationOptionList.includes(item.value));
}

// function getErrorList(value) {
//   let errorList = [];

//   if (value && Object.keys(value).length > 0) {
//     for (let propName in value) {
//       let validPropList = [];
//       if (value.type === "authorizedProfile") validPropList = ["artifactUri"];
//       if (value.type === "authorizedRoleGroup") validPropList = ["uuTerritoryBaseUri", "roleGroupIdList"];

//       if (validPropList.includes(propName) && value[propName] === undefined) {
//         errorList.push({
//           propName,
//           props: {
//             feedback: "error",
//             message: <Lsi import={importLsi} path={["general", "required"]} />,
//           },
//         });
//       }
//     }
//   }
//   return errorList;
// }
//@@viewOff:helpers

const _Authorization = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Authorization",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    authorizationOptionList: PropTypes.array,
    value: PropTypes.shape({
      type: PropTypes.oneOf(["authorizedProfile", "authorizedRoleGroup"]),
      // roles type
      uuTerritoryBaseUri: PropTypes.string,
      roleGroupIdList: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
      // profiles type
      artifactUri: PropTypes.string,
      profileList: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
      useCase: PropTypes.string,
    }),
    onChange: PropTypes.func,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    authorizationOptionList: ["none", "authorizedProfile", "authorizedRoleGroup"],
    value: undefined,
    onChange: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { authorizationOptionList, value, onChange, name, onBlur, onValidate, ...otherProps } = props;
    const { type: propsType, uuTerritoryBaseUri, roleGroupIdList, artifactUri, profileList, useCase } = value || {};
    const spacing = useSpacing();
    const itemList = getItemList(authorizationOptionList);
    const type = propsType || itemList[0].value;

    if (process.env.NODE_ENV !== "production") {
      useWillMount(() => {
        Utils.LoggerFactory.get(Config.TAG + "FormAuthorization").error(
          `WARNING: This component is deprecated. It is recommended to use components from Uu5Editing instead. (https://uuapp.plus4u.net/uu-bookkit-maing01/5ee03d6a2be14b9f8d6e138b3ed3d250)`,
        );
      });
    }

    // const { itemMap } = Uu5Forms.useFormApi();
    // const origErrorListRef = useRef();
    // const errorList = origErrorListRef.current || itemMap[name]?.errorList || [];

    function handleChange(e) {
      if (typeof onChange === "function") {
        let newValue = { type, uuTerritoryBaseUri, roleGroupIdList, artifactUri, profileList, useCase };

        // origErrorListRef is used for displaying error state in inputs during onChange
        // during onChange the form does not provide any errorList, so it is necessary to keep its reference
        // origErrorListRef.current = checkErrorList(e.data.value, propName, errorList);

        onChange(new Utils.Event({ value: { ...newValue, ...e.data.value } }), e);
      }
    }

    // function handleValidate(value) {
    //   let result = getErrorList(value);
    //   return result.length > 0 ? result : undefined;
    // }

    // function handleBlur(e) {
    //   if (typeof onBlur === "function") {
    //     // this function triggers validations on inputs
    //     // function does not affect the change of value
    //     onBlur(new Utils.Event({ ...e.data, value }), e);
    //   }
    // }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const [elementAttrs, componentProps] = Utils.VisualComponent.splitProps(otherProps);

    let childrenToRender = null;

    switch (type) {
      case Helper.ROLES:
        childrenToRender = (
          <AuthorizationRoles
            {...componentProps}
            value={{ uuTerritoryBaseUri, roleGroupIdList }}
            onChange={handleChange}
            name={name}
            // onBlur={handleBlur}
            // onValidate={(e) => {
            //   let result = e.data.type === "mount" ? true : handleValidate(e.data.value);
            //   if ((result === undefined || result === true) && typeof onValidate === "function") {
            //     result = onValidate(e);
            //   }
            //   origErrorListRef.current = undefined;
            //   return result;
            // }}
            // errorList={errorList}
          />
        );
        break;
      case Helper.PROFILES:
        childrenToRender = (
          <AuthorizationProfile
            {...componentProps}
            value={{ artifactUri, profileList, useCase }}
            onChange={handleChange}
            // onBlur={handleBlur}
            // onValidate={(e) => {
            //   let result = e.data.type === "mount" ? true : handleValidate(e.data.value);
            //   if ((result === undefined || result === true) && typeof onValidate === "function") {
            //     result = onValidate(e);
            //   }
            //   origErrorListRef.current = undefined;
            //   return result;
            // }}
            // errorList={errorList}
          />
        );
        break;
      default:
        childrenToRender = (
          <Uu5Elements.PlaceholderBox
            code="users"
            borderRadius="full"
            header={<Lsi import={importLsi} path={["FormAuthorization", "noneMsg"]} />}
          />
        );
    }

    return (
      <div {...elementAttrs}>
        <Uu5Forms.SwitchSelect
          label={<Lsi import={importLsi} path={["FormAuthorization", "type"]} />}
          value={type}
          onChange={(e) => handleChange(new Utils.Event({ value: { type: e.data.value } }))}
          itemList={itemList}
        />
        <Uu5Forms.Message size="s" className={Css.message({ spacing })}>
          <Lsi import={importLsi} path={["FormAuthorization", "typeMsg"]} />
        </Uu5Forms.Message>
        {childrenToRender}
      </div>
    );
    //@@viewOff:render
  },
});

const Authorization = Uu5Forms.withFormInput(_Authorization);

//@@viewOn:exports
export { Authorization };
export default Authorization;
//@@viewOff:exports
