//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes } from "uu5g05";
import Config from "../config/config.js";
//@@viewOff:imports

const Activities = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Activities",
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
    const uu5Tag = Activities.uu5Tag;
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
            d="m231.351 81.664c-2.541-5.2874-7.885-8.6538-13.752-8.664h-88.007c-8.385.0132-15.179 6.8071-15.192 15.1919v81.9361c.013 8.384 6.807 15.178 15.192 15.191h88.007c5.867-.01 11.211-3.376 13.752-8.664l19.512-40.967c1.962-4.133 1.953-8.931-.024-13.056z"
          />
          <path
            id={uu5Tag + "-b"}
            d="m109.568 128c-34.4881 0-62.568 22.32-62.568 49.752.0533 8.599 2.7421 16.976 7.704 24l-7.536 22.608c-.2595.849-.0287 1.772.6 2.4.606.601 1.6088.854 2.448.696l24.7199-8.232c10.6991 5.534 22.5864 8.376 34.6321 8.28 34.488 0 62.567-22.32 62.567-49.752s-28.079-49.752-62.567-49.752z"
          />
          <filter id={uu5Tag + "-c"} height="147.2%" width="137.6%" x="-18.8%" y="-21.6%">
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
            d="m202.552 109.48-33.384 33.264-17.688-17.688c-.541-.543-1.275-.847-2.04-.847-.766 0-1.5.304-2.04.847-.562.531-.885 1.268-.894194 2.042-.008806.773.296194 1.517.846194 2.062l19.728 19.728c.533.555 1.27.867 2.04.864021.768-.002021 1.504-.314021 2.04-.864021l35.352-35.352c.54-.536.845-1.267.845-2.028 0-.762-.305-1.492-.845-2.028-1.111-1.052-2.85-1.052-3.96 0z"
            fill="currentColor"
          />
          <use fill="#000" filter={"url(#" + uu5Tag + "-c)"} xlinkHref={"#" + uu5Tag + "-b"} />
          <use fill="#fff" fillRule="evenodd" xlinkHref={"#" + uu5Tag + "-b"} />
          <path
            d="m114.608 179.36c-.14 2.684-2.353 4.791-5.04 4.8-2.688-.009-4.9-2.116-5.04-4.8l-1.104-21.912c-.066-1.38.435-2.727 1.387-3.728.952-1.002 2.271-1.571 3.653-1.576h2.208c1.381.005 2.701.574 3.652 1.576.952 1.001 1.453 2.348 1.388 3.728zm-11.448 17.592c0-3.539 2.869-6.408 6.408-6.408 3.533.013 6.395 2.874 6.408 6.408 0 3.539-2.869 6.408-6.408 6.408s-6.408-2.869-6.408-6.408z"
            fill="currentColor"
          />
        </g>
      </svg>
    );
    //@@viewOff:render
  },
});

export { Activities };
export default Activities;
