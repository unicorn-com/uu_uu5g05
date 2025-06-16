const synth = window.speechSynthesis;
const Speech = {
  speak({
    text,
    language,
    voice,
    pitch = 1, // <0; 2>
    rate = 1, // <0.1; 10>
    volume = 1, // <0; 1>
    onStart,
    onPause,
    onResume,
    onEnd,
    onBoundary,
    onMark,
    onError,
  } = {}) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = language;
    utter.voice = voice;
    utter.pitch = pitch;
    utter.rate = rate;
    utter.volume = volume;

    utter.onstart = onStart;
    utter.onpause = onPause;
    utter.onresume = onResume;
    utter.onend = onEnd;
    utter.onerror = onError;
    utter.onboundary = onBoundary;
    utter.onmark = onMark;

    synth.speak(utter);

    return utter;
  },

  pause() {
    synth.pause();
  },

  resume() {
    synth.resume();
  },

  cancel() {
    synth.cancel();
  },

  getVoices() {
    return synth.getVoices();
  },

  onVoicesChanged(fn) {
    synth.addEventListener("voiceschanged", fn);
    return () => synth.removeEventListener("voiceschanged", fn);
  },

  isEnabled: !!synth,

  get speaking() {
    return synth?.speaking;
  },

  get pending() {
    return synth?.pending;
  },

  get paused() {
    return synth?.paused;
  },
};

export { Speech };
export default Speech;
