import './login.css';

function Login(){
    return(
        <div>
            <container className='container'>
                <h1>Login</h1>
                
                <form className="form" >

                    <label className='label'>Nome do usuário</label>
                    <input
                        className="input"
                    />

                    <label className='label'>E-mail</label>
                    <input
                        className="input"
                    />

                    <label className='label'>Criar senha</label>
                    <input
                        className="input"
                    />
                </form>x
            </container>
        </div>
    )
}

export default Login