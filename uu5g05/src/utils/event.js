const WRAPPEE_EVENT_SYMBOL = Symbol("wrappeeEvent");

class Event {
  constructor(data, event = null) {
    if (data && typeof data.stopPropagation === "function") {
      event = data;
      data = undefined;
    }
    if (event && event[WRAPPEE_EVENT_SYMBOL]) event = event[WRAPPEE_EVENT_SYMBOL];

    // NOTE Not using native CustomEvent because its methods do nothing if the event is not dispatched anywhere
    // (i.e. calling preventDefault() wouldn't set defaultPrevented flag).
    let resultInstance;
    if (event && typeof event.stopPropagation === "function") {
      // forward all fields except "data" to the underlying event (we're not using Proxy only for nicer
      // display in browser console)
      resultInstance = Object.create(event);
      resultInstance.data = data;
      for (let k in event) {
        if (k === "data") continue;
        let v = event[k];
        if (typeof v === "function") resultInstance[k] = (...args) => event[k](...args);
        else Object.defineProperty(resultInstance, k, { get: () => event[k], set: (v) => (event[k] = v) });
      }
    } else {
      resultInstance = this;
      resultInstance.data = data;
    }
    Object.defineProperty(resultInstance, WRAPPEE_EVENT_SYMBOL, { value: event });
    return resultInstance;
  }

  // methods in case there is no underlying event
  persist() {}
  stopPropagation() {}
  preventDefault() {
    this._defaultPrevented = true;
  }
  get defaultPrevented() {
    return this._defaultPrevented;
  }
}

export { Event };
export default Event;
