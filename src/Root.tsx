import React from 'react';
import { RecoilRoot } from 'recoil';
import App from './App';
import { StorageAssets } from './storageAssets';

export const Root = () => {
  return (
    <RecoilRoot>
      <App />
      <StorageAssets />
    </RecoilRoot>
  );
}