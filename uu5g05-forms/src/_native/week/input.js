import { Utils, useLanguage } from "uu5g05";
import FormatInput from "../abstract/format-input";
import WeekValue from "./week-value.js";

const Input = Utils.Component.forwardRef(({ format = "WW, YYYY", ...props }, ref) => {
  const [language] = useLanguage();
  return (
    <FormatInput
      {...props}
      ref={ref}
      FormatValue={WeekValue}
      clipboardKey="week"
      lang={language}
      format={format.replace(/[Y]+/, (v) => (v.startsWith("Y") ? v.padStart(4, "Y") : v))}
    />
  );
});

export { Input };
export default Input;
