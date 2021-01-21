import React, { FC, useEffect, useState } from 'react'
import { Card as CardType } from './types'
import { Card as CardComponent } from './Card';
import Hammer from 'hammerjs'
import { useWindowSize } from 'react-use';

export const CardSwitcher: FC<{ data: CardType[], style: React.CSSProperties }> = ({ data, style }) => {
  const [currentCard, setCurrentCard] = useState(0)
  const [hammer, setHammer] = useState<HammerManager | undefined>(undefined)
  const { width } = useWindowSize()

  useEffect(() => {
    setCurrentCard(0)
  }, [data])

  useEffect(() => {
    const onTap: HammerListener = ev => {
      console.log(ev.center)
      if (ev.center.x > (width / 2)) {
        setCurrentCard(index => {
          if (data.length > (index + 1)) return index + 1
          return 0
        })
      } else {
        setCurrentCard(index => {
          if ((index - 1) >= 0) return index - 1
          return data.length - 1
        })
      }
    }
    hammer?.on('tap', onTap)

    return () => {
      hammer?.off('tap', onTap)
    }
  }, [hammer, width, data])

  return (
    <div style={{ display: 'flex', height: '100%', flexDirection: 'column', ...style }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', padding: 5 }}>
        {data.map((_, i) => (
          <div style={{
            backgroundColor: 'rgba(128,128,128,0.5)',
            ...i === currentCard && {
              backgroundColor: 'rgba(128,128,128,1)',
            },
            width: 10, height: 10, borderRadius: 50, margin: 1
          }}></div>
        ))}
      </div>
      <div style={{ display: 'flex', flexGrow: 1 }} ref={ref => {
        ref && !hammer && setHammer(new Hammer(ref, {}))
      }}>
        {data[currentCard] && (<CardComponent
          data={data[currentCard]}
          style={{
            width: '100%',
            display: 'flex',
            flexGrow: 1,
            // height: '100%'
          }}
        />)}
      </div>
    </div>
  )
}