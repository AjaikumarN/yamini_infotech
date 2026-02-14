import { useState, useEffect, useCallback } from 'react';

/* ─────────────────────────────────────────────
   3-Layer Adaptive UI Detection
   Layout (screen) + Input (pointer) + Orientation
   ───────────────────────────────────────────── */

function getDeviceLayout() {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function getInputType() {
  if (window.matchMedia('(pointer: coarse)').matches) return 'touch';
  return 'mouse';
}

function getOrientation() {
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

function getUIProfile() {
  return {
    layout: getDeviceLayout(),
    input: getInputType(),
    orientation: getOrientation(),
  };
}

export default function useUIProfile() {
  const [profile, setProfile] = useState(getUIProfile);

  const update = useCallback(() => {
    const next = getUIProfile();
    setProfile((prev) => {
      if (prev.layout === next.layout && prev.input === next.input && prev.orientation === next.orientation) return prev;
      return next;
    });
  }, []);

  useEffect(() => {
    // Set data attributes on body so CSS can reference them
    const sync = () => {
      const p = getUIProfile();
      document.body.dataset.layout = p.layout;
      document.body.dataset.input = p.input;
      document.body.dataset.orientation = p.orientation;
      update();
    };
    sync();
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', sync);
    // Pointer changes (e.g. connecting mouse to tablet)
    const mql = window.matchMedia('(pointer: coarse)');
    mql.addEventListener?.('change', sync);
    return () => {
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', sync);
      mql.removeEventListener?.('change', sync);
    };
  }, [update]);

  return profile;
}

export { getDeviceLayout, getInputType, getOrientation, getUIProfile };
