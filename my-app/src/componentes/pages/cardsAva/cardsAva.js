import * as React from 'react';
import { useState } from 'react';
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

    const handleExpandClick = () => {
        setExpanded(!expanded);
    };

    async function buscarAva (event) {
        event.preventDefault();
        try {
            const resposta = await fetch(`https://lacstar-backend.onrender.com/avaliacoes_usuarios/${idUsuario}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            }
            );
            const resultado = await resposta.json();

            if (!resposta.ok) {
                setErro(resultado.erro || "Não foi possível buscar as avaliações.");
                return;
            }
            console.log(resultado);
        } catch (erro) {
            setErro("Erro ao conectar com o servidor.");
        }
    }
return (
    <main>
        {avaliacoes.map((avaliacao) => (
    <Card className="avaliacaoCard" sx={{ maxWidth: 345 }}>
        
        <CardHeader className={'headerCard'}
            title={avaliacao.nome}
            subheader={avaliacao.subheader}
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