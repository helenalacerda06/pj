import logo from '../lacStarLogo.png';
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import './cadastrar.css';
import { cadastrarUsuario } from "../firebase/auth";
import { apiRequest } from "../services/api";
import Erro from '../erro.svg';


function Cadastro() {
    const navigate = useNavigate();
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [aniversario, setAniversario] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(false);
    const [contaCriada, setContaCriada] = useState(false);

    async function Cadastrar(event) {
        event.preventDefault();
        setErro("");
        setCarregando(true);

        try {
            if (!contaCriada) {
                await cadastrarUsuario(email, senha);
                setContaCriada(true);
            }
            await apiRequest("/usuarios/firebase", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ nome, aniversario })
            });
            navigate("/home");
        } catch (erroCadastro) {
            console.error("Erro no cadastro:", erroCadastro);
            if (erroCadastro.authUserCreated) {
                setContaCriada(true);
            }

            if (erroCadastro.code === "auth/email-already-in-use") {
                setErro("Este e-mail já está cadastrado. Faça login ou utilize outro e-mail.");
            } else if (erroCadastro.authUserCreated) {
                setErro("A conta foi criada. Verifique a conexão e tente salvar o perfil novamente.");
            } else if (erroCadastro.code === "auth/weak-password") {
                setErro("A senha precisa ter pelo menos 6 caracteres.");
            } else if (erroCadastro.status === 401) {
                setErro("A conta foi criada, mas a sessão expirou. Entre novamente para continuar.");
            } else {
                setErro(erroCadastro.message || "Não foi possível criar a conta.");
            }
        } finally {
            setCarregando(false);
        }
    }

    return (
        <main>
            <article className="containerCadastro">
                <h1 className='tituloCa'>Cadastrar</h1>
                <section className='ladoUm' aria-label='Identidade visual'>
                    <img className='logo' src={logo} alt='LacStar' />
                </section>

                <section className='ladoDois' aria-label='Dados de cadastro'>
                    <form className="form" onSubmit={Cadastrar}>
                        <label className='label' htmlFor='nome'>Nome do usuário</label>
                        <input
                            className="input"
                            placeholder='Seu nome'
                            id='nome'
                            type='text'
                            required
                            value={nome}
                            onChange={(event) => setNome(event.target.value)}
                        />
                        <label className="label" htmlFor='aniversario'>Data de nascimento</label>
                        <input
                            className="input"
                            id='aniversario'
                            type="date"
                            required
                            value={aniversario}
                            onChange={(event) => setAniversario(event.target.value)}
                        />
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
                        <label className='label' htmlFor='senha'>Senha</label>
                        <input
                            className='input'
                            placeholder='Digite uma senha'
                            id='senha'
                            type='password'
                            required
                            value={senha}
                            onChange={(event) => setSenha(event.target.value)}
                        />
                        <div className='buttons'>
                            <button className='buttonCa' type='submit' disabled={carregando}>
                                {carregando ? "Carregando..." : "Cadastrar"}
                            </button>
                            <nav className='buttonLo'>
                                <Link to="/login" className='buttonLo'>Já tenho uma conta</Link>
                            </nav>
                        </div>
                    </form>
                </section>
            </article>
            {erro && (
                <div className="mensagemErro" role="alert">
                    <h5 className="tituloErro">{erro}</h5>
                    <img className="imagemErro" src={Erro} alt="Imagem de erro" />
                    <p className="mensagem">Confira os dados e tente novamente ou acesse sua conta.</p>
                </div>
            )}
        </main>
    );
}

export default Cadastro;
