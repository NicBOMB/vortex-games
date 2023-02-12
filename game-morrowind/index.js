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
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const React = __importStar(require("react"));
const walk = require('turbowalk').default;
const loadorder_1 = require("./loadorder");
const constants_1 = require("./constants");
const collections_1 = require("./collections");
const MorrowindCollectionsDataView_1 = __importDefault(require("./views/MorrowindCollectionsDataView"));
const migrations_1 = require("./migrations");
const STEAMAPP_ID = '22320';
const GOG_ID = '1435828767';
const MS_ID = 'BethesdaSoftworks.TESMorrowind-PC';
const GAME_ID = constants_1.MORROWIND_ID;
const localeFoldersXbox = {
    en: 'Morrowind GOTY English',
    fr: 'Morrowind GOTY French',
    de: 'Morrowind GOTY German',
};
const gameStoreIds = {
    steam: [{ id: STEAMAPP_ID, prefer: 0 }],
    xbox: [{ id: MS_ID }],
    gog: [{ id: GOG_ID }],
    registry: [{ id: 'HKEY_LOCAL_MACHINE:Software\\Wow6432Node\\Bethesda Softworks\\Morrowind:Installed Path' }],
};
const tools = [
    {
        id: 'tes3edit',
        name: 'TES3Edit',
        executable: () => 'TES3Edit.exe',
        requiredFiles: []
    },
    {
        id: 'mw-construction-set',
        name: 'Construction Set',
        logo: 'constructionset.png',
        executable: () => 'TES Construction Set.exe',
        requiredFiles: [
            'TES Construction Set.exe',
        ],
        relative: true,
        exclusive: true
    }
];
async function findGame() {
    const storeGames = await vortex_api_1.util.GameStoreHelper.find(gameStoreIds).catch(() => []);
    if (!storeGames.length)
        return;
    if (storeGames.length > 1)
        (0, vortex_api_1.log)('debug', 'Mutliple copies of Oblivion found', storeGames.map(s => s.gameStoreId));
    const selectedGame = storeGames[0];
    if (['epic', 'xbox'].includes(selectedGame.gameStoreId)) {
        (0, vortex_api_1.log)('debug', 'Defaulting to the English game version', { store: selectedGame.gameStoreId, folder: localeFoldersXbox['en'] });
        selectedGame.gamePath = path_1.default.join(selectedGame.gamePath, localeFoldersXbox['en']);
    }
    return selectedGame;
}
function prepareForModding(api, discovery) {
    const gameName = vortex_api_1.util.getGame(GAME_ID)?.name || 'This game';
    if (discovery.store && ['epic', 'xbox'].includes(discovery.store)) {
        const storeName = discovery.store === 'epic' ? 'Epic Games' : 'Xbox Game Pass';
        api.sendNotification({
            id: `${GAME_ID}-locale-message`,
            type: 'info',
            title: 'Multiple Languages Available',
            message: 'Default: English',
            allowSuppress: true,
            actions: [
                {
                    title: 'More',
                    action: (dismiss) => {
                        dismiss();
                        api.showDialog('info', 'Mutliple Languages Available', {
                            bbcode: '{{gameName}} has multiple language options when downloaded from {{storeName}}. [br][/br][br][/br]' +
                                'Vortex has selected the English variant by default. [br][/br][br][/br]' +
                                'If you would prefer to manage a different language you can change the path to the game using the "Manually Set Location" option in the games tab.',
                            parameters: { gameName, storeName }
                        }, [
                            { label: 'Close', action: () => api.suppressNotification(`${GAME_ID}-locale-message`) }
                        ]);
                    }
                }
            ]
        });
    }
    return Promise.resolve();
}
function CollectionDataWrap(api, props) {
    return React.createElement(MorrowindCollectionsDataView_1.default, { ...props, api, });
}
function main(context) {
    context.registerGame({
        id: constants_1.MORROWIND_ID,
        name: 'Morrowind',
        mergeMods: true,
        queryPath: vortex_api_1.util.toBlue(findGame),
        supportedTools: tools,
        setup: vortex_api_1.util.toBlue((discovery) => prepareForModding(context.api, discovery)),
        queryModPath: () => 'Data Files',
        logo: 'gameart.jpg',
        executable: () => 'morrowind.exe',
        requiredFiles: [
            'morrowind.exe',
        ],
        environment: {
            SteamAPPId: STEAMAPP_ID,
        },
        details: {
            steamAppId: parseInt(STEAMAPP_ID, 10),
            gogAppId: GOG_ID
        },
    });
    context.registerLoadOrder({
        gameId: constants_1.MORROWIND_ID,
        deserializeLoadOrder: () => (0, loadorder_1.deserializeLoadOrder)(context.api),
        serializeLoadOrder: (loadOrder) => (0, loadorder_1.serializeLoadOrder)(context.api, loadOrder),
        validate: loadorder_1.validate,
        noCollectionGeneration: true,
        toggleableEntries: true,
        usageInstructions: 'Drag your plugins as needed - the game will load '
            + 'load them from top to bottom.',
    });
    context.optional.registerCollectionFeature('morrowind_collection_data', (gameId, includedMods, collection) => (0, collections_1.genCollectionsData)(context, gameId, includedMods, collection), (gameId, collection) => (0, collections_1.parseCollectionsData)(context, gameId, collection), () => Promise.resolve(), (t) => t('Load Order'), (state, gameId) => gameId === constants_1.MORROWIND_ID, (props) => CollectionDataWrap(context.api, props));
    context.registerMigration(old => (0, migrations_1.migrate103)(context.api, old));
    context.once(() => {
        context.api.events.on('did-install-mod', async (gameId, archiveId, modId) => {
            if (gameId !== constants_1.MORROWIND_ID) {
                return;
            }
            const state = context.api.getState();
            const installPath = vortex_api_1.selectors.installPathForGame(state, constants_1.MORROWIND_ID);
            const mod = state?.persistent?.mods?.[constants_1.MORROWIND_ID]?.[modId];
            if (installPath === undefined || mod === undefined) {
                return;
            }
            const modPath = path_1.default.join(installPath, mod.installationPath);
            const plugins = [];
            try {
                await walk(modPath, entries => {
                    for (let entry of entries) {
                        if (['.esp', '.esm'].includes(path_1.default.extname(entry.filePath.toLowerCase()))) {
                            plugins.push(path_1.default.basename(entry.filePath));
                        }
                    }
                }, { recurse: true, skipLinks: true, skipInaccessible: true });
            }
            catch (err) {
                context.api.showErrorNotification('Failed to read list of plugins', err, { allowReport: false });
            }
            if (plugins.length > 0) {
                context.api.store.dispatch(vortex_api_1.actions.setModAttribute(constants_1.MORROWIND_ID, mod.id, 'plugins', plugins));
            }
        });
    });
    return true;
}
module.exports = {
    default: main
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLDJDQUFrRTtBQUNsRSw2Q0FBK0I7QUFFL0IsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLE9BQU8sQ0FBQztBQUUxQywyQ0FBaUY7QUFDakYsMkNBQTJDO0FBSTNDLCtDQUF5RTtBQUV6RSx3R0FBZ0Y7QUFFaEYsNkNBQTBDO0FBRTFDLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQztBQUM1QixNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFDNUIsTUFBTSxLQUFLLEdBQUcsbUNBQW1DLENBQUM7QUFFbEQsTUFBTSxPQUFPLEdBQUcsd0JBQVksQ0FBQztBQUU3QixNQUFNLGlCQUFpQixHQUFHO0lBQ3hCLEVBQUUsRUFBRSx3QkFBd0I7SUFDNUIsRUFBRSxFQUFFLHVCQUF1QjtJQUMzQixFQUFFLEVBQUUsdUJBQXVCO0NBQzVCLENBQUE7QUFFRCxNQUFNLFlBQVksR0FBUTtJQUN4QixLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQ3ZDLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDO0lBQ3JCLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDO0lBQ3JCLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLHdGQUF3RixFQUFFLENBQUM7Q0FDN0csQ0FBQztBQUVGLE1BQU0sS0FBSyxHQUFHO0lBQ1o7UUFDRSxFQUFFLEVBQUUsVUFBVTtRQUNkLElBQUksRUFBRSxVQUFVO1FBQ2hCLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxjQUFjO1FBQ2hDLGFBQWEsRUFBRSxFQUFFO0tBQ2xCO0lBQ0Q7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QUFLLEVBQUUsQ0FBQyxDQUFDO2FBQ2xHO1lBQ0QsSUFBSyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDdkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLG9CQUFPLENBQUMsZUFBZSxDQUFDLHdCQUFZLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQzthQUMvRjtRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHO0lBQ2YsT0FBTyxFQUFFLElBQUk7Q0FDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBhY3Rpb25zLCBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcblxuY29uc3Qgd2FsayA9IHJlcXVpcmUoJ3R1cmJvd2FsaycpLmRlZmF1bHQ7XG5cbmltcG9ydCB7IHZhbGlkYXRlLCBkZXNlcmlhbGl6ZUxvYWRPcmRlciwgc2VyaWFsaXplTG9hZE9yZGVyIH0gZnJvbSAnLi9sb2Fkb3JkZXInO1xuaW1wb3J0IHsgTU9SUk9XSU5EX0lEIH0gZnJvbSAnLi9jb25zdGFudHMnO1xuXG5pbXBvcnQgeyBJRXh0ZW5kZWRJbnRlcmZhY2VQcm9wcyB9IGZyb20gJy4vdHlwZXMvdHlwZXMnO1xuXG5pbXBvcnQgeyBnZW5Db2xsZWN0aW9uc0RhdGEsIHBhcnNlQ29sbGVjdGlvbnNEYXRhIH0gZnJvbSAnLi9jb2xsZWN0aW9ucyc7XG5cbmltcG9ydCBNb3Jyb3dpbmRDb2xsZWN0aW9uc0RhdGFWaWV3IGZyb20gJy4vdmlld3MvTW9ycm93aW5kQ29sbGVjdGlvbnNEYXRhVmlldyc7XG5cbmltcG9ydCB7IG1pZ3JhdGUxMDMgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xuXG5jb25zdCBTVEVBTUFQUF9JRCA9ICcyMjMyMCc7XG5jb25zdCBHT0dfSUQgPSAnMTQzNTgyODc2Nyc7XG5jb25zdCBNU19JRCA9ICdCZXRoZXNkYVNvZnR3b3Jrcy5URVNNb3Jyb3dpbmQtUEMnO1xuXG5jb25zdCBHQU1FX0lEID0gTU9SUk9XSU5EX0lEO1xuXG5jb25zdCBsb2NhbGVGb2xkZXJzWGJveCA9IHtcbiAgZW46ICdNb3Jyb3dpbmQgR09UWSBFbmdsaXNoJyxcbiAgZnI6ICdNb3Jyb3dpbmQgR09UWSBGcmVuY2gnLFxuICBkZTogJ01vcnJvd2luZCBHT1RZIEdlcm1hbicsXG59XG5cbmNvbnN0IGdhbWVTdG9yZUlkczogYW55ID0ge1xuICBzdGVhbTogW3sgaWQ6IFNURUFNQVBQX0lELCBwcmVmZXI6IDAgfV0sXG4gIHhib3g6IFt7IGlkOiBNU19JRCB9XSxcbiAgZ29nOiBbeyBpZDogR09HX0lEIH1dLFxuICByZWdpc3RyeTogW3sgaWQ6ICdIS0VZX0xPQ0FMX01BQ0hJTkU6U29mdHdhcmVcXFxcV293NjQzMk5vZGVcXFxcQmV0aGVzZGEgU29mdHdvcmtzXFxcXE1vcnJvd2luZDpJbnN0YWxsZWQgUGF0aCcgfV0sXG59O1xuXG5jb25zdCB0b29scyA9IFtcbiAge1xuICAgIGlkOiAndGVzM2VkaXQnLFxuICAgIG5hbWU6ICdURVMzRWRpdCcsXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ1RFUzNFZGl0LmV4ZScsXG4gICAgcmVxdWlyZWRGaWxlczogW11cbiAgfSxcbiAge1xuICAgIGlkOiAnbXctY29uc3RydWN0aW9uLXNldCcsXG4gICAgbmFtZTogJ0NvbnN0cnVjdGlvbiBTZXQnLFxuICAgIGxvZ286ICdjb25zdHJ1Y3Rpb25zZXQucG5nJyxcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnVEVTIENvbnN0cnVjdGlvbiBTZXQuZXhlJyxcbiAgICByZXF1aXJlZEZpbGVzOiBbXG4gICAgICAnVEVTIENvbnN0cnVjdGlvbiBTZXQuZXhlJyxcbiAgICBdLFxuICAgIHJlbGF0aXZlOiB0cnVlLFxuICAgIGV4Y2x1c2l2ZTogdHJ1ZVxuICB9XG5dO1xuXG5hc3luYyBmdW5jdGlvbiBmaW5kR2FtZSgpIHtcbiAgY29uc3Qgc3RvcmVHYW1lcyA9IGF3YWl0IHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmQoZ2FtZVN0b3JlSWRzKS5jYXRjaCgoKSA9PiBbXSk7XG5cbiAgaWYgKCFzdG9yZUdhbWVzLmxlbmd0aCkgcmV0dXJuO1xuXG4gIGlmIChzdG9yZUdhbWVzLmxlbmd0aCA+IDEpIGxvZygnZGVidWcnLCAnTXV0bGlwbGUgY29waWVzIG9mIE9ibGl2aW9uIGZvdW5kJywgc3RvcmVHYW1lcy5tYXAocyA9PiBzLmdhbWVTdG9yZUlkKSk7XG5cbiAgY29uc3Qgc2VsZWN0ZWRHYW1lID0gc3RvcmVHYW1lc1swXTtcbiAgaWYgKFsnZXBpYycsICd4Ym94J10uaW5jbHVkZXMoc2VsZWN0ZWRHYW1lLmdhbWVTdG9yZUlkKSkge1xuICAgIC8vIEdldCB0aGUgdXNlcidzIGNob3NlbiBsYW5ndWFnZVxuICAgIC8vIHN0YXRlLmludGVyZmFjZS5sYW5ndWFnZSB8fCAnZW4nO1xuICAgIGxvZygnZGVidWcnLCAnRGVmYXVsdGluZyB0byB0aGUgRW5nbGlzaCBnYW1lIHZlcnNpb24nLCB7IHN0b3JlOiBzZWxlY3RlZEdhbWUuZ2FtZVN0b3JlSWQsIGZvbGRlcjogbG9jYWxlRm9sZGVyc1hib3hbJ2VuJ10gfSk7XG4gICAgc2VsZWN0ZWRHYW1lLmdhbWVQYXRoID0gcGF0aC5qb2luKHNlbGVjdGVkR2FtZS5nYW1lUGF0aCwgbG9jYWxlRm9sZGVyc1hib3hbJ2VuJ10pO1xuICB9XG4gIHJldHVybiBzZWxlY3RlZEdhbWU7XG59XG5cbi8qIE1vcnJvd2luZCBzZWVtcyB0byBzdGFydCBmaW5lIHdoZW4gcnVubmluZyBkaXJlY3RseS4gSWYgd2UgZG8gZ28gdGhyb3VnaCB0aGUgbGF1bmNoZXIgdGhlbiB0aGUgbGFuZ3VhZ2UgdmVyc2lvbiBiZWluZ1xuICAgc3RhcnRlZCBtaWdodCBub3QgYmUgdGhlIG9uZSB3ZSdyZSBtb2RkaW5nXG5cbmZ1bmN0aW9uIHJlcXVpcmVzTGF1bmNoZXIoZ2FtZVBhdGgpIHtcbiAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFtNU19JRF0sICd4Ym94JylcbiAgICAudGhlbigoKSA9PiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgbGF1bmNoZXI6ICd4Ym94JyxcbiAgICAgIGFkZEluZm86IHtcbiAgICAgICAgYXBwSWQ6IE1TX0lELFxuICAgICAgICBwYXJhbWV0ZXJzOiBbXG4gICAgICAgICAgeyBhcHBFeGVjTmFtZTogJ0dhbWUnIH0sXG4gICAgICAgIF0sXG4gICAgICB9XG4gICAgfSkpXG4gICAgLmNhdGNoKGVyciA9PiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKSk7XG59XG4qL1xuXG5mdW5jdGlvbiBwcmVwYXJlRm9yTW9kZGluZyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCkge1xuICBjb25zdCBnYW1lTmFtZSA9IHV0aWwuZ2V0R2FtZShHQU1FX0lEKT8ubmFtZSB8fCAnVGhpcyBnYW1lJztcblxuICAvLyB0aGUgZ2FtZSBkb2Vzbid0IGFjdHVhbGx5IGV4aXN0IG9uIHRoZSBlcGljIGdhbWUgc3RvcmUsIHRoaXMgY2h1bmsgaXMgY29weSZwYXN0ZWQsIGRvZXNuJ3QgaHVydFxuICAvLyBrZWVwaW5nIGl0IGlkZW50aWNhbFxuICBpZiAoZGlzY292ZXJ5LnN0b3JlICYmIFsnZXBpYycsICd4Ym94J10uaW5jbHVkZXMoZGlzY292ZXJ5LnN0b3JlKSkge1xuICAgIGNvbnN0IHN0b3JlTmFtZSA9IGRpc2NvdmVyeS5zdG9yZSA9PT0gJ2VwaWMnID8gJ0VwaWMgR2FtZXMnIDogJ1hib3ggR2FtZSBQYXNzJztcbiAgICAvLyBJZiB0aGlzIGlzIGFuIEVwaWMgb3IgWGJveCBnYW1lIHdlJ3ZlIGRlZmF1bHRlZCB0byBFbmdsaXNoLCBzbyB3ZSBzaG91bGQgbGV0IHRoZSB1c2VyIGtub3cuXG4gICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgICAgaWQ6IGAke0dBTUVfSUR9LWxvY2FsZS1tZXNzYWdlYCxcbiAgICAgIHR5cGU6ICdpbmZvJyxcbiAgICAgIHRpdGxlOiAnTXVsdGlwbGUgTGFuZ3VhZ2VzIEF2YWlsYWJsZScsXG4gICAgICBtZXNzYWdlOiAnRGVmYXVsdDogRW5nbGlzaCcsXG4gICAgICBhbGxvd1N1cHByZXNzOiB0cnVlLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICB7XG4gICAgICAgICAgdGl0bGU6ICdNb3JlJyxcbiAgICAgICAgICBhY3Rpb246IChkaXNtaXNzKSA9PiB7XG4gICAgICAgICAgICBkaXNtaXNzKCk7XG4gICAgICAgICAgICBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdNdXRsaXBsZSBMYW5ndWFnZXMgQXZhaWxhYmxlJywge1xuICAgICAgICAgICAgICBiYmNvZGU6ICd7e2dhbWVOYW1lfX0gaGFzIG11bHRpcGxlIGxhbmd1YWdlIG9wdGlvbnMgd2hlbiBkb3dubG9hZGVkIGZyb20ge3tzdG9yZU5hbWV9fS4gW2JyXVsvYnJdW2JyXVsvYnJdJytcbiAgICAgICAgICAgICAgICAnVm9ydGV4IGhhcyBzZWxlY3RlZCB0aGUgRW5nbGlzaCB2YXJpYW50IGJ5IGRlZmF1bHQuIFticl1bL2JyXVticl1bL2JyXScrXG4gICAgICAgICAgICAgICAgJ0lmIHlvdSB3b3VsZCBwcmVmZXIgdG8gbWFuYWdlIGEgZGlmZmVyZW50IGxhbmd1YWdlIHlvdSBjYW4gY2hhbmdlIHRoZSBwYXRoIHRvIHRoZSBnYW1lIHVzaW5nIHRoZSBcIk1hbnVhbGx5IFNldCBMb2NhdGlvblwiIG9wdGlvbiBpbiB0aGUgZ2FtZXMgdGFiLicsXG4gICAgICAgICAgICAgIHBhcmFtZXRlcnM6IHsgZ2FtZU5hbWUsIHN0b3JlTmFtZSB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICB7IGxhYmVsOiAnQ2xvc2UnLCBhY3Rpb246ICgpID0+IGFwaS5zdXBwcmVzc05vdGlmaWNhdGlvbihgJHtHQU1FX0lEfS1sb2NhbGUtbWVzc2FnZWApIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICBdXG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xufVxuXG5mdW5jdGlvbiBDb2xsZWN0aW9uRGF0YVdyYXAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcm9wczogSUV4dGVuZGVkSW50ZXJmYWNlUHJvcHMpOiBKU1guRWxlbWVudCB7XG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KE1vcnJvd2luZENvbGxlY3Rpb25zRGF0YVZpZXcsIHsgLi4ucHJvcHMsIGFwaSwgfSk7XG59XG5cbmZ1bmN0aW9uIG1haW4oY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcbiAgY29udGV4dC5yZWdpc3RlckdhbWUoe1xuICAgIGlkOiBNT1JST1dJTkRfSUQsXG4gICAgbmFtZTogJ01vcnJvd2luZCcsXG4gICAgbWVyZ2VNb2RzOiB0cnVlLFxuICAgIHF1ZXJ5UGF0aDogdXRpbC50b0JsdWUoZmluZEdhbWUpLFxuICAgIHN1cHBvcnRlZFRvb2xzOiB0b29scyxcbiAgICBzZXR1cDogdXRpbC50b0JsdWUoKGRpc2NvdmVyeSkgPT4gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dC5hcGksIGRpc2NvdmVyeSkpLFxuICAgIHF1ZXJ5TW9kUGF0aDogKCkgPT4gJ0RhdGEgRmlsZXMnLFxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ21vcnJvd2luZC5leGUnLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtcbiAgICAgICdtb3Jyb3dpbmQuZXhlJyxcbiAgICBdLFxuICAgIC8vIHJlcXVpcmVzTGF1bmNoZXIsXG4gICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgIFN0ZWFtQVBQSWQ6IFNURUFNQVBQX0lELFxuICAgIH0sXG4gICAgZGV0YWlsczoge1xuICAgICAgc3RlYW1BcHBJZDogcGFyc2VJbnQoU1RFQU1BUFBfSUQsIDEwKSxcbiAgICAgIGdvZ0FwcElkOiBHT0dfSURcbiAgICB9LFxuICB9KTtcblxuICBjb250ZXh0LnJlZ2lzdGVyTG9hZE9yZGVyKHtcbiAgICBnYW1lSWQ6IE1PUlJPV0lORF9JRCxcbiAgICBkZXNlcmlhbGl6ZUxvYWRPcmRlcjogKCkgPT4gZGVzZXJpYWxpemVMb2FkT3JkZXIoY29udGV4dC5hcGkpLFxuICAgIHNlcmlhbGl6ZUxvYWRPcmRlcjogKGxvYWRPcmRlcikgPT4gc2VyaWFsaXplTG9hZE9yZGVyKGNvbnRleHQuYXBpLCBsb2FkT3JkZXIpLFxuICAgIHZhbGlkYXRlLFxuICAgIG5vQ29sbGVjdGlvbkdlbmVyYXRpb246IHRydWUsXG4gICAgdG9nZ2xlYWJsZUVudHJpZXM6IHRydWUsXG4gICAgdXNhZ2VJbnN0cnVjdGlvbnM6ICdEcmFnIHlvdXIgcGx1Z2lucyBhcyBuZWVkZWQgLSB0aGUgZ2FtZSB3aWxsIGxvYWQgJ1xuICAgICAgKyAnbG9hZCB0aGVtIGZyb20gdG9wIHRvIGJvdHRvbS4nLFxuICB9KTtcblxuICBjb250ZXh0Lm9wdGlvbmFsLnJlZ2lzdGVyQ29sbGVjdGlvbkZlYXR1cmUoXG4gICAgJ21vcnJvd2luZF9jb2xsZWN0aW9uX2RhdGEnLFxuICAgIChnYW1lSWQsIGluY2x1ZGVkTW9kcywgY29sbGVjdGlvbikgPT5cbiAgICAgIGdlbkNvbGxlY3Rpb25zRGF0YShjb250ZXh0LCBnYW1lSWQsIGluY2x1ZGVkTW9kcywgY29sbGVjdGlvbiksXG4gICAgKGdhbWVJZCwgY29sbGVjdGlvbikgPT5cbiAgICAgIHBhcnNlQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQsIGdhbWVJZCwgY29sbGVjdGlvbiksXG4gICAgKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCksXG4gICAgKHQpID0+IHQoJ0xvYWQgT3JkZXInKSxcbiAgICAoc3RhdGUsIGdhbWVJZCkgPT4gZ2FtZUlkID09PSBNT1JST1dJTkRfSUQsXG4gICAgKHByb3BzOiBJRXh0ZW5kZWRJbnRlcmZhY2VQcm9wcykgPT4gQ29sbGVjdGlvbkRhdGFXcmFwKGNvbnRleHQuYXBpLCBwcm9wcykpO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJNaWdyYXRpb24ob2xkID0+IG1pZ3JhdGUxMDMoY29udGV4dC5hcGksIG9sZCkpO1xuICBjb250ZXh0Lm9uY2UoKCkgPT4ge1xuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignZGlkLWluc3RhbGwtbW9kJywgYXN5bmMgKGdhbWVJZCwgYXJjaGl2ZUlkLCBtb2RJZCkgPT4ge1xuICAgICAgaWYgKGdhbWVJZCAhPT0gTU9SUk9XSU5EX0lEKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xuICAgICAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBNT1JST1dJTkRfSUQpO1xuICAgICAgY29uc3QgbW9kID0gc3RhdGU/LnBlcnNpc3RlbnQ/Lm1vZHM/LltNT1JST1dJTkRfSURdPy5bbW9kSWRdO1xuICAgICAgaWYgKGluc3RhbGxQYXRoID09PSB1bmRlZmluZWQgfHwgbW9kID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgbW9kUGF0aCA9IHBhdGguam9pbihpbnN0YWxsUGF0aCwgbW9kLmluc3RhbGxhdGlvblBhdGgpO1xuICAgICAgY29uc3QgcGx1Z2lucyA9IFtdO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgd2Fsayhtb2RQYXRoLCBlbnRyaWVzID0+IHtcbiAgICAgICAgICBmb3IgKGxldCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgICAgICAgICBpZiAoWycuZXNwJywgJy5lc20nXS5pbmNsdWRlcyhwYXRoLmV4dG5hbWUoZW50cnkuZmlsZVBhdGgudG9Mb3dlckNhc2UoKSkpKSB7XG4gICAgICAgICAgICAgIHBsdWdpbnMucHVzaChwYXRoLmJhc2VuYW1lKGVudHJ5LmZpbGVQYXRoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LCB7IHJlY3Vyc2U6IHRydWUsIHNraXBMaW5rczogdHJ1ZSwgc2tpcEluYWNjZXNzaWJsZTogdHJ1ZSB9KTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIGxpc3Qgb2YgcGx1Z2lucycsIGVyciwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XG4gICAgICB9XG4gICAgICBpZiAoIHBsdWdpbnMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShNT1JST1dJTkRfSUQsIG1vZC5pZCwgJ3BsdWdpbnMnLCBwbHVnaW5zKSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiB0cnVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZGVmYXVsdDogbWFpblxufTtcbiJdfQ==