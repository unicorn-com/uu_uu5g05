import UuGds from "uu5g05-elements-gds";

// FIXME removed after release uuGds 0.14.0 => update all UuGds calls to new uuGds API
const wrappedGds = { ...UuGds };
wrappedGds.Shape ||= { getStateStyles: UuGds.getShapeStateStyles };
wrappedGds.EffectPalette ||= wrappedGds.ElevationPalette;

// TODO remove after no uuApp will use uuPlus4U5 g02 0.x version
let warn = true;
wrappedGds.getShapeStateStyles ||= (...args) => {
  if (warn) console.error("WARNING: Use UuGds.Shape.getStateStyles instead of UuGds.getShapeStateStyles!");
  warn = false;
  return wrappedGds.Shape.getStateStyles(...args);
};

export default wrappedGds;
