import './login.css';

function Login({ onLogin }){
    return(
            <div className='container'>
                <h1 className='titulo'>Login</h1>
                
                <form className="form" onSubmit={onLogin}>

                    <label className='label'>Nome do usuário</label>
                    <input
                        className="input"
                        placeholder='Seu nome'
                    />

                    <label className='label'>E-mail</label>
                    <input
                        className="input"
                        placeholder='seuemail@exemplo.com'
                    />

                    <label className='label'>Criar senha</label>
                    <input
                        className="input"
                        placeholder='********'
                    />

                    <label className='label'>Confirmar senha</label>
                    <input
                        className="input"
                        placeholder='********'
                    />

                    <button className='button' type='submit'>
                        Login
                    </button>
                </form>
            </div>
    )
}

export default Login