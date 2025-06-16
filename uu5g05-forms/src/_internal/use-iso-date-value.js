import { useEffect } from "uu5g05";

function useIsoDateValue(value, logger) {
  const isValid = typeof value === "string";

  useEffect(() => {
    if (value && !isValid) logger?.error(`Invalid prop "value" of type "${typeof value}", expected "string".`);
  }, [value, isValid]);

  if (value && !isValid) return undefined;
  return value;
}

export { useIsoDateValue };
export default useIsoDateValue;
