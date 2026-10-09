import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import './cardsAva.css';

const ExpandMore = styled((props) => {
    const { expand, ...other } = props;
    return <IconButton {...other} />;
})(({ Theme }) => ({
    marginLeft: 'auto',
    transition: Theme.transition.create('transform', {
        duration: Theme.transition.duration.shortest,
    }),
    variants: [
        {
            props: ({ expand }) => !expand,
            style: {
                transform: 'rotate(0deg)',
            },
        },
        {
            props: ({ expand }) => !!expand,
            style: {
                transform: 'rotate(180deg)',
            },
        },
    ],
}));



export default function RecipeReviewCard() {
    const navigate = useNavigate();
    const idUsuario = localStorage.getItem("id_usuario");
    const [erro, setErro] = useState("");

    const [avaliacoes, setAvaliacoes] = useState([]);

    const [expanded, setExpanded] = React.useState(false);

    useEffect(() => {
async function buscarAva() {
try {
console.log("ID do usuário:", idUsuario);

        const resposta = await fetch(
            `http://localhost:3002/avaliacoes_usuarios/${idUsuario}`
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {
            setErro(
                resultado.erro || "Não foi possível buscar as avaliações."
            );
            return;
        }

        console.log("Avaliações recebidas:", resultado);
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
            {avaliacoes.map((avaliacao) => (
                <Card key={avaliacao.id} className="avaliacaoCard" sx={{ maxWidth: 345 }}>

                    <CardHeader className={'headerCard'}
                        title={avaliacao.nome}
                        subheader={avaliacao.categoria}
                    />
                    <CardMedia
                        component="img"
                        image={avaliacao.imagem}
                        alt="Imagem da avaliação"
                    />
                    <CardContent>
                        <Typography className={'descricao'}>
                            {avaliacao.descricao}
                        </Typography>
                    </CardContent>
                    <CardActions disableSpacing>
                        <IconButton aria-label="add to favorites" disableRipple>
                            <FavoriteIcon />
                        </IconButton>
                        <IconButton aria-label="share" disableRipple>
                            <ShareIcon />
                        </IconButton>
                    </CardActions>
                </ Card>
            ))
            }
        </main>
    );
}