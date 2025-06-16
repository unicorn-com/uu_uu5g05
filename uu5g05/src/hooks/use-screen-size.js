/**
 * Copyright (C) 2021 Unicorn a.s.
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public
 * License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later
 * version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License at
 * <https://gnu.org/licenses/> for more details.
 *
 * You may obtain additional information at <https://unicorn.com> or contact Unicorn a.s. at address: V Kapslovne 2767/2,
 * Praha 3, Czech Republic or at the email: info@unicorn.com.
 */

import { useState, useLayoutEffect } from "./react-hooks.js";
import ScreenSize from "../utils/screen-size.js";
import { useScreenSizeContext } from "../contexts/screen-size-context.js";

function useScreenSize() {
  let contextValue = useScreenSizeContext();
  const [screenSize, setScreenSize] = useState(() => ScreenSize.getSize());
  let usedScreenSize = contextValue != null ? contextValue.screenSize : screenSize;

  useLayoutEffect(() => {
    if (contextValue == null) {
      const changeScreenSize = (e, screenSize) => setScreenSize(screenSize);
      ScreenSize._register(changeScreenSize);
      return () => ScreenSize._unregister(changeScreenSize);
    }
  }, [contextValue]);

  return [usedScreenSize, contextValue?.setScreenSize];
}

export { useScreenSize };
export default useScreenSize;
