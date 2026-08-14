import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * True once the component has hydrated on the client, false during SSR and
 * during the client's hydration render — the two match, so no hydration
 * mismatch, unlike a `typeof window` check (which differs on both passes)
 * or a `useEffect(() => setState(true), [])` flag (flagged as an avoidable
 * render cascade by react-hooks/set-state-in-effect). useSyncExternalStore
 * is the primitive React provides specifically for values that legitimately
 * differ between server and client.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
