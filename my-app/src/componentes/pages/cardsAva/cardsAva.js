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
    const idUsuario = localStorage.getItem("id_usuario");

    const [erro, setErro] = useState("");
    const [avaliacoes, setAvaliacoes] = useState([]);

    useEffect(() => {
        async function buscarAva() {
            try {
                const resposta = await fetch(
                    `http://localhost:3002/avaliacoes_usuarios/${idUsuario}`
                );

                const resultado = await resposta.json();

                if (!resposta.ok) {
                    setErro(
                        resultado.erro ||
                        "Não foi possível buscar as avaliações."
                    );
                    return;
                }

                setAvaliacoes(resultado);
                setErro("");

            } catch (erro) {
                console.error("Erro ao buscar avaliações:", erro);
                setErro("Erro ao conectar com o servidor.");
            }
        }

        if (idUsuario) {
            buscarAva();
        } else {
            setErro("Nenhum usuário está identificado.");
        }
    }, [idUsuario]);

    return (
        <main>
            {erro && (
                <Typography color="error" role="alert">
                    {erro}
                </Typography>
            )}

            {!erro && avaliacoes.length === 0 && (
                <Typography>
                    Você ainda não possui avaliações cadastradas.
                </Typography>
            )}

            {avaliacoes.map((avaliacao) => (
                <Card
                    key={avaliacao.id}
                    className="avaliacaoCard"
                    sx={{ maxWidth: 345 }}
                >
                    <CardHeader
                        className="headerCard"
                        title={avaliacao.nome}
                        subheader={avaliacao.categoria}
                    />

                    {avaliacao.imagem && (
                        <CardMedia
                            component="img"
                            image={avaliacao.imagem}
                            alt={`Imagem de ${avaliacao.nome}`}
                        />
                    )}

                    <CardContent>
                        <Typography className="descricao">
                            {avaliacao.descricao}
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