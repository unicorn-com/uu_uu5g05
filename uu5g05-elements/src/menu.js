//@@viewOn:imports
import { createVisualComponent, PropTypes, useState, Content } from "uu5g05";
import Config from "./config/config.js";
import MenuList from "./menu-list.js";
import Modal from "./modal.js";
import TouchIconList from "./_menu/touch-icon-list.js";
import InfoItemList from "./_menu/info-item-list.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const Menu = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Menu",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    itemList: PropTypes.arrayOf(
      PropTypes.shape({
        icon: PropTypes.string,
        colorScheme: PropTypes.colorScheme,
        significance: PropTypes.oneOf(["common", "highlighted", "distinct", "subdued"]),
        itemList: PropTypes.array,
        divider: PropTypes.bool,
        initialCollapsed: PropTypes.bool,
        children: PropTypes.node,
        href: PropTypes.string,
        target: PropTypes.string,
        modalContent: PropTypes.node,
        component: PropTypes.oneOfType([PropTypes.func, PropTypes.element]),
        onClick: PropTypes.func,
      }),
    ),
    itemDisplayType: PropTypes.oneOf(["menu-item", "touch-icon", "info-item"]),
    itemSignificance: PropTypes.oneOf(["common", "highlighted", "distinct", "subdued"]),
    itemSize: PropTypes.oneOf(["xs", "s", "m", "l", "xl"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    itemList: undefined,
    itemDisplayType: "menu-item",
    itemSize: "m",
    itemSignificance: "common",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { itemDisplayType, itemList: itemListProp, itemSize, itemSignificance, ...otherProps } = props;

    const [modalContent, setModalContent] = useState(null);

    function getItemList(itemList = []) {
      const newItemList = [];

      for (let item of itemList) {
        const { modalContent, href, target, itemList, significance, ...others } = item;
        if (item.divider && itemDisplayType !== "menu-item") continue;

        const newItem = { ...others, significance: significance ?? itemSignificance, size: itemSize };

        if (itemList?.length) {
          newItem.itemList = getItemList(itemList);
          newItem.collapsible = true;
        }

        if (href) {
          newItem.href = href;
          newItem.target = target;
        } else if (modalContent) {
          newItem.onClick = () =>
            setModalContent({
              children: modalContent,
              header: item.children,
            });
        }

        newItemList.push(newItem);
      }

      return newItemList;
    }
    //@@viewOff:private

    //@@viewOn:render
    let Component;

    switch (itemDisplayType) {
      case "touch-icon":
        Component = TouchIconList;
        break;
      case "info-item":
        Component = InfoItemList;
        break;
      default:
        Component = MenuList;
    }

    if (!itemListProp?.length) return null;

    return (
      <>
        <Component {...otherProps} itemList={getItemList(itemListProp)} />
        {modalContent && (
          <Modal open onClose={() => setModalContent(null)} header={modalContent.header}>
            <Content>{modalContent.children}</Content>
          </Modal>
        )}
      </>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Menu };
export default Menu;
//@@viewOff:exports
