import {
    Card,
    CardHeader,
    CardMedia,
    CardContent,
    CardActions,
    IconButton,
    Typography
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import './cardsAva.css';

export default function RecipeReviewCard({avaliacao, onSelecionar}) {

    return (
                <Card className="avaliacaoCard">
                    <button
                        className="cardDetalhesAcionador"
                        type="button"
                        aria-label={`Abrir detalhes: ${avaliacao.nome}`}
                        onClick={onSelecionar}
                    >
                        <CardHeader
                            className="headerCard"
                            title={avaliacao.nome}
                            subheader={avaliacao.categoria}
                        />

                        {avaliacao.imagem && (
                            <CardMedia
                                component="img"
                                image={`https://lacstar-backend.onrender.com${avaliacao.imagem}`}
                                alt={`Imagem de ${avaliacao.nome}`}
                            />
                        )}

                        <CardContent>
                            <Typography className="descricao">
                                {avaliacao.data}
                            </Typography>
                        </CardContent>
                    </button>

                    <CardActions disableSpacing>
                        <IconButton
                            aria-label="Adicionar aos favoritos"
                            disableRipple
                        >
                            <FavoriteIcon />
                        </IconButton>

                        <IconButton
                            aria-label="Compartilhar avaliação"
                            disableRipple
                        >
                            <ShareIcon />
                        </IconButton>
                    </CardActions>
                </Card>
    )
}
