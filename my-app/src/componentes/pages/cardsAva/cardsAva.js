import { useState, useEffect } from 'react';
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
import { apiRequest } from '../../../services/api';
import { observarAutenticacao } from '../../../firebase/auth';

export default function RecipeReviewCard() {
    const [erro, setErro] = useState("");
    const [avaliacoes, setAvaliacoes] = useState([]);

    useEffect(() => {
        return observarAutenticacao((usuario) => {
            if (!usuario) {
                setErro("Entre na sua conta para ver suas avaliações.");
                return;
            }

            apiRequest("/avaliacoes_usuario")
                .then((resultado) => {
                    setAvaliacoes(resultado);
                    setErro("");
                })
                .catch((erroBusca) => {
                    console.error("Erro ao buscar avaliações:", erroBusca);
                    setErro(erroBusca.message || "Não foi possível buscar as avaliações.");
                });
        });
    }, []);

    return (
        <main className="avaliacoes">
            {erro && (
                <Typography color="error" role="alert">
                    {erro}
                </Typography>
            )}
            {!erro && avaliacoes.length === 0 && (
                <Typography className="mensagemErroSemAva">
                    Você ainda não possui avaliações cadastradas. Para criar sua primeira avaliação volte para a página principal e click em "criar avaliação"
                </Typography>
            )}

            {avaliacoes.map((avaliacao) => (
                <Card
                    key={avaliacao.id}
                    className="avaliacaoCard"
                >
                    <CardHeader
                        className="headerCard"
                        title={avaliacao.nome}
                        subheader={avaliacao.categoria}
                    />

                    {avaliacao.imagemUrl && (
                        <CardMedia
                            component="img"
                            image={avaliacao.imagemUrl}
                            alt={`Imagem de ${avaliacao.nome}`}
                        />
                    )}

                    <CardContent>
                        <Typography className="descricao">
                            {avaliacao.dataCriacao}
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
            ))}
        </main>
    );
}