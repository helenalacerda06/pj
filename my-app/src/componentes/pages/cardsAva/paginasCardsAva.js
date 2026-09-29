import CardsAva from './cardsAva'
import styled from './paginasCardsAva.css'
import pesquisar from '../../../pesquisa.png'
import CarouselAva from './carouselAva'
import SetaEsquerda from '../../../seta-esquerda.png'
import SetaDireita from '../../../seta-direita.png'

function PaginaCadsAva() {
    return (
        <section>
            <button className="maisAva" >
                <span>
                            <img className='pesquisar' src={pesquisar} />
                </span>
                Mais avaliações
            </button>

            <div className='visualizacaoWrapper'>
                <div className={'containerAvas'}>
                    <button className='carouselButton'>
                        <img className='seta' src={SetaEsquerda} />
                    </button>
                    <button className='carouselButtonDireita'>
                        <img className='seta' src={SetaDireita} />
                    </button>

                </div>

            </div>
        </section>


    )
}
export default PaginaCadsAva;