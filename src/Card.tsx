import React, { FC, memo, useMemo } from 'react'
import { Card as CardType } from './types'
import { useMeasure } from 'react-use'
import { useAsset } from './storageAssets'

export const Card: FC<{ data: CardType, style: React.CSSProperties }> = memo(({ data, style }) => {
  const resources = useMemo(() => [
    data.imageUrl,
    data.imageUrlHiRes,
  ], [data.imageUrl, data.imageUrlHiRes])
  const { asset, retry } = useAsset(`cover-${data.id}`, resources)
  const [ref, { height, width }] = useMeasure()

  const blocSrc = useMemo(() => asset && URL.createObjectURL(asset), [asset])

  return (
    <div
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        ...style
      }}
      ref={ref as any}
    >
      {!blocSrc && (
        <>
          <h3>{data.name}</h3>
          <p>Loading card...</p>
        </>
      )}
      {
        blocSrc && (
          <img src={blocSrc} alt="card_img" style={{
            display: 'block',
            marginLeft: 'auto',
            marginRight: 'auto',
            objectFit: 'contain',
            position: 'absolute',
            height,
            maxWidth: width,
          }}
            onError={(e) => {
              retry()
            }}
          />
        )
      }
    </div >
  )
})