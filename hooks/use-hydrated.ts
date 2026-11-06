import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False in the server HTML and during hydration, true once React runs on the
 * client. Forms whose submit is handled in JavaScript keep the button disabled
 * until then, so an early click never posts the page itself.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
