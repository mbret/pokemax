import { useState } from "react";
import './CoinTab.css'
import pikachuCoinPng from './assets/pikachu-coin.png'
import wall from './assets/1855468.jpg'
import { useWindowSize } from "react-use";

export const CoinTab = () => {
  const [head, setHead] = useState<undefined | boolean>(undefined)
  const { width, height } = useWindowSize()
  let coinWidth = width < height ? width * 0.5 : height * 0.5
  // if (coinWidth > 300) {}

  const onFlip = () => {
    const flipResult = Math.random();

    setHead(undefined)
    setTimeout(function () {
      if (flipResult <= 0.5) {
        setHead(true)
      }
      else {
        setHead(false)
      }
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        alignItems: 'center',
        backgroundImage: `url(${wall})`,
        backgroundSize: 'cover'
      }}
    >
      <div
        id="coin"
        style={{
          'position': 'relative',
          'margin': '0 auto',
          'width': coinWidth,
          'height': coinWidth,
          'cursor': 'pointer',
          transition: 'transform 1s ease-in',
          transformStyle: 'preserve-3d',
          // @ts-ignore
          '-webkit-transform-style': 'preserve-3d',
          ...(head === true) && {
            animation: 'flipHeads 2s ease-out forwards',
            // '-webkit-animation': 'flipHeads 2s ease-out forwards',
          },
          ...(head === false) && {
            animation: 'flipTails 2s ease-out forwards',
            // '-webkit-animation': 'flipTails 2s ease-out forwards',
          }
        }}
        onClick={onFlip}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            backgroundColor: 'black',
            zIndex: 100,
            borderRadius: '50%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          <img src={pikachuCoinPng} alt="coin" height="100%" width="100%" />
        </div>
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            transform: 'rotateY(-180deg)',
            borderRadius: '50%',
            backfaceVisibility: 'hidden',
            backgroundColor: 'black',
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          <img src={pikachuCoinPng} alt="coin" height="100%" width="100%" style={{ opacity: '20%' }} />
        </div>
      </div>
    </div>
  )
}