const { buildQueries, within } = require("@testing-library/react");

const queryAllFormsFileClearBtn = (container, label) =>
  within(container)
    .queryAllByText(label)
    .map((element) => within(element.parentElement).getByTestId("icon").parentElement);
const getMultipleError = (container, label) =>
  `Found multiple clear buttons for Uu5Forms.FormSelect elements with the label of: ${label}`;
const getMissingError = (container, label) =>
  `Unable to find a clear button for Uu5Forms.FormSelect element with the label of: ${label}`;

const [
  queryFormsFileClearBtn,
  getAllFormsFileClearBtn,
  getFormsFileClearBtn,
  findAllFormsFileClearBtn,
  findFormsFileClearBtn,
] = buildQueries(queryAllFormsFileClearBtn, getMultipleError, getMissingError);

module.exports = {
  queryAllFormsFileClearBtn,
  queryFormsFileClearBtn,
  getAllFormsFileClearBtn,
  getFormsFileClearBtn,
  findAllFormsFileClearBtn,
  findFormsFileClearBtn,
};
