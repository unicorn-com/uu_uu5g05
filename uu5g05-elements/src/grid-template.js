//@@viewOn:imports
import { createVisualComponent, PropTypes, useContentSizeValue } from "uu5g05";
import Config from "./config/config.js";
import GridItem from "./grid-item.js";
import Grid from "./grid.js";
//@@viewOff:imports

//@@viewOn:helpers
const getUniqueAreaNamesFromLayout = (layout) => {
  // Match anything but white spaces, dots and commas
  const uniqueAreaNames = new Set(layout.match(/([^\s.,]+)/gi));
  return Array.from(uniqueAreaNames);
};

const filterContentMapByKeys = (contentMap, keys) => {
  const filteredContentMap = {};
  keys.forEach((key) => (filteredContentMap[key] = contentMap[key]));
  return filteredContentMap;
};
//@@viewOff:helpers

const GridTemplate = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "GridTemplate",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...Grid.PropTypes,
    templateAreas: PropTypes.sizeOf(PropTypes.string).isRequired,
    contentMap: PropTypes.object.isRequired,
    contentStyleMap: PropTypes.object,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    templateAreas: undefined,
    contentMap: {},
    contentStyleMap: {},
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children, templateAreas, contentMap, contentStyleMap, ...gridProps } = props;
    const layout = useContentSizeValue(templateAreas);
    //@@viewOff:private

    //@@viewOn:render
    let result = null;

    if (layout) {
      const filteredContentMap = filterContentMapByKeys(contentMap, getUniqueAreaNamesFromLayout(layout));
      const renderedItems = Object.entries(filteredContentMap).map(([key, content]) => {
        const componentProps = { style: { ...contentStyleMap[key], gridArea: key } };
        return typeof content === "function" ? (
          content({ key, ...componentProps })
        ) : (
          <GridItem key={key} {...componentProps}>
            {content}
          </GridItem>
        );
      });

      result = (
        <Grid {...gridProps} templateAreas={layout}>
          {typeof children === "function"
            ? (gridProps) => children({ ...gridProps, children: renderedItems })
            : renderedItems}
        </Grid>
      );
    }

    return result;
    //@@viewOff:render
  },
});

export { GridTemplate };
export default GridTemplate;
