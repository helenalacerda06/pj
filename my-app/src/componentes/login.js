import './login.css';
import { useNavigate } from "react-router-dom";

function Login({ onLogin }) {
    const navigate = useNavigate();

    function fazerLogin() {
        navigate("/home");
    }

    return (
        <div>
            <div className='container'>
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
                    />

                    <label className='label'>Criar senha</label>
                    <input
                        className="input"
                        type='password'
                        placeholder='********'
                        id='senha'
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