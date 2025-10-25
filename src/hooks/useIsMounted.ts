import { useEffect, useState } from "react";

/**
 * Hook that returns true after the component has mounted on the client.
 * Useful for preventing hydration mismatches when using browser-only APIs
 * or conditional rendering based on client-side state.
 */
export function useIsMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
