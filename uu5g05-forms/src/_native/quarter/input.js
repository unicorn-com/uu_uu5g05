import { Utils, useLanguage } from "uu5g05";
import FormatInput from "../abstract/format-input";
import QuarterValue from "./quarter-value.js";

const Input = Utils.Component.forwardRef((props, ref) => {
  const [language] = useLanguage();
  return (
    <FormatInput
      {...props}
      ref={ref}
      FormatValue={QuarterValue}
      clipboardKey="quarter"
      lang={language}
      format="Q YYYY"
    />
  );
});

export { Input };
export default Input;
