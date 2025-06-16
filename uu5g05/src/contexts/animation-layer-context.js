//@@viewOn:imports
import Context from "../utils/context";
//@@viewOff:imports

//@@viewOn:constants
const NO_PROVIDER_ERROR = "noProvider";
//@@viewOff:constants

//@@viewOn:helpers
//@@viewOff:helpers

const [AnimationLayerContext, useAnimationLayerContext] = Context.create({
  register: () => null,
  unregister: () => null,
  render: () => [null, { code: NO_PROVIDER_ERROR }],
});

AnimationLayerContext.NO_PROVIDER_ERROR = NO_PROVIDER_ERROR;

//@@viewOn:exports
export { AnimationLayerContext, useAnimationLayerContext };
export default AnimationLayerContext;
//@@viewOff:exports
