import { useEffect, useMemo, useState } from "react"
import { atom, selectorFamily, useRecoilState, useRecoilValue, useSetRecoilState } from "recoil"
import localforage from 'localforage'
import { useMountedState } from "react-use"

const MAX_RETRY_TIME = 2

type Asset = {
  id: string,
  value: Blob | undefined,
  cacheBuster: number,
  resources: string[]
  downloading: boolean
  state: undefined | 'missing' | 'downloaded',
  missingHigherOrder: boolean
}

const assetsState = atom<Asset[]>({
  key: 'assetsState',
  default: []
})

const assetState = selectorFamily({
  key: 'assetState',
  get: (id: string) => ({ get }) => get(assetsState).find(asset => asset.id === id)
})

const retryFetch = async (resource: string, retryNumber = 0): Promise<Blob> => {
  if (retryNumber === MAX_RETRY_TIME) {
    throw new Error('Unable to fetch')
  }

  retryNumber = retryNumber + 1
  try {
    const response = await fetch(resource)
    if (response.status === 200) {
      return await response.blob()
    }
    throw new Error('Unable to fetch')
  } catch (e) {
    return await retryFetch(resource, retryNumber + 1)
  }
}

const useStorageAsset = (id: string) => {
  const { cacheBuster, id: existingId, state } = useRecoilValue(assetState(id)) || {}
  const [data, setData] = useState<Blob | undefined>()
  const isMounted = useMountedState()
  const setAssetsState = useSetRecoilState(assetsState)

  useEffect(() => {
    if (!existingId || state === 'missing') return

      ; (async () => {
        let data = await localforage.getItem<({ blob: Blob, order: number }) | null>(existingId)

        if (data && isMounted()) {
          setData(data.blob)
          if (state !== 'downloaded') {
            setAssetsState(old => old.map(item => item.id === existingId
              ? {
                ...item,
                state: 'downloaded',
                missingHigherOrder: (data?.order || 0) < (item.resources.length - 1),
              }
              : item
            ))
          }
        }
        if (!data && isMounted()) {
          setAssetsState(old => old.map(item => item.id === existingId ? { ...item, state: 'missing' } : item))
        }
      })()
  }, [cacheBuster, isMounted, existingId, state, setAssetsState])

  useEffect(() => {
    setData(undefined)
  }, [id])

  return data
}

export const useAsset = (id: string, resources: string[]) => {
  const { id: existingAssetId } = useRecoilValue(assetState(id)) || {}
  const setAssetsState = useSetRecoilState(assetsState)
  const data = useStorageAsset(id)

  useEffect(() => {
    setAssetsState(old => {
      if (!old.find((old => old.id === id))) {
        return [...old, { cacheBuster: 0, id, state: undefined, value: undefined, resources, downloading: false, missingHigherOrder: false }]
      }
      return old.map(item => item.id === id ? { ...item, resources } : item)
    })
  }, [setAssetsState, existingAssetId, id, resources])

  return useMemo(() => ({
    asset: data, retry: () => {

      console.log('retry')
    }
  }), [data])
}

export const StorageAssets = () => {
  const [assets, setAssets] = useRecoilState(assetsState)

  useEffect(() => {
    const assetsToDownload = assets.filter(asset => (asset.state === 'missing' || asset.missingHigherOrder) && !asset.downloading)

    if (assetsToDownload.length === 0) return

    setAssets(old => old.map(old => {
      const found = assetsToDownload.find(({ id }) => id === old.id)

      if (!found) return old

      return { ...old, downloading: true }
    }))

      ; (async () => {
        await Promise.all(assetsToDownload.map(async ({ resources, id, missingHigherOrder }) => {
          let startFromIndexOrder = 0
            ; (async () => {
              try {
                if (missingHigherOrder) {
                  let data = await localforage.getItem<({ blob: Blob, order: number }) | null>(id)
                  if (typeof data?.order === 'number') {
                    startFromIndexOrder = data.order + 1
                  }
                }

                await Promise.all(resources.map(async (resource, indexOrder) => {
                  if (indexOrder < startFromIndexOrder) return
                  const blob = await retryFetch(resource)
                  const data = { blob: blob, order: indexOrder }
                  const existingData = await localforage.getItem<{ blob: Blob, order: number }>(id)
                  if (data.order >= (existingData?.order || 0)) {
                    await localforage.setItem(id, data)
                    setAssets(old => old.map(item => item.id === id ? { ...item, state: 'downloaded', downloading: false, cacheBuster: item.cacheBuster + 1 } : item))
                  }
                }))
              } catch (e) {
                setAssets(old => old.map(item => item.id === id ? { ...item, downloading: false } : item))
                console.error(e)
              }
            })()
        }))
      })()
  }, [assets, setAssets])

  return null
}