import { useState, useEffect } from "./react-hooks";
import Speech from "../utils/speech";

function useSpeechVoices() {
  const [voiceList, setVoiceList] = useState(() => Speech.getVoices());

  useEffect(() => {
    if (!Speech.isEnabled || voiceList?.length > 0) return;
    const voices = Speech.getVoices();
    if (voices.length) setVoiceList(voices);
    else {
      return Speech.onVoicesChanged(() => setVoiceList(Speech.getVoices()));
    }
  }, []);

  return { voiceList, defaultVoice: voiceList?.find((v) => v.default) };
}

export { useSpeechVoices };
export default useSpeechVoices;
