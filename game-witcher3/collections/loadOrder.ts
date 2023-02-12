import { actions, selectors, types } from 'vortex-api';
import { GAME_ID } from '../common';
import { ILoadOrder, ILoadOrderEntry, IW3CollectionsData } from './types';

import { CollectionGenerateError, CollectionParseError,
  genCollectionLoadOrder, isModInCollection, isValidMod } from './util';

export async function exportLoadOrder(
  state: types.IState,
  modIds: string[],
  mods: { [modId: string]: types.IMod }
): Promise<ILoadOrder> {
  const profileId = selectors.lastActiveProfileForGame(state, GAME_ID);
  if (profileId === undefined) {
    return Promise.reject(new CollectionGenerateError('Invalid profile id'));
  }

  const loadOrder = state?.persistent?.loadOrder?.[profileId];
  if (loadOrder === undefined) {
    // This is theoretically "fine" - the user may have simply
    //  downloaded the mods and immediately created the collection
    //  without actually setting up a load order. Alternatively
    //  the game extension itself might be handling the presort functionality
    //  erroneously. Regardless, the collection creation shouldn't be blocked
    //  by the inexistance of a loadOrder.
    return Promise.resolve(undefined);
  }

  const includedMods = modIds.reduce((accum, iter) => {
    if (mods[iter] !== undefined) {
      accum[iter] = mods[iter];
    }
    return accum;
  }, {}); //FIXME 'LoadOrder' is not {[modID: string]: 'ILoadOrderEntry[]'}
  const filteredLO = genCollectionLoadOrder(loadOrder as any, includedMods);
  return Promise.resolve(filteredLO);
}

export async function importLoadOrder(
  api: types.IExtensionApi,
  collection: IW3CollectionsData
): Promise<void> {
  const state = api.getState();

  const profileId = selectors.lastActiveProfileForGame(state, GAME_ID);
  if (profileId === undefined) {
    return Promise.reject(new CollectionParseError(collection?.['info']?.['name'] || '', 'Invalid profile id'));
  }

  api.store.dispatch(actions.setLoadOrder(profileId, collection.loadOrder as any));
  return Promise.resolve(undefined);
}
