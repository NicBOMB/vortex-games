import path from 'path';
import semver from 'semver';
import { actions, fs, selectors, types } from 'vortex-api';

import { GAME_ID } from './common';

export async function migrate148(context: types.IExtensionContext,
                                 oldVersion: string): Promise<void> {
  if (semver.gte(oldVersion, '1.4.8')) {
    return Promise.resolve();
  }

  const state = context.api.getState();
  const lastActiveProfile = selectors.lastActiveProfileForGame(state, GAME_ID);
  const profile = selectors.profileById(state, lastActiveProfile);
  const mods = state?.persistent?.mods?.[GAME_ID] ?? {};
  const modState = profile?.modState ?? {};
  const isEnabled = (mod: types.IMod) => modState[mod.id]?.enabled === true;
  const limitPatchMod = Object.values(mods).find(mod =>
    (mod.type === 'w3modlimitpatcher') && isEnabled(mod));
  if (limitPatchMod === undefined) {
    return Promise.resolve();
  }

  const t = context.api.translate;
  context.api.sendNotification({
    type: 'warning',
    allowSuppress: false,
    message: t('Faulty Witcher 3 Mod Limit Patch detected'),
    actions: [
      {
        title: 'More',
        action: (dismiss) => {
          dismiss();
          context.api.showDialog('info', 'Witcher 3 Mod Limit Patch', {
            text: t('Due to a bug, the mod limit patch was not applied correctly. '
                     + 'Please Uninstall/Remove your existing mod limit match mod entry in '
                     + 'your mods page and re-apply the patch using the "Apply Mod Limit Patch" '
                     + 'button.'),
          }, [
            { label: 'Close' },
          ]);
        },
      },
    ],
  });

  return Promise.resolve();
}
