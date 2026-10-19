import React, { useRef, useState } from 'react';
import { Swiper } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import CardAva from './cardsMaisAva';

import { Pagination } from 'swiper/modules';

export default function CarouselAva() {
  return (
    <>
      <Swiper
        slidesPerView={3}
        spaceBetween={5}
        pagination={{
          clickable: true,
        }}
        modules={[Pagination]}
        className="mySwiper"
      >
        <CardAva />
      </Swiper>
    </>
  );
}