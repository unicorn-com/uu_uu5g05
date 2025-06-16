const path = require("path");
const fs = require("fs");
const PropertiesReader = require("properties-reader");
const { AuthenticationService } = require("uu_appg01_oidc");
const { Util } = require("uu_appg01");

// keep stable client_id so token can be reused in future npm script
Util.Config.set("uu_app_oidc_providers_oidcg02_unregistered_client_id", "uu-oidc:unregistered-client:85cb1491");

let instance;

class OidcSession {
  constructor(tokenFile = path.join(__dirname, "../../../target/.devkit-token")) {
    this.tokenPath = tokenFile;
  }

  static async get() {
    if (!instance) instance = new OidcSession();
    return instance.get();
  }

  async get() {
    if ((await this.session) == null) {
      this.session = this._initSession();
    }
    return await this.session;
  }

  async _initSession() {
    let result = await this._initSessionFromTokenFile();
    if (!result) result = await this._interactiveLogin();
    return result;
  }

  async _initSessionFromTokenFile() {
    if (!fs.existsSync(this.tokenPath)) {
      return null;
    }

    var properties = PropertiesReader(this.tokenPath);
    if (properties.get("id_token")) {
      let token = properties.get("id_token");
      try {
        let session = await AuthenticationService.authenticate(token);
        // console.log("Auth: Using token from file.");
        return session;
      } catch (e) {
        // console.log("Auth: Token from file is not valid or expired.");
        return null;
      }
    }

    return null;
  }

  async _interactiveLogin() {
    console.log("Auth: Starting interactive login process.");
    let session = await AuthenticationService.authenticate();
    let token = session._idToken;

    console.log("> Token obtained.");

    try {
      let dirname = path.dirname(this.tokenPath);
      if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname);
      }
      fs.writeFileSync(this.tokenPath, `id_token=${token}`, "utf-8");
    } catch (e) {
      console.log("> Unable to save token to provided location: " + this.tokenPath);
    }

    return session;
  }
}

module.exports = OidcSession;
