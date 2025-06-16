//@@viewOn:imports
import { createVisualComponent, Lsi, PropTypes, useDataObject, useEffect, useRef, useState, Utils } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import Uu5Elements, { useSpacing } from "uu5g05-elements";
import Helper from "./authorization-helper.js";
import Config from "../../config/config";
import importLsi from "../../lsi/import-lsi.js";

const Plus4U5 = Utils.Uu5Loader.get("uu_plus4u5g02", import.meta.url);
//@@viewOff:imports

//@@viewOn:constants
const DEFAULT_PROFILE_LIST = ["_Authorities", "_Executives", "_Readers", "_Guests"];
//@@viewOff:constants

//@@viewOn:css
const Css = {
  input: ({ spacing }) => Config.Css.css({ marginBottom: spacing.d }),
  badge: () => Config.Css.css({ marginLeft: Uu5Elements.UuGds.SpacingPalette.getValue(["inline", "e"]) }),
  message: () => Config.Css.css({ marginTop: Uu5Elements.UuGds.SpacingPalette.getValue(["inline", "d"]) }),
};
//@@viewOff:css

//@@viewOn:helpers
function getItemList(itemList) {
  let result = itemList.map((item) => {
    let newItem;
    if (item.includes("_")) {
      newItem = {
        value: item,
        children: (
          <Uu5Elements.Text>
            {item.charAt(1).toUpperCase() + item.slice(2)}
            <Uu5Elements.Badge className={Css.badge()} size="m" colorScheme="warning" significance="common">
              <Lsi import={importLsi} path={["general", "unverified"]} />
            </Uu5Elements.Badge>
          </Uu5Elements.Text>
        ),
      };
    } else {
      newItem = { value: item, children: item };
    }
    return newItem;
  });
  return result;
}

function getFeedbackProps(state) {
  let result = {};
  if (["error", "errorNoData"].includes(state)) {
    result = {
      feedback: "warning",
      message: <Lsi import={importLsi} path={["FormAuthorization", "profileListError"]} />,
    };
  }
  return result;
}

function getCorrectProfileSyntax(profile) {
  return profile.includes("_")
    ? "_" + profile.charAt(1).toUpperCase() + profile.slice(2)
    : profile.charAt(0).toUpperCase() + profile.slice(1);
}
//@@viewOff:helpers

const AuthorizationProfile = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "AuthorizationProfile",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    value: PropTypes.shape({
      artifactUri: PropTypes.string,
      profileList: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
      useCase: PropTypes.string,
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
    const { value, onChange, onBlur, errorList, onFocus, ...otherProps } = props;
    const { artifactUri, profileList: propsProfileList, useCase } = value;
    const { baseUri, artifactId } = Helper.splitArtifactUri(artifactUri);
    const [isFocusedLinkInput, setIsFocusedLinkInput] = useState(false);
    const spacing = useSpacing();
    const currentValuesRef = useRef();

    // values are in a state due to edit of the lists based on verified and unverified profiles
    const [itemList, setItemList] = useState([]);
    const [profileList, setProfileList] = useState(Helper.getArrayFromString(propsProfileList));

    if (!Utils.Object.deepEqual(profileList, Helper.getArrayFromString(propsProfileList))) {
      // update profileList
      setProfileList(Helper.getArrayFromString(propsProfileList));
    }

    useEffect(() => {
      currentValuesRef.current = { itemList, onChange, useCase, profileList };
    });

    let isValidUri = true;
    try {
      if (artifactUri) {
        new URL(artifactUri);
      }
    } catch (err) {
      isValidUri = false;
    }

    const { state, data } = useDataObject(
      {
        initialDtoIn: { id: artifactId },
        handlerMap: {
          load: async (dtoIn) => {
            let result;
            if (artifactUri && isValidUri && !isFocusedLinkInput) {
              const response = await Plus4U5.Utils.AppClient.get(baseUri + "/uuArtifactIfc/loadPermissions", dtoIn);
              result = response.data;
            }
            return result;
          },
        },
      },
      [artifactUri, isFocusedLinkInput],
    );

    useEffect(() => {
      if (artifactUri && isValidUri && !isFocusedLinkInput) {
        const { itemList, onChange, useCase, profileList } = currentValuesRef.current;

        if (state === "ready" && Array.isArray(data.profileList) && data.profileList.length > 0) {
          let profileListFromServer = data.profileList.map((profile) => profile.code); // modifying the data structure from the server

          if (profileList.length > 0) {
            // if a profileList is defined, at the beginning we must:
            // 1) compare verified and unverified profiles in profileList with itemList and replace unverified profiles (in profileList!!) with verified ones
            // 2) add missing profiles from profileList to itemList
            let newProfileList = [];
            let newItemList = [...profileListFromServer];
            for (let profile of profileList) {
              // profileList = ["Authorities", "_Guests"] can be a combination of verified and unverified profiles

              if (profile.includes("_")) {
                // unverified profile with prefix
                let profileWithoutPrefix = profile.charAt(1).toUpperCase() + profile.slice(2);
                // profileListFromServer = ["Authorities", "Guests"] only verified profiles
                let verifiedProfileIndex = profileListFromServer.findIndex(
                  (profileFromServer) => profileFromServer === profileWithoutPrefix,
                );
                if (verifiedProfileIndex > -1) {
                  newProfileList.push(profileWithoutPrefix); // 1) replaced unverified profiles with verified profiles
                } else {
                  newProfileList.push(profile); // 1) profile is not replaced
                  newItemList.push(profile); // 2) the unverified profile is not found in the server data, it must be added to the itemList
                }
              } else {
                // verified profile without prefix
                newProfileList.push(profile); // 1) profile is not replaced
                if (!newItemList.includes(profile)) newItemList.push(profile); // 2) the verified profile is not found in the server data, it must be added to the itemList
              }
            }
            if (!Utils.Object.deepEqual(profileList, newProfileList)) {
              if (typeof onChange === "function") {
                onChange(new Utils.Event({ value: { artifactUri, profileList: newProfileList, useCase } }));
              }
              setProfileList(newProfileList);
            }
            setItemList(getItemList(newItemList));
          } else {
            setItemList(getItemList(profileListFromServer));
          }
        } else {
          // if cmd is called but loading fails or no data is available, the default profile set is used
          let defaultItemList = getItemList(DEFAULT_PROFILE_LIST);

          if (profileList.length > 0) {
            // if a profileList is defined, at the beginning we must:
            // 1) compare verified and unverified profiles in profileList with itemList and replace unverified profiles (in itemList!!) with verified ones
            // 2) add missing profiles from profileList to itemList
            let newItemList = [...DEFAULT_PROFILE_LIST];
            for (let profile of profileList) {
              // profileList = ["Authorities", "_Guests"] can be a combination of verified and unverified profiles
              // DEFAULT_PROFILE_LIST = ["_Authorities", "_Executives", "_Readers", "_Guests"] only unverified profiles

              if (profile.includes("_")) {
                // unverified profile with prefix
                if (!newItemList.includes(profile)) newItemList.push(profile); // 2) the unverified profile is not found in the default profile set, it must be added to the itemList
              } else {
                // verified profile without prefix
                newItemList = newItemList.map((item) => (item === "_" + profile ? profile : item)); // 1) replaced unverified profiles with verified profiles
                if (!newItemList.includes(profile)) newItemList.push(profile); // 2) the verified profile is not found in the default profile set, it must be added to the itemList
              }
            }
            setItemList(getItemList(newItemList));
          } else {
            if (!Utils.Object.deepEqual(itemList, defaultItemList)) {
              setItemList(defaultItemList);
            }
          }
        }
      }
    }, [state, data, artifactUri, isValidUri, isFocusedLinkInput]);

    function handleTextSelectChange(e) {
      if (typeof onChange === "function") {
        let newProfileList = e.data.value; // array of selected profile
        let nonExistentProfile, diffProfileVerification;
        let valueList = itemList.map((item) => item.value); // ["Authorities", "_Guests"] can be a combination of verified and unverified profiles

        if (newProfileList.length > 0) {
          for (let profile of newProfileList) {
            // modify the profile syntax to be the same as in profileList or itemList
            let modifiedProfile = getCorrectProfileSyntax(profile);

            if (!valueList.includes(modifiedProfile) && !valueList.includes("_" + modifiedProfile)) {
              // find a profile in the selected profiles that does not exist in the itemList
              nonExistentProfile = profile;
            } else if (!valueList.includes(modifiedProfile) && valueList.includes("_" + modifiedProfile)) {
              // profile exists in itemList but is unverified
              diffProfileVerification = profile;
            }
          }

          if (nonExistentProfile) {
            // a non-existing profile is added as an unverified profile to profileList and itemList
            newProfileList = newProfileList.map((profile) =>
              profile === nonExistentProfile ? getCorrectProfileSyntax("_" + profile) : profile,
            );
            setItemList(getItemList([getCorrectProfileSyntax("_" + nonExistentProfile), ...valueList]));
          } else if (diffProfileVerification) {
            // change the verification of an existing profile, replace an verified profile with an unverified profile
            newProfileList = newProfileList.map((profile) =>
              profile === diffProfileVerification ? getCorrectProfileSyntax("_" + diffProfileVerification) : profile,
            );
          }
        }

        onChange(new Utils.Event({ value: { artifactUri, profileList: newProfileList, useCase } }));
      }
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const [elementAttrs, componentProps] = Utils.VisualComponent.splitProps(otherProps);

    return (
      <div {...elementAttrs}>
        <Uu5Forms.Link
          {...componentProps}
          label={<Lsi import={importLsi} path={["FormAuthorization", "artifactUri"]} />}
          value={artifactUri}
          onChange={(e) => {
            if (typeof onChange === "function") {
              onChange(new Utils.Event({ value: { artifactUri: e.data.value, profileList: [], useCase: undefined } }));
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
          feedback={!isValidUri ? "error" : undefined}
          message={
            !isValidUri ? <Lsi import={importLsi} path={["FormAuthorization", "uuTerritoryBaseUriError"]} /> : undefined
          }
          // {...errorList?.find((error) => error.propName === "artifactUri")?.props}
        />
        <Uu5Forms.TextSelect
          {...componentProps}
          label={<Lsi import={importLsi} path={["FormAuthorization", "profileList"]} />}
          value={profileList}
          onChange={handleTextSelectChange}
          itemList={itemList}
          multiple
          insertable
          pending={state === "pendingNoData" || state === "pending"}
          disabled={!artifactUri || (artifactUri && (!isValidUri || useCase !== undefined))}
          className={Css.input({ spacing })}
          {...getFeedbackProps(state)}
        />
        <Uu5Forms.Text
          {...componentProps}
          label={<Lsi import={importLsi} path={["FormAuthorization", "useCase"]} />}
          value={useCase}
          onChange={(e) => {
            if (typeof onChange === "function") {
              onChange(new Utils.Event({ value: { artifactUri, profileList, useCase: e.data.value } }));
            }
          }}
          disabled={!artifactUri || (artifactUri && (!isValidUri || profileList.length > 0))}
          info={<Lsi import={importLsi} path={["FormAuthorization", "useCaseMsg"]} />}
        />
        {!artifactUri && (
          <Uu5Forms.Message size="s" className={Css.message()}>
            <Lsi import={importLsi} path={["FormAuthorization", "artifactUriMsg"]} />
          </Uu5Forms.Message>
        )}
      </div>
    );
    //@@viewOff:render
  },
});

const AuthorizationProfileWithValidation = Uu5Forms.withValidationMap(
  Uu5Forms.withValidationInput(AuthorizationProfile),
);

//@@viewOn:exports
export { AuthorizationProfileWithValidation };
export default AuthorizationProfileWithValidation;
//@@viewOff:exports
