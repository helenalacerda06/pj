import { useNavigate } from 'react-router-dom';
import CriarAvaliação from '../criarAvaliacao/criarAvaliação';
import button from "./mais.png"

function Home(){
    const navigate = useNavigate();

    function irParaCriarAvaliacao(){
        navigate("/criar-avaliacao");
    }
    return(
        <div className="home">
            <h1 className="tituloHome">lac-star</h1>
            <div className='segundo'>
                <h3 className='textoHome'>ffffffff</h3>
            <button onClick={irParaCriarAvaliacao} className='buttonNovaAva'>
                <img className='iconNovaAva' src={button} />
                nova avaliação
            </button>
            </div>
        </div>
    )
}
export default Home;