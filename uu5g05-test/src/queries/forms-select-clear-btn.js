const { buildQueries, within } = require("@testing-library/react");

const queryAllFormsSelectClearBtn = (container, label) =>
  within(container)
    .queryAllByText(label)
    .map((element) => within(element.parentElement).getByTestId("icon").parentElement);
const getMultipleError = (container, label) =>
  `Found multiple clear buttons for Uu5Forms.FormsSelect elements with the label of: ${label}`;
const getMissingError = (container, label) =>
  `Unable to find a clear button for Uu5Forms.FormsSelect element with the label of: ${label}`;

const [
  queryFormsSelectClearBtn,
  getAllFormsSelectClearBtn,
  getFormsSelectClearBtn,
  findAllFormsSelectClearBtn,
  findFormsSelectClearBtn,
] = buildQueries(queryAllFormsSelectClearBtn, getMultipleError, getMissingError);

module.exports = {
  queryAllFormsSelectClearBtn,
  queryFormsSelectClearBtn,
  getAllFormsSelectClearBtn,
  getFormsSelectClearBtn,
  findAllFormsSelectClearBtn,
  findFormsSelectClearBtn,
};
