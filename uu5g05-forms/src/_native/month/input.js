import { Utils, useLanguage } from "uu5g05";
import FormatInput from "../abstract/format-input";
import MonthValue from "./month-value";

const Input = Utils.Component.forwardRef((props, ref) => {
  const [language] = useLanguage();
  return (
    <FormatInput
      {...props}
      ref={ref}
      FormatValue={MonthValue}
      clipboardKey="month"
      lang={language}
      format="MMMM YYYY"
    />
  );
});

export { Input };
export default Input;
