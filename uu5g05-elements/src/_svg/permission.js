//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes } from "uu5g05";
import Config from "../config/config.js";
//@@viewOff:imports

const Permission = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Permission",
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
    const uu5Tag = Permission.uu5Tag;
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
            d="m150 56.14c24.908 0 45.1 20.192 45.1 45.1v75.9c0 24.908-20.192 45.1-45.1 45.1s-45.1-20.192-45.1-45.1v-75.9c0-24.9081 20.192-45.1 45.1-45.1zm1.7 18.7h-3.4c-13.034 0-23.6 10.5661-23.6 23.6v78.2c0 13.034 10.566 23.6 23.6 23.6h3.4c13.034 0 23.6-10.566 23.6-23.6v-78.2c0-13.0339-10.566-23.6-23.6-23.6z"
          />
          <path id={uu5Tag + "-b"} d="m95 128h110v98h-110z" />
          <filter id={uu5Tag + "-c"} height="148%" width="142.7%" x="-21.4%" y="-21.9%">
            <feOffset dx="0" dy="2" in="SourceAlpha" result="shadowOffsetOuter1" />
            <feGaussianBlur in="shadowOffsetOuter1" result="shadowBlurOuter1" stdDeviation="7.5" />
            <feColorMatrix
              in="shadowBlurOuter1"
              type="matrix"
              values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.12 0"
            />
          </filter>
        </defs>
        <g fill="none" fillRule="evenodd">
          <g fillRule="nonzero">
            <use fill="currentColor" xlinkHref={"#" + uu5Tag + "-a"} />
            <use fill="#fff" fillOpacity=".6" xlinkHref={"#" + uu5Tag + "-a"} />
          </g>
          <use fill="#000" filter={"url(#" + uu5Tag + "-c)"} xlinkHref={"#" + uu5Tag + "-b"} />
          <use fill="#fff" fillRule="evenodd" xlinkHref={"#" + uu5Tag + "-b"} />
          <path
            d="m155.582 176.878c3.873-2.017 6.518-6.069 6.518-10.738 0-6.683-5.417-12.1-12.1-12.1s-12.1 5.417-12.1 12.1c0 4.669 2.645 8.721 6.518 10.738l-5.418 18.962h22z"
            fill="currentColor"
          />
        </g>
      </svg>
    );
    //@@viewOff:render
  },
});

export { Permission };
export default Permission;
