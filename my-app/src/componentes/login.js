import './login.css';
import { useState } from 'react';
import { useNavigate } from "react-router-dom";

function Login({ onLogin }) {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
async function fazerLogin(event) {

        event.preventDefault();
        try {
            const resposta = await fetch(
                "http://localhost:3001/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        senha
                    })
                }
            );

            const usuario = await resposta.json();
            console.log("Usuário recebido:", usuario);

            if (resposta.ok) {
                localStorage.setItem(
                    "usuarioId",
                    usuario.id
                );

                navigate("/home");

            } else {
                alert(usuario.erro);
            }

        } catch (erro) {
            console.error("Erro no login:", erro);
        }
    }

return (
        <main className='container'>
            <h1 className='titulo'>Login</h1>

            <form className="form" onSubmit={fazerLogin}>
                <label className='label'>Nome do usuário</label>
                <input
                    className="input"
                    placeholder='Seu nome'
                    id='nomes'
                    type='text'
                />

                <label className='label'>E-mail</label>
                <input
                    className="input"
                    placeholder='seuemail@exemplo.com'
                    id='email'
                    type='email'
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />

                <label className='label'>Senha</label>
                <input
                    className="input"
                    type='password'
                    placeholder='********'
                    id='senha'
                    value={senha}
                    onChange={(event) => setSenha(event.target.value)}
                />


                <button className='button' type='submit' id='buttonLogar'  >
                    Login
                </button>
            </form>
        </main>
)
}

export default Login