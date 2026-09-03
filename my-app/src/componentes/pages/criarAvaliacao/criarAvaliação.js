import { useState } from 'react';
import styles from './criarAvaliacao.css';
import visualizacaoAvaliacao from './visualizacaoAvaliacao/visualizacaoAvaliacao.js'
import stylesVisualizacao from './visualizacaoAvaliacao/visualizacaoAvaliacao.css'

    
function CriarAvaliação() {
    const [nomeAvaliacao, setNomeAvaliacao] = useState("");

    const [ descricaoAvaliacao, setDescricaoAvaliacao] = useState("")
    const [ fedbackAvaliacao, setFedbackAvaliacao] = useState("")
    const [ principaisPontos, setPrincipaisPontos] = useState("")


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
                        value={descricaoAvaliacao}
                        onChange={(e) => setDescricaoAvaliacao(e.target.value)}
                    />
                    <label className="label">Fedback</label>
                    <input
                        className="input"
                        placeholder='Oque você achou da obra?'
                        id='feedback'
                        value={fedbackAvaliacao}
                        type="text"
                        onChange={(e) => setFedbackAvaliacao(e.target.value)}
                    />
                    <label className="label">Principais pontos</label>
                    <input
                        className="input"
                        placeholder='Pontos importantes'
                        id='principaisPontos'
                        type="text"
                        value={principaisPontos}
                        onChange={(e) => setPrincipaisPontos(e.target.value)}

                    />

                    <label className="label">Imagem</label>
                    <input
                        className="input"
                        placeholder='Insira o link da imagem'
                        id='imagem'
                        type="image"
                        src='img_submit.gif'
                        alt='baner ou capa'
                        accept='.jpg, .jpeg, .png'
                        required
                    />
                    <label className="label">Nota</label>
                </form>

                <div className={"containerVisualizacao"}>
                    <h1 className="tituloVisualizacao">{nomeAvaliacao}</h1>
                    {descricaoAvaliacao !== '' && <p className="containerDescricao">{descricaoAvaliacao}</p>}
                    {fedbackAvaliacao !== "" && <p className="containerDescricao">{fedbackAvaliacao}</p>}
                    {principaisPontos !== "" && < p className="containerDescricao">{principaisPontos}</p>}
                </div>
                
            </div>
        </div>
    )
    }



export default CriarAvaliação;