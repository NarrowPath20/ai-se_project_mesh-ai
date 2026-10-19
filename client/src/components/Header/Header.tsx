import { Link, NavLink } from 'react-router-dom';
import './Header.css';
import logo from '../../assets/logo.png';

type Props = { isMenuOpen: boolean; onMenuToggle: () => void };

export default function Header({ isMenuOpen, onMenuToggle }: Props) {
  function getNavLinkClass({ isActive }: { isActive: boolean }) {
    return `header__link${isActive ? ' header__link_active' : ''}`;
  }

  return (
    <header className="header">
      <Link className="header__logo" to="/" aria-label="MeshAI home">
        <img src={logo} alt="Mesh AI" width="99" height="26" />
      </Link>
      <nav className="header__nav" aria-label="Main navigation">
        <NavLink to="/knowledge" className={getNavLinkClass}>Knowledge Base</NavLink>
        <NavLink to="/chat" className={getNavLinkClass}>Chat</NavLink>
      </nav>
      <button className="header__hamburger" type="button" aria-label="Open menu" aria-expanded={isMenuOpen} aria-controls="mobile-menu" onClick={onMenuToggle}>
        <span /><span /><span />
      </button>
    </header>
  );
}
