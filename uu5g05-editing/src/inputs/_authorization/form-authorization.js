//@@viewOn:imports
import Uu5Forms from "uu5g05-forms";
import Authorization from "./authorization.js";
//@@viewOff:imports

const FormAuthorization = Uu5Forms.withFormItem(Authorization);
FormAuthorization.editModal = {
  propMap: {
    type: "type",
    uuTerritoryBaseUri: "uuTerritoryBaseUri",
    roleGroupIdList: "roleGroupIdList",
    artifactUri: "artifactUri",
    profileList: "profileList",
    useCase: "useCase",
  },
};

//@@viewOn:exports
export { FormAuthorization };
export default FormAuthorization;
//@@viewOff:exports
