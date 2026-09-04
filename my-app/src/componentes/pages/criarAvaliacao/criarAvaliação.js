import { useState } from 'react';
import styles from './criarAvaliacao.css';
import visualizacaoAvaliacao from './visualizacaoAvaliacao/visualizacaoAvaliacao.js'
import stylesVisualizacao from './visualizacaoAvaliacao/visualizacaoAvaliacao.css'


function CriarAvaliação() {
    const [nomeAvaliacao, setNomeAvaliacao] = useState("");

    const [descricaoAvaliacao, setDescricaoAvaliacao] = useState("")
    const [fedbackAvaliacao, setFedbackAvaliacao] = useState("")
    const [principaisPontos, setPrincipaisPontos] = useState("")
    const [adicionarImagem, setAdicionarImagem] = useState(null)
    const [categoria, setCategoria] = useState("")


    return (
        <div >
            <h1 className="tituloAvaliacao">Criar nova avaliação</h1>
            <div className="containerAvaliacao">
                <form className="Form">
                    <label className="label">Categoria</label>
                    <select className="select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                        <option value='' className='select' >Selecione uma categoria</option>
                        <option value='Filme' className='select' >Filme</option>
                        <option value='Serie' className='select' >Serie</option>
                        <option value='Livro' className='select' >Livro</option>
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
                        className='input'
                        id='imagem'
                        type="file"
                        accept='image/'

                        onChange={(e) => {
                            const arquivo = e.target.files[0];
                            if (arquivo) {
                                const imagemURL = URL.createObjectURL(arquivo);
                                setAdicionarImagem(imagemURL)
                            }
                        }}
                    />
                    <label className="label">Nota</label>
                    <div class="vote" className='star' name="fb" value="" checked>
                        <label className='star'>
                            <input type="radio" id="star" name='fb'value={1} />
                            <i class="fa"></i>
                        </label>
                        <label className='star'>
                            <input type="radio" id="star" name='fb'value={2} />
                            <i class="fa"></i>
                        </label>
                        <label className='star'>
                            <input type="radio" id="star" name='fb'value={3} />
                            <i class="fa"></i>
                        </label>
                        <label className='star'>
                            <input type="radio" id="star" name='fb'value={4} />
                            <i class="fa"></i>
                        </label>
                        <label className='star'>
                            <input type="radio" id="star" name='fb'value={5} />
                            <i class="fa"></i>
                        </label>
                    </div>
                </form>

                <div className={"containerVisualizacao"}>
                    <h1 className="tituloVisualizacao">{nomeAvaliacao}</h1>
                    <div className='areaImagem'>
                        {adicionarImagem && (<img className="imagemAvaliacao" src={adicionarImagem} />)}
                        {categoria !== "" && <p className='categoria'>Categoria: {categoria}</p>}
                    </div>
                    <div className='areaInformacoes'>
                        {descricaoAvaliacao !== '' && <p className="containerDescricao">{descricaoAvaliacao}</p>}
                        {fedbackAvaliacao !== "" && <p className="containerDescricao">{fedbackAvaliacao}</p>}
                        {principaisPontos !== "" && < p className="containerDescricao">{principaisPontos}</p>}
                    </div>

                </div>

            </div>
        </div>
    )
}



export default CriarAvaliação;