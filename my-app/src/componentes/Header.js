import './Header.css';
import Logo from '../logo.png';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { observarAutenticacao, sairDaConta } from "../firebase/auth";
import { apiRequest } from "../services/api";

function Header() {
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  useEffect(() => observarAutenticacao((usuario) => {
    setErro("");
    if (!usuario) {
      setNomeUsuario("");
      setEmail("");
      return;
    }

    apiRequest("/usuarios/firebase")
      .then((perfil) => {
        setNomeUsuario(perfil.nome || "");
        setEmail(perfil.email || usuario.email || "");
      })
      .catch((erro) => {
        console.error("Erro ao buscar perfil:", erro);
        setNomeUsuario("");
        setEmail("");
        setErro("Não foi possível carregar os dados do perfil.");
      });
  }), []);

  async function sair() {
    try {
      await sairDaConta();
      navigate("/login");
    } catch (erro) {
      console.error("Erro ao encerrar sessão:", erro);
      setErro("Não foi possível encerrar a sessão. Tente novamente.");
    }
  }

  return (
    <header className="header">
      <img src={Logo} alt="Logo" className="header-logo" />
      <h3 className='nomeUsuario'>{nomeUsuario}{email ? ` \\ ${email}` : ""}</h3>
      {erro && <span role="alert">{erro}</span>}
      <nav>
        <button className="buttonHeader" onClick={() => navigate("/home")}>
          Início
        </button>
        <button className="buttonHeader" onClick={() => navigate("/minhas-ava")}>
          Minhas avaliações
        </button>
        <button className="buttonHeader" onClick={sair}>
          Sair
        </button>
      </nav>
    </header>
  );
}

export default Header;
