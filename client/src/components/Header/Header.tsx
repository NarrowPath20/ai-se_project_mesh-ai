import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';
import logo from '../../assets/logo.png';
import menuIcon from '../../assets/menu.svg';

type Props = { isMenuOpen: boolean; onMenuToggle: () => void };

export default function Header({ isMenuOpen, onMenuToggle }: Props) {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const account = useRef<HTMLDivElement>(null);
  const accountButton = useRef<HTMLButtonElement>(null);
  const logoutButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isAccountMenuOpen) return;
    logoutButton.current?.focus();
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!account.current?.contains(event.target as Node)) setIsAccountMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [isAccountMenuOpen]);

  function handleLogout() {
    setIsAccountMenuOpen(false);
    logout();
    navigate('/login', { replace: true });
  }
  function getNavLinkClass({ isActive }: { isActive: boolean }) {
    return `header__link${isActive ? ' header__link_active' : ''}`;
  }

  return (
    <header className="header">
      <Link className="header__logo" to="/" aria-label="MeshAI home">
        <img src={logo} alt="Mesh AI logo" width="99" height="26" />
      </Link>
      {isAuthenticated && <>
      <nav className="header__nav" aria-label="Main navigation">
        <NavLink to="/knowledge" className={getNavLinkClass}>Knowledge Base</NavLink>
        <NavLink to="/chat" className={getNavLinkClass}>Chat</NavLink>
      </nav>
      <button className="header__hamburger" type="button" aria-label="Open menu" aria-expanded={isMenuOpen} aria-controls="mobile-menu" onClick={onMenuToggle}>
        <img src={menuIcon} width="24" height="24" alt="Navigation menu" />
      </button>
      <div className="header__account" ref={account} onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsAccountMenuOpen(false);
      }} onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setIsAccountMenuOpen(false);
          accountButton.current?.focus();
        }
      }}>
        <button type="button" className="header__dropdown-btn" ref={accountButton}
          aria-haspopup="menu" aria-expanded={isAccountMenuOpen} aria-controls="account-menu"
          onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') { event.preventDefault(); setIsAccountMenuOpen(true); }
          }}>
          {currentUser?.name}'s Account
        </button>
        {isAccountMenuOpen && <ul className="header__menu" id="account-menu" role="menu" aria-label="Account">
          <li role="none"><button type="button" role="menuitem" ref={logoutButton} onClick={handleLogout}>Logout</button></li>
        </ul>}
      </div>
      </>}
    </header>
  );
}
