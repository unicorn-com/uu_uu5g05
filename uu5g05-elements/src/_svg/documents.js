//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes } from "uu5g05";
import Config from "../config/config.js";
//@@viewOff:imports

const Documents = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Documents",
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
    const uu5Tag = Documents.uu5Tag;
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
            d="m76.9661 69.5083 63.5479-8.9311c.525-.0738 1.057.0639 1.481.3826l40.037 30.1362 13.36 95.066c1.384 9.844-5.475 18.946-15.319 20.33l-82.231 11.556c-9.8444 1.384-18.9464-5.475-20.3299-15.319l-15.8657-112.8908c-1.3836-9.8444 5.4753-18.9464 15.3197-20.3299z"
          />
          <path
            id={uu5Tag + "-b"}
            d="m140.067 85.0709 63.821 6.7078c.527.0554 1.011.3178 1.344.7296l31.557 38.9267-10.034 95.474c-1.04 9.887-9.897 17.059-19.783 16.02l-82.584-8.68c-9.887-1.039-17.059-9.896-16.02-19.783l11.916-113.375c1.039-9.8869 9.896-17.0592 19.783-16.0201z"
          />
          <filter id={uu5Tag + "-c"} height="129.7%" width="136.6%" x="-18.3%" y="-13.6%">
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
          <path
            d="m142.777 61.1541 38.153 28.7504c1.022.7698 1.226 2.2219.456 3.2434-.37.4906-.919.8142-1.527.8997l-21.254 2.9869c-8.003 1.1249-15.403-4.4514-16.528-12.4549l-2.987-21.2535c-.178-1.2666.704-2.4378 1.971-2.6158.608-.0855 1.226.0742 1.716.4438z"
            fill="currentColor"
          />
          <use fill="#000" filter={"url(#" + uu5Tag + "-c)"} xlinkHref={"#" + uu5Tag + "-b"} />
          <use fill="#fff" fillRule="evenodd" xlinkHref={"#" + uu5Tag + "-b"} />
          <path
            d="m205.902 92.8218 30.161 37.2452c.807.998.654 2.461-.344 3.268-.479.388-1.092.57-1.705.505l-21.413-2.25c-8.064-.848-13.914-8.072-13.066-16.135l2.251-21.4139c.134-1.2762 1.277-2.202 2.553-2.0678.613.0644 1.175.3696 1.563.8485z"
            fill="currentColor"
          />
        </g>
      </svg>
    );
    //@@viewOff:render
  },
});

export { Documents };
export default Documents;
