import React from 'react';
import { useIsMobile, useIsTablet } from '../hooks/useMediaQuery';
import { MobileNavigation } from './MobileNavigation';

export const ResponsiveLayout = ({ children }) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  
  return (
    <>
      <MobileNavigation />
      <div className={`
        min-h-screen
        ${isMobile ? 'pt-16 pb-20 px-4' : ''}
        ${isTablet ? 'px-6 py-4' : ''}
        ${!isMobile && !isTablet ? 'px-8 py-6' : ''}
      `}>
        {children}
      </div>
    </>
  );
};
