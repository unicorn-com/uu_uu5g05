//@@viewOn:imports
import createComponent from "../create-component/create-component";
import PropTypes from "../prop-types";
import { useRef, useState, useEffect, useMemo } from "../hooks/react-hooks";
import Config from "../config/config.js";
import AnimationLayerContext from "../contexts/animation-layer-context";
//@@viewOff:imports

//@@viewOn:constants
const MIN = 60 * 1000;
//@@viewOff:constants

//@@viewOn:helpers
//@@viewOff:helpers

const AnimationLayerProvider = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "AnimationLayerProvider",

  REPLACE_ERROR: "replacedAfterMinDuration",
  CANCEL_ERROR: "cancelAfterMaxDuration",
  NOT_ALLOWED_ERROR: "notAllowed",
  NO_PROVIDER_ERROR: AnimationLayerContext.NO_PROVIDER_ERROR,
  BUSY_ERROR: "busy",
  MAX_COUNT_1MIN_ERROR: "maxCount1min",
  MAX_COUNT_5MIN_ERROR: "maxCount5min",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    allowed: PropTypes.bool,
    maxCountDuring1min: PropTypes.number,
    maxCountDuring5min: PropTypes.number,
    guaranteedDurationMs: PropTypes.number,
    maxDurationMs: PropTypes.number,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    allowed: true,
    maxCountDuring1min: 4,
    maxCountDuring5min: 12,
    guaranteedDurationMs: 4000,
    maxDurationMs: 8000,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children, allowed, guaranteedDurationMs, maxDurationMs, maxCountDuring1min, maxCountDuring5min } = props;

    const portalRef = useRef();
    const [comp, setComp] = useState();

    const errorMapRef = useRef({});
    const counterRef = useRef(new Set());

    const value = useMemo(
      () => ({
        register(id) {
          if (allowed) {
            setComp((curComp) => {
              const now = new Date().getTime();

              const ts1minArr = [];
              const ts5minArr = [];
              const counterArr = [...counterRef.current];
              counterArr.forEach((ts) => {
                if (now - ts < 5 * MIN) {
                  ts5minArr.push(ts);
                  if (now - ts < MIN) ts1minArr.push(ts);
                }
              });
              let sumCount1min = ts1minArr.length;
              let sumCount5min = ts5minArr.length;

              let result = curComp ? { ...curComp, requestCount: (curComp.requestCount ?? 0) + 1 } : undefined;

              if (sumCount1min >= maxCountDuring1min) {
                errorMapRef.current[id] = {
                  code: AnimationLayerProvider.MAX_COUNT_1MIN_ERROR,
                  params: {
                    availableTime: new Date(ts1minArr.toSorted()[0] + MIN).toISOString(),
                    maxCount: maxCountDuring1min,
                  },
                };
              } else if (sumCount5min >= maxCountDuring5min) {
                errorMapRef.current[id] = {
                  code: AnimationLayerProvider.MAX_COUNT_5MIN_ERROR,
                  params: {
                    availableTime: new Date(ts5minArr.toSorted()[0] + 5 * MIN).toISOString(),
                    maxCount: maxCountDuring5min,
                  },
                };
              } else if (curComp == null || now - curComp.ts > guaranteedDurationMs) {
                if (curComp) {
                  errorMapRef.current[curComp.id] = {
                    code: AnimationLayerProvider.REPLACE_ERROR,
                    params: { durationMs: now - curComp.ts },
                  };
                }
                result = { id, ts: now };
              } else {
                errorMapRef.current[id] = {
                  code: AnimationLayerProvider.BUSY_ERROR,
                  params: { availableTime: new Date(curComp.ts + guaranteedDurationMs).toISOString() },
                };
              }

              return result;
            });
          } else {
            errorMapRef.current[id] = { code: AnimationLayerProvider.NOT_ALLOWED_ERROR };
          }
        },
        unregister(id) {
          delete errorMapRef.current[id];
          setComp((curComp) => (curComp?.id === id ? null : curComp));
        },
        render(id) {
          let el = null,
            error;
          if (!allowed) {
            error = { code: AnimationLayerProvider.NOT_ALLOWED_ERROR };
          } else if (comp?.id === id) {
            el = portalRef.current;
          } else {
            error = errorMapRef.current[id];
          }
          return [el, error];
        },
      }),
      [comp, allowed, guaranteedDurationMs, maxCountDuring1min, maxCountDuring5min],
    );

    useEffect(() => {
      if (comp) {
        const timeout = setTimeout(
          () => {
            setComp((curComp) => {
              let result = curComp;

              if (curComp.id === comp.id) {
                result = null;
                errorMapRef.current[comp.id] = {
                  code: AnimationLayerProvider.CANCEL_ERROR,
                  params: { durationMs: maxDurationMs },
                };
              }

              return result;
            });
          },
          maxDurationMs - (new Date().getTime() - comp.ts),
        );

        return () => clearTimeout(timeout);
      }
    }, [comp, maxDurationMs]);

    useEffect(() => {
      if (comp && !counterRef.current.has(comp.ts)) {
        const now = new Date().getTime();
        const min5 = 5 * MIN;
        counterRef.current = new Set([...counterRef.current].filter((ts) => now - ts < min5));
        counterRef.current.add(comp.ts);
      }
    }, [comp]);
    //@@viewOff:private

    //@@viewOn:render
    return (
      <AnimationLayerContext.Provider value={value}>
        {typeof children === "function" ? children(value) : children}
        <div ref={portalRef} className={Config.Css.css({ position: "relative", zIndex: 10000 })} />
      </AnimationLayerContext.Provider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { AnimationLayerProvider };
export default AnimationLayerProvider;
//@@viewOff:exports
