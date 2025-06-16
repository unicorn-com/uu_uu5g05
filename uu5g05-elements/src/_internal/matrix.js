//@@viewOn:imports
import { createVisualComponent, PropTypes } from "uu5g05";
import Config from "../config/config.js";
import UuGds from "./gds.js";
import Grid from "../grid.js";
//@@viewOff:imports

const Matrix = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Matrix",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    component: PropTypes.any.isRequired,
    matrix: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.object)).isRequired,
    gapSize: PropTypes.oneOf(["a", "b", "c", "d"]),
    noGaps: PropTypes.bool,
    componentProps: PropTypes.object,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    gapSize: "b",
    noGaps: false,
    componentProps: undefined,
  },
  //@@viewOff:defaultProps
  //@@viewOn:render
  render(props) {
    const { gapSize, component, matrix, componentProps, ...otherProps } = props;
    let MatrixItem = component;

    // all rows has same length - otherwise it is not a matrix
    const rows = matrix[0].length;
    const columns = matrix.length;
    const gridContent = new Array(rows * columns);
    for (let rowIndex = 0, index = 0; rowIndex < rows; rowIndex++) {
      for (let columnIndex = 0; columnIndex < columns; columnIndex++, index++) {
        let itemProps = { key: `${rowIndex}-${columnIndex}`, ...componentProps, ...matrix[columnIndex][rowIndex] };
        let { key } = itemProps;
        delete itemProps.key;

        gridContent[index] = itemProps ? (
          <MatrixItem key={key} {...itemProps} />
        ) : (
          <span key={`${rowIndex}-${columnIndex}`} />
        );
      }
    }

    const gaps = props.noGaps ? 0 : UuGds.SpacingPalette.getValue(["fixed", gapSize]);
    const templateColumns = `repeat(${columns}, 1fr)`;

    return (
      <Grid {...otherProps} templateColumns={templateColumns} rowGap={gaps} columnGap={gaps}>
        {gridContent}
      </Grid>
    );
  },
});

export { Matrix };
export default Matrix;
