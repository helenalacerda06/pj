import './login.css';
import { useNavigate } from "react-router-dom";
import App from '../App';

const nomes = [] 

function adicionarNome() {
    const input = document.getElementById("nome");
    const valor = input.value;
    nomes.push(valor);   
}

const email = []

function adicionarEmail() {
    const input = document.getElementById("E-mail");
    const valor = input.value;
    email.push(valor);
}

const senha =[]

function adicionarSenha() {
    const input = document.getElementById("senha");
    const valor = input.value;
    senha.push(valor)
}

const confirmarSenha =[]

function confirmar(){
    const input = document.getElementById("Confirmar senha");
    const valor = input.value;
    confirmarSenha.push(valor);
}

const login =[]

function logar(){
    if(senha === confirmarSenha){

    } else { 
        alert("Senha invalida!")
    }
}


function Login({ onLogin }){
    return(
            <div className='container'>
                <h1 className='titulo'>Login</h1>
                
                <form className="form" onSubmit={onLogin}>

                    <label className='label'>Nome do usuário</label>
                    <input
                        className="input"
                        placeholder='Seu nome'
                        id='nomes'
                    />

                    <label className='label'>E-mail</label>
                    <input
                        className="input"
                        placeholder='seuemail@exemplo.com'
                        id='email'
                    />

                    <label className='label'>Criar senha</label>
                    <input
                        className="input"
                        type='password'
                        placeholder='********'
                        id='senha'
                    />

                    <label className='label'>Confirmar senha</label>
                    <input
                        className="input"
                        type='password'
                        placeholder='********'
                        id='confirmarSenha'
                    />

                    <button className='button' type='submit' id='login' onClick={logar}>
                        Login
                    </button>
                </form>
            </div>
    )
}

export default Login