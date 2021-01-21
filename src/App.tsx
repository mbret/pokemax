import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { Card } from './types';
import { CardTypeSlider } from './CardTypeSlider';
import { Search } from './Search';
// Most of react-virtualized's styles are functional (eg position, size).
// Functional styles are applied directly to DOM elements.
// The Table component ships with a few presentational styles as well.
// They are optional, but if you want them you will need to also import the CSS file.
// This only needs to be done once; probably during your application's bootstrapping process.
import 'react-virtualized/styles.css'
import { Button } from 'semantic-ui-react';

function App() {
  const [isReady, setIsReady] = useState(false)
  const [cardType, setCardType] = useState<'pokemon' | 'item'>('pokemon')
  const [filters, setFilters] = useState<{ Basic?: boolean, 'Stage 1'?: boolean, 'Stage 2'?: boolean, GX?: boolean, EX?: boolean, V?: boolean }>({})
  const [db, setDb] = useState<Card[]>([])
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Card[]>([])

  useEffect(() => {
    (async () => {
      const response = await fetch('/db.json')

      setDb(await response.json())
      setIsReady(true)
    })()
  }, [])

  useEffect(() => {
    const results = db.filter(card => {
      const notIncluded = search
        .split(' ').some(value => {
          return (
            !card.name
              .toLowerCase()
              .includes(value.toLowerCase())
          )
        }) 
        && search !== card.japaneseNumber
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

    console.log(results.length)
    setResults(results)
  }, [search, db, cardType, filters])

  const resultsGroupedByPokedexNumber = useMemo(() => {
    return results.reduce((res: Card[][], currentValue) => {
      const existingGroupIndex = res.findIndex(card => card[0].nationalPokedexNumber === currentValue.nationalPokedexNumber)
      if (existingGroupIndex > -1) {
        if (res[existingGroupIndex].length > 40) return res
        res[existingGroupIndex] = [...res[existingGroupIndex] || [], currentValue]
        return res
      } else {
        if (res.length > 5) return res
        return [...res, [currentValue]]
      }
    }, [])
  }, [results])

  return (
    <div style={{ height: '100%' }}>
      {!isReady ? (
        <div>loading database</div>
      ) : (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* <input type="text" onChange={e => setSearch(e.target.value)} value={search} /> */}
            <Search onChange={(e, value) => setSearch(e.target.value)} style={{ flexShrink: 0, flexGrow: 1 }} />
            <div style={{ flexShrink: 0, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Button.Group>
                <Button onClick={_ => setCardType('pokemon')} active={cardType === 'pokemon'}>Pokemon</Button>
                <Button.Or />
                <Button onClick={_ => setCardType('item')} active={cardType === 'item'}>Items</Button>
              </Button.Group>
            </div>
            <div style={{ flexShrink: 0, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Button.Group className="subType-filters">
                <Button onClick={_ => setFilters(old => ({ ...old, Basic: !old['Basic'] }))} active={filters['Basic']}>basic</Button>
                <Button onClick={_ => setFilters(old => ({ ...old, 'Stage 1': !old['Stage 1'] }))} active={filters['Stage 1']}>S1</Button>
                <Button onClick={_ => setFilters(old => ({ ...old, 'Stage 2': !old['Stage 2'] }))} active={filters['Stage 2']}>S2</Button>
                <Button onClick={_ => setFilters(old => ({ ...old, GX: !old['GX'] }))} active={filters['GX']}>GX</Button>
                <Button onClick={_ => setFilters(old => ({ ...old, EX: !old['EX'] }))} active={filters['EX']}>EX</Button>
                <Button onClick={_ => setFilters(old => ({ ...old, V: !old['V'] }))} active={filters['V']}>V</Button>
              </Button.Group>
            </div>
            <CardTypeSlider data={resultsGroupedByPokedexNumber} />
          </div>
        )}
    </div>
  );
}

export default App;
