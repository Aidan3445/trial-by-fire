import { useEffect } from 'react';

export function useHorizontalResize(ref: React.RefObject<HTMLElement | null>, onResize: () => void) {
  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver(onResize);

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, onResize]);
}
