
import logo from '../lacStarLogo.png'
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import styled from './cadastrar.css'

function Cadastro({ onCadastro }) {
    const navigate = useNavigate();
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [aniversario, setAniversario] = useState("");
    const [senha, setSenha] = useState("");

    async function Cadastrar(event) {
        event.preventDefault();
        try {
            const resposta = await fetch("http://localhost:3002/usuario", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ nome, email, aniversario, senha })
            });
            const resultado = await resposta.json();

            if (!resposta.ok) {
                alert(resultado.erro || "Não foi possível criar a conta.");
                return;
            }

            localStorage.setItem("id_usuario", resultado.id);
            localStorage.setItem("nomeUsuario", nome);
            navigate("/home");
        } catch (erro) {
            console.error("Erro no cadastro:", erro);
            alert("Não foi possível conectar ao servidor. Verifique se a API está iniciada.");
        }
    }



    return (
        <main className="containerCadastro">
                <h1 className='tituloCa'>Cadastrar</h1>
                <section className='ladoUm' aria-label='Identidade visual'>
                    <img className='logo' src={logo} alt='LacStar' />
                </section>

                <section className='ladoDois' aria-label='Dados de cadastro'>
                    <form className="form" onSubmit={Cadastrar}>
                        <label className='label' >Nome do usuário</label>
                        <input
                            className="input"
                            placeholder='Seu nome'
                            id='nome'
                            type='text'
                            required
                            value={nome}
                            onChange={(event) => setNome(event.target.value)}
                        />
                        <label className="label" >Data de nascimento</label>
                        <input
                            className="input"
                            id='aniversario'
                            type="date"
                            required
                            value={aniversario}
                            onChange={(event) => setAniversario(event.target.value)}
                        />
                        <label className='label' >E-mail</label>
                        <input
                            className="input"
                            placeholder='seuemail@exemplo.com'
                            id='email'
                            type='email'
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                        />
                        <label className='label'>Senha</label>
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
                            <button className='buttonCa' type='submit' id='buttonCadastrar'  >
                            Cadastrar
                        </button>
                        <nav className='buttonLo'>
                            <Link to="/login" className='buttonLo'>Já tenho uma conta</Link>
                            </nav>
                        </div>
                        

                    </form>
                </section>
        </main>
    )
}
export default Cadastro;