import * as React from 'react';
import { duration, styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { red } from '@mui/material/colors';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import MoreVertIcon from '@mui/icons-material/MoreVert';
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
    const [expanded, setExpanded] = React.useState(false);

    const handleExpandClick = () => {
    };

    return (
        <Card className="avaliacaoCard" sx={{ maxWidth: 345 }}>
            <CardHeader className={'headerCard'}
                title="Nome"
                subheader="Lançamento"
            />
            <CardMedia
                component="img"
                imagem=""
            />
            <CardContent>
                <Typography className={'descricao'}>
                    Descrição aqui
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
    );
}