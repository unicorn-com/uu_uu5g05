//@@viewOn:imports
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

const Helper = {
  NONE: "none",
  PROFILES: "authorizedProfile",
  ROLES: "authorizedRoleGroup",

  splitArtifactUri(artifactUri) {
    let baseUri, artifactId;
    if (artifactUri) {
      let urlParts = artifactUri.split("/");
      let idMatch = artifactUri.match(/[?&]id=([^&]+)/);
      artifactId = idMatch ? idMatch[1] : null;
      baseUri = urlParts[0] + "//" + urlParts[2] + "/" + urlParts[3] + "/" + urlParts[4];
    }
    return { baseUri, artifactId };
  },

  getArrayFromString(list) {
    let result = list || [];

    if (typeof list === "string") {
      result =
        list
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean) || [];
    }
    return result;
  },
};

//@@viewOn:exports
export { Helper };
export default Helper;
//@@viewOff:exports
