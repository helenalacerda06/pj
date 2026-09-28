import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import styles from './criarAvaliacao.css';
import stylesVisualizacao from './visualizacaoAvaliacao/visualizacaoAvaliacao.css'
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack'
import Header from '../../Header'
import Footer from '../../Footer';


function CriarAvaliação() {
    const navigate = useNavigate();
    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("")
    const [fedback, setFedback] = useState("")
    const [principais_pontos, setPrincipais_pontos] = useState("")
    const [imagem, setImagem] = useState(null)
    const [categoria, setCategoria] = useState("")
    const [estrelas, setEstrela] = useState(0);
    const [lancamento, setLancamento] = useState("")
    const [duracao, setDuracao] = useState("")


    async function AvaCriada(event) {
        event.preventDefault();

        const avaliacao = await fetch("http://localhost:3001/avaliacao", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                categoria,
                nome,
                descricao,
                fedback,
                principais_pontos,
                imagem,
                lancamento,
                duracao,
                estrelas
            })
        });
        const dados = await avaliacao.text()
        console.log(dados);

        if (avaliacao.ok) {
            navigate("/home");
        }
    }

    return (
        <div >
            <Header className='header' />
            <main>

                <h1 className="tituloAvaliacao">Criar nova avaliação</h1>

                <div className="containerAvaliacao" >

                    <form className="Form" onSubmit={AvaCriada}>

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
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                        />

                        <label className="label">Descrição</label>

                        <input
                            className="input"
                            placeholder='Descrição da avaliação'
                            id='descricao'
                            type="text"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                        />

                        <label className="label">Fedback</label>

                        <input
                            className="input"
                            placeholder='Oque você achou da obra?'
                            id='feedback'
                            value={fedback}
                            type="text"
                            onChange={(e) => setFedback(e.target.value)}
                        />

                        <label className="label">Principais pontos</label>

                        <input
                            className="input"
                            placeholder='Pontos importantes'
                            id='principais_pontos'
                            type="text"
                            value={principais_pontos}
                            onChange={(e) => setPrincipais_pontos(e.target.value)}
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
                                    setImagem(imagemURL)
                                }
                            }}
                        />

                        <label className="label">Lançamento</label>
                        <input
                            className='input'
                            id='data'
                            type='date'
                            value={lancamento}
                            accept=''
                            onChange={(e) => setLancamento(e.target.value)}
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
                                value={estrelas}
                                onChange={(e, novoValor) => setEstrela(novoValor)}
                            />
                        </Stack>

                       <button
                            className="buttonPublicar"
                            type="submit"
                            id="buttonPublicar"
                        >
                            Publicar
                        </button>

                    </form>

                    <div className="visualizacaoWrapper">

                        <div className={"containerVisualizacao"}>

                            <h1 className="tituloVisualizacao">{nome}</h1>
                            {nome == "" && <h1 className='tituloVisualizacaoNull'>nome da obra</h1>}

                            <div className='areaImagem'>

                                {imagem && (<img className="imagemAvaliacao" src={imagem} />)}
                                {imagem == null && <h3 className="imagemAvaliacaoNull">Área Do banner</h3>}

                                {categoria !== "" && <p className='categoria'>Categoria: {categoria}</p>}
                                {categoria == "" && <p className='categoriaNull'> Categoria: </p>}

                                {lancamento !== "" && <p className='lancamento'>Lançamento: {lancamento}</p>}
                                {lancamento == "" && <p className='lancamentoNull'>Lançamento: </p>}

                                {duracao !== "" && <p className='duracao'>Duração: {duracao}</p>}
                                {duracao == "" && <p className='duracaoNull'>Duração: </p>}

                                {estrelas !== "" && <p className='estrela'><Rating name="half-rating" value={estrelas}precision={1} readOnly/></p>}
                            </div>

                            <div className='areaInformacoes'>
                                {descricao !== '' && <p className="containerDescricao">{descricao}</p>}
                                  {descricao =="" && <h3 className='containerDescricaoNull'>Descrição</h3>}

                                {fedback !== "" && <p className="containerDescricao">{fedback}</p>}
                                {fedback == "" && <h3 className='containerDescricaoNull'>Feedback</h3>}

                                {principais_pontos !== "" && < p className="containerDescricao">{principais_pontos}</p>}
                                {principais_pontos == "" && <h3 className='containerDescricaoNull'>Principais Pontos</h3>}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}



export default CriarAvaliação;