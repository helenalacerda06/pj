import './login.css';
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { fazerLogin, redefinirSenha } from "../firebase/auth";
import Erro from '../erro.svg';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState("");
    const [mensagem, setMensagem] = useState("");

    async function entrar(event) {
        event.preventDefault();
        setErro("");
        setMensagem("");
        setCarregando(true);

        try {
            await fazerLogin(email, senha);
            navigate("/home");
        } catch (erroLogin) {
            console.error("Erro no login Firebase:", erroLogin);
            setErro("Não foi possível entrar. Verifique os dados informados.");
        } finally {
            setCarregando(false);
        }
    }

    async function solicitarRedefinicao() {
        setErro("");
        setMensagem("");
        if (!email.trim()) {
            setErro("Informe seu e-mail para receber as instruções.");
            return;
        }

        try {
            await redefinirSenha(email.trim());
        } catch (erroRedefinicao) {
            console.error("Erro ao solicitar redefinição:", erroRedefinicao);
            if (erroRedefinicao.code !== "auth/user-not-found") {
                setErro("Não foi possível solicitar a redefinição. Tente novamente.");
                return;
            }
        }
        setMensagem("Se houver uma conta associada, você receberá instruções por e-mail.");
    }

    return (
        <div>
            <div className='container'>
                <h1 className='titulo'>Login</h1>

                <form className="form" onSubmit={entrar}>
                    <label className='label' htmlFor='email'>E-mail</label>
                    <input
                        className="input"
                        placeholder='seuemail@exemplo.com'
                        id='email'
                        type='email'
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />

                    <label className='label' htmlFor='senha'>Digite sua senha</label>
                    <input
                        className="input"
                        type='password'
                        placeholder='********'
                        id='senha'
                        value={senha}
                        required
                        onChange={(event) => setSenha(event.target.value)}
                    />

                    <button className='button' type='submit' disabled={carregando}>
                        {carregando ? "Carregando..." : "Logar"}
                    </button>
                    <button
                        className='button'
                        type='button'
                        onClick={solicitarRedefinicao}
                        disabled={carregando}
                    >
                        Esqueci minha senha
                    </button>
                </form>
            </div>

            {erro && (
                <div className="mensagemErro" role="alert">
                    <h5 className="tituloErro">{erro}</h5>
                    <img className="imagemErro" src={Erro} alt="Imagem de erro" />
                    <p className="mensagem">Verifique o e-mail e a senha ou solicite a redefinição de senha.</p>
                </div>
            )}
            {mensagem && <p role="status">{mensagem}</p>}
        </div>
    );
}

export default Login;
