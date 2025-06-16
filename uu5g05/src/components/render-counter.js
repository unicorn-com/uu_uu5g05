//@@viewOn:imports
import { useEffect, useRef, useState } from "../hooks/react-hooks.js";
//@@viewOff:imports

let idCounter = 0;

function _RenderCounter() {
  const [id] = useState(() => (idCounter += 1));
  const renderCountRef = useRef(0);
  useEffect(() => {
    renderCountRef.current += 1;
  });
  return `Mount id: ${id}, render count: ${renderCountRef.current + 1}`;
}

const RenderCounter = process.env.NODE_ENV !== "production" ? _RenderCounter : () => null;

export { RenderCounter };
export default RenderCounter;
