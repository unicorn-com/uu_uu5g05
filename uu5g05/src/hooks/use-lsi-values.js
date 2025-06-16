import { useLanguage } from "./use-language.js";
import { useMemo } from "./react-hooks.js";
import Language from "../utils/language.js";

function useLsiValues(lsi) {
  const [language] = useLanguage();
  const result = useMemo(() => {
    let values = {};
    if (lsi && typeof lsi === "object") {
      for (let k in lsi) values[k] = Language.getItem(lsi[k], language);
    }
    return values;
  }, [language, lsi]);
  return result;
}

export { useLsiValues };
export default useLsiValues;
