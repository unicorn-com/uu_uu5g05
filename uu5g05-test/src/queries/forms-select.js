const { buildQueries, within } = require("@testing-library/react");

const queryAllFormsSelect = (container, label) =>
  within(container)
    .queryAllByText(label)
    .map((element) => within(element.parentElement).getByRole("combobox"));
const getMultipleError = (container, label) =>
  `Found multiple clear buttons for Uu5Forms.FormsSelect elements with the label of: ${label}`;
const getMissingError = (container, label) =>
  `Unable to find a clear button for Uu5Forms.FormsSelect element with the label of: ${label}`;

const [queryFormsSelect, getAllFormsSelect, getFormsSelect, findAllFormsSelect, findFormsSelect] = buildQueries(
  queryAllFormsSelect,
  getMultipleError,
  getMissingError,
);

module.exports = {
  queryAllFormsSelect,
  queryFormsSelect,
  getAllFormsSelect,
  getFormsSelect,
  findAllFormsSelect,
  findFormsSelect,
};
