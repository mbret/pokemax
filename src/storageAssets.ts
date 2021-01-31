/**
 * Standalone module that provide conveniant and flexible way to retrieve and cache assets.
 * It supports:
 * - download retry
 * - general failure retry after timeout
 * - support both blob and base64 for older browsers
 * - parallel download of different quality of same assets and display of lower res while higher res get available
 */
import { useEffect, useMemo, useState } from "react"
import { atom, selectorFamily, useRecoilState, useRecoilValue, useSetRecoilState } from "recoil"
import localforage from 'localforage'

const MAX_RETRY_TIME = 2
const RETRY_RETRIEVING_ASSET_AFTER = 5000

type Base64 = string
type FileType = Blob | Base64

type Asset = {
  id: string,
  value: Blob | undefined,
  cacheBuster: number,
  resources: string[]
  downloading: boolean
  state: undefined | 'missing' | 'downloaded' | 'failed',
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

const fileToBase64 = (file: Blob) => new Promise((resolve, reject) => {
  try {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.addEventListener("load", () => {
      resolve(reader.result);
    });
    reader.addEventListener("error", error => {
      reject(error);
    });
  } catch (e) {
    reject(e)
  }
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

const useStorageAssetFromStorage = (id: string) => {
  const { cacheBuster, id: existingId, state } = useRecoilValue(assetState(id)) || {}
  const [data, setData] = useState<Blob | undefined>()
  const setAssetsState = useSetRecoilState(assetsState)

  /**
   * When download/storage fails for some reason we will wait a littbe bit
   * and reset the state so that we restart the whole process
   */
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    if (state === 'failed') {
      timer = setTimeout(() => {
        setAssetsState(old => {
          const item = old.find((old => old.id === existingId))

          if (!item || item.state !== 'failed') return old

          return old.map(item => item.id === existingId ? { ...item, state: undefined, } : item)
        })
      }, RETRY_RETRIEVING_ASSET_AFTER)
    }

    return () => {
      clearTimeout(timer)
    }
  }, [state, setAssetsState, existingId])

  useEffect(() => {
    let cancelled = false

    if (!existingId || state === 'missing' || state === 'failed') return

      ; (async () => {
        let data = await localforage.getItem<({ blob: FileType, order: number }) | null>(existingId)

        if (data && !cancelled) {
          let blobData: Blob | undefined
          if (typeof data.blob === 'string') {
            const response = await fetch(data.blob)
            blobData = await response.blob()
          } else {
            blobData = data.blob
          }

          if (!cancelled) {
            setData(blobData)
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
        }
        
        if (!data && !cancelled) {
          setAssetsState(old => old.map(item => item.id === existingId ? { ...item, state: 'missing' } : item))
        }
      })()

      return () => {
        cancelled = true
      }
  }, [cacheBuster, existingId, state, setAssetsState])

  useEffect(() => {
    setData(undefined)
  }, [id])

  return data
}

export const useAsset = (id: string, resources: string[]) => {
  const { id: existingAssetId } = useRecoilValue(assetState(id)) || {}
  const setAssetsState = useSetRecoilState(assetsState)
  const data = useStorageAssetFromStorage(id)

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
    const assetsToDownload = assets.filter(asset => (asset.state === 'missing' || asset.missingHigherOrder) && !asset.downloading && !(asset.state === 'failed'))

    console.log(assetsToDownload)
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
                  const existingData = await localforage.getItem<{ blob: FileType, order: number }>(id)
                  if (data.order >= (existingData?.order || 0)) {
                    try {
                      await localforage.setItem(id, data)
                    } catch (e) {
                      // for some browser or safari, blob is not always supported so we try to store as b64
                      if (e.name === 'DataCloneError' && e.code === 25) {
                        const base64CompatibleData = { blob: await fileToBase64(blob), order: indexOrder }
                        await localforage.setItem(id, base64CompatibleData)
                      } else {
                        throw e
                      }
                    }
                    setAssets(old => old.map(item => item.id === id ? { ...item, state: 'downloaded', downloading: false, cacheBuster: item.cacheBuster + 1 } : item))
                  }
                }))
              } catch (e) {
                setAssets(old => old.map(item => item.id === id ? { ...item, downloading: false, state: 'failed' } : item))
                console.error(e)
              }
            })()
        }))
      })()
  }, [assets, setAssets])

  return null
}