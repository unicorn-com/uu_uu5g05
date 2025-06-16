import Lsi from "./lsi.js";
import LibraryRegistry from "./library-registry";

class Message extends Error {
  constructor(messageOrLsi, optsOrCause) {
    let opts = optsOrCause instanceof Error ? { cause: optsOrCause } : optsOrCause || {};
    let message =
      typeof messageOrLsi === "string" ? messageOrLsi : (Lsi.getMessage(messageOrLsi, "en") ?? opts.cause?.message);
    let lsi = typeof messageOrLsi === "string" ? null : messageOrLsi;
    super(message);
    this.lsi = lsi;
    this.messageParams = opts.messageParams;
    this.cause = opts.cause;
  }
}

const UtilsError = {
  Message,
  addMetadata(e, context) {
    e.uri = e?.uri ?? window.location.href.replace(/([?&](?:access_token|uuAT)=)[^&#]*/g, "$1...");
    e.time = e?.time ?? (process.env.NODE_ENV !== "test" ? new Date().toISOString() : null);

    const browserInfo = {};
    for (let k in window?.navigator ?? {}) {
      const v = window.navigator[k];
      if (!["plugins", "mimeTypes"].includes(k) && v && (typeof v !== "object" || Object.keys(v).length))
        browserInfo[k] = v;
    }
    e.browserInfo = browserInfo;

    e.libraryList = LibraryRegistry.listLibraries();
    if (context) e.context = { ...e.context, ...context };

    return e;
  },
};

export { UtilsError as Error };
export default UtilsError;
