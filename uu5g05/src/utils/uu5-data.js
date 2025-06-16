import { Uu5Data as Uu5Datag01 } from "uu5stringg01";
import Environment from "../environment.js";

class Uu5Data extends Uu5Datag01 {
  static parse(text, uu5DataMap = undefined) {
    return super.parse(text, uu5DataMap === undefined ? Environment.uu5DataMap : uu5DataMap);
  }
}

export { Uu5Data };
export default Uu5Data;
