import CardsAva from './cardsAva'
import styled from './paginasCardsAva.css'
import pesquisar from '../../../pesquisa.png'
import CarouselAva from './carouselAva'
import SetaEsquerda from '../../../seta-esquerda.png'
import SetaDireita from '../../../seta-direita.png'

function PaginaCadsAva() {
    return (
        <bory>
            <button className="maisAva" >
                <span>
                    <img className='pesquisar' src={pesquisar} />
                </span>
                Mais avaliações
            </button>

            <div className='visualizacaoWrapper'>
                <div className={'containerAvas'}>
                    <button className='carouselButton'>
                        <span className='seta'>
                            <img className='seta' src={SetaEsquerda} />
                        </span>
                    </button>
                    <div>
                            <CardsAva />
                    </div>
                    <button className='carouselButton'>
                        <span className='seta'>
                            <img className='seta' src={SetaDireita} />
                        </span>
                    </button>



                </div>

            </div>
        </bory>


    )
}
export default PaginaCadsAva;