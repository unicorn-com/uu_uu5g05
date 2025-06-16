/**
 * Copyright (C) 2020 Unicorn a.s.
 *
 * This program is free software; you can use it under the terms of the UAF Open License v01 or
 * any later version. The text of the license is available in the file LICENSE or at www.unicorn.com.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even
 * the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See LICENSE for more details.
 *
 * You may contact Unicorn a.s. at address: V Kapslovne 2767/2, Praha 3, Czech Republic or
 * at the email: info@unicorn.com.
 */

//@@viewOn:imports
import { useState, useEffect, useRef } from "./react-hooks.js";
//@@viewOff:imports

function useViewportVisibility(offsetTop = 0, offsetBottom = offsetTop) {
  // State and setter for storing whether element is visible
  const [visible, setVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const refToUse = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Update our state when observer callback fires
        setVisible(entry.isIntersecting);
      },
      {
        rootMargin: `${parseFloat(offsetTop)}px 0px ${parseFloat(offsetBottom)}px 0px`,
      },
    );
    if (refToUse) {
      observer.observe(refToUse);
    }
    return () => {
      observer.unobserve(refToUse);
    };
  }, [offsetBottom, ref, offsetTop]);

  return { visible, ref };
}

export { useViewportVisibility };
export default useViewportVisibility;
