import styled from './cadastrar.css'
import logo from '../lacStarLogo.png'
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Cadastro({ onCadastro }) {
    const navigate = useNavigate();
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [aniversario, setAniversario] = useState("");
    const [senha, setSenha] = useState("");

    async function Cadastrar(event) {
        event.preventDefault();
        
       const resposta = await fetch("http://localhost:3001/usuario", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nome,
            email,
            aniversario,
            senha
        })
       });

       const mensagem = await resposta.text();
       console.log(mensagem);

       if(resposta.ok){
        navigate("/home")
       }

        
    }



    return (
        <div>
            <div className="containerCadastro">
                <h1 className='tituloCa'>Cadastrar</h1>
                <div className='ladoUm'>
                    <img className='logo' src={logo} />
                </div>

                <div className='ladoDois'>
                    <form className="form" onSubmit={Cadastrar}>
                        <label className='label'>Nome do usuário</label>
                        <input
                            className="input"
                            placeholder='Seu nome'
                            id='nome'
                            type='text'
                            value={nome}
                            onChange={(event) => setNome(event.target.value)}
                        />
                        <label className="label">Data de nascimento</label>
                        <input
                            className="input"
                            id='aniversario'
                            type="date"
                            value={aniversario}
                            onChange={(event) => setAniversario(event.target.value)}
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
                            className='input'
                            placeholder='Digite uma senha'
                            id='senha'
                            type='password'
                            value={senha}
                            onChange={(event) => setSenha(event.target.value)}
                        />
                        <div className='buttons'>
                            <button className='buttonCa' type='submit' id='buttonCadastrar'  >
                            Cadastrar
                        </button>
                        <nav className='buttonLo'>
                            <a href="Login" className='buttonLo'>Já tenho uma conta </a>
                            </nav>
                        </div>
                        

                    </form>
                </ div>
            </div>
        </div>
    )
}
export default Cadastro;