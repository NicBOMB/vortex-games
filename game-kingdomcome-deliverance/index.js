"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird_1 = __importDefault(require("bluebird"));
const React = __importStar(require("react"));
const BS = __importStar(require("react-bootstrap"));
const react_redux_1 = require("react-redux");
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const collections_1 = require("./collections/collections");
const CollectionsDataView_1 = __importDefault(require("./collections/CollectionsDataView"));
const statics_1 = require("./statics");
const util_1 = require("./util");
const I18N_NAMESPACE = `game-${statics_1.GAME_ID}`;
const STEAM_APPID = '379430';
const _MODS_STATE = {
    enabled: [],
    disabled: [],
    display: [],
};
function findGame() {
    return vortex_api_1.util.steam.findByAppId(STEAM_APPID)
        .catch(() => vortex_api_1.util.epicGamesLauncher.findByAppId('Eel'))
        .then(game => game.gamePath);
}
function prepareForModding(context, discovery) {
    const state = context.api.store.getState();
    const profile = vortex_api_1.selectors.activeProfile(state);
    return vortex_api_1.fs.ensureDirWritableAsync(path_1.default.join(discovery.path, 'Mods'), () => bluebird_1.default.resolve())
        .then(() => getCurrentOrder(path_1.default.join(discovery.path, modsPath(), statics_1.MODS_ORDER_FILENAME)))
        .catch(err => err.code === 'ENOENT' ? Promise.resolve([]) : Promise.reject(err))
        .then(data => setNewOrder({ context, profile }, Array.isArray(data) ? data : data.split('\n')));
}
function getCurrentOrder(modOrderFilepath) {
    return vortex_api_1.fs.readFileAsync(modOrderFilepath, { encoding: 'utf8' });
}
function walkAsync(dir) {
    let entries = [];
    return vortex_api_1.fs.readdirAsync(dir).then(files => {
        return bluebird_1.default.each(files, file => {
            const fullPath = path_1.default.join(dir, file);
            return vortex_api_1.fs.statAsync(fullPath).then(stats => {
                if (stats.isDirectory()) {
                    return walkAsync(fullPath)
                        .then(nestedFiles => {
                        entries = entries.concat(nestedFiles);
                        return Promise.resolve();
                    });
                }
                else {
                    entries.push(fullPath);
                    return Promise.resolve();
                }
            });
        });
    })
        .then(() => Promise.resolve(entries))
        .catch(err => {
        (0, vortex_api_1.log)('error', 'Unable to read mod directory', err);
        return Promise.resolve(entries);
    });
}
function readModsFolder(modsFolder, api) {
    const extL = input => path_1.default.extname(input).toLowerCase();
    const isValidMod = modFile => ['.pak', '.cfg', '.manifest'].indexOf(extL(modFile)) !== -1;
    return vortex_api_1.fs.readdirAsync(modsFolder)
        .then(entries => bluebird_1.default.reduce(entries, (accum, current) => {
        const currentPath = path_1.default.join(modsFolder, current);
        return vortex_api_1.fs.readdirAsync(currentPath)
            .then(modFiles => {
            if (modFiles.some(isValidMod) === true) {
                accum.push(current);
            }
            return Promise.resolve(accum);
        })
            .catch(err => Promise.resolve(accum));
    }, []))
        .catch(err => {
        const allowReport = ['ENOENT', 'EPERM', 'EACCESS'].indexOf(err.code) === -1;
        api.showErrorNotification('failed to read kingdom come mods directory', err.message, { allowReport });
        return Promise.resolve([]);
    });
}
function listHasMod(modId, list) {
    return (!!list)
        ? list.map(mod => (0, util_1.transformId)(mod).toLowerCase()).includes(modId.toLowerCase())
        : false;
}
function getManuallyAddedMods(disabledMods, enabledMods, modOrderFilepath, api) {
    const modsPath = path_1.default.dirname(modOrderFilepath);
    return readModsFolder(modsPath, api).then(deployedMods => getCurrentOrder(modOrderFilepath)
        .catch(err => (err.code === 'ENOENT') ? Promise.resolve('') : Promise.reject(err))
        .then(data => {
        const manuallyAdded = data.split('\n').filter(entry => !listHasMod(entry, enabledMods)
            && !listHasMod(entry, disabledMods)
            && listHasMod(entry, deployedMods));
        return Promise.resolve(manuallyAdded);
    }));
}
function refreshModList(context, discoveryPath) {
    const state = context.api.store.getState();
    const profile = vortex_api_1.selectors.activeProfile(state);
    const installationPath = vortex_api_1.selectors.installPathForGame(state, statics_1.GAME_ID);
    const mods = state?.persistent?.mods?.[statics_1.GAME_ID] ?? [];
    const modKeys = Object.keys(mods);
    const modState = profile?.modState ?? {};
    const enabled = modKeys.filter(mod => !!modState[mod] && modState[mod].enabled);
    const disabled = modKeys.filter(dis => !enabled.includes(dis));
    const extL = input => path_1.default.extname(input).toLowerCase();
    return bluebird_1.default.reduce(enabled, (accum, mod) => {
        if (mods[mod]?.installationPath === undefined) {
            return accum;
        }
        const modPath = path_1.default.join(installationPath, mods[mod].installationPath);
        return walkAsync(modPath)
            .then(entries => (entries.find(fileName => ['.pak', '.cfg', '.manifest'].includes(extL(fileName))) !== undefined)
            ? accum.concat(mod)
            : accum);
    }, []).then(managedMods => {
        return getManuallyAddedMods(disabled, enabled, path_1.default.join(discoveryPath, modsPath(), statics_1.MODS_ORDER_FILENAME), context.api)
            .then(manuallyAdded => {
            _MODS_STATE.enabled = [].concat(managedMods
                .map(mod => (0, util_1.transformId)(mod)), manuallyAdded);
            _MODS_STATE.disabled = disabled;
            _MODS_STATE.display = _MODS_STATE.enabled;
            return Promise.resolve();
        });
    });
}
function LoadOrderBase(props) {
    const getMod = (item) => {
        const keys = Object.keys(props.mods);
        const found = keys.find(key => (0, util_1.transformId)(key) === item);
        return found !== undefined
            ? props.mods[found]
            : { attributes: { name: item } };
    };
    class ItemRenderer extends React.Component {
        render() {
            if (props.mods === undefined) {
                return null;
            }
            const item = this.props.item;
            const mod = getMod(item);
            return React.createElement(BS.ListGroupItem, {
                style: {
                    backgroundColor: 'var(--brand-bg, black)',
                    borderBottom: '2px solid var(--border-color, white)'
                },
            }, React.createElement('div', {
                style: {
                    fontSize: '1.1em',
                },
            }, React.createElement('img', {
                src: !!mod.attributes.pictureUrl
                    ? mod.attributes.pictureUrl
                    : `${__dirname}/gameart.jpg`,
                className: 'mod-picture',
                width: '75px',
                height: '45px',
                style: {
                    margin: '5px 10px 5px 5px',
                    border: '1px solid var(--brand-secondary,#D78F46)',
                },
            }), vortex_api_1.util.renderModName(mod)));
        }
    }
    return React.createElement(vortex_api_1.MainPage, {}, React.createElement(vortex_api_1.MainPage.Body, {}, React.createElement(BS.Panel, { id: 'kcd-loadorder-panel' }, React.createElement(BS.Panel.Body, {}, React.createElement(vortex_api_1.FlexLayout, { type: 'row' }, React.createElement(vortex_api_1.FlexLayout.Flex, {}, React.createElement(vortex_api_1.DraggableList, {
        id: 'kcd-loadorder',
        itemTypeId: 'kcd-loadorder-item',
        items: _MODS_STATE.display,
        itemRenderer: ItemRenderer,
        style: {
            height: '100%',
            overflow: 'auto',
            borderWidth: 'var(--border-width, 1px)',
            borderStyle: 'solid',
            borderColor: 'var(--border-color, white)',
        },
        apply: ordered => {
            props.onSetDeploymentNecessary(statics_1.GAME_ID, true);
            return setNewOrder(props, ordered);
        },
    })), React.createElement(vortex_api_1.FlexLayout.Flex, {}, React.createElement('div', {
        style: {
            padding: 'var(--half-gutter, 15px)',
        }
    }, React.createElement('h2', {}, props.t('Changing your load order', { ns: I18N_NAMESPACE })), React.createElement('p', {}, props.t('Drag and drop the mods on the left to reorder them. Kingdom Come: Deliverance uses a mod_order.txt file '
        + 'to define the order in which mods are loaded, Vortex will write the folder names of the displayed '
        + 'mods in the order you have set. '
        + 'Mods placed at the bottom of the load order will have priority over those above them.', { ns: I18N_NAMESPACE })), React.createElement('p', {}, props.t('Note: Vortex will detect manually added mods as long as these have been added to the mod_order.txt file. '
        + 'Manually added mods are not managed by Vortex - to remove these, you will have to '
        + 'manually erase the entry from the mod_order.txt file.', { ns: I18N_NAMESPACE })))))))));
}
function modsPath() {
    return 'Mods';
}
function setNewOrder(props, ordered) {
    const { context, profile, onSetOrder } = props;
    if (profile?.id === undefined) {
        (0, vortex_api_1.log)('error', 'failed to set new load order', 'undefined profile');
        return;
    }
    const filtered = ordered.filter(entry => !!entry);
    _MODS_STATE.display = filtered;
    return (!!onSetOrder)
        ? onSetOrder(profile.id, filtered)
        : context.api.store.dispatch(vortex_api_1.actions.setLoadOrder(profile.id, filtered));
}
function writeOrderFile(filePath, modList) {
    return vortex_api_1.fs.removeAsync(filePath)
        .catch(err => err.code === 'ENOENT' ? Promise.resolve() : Promise.reject(err))
        .then(() => vortex_api_1.fs.ensureFileAsync(filePath))
        .then(() => vortex_api_1.fs.writeFileAsync(filePath, modList.join('\n'), { encoding: 'utf8' }));
}
function main(context) {
    context.registerGame({
        id: statics_1.GAME_ID,
        name: 'Kingdom Come:\tDeliverance',
        mergeMods: mod => (0, util_1.transformId)(mod.id),
        queryPath: findGame,
        queryModPath: modsPath,
        logo: 'gameart.jpg',
        executable: (discoveredPath) => {
            try {
                const epicPath = path_1.default.join('Bin', 'Win64MasterMasterEpicPGO', 'KingdomCome.exe');
                vortex_api_1.fs.statSync(path_1.default.join(discoveredPath, epicPath));
                return epicPath;
            }
            catch (err) {
                return path_1.default.join('Bin', 'Win64', 'KingdomCome.exe');
            }
        },
        requiredFiles: [
            'Data/Levels/rataje/level.pak',
        ],
        setup: (discovery) => prepareForModding(context, discovery),
        requiresLauncher: () => vortex_api_1.util.epicGamesLauncher.isGameInstalled('Eel')
            .then(epic => epic
            ? { launcher: 'epic', addInfo: 'Eel' }
            : undefined),
        environment: {
            SteamAPPId: STEAM_APPID,
        },
        details: {
            steamAppId: +STEAM_APPID,
        },
    });
    context.registerMainPage('sort-none', 'Load Order', LoadOrder, {
        id: 'kcd-load-order',
        hotkey: 'E',
        group: 'per-game',
        visible: () => vortex_api_1.selectors.activeGameId(context.api.store.getState()) === statics_1.GAME_ID,
        props: () => ({
            t: context.api.translate,
        }),
    });
    context.optional.registerCollectionFeature('kcd_collection_data', (gameId, includedMods) => (0, collections_1.genCollectionsData)(context, gameId, includedMods), (gameId, collection) => (0, collections_1.parseCollectionsData)(context, gameId, collection), () => Promise.resolve(), (t) => t('Kingdom Come: Deliverance Data'), (state, gameId) => gameId === statics_1.GAME_ID, CollectionsDataView_1.default);
    context.once(() => {
        context.api.events.on('mod-enabled', (profileId, modId) => {
            const state = context.api.store.getState();
            const discovery = state?.settings?.gameMode?.discovered?.[statics_1.GAME_ID];
            if (discovery?.path === undefined) {
                return;
            }
            const profile = state?.persistent?.profiles?.[profileId];
            if (!!profile && (profile.gameId === statics_1.GAME_ID) && (_MODS_STATE.display.indexOf(modId) === -1)) {
                refreshModList(context, discovery.path);
            }
        });
        context.api.events.on('purge-mods', () => {
            const store = context.api.store;
            const state = store.getState();
            const profile = vortex_api_1.selectors.activeProfile(state);
            if (profile === undefined || profile.gameId !== statics_1.GAME_ID) {
                return;
            }
            const discovery = state?.settings?.gameMode?.discovered?.[statics_1.GAME_ID];
            if ((discovery === undefined) || (discovery.path === undefined)) {
                (0, vortex_api_1.log)('error', 'kingdomcomedeliverance was not discovered');
                return;
            }
            const modsOrderFilePath = path_1.default.join(discovery.path, modsPath(), statics_1.MODS_ORDER_FILENAME);
            const managedMods = state?.persistent?.mods?.[statics_1.GAME_ID] ?? {};
            const modKeys = Object.keys(managedMods);
            const modState = profile?.modState ?? {};
            const enabled = modKeys.filter(mod => !!modState[mod] && modState[mod].enabled);
            const disabled = modKeys.filter(dis => !enabled.includes(dis));
            getManuallyAddedMods(disabled, enabled, modsOrderFilePath, context.api)
                .then(manuallyAdded => {
                writeOrderFile(modsOrderFilePath, manuallyAdded)
                    .then(() => setNewOrder({ context, profile }, manuallyAdded));
            })
                .catch(err => {
                const userCanceled = (err instanceof vortex_api_1.util.UserCanceled);
                context.api.showErrorNotification('Failed to re-instate manually added mods', err, { allowReport: !userCanceled });
            });
        });
        context.api.onAsync('did-deploy', (profileId, deployment) => {
            const state = context.api.getState();
            const profile = vortex_api_1.selectors.profileById(state, profileId);
            if (profile === undefined || profile.gameId !== statics_1.GAME_ID) {
                if (profile === undefined) {
                    (0, vortex_api_1.log)('error', 'profile does not exist', profileId);
                }
                return Promise.resolve();
            }
            const loadOrder = state.persistent['loadOrder']?.[profileId] ?? [];
            const discovery = state?.settings?.gameMode?.discovered?.[profile.gameId];
            if ((discovery === undefined) || (discovery.path === undefined)) {
                (0, vortex_api_1.log)('error', 'kingdomcomedeliverance was not discovered');
                return Promise.resolve();
            }
            const modsFolder = path_1.default.join(discovery.path, modsPath());
            const modOrderFile = path_1.default.join(modsFolder, statics_1.MODS_ORDER_FILENAME);
            return refreshModList(context, discovery.path)
                .then(() => {
                let missing = loadOrder
                    .filter(mod => !listHasMod((0, util_1.transformId)(mod), _MODS_STATE.enabled)
                    && !listHasMod((0, util_1.transformId)(mod), _MODS_STATE.disabled)
                    && listHasMod((0, util_1.transformId)(mod), _MODS_STATE.display))
                    .map(mod => (0, util_1.transformId)(mod)) || [];
                missing = [...new Set(missing)];
                const transformed = [..._MODS_STATE.enabled, ...missing];
                const loValue = (input) => {
                    const idx = loadOrder.indexOf(input);
                    return idx !== -1 ? idx : loadOrder.length;
                };
                let sorted = transformed.length > 1
                    ? transformed.sort((lhs, rhs) => loValue(lhs) - loValue(rhs))
                    : transformed;
                setNewOrder({ context, profile }, sorted);
                return writeOrderFile(modOrderFile, transformed)
                    .catch(err => {
                    const userCanceled = (err instanceof vortex_api_1.util.UserCanceled);
                    context.api.showErrorNotification('Failed to write to load order file', err, { allowReport: !userCanceled });
                });
            });
        });
    });
    return true;
}
function mapStateToProps(state) {
    const profile = vortex_api_1.selectors.activeProfile(state);
    const profileId = profile?.id || '';
    const gameId = profile?.gameId || '';
    return {
        profile,
        modState: profile?.modState ?? {},
        mods: state?.persistent?.mods?.[gameId] ?? [],
        order: state?.persistent?.loadOrder?.[profileId] ?? [],
    };
}
function mapDispatchToProps(dispatch) {
    return {
        onSetDeploymentNecessary: (gameId, necessary) => dispatch(vortex_api_1.actions.setDeploymentNecessary(gameId, necessary)),
        onSetOrder: (profileId, ordered) => dispatch(vortex_api_1.actions.setLoadOrder(profileId, ordered)),
    };
}
const LoadOrder = (0, react_redux_1.connect)(mapStateToProps, mapDispatchToProps)(LoadOrderBase);
module.exports = {
    default: main,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBQ2hDLDZDQUErQjtBQUMvQixvREFBc0M7QUFDdEMsNkNBQXNDO0FBQ3RDLGdEQUF3QjtBQUN4QiwyQ0FBMkc7QUFHM0csMkRBQXFGO0FBQ3JGLDRGQUFvRTtBQUNwRSx1Q0FBeUQ7QUFDekQsaUNBQXFDO0FBRXJDLE1BQU0sY0FBYyxHQUFHLFFBQVEsaUJBQU8sRUFBRSxDQUFDO0FBRXpDLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQztBQUU3QixNQUFNLFdBQVcsR0FBRztJQUNsQixPQUFPLEVBQUUsRUFBRTtJQUNYLFFBQVEsRUFBRSxFQUFFO0lBQ1osT0FBTyxFQUFFLEVBQUU7Q0FDWixDQUFBO0FBRUQsU0FBUyxRQUFRO0lBQ2YsT0FBTyxpQkFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDO1NBQ3ZDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxpQkFBSSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUN0RCxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDakMsQ0FBQztBQUVELFNBQVMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLFNBQVM7SUFDM0MsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDM0MsTUFBTSxPQUFPLEdBQUcsc0JBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDL0MsT0FBTyxlQUFFLENBQUMsc0JBQXNCLENBQUMsY0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLGtCQUFR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QUM7SUFDckMsT0FBTztRQUNMLE9BQU87UUFDUCxRQUFRLEVBQUUsT0FBTyxFQUFFLFFBQVEsSUFBSSxFQUFFO1FBQ2pDLElBQUksRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUU7UUFDN0MsS0FBSyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRTtLQUN2RCxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsa0JBQWtCLENBQUMsUUFBUTtJQUNsQyxPQUFPO1FBQ0wsd0JBQXdCLEVBQUUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsb0JBQU8sQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDNUcsVUFBVSxFQUFFLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLG9CQUFPLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztLQUN2RixDQUFDO0FBQ0osQ0FBQztBQUVELE1BQU0sU0FBUyxHQUFHLElBQUEscUJBQU8sRUFBQyxlQUFlLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUU5RSxNQUFNLENBQUMsT0FBTyxHQUFHO0lBQ2YsT0FBTyxFQUFFLElBQUk7Q0FDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCAqIGFzIEJTIGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XG5pbXBvcnQgeyBjb25uZWN0IH0gZnJvbSAncmVhY3QtcmVkdXgnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgRHJhZ2dhYmxlTGlzdCwgRmxleExheW91dCwgdHlwZXMsIGxvZywgTWFpblBhZ2UsIHNlbGVjdG9ycywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuXG5pbXBvcnQgeyBJS0NEQ29sbGVjdGlvbnNEYXRhIH0gZnJvbSAnLi9jb2xsZWN0aW9ucy90eXBlcyc7XG5pbXBvcnQgeyBnZW5Db2xsZWN0aW9uc0RhdGEsIHBhcnNlQ29sbGVjdGlvbnNEYXRhIH0gZnJvbSAnLi9jb2xsZWN0aW9ucy9jb2xsZWN0aW9ucyc7XG5pbXBvcnQgQ29sbGVjdGlvbnNEYXRhVmlldyBmcm9tICcuL2NvbGxlY3Rpb25zL0NvbGxlY3Rpb25zRGF0YVZpZXcnO1xuaW1wb3J0IHsgR0FNRV9JRCwgTU9EU19PUkRFUl9GSUxFTkFNRSB9IGZyb20gJy4vc3RhdGljcyc7XG5pbXBvcnQgeyB0cmFuc2Zvcm1JZCB9IGZyb20gJy4vdXRpbCc7XG5cbmNvbnN0IEkxOE5fTkFNRVNQQUNFID0gYGdhbWUtJHtHQU1FX0lEfWA7XG5cbmNvbnN0IFNURUFNX0FQUElEID0gJzM3OTQzMCc7XG5cbmNvbnN0IF9NT0RTX1NUQVRFID0ge1xuICBlbmFibGVkOiBbXSxcbiAgZGlzYWJsZWQ6IFtdLFxuICBkaXNwbGF5OiBbXSxcbn1cblxuZnVuY3Rpb24gZmluZEdhbWUoKSB7XG4gIHJldHVybiB1dGlsLnN0ZWFtLmZpbmRCeUFwcElkKFNURUFNX0FQUElEKVxuICAgIC5jYXRjaCgoKSA9PiB1dGlsLmVwaWNHYW1lc0xhdW5jaGVyLmZpbmRCeUFwcElkKCdFZWwnKSlcbiAgICAudGhlbihnYW1lID0+IGdhbWUuZ2FtZVBhdGgpO1xufVxuXG5mdW5jdGlvbiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LCBkaXNjb3ZlcnkpIHtcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICByZXR1cm4gZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdNb2RzJyksICgpID0+IEJsdWViaXJkLnJlc29sdmUoKSlcbiAgICAudGhlbigoKSA9PiBnZXRDdXJyZW50T3JkZXIocGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBtb2RzUGF0aCgpLCBNT0RTX09SREVSX0ZJTEVOQU1FKSkpXG4gICAgLmNhdGNoKGVyciA9PiBlcnIuY29kZSA9PT0gJ0VOT0VOVCcgPyBQcm9taXNlLnJlc29sdmUoW10pIDogUHJvbWlzZS5yZWplY3QoZXJyKSlcbiAgICAudGhlbihkYXRhID0+IHNldE5ld09yZGVyKHsgY29udGV4dCwgcHJvZmlsZSB9LFxuICAgICAgQXJyYXkuaXNBcnJheShkYXRhKSA/IGRhdGEgOiBkYXRhLnNwbGl0KCdcXG4nKSkpO1xufVxuXG5mdW5jdGlvbiBnZXRDdXJyZW50T3JkZXIobW9kT3JkZXJGaWxlcGF0aCkge1xuICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyhtb2RPcmRlckZpbGVwYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG59XG5cbmZ1bmN0aW9uIHdhbGtBc3luYyhkaXIpIHtcbiAgbGV0IGVudHJpZXMgPSBbXTtcbiAgcmV0dXJuIGZzLnJlYWRkaXJBc3luYyhkaXIpLnRoZW4oZmlsZXMgPT4ge1xuICAgIHJldHVybiBCbHVlYmlyZC5lYWNoKGZpbGVzLCBmaWxlID0+IHtcbiAgICAgIGNvbnN0IGZ1bGxQYXRoID0gcGF0aC5qb2luKGRpciwgZmlsZSk7XG4gICAgICByZXR1cm4gZnMuc3RhdEFzeW5jKGZ1bGxQYXRoKS50aGVuKHN0YXRzID0+IHtcbiAgICAgICAgaWYgKHN0YXRzLmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICByZXR1cm4gd2Fsa0FzeW5jKGZ1bGxQYXRoKVxuICAgICAgICAgICAgLnRoZW4obmVzdGVkRmlsZXMgPT4ge1xuICAgICAgICAgICAgICBlbnRyaWVzID0gZW50cmllcy5jb25jYXQobmVzdGVkRmlsZXMpO1xuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVudHJpZXMucHVzaChmdWxsUGF0aCk7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSlcbiAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGVudHJpZXMpKVxuICAuY2F0Y2goZXJyID0+IHtcbiAgICBsb2coJ2Vycm9yJywgJ1VuYWJsZSB0byByZWFkIG1vZCBkaXJlY3RvcnknLCBlcnIpO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZW50cmllcyk7XG4gIH0pO1xufVxuXG5cbmZ1bmN0aW9uIHJlYWRNb2RzRm9sZGVyKG1vZHNGb2xkZXIsIGFwaSkge1xuICBjb25zdCBleHRMID0gaW5wdXQgPT4gcGF0aC5leHRuYW1lKGlucHV0KS50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBpc1ZhbGlkTW9kID0gbW9kRmlsZSA9PiBbJy5wYWsnLCAnLmNmZycsICcubWFuaWZlc3QnXS5pbmRleE9mKGV4dEwobW9kRmlsZSkpICE9PSAtMTtcblxuICAvLyBSZWFkcyB0aGUgcHJvdmlkZWQgZm9sZGVyUGF0aCBhbmQgYXR0ZW1wdHMgdG8gaWRlbnRpZnkgYWxsXG4gIC8vICBjdXJyZW50bHkgZGVwbG95ZWQgbW9kcy5cbiAgcmV0dXJuIGZzLnJlYWRkaXJBc3luYyhtb2RzRm9sZGVyKVxuICAgIC50aGVuKGVudHJpZXMgPT4gQmx1ZWJpcmQucmVkdWNlKGVudHJpZXMsIChhY2N1bSwgY3VycmVudCkgPT4ge1xuICAgICAgY29uc3QgY3VycmVudFBhdGggPSBwYXRoLmpvaW4obW9kc0ZvbGRlciwgY3VycmVudCk7XG4gICAgICByZXR1cm4gZnMucmVhZGRpckFzeW5jKGN1cnJlbnRQYXRoKVxuICAgICAgICAudGhlbihtb2RGaWxlcyA9PiB7XG4gICAgICAgICAgaWYgKG1vZEZpbGVzLnNvbWUoaXNWYWxpZE1vZCkgPT09IHRydWUpIHtcbiAgICAgICAgICAgIGFjY3VtLnB1c2goY3VycmVudCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IFByb21pc2UucmVzb2x2ZShhY2N1bSkpXG4gICAgfSwgW10pKVxuICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgY29uc3QgYWxsb3dSZXBvcnQgPSBbJ0VOT0VOVCcsICdFUEVSTScsICdFQUNDRVNTJ10uaW5kZXhPZihlcnIuY29kZSkgPT09IC0xO1xuICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignZmFpbGVkIHRvIHJlYWQga2luZ2RvbSBjb21lIG1vZHMgZGlyZWN0b3J5JyxcbiAgICAgICAgZXJyLm1lc3NhZ2UsIHsgYWxsb3dSZXBvcnQgfSk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gbGlzdEhhc01vZChtb2RJZCwgbGlzdCkge1xuICByZXR1cm4gKCEhbGlzdClcbiAgICA/IGxpc3QubWFwKG1vZCA9PlxuICAgICAgICB0cmFuc2Zvcm1JZChtb2QpLnRvTG93ZXJDYXNlKCkpLmluY2x1ZGVzKG1vZElkLnRvTG93ZXJDYXNlKCkpXG4gICAgOiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gZ2V0TWFudWFsbHlBZGRlZE1vZHMoZGlzYWJsZWRNb2RzLCBlbmFibGVkTW9kcywgbW9kT3JkZXJGaWxlcGF0aCwgYXBpKSB7XG4gIGNvbnN0IG1vZHNQYXRoID0gcGF0aC5kaXJuYW1lKG1vZE9yZGVyRmlsZXBhdGgpO1xuXG4gIHJldHVybiByZWFkTW9kc0ZvbGRlcihtb2RzUGF0aCwgYXBpKS50aGVuKGRlcGxveWVkTW9kcyA9PlxuICAgIGdldEN1cnJlbnRPcmRlcihtb2RPcmRlckZpbGVwYXRoKVxuICAgICAgLmNhdGNoKGVyciA9PiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKSA/IFByb21pc2UucmVzb2x2ZSgnJykgOiBQcm9taXNlLnJlamVjdChlcnIpKVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIC8vIDEuIENvbmZpcm1lZCB0byBleGlzdCAoZGVwbG95ZWQpIGluc2lkZSB0aGUgbW9kcyBkaXJlY3RvcnkuXG4gICAgICAgIC8vIDIuIElzIG5vdCBwYXJ0IG9mIGFueSBvZiB0aGUgbW9kIGxpc3RzIHdoaWNoIFZvcnRleCBtYW5hZ2VzLlxuICAgICAgICBjb25zdCBtYW51YWxseUFkZGVkID0gZGF0YS5zcGxpdCgnXFxuJykuZmlsdGVyKGVudHJ5ID0+XG4gICAgICAgICAgICAhbGlzdEhhc01vZChlbnRyeSwgZW5hYmxlZE1vZHMpXG4gICAgICAgICAgJiYgIWxpc3RIYXNNb2QoZW50cnksIGRpc2FibGVkTW9kcylcbiAgICAgICAgICAmJiBsaXN0SGFzTW9kKGVudHJ5LCBkZXBsb3llZE1vZHMpKTtcblxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1hbnVhbGx5QWRkZWQpO1xuICAgICAgfSkpO1xufVxuXG5mdW5jdGlvbiByZWZyZXNoTW9kTGlzdChjb250ZXh0LCBkaXNjb3ZlcnlQYXRoKSB7XG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgY29uc3QgaW5zdGFsbGF0aW9uUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICBjb25zdCBtb2RzID0gc3RhdGU/LnBlcnNpc3RlbnQ/Lm1vZHM/LltHQU1FX0lEXSA/PyBbXTtcbiAgY29uc3QgbW9kS2V5cyA9IE9iamVjdC5rZXlzKG1vZHMpO1xuICBjb25zdCBtb2RTdGF0ZSA9IHByb2ZpbGU/Lm1vZFN0YXRlID8/IHt9O1xuICBjb25zdCBlbmFibGVkID0gbW9kS2V5cy5maWx0ZXIobW9kID0+ICEhbW9kU3RhdGVbbW9kXSAmJiBtb2RTdGF0ZVttb2RdLmVuYWJsZWQpO1xuICBjb25zdCBkaXNhYmxlZCA9IG1vZEtleXMuZmlsdGVyKGRpcyA9PiAhZW5hYmxlZC5pbmNsdWRlcyhkaXMpKTtcblxuICBjb25zdCBleHRMID0gaW5wdXQgPT4gcGF0aC5leHRuYW1lKGlucHV0KS50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gQmx1ZWJpcmQucmVkdWNlKGVuYWJsZWQsIChhY2N1bSwgbW9kKSA9PiB7XG4gICAgaWYgKG1vZHNbbW9kXT8uaW5zdGFsbGF0aW9uUGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gYWNjdW07XG4gICAgfVxuICAgIGNvbnN0IG1vZFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbGF0aW9uUGF0aCwgbW9kc1ttb2RdLmluc3RhbGxhdGlvblBhdGgpO1xuICAgIHJldHVybiB3YWxrQXN5bmMobW9kUGF0aClcbiAgICAgIC50aGVuKGVudHJpZXMgPT4gKGVudHJpZXMuZmluZChmaWxlTmFtZSA9PiBbJy5wYWsnLCAnLmNmZycsICcubWFuaWZlc3QnXS5pbmNsdWRlcyhleHRMKGZpbGVOYW1lKSkpICE9PSB1bmRlZmluZWQpXG4gICAgICAgID8gYWNjdW0uY29uY2F0KG1vZClcbiAgICAgICAgOiBhY2N1bSk7XG4gIH0sIFtdKS50aGVuKG1hbmFnZWRNb2RzID0+IHtcbiAgICByZXR1cm4gZ2V0TWFudWFsbHlBZGRlZE1vZHMoZGlzYWJsZWQsIGVuYWJsZWQsIHBhdGguam9pbihkaXNjb3ZlcnlQYXRoLCBtb2RzUGF0aCgpLFxuICAgICAgTU9EU19PUkRFUl9GSUxFTkFNRSksIGNvbnRleHQuYXBpKVxuICAgICAgLnRoZW4obWFudWFsbHlBZGRlZCA9PiB7XG4gICAgICAgIF9NT0RTX1NUQVRFLmVuYWJsZWQgPSBbXS5jb25jYXQobWFuYWdlZE1vZHNcbiAgICAgICAgICAubWFwKG1vZCA9PiB0cmFuc2Zvcm1JZChtb2QpKSwgbWFudWFsbHlBZGRlZCk7XG4gICAgICAgIF9NT0RTX1NUQVRFLmRpc2FibGVkID0gZGlzYWJsZWQ7XG4gICAgICAgIF9NT0RTX1NUQVRFLmRpc3BsYXkgPSBfTU9EU19TVEFURS5lbmFibGVkO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9KVxuICB9KTtcbn1cblxuZnVuY3Rpb24gTG9hZE9yZGVyQmFzZShwcm9wcykge1xuICBjb25zdCBnZXRNb2QgPSAoaXRlbSkgPT4ge1xuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhwcm9wcy5tb2RzKTtcbiAgICBjb25zdCBmb3VuZCA9IGtleXMuZmluZChrZXkgPT4gdHJhbnNmb3JtSWQoa2V5KSA9PT0gaXRlbSk7XG4gICAgcmV0dXJuIGZvdW5kICE9PSB1bmRlZmluZWRcbiAgICAgID8gcHJvcHMubW9kc1tmb3VuZF1cbiAgICAgIDogeyBhdHRyaWJ1dGVzOiB7IG5hbWU6IGl0ZW0gfSB9O1xuICB9O1xuXG4gIGNsYXNzIEl0ZW1SZW5kZXJlciBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgcmVuZGVyKCkge1xuICAgICAgaWYgKHByb3BzLm1vZHMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgY29uc3QgaXRlbSA9ICh0aGlzLnByb3BzIGFzIGFueSkuaXRlbTtcbiAgICAgIGNvbnN0IG1vZCA9IGdldE1vZChpdGVtKTtcblxuICAgICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQlMuTGlzdEdyb3VwSXRlbSwge1xuICAgICAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAndmFyKC0tYnJhbmQtYmcsIGJsYWNrKScsXG4gICAgICAgICAgICAgIGJvcmRlckJvdHRvbTogJzJweCBzb2xpZCB2YXIoLS1ib3JkZXItY29sb3IsIHdoaXRlKSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7XG4gICAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgICBmb250U2l6ZTogJzEuMWVtJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdpbWcnLCB7XG4gICAgICAgICAgICBzcmM6ICEhbW9kLmF0dHJpYnV0ZXMucGljdHVyZVVybFxuICAgICAgICAgICAgICAgICAgPyBtb2QuYXR0cmlidXRlcy5waWN0dXJlVXJsXG4gICAgICAgICAgICAgICAgICA6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxuICAgICAgICAgICAgY2xhc3NOYW1lOiAnbW9kLXBpY3R1cmUnLFxuICAgICAgICAgICAgd2lkdGg6Jzc1cHgnLFxuICAgICAgICAgICAgaGVpZ2h0Oic0NXB4JyxcbiAgICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICAgIG1hcmdpbjogJzVweCAxMHB4IDVweCA1cHgnLFxuICAgICAgICAgICAgICBib3JkZXI6ICcxcHggc29saWQgdmFyKC0tYnJhbmQtc2Vjb25kYXJ5LCNENzhGNDYpJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSksXG4gICAgICAgICAgdXRpbC5yZW5kZXJNb2ROYW1lKG1vZCkpKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KE1haW5QYWdlLCB7fSxcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KE1haW5QYWdlLkJvZHksIHt9LFxuICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChCUy5QYW5lbCwgeyBpZDogJ2tjZC1sb2Fkb3JkZXItcGFuZWwnIH0sXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQlMuUGFuZWwuQm9keSwge30sXG4gICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChGbGV4TGF5b3V0LCB7IHR5cGU6ICdyb3cnIH0sXG4gICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEZsZXhMYXlvdXQuRmxleCwge30sXG4gICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoRHJhZ2dhYmxlTGlzdCwge1xuICAgICAgICAgICAgICAgIGlkOiAna2NkLWxvYWRvcmRlcicsXG4gICAgICAgICAgICAgICAgaXRlbVR5cGVJZDogJ2tjZC1sb2Fkb3JkZXItaXRlbScsXG4gICAgICAgICAgICAgICAgaXRlbXM6IF9NT0RTX1NUQVRFLmRpc3BsYXksXG4gICAgICAgICAgICAgICAgaXRlbVJlbmRlcmVyOiBJdGVtUmVuZGVyZXIgYXMgYW55LFxuICAgICAgICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcxMDAlJyxcbiAgICAgICAgICAgICAgICAgIG92ZXJmbG93OiAnYXV0bycsXG4gICAgICAgICAgICAgICAgICBib3JkZXJXaWR0aDogJ3ZhcigtLWJvcmRlci13aWR0aCwgMXB4KScsXG4gICAgICAgICAgICAgICAgICBib3JkZXJTdHlsZTogJ3NvbGlkJyxcbiAgICAgICAgICAgICAgICAgIGJvcmRlckNvbG9yOiAndmFyKC0tYm9yZGVyLWNvbG9yLCB3aGl0ZSknLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYXBwbHk6IG9yZGVyZWQgPT4ge1xuICAgICAgICAgICAgICAgICAgLy8gV2Ugb25seSB3cml0ZSB0byB0aGUgbW9kX29yZGVyIGZpbGUgd2hlbiB3ZSBkZXBsb3kgdG8gYXZvaWQgKHVubGlrZWx5KSBzaXR1YXRpb25zXG4gICAgICAgICAgICAgICAgICAvLyAgd2hlcmUgYSBmaWxlIGRlc2NyaXB0b3IgcmVtYWlucyBvcGVuLCBibG9ja2luZyBmaWxlIG9wZXJhdGlvbnMgd2hlbiB0aGUgdXNlclxuICAgICAgICAgICAgICAgICAgLy8gIGNoYW5nZXMgdGhlIGxvYWQgb3JkZXIgdmVyeSBxdWlja2x5LiBUaGlzIGlzIGFsbCB0aGVvcmV0aWNhbCBhdCB0aGlzIHBvaW50LlxuICAgICAgICAgICAgICAgICAgcHJvcHMub25TZXREZXBsb3ltZW50TmVjZXNzYXJ5KEdBTUVfSUQsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHNldE5ld09yZGVyKHByb3BzLCBvcmRlcmVkKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoRmxleExheW91dC5GbGV4LCB7fSxcbiAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2Jywge1xuICAgICAgICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICAgICAgICBwYWRkaW5nOiAndmFyKC0taGFsZi1ndXR0ZXIsIDE1cHgpJyxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnaDInLCB7fSxcbiAgICAgICAgICAgICAgICAgIHByb3BzLnQoJ0NoYW5naW5nIHlvdXIgbG9hZCBvcmRlcicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcbiAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdwJywge30sXG4gICAgICAgICAgICAgICAgICBwcm9wcy50KCdEcmFnIGFuZCBkcm9wIHRoZSBtb2RzIG9uIHRoZSBsZWZ0IHRvIHJlb3JkZXIgdGhlbS4gS2luZ2RvbSBDb21lOiBEZWxpdmVyYW5jZSB1c2VzIGEgbW9kX29yZGVyLnR4dCBmaWxlICdcbiAgICAgICAgICAgICAgICAgICAgICArICd0byBkZWZpbmUgdGhlIG9yZGVyIGluIHdoaWNoIG1vZHMgYXJlIGxvYWRlZCwgVm9ydGV4IHdpbGwgd3JpdGUgdGhlIGZvbGRlciBuYW1lcyBvZiB0aGUgZGlzcGxheWVkICdcbiAgICAgICAgICAgICAgICAgICAgICArICdtb2RzIGluIHRoZSBvcmRlciB5b3UgaGF2ZSBzZXQuICdcbiAgICAgICAgICAgICAgICAgICAgICArICdNb2RzIHBsYWNlZCBhdCB0aGUgYm90dG9tIG9mIHRoZSBsb2FkIG9yZGVyIHdpbGwgaGF2ZSBwcmlvcml0eSBvdmVyIHRob3NlIGFib3ZlIHRoZW0uJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxuICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgncCcsIHt9LFxuICAgICAgICAgICAgICAgICAgcHJvcHMudCgnTm90ZTogVm9ydGV4IHdpbGwgZGV0ZWN0IG1hbnVhbGx5IGFkZGVkIG1vZHMgYXMgbG9uZyBhcyB0aGVzZSBoYXZlIGJlZW4gYWRkZWQgdG8gdGhlIG1vZF9vcmRlci50eHQgZmlsZS4gJ1xuICAgICAgICAgICAgICAgICAgICAgICAgKyAnTWFudWFsbHkgYWRkZWQgbW9kcyBhcmUgbm90IG1hbmFnZWQgYnkgVm9ydGV4IC0gdG8gcmVtb3ZlIHRoZXNlLCB5b3Ugd2lsbCBoYXZlIHRvICdcbiAgICAgICAgICAgICAgICAgICAgICAgICsgJ21hbnVhbGx5IGVyYXNlIHRoZSBlbnRyeSBmcm9tIHRoZSBtb2Rfb3JkZXIudHh0IGZpbGUuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxuICAgICAgICAgICAgICApKVxuICAgICAgICApKSkpKTtcbn1cblxuZnVuY3Rpb24gbW9kc1BhdGgoKSB7XG4gIHJldHVybiAnTW9kcyc7XG59XG5cbmZ1bmN0aW9uIHNldE5ld09yZGVyKHByb3BzLCBvcmRlcmVkKSB7XG4gIGNvbnN0IHsgY29udGV4dCwgcHJvZmlsZSwgb25TZXRPcmRlciB9ID0gcHJvcHM7XG4gIGlmIChwcm9maWxlPy5pZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gTm90IHN1cmUgaG93IHdlIGdvdCBoZXJlIHdpdGhvdXQgYSB2YWxpZCBwcm9maWxlLlxuICAgIC8vICBwb3NzaWJseSB0aGUgdXNlciBjaGFuZ2VkIHByb2ZpbGUgZHVyaW5nIHRoZSBzZXR1cC9wcmVwYXJhdGlvblxuICAgIC8vICBzdGFnZSA/IGh0dHBzOi8vZ2l0aHViLmNvbS9OZXh1cy1Nb2RzL1ZvcnRleC9pc3N1ZXMvNzA1M1xuICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHNldCBuZXcgbG9hZCBvcmRlcicsICd1bmRlZmluZWQgcHJvZmlsZScpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIFdlIGZpbHRlciB0aGUgb3JkZXJlZCBsaXN0IGp1c3QgaW4gY2FzZSB0aGVyZSdzIGFuIGVtcHR5XG4gIC8vICBlbnRyeSwgd2hpY2ggaXMgcG9zc2libGUgaWYgdGhlIHVzZXJzIGhhZCBtYW51YWxseSBhZGRlZFxuICAvLyAgZW1wdHkgbGluZXMgaW4gdGhlIGxvYWQgb3JkZXIgZmlsZS5cbiAgY29uc3QgZmlsdGVyZWQgPSBvcmRlcmVkLmZpbHRlcihlbnRyeSA9PiAhIWVudHJ5KTtcbiAgX01PRFNfU1RBVEUuZGlzcGxheSA9IGZpbHRlcmVkO1xuXG4gIHJldHVybiAoISFvblNldE9yZGVyKVxuICAgID8gb25TZXRPcmRlcihwcm9maWxlLmlkLCBmaWx0ZXJlZClcbiAgICA6IGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyKHByb2ZpbGUuaWQsIGZpbHRlcmVkKSk7XG59XG5cbmZ1bmN0aW9uIHdyaXRlT3JkZXJGaWxlKGZpbGVQYXRoLCBtb2RMaXN0KSB7XG4gIHJldHVybiBmcy5yZW1vdmVBc3luYyhmaWxlUGF0aClcbiAgICAuY2F0Y2goZXJyID0+IGVyci5jb2RlID09PSAnRU5PRU5UJyA/IFByb21pc2UucmVzb2x2ZSgpIDogUHJvbWlzZS5yZWplY3QoZXJyKSlcbiAgICAudGhlbigoKSA9PiBmcy5lbnN1cmVGaWxlQXN5bmMoZmlsZVBhdGgpKVxuICAgIC50aGVuKCgpID0+IGZzLndyaXRlRmlsZUFzeW5jKGZpbGVQYXRoLCBtb2RMaXN0LmpvaW4oJ1xcbicpLCB7IGVuY29kaW5nOiAndXRmOCcgfSkpO1xufVxuXG5mdW5jdGlvbiBtYWluKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcbiAgICBpZDogR0FNRV9JRCxcbiAgICBuYW1lOiAnS2luZ2RvbSBDb21lOlxcdERlbGl2ZXJhbmNlJyxcbiAgICBtZXJnZU1vZHM6IG1vZCA9PiB0cmFuc2Zvcm1JZChtb2QuaWQpLFxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXG4gICAgcXVlcnlNb2RQYXRoOiBtb2RzUGF0aCxcbiAgICBsb2dvOiAnZ2FtZWFydC5qcGcnLFxuICAgIGV4ZWN1dGFibGU6IChkaXNjb3ZlcmVkUGF0aCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZXBpY1BhdGggPSBwYXRoLmpvaW4oJ0JpbicsICdXaW42NE1hc3Rlck1hc3RlckVwaWNQR08nLCAnS2luZ2RvbUNvbWUuZXhlJylcbiAgICAgICAgZnMuc3RhdFN5bmMocGF0aC5qb2luKGRpc2NvdmVyZWRQYXRoLCBlcGljUGF0aCkpO1xuICAgICAgICByZXR1cm4gZXBpY1BhdGg7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmV0dXJuIHBhdGguam9pbignQmluJywgJ1dpbjY0JywgJ0tpbmdkb21Db21lLmV4ZScpO1xuICAgICAgfVxuICAgIH0sXG4gICAgcmVxdWlyZWRGaWxlczogW1xuICAgICAgJ0RhdGEvTGV2ZWxzL3JhdGFqZS9sZXZlbC5wYWsnLFxuICAgIF0sXG4gICAgc2V0dXA6IChkaXNjb3ZlcnkpID0+IHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQsIGRpc2NvdmVyeSksXG4gICAgLy9yZXF1aXJlc0NsZWFudXA6IHRydWUsIC8vIFRoZW9yZXRpY2FsbHkgbm90IG5lZWRlZCwgYXMgd2UgbG9vayBmb3Igc2V2ZXJhbCBmaWxlIGV4dGVuc2lvbnMgd2hlblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgY2hlY2tpbmcgd2hldGhlciBhIG1vZCBpcyB2YWxpZCBvciBub3QuIFRoaXMgbWF5IGNoYW5nZS5cbiAgICByZXF1aXJlc0xhdW5jaGVyOiAoKSA9PiB1dGlsLmVwaWNHYW1lc0xhdW5jaGVyLmlzR2FtZUluc3RhbGxlZCgnRWVsJylcbiAgICAgIC50aGVuKGVwaWMgPT4gZXBpY1xuICAgICAgICA/IHsgbGF1bmNoZXI6ICdlcGljJywgYWRkSW5mbzogJ0VlbCcgfVxuICAgICAgICA6IHVuZGVmaW5lZCksXG4gICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgIFN0ZWFtQVBQSWQ6IFNURUFNX0FQUElELFxuICAgIH0sXG4gICAgZGV0YWlsczoge1xuICAgICAgc3RlYW1BcHBJZDogK1NURUFNX0FQUElELFxuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJNYWluUGFnZSgnc29ydC1ub25lJywgJ0xvYWQgT3JkZXInLCBMb2FkT3JkZXIsIHtcbiAgICBpZDogJ2tjZC1sb2FkLW9yZGVyJyxcbiAgICBob3RrZXk6ICdFJyxcbiAgICBncm91cDogJ3Blci1nYW1lJyxcbiAgICB2aXNpYmxlOiAoKSA9PiBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCkpID09PSBHQU1FX0lELFxuICAgIHByb3BzOiAoKSA9PiAoe1xuICAgICAgdDogY29udGV4dC5hcGkudHJhbnNsYXRlLFxuICAgIH0pLFxuICB9KTtcblxuICBjb250ZXh0Lm9wdGlvbmFsLnJlZ2lzdGVyQ29sbGVjdGlvbkZlYXR1cmUoXG4gICAgJ2tjZF9jb2xsZWN0aW9uX2RhdGEnLFxuICAgIChnYW1lSWQ6IHN0cmluZywgaW5jbHVkZWRNb2RzOiBzdHJpbmdbXSkgPT5cbiAgICAgIGdlbkNvbGxlY3Rpb25zRGF0YShjb250ZXh0LCBnYW1lSWQsIGluY2x1ZGVkTW9kcyksXG4gICAgKGdhbWVJZDogc3RyaW5nLCBjb2xsZWN0aW9uOiBJS0NEQ29sbGVjdGlvbnNEYXRhKSA9PlxuICAgICAgcGFyc2VDb2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBjb2xsZWN0aW9uKSxcbiAgICAoKSA9PiBQcm9taXNlLnJlc29sdmUoKSxcbiAgICAodCkgPT4gdCgnS2luZ2RvbSBDb21lOiBEZWxpdmVyYW5jZSBEYXRhJyksXG4gICAgKHN0YXRlOiB0eXBlcy5JU3RhdGUsIGdhbWVJZDogc3RyaW5nKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsXG4gICAgQ29sbGVjdGlvbnNEYXRhVmlldyxcbiAgKTtcblxuICBjb250ZXh0Lm9uY2UoKCkgPT4ge1xuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignbW9kLWVuYWJsZWQnLCAocHJvZmlsZUlkLCBtb2RJZCkgPT4ge1xuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICAgICAgY29uc3QgZGlzY292ZXJ5ID0gc3RhdGU/LnNldHRpbmdzPy5nYW1lTW9kZT8uZGlzY292ZXJlZD8uW0dBTUVfSURdO1xuICAgICAgaWYgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcHJvZmlsZSA9IHN0YXRlPy5wZXJzaXN0ZW50Py5wcm9maWxlcz8uW3Byb2ZpbGVJZF07XG4gICAgICBpZiAoISFwcm9maWxlICYmIChwcm9maWxlLmdhbWVJZCA9PT0gR0FNRV9JRCkgJiYgKF9NT0RTX1NUQVRFLmRpc3BsYXkuaW5kZXhPZihtb2RJZCkgPT09IC0xKSkge1xuICAgICAgICByZWZyZXNoTW9kTGlzdChjb250ZXh0LCBkaXNjb3ZlcnkucGF0aCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ3B1cmdlLW1vZHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBzdG9yZSA9IGNvbnRleHQuYXBpLnN0b3JlO1xuICAgICAgY29uc3Qgc3RhdGUgPSBzdG9yZS5nZXRTdGF0ZSgpO1xuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgICAgIGlmIChwcm9maWxlID09PSB1bmRlZmluZWQgfHwgcHJvZmlsZS5nYW1lSWQgIT09IEdBTUVfSUQpe1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGRpc2NvdmVyeSA9IHN0YXRlPy5zZXR0aW5ncz8uZ2FtZU1vZGU/LmRpc2NvdmVyZWQ/LltHQU1FX0lEXTtcbiAgICAgIGlmICgoZGlzY292ZXJ5ID09PSB1bmRlZmluZWQpIHx8IChkaXNjb3ZlcnkucGF0aCA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgICAvLyBzaG91bGQgbmV2ZXIgaGFwcGVuIGFuZCBpZiBpdCBkb2VzIGl0IHdpbGwgY2F1c2UgZXJyb3JzIGVsc2V3aGVyZSBhcyB3ZWxsXG4gICAgICAgIGxvZygnZXJyb3InLCAna2luZ2RvbWNvbWVkZWxpdmVyYW5jZSB3YXMgbm90IGRpc2NvdmVyZWQnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBtb2RzT3JkZXJGaWxlUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgbW9kc1BhdGgoKSwgTU9EU19PUkRFUl9GSUxFTkFNRSk7XG4gICAgICBjb25zdCBtYW5hZ2VkTW9kcyA9IHN0YXRlPy5wZXJzaXN0ZW50Py5tb2RzPy5bR0FNRV9JRF0gPz8ge307XG4gICAgICBjb25zdCBtb2RLZXlzID0gT2JqZWN0LmtleXMobWFuYWdlZE1vZHMpO1xuICAgICAgY29uc3QgbW9kU3RhdGUgPSBwcm9maWxlPy5tb2RTdGF0ZSA/PyB7fTtcbiAgICAgIGNvbnN0IGVuYWJsZWQgPSBtb2RLZXlzLmZpbHRlcihtb2QgPT4gISFtb2RTdGF0ZVttb2RdICYmIG1vZFN0YXRlW21vZF0uZW5hYmxlZCk7XG4gICAgICBjb25zdCBkaXNhYmxlZCA9IG1vZEtleXMuZmlsdGVyKGRpcyA9PiAhZW5hYmxlZC5pbmNsdWRlcyhkaXMpKTtcbiAgICAgIGdldE1hbnVhbGx5QWRkZWRNb2RzKGRpc2FibGVkLCBlbmFibGVkLCBtb2RzT3JkZXJGaWxlUGF0aCwgY29udGV4dC5hcGkpXG4gICAgICAgIC50aGVuKG1hbnVhbGx5QWRkZWQgPT4ge1xuICAgICAgICAgIHdyaXRlT3JkZXJGaWxlKG1vZHNPcmRlckZpbGVQYXRoLCBtYW51YWxseUFkZGVkKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gc2V0TmV3T3JkZXIoeyBjb250ZXh0LCBwcm9maWxlIH0sIG1hbnVhbGx5QWRkZWQpKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgY29uc3QgdXNlckNhbmNlbGVkID0gKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKTtcbiAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZS1pbnN0YXRlIG1hbnVhbGx5IGFkZGVkIG1vZHMnLCBlcnIsIHsgYWxsb3dSZXBvcnQ6ICF1c2VyQ2FuY2VsZWQgfSlcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgKHByb2ZpbGVJZCwgZGVwbG95bWVudCkgPT4ge1xuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcbiAgICAgIGlmIChwcm9maWxlID09PSB1bmRlZmluZWQgfHwgcHJvZmlsZS5nYW1lSWQgIT09IEdBTUVfSUQpIHtcblxuICAgICAgICBpZiAocHJvZmlsZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgbG9nKCdlcnJvcicsICdwcm9maWxlIGRvZXMgbm90IGV4aXN0JywgcHJvZmlsZUlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbG9hZE9yZGVyID0gc3RhdGUucGVyc2lzdGVudFsnbG9hZE9yZGVyJ10/Lltwcm9maWxlSWRdID8/IFtdO1xuICAgICAgY29uc3QgZGlzY292ZXJ5ID0gc3RhdGU/LnNldHRpbmdzPy5nYW1lTW9kZT8uZGlzY292ZXJlZD8uW3Byb2ZpbGUuZ2FtZUlkXTtcblxuICAgICAgaWYgKChkaXNjb3ZlcnkgPT09IHVuZGVmaW5lZCkgfHwgKGRpc2NvdmVyeS5wYXRoID09PSB1bmRlZmluZWQpKSB7XG4gICAgICAgIC8vIHNob3VsZCBuZXZlciBoYXBwZW4gYW5kIGlmIGl0IGRvZXMgaXQgd2lsbCBjYXVzZSBlcnJvcnMgZWxzZXdoZXJlIGFzIHdlbGxcbiAgICAgICAgbG9nKCdlcnJvcicsICdraW5nZG9tY29tZWRlbGl2ZXJhbmNlIHdhcyBub3QgZGlzY292ZXJlZCcpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG1vZHNGb2xkZXIgPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIG1vZHNQYXRoKCkpO1xuICAgICAgY29uc3QgbW9kT3JkZXJGaWxlID0gcGF0aC5qb2luKG1vZHNGb2xkZXIsIE1PRFNfT1JERVJfRklMRU5BTUUpO1xuXG4gICAgICByZXR1cm4gcmVmcmVzaE1vZExpc3QoY29udGV4dCwgZGlzY292ZXJ5LnBhdGgpXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICBsZXQgbWlzc2luZyA9IGxvYWRPcmRlciAvLyBGSVhNRTogYXMgdW5rbm93biBhcyBzdHJpbmdcbiAgICAgICAgICAgIC5maWx0ZXIobW9kID0+ICFsaXN0SGFzTW9kKHRyYW5zZm9ybUlkKG1vZCBhcyB1bmtub3duIGFzIHN0cmluZyksIF9NT0RTX1NUQVRFLmVuYWJsZWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAmJiAhbGlzdEhhc01vZCh0cmFuc2Zvcm1JZChtb2QgYXMgdW5rbm93biBhcyBzdHJpbmcpLCBfTU9EU19TVEFURS5kaXNhYmxlZClcbiAgICAgICAgICAgICAgICAgICAgICAgICYmIGxpc3RIYXNNb2QodHJhbnNmb3JtSWQobW9kIGFzIHVua25vd24gYXMgc3RyaW5nKSwgX01PRFNfU1RBVEUuZGlzcGxheSkpXG4gICAgICAgICAgICAubWFwKG1vZCA9PiB0cmFuc2Zvcm1JZChtb2QgYXMgdW5rbm93biBhcyBzdHJpbmcpKSB8fCBbXTtcblxuICAgICAgICAgIC8vIFRoaXMgaXMgdGhlb3JldGljYWxseSB1bmVjZXNzYXJ5IC0gYnV0IGl0IHdpbGwgZW5zdXJlIG5vIGR1cGxpY2F0ZXNcbiAgICAgICAgICAvLyAgYXJlIGFkZGVkLlxuICAgICAgICAgIG1pc3NpbmcgPSBbIC4uLm5ldyBTZXQobWlzc2luZykgXTtcbiAgICAgICAgICBjb25zdCB0cmFuc2Zvcm1lZCA9IFsgLi4uX01PRFNfU1RBVEUuZW5hYmxlZCwgLi4ubWlzc2luZyBdO1xuICAgICAgICAgIGNvbnN0IGxvVmFsdWUgPSAoaW5wdXQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGlkeCA9IGxvYWRPcmRlci5pbmRleE9mKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiBpZHggIT09IC0xID8gaWR4IDogbG9hZE9yZGVyLmxlbmd0aDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBTb3J0XG4gICAgICAgICAgbGV0IHNvcnRlZCA9IHRyYW5zZm9ybWVkLmxlbmd0aCA+IDFcbiAgICAgICAgICAgID8gdHJhbnNmb3JtZWQuc29ydCgobGhzLCByaHMpID0+IGxvVmFsdWUobGhzKSAtIGxvVmFsdWUocmhzKSlcbiAgICAgICAgICAgIDogdHJhbnNmb3JtZWQ7XG5cbiAgICAgICAgICBzZXROZXdPcmRlcih7IGNvbnRleHQsIHByb2ZpbGUgfSwgc29ydGVkKTtcbiAgICAgICAgICByZXR1cm4gd3JpdGVPcmRlckZpbGUobW9kT3JkZXJGaWxlLCB0cmFuc2Zvcm1lZClcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBjb25zdCB1c2VyQ2FuY2VsZWQgPSAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpO1xuICAgICAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byB3cml0ZSB0byBsb2FkIG9yZGVyIGZpbGUnLCBlcnIsIHsgYWxsb3dSZXBvcnQ6ICF1c2VyQ2FuY2VsZWQgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIG1hcFN0YXRlVG9Qcm9wcyhzdGF0ZSkge1xuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICBjb25zdCBwcm9maWxlSWQgPSBwcm9maWxlPy5pZCB8fCAnJztcbiAgY29uc3QgZ2FtZUlkID0gcHJvZmlsZT8uZ2FtZUlkIHx8ICcnO1xuICByZXR1cm4ge1xuICAgIHByb2ZpbGUsXG4gICAgbW9kU3RhdGU6IHByb2ZpbGU/Lm1vZFN0YXRlID8/IHt9LFxuICAgIG1vZHM6IHN0YXRlPy5wZXJzaXN0ZW50Py5tb2RzPy5bZ2FtZUlkXSA/PyBbXSxcbiAgICBvcmRlcjogc3RhdGU/LnBlcnNpc3RlbnQ/LmxvYWRPcmRlcj8uW3Byb2ZpbGVJZF0gPz8gW10sXG4gIH07XG59XG5cbmZ1bmN0aW9uIG1hcERpc3BhdGNoVG9Qcm9wcyhkaXNwYXRjaCkge1xuICByZXR1cm4ge1xuICAgIG9uU2V0RGVwbG95bWVudE5lY2Vzc2FyeTogKGdhbWVJZCwgbmVjZXNzYXJ5KSA9PiBkaXNwYXRjaChhY3Rpb25zLnNldERlcGxveW1lbnROZWNlc3NhcnkoZ2FtZUlkLCBuZWNlc3NhcnkpKSxcbiAgICBvblNldE9yZGVyOiAocHJvZmlsZUlkLCBvcmRlcmVkKSA9PiBkaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlcihwcm9maWxlSWQsIG9yZGVyZWQpKSxcbiAgfTtcbn1cblxuY29uc3QgTG9hZE9yZGVyID0gY29ubmVjdChtYXBTdGF0ZVRvUHJvcHMsIG1hcERpc3BhdGNoVG9Qcm9wcykoTG9hZE9yZGVyQmFzZSk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBkZWZhdWx0OiBtYWluLFxufTtcbiJdfQ==