import { actions, selectors, types, util } from 'vortex-api';
import { GAME_ID } from '../statics';
import { transformId } from '../util';

import { IKCDCollectionsData } from './types';

export async function exportLoadOrder(
  state: types.IState,
  modIds: string[]
): Promise<types.ILoadOrderEntry[]> {
  const profileId = selectors.lastActiveProfileForGame(state, GAME_ID);
  if (profileId === undefined) {
    return Promise.reject(new util.ProcessCanceled('Invalid profile id'));
  }

  const loadOrder = state?.persistent?.loadOrder?.[profileId];
  if (loadOrder === undefined) {
    return Promise.resolve(undefined);
  }

  const filteredLO = loadOrder.filter((lo) => //FIXME 'LoadOrder' is not {[modID: string]: 'ILoadOrderEntry[]'}
    modIds.find(id => transformId(id) === lo as any) !== undefined);
  return Promise.resolve(filteredLO);
}

export async function importLoadOrder(api: types.IExtensionApi,
                                      collection: IKCDCollectionsData): Promise<void> {
  const state = api.getState();

  const profileId = selectors.lastActiveProfileForGame(state, GAME_ID);
  if (profileId === undefined) {
    return Promise.reject(new util.ProcessCanceled(`Invalid profile id ${profileId}`));
  }

  api.store.dispatch(actions.setLoadOrder(profileId, collection.loadOrder as any));
  return Promise.resolve(undefined);
}
