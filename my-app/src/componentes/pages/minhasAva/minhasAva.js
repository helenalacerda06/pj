import Header from '../../Header'
import Footer from '../../Footer'
import style from './minhasAva.css'

function minhasAva(){
    return(
        <bory>
            <Header />
            <h1 className="tituloMinhasAva">Minhas Avaliações</h1>
                <div className='visualizacaoWrapper'>
                    <div className={'containerMinhaAva'}>

                    </div>
                </div>
                <Footer />
        </bory>
    )
}
export default minhasAva;