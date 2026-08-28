// ---------------------------------------------------------------------------
// soundAlert.js
// A short two-tone chime generated entirely in the browser via the Web
// Audio API, used to alert kitchen staff to a new incoming order. No audio
// file to host or load.
//
// Browsers block audio until a user gesture happens on the page (autoplay
// policy). unlockAudio() should be called from a click/tap handler once
// (e.g. the Kitchen screen's "Enable alerts" button) before playOrderAlert()
// will reliably produce sound.
// ---------------------------------------------------------------------------

let audioCtx = null

function getContext() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    audioCtx = new Ctx()
  }
  return audioCtx
}

/** Call from a user click/tap to satisfy browser autoplay restrictions. */
export function unlockAudio() {
  const ctx = getContext()
  if (ctx.state === 'suspended') {
    ctx.resume()
  }
  return ctx.state
}

export function isAudioUnlocked() {
  return audioCtx?.state === 'running'
}

/** Play a short two-tone "new order" chime. */
export function playOrderAlert() {
  try {
    const ctx = getContext()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
    const now = ctx.currentTime

    ;[880, 660].forEach((freq, i) => {
      const start = now + i * 0.32
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.35, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.32)
    })
  } catch (err) {
    console.error('soundAlert: failed to play chime', err)
  }
}
