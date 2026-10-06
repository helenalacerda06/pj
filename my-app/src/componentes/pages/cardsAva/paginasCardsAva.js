import pesquisar from '../../../pesquisa.png'
import SetaEsquerda from '../../../seta-esquerda.png'
import SetaDireita from '../../../seta-direita.png'
import styled from './paginasCardsAva.css'

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
                    <button className='carouselButton'>
                        <span className='seta'>
                            <img className='seta' src={SetaEsquerda} alt="Seta para esquerda" />
                        </span>
                    </button>
                    <button className='carouselButtonDireita'>
                        <span className='seta'>
                            <img className='seta' src={SetaDireita} alt="Seta para direita" />
                        </span>
                    </button>

                </div>

            </div>
        </bory>


    )
}
export default PaginaCadsAva;