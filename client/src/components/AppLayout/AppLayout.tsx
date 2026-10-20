import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import type { LayoutContext } from '../../hooks/useAppLayout';
import Header from '../Header/Header';
import './AppLayout.css';

export default function AppLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(width < 1200px)').matches);
  const [sidebarContainer, setSidebarContainer] = useState<HTMLDivElement | null>(null);
  const drawer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = window.matchMedia('(width < 1200px)');
    const update = () => { setIsMobile(query.matches); setIsMenuOpen(false); };
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!isMenuOpen || !isMobile) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (!drawer.current?.contains(document.activeElement)) drawer.current?.focus();
    const focusInput = requestAnimationFrame(() => drawer.current?.querySelector('input')?.focus());
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setIsMenuOpen(false); }
      if (event.key !== 'Tab') return;
      const controls = drawer.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), [tabindex="0"]');
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!drawer.current?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === drawer.current)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === drawer.current)) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      cancelAnimationFrame(focusInput);
      document.removeEventListener('keydown', onKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isMenuOpen, isMobile]);

  return (
    <div className="app-layout">
      <div inert={isMobile && isMenuOpen}>
        <Header isMenuOpen={isMenuOpen} onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} />
      </div>
      {isMobile && isMenuOpen && <button className="app-layout__backdrop" tabIndex={-1} aria-label="Close menu" onClick={() => setIsMenuOpen(false)} />}
      <div
        className={`app-layout__drawer${isMenuOpen ? ' app-layout__drawer_open' : ''}`}
        id="mobile-menu"
        ref={drawer}
        role="dialog"
        aria-label="Navigation and conversations"
        aria-modal={isMobile && isMenuOpen ? true : undefined}
        inert={!isMobile || !isMenuOpen}
        tabIndex={-1}
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget || !isMenuOpen) return;
          const input = drawer.current?.querySelector('input');
          if (input) input.focus();
          else if (!drawer.current?.contains(document.activeElement)) drawer.current?.focus();
        }}
      >
        <button className="app-layout__close" onClick={() => setIsMenuOpen(false)} aria-label="Close navigation">×</button>
        <div className="app-layout__conversations" ref={setSidebarContainer} />
        <nav className="app-layout__mobile-nav" aria-label="Mobile navigation">
          <NavLink to="/knowledge" onClick={() => setIsMenuOpen(false)}>Knowledge Base</NavLink>
          <NavLink to="/chat" onClick={() => setIsMenuOpen(false)}>Chat</NavLink>
        </nav>
      </div>
      <main className="app-layout__main" inert={isMobile && isMenuOpen}>
        <Outlet context={{ isMobile, sidebarContainer, setIsMenuOpen } satisfies LayoutContext} />
      </main>
    </div>
  );
}
