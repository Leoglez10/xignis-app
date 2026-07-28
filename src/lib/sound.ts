// ponytail: synthesized in ~20 lines instead of pulling an audio-cue dependency
// for a single sound. Add a library only if we ever need a full cue set.

let context: AudioContext | null = null;

function getContext() {
  if (context) return context;
  const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  // El constructor puede lanzar (Safari limita el número de contextos, y algunos
  // WebViews lo bloquean). Sin este guard la excepción sale de playSuccessCue y
  // la atrapa el try del submit de solicitud: la solicitud SÍ se creó pero el
  // usuario ve "No se pudo crear la solicitud" y la vuelve a mandar.
  try {
    context = new Ctor();
  } catch {
    return null;
  }
  return context;
}

/** Short two-note rise. Only for confirming a submitted request. */
export function playSuccessCue() {
  const audio = getContext();
  if (!audio) return;
  try {
    void audio.resume();
    const gain = audio.createGain();
    gain.connect(audio.destination);
    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.09, audio.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.32);

    const tone = audio.createOscillator();
    tone.type = "sine";
    tone.frequency.setValueAtTime(880, audio.currentTime);
    tone.frequency.setValueAtTime(1174.66, audio.currentTime + 0.09);
    tone.connect(gain);
    tone.start(audio.currentTime);
    tone.stop(audio.currentTime + 0.34);
  } catch {
    /* audio unavailable or blocked: stay silent */
  }
}
