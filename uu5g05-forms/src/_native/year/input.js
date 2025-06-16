import { Utils, useLanguage } from "uu5g05";
import FormatInput from "../abstract/format-input";
import YearValue from "./year-value";

const Input = Utils.Component.forwardRef((props, ref) => {
  const [language] = useLanguage();
  return <FormatInput {...props} ref={ref} FormatValue={YearValue} clipboardKey="year" lang={language} format="YYYY" />;
});

export { Input };
export default Input;
