import { UuDateTime } from "uu_i18ng01";

function useBrowserHourFormat() {
  let time = new UuDateTime().format(navigator.language);
  return /(AM|PM)$/.test(time) ? 12 : 24;
}

export default useBrowserHourFormat;
