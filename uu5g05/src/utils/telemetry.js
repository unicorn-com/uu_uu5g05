import LoggerFactory from "./logger-factory";
import String from "./string";
import { sessionHolder } from "../providers/session-provider";
import EventManager from "./event-manager";
import { telemetryId, telemetryTypeCode, telemetryLevel } from "../uu5-environment";

const INTERVAL = 60 * 1000; // 1min
const MAX_ITEMS = 1000;

let telemetrySingleton;
let telemetries = new Set();

const SEVERITY_LEVEL_LIST = ["ERROR", "WARNING", "INFO"];

class Base64 {
  static encode(string) {
    return btoa(unescape(encodeURIComponent(string)));
  }

  static decode(base64) {
    return decodeURIComponent(escape(atob(base64)));
  }
}

async function getCallToken(url, session) {
  let token;
  if (session) {
    let a = document.createElement("a");
    a.href = url || "";
    let fullUrl = a.href.toString(); // browser-normalized URL (removed "../" sequences, ensured that protocol+domain is present, ...)
    let scope =
      typeof session.getCallTokenScope === "function"
        ? await session.getCallTokenScope(fullUrl)
        : fullUrl.replace(/[?#].*/, "");
    let callToken = await session.getCallToken(scope, { excludeAuthenticationType: true }); // if using deprecated uu_oidcg01 the result will be an object (and "url" parameter got ignored), otherwise it's string
    token = typeof callToken === "string" ? callToken : callToken ? callToken.token : undefined;
  }
  return token;
}

let lastToken = {};
let lastTokenPreparationTime = 0;

function updateToken(uri, session) {
  let now = Date.now();
  if (now - lastTokenPreparationTime > 60000) {
    if (session?.isAuthenticated() && session.getCallTokenScope) {
      lastTokenPreparationTime = now;
      // NOTE This will prepare call token for our callUri into cache in uu_appg01_oidc library
      // (OIDC reuses call tokens as much as possible and will not ask for new one if it still
      // has valid one so even if we do this often, it shouldn't have performance impact)
      getCallToken(uri, session).then((token) => (lastToken[uri] = token));
    }
  }
}

function getLastToken(uri) {
  return lastToken[uri] ? "Bearer " + lastToken[uri] : undefined;
}

function getUserId() {
  const key = "uu_app_client_trace_id";
  let userId = localStorage.getItem(key);

  if (!userId) {
    userId = String.generateId(16);
  }

  return userId;
}

let disableLog = false;

function shouldLog(id, severity, eventType) {
  return (
    !disableLog &&
    ((telemetryId && new RegExp(telemetryId).test(id)) ||
      (telemetryTypeCode && new RegExp(telemetryTypeCode).test(eventType)) ||
      SEVERITY_LEVEL_LIST.indexOf(severity) <= SEVERITY_LEVEL_LIST.indexOf(telemetryLevel))
  );
}

const logger = LoggerFactory.get("Telemetry");

class Telemetry {
  static init(cmdUri, opt) {
    if (telemetrySingleton) {
      logger.warn("Telemetry was already initialized.");
    } else {
      telemetrySingleton = new Telemetry(cmdUri, opt);
    }
    return telemetrySingleton;
  }

  static info(logType, params) {
    if (telemetrySingleton) telemetrySingleton.info(logType, params);
  }

  static warn(logType, params) {
    if (telemetrySingleton) telemetrySingleton.warn(logType, params);
  }

  static error(logType, params) {
    if (telemetrySingleton) telemetrySingleton.error(logType, params);
  }

  constructor(cmdUri, { intervalMs = INTERVAL } = {}) {
    if (cmdUri) {
      this.id = [getUserId(), String.generateId(16)].join("");
      this.entryPointUri = location.href;
      this.uri = cmdUri;

      this._items = [];

      this._intervalInst = setInterval(() => this._send(), intervalMs);
      telemetries.add(this);
    } else {
      logger.error("Command uri is not set.", cmdUri);
    }
  }

  info(logType, params) {
    this._log("INFO", logType, params);
  }

  warn(logType, params) {
    this._log("WARNING", logType, params);
  }

  error(logType, params) {
    this._log("ERROR", logType, params);
  }

  stop() {
    telemetries.delete(this);
    this._intervalInst && clearInterval(this._intervalInst);
    this._send();
  }

  async _send(telemetryId = this.id, entryPointUri = this.entryPointUri) {
    let session = sessionHolder.session?.session;

    if (this._items.length && session?.isAuthenticated()) {
      let items = this._items;
      this._items = [];

      let length = items.length;
      if (length > MAX_ITEMS) {
        logger.warn(`Data was cropped. Just last ${MAX_ITEMS} from ${length} items were saved.`);

        items = items.slice(length - MAX_ITEMS, length);
        items.push({
          severity: "INFO",
          typeCode: "MORE_DATA",
          time: new Date().toISOString(),
          data: {
            message: `Data was cropped. Just last ${MAX_ITEMS} from ${length} items were saved.`,
          },
        });
      }

      let output = { telemetryId, entryPointUri, eventList: items };

      let data = Base64.encode(JSON.stringify(output));

      const res = await fetch(this.uri, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",

          // using token explicitly because otherwise Client would try to get new one from OIDC server
          // and if we are in beforeunload then it will take too long (and telemetry request won't event start)
          authorization: getLastToken(this.uri),
        },
        body: JSON.stringify({ data }),
      });

      if (res.status === 404 || res.status === 405) {
        disableLog = true;
      }
    }
  }

  _log(severity, logType, logParams) {
    if (this.uri && shouldLog(this.id, severity, logType)) {
      let data = {
        severity,
        typeCode: logType,
        time: new Date().toISOString(),
      };

      if (logParams) {
        data.data = { ...logParams };
      }

      this._items.push(data);

      updateToken(this.uri, sessionHolder.session?.session);

      return data;
    }
  }
}

EventManager.register(
  "beforeunload",
  () => {
    for (let telemetry of telemetries) telemetry.stop();
  },
  window,
);

export { Telemetry };
export default Telemetry;
