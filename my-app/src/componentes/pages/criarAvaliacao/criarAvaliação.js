import { useState } from 'react';
import styles from './criarAvaliacao.css';
import visualizacaoAvaliacao from './visualizacaoAvaliacao/visualizacaoAvaliacao.js'
import stylesVisualizacao from './visualizacaoAvaliacao/visualizacaoAvaliacao.css'

    
function CriarAvaliação() {
    const [nomeAvaliacao, setNomeAvaliacao] = useState("");

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
                        type="text"
                        value={nomeAvaliacao}
                        onChange={(e) => setNomeAvaliacao(e.target.value)}
                    />
                    <label className="label">Descrição</label>
                    <input
                        className="input"
                        placeholder='Descrição da avaliação'
                        id='descricao'
                        type="text"
                    />
                    <label className="label">Feedback</label>
                    <input
                        className="input"
                        placeholder='Oque você achou da obra?'
                        id='feedback'
                        type="text"
                    />
                    <label className="label">Principais pontos</label>
                    <input
                        className="input"
                        placeholder='Pontos importantes'
                        id='principaisPontos'
                        type="text"
                    />

                    <label className="label">Imagem</label>
                    <input
                        className="input"
                        placeholder='Insira o link da imagem'
                        id='imagem'
                        type="image"
                    />
                    <label className="label">Nota</label>
                </form>

                <div className={"containerVisualizacao"}>
                    
                </div>
            </div>
        </div>
    )

}

export default CriarAvaliação;