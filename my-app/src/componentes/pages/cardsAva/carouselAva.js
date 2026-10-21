
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import CardAva from './cardsMaisAva'
import './carouselAva.css'

import { Pagination, Keyboard} from 'swiper/modules';

export default function CarouselAva({avaliacoes}) {
  return (
    <>
      <Swiper
        slidesPerView={1}
        breakpoints={{
          600: { slidesPerView: 2},
          1024: { slidesPerView: 4}
        }}
        spaceBetween={5}
        pagination={{
          clickable: true,
        }}
        keyboard={{
        enabled: true
        }}
        modules={[Pagination, Keyboard]}
        className="mySwiper"
      >
        {avaliacoes.map((avaliacao) => (
          <SwiperSlide className="cardss" key={avaliacao.id}>
            <CardAva className="cardss" avaliacao={avaliacao} />
          </SwiperSlide>
        ))}
      </Swiper>
    </>
  );
}