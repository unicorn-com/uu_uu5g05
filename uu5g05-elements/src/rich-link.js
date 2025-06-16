//@@viewOn:imports
import { createVisualComponent, PropTypes, useDataObject, useLanguage } from "uu5g05";
import Config from "./config/config.js";
import Calls from "./calls.js";
import RichLinkView from "./_internal/rich-link-view.js";
//@@viewOff:imports

//@@viewOn:constants
const { data, ...propTypes } = RichLinkView.propTypes;
const { data: _d, ...defaultProps } = RichLinkView.defaultProps;
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const RichLink = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "RichLink",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...propTypes,
    href: PropTypes.string.isRequired,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...defaultProps,
    href: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { href } = props;
    const [language] = useLanguage();

    const { data, state } = useDataObject(
      {
        initialDtoIn: { url: href, language },
        handlerMap: {
          load: (dtoIn) => (dtoIn.url ? Calls.plus4UGoWebsiteMetadataLoad(dtoIn) : null),
        },
      },
      [href, language],
    );
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return data || state === "error" || state === "errorNoData" || !href ? (
      <RichLinkView {...props} data={state === "error" ? null : data} />
    ) : null;
    //@@viewOff:render
  },
});

export { RichLink };
export default RichLink;
