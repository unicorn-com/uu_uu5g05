const { buildQueries } = require("@testing-library/react");

const queryAllElementsBlockMenu = (container, text) => {
  return [container.querySelector(".uugds-dots-vertical")?.parentNode];
};

const getMultipleError = (container, text) =>
  `Found multiple Uu5Elements.Block's menu elements with the text of: ${text}`;
const getMissingError = (container, text) =>
  `Unable to find an element Uu5Elements.Block's menu elements with the text of: ${text}`;

const [
  queryElementsBlockMenu,
  getAllElementsBlockMenu,
  getElementsBlockMenu,
  findAllElementsBlockMenu,
  findElementsBlockMenu,
] = buildQueries(queryAllElementsBlockMenu, getMultipleError, getMissingError);

module.exports = {
  queryAllElementsBlockMenu,
  queryElementsBlockMenu,
  getAllElementsBlockMenu,
  getElementsBlockMenu,
  findAllElementsBlockMenu,
  findElementsBlockMenu,
};
