import './Header.css';
import Logo from '../logo.png'
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Header() {

  const [nome_usuario, setNomeUsuario] = useState("");
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

      const id_usuario =
        localStorage.getItem("id_usuario");
      try {
        const resposta = await fetch(
          `https://localhost:3001/usuario/${id_usuario}`
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
      <h3 className='nome_usuario'> {nome_usuario} \ {email}</h3>
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