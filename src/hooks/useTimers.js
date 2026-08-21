import { useEffect, useRef, useState } from "react";
import { restRemaining, restAdjust } from "../lib/timers";

// --- Audio: iOS Safari requires an AudioContext created/resumed inside a user
// gesture. We unlock on the first pointer event, then the chime can play any time.
let audioCtx = null;
function unlockAudio() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch {}
}
if (typeof document !== "undefined") {
  document.addEventListener("pointerdown", unlockAudio, { capture: true });
}

export function playChime() {
  try {
    if (!audioCtx || audioCtx.state !== "running") return;
    const now = audioCtx.currentTime;
    [[880, 0], [1174.66, 0.18], [1567.98, 0.36]].forEach(([freq, at]) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + at);
      gain.gain.exponentialRampToValueAtTime(0.35, now + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.35);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now + at);
      osc.stop(now + at + 0.4);
    });
  } catch {}
}

// --- Wake Lock: keep the screen on while a session is active. Re-acquire on
// visibilitychange (iOS releases it when the app is backgrounded).
export function useWakeLock(active) {
  const lockRef = useRef(null);
  useEffect(() => {
    let cancelled = false;
    async function acquire() {
      try {
        if (active && !cancelled && "wakeLock" in navigator) {
          lockRef.current = await navigator.wakeLock.request("screen");
        }
      } catch {}
    }
    function onVis() {
      if (document.visibilityState === "visible" && active) acquire();
    }
    if (active) {
      acquire();
      document.addEventListener("visibilitychange", onVis);
    }
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      try { lockRef.current?.release(); } catch {}
      lockRef.current = null;
    };
  }, [active]);
}

// --- Rest timer: transient (not persisted). Timestamp-based via endsAt, so
// backgrounding is safe; the expiry cue fires when the tab is visible again.
export function useRestTimer({ soundOn, onExpire }) {
  const [rest, setRest] = useState(null); // { exId, endsAt, totalSec }
  const [flash, setFlash] = useState(false);
  const expiredFor = useRef(null);
  const [, force] = useState(0);

  useEffect(() => {
    if (!rest) return;
    const id = setInterval(() => force(x => x + 1), 500);
    return () => clearInterval(id);
  }, [rest]);

  const remaining = restRemaining(rest, Date.now());

  useEffect(() => {
    if (rest && remaining === 0 && expiredFor.current !== rest.endsAt) {
      expiredFor.current = rest.endsAt;
      if (soundOn) playChime();
      setFlash(true);
      setTimeout(() => setFlash(false), 700);
      setTimeout(() => setRest(r => (r && r.endsAt === expiredFor.current ? null : r)), 1200);
      onExpire?.(rest.exId);
    }
  }, [rest, remaining, soundOn, onExpire]);

  return {
    rest,
    remaining,
    flash,
    start: (exId, totalSec) => setRest({ exId, endsAt: Date.now() + totalSec * 1000, totalSec }),
    adjust: delta => setRest(r => (r ? restAdjust(r, delta) : r)),
    skip: () => setRest(null),
  };
}
