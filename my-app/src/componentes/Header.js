
import './Header.css';
import Logo from '../logo.png'
import Home from './pages/inicio/home'

function Header() {
  return (
    <header className="header">
      <img src={Logo} alt="Logo" className="header-logo" />
      <nav>
        <a href="Home">Início</a>
        <a href="#">Sobre</a>
      </nav>
    </header>
  );
}

export default Header;