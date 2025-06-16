const FormsCheckbox = require("./forms-checkbox");
const FormsFileClearBtn = require("./forms-file-clear-btn");
const FormsSelect = require("./forms-select");
const FormsSelectClearButton = require("./forms-select-clear-btn");
const ElementsBlockMenu = require("./elements-block-menu");
const ElementsLink = require("./elements-link");

module.exports = {
  ...FormsCheckbox,
  ...FormsFileClearBtn,
  ...FormsSelect,
  ...FormsSelectClearButton,
  ...ElementsBlockMenu,
  ...ElementsLink,
};
