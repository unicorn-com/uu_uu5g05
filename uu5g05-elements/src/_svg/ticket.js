//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes } from "uu5g05";
import Config from "../config/config.js";
//@@viewOff:imports

const Ticket = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Ticket",
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
    const uu5Tag = Ticket.uu5Tag;
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
            d="m83.3333 179h-21.3333c-6.6274 0-12 5.373-12 12s5.3726 12 12 12h176c6.627 0 12-5.373 12-12s-5.373-12-12-12h-22.401v-99.654c0-1.5128-1.615-2.4779-2.948-1.7615l-12.639 6.7952c-.591.3179-1.302.3179-1.894 0l-14.639-7.8705c-.591-.318-1.302-.318-1.894 0l-14.639 7.8705c-.591.3179-1.303.3179-1.894 0l-14.639-7.8705c-.591-.318-1.303-.318-1.894 0l-14.639 7.8705c-.592.3179-1.303.3179-1.894 0l-14.639-7.8705c-.592-.318-1.303-.318-1.894 0l-14.639 7.8705c-.592.3179-1.3032.3179-1.8946 0l-12.639-6.7952c-1.3324-.7164-2.9471.2487-2.9471 1.7615z"
          />
          <filter id={uu5Tag + "-b"} height="137.1%" width="123.5%" x="-11.8%" y="-17%">
            <feOffset dx="0" dy="2" in="SourceAlpha" result="shadowOffsetOuter1" />
            <feGaussianBlur in="shadowOffsetOuter1" result="shadowBlurOuter1" stdDeviation="7.5" />
            <feColorMatrix
              in="shadowBlurOuter1"
              type="matrix"
              values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.12 0"
            />
          </filter>
          <linearGradient id={uu5Tag + "-c"} x1="50%" x2="50%" y1="0%" y2="100%">
            <stop offset="0" stopOpacity="0" />
            <stop offset="1" />
          </linearGradient>
          <path
            id={uu5Tag + "-d"}
            d="m105.556 143.333c0-2.209 1.79-4 4-4h80.888c2.21 0 4 1.791 4 4v.889c0 2.209-1.79 4-4 4h-80.888c-2.21 0-4-1.791-4-4z"
          />
          <path
            id={uu5Tag + "-e"}
            d="m105.556 161.111c0-2.209 1.79-4 4-4h80.888c2.21 0 4 1.791 4 4v.889c0 2.209-1.79 4-4 4h-80.888c-2.21 0-4-1.791-4-4z"
          />
          <path
            id={uu5Tag + "-f"}
            d="m105.556 125.556c0-2.21 1.79-4 4-4h80.888c2.21 0 4 1.79 4 4v.888c0 2.21-1.79 4-4 4h-80.888c-2.21 0-4-1.79-4-4z"
          />
          <mask id={uu5Tag + "-g"} fill="#fff">
            <use fill="#fff" fillRule="evenodd" xlinkHref={"#" + uu5Tag + "-a"} />
          </mask>
        </defs>
        <g fill="none" fillRule="evenodd">
          <use fill="#000" filter={"url(#" + uu5Tag + "-b)"} xlinkHref={"#" + uu5Tag + "-a"} />
          <use fill="currentColor" fillRule="evenodd" xlinkHref={"#" + uu5Tag + "-a"} />
          <path
            d="m215.599 203v-123.654c0-1.5128-1.615-2.4779-2.948-1.7615l-12.639 6.7952c-.591.3179-1.302.3179-1.894 0l-14.639-7.8705c-.591-.318-1.302-.318-1.894 0l-14.639 7.8705c-.591.3179-1.303.3179-1.894 0l-14.639-7.8705c-.591-.318-1.303-.318-1.894 0l-14.639 7.8705c-.592.3179-1.303.3179-1.894 0l-14.639-7.8705c-.592-.318-1.303-.318-1.894 0l-14.639 7.8705c-.592.3179-1.3032.3179-1.8946 0l-12.639-6.7952c-1.3324-.7164-2.9471.2487-2.9471 1.7615v123.654z"
            fill="#fff"
            mask={"url(#" + uu5Tag + "-g)"}
          />
          <path
            d="m238 203c6.627 0 12-5.373 12-12h-200c0 6.627 5.3726 12 12 12z"
            fill={"url(#" + uu5Tag + "-c)"}
            fillOpacity=".15"
            mask={"url(#" + uu5Tag + "-g)"}
          />
          <g fillRule="nonzero">
            <g mask={"url(#" + uu5Tag + "-g)"}>
              <use fill="currentColor" xlinkHref={"#" + uu5Tag + "-d"} />
              <use fill="#fff" fillOpacity=".6" xlinkHref={"#" + uu5Tag + "-d"} />
            </g>
            <g mask={"url(#" + uu5Tag + "-g)"}>
              <use fill="currentColor" xlinkHref={"#" + uu5Tag + "-e"} />
              <use fill="#fff" fillOpacity=".6" xlinkHref={"#" + uu5Tag + "-e"} />
            </g>
            <g mask={"url(#" + uu5Tag + "-g)"}>
              <use fill="currentColor" xlinkHref={"#" + uu5Tag + "-f"} />
              <use fill="#fff" fillOpacity=".6" xlinkHref={"#" + uu5Tag + "-f"} />
            </g>
          </g>
        </g>
      </svg>
    );
    //@@viewOff:render
  },
});

export { Ticket };
export default Ticket;
