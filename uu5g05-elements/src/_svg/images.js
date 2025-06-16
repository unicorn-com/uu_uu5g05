//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes } from "uu5g05";
import Config from "../config/config.js";
//@@viewOff:imports

const Images = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Images",
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
    const uu5Tag = Images.uu5Tag;
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
          <path
            id={uu5Tag + "-a"}
            d="m82.2861 82.8252c.9186-4.3218 5.1668-7.0805 9.4885-6.1619l140.8534 29.9397c4.322.918 7.08 5.166 6.162 9.488l-21.623 101.727c-.919 4.322-5.167 7.081-9.489 6.162l-140.8528-29.939c-4.3217-.919-7.0805-5.167-6.1619-9.488z"
          />
          <filter id={uu5Tag + "-b"} height="131.8%" width="126.3%" x="-13.2%" y="-14.6%">
            <feOffset dx="0" dy="2" in="SourceAlpha" result="shadowOffsetOuter1" />
            <feGaussianBlur in="shadowOffsetOuter1" result="shadowBlurOuter1" stdDeviation="7.5" />
            <feColorMatrix
              in="shadowBlurOuter1"
              type="matrix"
              values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.12 0"
            />
          </filter>
          <path
            id={uu5Tag + "-c"}
            d="m69.7265 98.3218c0-4.4183 3.5817-8 8-8h144.0005c4.418 0 8 3.5817 8 8v104.0002c0 4.418-3.582 8-8 8h-144.0005c-4.4183 0-8-3.582-8-8z"
          />
          <filter id={uu5Tag + "-d"} height="139.2%" width="129.4%" x="-14.7%" y="-17.9%">
            <feOffset dx="0" dy="2" in="SourceAlpha" result="shadowOffsetOuter1" />
            <feGaussianBlur in="shadowOffsetOuter1" result="shadowBlurOuter1" stdDeviation="7.5" />
            <feColorMatrix
              in="shadowBlurOuter1"
              type="matrix"
              values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.12 0"
            />
          </filter>
          <path
            id={uu5Tag + "-e"}
            d="m77.7265 104.322c0-3.314 2.6863-6.0002 6-6.0002h132.0005c3.313 0 6 2.6862 6 6.0002v92c0 3.313-2.687 6-6 6h-132.0005c-3.3137 0-6-2.687-6-6z"
          />
        </defs>
        <g fill="none" fillRule="evenodd">
          <use fill="#000" filter={"url(#" + uu5Tag + "-b)"} xlinkref={"#" + uu5Tag + "-a"} />
          <use fill="#fff" fillRule="evenodd" xlinkref={"#" + uu5Tag + "-a"} />
          <use fill="#000" filter={"url(#" + uu5Tag + "-d)"} xlinkref={"#" + uu5Tag + "-c"} />
          <use fill="#fff" fillRule="evenodd" xlinkref={"#" + uu5Tag + "-c"} />
          <g fillRule="nonzero">
            <g>
              <use fill="currentColor" xlinkref={"#" + uu5Tag + "-e"} />
              <use fill="#fff" fillOpacity=".6" xlinkref={"#" + uu5Tag + "-e"} />
            </g>
            <path
              d="m77.7265 186 30.1715-24.028c1.994-1.587 4.773-1.742 6.931-.386l27.142 17.061c2.462 1.547 5.68 1.107 7.635-1.046l37.098-40.85c2.223-2.448 6.009-2.635 8.463-.418l26.56 23.989v36c0 3.313-2.687 6-6 6h-132.0005c-3.3137 0-6-2.687-6-6z"
              fill="currentColor"
            />
            <circle cx="133.727" cy="129.322" fill="currentColor" r="16" />
          </g>
        </g>
      </svg>
    );
    //@@viewOff:render
  },
});

export { Images };
export default Images;
