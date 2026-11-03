
import { Swiper, SwiperSlide } from 'swiper/react';
import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { useState } from 'react';
import 'swiper/css';
import 'swiper/css/pagination';
import CloseIcon from '@mui/icons-material/Close';
import CardAva from './cardsMaisAva';
import VisualizacaoDetalhesAvaliacao from './visualizacaoDetalhesAvaliacao';
import './carouselAva.css';
import '../criarAvaliacao/criarAvaliacao.css';

import { Pagination, Keyboard } from 'swiper/modules';

export default function CarouselAva({ avaliacoes }) {
  const [avaSelecionada, setAvaSelecionada] = useState(null);

  return (
    <>
      <Swiper
        slidesPerView={1}
        breakpoints={{
          600: { slidesPerView: 2 },
          1024: { slidesPerView: 4 }
        }}
        spaceBetween={5}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        keyboard={{
          enabled: true
        }}
        modules={[Pagination, Keyboard]}
        className="mySwiper"
      >
        {avaliacoes.map((avaliacao) => (
          <SwiperSlide className="cardss" key={avaliacao.id}>
            <CardAva
              className="cardss"
              avaliacao={avaliacao}
              onSelecionar={() => setAvaSelecionada(avaliacao)}
            />
          </SwiperSlide>
        ))}
      </Swiper>


      <Dialog
        open={Boolean(avaSelecionada)}
        onClose={() => setAvaSelecionada(null)}
        aria-labelledby="detalhe-avaliacao-dialog-title"
        maxWidth={false}
        slotProps={{ paper: { className: 'dialogContent' } }}
      >
        <DialogTitle className="detalhesDialogTitle">
          <span
            className="detalhesDialogTituloAcessivel"
            id="detalhe-avaliacao-dialog-title"
          >
            {avaSelecionada?.nome || 'Detalhes da avaliação'}
          </span>
          <IconButton
            className="detalhesFecharButton"
            aria-label="Fechar detalhes"
            onClick={() => setAvaSelecionada(null)}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent className="detalhesDialogBody">
          {avaSelecionada && (
            <VisualizacaoDetalhesAvaliacao avaliacao={avaSelecionada} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 