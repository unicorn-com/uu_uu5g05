import { PropTypes } from "uu5g05";
import _MenuItem from "./menu-item.js";

const item = PropTypes.shape({
  ..._MenuItem.propTypes,
  component: PropTypes.oneOfType([PropTypes.func, PropTypes.element]),
  collapsible: PropTypes.oneOfType([PropTypes.bool, PropTypes.oneOf(["tree"])]),
  collapsibleColorScheme: PropTypes.colorScheme("building", "meaning", "basic"),
  divider: PropTypes.bool,
  itemList: PropTypes.array,
});

const itemList = PropTypes.arrayOf(item);

export { item, itemList };
export default { item, itemList };
