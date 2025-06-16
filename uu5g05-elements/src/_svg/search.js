//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes } from "uu5g05";
import Config from "../config/config.js";
//@@viewOff:imports

const Search = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Search",
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
    const uu5Tag = Search.uu5Tag;
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
            d="m165.252 168.017c26.654-22.365 30.13-62.102 7.765-88.7562-22.365-26.6537-62.102-30.1303-88.7562-7.7652-26.6537 22.3651-30.1303 62.1024-7.7652 88.7564s62.1024 30.13 88.7564 7.765zm-7.071-8.426c22-18.46 24.87-51.26 6.41-73.2595-18.46-21.9999-51.26-24.8695-73.2595-6.4094-21.9999 18.4601-24.8695 51.2589-6.4094 73.2589 18.4599 22 51.2589 24.87 73.2589 6.41zm13.305 34.525c-2.84-3.385-2.398-8.431.986-11.271l1.533-1.285-7.714-9.193 3.064-2.571 7.714 9.192 1.532-1.285c3.384-2.84 8.43-2.399 11.27.986l30.854 36.77c2.84 3.385 2.399 8.431-.986 11.271l-6.128 5.142c-3.385 2.84-8.431 2.398-11.271-.986z"
          />
          <filter id={uu5Tag + "-b"} height="126.6%" width="129.2%" x="-14.6%" y="-12.1%">
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
            d="m157.672 93.5659c-.108-.1321-.217-.2638-.327-.395-14.91-17.7691-41.402-20.0868-59.1712-5.1767-17.7691 14.9098-20.0868 41.4018-5.1768 59.1708 1.3854 1.651 2.8708 3.169 4.4398 4.552-8.6725-17.737-4.5364-39.746 11.2692-53.0084 14.156-11.8781 33.596-13.3196 48.966-5.1427z"
          />
        </defs>
        <g fill="none" fillRule="evenodd">
          <use fill="#000" filter={"url(#" + uu5Tag + "-b)"} xlinkHref={"#" + uu5Tag + "-a"} />
          <use fill="#fff" fillRule="evenodd" xlinkHref={"#" + uu5Tag + "-a"} />
          <g fillRule="nonzero">
            <g>
              <use fill="currentColor" xlinkHref={"#" + uu5Tag + "-c"} />
              <use fill="#fff" fillOpacity=".6" xlinkHref={"#" + uu5Tag + "-c"} />
            </g>
            <path
              d="m171.486 194.116c-2.84-3.385-2.398-8.431.986-11.271l6.129-5.142c3.384-2.84 8.43-2.399 11.27.986l30.854 36.77c2.84 3.385 2.399 8.431-.986 11.271l-6.128 5.142c-3.385 2.84-8.431 2.398-11.271-.986z"
              fill="currentColor"
            />
          </g>
        </g>
      </svg>
    );
    //@@viewOff:render
  },
});

export { Search };
export default Search;
