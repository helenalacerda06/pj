import './Header.css';
import Logo from '../logo.png'
import { useEffect, useState } from "react";

function Header() {

    const [nomeUsuario, setNomeUsuario] = useState("");
    const [email, setEmail] = useState("");

    useEffect(() => {

        async function buscarUsuario() {

            const idUsuario =
              localStorage.getItem("id_usuario");
            try {
                const resposta = await fetch(
                    `http://localhost:3001/usuario/${idUsuario}`
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
        <a href="Home">Início</a>
        <a href="#">Sobre</a>
        <a href="MinhasAva">Meu Perfil</a>
      </nav>
    </header>
  );
}

export default Header;