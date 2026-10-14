import './Header.css';
import Logo from '../logo.png'
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Header() {

  const [nomeUsuario, setNomeUsuario] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  function irParaMinhasAva() {
    navigate("/minhas-ava")
  }

  function irParaHome() {
    navigate("/home")
  }

  useEffect(() => {

    async function buscarUsuario() {

      const idUsuario =
        localStorage.getItem("id_usuario");
      try {
        const resposta = await fetch(
          `https://lacstar-backend.onrender.com/usuario/${idUsuario}`
        );

        const usuario = await resposta.json();

        console.log("Usuário atual:", usuario);

        setNomeUsuario(usuario.nome);
        setEmail(usuario.email);
      } catch (erro) {
        console.error(
          "Erro ao buscar usuário:",
          erro
        );
      }
    }
    buscarUsuario();
  }, []);

  return (
    <header className="header">
      <img src={Logo} alt="Logo" className="header-logo" />
      <h3 className='nomeUsuario'> {nomeUsuario} \ {email}</h3>
      <nav>
        <button className="buttonHeader" onClick={irParaHome}>
          Início
        </button>
        <button className="buttonHeader" onClick={irParaMinhasAva}>
          Minhas avaliações
        </button>
      </nav>
    </header>
  );
}

export default Header;