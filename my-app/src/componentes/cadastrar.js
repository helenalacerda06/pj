import styled from './cadastrar.css'

function cadastro() {
    return (
        <div>
            <div className="containerCadastro">
                <h1 className='tituloCa'>Cadastrar</h1>

                <div className='ladoUm'>
                    <form className="form" onSubmit={cadastro}>
                        <label className='label'>Nome do usuário</label>
                        <input
                            className="input"
                            placeholder='Seu nome'
                            id='nomes'
                            type='text'
                        />
                        <label className="label">Data de nascimento</label>
                        <input
                            className="input"
                            id='data'
                            type="date"
                        />
                        <label className='label'>E-mail</label>
                    <input
                        className="input"
                        placeholder='seuemail@exemplo.com'
                        id='email'
                        type='email'
                    />
                    <label className='label'>Senha</label>
                    <input
                    className='input'
                    placeholder='Digite uma senha'
                    id='senha'
                    type='pasword'
                    />
                         <label className='label'>Confirmar senha</label>
                    <input
                    className='input'
                    placeholder='Confirme sua senha'
                    id='senha'
                    type='pasword'
                    />

                    </form>
                </ div>
            </div>
        </div>
    )
}
export default cadastro;