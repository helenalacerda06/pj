import { useEffect, useState } from 'react';
import Header from '../../Header';
import Footer from '../../Footer';
import CarouselAva from '../cardsAva/carouselAva';
import './minhasAva.css';
import { apiRequest } from '../../../services/api';
import { observarAutenticacao } from '../../../firebase/auth';

const quantidadeCards = 15;

function MinhasAva() {
    const [avaliacoes, setAvaliacoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    useEffect(() => {
        let requestId = 0;
        const unsubscribe = observarAutenticacao((usuario) => {
            const currentRequestId = ++requestId;
            setCarregando(true);
            setErro('');

            if (!usuario) {
                setAvaliacoes([]);
                setErro('Entre na sua conta para ver suas avaliações.');
                setCarregando(false);
                return;
            }

            apiRequest('/avaliacoes_usuario')
                .then((resultado) => {
                    if (currentRequestId !== requestId) return;
                    if (!Array.isArray(resultado)) {
                        throw new Error('A resposta de avaliações está em formato inválido.');
                    }
                    setAvaliacoes(resultado);
                })
                .catch((erroBusca) => {
                    if (currentRequestId !== requestId) return;
                    console.error('Erro ao buscar avaliações do usuário:', erroBusca);
                    setErro(erroBusca.message || 'Não foi possível buscar suas avaliações.');
                })
                .finally(() => {
                    if (currentRequestId === requestId) {
                        setCarregando(false);
                    }
                });
        });

        return () => {
            requestId += 1;
            unsubscribe();
        };
    }, []);

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
