const { buildQueries, within } = require("@testing-library/react");

const queryAllElementsLink = (container, text) => {
  const nodeList = Array.from(container.querySelectorAll("a"));
  return nodeList.map((node) => within(node).getByText(text));
};

const getMultipleError = (container, text) => `Found multiple Uu5Elements.Link elements with the text of: ${text}`;
const getMissingError = (container, text) => `Unable to find an element Uu5Elements.Link with the text of: ${text}`;

const [queryElementsLink, getAllElementsLink, getElementsLink, findAllElementsLink, findElementsLink] = buildQueries(
  queryAllElementsLink,
  getMultipleError,
  getMissingError,
);

module.exports = {
  queryAllElementsLink,
  queryElementsLink,
  getAllElementsLink,
  getElementsLink,
  findAllElementsLink,
  findElementsLink,
};
