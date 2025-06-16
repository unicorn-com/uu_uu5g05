// used from libraries depending on uu5g05 (this gets bundled into them); used due to uu5devkitg01-plugin's .babelrc config regarding @babel/preset-react preset
const Uu5 = require("uu5g05");
// the fallback is for temporary flow as described in ./jsx-runtime.js
Object.assign(exports, Uu5._jsx || { createElement: Uu5.Utils.Element.create });
