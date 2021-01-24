import { useEffect } from "react"
import { atom, selectorFamily, useRecoilState } from "recoil";
import { Card } from "./types";

type CardState = Card & {
  imgCacheBuster?: number
}

export const dbState = atom<CardState[]>({
  key: 'dbState',
  default: [],
})

export const cardState = selectorFamily({
  key: 'cardState',
  get: (id: string) => ({ get }) => {
    const db = get(dbState);

    return db.find(card => card.id === id)
  },
})

export const isDbLoadedState = atom({
  key: 'isDbLoadedState',
  default: false,
})

export const useLoadDb = () => {
  const [, setDb] = useRecoilState(dbState)
  const [, setIsDbLoadedState] = useRecoilState(isDbLoadedState)

  useEffect(() => {
    (async () => {
      const response = await fetch('/db.json')

      setDb(await response.json())
      setIsDbLoadedState(true)
    })()
  }, [setDb, setIsDbLoadedState])
}