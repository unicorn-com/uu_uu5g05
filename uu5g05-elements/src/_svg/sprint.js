//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes } from "uu5g05";
import Config from "../config/config.js";
//@@viewOff:imports

const Sprint = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Sprint",
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
    const uu5Tag = Sprint.uu5Tag;
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
            d="m182.985 196h44.015v11.761c0 3.59 4.364 5.363 6.867 2.789l21.17-21.761c1.51-1.553 1.51-4.026 0-5.579l-21.17-21.761c-2.503-2.574-6.867-.801-6.867 2.789v11.762h-20.009c-1.873 2.426-3.903 4.735-6.079 6.912-5.272 5.271-11.322 9.684-17.927 13.088z"
          />
          <filter id={uu5Tag + "-b"} height="191.2%" width="164.2%" x="-32.1%" y="-41.7%">
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
            d="m175.641 86.1279c.195-2.1574 2.072-3.7674 4.234-3.6318l30.3 1.9004c3.584.2247 5.079 4.6908 2.354 7.0283l-8.084 6.934c4.798 7.7652 7.898 16.4972 9.05 25.6202 1.522 12.049-.415 24.282-5.586 35.271s-13.362 20.28-23.616 26.787-22.148 9.963-34.293 9.963h-86c-2.2091 0-4-1.791-4-4v-12c0-2.209 1.7909-4 4-4h86c8.35 0 16.527-2.376 23.576-6.85 7.05-4.473 12.681-10.861 16.236-18.416s4.888-15.965 3.841-24.249c-.659-5.219-2.246-10.253-4.661-14.871l-9.498 8.147c-2.725 2.337-6.912.179-6.588-3.397z"
          />
        </defs>
        <g fill="none" fillRule="evenodd">
          <use fill="#000" filter={"url(#" + uu5Tag + "-b)"} xlinkHref={"#" + uu5Tag + "-a"} />
          <use fill="#fff" fillRule="evenodd" xlinkHref={"#" + uu5Tag + "-a"} />
          <path
            d="m182.084 76.6229c-4.551-2.6367-9.435-4.7171-14.551-6.1743-12.668-3.6087-26.141-3.2206-38.58 1.1113-12.44 4.3319-23.24 12.3966-30.9263 23.0935-7.049 9.8096-11.1647 21.3946-11.9054 33.4076l-12.0859 1.698c-3.5554.5-4.7032 5.068-1.8063 7.189l24.496 17.935c1.7478 1.279 4.1969.935 5.5239-.777l18.604-23.992c2.2-2.837-.163-6.912-3.718-6.412l-10.605 1.491c1.061-6.78 3.7-13.248 7.738-18.869 5.285-7.3539 12.71-12.8984 21.262-15.8766 8.552-2.9781 17.815-3.2449 26.524-.764 2.416.6883 4.757 1.5787 7.001 2.6565l.61-6.7525c.488-5.3935 5.181-9.4185 10.586-9.0795z"
            fill="currentColor"
          />
          <g fillRule="nonzero">
            <use fill="currentColor" xlinkHref={"#" + uu5Tag + "-c"} />
            <use fill="#fff" fillOpacity=".6" xlinkHref={"#" + uu5Tag + "-c"} />
          </g>
        </g>
      </svg>
    );
    //@@viewOff:render
  },
});

export { Sprint };
export default Sprint;
