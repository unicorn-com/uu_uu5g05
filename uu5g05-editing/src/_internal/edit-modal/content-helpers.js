import Uu5Forms from "uu5g05-forms";

const ContentHelpers = {
  getContentMap: (tab, editationComponentParams) => {
    if (!tab.propInputMap) return;
    const contentMap = {};
    Object.entries(tab.propInputMap).forEach(([propMapKey, propMapItem]) => {
      let { Component, props = {} } = getEditationComponent(propMapItem, editationComponentParams, tab.inputNamePrefix);
      contentMap[propMapKey] = (
        <Component {...props} key={propMapKey}>
          {props.children}
        </Component>
      );
    });
    return contentMap;
  },
};

export default ContentHelpers;

const getEditationComponent = (propMapItem, editationComponentParams, inputNamePrefix) => {
  const { itemParamsToPass, firstItemFromTemplate } = editationComponentParams;

  const result = {
    Component: propMapItem.component ?? Uu5Forms.FormText,
    props: {
      autoFocus: firstItemFromTemplate === propMapItem.name,
      ...propMapItem.props,
      name: inputNamePrefix + propMapItem.name,
    },
  };

  const customProps =
    typeof propMapItem.props === "function"
      ? propMapItem.props({ inputProps: result.props, ...itemParamsToPass })
      : null;
  if (customProps) {
    result.props = { ...result.props, ...customProps };
  }

  return result;
};
