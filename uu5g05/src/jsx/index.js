// used due to uu5devkitg01-plugin's .babelrc config regarding @babel/preset-react preset

// used by React's JSX transpilation plugin in case that we have e.g. class-based component
// with static defaultProps or in case when key is after spread, i.e. <Comp {...props} key="abc" />
// (this might be actually kind of a bug on React's 19.0.0 side regarding defaultProps processing
// because <Comp {...props} key="abc" /> does use "createElement" which processes also Comp.defaultProps,
// whereas <Comp key="abc" {...props} /> doesn't use "createElement" and doesn't process Comp.defaultProps)
import Element from "../utils/element.js";
const { create: createElement } = Element;

export { createElement };
