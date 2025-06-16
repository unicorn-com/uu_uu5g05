import { useState, useRef, useEffect } from "./react-hooks";
import useDevice from "./use-device";
import Event from "../utils/event";

//@@viewOn:constants
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

//@@viewOff:constants

function useSpeechToText({ language, onStart, onSpeechStart, onSpeech, onSpeechEnd, onEnd }) {
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState();
  const { isMobileOrTablet } = useDevice();

  const recognition = useRef();
  const speechResultRef = useRef({});
  const currentValuesRef = useRef();

  function startRecording() {
    recognition.current.start();
    setRecording(true);
  }

  function stopRecording() {
    recognition.current.stop();
    speechResultRef.current = {};
    setRecording(false);
    setSpeaking(false);
  }

  useEffect(() => {
    currentValuesRef.current = {
      onStart,
      onSpeechStart,
      onSpeech,
      onSpeechEnd,
      onEnd,
      speaking,
      isMobileOrTablet,
    };
  });

  useEffect(() => {
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      if (language) rec.lang = language;
      rec.continuous = true;
      rec.interimResults = true;

      const startEvent = (e) => {
        setError(null);
        const { onStart } = currentValuesRef.current;
        onStart?.(e);
      };

      const speechStartEvent = (e) => {
        const { onSpeechStart } = currentValuesRef.current;
        setSpeaking(true);
        onSpeechStart?.(e);
      };

      const resultEvent = (e) => {
        const { onSpeech, onSpeechEnd, speaking, isMobileOrTablet } = currentValuesRef.current;

        const resultItem = e.results.item(e.resultIndex);
        const { transcript, confidence } = resultItem.item(0);

        let value = transcript,
          isFinal = resultItem.isFinal;
        if (isMobileOrTablet) {
          value = speechResultRef.current.text
            ? transcript.replace(new RegExp(`^${speechResultRef.current.text}`), "")
            : transcript;

          if (confidence === 0 && speechResultRef.current.prevConfidence === 1) {
            speechResultRef.current.text = transcript;
            isFinal = true;
          }
        }

        const event = new Event({ value }, e);

        if (isFinal) {
          setSpeaking(false);
          onSpeechEnd?.(event);
        } else {
          if (!speaking) {
            setSpeaking(true);
            const { onSpeechStart } = currentValuesRef.current;
            onSpeechStart?.(e);
          }
          onSpeech?.(event);
        }

        speechResultRef.current.prevConfidence = confidence;
      };

      const endEvent = (e) => {
        stopRecording();
        const { onEnd } = currentValuesRef.current;
        onEnd?.(e);
      };

      const errorEvent = (e) => {
        setError({ code: e.error });
      };

      rec.addEventListener("start", startEvent);
      rec.addEventListener("speechstart", speechStartEvent);
      rec.addEventListener("result", resultEvent);
      rec.addEventListener("end", endEvent);
      rec.addEventListener("error", errorEvent);

      recognition.current = rec;

      return () => {
        recognition.current?.stop();

        rec.removeEventListener("start", startEvent);
        rec.removeEventListener("speechstart", speechStartEvent);
        rec.removeEventListener("result", resultEvent);
        rec.removeEventListener("end", endEvent);
        rec.removeEventListener("error", errorEvent);
      };
    }
  }, [language]);

  return { recording, speaking, startRecording, stopRecording, error };
}

useSpeechToText.SpeechRecognition = SpeechRecognition;

export { useSpeechToText };
export default useSpeechToText;
