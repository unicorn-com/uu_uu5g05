import { useEffect, useState, useCallback, useRef } from "./react-hooks.js";
import Print from "../utils/print";

function usePrintBlocker() {
  const [isPrintRequested, setIsPrintRequested] = useState(false);
  const printBlockerIdRef = useRef();
  useEffect(() => {
    const id = Print.registerPrintBlocker(() => setIsPrintRequested(true));
    printBlockerIdRef.current = id;
    return () => {
      Print.unregisterPrintBlocker(id);
    };
  }, []);
  const printReady = useCallback(() => {
    Print.unregisterPrintBlocker(printBlockerIdRef.current);
  }, []);

  return { isPrintRequested, printReady };
}

export { usePrintBlocker };
export default usePrintBlocker;
