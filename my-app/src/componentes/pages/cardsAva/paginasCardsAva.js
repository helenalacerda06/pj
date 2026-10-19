import pesquisar from '../../../pesquisa.png'
import SetaEsquerda from '../../../seta-esquerda.png'
import SetaDireita from '../../../seta-direita.png'
import './paginasCardsAva.css'
import AvaCard from './cardsMaisAva'
import CarouselAva from './carouselAva'

function PaginaCadsAva() {
    return (
        <bory>
            <button className="maisAva" >
                <span>
                    <img className='pesquisar' src={pesquisar} alt="Ícone de pesquisa" />
                </span>
                Mais avaliações
            </button>

            <div className='visualizacaoWrapper'>
                <div className={'containerAvas'}>
                    <CarouselAva />
                </div>

            </div>
        </bory>


    )
}
export default PaginaCadsAva;