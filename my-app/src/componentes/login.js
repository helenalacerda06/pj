import './login.css';

function Login({ onLogin }) {
    function handleSubmit(event) {
        event.preventDefault();

        if (onLogin) {
            onLogin(event);
        }
    }

    return (
        <div className='container'>
            <h1 className='titulo'>Login</h1>

            <form className="form" onSubmit={handleSubmit}>
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

                    <label className='label'>Confirmar senha</label>
                    <input
                        className="input"
                        type='password'
                        placeholder='********'
                        id='confirmarSenha'
                    />

                    <button className='button' type='submit' id='buttonLogar'  >
                        Login
                    </button>
                </form> 
            </div>
    )
}

export default Login