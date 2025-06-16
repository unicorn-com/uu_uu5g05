//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes } from "uu5g05";
import Config from "../config/config.js";
//@@viewOff:imports

const Error = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Error",
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
    const uu5Tag = Error.uu5Tag;
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
          <linearGradient id={uu5Tag + "-a"} x1="50%" x2="50%" y1="0%" y2="100%">
            <stop offset="0" stopOpacity="0" />
            <stop offset="1" />
          </linearGradient>
          <path id={uu5Tag + "-b"} d="m70.15085 120.64602h36.3l5.5 36.3h-47.3z" />
          <rect id={uu5Tag + "-c"} height="6.6" rx="3.3" width="89.1" x="43.75085" y="153.64602" />
          <path
            id={uu5Tag + "-d"}
            d="m0 8.8c0-4.86013 3.93987-8.8 8.8-8.8h158.40055c4.8598 0 8.8 3.93987 8.8 8.8v114.40022c0 4.8598-3.9402 8.8-8.8 8.8h-158.40055c-4.86013 0-8.8-3.9402-8.8-8.8z"
          />
          <filter id={uu5Tag + "-e"} height="140.2%" width="130.1%" x="-15.1%" y="-18.6%">
            <feOffset dx="0" dy="2" in="SourceAlpha" result="shadowOffsetOuter1" />
            <feGaussianBlur in="shadowOffsetOuter1" result="shadowBlurOuter1" stdDeviation="8.5" />
            <feColorMatrix
              in="shadowBlurOuter1"
              type="matrix"
              values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.12 0"
            />
          </filter>
          <path
            id={uu5Tag + "-f"}
            d="m8.8 15.40022c0-3.6454 2.95493-6.60022 6.6-6.60022h145.20055c3.6443 0 6.6 2.95482 6.6 6.60022v101.2c0 3.6443-2.9557 6.6-6.6 6.6h-145.20055c-3.64507 0-6.6-2.9557-6.6-6.6z"
          />
        </defs>
        <g fill="none" fillRule="evenodd" transform="translate(61.726475 76.03789)">
          <use fill="currentColor" xlinkHref={"#" + uu5Tag + "-b"} />
          <use fill="#fff" fillOpacity=".6" xlinkHref={"#" + uu5Tag + "-b"} />
          <use fill={"url(#" + uu5Tag + "-a)"} fillOpacity=".15" xlinkHref={"#" + uu5Tag + "-b"} />
          <g fillRule="nonzero">
            <use fill="currentColor" xlinkHref={"#" + uu5Tag + "-c"} />
            <use fill="#fff" fillOpacity=".6" xlinkHref={"#" + uu5Tag + "-c"} />
          </g>
          <use fill="#000" filter={"url(#" + uu5Tag + "-e)"} xlinkHref={"#" + uu5Tag + "-d"} />
          <use fill="#fff" fillRule="evenodd" xlinkHref={"#" + uu5Tag + "-d"} />
          <g fillRule="nonzero">
            <g>
              <use fill="currentColor" xlinkHref={"#" + uu5Tag + "-f"} />
              <use fill="#fff" fillOpacity=".6" xlinkHref={"#" + uu5Tag + "-f"} />
            </g>
            <path
              d="m87.75085 79.39602c11.9382566 0 23.875149 1.1190836 35.808152 3.3565218 1.791324.3358731 2.971199 2.0603068 2.635326 3.8516304-.335873 1.7913235-2.060307 2.9711992-3.85163 2.635326-11.533663-2.1625618-23.0634379-3.2434782-34.591848-3.2434782s-23.0581846 1.0809164-34.5918478 3.2434782c-1.7913236.3358732-3.5157573-.8440025-3.8516304-2.635326-.3358732-1.7913236.8440025-3.5157573 2.635326-3.8516304 11.9330035-2.2374382 23.8698956-3.3565218 35.8081522-3.3565218zm-10.45-34.65c1.2150264 0 2.2.9849736 2.2 2.2v13.2c0 1.2150264-.9849736 2.2-2.2 2.2h-4.4c-1.2150264 0-2.2-.9849736-2.2-2.2v-13.2c0-1.2150264.9849736-2.2 2.2-2.2zm26.4 0c1.215026 0 2.2.9849736 2.2 2.2v13.2c0 1.2150264-.984974 2.2-2.2 2.2h-4.4c-1.2150264 0-2.2-.9849736-2.2-2.2v-13.2c0-1.2150264.9849736-2.2 2.2-2.2z"
              fill="currentColor"
            />
          </g>
        </g>
      </svg>
    );
    //@@viewOff:render
  },
});

export { Error };
export default Error;
