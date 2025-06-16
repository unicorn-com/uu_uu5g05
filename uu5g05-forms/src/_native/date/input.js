import { Utils, useLanguage } from "uu5g05";
import FormatInput from "../abstract/format-input";
import DateValue from "./date-value";

const Input = Utils.Component.forwardRef(({ format, ...props }, ref) => {
  const [language] = useLanguage();
  return (
    <FormatInput
      {...props}
      ref={ref}
      FormatValue={DateValue}
      clipboardKey="date"
      lang={language}
      format={format.replace(/[Y]+/, (v) => (v === "Y" || v === "YY" ? "YYYY" : v))}
    />
  );
});

const FORMAT_MAP = { day: "D", month: "M", year: "YYYY" };

Input.defaultProps = {
  format: new Intl.DateTimeFormat()
    .formatToParts(new Date("1970-01-01"))
    .map(({ type, value }) => (type === "literal" ? value : FORMAT_MAP[type].padStart(value.length, FORMAT_MAP[type])))
    .join(""),
};

export { Input };
export default Input;
