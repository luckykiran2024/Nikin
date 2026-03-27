import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

interface ResponsiveValues {
  width: number;
  height: number;
  isDesktop: boolean;
  isTablet: boolean;
  isMobile: boolean;
  contentMaxWidth: number;
  columns: number;
  padding: number;
  cardWidth: string;
}

const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
};

export function useResponsive(): ResponsiveValues {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;
  
  const isDesktop = width >= BREAKPOINTS.desktop;
  const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
  const isMobile = width < BREAKPOINTS.tablet;

  const contentMaxWidth = isDesktop ? 1200 : isTablet ? 900 : width;
  const columns = isDesktop ? 4 : isTablet ? 3 : 2;
  const padding = isDesktop ? 32 : isTablet ? 24 : 20;
  
  const cardWidth = isDesktop ? '24%' : isTablet ? '32%' : '48%';

  return {
    width,
    height,
    isDesktop,
    isTablet,
    isMobile,
    contentMaxWidth,
    columns,
    padding,
    cardWidth,
  };
}

export function getResponsiveStyle(isDesktop: boolean, isTablet: boolean) {
  return {
    containerStyle: {
      maxWidth: isDesktop ? 1200 : isTablet ? 900 : '100%',
      alignSelf: 'center' as const,
      width: '100%' as const,
    },
    cardGridStyle: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      justifyContent: isDesktop ? 'flex-start' : 'space-between',
      gap: isDesktop ? 16 : 12,
    },
    sidebarWidth: isDesktop ? 280 : 0,
  };
}

export function useWebHover() {
  const [isHovered, setIsHovered] = useState(false);

  const hoverProps = Platform.OS === 'web' ? {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  } : {};

  return { isHovered, hoverProps };
}

export default useResponsive;
