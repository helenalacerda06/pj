import pesquisar from '../../../pesquisa.png'
import './paginasCardsAva.css'
import CarouselAva from './carouselAva'
import { useState, useEffect } from 'react'

function PaginaCadsAva() {

    const [avaliacoes, setAvaliacoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    useEffect(() => {
        async function buscarAvaliacoes() {
            try {
                const resposta = await fetch(
                    `https://lacstar-backend.onrender.com/avaliacao`
                );

                const resultado = await resposta.json();

                if (!resposta.ok) {
                    setErro(
                        resultado.erro ||
                        "Não foi possível buscar as avaliações."
                    );
                    return;
                }

                if (!Array.isArray(resultado)) {
                    setErro("A resposta de avaliações está em formato inválido.");
                    return;
                }
                setAvaliacoes(resultado);
                setErro("");
            } catch (erro) {
                console.error("Erro ao buscar avaliação:", erro);
                setErro("Erro ao conectar com o servidor.");
            } finally {
                setCarregando(false);
            }
        }
        buscarAvaliacoes();
    }, []);

    // enquanto carrega
    if (carregando) {
        return <main>
            <button className="maisAva" >
                <span>
                    <img className='pesquisar' src={pesquisar} alt="Ícone de pesquisa" />
                </span>
                Mais avaliações
            </button>

            <div className='visualizacaoWrapper'>
                <div className={'containerAvas'}>
            <p className="cardss"role="status">Carregando...</p>
                </div>

            </div>
        </main>
    }

    // se der erro
    if (erro) {
        return <main>
            <button className="maisAva" >
                <span>
                    <img className='pesquisar' src={pesquisar} alt="Ícone de pesquisa" />
                </span>
                Mais avaliações
            </button>

            <div className='visualizacaoWrapper'>
                <div className={'containerAvas'}>
                    <p className="cardss" role="alert">{erro}</p>
                </div>

            </div>
        </main>
    }

    // Se não tiver avaliações
    if (avaliacoes.length === 0) {
        return <main>
            <button className="maisAva" >
                <span>
                    <img className='pesquisar' src={pesquisar} alt="Ícone de pesquisa" />
                </span>
                Mais avaliações
            </button>

            <div className='visualizacaoWrapper'>
                <div className={'containerAvas'}>
                    <p className="cardss">Não há avaliações:(</p>
                </div>

            </div>
        </main>
    }
    
    return (
        <main>
            <button className="maisAva" >
                <span>
                    <img className='pesquisar' src={pesquisar} alt="Ícone de pesquisa" />
                </span>
                Mais avaliações
            </button>

            <div className='visualizacaoWrapper'>
                <div className={'containerAvas'}>
                    <CarouselAva avaliacoes={avaliacoes} />
                </div>

            </div>
        </main>


    )
}
export default PaginaCadsAva;