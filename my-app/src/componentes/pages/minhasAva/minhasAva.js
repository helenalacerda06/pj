import { useEffect, useState } from 'react';
import Header from '../../Header';
import Footer from '../../Footer';
import CarouselAva from '../cardsAva/carouselAva';
import './minhasAva.css';

const quantidadeCards = 15;

function MinhasAva() {
    const idUsuario = localStorage.getItem('id_usuario');
    const [avaliacoes, setAvaliacoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    useEffect(() => {
        async function buscarAvaliacoes() {
            try {
                const resposta = await fetch(
                    `https://lacstar-backend.onrender.com/avaliacoes_usuarios/${idUsuario}`
                );
                const resultado = await resposta.json();

                if (!resposta.ok) {
                    setErro(
                        resultado.erro ||
                        'Não foi possível buscar suas avaliações.'
                    );
                    return;
                }

                if (!Array.isArray(resultado)) {
                    setErro('A resposta de avaliações está em formato inválido.');
                    return;
                }

                setAvaliacoes(resultado);
            } catch (erroBusca) {
                console.error('Erro ao buscar avaliações do usuário:', erroBusca);
                setErro('Erro ao conectar com o servidor.');
            } finally {
                setCarregando(false);
            }
        }

        if (!idUsuario) {
            setErro('Nenhum usuário está identificado.');
            setCarregando(false);
            return;
        }

        buscarAvaliacoes();
    }, [idUsuario]);

    return (
        <>
            <Header />
            <main className="minhasAvaPage">
                <h1 className="tituloMinhasAva">Minhas Avaliações</h1>
                <section className="minhasAvaWrapper" aria-label="Minhas avaliações">
                    <div className="containerMinhaAva">
                        {carregando && (
                            <p className="minhasAvaMensagem" role="status">
                                Carregando suas avaliações...
                            </p>
                        )}
                        {!carregando && erro && (
                            <p className="minhasAvaMensagem" role="alert">
                                {erro}
                            </p>
                        )}
                        {!carregando && !erro && avaliacoes.length === 0 && (
                            <p className="minhasAvaMensagem">
                                Você ainda não possui avaliações cadastradas.
                            </p>
                        )}
                        {!carregando && !erro && avaliacoes.length > 0 && (
                            <CarouselAva
                                avaliacoes={avaliacoes.slice(0, quantidadeCards)}
                            />
                        )}
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}

export default MinhasAva;
