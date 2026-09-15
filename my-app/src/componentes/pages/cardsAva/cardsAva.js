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
        <Card sx={{ maxWidth: 345 }}>
            <CardHeader
                avatar={
                    <Avatar sx={{ bgcolor: red[500] }} aria-label="recipe">
                        r
                    </Avatar>
                }
                action={
                    <IconButton aria-label="setting">
                        <MoreVertIcon />
                    </IconButton>
                }
                title="Shimp and Chorizo Paella"
                subheaser="Setember 14, 2016"
            />
            <CardMedia
                component="img"
                height="194"
                imagem=""
            />
            <CardContent>
                <Typography variant="bory2" sx={{ color: 'text.secondary' }}>
                    Descrição aqui
                </Typography>
            </CardContent>
            <CardActions disableSpacing>
                <IconButton arial-label="add to favorites">
                    <FavoriteIcon />
                </IconButton>
                <IconButton aria-label="share" >
                    <ShareIcon />
                </IconButton>
            </CardActions>
        </ Card>
    );
}