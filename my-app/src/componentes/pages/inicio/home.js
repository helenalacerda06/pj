import { useNavigate } from 'react-router-dom';
import CriarAvaliação from '../criarAvaliacao/criarAvaliacao';
import button from "./mais.png"
import { style } from './home.css'
import LacStar from '../../../lacStar.png'
import Header from '../../Header'
import LacStarLogo from '../../../lacStarLogo.png'
import PaginaCadsAva from '../cardsAva/paginasCardsAva';
import MinhasAva from '../minhasAva/minhasAva';
import Footer from '../../Footer'


function Home() {
    const navigate = useNavigate();

    function irParaCriarAvaliacao() {
        navigate("/criar-avaliacao");
    }
    return (

        <>
            <Header />
            <main className="home">
                <section className="primeiro">
                    <img className='lacStar
            'src={LacStar} width="700"
                        height="340" />
                    <img className='lacStarLogo' src={LacStarLogo}
                        height="340" />
                </section>

                <section className='segundo'>
                    <h3 className='textoHome'> Encontre filmes, séries e livros que combinam com você. Explore avaliações feitas por outros usuários, compartilhe suas próprias opiniões e interaja com diferentes recomendações.<br />

                        Aqui, cada avaliação ajuda a descobrir uma nova história.</h3>
                    <button onClick={irParaCriarAvaliacao} className='buttonNovaAva'>
                        <span className='iconNovaAva'>
                            <img className='iconNovaAva' src={button} />
                        </span>
                        Criar Avaliação
                    </button>
                </section>
            </main>
            <PaginaCadsAva />
            <MinhasAva />
            <Footer/>
        </>

    )
}
export default Home;