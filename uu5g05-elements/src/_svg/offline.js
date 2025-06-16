//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes } from "uu5g05";
import Config from "../config/config.js";
//@@viewOff:imports

const Offline = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Offline",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    color: PropTypes.string,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    color: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { color } = props;
    const uu5Tag = Offline.uu5Tag;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props);

    return (
      <svg
        {...attrs}
        style={{ color }}
        height="300"
        viewBox="0 0 300 300"
        width="300"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        <defs>
          <rect id={uu5Tag + "-a"} height="176" rx="12" width="98.89851" />
          <filter id={uu5Tag + "-b"} height="126.7%" width="147.5%" x="-23.8%" y="-12.2%">
            <feOffset dx="0" dy="2" in="SourceAlpha" result="shadowOffsetOuter1" />
            <feGaussianBlur in="shadowOffsetOuter1" result="shadowBlurOuter1" stdDeviation="7.5" />
            <feColorMatrix
              in="shadowBlurOuter1"
              type="matrix"
              values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.12 0"
            />
          </filter>
          <rect id={uu5Tag + "-c"} height="164.3" rx="8" width="87.19" x="5.854255" y="5.85" />
          <mask id={uu5Tag + "-d"} fill="#fff">
            <use fill="#fff" fillRule="evenodd" xlinkHref={"#" + uu5Tag + "-c"} />
          </mask>
        </defs>
        <g
          fill="none"
          fillRule="evenodd"
          transform="matrix(.9945219 .10452846 -.10452846 .9945219 110.020138 57.313219)"
        >
          <use fill="#000" filter={"url(#" + uu5Tag + "-b)"} xlinkHref={"#" + uu5Tag + "-a"} />
          <use fill="#fff" fillRule="evenodd" xlinkHref={"#" + uu5Tag + "-a"} />
          <g fillRule="nonzero">
            <g>
              <use fill="currentColor" xlinkHref={"#" + uu5Tag + "-c"} />
              <use fill="#fff" fillOpacity=".6" xlinkHref={"#" + uu5Tag + "-c"} />
            </g>
            <path
              d="m30.2092549 70-2.56 2.54 2.94 2.94c-.86.52-1.72 1.1-2.54 1.72l3.6 4.8c1.06-.8 2.16-1.5 3.32-2.14l4.46 4.46c-1.48.68-2.9 1.5-4.18 2.48l3.6 4.8c1.56-1.16 3.32-2.06 5.2-2.66l5.1 5.06c-2.5.14-4.82 1-6.7 2.4l7.2 9.6 4.92-6.54 6.56 6.54 2.52-2.56m-14-33.44c-4.3 0-8.4.76-12.2 2.14l4.78 4.8c2.42-.62 4.86-.94 7.42-.94 6.76 0 13 2.22 18 6l3.6-4.8c-6.02-4.52-13.48-7.2-21.6-7.2m0 12c-.76 0-1.5 0-2.24.1l6.38 6.4c2.44.56 4.72 1.64 6.66 3.1l3.6-4.8c-4-3.02-9-4.8-14.4-4.8z"
              fill="currentColor"
              mask={"url(#" + uu5Tag + "-d)"}
            />
          </g>
        </g>
      </svg>
    );
    //@@viewOff:render
  },
});

export { Offline };
export default Offline;
