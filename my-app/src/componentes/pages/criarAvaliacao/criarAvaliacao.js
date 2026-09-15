import { useState } from 'react';
import styles from './criarAvaliacao.css';
import stylesVisualizacao from './visualizacaoAvaliacao/visualizacaoAvaliacao.css'
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack'
import Header from '../../Header'


function CriarAvaliação() {
    const [nomeAvaliacao, setNomeAvaliacao] = useState("");

    const [descricaoAvaliacao, setDescricaoAvaliacao] = useState("")
    const [fedbackAvaliacao, setFedbackAvaliacao] = useState("")
    const [principaisPontos, setPrincipaisPontos] = useState("")
    const [adicionarImagem, setAdicionarImagem] = useState(null)
    const [categoria, setCategoria] = useState("")
    const [estrela, setEstrela] = useState("")
    const [data, setData] = useState("")
    const [duracao,setDuracao] =useState("")


    return (
        <div >
           <Header className='header'/>
            <main>
                
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

                    <label className="label">Lançamento</label>
                    <input 
                    className='input'
                    id='data' 
                    type='date'
                    value={data}
                    accept=''
                    onChange={(e) => setData(e.target.value)}
                    />

                    <label className='label'>Duração</label>
                    <input 
                    className='input'
                    id='duracao'
                    type='time'
                    value={duracao}
                    onChange={(e) => setDuracao(e.target.value)}

                    />

                    <label className="nota">Nota</label>
                    <Stack className='estrela' spacing={1}>
                        <Rating 
                        name="half-rating-read"
                        value={estrela}
                        onChange={(e) => setEstrela(e.target.value)}
                        />
                    </Stack>
                </form>

                <div className="visualizacaoWrapper">
                    <div className={"containerVisualizacao"}>
                        <h1 className="tituloVisualizacao">{nomeAvaliacao}</h1>
                        <div className='areaImagem'>
                            {adicionarImagem && (<img className="imagemAvaliacao" src={adicionarImagem} />)}
                            {categoria !== "" && <p className='categoria'>Categoria: {categoria}</p>}
                            {data !== "" && <p className='lancamento'>Lançamento: {data}</p>}
                            {duracao !== "" && <p className='duracao'>Duração: {duracao}</p>}
                            {estrela !== "" && <p className='estrela'><Rating name="half-rating" defaultValue={estrela} precision={estrela} readOnly/></p>}
                        </div>
                        <div className='areaInformacoes'>
                            {descricaoAvaliacao !== '' && <p className="containerDescricao">{descricaoAvaliacao}</p>}
                            {fedbackAvaliacao !== "" && <p className="containerDescricao">{fedbackAvaliacao}</p>}
                            {principaisPontos !== "" && < p className="containerDescricao">{principaisPontos}</p>}
                        </div>
                    </div>
                    <button className='buttonPublicar'>Publicar</button>
                </div>

            </div>
            </main>
        </div>
    )
}



export default CriarAvaliação;