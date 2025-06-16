const { buildQueries, within } = require("@testing-library/react");

const queryAllFormsCheckbox = (container, label) =>
  within(container)
    .queryAllByRole("checkbox", { name: label })
    .map((element) => element.parentElement);
const getMultipleError = (container, label) =>
  `Found multiple clear buttons for Uu5Forms.FormsCheckbox elements with the label of: ${label}`;
const getMissingError = (container, label) =>
  `Unable to find a clear button for Uu5Forms.FormsCheckbox element with the label of: ${label}`;

const [queryFormsCheckbox, getAllFormsCheckbox, getFormsCheckbox, findAllFormsCheckbox, findFormsCheckbox] =
  buildQueries(queryAllFormsCheckbox, getMultipleError, getMissingError);

module.exports = {
  queryAllFormsCheckbox,
  queryFormsCheckbox,
  getAllFormsCheckbox,
  getFormsCheckbox,
  findAllFormsCheckbox,
  findFormsCheckbox,
};
