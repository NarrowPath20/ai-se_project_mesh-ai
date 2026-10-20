import { useOutletContext } from 'react-router-dom';

export type LayoutContext = {
  isMobile: boolean;
  sidebarContainer: HTMLDivElement | null;
  setIsMenuOpen: (open: boolean) => void;
  closeMenu: () => void;
};

export function useAppLayout() { return useOutletContext<LayoutContext>(); }
