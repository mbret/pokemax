import React, { FC, useCallback, useEffect, useState } from 'react'
import { Card as CardType } from './types'
import localforage from 'localforage'
import { useMeasure } from 'react-use'

export const Card: FC<{ data: CardType, style: React.CSSProperties }> = ({ data, style }) => {
  const { imgData, retry } = useRetrieveImg(data.imageUrlHiRes, data.id)
  const [ref, { height, width }] = useMeasure()

  console.log('Card', { height, data })

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
      {!imgData && (
        <>
          <h3>{data.name}</h3>
          <p>Loading card...</p>
        </>
      )}
      {
        imgData && <img src={URL.createObjectURL(imgData)} alt="card_img" style={{
          display: 'block',
          marginLeft: 'auto',
          marginRight: 'auto',
          objectFit: 'contain',
          position: 'absolute',
          // width,
          height,
          // height: '100%',
          maxWidth: width,
          // height: 100,
          // width: 100,
          // width: 
        }}
          onError={(e) => {
            retry()
          }}
        />
      }
    </div >
  )
}

const useRetrieveImg = (imageUrl: string, id: string) => {
  const [imgData, setImgData] = useState<Blob | undefined>(undefined)
  const [retryCount, setRetryCount] = useState(0)

  const retry = useCallback(async () => {
    setRetryCount(old => old < 3 ? old + 1 : old)
  }, [])

  useEffect(() => {
    setImgData(undefined)
  }, [id])

  useEffect(() => {
    let noLongerValid = false

      ; (async () => {
        try {
          if (retryCount > 0) {
            await localforage.removeItem(id)
          }
          let data = await localforage.getItem<Blob | null>(id)

          if (!data) {
            const response = await fetch(imageUrl, {
              // mode: 'no-cors'
            })
            console.log(response)
            if (response.status === 200) {
              const blob = await response.blob()
              await localforage.setItem(id, blob)
              data = blob
            }
          }

          if (!noLongerValid && data) {
            setImgData(data)
          }
        } catch (e) {
          console.error(e)
        }
      })()

    return () => {
      noLongerValid = true
    }
  }, [imageUrl, id, retryCount])

  return { imgData, retry }
}