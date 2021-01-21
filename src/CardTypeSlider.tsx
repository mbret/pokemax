import React, { FC, useCallback, useEffect, useRef, useState } from 'react'
import { Card as CardType } from './types'
import { Card as CardComponent } from './Card';
import Hammer from 'hammerjs'
import { useWindowSize } from 'react-use';
import { CardSwitcher } from './CardSwitcher';
import Slider from "react-slick"
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from 'react-responsive-carousel'

const sensitivity = 25

export const CardTypeSlider: FC<{ data: CardType[][], style?: React.CSSProperties }> = ({ data, style }) => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const timer = useRef<undefined | any>(undefined)
  const [percentageCalculated, setPercentageCalculated] = useState(0)
  const { width, height } = useWindowSize()
  const [hammer, setHammer] = useState<HammerManager | undefined>(undefined)
  // const { width, height } = useWindowSize()

  const goTo = useCallback((number: number) => {
    let currentSlide = 0
    // 5a. Stop it from doing weird things like moving to slides that don’t exist
    if (number < 0)
      currentSlide = 0
    else if (number > data.length - 1)
      currentSlide = data.length - 1
    else
      currentSlide = number

    setCurrentSlide(currentSlide)

    // 5b. Apply transformation & smoothly animate via .is-animating CSS
    setIsAnimating(true)
    var percentage = -(100 / data.length) * currentSlide;
    setPercentageCalculated(percentage)
    clearTimeout(timer.current);
    timer.current = setTimeout(function () {
      setIsAnimating(false)
    }, 400)

    // 5c. Update the counters
    // var pagination = slider.sliderEl.parentElement.querySelectorAll(slider.sliderPaginationSelector + ' > *');
    // var n = 0;
    // for (n; n < pagination.length; n++) {
    //   var className = n == slider.activeSlide ? 'is-active' : '';
    //   pagination[n].className = className;
    // }
  }, [data])

  useEffect(() => {
    const onPan: HammerListener = (e) => {
      // 4e. Calculate pixel movements into 1:1 screen percents so gestures track with motion
      var percentage = (100 / data.length) * (e.deltaX / width);
      // var percentage = (100) * (e.deltaX / width);

      // 4f. Multiply percent by # of slide we’re on
      var percentageCalculated = percentage - 100 / data.length * currentSlide

      setPercentageCalculated(percentageCalculated)

      // 4h. Snap to slide when done
      if (e.isFinal) {
        if (e.velocityX > 1) {
          goTo(currentSlide - 1);
        } else if (e.velocityX < -1) {
          goTo(currentSlide + 1)
        } else {
          if (percentage <= -(sensitivity / data.length))
            goTo(currentSlide + 1);
          else if (percentage >= (sensitivity / data.length))
            goTo(currentSlide - 1);
          else
            goTo(currentSlide);
        }
      }

      // console.log('pan', percentage, percentageCalculated)
    }

    hammer?.on('pan', onPan)

    return () => {
      hammer?.off('pan', onPan)
    }
  }, [hammer, width, data, currentSlide, goTo])

  useEffect(() => {
    hammer?.add(new Hammer.Pan({ threshold: 0, pointers: 0 }))

  }, [hammer])

  return (
    <div
      ref={ref => {
        // ref && !hammer && setHammer(new Hammer(ref, {}))
      }}
      style={{
        // paddingTop: 10,
        // borderTop: '1px solid black',
        display: 'flex',
        flexDirection: 'column',
        // flexGrow: 1,
        // width: `${100 * data.length}%`,
        // overflowX: 'scroll',
        // transform: `translateX(${percentageCalculated * data.length}%)`,
        // ...isAnimating && {
        //   transition: `transform 400ms cubic-bezier( 0.5, 0, 0.5, 1 )`
        // }
        height: '100%',
        // border: '1px solid red'
      }}>
      {/* <CardSwitcher
        data={data[0]}
        style={{
          // border: '1px solid red',
          width: '100%',
          height: '100%',
          flexShrink: 0,
        }}
      /> */}
      {/* <Carousel autoPlay={false} infiniteLoop={data.length > 1} showArrows={false} showIndicators={false} onClickItem={(e, item) => {
        console.log(e, item)
      }} > */}
      <Slider {...{
        dots: false,
        infinite: true,
        useCSS: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        adaptiveHeight: false,
        // draggable: false,
        waitForAnimate: true,
        // touchMove: false,
        // swipeToSlide: false,
        speed: 50,
        className: 'flex-carousel',
      }}>
        {data.map((groupOfCards, i) => (
          <div className="itemWrapper">
            <CardSwitcher
              data={groupOfCards}
              key={i}
              style={{
                display: 'flex',
                // border: '1px solid red',
                width: '100%',
                height: '100%',
                flexShrink: 0,
              }}
            />
          </div>
        ))}
      </Slider>
    </div >
  )
}