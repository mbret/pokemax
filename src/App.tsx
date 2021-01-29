import './App.css';
// Most of react-virtualized's styles are functional (eg position, size).
// Functional styles are applied directly to DOM elements.
// The Table component ships with a few presentational styles as well.
// They are optional, but if you want them you will need to also import the CSS file.
// This only needs to be done once; probably during your application's bootstrapping process.
import 'react-virtualized/styles.css'
import { useRecoilValue } from 'recoil';
import { useLoadDb, isDbLoadedState } from './useDb';
import { SearchTab } from './SearchTab';
import { Tab } from 'semantic-ui-react';
import { CoinTab } from './CoinTab';

function App() {
  const isDbLoaded = useRecoilValue(isDbLoadedState)

  useLoadDb()

  return (
    <div style={{ height: '100%' }}>
      {!isDbLoaded ? (
        <div>loading database</div>
      ) : (
          <Tab
            style={{ display: 'flex', height: '100%', flexDirection: 'column' }}
            menu={{ attached: 'bottom', style: { flex: 1 }, className: 'goo' }}
            panes={[
              {
                menuItem: 'Search',
                render: () => <SearchTab />
              },
              {
                menuItem: 'Coin',
                render: () => <CoinTab />
              },
            ]}
          />
        )}
    </div>
  );
}

export default App;
