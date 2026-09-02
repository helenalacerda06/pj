import styles from './criarAvaliacao.css';

function criarAvaliação() {
    return (
        <div >
            <h1 className="tituloAvaliacao">Criar nova avaliação</h1>
            <div className="containerAvaliacao">
                <form className="Form">
                    <label className="label">Categoria</label>
                    <select className="select">
                        <option value="" className='select' >Filme</option>
                        <option value="" className='select' >Serie</option>
                        <option value="" className='select' >Livro</option>
                    </select>
                    <label className="label">Nome</label>
                    <input
                        className="input"
                        placeholder='Nome da avaliação'
                        id='nomeAvaliacao'
                        type=""
                    />
                    <label className="label">Descrição</label>
                    <input
                        className="input"
                        placeholder='Descrição da avaliação'
                        id='descricao'
                        type=""
                    />
                    <label className="label">Feedback</label>
                    <input
                        className="input"
                        placeholder='Oque você achou da obra?'
                        id='feedback'
                        type=""
                    />
                    <label className="label">Principais pontos</label>
                    <input
                        className="input"
                        placeholder='Pontos importantes'
                        id='principaisPontos'
                        type=""
                    />
                    <label className="label">Nota</label>
                </form>
            </div>
        </div>
    )

}

export default criarAvaliação;