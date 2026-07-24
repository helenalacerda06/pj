
import './Header.css';
import Logo from '../assets/logo.png';
function Header() {
  return (
    <header className="header">
      <img src={Logo} alt="Logo" />
      <nav>
        <a href="#">Início</a>
        <a href="#">Sobre</a>
        <a href="#">Contato</a>
      </nav>
    </header>
  );
}

export default Header;