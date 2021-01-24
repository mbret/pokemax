import React, { FC, memo, useEffect, useState } from 'react'
import { Card as CardType } from './types'
import { Card as CardComponent } from './Card';
import Hammer from 'hammerjs'
import { useWindowSize } from 'react-use';

export const CardSwitcher: FC<{ data: CardType[], style: React.CSSProperties }> = memo(({ data, style }) => {
  const [currentCard, setCurrentCard] = useState<string | undefined>(data[0]?.id)
  const [hammer, setHammer] = useState<HammerManager | undefined>(undefined)
  const { width } = useWindowSize()
  const currentCardObject = data.find(({ id }) => id === currentCard)
  const currentCardIndex = data.findIndex(({ id }) => id === currentCard)

  useEffect(() => {
    setCurrentCard(current => data.find(({ id }) => id === current) ? current : data[0]?.id)
  }, [data])

  useEffect(() => {
    const onTap: HammerListener = ev => {
      const range = width / 5
      if (ev.center.x > (width - range)) {
        setCurrentCard(oldId => {
          const index = data.findIndex(({ id }) => id === oldId)

          if (data.length > (index + 1)) return data[index + 1].id
          return data[0].id
        })
      } else if (ev.center.x < range) {
        setCurrentCard(oldId => {
          const index = data.findIndex(({ id }) => id === oldId)
          if ((index - 1) >= 0) return data[index - 1].id
          return data[data.length - 1].id
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
            ...i === currentCardIndex && {
              backgroundColor: 'rgba(128,128,128,1)',
            },
            width: 10, height: 10, borderRadius: 50, margin: 1
          }}></div>
        ))}
      </div>
      <div style={{ display: 'flex', flexGrow: 1 }} ref={ref => {
        ref && !hammer && setHammer(new Hammer(ref, {}))
      }}>
        {currentCardObject && (
          <CardComponent
            data={currentCardObject}
            style={{
              width: '100%',
              display: 'flex',
              flexGrow: 1,
            }}
          />
        )}
      </div>
    </div>
  )
})