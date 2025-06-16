// NOTE This is a Config used by tests - it is created on first access of Css property so
// it should have biggest priority.

let Css;

const Config = {
  TAG: "Uu5Test.",
  get Css() {
    return (Css ??= require("uu5g05").Utils.Css.createCssModule("uutest"));
  },
};

module.exports = { Config };
