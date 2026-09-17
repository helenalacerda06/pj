import CardsAva from './cardsAva'
import styled from './paginasCardsAva.css'
import pesquisar from '../../../pesquisa.png'

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
                    <CardsAva />


                </div>

            </div>
        </bory>


    )
}
export default PaginaCadsAva;