import { useState } from "./react-hooks";
import Speech from "../utils/speech";

function useTextToSpeech(attrs) {
  const [state, setState] = useState("stop");
  const [error, setError] = useState();

  function play({ queueEnabled }) {
    if (state === "pause") {
      Speech.resume();
    } else {
      if (!queueEnabled && Speech.speaking) Speech.cancel();

      const { onStart, onPause, onResume, onEnd, ...restAttrs } = attrs;
      const speakEvents = {
        onStart: (e) => {
          onStart?.(e);
          setState("playing");
        },
        onPause: (e) => {
          onPause?.(e);
          setState("pause");
        },
        onResume: (e) => {
          onResume?.(e);
          setState("playing");
        },
        onEnd: (e) => {
          onEnd?.(e);
          setState("stop");
        },
        onError: (e) => {
          if (e.error === "interrupted" || e.error === "canceled") {
            // stopped by Speech.cancel();
            speakEvents.onEnd(e);
          } else {
            console.error("Error during text speaking.", { text: e.utterance.text, code: e.error }, e);
            // code: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisErrorEvent/error
            setError({ code: e.error, charIndex: e.charIndex, elapsedTime: e.elapsedTime, name: e.name });
            setState("error");
          }
        },
      };

      Speech.speak({ ...restAttrs, ...speakEvents });

      setState("play");
    }
  }

  function pause() {
    if (state === "playing") Speech.pause();
  }

  function stop() {
    if (state === "playing" || state === "pause") Speech.cancel();
  }

  return { state, error, play, pause, stop };
}

export { useTextToSpeech };
export default useTextToSpeech;
