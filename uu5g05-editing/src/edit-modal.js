//@@viewOn:imports
import {
  createComponent,
  Utils,
  useMemo,
  useState,
  usePreviousValue,
  useRef,
  useEffect,
  useLayoutEffect,
  useWillMount,
} from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import TabHelpers from "./_internal/edit-modal/tab-helpers.js";
import useItemInputStateList from "./_internal/edit-modal/use-item-input-state-list.js";
import { SYSTEM_PROP_MAP } from "./_internal/edit-modal/edit-modal-config.js";
import Config from "./config/config.js";
import EditModalView from "./_internal/edit-modal/edit-modal-view.js";
import EditModalHelpers from "./_internal/edit-modal/edit-modal-helpers.js";
//@@viewOff:imports

const EditModal = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "EditModal",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...EditModalView.propTypes,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...EditModalView.defaultProps,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      onSave,
      onBeforeSave,
      onReady,
      tabList: propsTabList,
      propInputMap,
      props: origComponentProps,
      itemUu5Tag,
      itemDefaultProps,
      itemPropName,
      itemTab: propsItemtab,
      open,
      componentType,
      nestingLevelList,
    } = props;

    if (process.env.NODE_ENV !== "production") {
      useWillMount(() => {
        EditModal.logger.error(
          `WARNING: This component is deprecated. It is recommended to use components from Uu5Editing instead. (https://uuapp.plus4u.net/uu-bookkit-maing01/5ee03d6a2be14b9f8d6e138b3ed3d250)`,
        );
      });
    }

    const componentProps = useMemo(() => {
      // due to dcc's generated id
      let componentProps = { ...origComponentProps };
      if (componentProps.generatedId) componentProps.id = undefined;
      delete componentProps.generatedId;
      return componentProps;
    }, [origComponentProps]);

    const dccId = origComponentProps.generatedId ? origComponentProps.id : undefined;

    let defaultProps = props.defaultProps ? props.defaultProps : componentType?.defaultProps;

    useEffect(() => {
      if (typeof onReady === "function") onReady?.();
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, []);

    const componentPropsWithDefaults = useMemo(
      () => ({ ...defaultProps, ...componentProps }),
      [componentProps, defaultProps],
    );

    const aggregatedPropMap = useMemo(() => TabHelpers.mergePropMaps(SYSTEM_PROP_MAP, propInputMap), [propInputMap]);

    const [itemMap, setItemMap] = useState();
    const itemListRef = useRef();

    const currentProps = useMemo(() => {
      if (!itemMap) return componentProps;
      let propList = {};
      for (let item in itemMap) {
        propList[item] = itemMap[item].value;
      }

      let { valueMapWithoutItemList, itemListValueMapList } = TabHelpers.splitFormValue(
        propList,
        itemListRef.current,
        true,
      );

      let { newCompProps, newItemPropsMap } = TabHelpers.getNewPropsByPropMap(
        aggregatedPropMap,
        valueMapWithoutItemList,
        false,
        itemListValueMapList,
        itemListRef.current,
        typeof propsTabList === "function"
          ? propsTabList({ componentProps, componentType, defaultProps })
          : propsTabList,
      );
      valueMapWithoutItemList = newCompProps;
      itemListValueMapList = newItemPropsMap;

      return { ...valueMapWithoutItemList, itemList: itemListValueMapList };
    }, [itemMap, componentProps, propsTabList, aggregatedPropMap, componentType, defaultProps]);

    const tabList = useMemo(() => {
      let tabList = propsTabList;
      if (typeof propsTabList === "function") {
        tabList = (arg) => propsTabList({ ...arg, componentProps: currentProps, componentType, defaultProps });
      }
      return tabList;
    }, [propsTabList, currentProps, componentType, defaultProps]);

    const categoryList = useMemo(() => {
      return TabHelpers.transformCategoryTabList(tabList, aggregatedPropMap);
    }, [tabList, aggregatedPropMap]);

    const itemTab = useMemo(() => {
      let itemTab = propsItemtab;
      if (typeof propsItemtab === "function") {
        itemTab = (arg) =>
          propsItemtab({ ...arg, componentProps: currentProps, componentType, defaultProps, itemDefaultProps });
      }
      return itemTab;
    }, [propsItemtab, currentProps, componentType, defaultProps, itemDefaultProps]);

    const itemInputStateParams = {
      componentProps: currentProps,
      itemPropName,
      itemDefaultProps,
      itemTab,
      itemUu5Tag,
      aggregatedPropMap,
      dccId,
    };
    const { itemList, manageItem } = useItemInputStateList(itemInputStateParams);
    itemListRef.current = itemList;

    const [initialValue] = useState(() =>
      EditModalHelpers.getInitialValue(
        componentPropsWithDefaults,
        aggregatedPropMap,
        tabList,
        componentProps,
        componentType,
        defaultProps,
        nestingLevelList,
        itemList,
        itemDefaultProps,
      ),
    );

    const _onSubmit = async (e) => {
      let { valueMapWithoutItemList: newComponentProps, itemListValueMapList } = TabHelpers.splitFormValue(
        e.data.value,
        itemList,
        false,
      );

      let { newCompProps, newItemPropsMap } = TabHelpers.getNewPropsByPropMap(
        aggregatedPropMap,
        newComponentProps,
        true,
        itemListValueMapList,
        itemList,
        typeof propsTabList === "function"
          ? propsTabList({ componentProps, componentType, defaultProps })
          : propsTabList,
      );
      newComponentProps = newCompProps;
      itemListValueMapList = newItemPropsMap;

      removeHelperProps(newComponentProps);

      let newItemList = itemListValueMapList;
      if (typeof onBeforeSave === "function") {
        let origComponentProps = { ...newComponentProps };
        let { componentProps, itemList } = onBeforeSave({
          itemList: itemListValueMapList,
          componentProps: newComponentProps,
        });
        // deleted props must be returned with undefined value for the form to remove them
        let adjustedComponentProps = {};
        for (let name in origComponentProps) {
          adjustedComponentProps[name] = componentProps[name];
        }

        newComponentProps = adjustedComponentProps;
        newItemList = itemList;
      }

      if (itemPropName || itemList.length) {
        const getItemListData = (itemList) =>
          itemList.map(({ item }, i) => {
            // merge all item values even those that are not specified in itemTab
            // and because of that they are not in the itemListValueMapList
            let itemProps = { ...item.props };
            let allPropsInModal = Object.keys(itemListValueMapList[i]);
            if (typeof onBeforeSave === "function") {
              for (let prop of allPropsInModal) {
                if (itemProps[prop]) delete itemProps[prop];
              }
            }
            let newItemProps = { ...itemProps, ...newItemList[i] };
            // remove default item values
            removeDefaultProps(itemDefaultProps, newItemProps);
            // remove props that have been removed in the modal
            removeDeletedProps(newItemProps, allPropsInModal);
            return newItemProps;
          });

        if (itemUu5Tag) {
          let uu5String = new Utils.Uu5String();
          uu5String.content = getItemListData(itemList).map((newItemProps) =>
            itemToUu5String(newItemProps, itemUu5Tag),
          );
          newComponentProps[itemPropName] = `<uu5string/>${uu5String.toString()}`;
        } else {
          newComponentProps[itemPropName] = getItemListData(itemList);
        }
      }

      removePreviousProps(componentProps, newComponentProps);
      removeDefaultProps(defaultProps, newComponentProps, true);

      await onSave({ props: newComponentProps });
    };

    // because Form.Provider is outside of Modal, it doesn't get unmounted when Modal closes so
    // opening it 2nd time shows previous values, which we don't want
    //   => update key when opening the Modal to remount Form.Provider
    const prevOpen = usePreviousValue(open);
    const keyRef = useRef(0);
    if (open && !prevOpen) keyRef.current++;
    const key = keyRef.current;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <Uu5Forms.Form.Provider key={key} onSubmit={_onSubmit} initialValue={initialValue} preserveValueOnUnmount>
        {(formState) => (
          <>
            {/* FormStateHelper - temporary solution to get the current values in the form */}
            <FormStateHelper
              itemMap={formState.itemMap}
              onChange={(e) =>
                !Utils.Object.deepEqual(e.data.itemMap, itemMap) ? setItemMap(e.data.itemMap) : undefined
              }
            />
            <EditModalView
              {...props}
              categoryList={categoryList}
              itemList={itemList}
              manageItem={manageItem}
              formState={formState}
            />
          </>
        )}
      </Uu5Forms.Form.Provider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
const FormStateHelper = ({ itemMap, onChange }) => {
  const currentValuesRef = useRef();

  useLayoutEffect(() => {
    currentValuesRef.current = { onChange };
  });

  useLayoutEffect(() => {
    const { onChange } = currentValuesRef.current;
    onChange(new Utils.Event({ itemMap }));
  }, [itemMap]);

  return null;
};

const itemToUu5String = (itemProps, uu5Tag) => {
  let uu5stringObject;
  if (itemProps?._uu5StringParsedChildren) {
    let { _uu5StringParsedChildren, ...itemPropsNoChildren } = itemProps;
    uu5stringObject = new Utils.Uu5String.Object(uu5Tag, itemPropsNoChildren);
    uu5stringObject.children = _uu5StringParsedChildren;
  } else {
    uu5stringObject = new Utils.Uu5String.Object(uu5Tag, itemProps);
  }

  return uu5stringObject;
};

const removeDefaultProps = (defaultProps, newProps, placeUndefined = false) => {
  for (const key in defaultProps) {
    if (key in newProps) {
      let isDefaultPropValue = false;
      if (typeof defaultProps[key] === "object" && typeof newProps[key] === "object") {
        isDefaultPropValue = Utils.Object.deepEqual(defaultProps[key], newProps[key]);
      } else {
        isDefaultPropValue = defaultProps[key] === newProps[key];
      }

      if (isDefaultPropValue) {
        if (placeUndefined) {
          newProps[key] = undefined;
        } else {
          delete newProps[key];
        }
      }
    }
  }
};

const removePreviousProps = (prevProps, newProps) => {
  for (const key in newProps) {
    if (key in prevProps && Utils.Object.deepEqual(prevProps[key], newProps[key])) {
      delete newProps[key];
    }
  }
};

const removeDeletedProps = (newProps, allPropsInModal) => {
  for (const key in newProps) {
    if (!allPropsInModal.includes(key) && key !== "_uu5StringParsedChildren") {
      delete newProps[key];
    }
  }
};

const removeHelperProps = (props) => {
  const prefixForHelperProp = "_helperForDelete";
  for (const prop in props) {
    if (prop.startsWith(prefixForHelperProp)) {
      delete props[prop];
    }
  }
};
//@@viewOff:helpers

export { EditModal };
export default EditModal;
