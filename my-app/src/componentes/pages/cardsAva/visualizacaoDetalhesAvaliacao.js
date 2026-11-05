import Rating from '@mui/material/Rating';
import '../criarAvaliacao/visualizacaoAvaliacao/visualizacaoAvaliacao.css';

export default function VisualizacaoDetalhesAvaliacao({ avaliacao }) {
    const nome = avaliacao.nome || '';
    const imagemUrl = avaliacao.imagemUrl
        || (avaliacao.imagem?.startsWith('https://') ? avaliacao.imagem : null);

    return (
        <article className="containerVisualizacao">
            {nome ? (
                <h1 className="tituloVisualizacao">{nome}</h1>
            ) : (
                <h1 className="tituloVisualizacaoNull">
                    Nome da Obra
                </h1>
            )}

            <section className="areaImagem">
                {imagemUrl ? (
                    <img
                        className="imagemAvaliacao"
                        src={imagemUrl}
                        alt={`Imagem de ${nome || 'avaliação'}`}
                    />
                ) : (
                    <h3 className="imagemAvaliacaoNull">Área do banner</h3>
                )}

                {avaliacao.categoria ? (
                    <p className="categoria">Categoria: {avaliacao.categoria}</p>
                ) : (
                    <p className="categoriaNull">Categoria:</p>
                )}

                {avaliacao.lancamento ? (
                    <p className="lancamento">
                        Lançamento: {avaliacao.lancamento}
                    </p>
                ) : (
                    <p className="lancamentoNull">Lançamento:</p>
                )}

                {avaliacao.duracao ? (
                    <p className="duracao">Duração: {avaliacao.duracao}</p>
                ) : (
                    <p className="duracaoNull">Duração:</p>
                )}

                <p className="estrela">
                    <Rating
                        name="nota-da-avaliacao"
                        value={Number(avaliacao.estrelas) || 0}
                        precision={0.5}
                        readOnly
                    />
                </p>
            </section>

            <section className="areaInformacoes">
                {avaliacao.descricao ? (
                    <p className="containerDescricao">{avaliacao.descricao}</p>
                ) : (
                    <h3 className="containerDescricaoNull">Descrição</h3>
                )}

                {avaliacao.feedback ? (
                    <p className="containerDescricao">{avaliacao.feedback}</p>
                ) : (
                    <h3 className="containerDescricaoNull">Feedback</h3>
                )}

                {avaliacao.principais_pontos ? (
                    <p className="containerDescricao">
                        {avaliacao.principais_pontos}
                    </p>
                ) : (
                    <h3 className="containerDescricaoNull">Principais Pontos</h3>
                )}
            </section>
        </article>
    );
}
