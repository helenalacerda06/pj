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

export default function RecipeReviewCard({avaliacao}) {

    return (

                <Card
                    className="avaliacaoCard"
                >
                    <CardHeader
                        className="headerCard"
                        title={avaliacao.nome}
                        subheader={avaliacao.categoria}
                    />

                    {avaliacao.imagem && (
                        <CardMedia
                            component="img"
                            image={
                                avaliacao.imagem
                                    ? `https://lacstar-backend.onrender.com${avaliacao.imagem}`
                                    : undefined
                            }
                            alt={`Imagem de ${avaliacao.nome}`}
                        />
                    )}

                    <CardContent>
                        <Typography className="descricao">
                            {avaliacao.data}
                        </Typography>
                    </CardContent>

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
