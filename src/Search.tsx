import React, { FC, useEffect, useState } from 'react'
import { atom, useRecoilValue, useSetRecoilState } from 'recoil'
import { Icon, Input } from 'semantic-ui-react'
import { Card } from './types'
import { dbState } from './useDb'

export const searchResultsState = atom<Card[][]>({
  key: 'searchResultsState',
  default: []
})

export const isSearchTruncatedState = atom({
  key: 'isSearchTruncatedState',
  default: false
})

export const Search: FC<{
  style?: React.CSSProperties
  cardType: 'pokemon' | 'item'
  filters: { Basic?: boolean, 'Stage 1'?: boolean, 'Stage 2'?: boolean, GX?: boolean, EX?: boolean, V?: boolean }
}> = ({ style, cardType, filters }) => {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Card[]>([])
  const setSearchResultsState = useSetRecoilState(searchResultsState)
  const setIsSearchTruncatedState = useSetRecoilState(isSearchTruncatedState)
  const db = useRecoilValue(dbState)

  useEffect(() => {
    const words = search.replace(/\s+/g, ' ').split(' ').map(word => `(?=.*${word})`).join('')
    const containsAtLeastWordsInAnyOrder = new RegExp(`${words}.*`, 'ig')
    console.log('search regex', containsAtLeastWordsInAnyOrder)

    const results = db.filter(card => {
      // ex: (?=.*pt2)(?=.*042).*
      // const words = search.replace(/\s+/g,' ')
      // const words = 'asd'

      const notIncluded = search
        .split(' ').some(value => {
          return (
            !card.name
              .toLowerCase()
              .includes(value.toLowerCase())
          )
        })
        // && !card.japaneseExpansions?.some(expansion => search === expansion.number)
        // && !card.japaneseExpansions?.some(expansion => search === expansion.id)
        // && !card.japaneseExpansions?.some(expansion => search === `${expansion.number}/${expansion.numberMax}`)
        && !card.japaneseExpansions?.some(expansion => (containsAtLeastWordsInAnyOrder.exec(`${expansion.id} ${expansion.number}/${expansion.numberMax}`)?.length || 0) > 0)
      if (notIncluded) {
        // try to search illustrator
        const notArtistIncluded = search.split(' ').some(value => {
          return !card.artist?.toLowerCase().includes(value.toLowerCase())
        })

        if (notArtistIncluded) {
          return false
        }
      }
      if (cardType === 'pokemon' && card.nationalPokedexNumber === undefined) return false
      if (cardType === 'item' && card.nationalPokedexNumber !== undefined) return false

      if (Object.keys(filters).some(key => filters[key as keyof typeof filters])) {
        const isWithinFilterSubTypes = Object.keys(filters).some((filterKey) => filters[filterKey as keyof typeof filters] && card.subtype === filterKey)
        if (!isWithinFilterSubTypes) return false
      }

      return true
    })

    setResults(results)
  }, [search, db, cardType, filters])

  useEffect(() => {
    let searchTruncated = false
    const resultsGroupedByPokedexNumber = results.reduce((res: Card[][], currentValue) => {
      const existingGroupIndex = res.findIndex(card => card[0].nationalPokedexNumber === currentValue.nationalPokedexNumber)
      if (existingGroupIndex >= 0) {
        if (res[existingGroupIndex].length > 100) {
          searchTruncated = true
          return res
        }
        res[existingGroupIndex] = [...res[existingGroupIndex] || [], currentValue]
        return res
      } else {
        if (res.length > 6) {
          searchTruncated = true
          return res
        }
        return [...res, [currentValue]]
      }
    }, [])

    setIsSearchTruncatedState(searchTruncated)
    setSearchResultsState(resultsGroupedByPokedexNumber)
  }, [results, setSearchResultsState, setIsSearchTruncatedState])

  return (
    <div style={{ ...style }}>
      <Input fluid icon size='large' placeholder='pika...' onChange={(e) => setSearch(e.target.value)} >
        <input />
        <Icon name='search' />
      </Input>
    </div>
  )
}