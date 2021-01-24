import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Card as CardType } from './types'
import localforage from 'localforage'
import { useMeasure } from 'react-use'
import { useRecoilCallback, useRecoilValue } from 'recoil'
import { cardState, dbState } from './useDb'
import { useAsset } from './storageAssets'

export const Card: FC<{ data: CardType, style: React.CSSProperties }> = memo(({ data, style }) => {
  const resources = useMemo(() => [
    data.imageUrl,
    data.imageUrlHiRes,
  ], [data.imageUrl, data.imageUrlHiRes])
  const { asset, retry } = useAsset(`cover-${data.id}`, resources)
  // const { asset, retry } = {asset: null,retry: () => {}}
  const [ref, { height, width }] = useMeasure()

  const blocSrc = useMemo(() => asset && URL.createObjectURL(asset), [asset])

  // console.log('card', data.id, asset)
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

const useCardImage = (id: string) => {
  const { imageUrl, imageUrlHiRes, imgCacheBuster } = useRecoilValue(cardState(id)) || {}
  const [imgData, setImgData] = useState<{ blob: Blob, lowRes?: boolean } | undefined | null>(undefined)
  const [retryCount, setRetryCount] = useState(0)
  const loadImage = useLoadImage()

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
          let data = await localforage.getItem<({ blob: Blob, lowRes?: boolean }) | null>(id)

          if (!noLongerValid) {
            setImgData(data)
          }
        } catch (e) {
          console.error(e)
        }
      })()

    return () => {
      noLongerValid = true
    }
  }, [imageUrl, id, retryCount, imageUrlHiRes, loadImage, imgCacheBuster])

  useEffect(() => {
    if ((imgData === null || imgData?.lowRes) && imageUrlHiRes) {
      loadImage(id, imageUrlHiRes, false)
    }

    if (imgData === null && imageUrl) {
      loadImage(id, imageUrl, true)
    }
  }, [imgData, id, imageUrlHiRes, imageUrl, loadImage])

  console.log('useCardImage', id, imgData)

  return { imgData: imgData?.blob || undefined, retry }
}

const useLoadImage = () => {
  return useRecoilCallback(({ set, snapshot }) => async (id: string, url: string, lowRes: boolean) => {
    console.log('useLoadImage', id, url)
    try {
      const response = await fetch(url)
      if (response.status === 200) {
        const blob = await response.blob()
        const data = { blob: blob, lowRes }

        let existingData = await localforage.getItem<({ blob: Blob, lowRes?: boolean }) | null>(id)
        if (!existingData || existingData?.lowRes) {
          await localforage.setItem(id, data)
          set(dbState, old => old.map(item => {
            if (item.id === id) {
              return { ...item, imgCacheBuster: (item.imgCacheBuster || 0) + 1 }
            }
            return item
          }))
        }

        return data
      }
    } catch (e) {
      console.error(e)
    }
  }, [])
}