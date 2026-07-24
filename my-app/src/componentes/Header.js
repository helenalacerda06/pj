
import './Header.css';
import Logo from '../logo.png';

function Header() {
  return (
    <header className="header">
      <img src={Logo} alt="Logo" className="header-logo" />
      <nav>
        <a href="#">Início</a>
        <a href="#">Sobre</a>
      </nav>
    </header>
  );
}

export default Header;