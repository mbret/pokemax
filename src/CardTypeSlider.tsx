import React, { FC, useMemo } from 'react'
import { Card as CardType } from './types'
import { CardSwitcher } from './CardSwitcher';
import Slider from "react-slick"

export const CardTypeSlider: FC<{ data: CardType[][], style?: React.CSSProperties }> = ({ data, style }) => {
  const styles = useMemo(() => ({
    switcher: {
      display: 'flex',
      width: '100%',
      height: '100%',
      flexShrink: 0,
    }
  }), [])

  const boxItems = useMemo(() => data.map((groupOfCards, i) => (
    <div className="itemWrapper" key={i}>
      <CardSwitcher
        data={groupOfCards}
        style={styles.switcher}
      />
    </div>
  )), [data, styles])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}>
      <Slider {...{
        dots: false,
        infinite: true,
        useCSS: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        adaptiveHeight: false,
        waitForAnimate: true,
        speed: 50,
        className: 'flex-carousel',
      }}>
        {boxItems}
      </Slider>
    </div >
  )
}