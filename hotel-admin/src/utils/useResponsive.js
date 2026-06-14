import { useEffect, useState } from 'react';

function getViewportWidth() {
  if (typeof window === 'undefined') return 1440;
  return window.innerWidth;
}

export function useResponsive() {
  const [width, setWidth] = useState(getViewportWidth);

  useEffect(() => {
    const onResize = () => setWidth(getViewportWidth());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return {
    width,
    isMobile: width < 900,
    isTablet: width >= 900 && width < 1200,
    isCompact: width < 1200,
  };
}