import Seta from '../../seta-esquerda.png'
import { useNavigate } from 'react-router-dom';

function ButtonVoltar({onVoltar}) {
    const navigate = useNavigate();

    function Voltar(){
        navigate("/home");
    }
    return (
        <button className='voltar' type='submit' id='buttonCadastrar' onClick={Voltar} >
            <span className='imgVoltar'>
                <img className='imgVoltar' src={Seta} alt="Seta para voltar" />
            </span>
        </button>
    )
}

export default ButtonVoltar;