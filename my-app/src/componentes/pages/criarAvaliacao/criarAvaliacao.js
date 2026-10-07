import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack'
import Header from '../../Header'
import Footer from '../../Footer';
import ButtoVoltar from '../../button/buttonVoltar'
import './criarAvaliacao.css';
import './visualizacaoAvaliacao/visualizacaoAvaliacao.css'

function CriarAvaliação() {
    const navigate = useNavigate();
    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("")
    const [feedback, setFeedback] = useState("")
    const [principais_pontos, setPrincipais_pontos] = useState("")
    const [imagem, setImagem] = useState(null)
    const [categoria, setCategoria] = useState("")
    const [estrelas, setEstrelas] = useState("");
    const [lancamento, setLancamento] = useState("")
    const [duracao, setDuracao] = useState("")
    const idUsuario = localStorage.getItem("id_usuario");


    async function AvaCriada(event) {
        event.preventDefault();

        const avaliacao = await fetch("https://lacstar-backend.onrender.com/avaliacao", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                categoria,
                nome,
                descricao,
                feedback,
                principais_pontos,
                imagem,
                lancamento,
                duracao,
                estrelas
            })
        });
        const dados = await avaliacao.json()
        console.log(dados);

        //Se colocar direto o navigate(home) a pagina muda sem salvar o id do usuario que criou a avaliação (go the trinks) 
        if (avaliacao.ok) {
            
            const relacionamento = await fetch("https://lacstar-backend.onrender.com/avaliacoes_usuario", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id_usuario: idUsuario,
                    id_avaliacao: dados.id_avaliacao,
                    data_criacao: new Date()
                })
            });
            console.log(await relacionamento.json());
            navigate("/home")
        }
    }

    return (
        <>
            <Header className='header' />
            <main>

                <h1 className="tituloAvaliacao">Criar nova avaliação</h1>

                <section className="containerAvaliacao" >

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

                        <label className="label">Feedback</label>

                        <input
                            className="input"
                            placeholder='Oque você achou da obra?'
                            id='feedback'
                            value={feedback}
                            type="text"
                            onChange={(e) => setFeedback(e.target.value)}
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

                        <label className="label">Nota</label>
                        <Stack className='estrela' spacing={1}>
                            <Rating
                                name="half-rating-read"
                                value={estrelas}
                                onChange={(e, novoValor) => setEstrelas(novoValor)}
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
                        <article className={"containerVisualizacao"}>
                            <h1 className="tituloVisualizacao">{nome}</h1>
                            {nome === "" && <h1 className='tituloVisualizacaoNull'>nome da obra</h1>}
                            <section className='areaImagem'>
                                {imagem && (<img className="imagemAvaliacao" src={imagem} alt="Imagem da avaliação" />)}
                                {imagem === null && <h3 className="imagemAvaliacaoNull">Área Do banner</h3>}

                                {categoria !== "" && <p className='categoria'>Categoria: {categoria}</p>}
                                {categoria === "" && <p className='categoriaNull'> Categoria: </p>}

                                {lancamento !== "" && <p className='lancamento'>Lançamento: {lancamento}</p>}
                                {lancamento === "" && <p className='lancamentoNull'>Lançamento: </p>}

                                {duracao !== "" && <p className='duracao'>Duração: {duracao}</p>}
                                {duracao === "" && <p className='duracaoNull'>Duração: </p>}

                               {estrelas !== "" && <p className='estrela'><Rating name="half-rating" defaultValue={estrelas} precision={estrelas} readOnly /></p>}
                               {estrelas === "" && <p className='estrela'><Rating name="half-rating" defaultValue={estrelas}  readOnly /></p>}

                            </section>
                            <section className='areaInformacoes'>
                                {descricao !== '' && <p className="containerDescricao">{descricao}</p>}
                                {descricao === "" && <h3 className='containerDescricaoNull'>Descrição</h3>}

                                {feedback !== "" && <p className="containerDescricao">{feedback}</p>}
                                {feedback    === "" && <h3 className='containerDescricaoNull'>Feedback</h3>}

                                {principais_pontos !== "" && <p className="containerDescricao">{principais_pontos}</p>}
                                {principais_pontos === "" && <h3 className='containerDescricaoNull'>Principais Pontos</h3>}
                            </section>
                        </article>
                    </div>
                </section>
                <ButtoVoltar />

            </main>
            <Footer />
        </>
    )
}



export default CriarAvaliação;