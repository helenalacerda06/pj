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
            const resposta = await fetch("https://lacstar-backend.onrender.com/login",
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
                    "id_usuario",
                    usuario.id
                );
                localStorage.setItem("nomeUsuario", usuario.nome);

                navigate("/home");

            } else {
                alert(usuario.erro);
            }

        } catch (erro) {
            console.error("Erro no login:", erro);
            alert("Não foi possível conectar ao servidor. Verifique se a API está iniciada.");
        }
    }

return (
    <div>
        <div className='container'>
            <h1 className='titulo'>Login</h1>

            <form className="form" onSubmit={fazerLogin}>
                <label className='label'>E-mail</label>
                <input
                    className="input"
                    placeholder='seuemail@exemplo.com'
                    id='email'
                    type='email'
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />

                <label className='label'>Criar senha</label>
                <input
                    className="input"
                    type='password'
                    placeholder='********'
                    id='senha'
                    value={senha}
                    required
                    onChange={(event) => setSenha(event.target.value)}
                />


                <button className='button' type='submit' id='buttonLogar'  >
                    Login
                </button>
            </form>
        </div>
    </div>
)
}

export default Login