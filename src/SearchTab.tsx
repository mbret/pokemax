import { useEffect, useState } from 'react';
import './App.css';
import { CardTypeSlider } from './CardTypeSlider';
import { Search, searchResultsState, isSearchTruncatedState } from './Search';
import { Button } from 'semantic-ui-react';
import { useRecoilValue } from 'recoil';

export function SearchTab() {
  const [cardType, setCardType] = useState<'pokemon' | 'item'>('pokemon')
  const [filters, setFilters] = useState<{ Basic?: boolean, 'Stage 1'?: boolean, 'Stage 2'?: boolean, GX?: boolean, EX?: boolean, V?: boolean }>({})
  const results = useRecoilValue(searchResultsState)
  const isSearchTruncated = useRecoilValue(isSearchTruncatedState)
  const [searchReleased, setSearchReleased] = useState(true)

  useEffect(() => {
    setSearchReleased(false)

    const ts = setTimeout(() => {
      setSearchReleased(true)
    }, 200)

    return () => clearTimeout(ts)
  }, [results])

  console.log('App', results)

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Search cardType={cardType} filters={filters} style={{ flexShrink: 0, flexGrow: 1 }} />
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
      {isSearchTruncated && (
        <div style={{ fontSize: 13, color: '#f2711c', textAlign: 'center' }}>
          Results truncated! Try to narrow down the search
        </div>
      )}
      {results.length > 0 && searchReleased
        ? (
          <>
            <CardTypeSlider data={results} />
          </>
        ) : (
          <div style={{ display: "flex", flexGrow: 1, flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
            {!searchReleased && results.length > 0 ? 'Searching...' : 'CHEH !'}
          </div>
        )}
    </div>
  );
}
