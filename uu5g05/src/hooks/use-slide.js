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

import { useRef } from "./react-hooks.js";
import EventManager from "../utils/event-manager.js";
import Event from "../utils/event";
import useUnmountedRef from "./use-unmounted-ref";

function getEventData(e) {
  return {
    x: e.clientX,
    y: e.clientY,
    time: new Date(),
  };
}

const MIN_LENGTH = 10;
const MIN_CLICK_LENGTH = 5;
const MAX_ANGLE_DIVERGENCE = 10;
const MAX_SHORT_LENGTH = 70;
const MAX_SLOW_SPEED = 0.3;

function getHourType(angle) {
  let hourAngle = angle + 90;
  if (hourAngle < 0) hourAngle += 360;
  return Math.round(hourAngle / 30) || 12; // 12 instead of 0
}

function getDirection({ dx, dy, angle }) {
  return {
    left: dx < -MIN_LENGTH,
    right: dx > MIN_LENGTH,
    up: dy < -MIN_LENGTH,
    down: dy > MIN_LENGTH,
    type:
      Math.abs(angle) <= MAX_ANGLE_DIVERGENCE || Math.abs(angle) >= 180 - MAX_ANGLE_DIVERGENCE
        ? "horizontal"
        : Math.abs(angle) <= 90 + MAX_ANGLE_DIVERGENCE && Math.abs(angle) >= 90 - MAX_ANGLE_DIVERGENCE
          ? "vertical"
          : null,
    hourType: getHourType(angle),
  };
}

function addStats(data, e) {
  data.dx = data.end.x - data.start.x;
  data.dy = data.end.y - data.start.y;
  data.duration = data.end.time - data.start.time;
  data.pointerType = e.pointerType;
  data.angle = (Math.atan2(data.dy, data.dx) * 180) / Math.PI;
  data.length = Math.sqrt(Math.pow(data.dx, 2) + Math.pow(data.dy, 2));
  data.speed = data.length / data.duration;

  data.direction = getDirection(data);
  data.speedType = data.speed > MAX_SLOW_SPEED ? "fast" : "slow";
  data.lengthType = data.length > MAX_SHORT_LENGTH ? "long" : data.length > MAX_SHORT_LENGTH ? "short" : null;
}

function useSlide({ onStart, onEnd, onMove } = {}) {
  const isUnmounted = useUnmountedRef();
  const startRef = useRef();

  const handleStartRef = useRef();
  handleStartRef.current = onStart;

  const handleMoveRef = useRef();
  handleMoveRef.current = onMove;

  const handleEndRef = useRef();
  handleEndRef.current = onEnd;

  const unmountRef = useRef();

  const ref = useRef((element) => {
    unmountRef.current?.(); // cleanup

    function click(e) {
      const data = {
        start: startRef.current,
        end: getEventData(e),
      };
      addStats(data, e);

      if (data.length > MIN_CLICK_LENGTH) {
        e.stopPropagation();
        e.preventDefault();
      }

      startRef.current = null;
    }

    if (element) {
      const bindEvents = () => {
        EventManager.register("pointermove", move, document);
        EventManager.register("pointerup", stop, document); // for mouse
        EventManager.register("pointercancel", stop, document); // for touch & pen

        EventManager.register("click", click, element); // for stop doing click during slide
      };

      const unbindEvents = () => {
        EventManager.unregister("pointermove", move, document);
        EventManager.unregister("pointerup", stop, document);
        EventManager.unregister("pointercancel", stop, document);

        setTimeout(() => EventManager.unregister("click", click, element), 0);
      };

      const start = (e) => {
        if (!isUnmounted.current) {
          bindEvents();
          startRef.current = getEventData(e);
          if (handleStartRef.current) handleStartRef.current(new Event(startRef.current, e));
        }
      };

      const move = (e) => {
        if (handleMoveRef.current && !isUnmounted.current) {
          const data = {
            start: startRef.current,
            end: getEventData(e),
          };
          addStats(data, e);

          handleMoveRef.current(new Event(data, e));
        }
      };

      const stop = (e) => {
        if (!isUnmounted.current) {
          if (handleEndRef.current) {
            const data = {
              start: startRef.current,
              end: getEventData(e),
            };
            addStats(data, e);

            handleEndRef.current(new Event(data, e));
          }

          // startRef reset is in click handler because click needs the data but runs later
          unbindEvents();
        }
      };

      EventManager.register("pointerdown", start, element);

      unmountRef.current = () => {
        unbindEvents();
        EventManager.unregister("pointerdown", start, element);
      };
    } else {
      unmountRef.current = null;
    }
  });

  return { ref: ref.current, style: { userSelect: "none", touchAction: "none" } };
}

export { useSlide };
export default useSlide;
