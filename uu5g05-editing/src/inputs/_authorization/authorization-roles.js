//@@viewOn:imports
import {
  createVisualComponent,
  Utils,
  Lsi,
  DynamicLibraryComponent,
  PropTypes,
  useEffect,
  useState,
  useRef,
} from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import Uu5Elements, { useSpacing } from "uu5g05-elements";
import Helper from "./authorization-helper.js";
import Config from "../../config/config";
import importLsi from "../../lsi/import-lsi.js";

const Plus4U5 = Utils.Uu5Loader.get("uu_plus4u5g02", import.meta.url);
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
const Css = {
  input: ({ spacing }) => Config.Css.css({ marginBottom: spacing.d }),
  message: () => Config.Css.css({ marginTop: Uu5Elements.UuGds.SpacingPalette.getValue(["inline", "d"]) }),
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const AuthorizationRoles = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "AuthorizationRoles",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    value: PropTypes.shape({
      uuTerritoryBaseUri: PropTypes.string,
      roleGroupIdList: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
    }),
    onChange: PropTypes.func,
    errorList: PropTypes.array,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    value: {},
    onChange: undefined,
    errorList: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { value, onChange, name, onBlur, errorList, onFocus, ...otherProps } = props;
    const { uuTerritoryBaseUri, roleGroupIdList } = value;
    const [isFocusedLinkInput, setIsFocusedLinkInput] = useState(false);
    const spacing = useSpacing();
    const { data } = Plus4U5.useArtifact() || {};
    const currentValuesRef = useRef();

    useEffect(() => {
      currentValuesRef.current = { data, onChange, roleGroupIdList, uuTerritoryBaseUri };
    });

    useEffect(() => {
      const { data, onChange, roleGroupIdList, uuTerritoryBaseUri } = currentValuesRef.current;
      const contextTerritory = data?.context?.territory?.uuTerritoryBaseUri;

      if (!uuTerritoryBaseUri && contextTerritory && typeof onChange === "function") {
        onChange(new Utils.Event({ value: { uuTerritoryBaseUri: contextTerritory, roleGroupIdList } }));
      }
    }, []);

    let isValidBaseUri = true;
    try {
      if (uuTerritoryBaseUri) {
        new URL(uuTerritoryBaseUri);
      }
    } catch (err) {
      isValidBaseUri = false;
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const [elementAttrs, componentProps] = Utils.VisualComponent.splitProps(otherProps);
    const isUuTerritoryBaseUri = uuTerritoryBaseUri && isValidBaseUri && !isFocusedLinkInput;

    return (
      <div {...elementAttrs}>
        <Uu5Forms.Link
          {...componentProps}
          label={<Lsi import={importLsi} path={["FormAuthorization", "uuTerritoryBaseUri"]} />}
          value={uuTerritoryBaseUri}
          onChange={(e) => {
            if (typeof onChange === "function") {
              onChange(new Utils.Event({ value: { uuTerritoryBaseUri: e.data.value, roleGroupIdList: [] } }));
            }
          }}
          onBlur={(e) => {
            if (typeof onBlur === "function") onBlur(e);
            setIsFocusedLinkInput(false);
          }}
          onFocus={(e) => {
            if (typeof onFocus === "function") onFocus(e);
            setIsFocusedLinkInput(true);
          }}
          required
          className={Css.input({ spacing })}
          feedback={!isValidBaseUri ? "error" : undefined}
          message={
            !isValidBaseUri ? (
              <Lsi import={importLsi} path={["FormAuthorization", "uuTerritoryBaseUriError"]} />
            ) : undefined
          }
          // {...errorList?.find((error) => error.propName === "uuTerritoryBaseUri")?.props}
        />

        <DynamicLibraryComponent
          uu5Tag="UuTForms.FormRoleIfcSelectAdvanced"
          props={{
            ...componentProps,
            key: isUuTerritoryBaseUri ? uuTerritoryBaseUri : "uuTerritoryBaseUri",
            name: `_helperForDelete_${name}_roleGroupIdList`,
            label: <Lsi import={importLsi} path={["FormAuthorization", "roleGroupIdList"]} />,
            initialValue: Helper.getArrayFromString(roleGroupIdList),
            baseUri: isUuTerritoryBaseUri ? uuTerritoryBaseUri : undefined,
            multiple: true,
            required: true,
            disabled: !uuTerritoryBaseUri || (uuTerritoryBaseUri && !isValidBaseUri),
            onChange: (e) => {
              if (typeof onChange === "function") {
                onChange(new Utils.Event({ value: { roleGroupIdList: e.data.value, uuTerritoryBaseUri } }));
              }
            },
            // onBlur: onBlur,
            // ...errorList?.find((error) => error.propName === "roleGroupIdList")?.props,
          }}
        />
        {!uuTerritoryBaseUri && (
          <Uu5Forms.Message size="s" className={Css.message()}>
            <Lsi import={importLsi} path={["FormAuthorization", "roleGroupIdListMsg"]} />
          </Uu5Forms.Message>
        )}
      </div>
    );
    //@@viewOff:render
  },
});

const AuthorizationRolesWithValidation = Uu5Forms.withValidationMap(Uu5Forms.withValidationInput(AuthorizationRoles));

//@@viewOn:exports
export { AuthorizationRolesWithValidation };
export default AuthorizationRolesWithValidation;
//@@viewOff:exports
