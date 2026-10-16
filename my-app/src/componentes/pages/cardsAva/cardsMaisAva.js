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

export default function RecipeReviewCard() {

    const [erro, setErro] = useState("");
    const [avaliacao, setAvaliacao] = useState([]);

    useEffect(() => {
        async function buscarAva() {
            try {
                const resposta = await fetch(
                    `https://lacstar-backend.onrender.com/avaliacao`
                );
                const resultado = await resposta.json();

                if (!resposta.ok) {
                    setErro(
                        resultado.erro ||
                        "Não foi possivel buscar as avaliações."
                    );
                    return;
                }

                setAvaliacao(resultado);
                setErro("");
            } catch (erro) {
                console.error("Erro ao buscar avaliações:", erro);
                setErro("Erro ao conectar com o servidor.");
            }
        }
        buscarAva();
    }, []);

    return (
        <main className="avaliacoes">
            {erro && (
                <Typography color="error" role="alert">
                    {erro}
                </Typography>
            )}
            {!erro && avaliacao.length === 0 && (
                <Typography className="mensagemErroSemAva">
                    Não é possivel encontrar avaliações :(
                </Typography>
            )}

            {avaliacao.map((avaliacao) => (
                <Card
                    key={avaliacao.id}
                    className="avaliacaoCard"
                >
                    <CardHeader
                        className="headerCard"
                        title={avaliacao.nome}
                        subheader={avaliacao.catrgoria}
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
                            label="Compartilhar avaliação"
                            disableRipple
                        >
                            <ShareIcon />
                        </IconButton>
                    </CardActions>
                </Card>
            ))}
        </main>
    )
}
