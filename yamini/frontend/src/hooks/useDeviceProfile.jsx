import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

/* ══════════════════════════════════════════════════════════════
   UNIVERSAL DEVICE PROFILE — 4-Signal Detection
   Screen · Pointer · Hover · Orientation
   Outputs: type, input, posture, density
   ══════════════════════════════════════════════════════════════ */

function detectProfile() {
  const w = window.innerWidth;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;
  const canHover = window.matchMedia('(hover: hover)').matches;
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const portrait = window.innerHeight > window.innerWidth;

  // --- Type ---
  let type = 'desktop';
  if (w < 640 && coarse) type = 'mobile';
  else if (w >= 640 && w < 1024 && hasTouch) type = 'tablet';
  else if (hasTouch && canHover) type = 'hybrid';
  else if (fine && canHover) type = 'desktop';

  // --- Input ---
  let input = 'mouse';
  if (coarse && !fine) input = 'touch';
  else if (hasTouch && fine) input = 'both';

  // --- Posture ---
  const posture = portrait ? 'portrait' : 'landscape';

  // --- Density ---
  let density = 'comfortable';
  if (w < 640) density = 'compact';
  else if (w >= 1024) density = 'expanded';

  return { type, input, posture, density };
}

const DeviceProfileContext = createContext({
  type: 'desktop', input: 'mouse', posture: 'landscape', density: 'expanded',
});

export function DeviceProfileProvider({ children }) {
  const [profile, setProfile] = useState(detectProfile);

  const sync = useCallback(() => {
    const next = detectProfile();
    setProfile((prev) => {
      if (prev.type === next.type && prev.input === next.input &&
          prev.posture === next.posture && prev.density === next.density) return prev;
      return next;
    });
  }, []);

  useEffect(() => {
    // Set data-* on <html> so CSS can key off them
    const root = document.documentElement;
    root.dataset.device = profile.type;
    root.dataset.input = profile.input;
    root.dataset.posture = profile.posture;
    root.dataset.density = profile.density;
  }, [profile]);

  useEffect(() => {
    sync();
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', sync);
    const mql = window.matchMedia('(pointer: coarse)');
    mql.addEventListener?.('change', sync);
    return () => {
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', sync);
      mql.removeEventListener?.('change', sync);
    };
  }, [sync]);

  const value = useMemo(() => profile, [profile]);

  return (
    <DeviceProfileContext.Provider value={value}>
      {children}
    </DeviceProfileContext.Provider>
  );
}

export function useDeviceProfile() {
  return useContext(DeviceProfileContext);
}

export { detectProfile };
export default useDeviceProfile;
