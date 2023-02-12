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
const react_redux_1 = require("react-redux");
const vortex_api_1 = require("vortex-api");
const React = __importStar(require("react"));
const actions_1 = require("./actions");
const reducers_1 = require("./reducers");
const common_1 = require("./common");
const loadOrder_1 = require("./loadOrder");
const migrations_1 = require("./migrations");
const util_1 = require("./util");
const STEAM_ID = '251570';
const STEAM_DLL = 'steamclient64.dll';
const ROOT_MOD_CANDIDATES = ['bepinex'];
function resetPrefixOffset(api) {
    const state = api.getState();
    const profileId = vortex_api_1.selectors.activeProfile(state)?.id;
    if (profileId === undefined) {
        api.showErrorNotification('No active profile for 7dtd', undefined, { allowReport: false });
        return;
    }
    api.store.dispatch((0, actions_1.setPrefixOffset)(profileId, 0));
    const loadOrder = api.getState()?.persistent?.loadOrder?.[profileId] ?? [];
    const newLO = loadOrder.map((entry, idx) => ({
        ...entry,
        data: {
            prefix: (0, util_1.makePrefix)(idx),
        },
    }));
    api.store.dispatch(vortex_api_1.actions.setLoadOrder(profileId, newLO));
}
function setPrefixOffsetDialog(api) {
    return api.showDialog('question', 'Set New Prefix Offset', {
        text: api.translate('Insert new prefix offset for modlets (AAA-ZZZ):'),
        input: [
            {
                id: '7dtdprefixoffsetinput',
                label: 'Prefix Offset',
                type: 'text',
                placeholder: 'AAA',
            }
        ],
    }, [{ label: 'Cancel' }, { label: 'Set', default: true }])
        .then(result => {
        if (result.action === 'Set') {
            const prefix = result.input['7dtdprefixoffsetinput'];
            let offset = 0;
            try {
                offset = (0, util_1.reversePrefix)(prefix);
            }
            catch (err) {
                return Promise.reject(err);
            }
            const state = api.getState();
            const profileId = vortex_api_1.selectors.activeProfile(state)?.id;
            if (profileId === undefined) {
                api.showErrorNotification('No active profile for 7dtd', undefined, { allowReport: false });
                return;
            }
            api.store.dispatch((0, actions_1.setPrefixOffset)(profileId, offset));
            const loadOrder = api.getState()?.persistent?.loadOrder?.[profileId] ?? [];
            const newLO = loadOrder.map(entry => ({
                ...entry,
                data: {
                    prefix: (0, util_1.makePrefix)((0, util_1.reversePrefix)(entry.data.prefix) + offset),
                },
            }));
            api.store.dispatch(vortex_api_1.actions.setLoadOrder(profileId, newLO));
        }
        return Promise.resolve();
    })
        .catch(err => {
        api.showErrorNotification('Failed to set prefix offset', err, { allowReport: false });
        return Promise.resolve();
    });
}
async function findGame() {
    return vortex_api_1.util.GameStoreHelper.findByAppId([STEAM_ID])
        .then(game => game.gamePath);
}
function parseAdditionalParameters(parameters) {
    const udfParam = parameters.split('-').find(param => param.startsWith('UserDataFolder='));
    const udf = udfParam ? udfParam.split('=')?.[1]?.trimEnd() : undefined;
    return (udf && path_1.default.isAbsolute(udf)) ? udf : undefined;
}
async function prepareForModding(context, discovery) {
    const requiresRestart = context.api.getState()?.settings?.['7daystodie']?.udf === undefined;
    const launcherSettings = (0, common_1.launcherSettingsFilePath)();
    const relaunchExt = () => {
        return context.api.showDialog('info', 'Restart Required', {
            text: 'The extension requires a restart to complete the UDF setup. '
                + 'The extension will now exit - please re-activate it via the games page or dashboard.',
        }, [{ label: 'Restart Extension' }])
            .then(() => {
            return Promise.reject(new vortex_api_1.util.ProcessCanceled('Restart required'));
        });
    };
    const selectUDF = async () => {
        const res = await context.api.showDialog('info', 'Choose User Defined Folder', {
            text: 'The modding pattern for 7DTD is changing. The Mods path inside the game directory '
                + 'is being deprecated and mods located in the old path will no longer work in the near '
                + 'future. Please select your User Defined Folder (UDF) - Vortex will deploy to this new location.',
        }, [
            { label: 'Cancel' },
            { label: 'Select UDF' },
        ]);
        if (res.action !== 'Select UDF') {
            return Promise.reject(new vortex_api_1.util.ProcessCanceled('Cannot proceed without UFD'));
        }
        await vortex_api_1.fs.ensureDirWritableAsync(path_1.default.dirname(launcherSettings));
        await (0, util_1.ensureLOFile)(context);
        const directory = await context.api.selectDir({
            title: 'Select User Data Folder',
            defaultPath: path_1.default.join(path_1.default.dirname(launcherSettings)),
        });
        if (!directory) {
            return Promise.reject(new vortex_api_1.util.ProcessCanceled('Cannot proceed without UFD'));
        }
        await vortex_api_1.fs.ensureDirWritableAsync(path_1.default.join(directory, 'Mods'));
        const launcher = common_1.DEFAULT_LAUNCHER_SETTINGS;
        launcher.DefaultRunConfig.AdditionalParameters = `-UserDataFolder=${directory}`;
        const launcherData = JSON.stringify(launcher, null, 2);
        await vortex_api_1.fs.writeFileAsync(launcherSettings, launcherData, { encoding: 'utf8' });
        context.api.store.dispatch((0, actions_1.setUDF)(directory));
        return (requiresRestart) ? relaunchExt() : Promise.resolve();
    };
    try {
        const data = await vortex_api_1.fs.readFileAsync(launcherSettings, { encoding: 'utf8' });
        const settings = JSON.parse(data);
        if (settings?.DefaultRunConfig?.AdditionalParameters !== undefined) {
            const udf = parseAdditionalParameters(settings.DefaultRunConfig.AdditionalParameters);
            if (!!udf) {
                await vortex_api_1.fs.ensureDirWritableAsync(path_1.default.join(udf, 'Mods'));
                await (0, util_1.ensureLOFile)(context);
                context.api.store.dispatch((0, actions_1.setUDF)(udf));
                return (requiresRestart) ? relaunchExt() : Promise.resolve();
            }
            else {
                return selectUDF();
            }
        }
    }
    catch (err) {
        return selectUDF();
    }
}
async function installContent(files, destinationPath, gameId) {
    const modFile = files.find(file => path_1.default.basename(file).toLowerCase() === common_1.MOD_INFO);
    const rootPath = path_1.default.dirname(modFile);
    return (0, util_1.getModName)(path_1.default.join(destinationPath, modFile))
        .then(modName => {
        modName = modName.replace(/[^a-zA-Z0-9]/g, '');
        const filtered = files.filter(filePath => filePath.startsWith(rootPath) && !filePath.endsWith(path_1.default.sep));
        const instructions = filtered.map(filePath => {
            return {
                type: 'copy',
                source: filePath,
                destination: path_1.default.relative(rootPath, filePath),
            };
        });
        return Promise.resolve({ instructions });
    });
}
function testSupportedContent(files, gameId) {
    const supported = (gameId === common_1.GAME_ID) &&
        (files.find(file => path_1.default.basename(file).toLowerCase() === common_1.MOD_INFO) !== undefined);
    return Promise.resolve({
        supported,
        requiredFiles: [],
    });
}
function findCandFile(files) {
    return files.find(file => file.toLowerCase().split(path_1.default.sep)
        .find(seg => ROOT_MOD_CANDIDATES.includes(seg)) !== undefined);
}
function hasCandidate(files) {
    const candidate = findCandFile(files);
    return candidate !== undefined;
}
async function installRootMod(files, gameId) {
    const filtered = files.filter(file => !file.endsWith(path_1.default.sep));
    const candidate = findCandFile(files);
    const candIdx = candidate.toLowerCase().split(path_1.default.sep)
        .findIndex(seg => ROOT_MOD_CANDIDATES.includes(seg));
    const instructions = filtered.reduce((accum, iter) => {
        accum.push({
            type: 'copy',
            source: iter,
            destination: iter.split(path_1.default.sep).slice(candIdx).join(path_1.default.sep),
        });
        return accum;
    }, []);
    return Promise.resolve({ instructions });
}
async function testRootMod(files, gameId) {
    return Promise.resolve({
        requiredFiles: [],
        supported: hasCandidate(files) && gameId === common_1.GAME_ID,
    });
}
function toLOPrefix(context, mod) {
    const props = (0, util_1.genProps)(context);
    if (props === undefined) {
        return 'ZZZZ-' + mod.id;
    }
    const loadOrder = props.state?.persistent?.loadOrder?.[props.profile.id] ?? [];
    let loEntry = loadOrder.find(loEntry => loEntry.id === mod.id);
    if (loEntry === undefined) {
        const prev = props.state?.settings?.['7daystodie']?.previousLO?.[props.profile.id] ?? [];
        loEntry = prev.find(loEntry => loEntry.id === mod.id);
    }
    return (loEntry?.data?.prefix !== undefined)
        ? loEntry.data.prefix + '-' + mod.id
        : 'ZZZZ-' + mod.id;
}
function requiresLauncher(gamePath) {
    return vortex_api_1.fs.readdirAsync(gamePath)
        .then(files => (files.find(file => file.endsWith(STEAM_DLL)) !== undefined)
        ? Promise.resolve({ launcher: 'steam' })
        : Promise.resolve(undefined))
        .catch(err => Promise.reject(err));
}
function InfoPanel(props) {
    const { t, currentOffset } = props;
    return (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', padding: '16px' } },
        React.createElement("div", { style: { display: 'flex', whiteSpace: 'nowrap', alignItems: 'center' } },
            t('Current Prefix Offset: '),
            React.createElement("hr", null),
            React.createElement("label", { style: { color: 'red' } }, currentOffset)),
        React.createElement("hr", null),
        React.createElement("div", null, t('7 Days to Die loads mods in alphabetic order so Vortex prefixes '
            + 'the directory names with "AAA, AAB, AAC, ..." to ensure they load in the order you set here.'))));
}
function InfoPanelWrap(props) {
    const { api, profileId } = props;
    const currentOffset = (0, react_redux_1.useSelector)((state) => (0, util_1.makePrefix)(state?.settings?.['7daystodie']?.prefixOffset?.[profileId] ?? 0));
    return (React.createElement(InfoPanel, { t: api.translate, currentOffset: currentOffset }));
}
function main(context) {
    context.registerReducer(['settings', '7daystodie'], reducers_1.reducer);
    const getModsPath = () => {
        const state = context.api.getState();
        const udf = state?.settings?.['7daystodie']?.udf;
        return udf !== undefined ? path_1.default.join(udf, 'Mods') : 'Mods';
    };
    context.registerGame({
        id: common_1.GAME_ID,
        name: '7 Days to Die',
        mergeMods: (mod) => toLOPrefix(context, mod),
        queryPath: (0, util_1.toBlue)(findGame),
        supportedTools: [],
        queryModPath: getModsPath,
        logo: 'gameart.jpg',
        executable: common_1.gameExecutable,
        requiredFiles: [
            (0, common_1.gameExecutable)(),
        ],
        requiresLauncher,
        setup: (0, util_1.toBlue)((discovery) => prepareForModding(context, discovery)),
        environment: {
            SteamAPPId: STEAM_ID,
        },
        details: {
            steamAppId: +STEAM_ID,
            hashFiles: ['7DaysToDie_Data/Managed/Assembly-CSharp.dll'],
        },
    });
    context.registerLoadOrder({
        deserializeLoadOrder: () => (0, loadOrder_1.deserialize)(context),
        serializeLoadOrder: ((loadOrder, prev) => (0, loadOrder_1.serialize)(context, loadOrder, prev)),
        validate: loadOrder_1.validate,
        gameId: common_1.GAME_ID,
        toggleableEntries: false,
        usageInstructions: (() => {
            const state = context.api.getState();
            const profileId = vortex_api_1.selectors.activeProfile(state)?.id;
            if (profileId === undefined) {
                return null;
            }
            return (React.createElement(InfoPanelWrap, { api: context.api, profileId: profileId }));
        }),
    });
    context.registerAction('fb-load-order-icons', 150, 'loot-sort', {}, 'Prefix Offset Assign', () => {
        setPrefixOffsetDialog(context.api);
    }, () => {
        const state = context.api.getState();
        const activeGame = vortex_api_1.selectors.activeGameId(state);
        return activeGame === common_1.GAME_ID;
    });
    context.registerAction('fb-load-order-icons', 150, 'loot-sort', {}, 'Prefix Offset Reset', () => {
        resetPrefixOffset(context.api);
    }, () => {
        const state = context.api.getState();
        const activeGame = vortex_api_1.selectors.activeGameId(state);
        return activeGame === common_1.GAME_ID;
    });
    const getOverhaulPath = (game) => {
        const state = context.api.getState();
        const discovery = vortex_api_1.selectors.discoveryByGame(state, common_1.GAME_ID);
        return discovery?.path;
    };
    context.registerInstaller('7dtd-mod', 25, (0, util_1.toBlue)(testSupportedContent), (0, util_1.toBlue)(installContent));
    context.registerInstaller('7dtd-root-mod', 20, (0, util_1.toBlue)(testRootMod), (0, util_1.toBlue)(installRootMod));
    context.registerModType('7dtd-root-mod', 20, (gameId) => gameId === common_1.GAME_ID, getOverhaulPath, (instructions) => {
        const candidateFound = hasCandidate(instructions
            .filter(instr => !!instr.destination)
            .map(instr => instr.destination));
        return Promise.resolve(candidateFound);
    }, { name: 'Root Directory Mod', mergeMods: true, deploymentEssential: false });
    context.registerMigration((0, util_1.toBlue)(old => (0, migrations_1.migrate020)(context.api, old)));
    context.registerMigration((0, util_1.toBlue)(old => (0, migrations_1.migrate100)(context, old)));
    context.registerMigration((0, util_1.toBlue)(old => (0, migrations_1.migrate1011)(context, old)));
    return true;
}
module.exports = {
    default: main,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGdEQUF3QjtBQUN4Qiw2Q0FBMEM7QUFDMUMsMkNBQWlFO0FBRWpFLDZDQUErQjtBQUUvQix1Q0FBb0Q7QUFDcEQseUNBQXFDO0FBRXJDLHFDQUFrSDtBQUNsSCwyQ0FBK0Q7QUFDL0QsNkNBQW1FO0FBRW5FLGlDQUErRjtBQUUvRixNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUM7QUFDMUIsTUFBTSxTQUFTLEdBQUcsbUJBQW1CLENBQUM7QUFFdEMsTUFBTSxtQkFBbUIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBRXhDLFNBQVMsaUJBQWlCLENBQUMsR0FBd0I7SUFDakQsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzdCLE1BQU0sU0FBUyxHQUFHLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQztJQUNyRCxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7UUFFM0IsR0FBRyxDQUFDLHFCQUFxQixDQUFDLDRCQUE0QixFQUFFLFNBQVMsRUFBRSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQzNGLE9BQU87S0FDUjtJQUVELEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUEseUJBQWUsRUFBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsRCxNQUFNLFNBQVMsR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUMzRSxNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUMzQyxHQUFH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RUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkUsT0FBTyxDQUFDLGlCQUFpQixDQUFDLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBQSx3QkFBVyxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFcEUsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRztJQUNmLE9BQU8sRUFBRSxJQUFJO0NBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgdXNlU2VsZWN0b3IgfSBmcm9tICdyZWFjdC1yZWR1eCc7XG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5cbmltcG9ydCB7IHNldFByZWZpeE9mZnNldCwgc2V0VURGIH0gZnJvbSAnLi9hY3Rpb25zJztcbmltcG9ydCB7IHJlZHVjZXIgfSBmcm9tICcuL3JlZHVjZXJzJztcblxuaW1wb3J0IHsgR0FNRV9JRCwgZ2FtZUV4ZWN1dGFibGUsIE1PRF9JTkZPLCBsYXVuY2hlclNldHRpbmdzRmlsZVBhdGgsIERFRkFVTFRfTEFVTkNIRVJfU0VUVElOR1MgfSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQgeyBkZXNlcmlhbGl6ZSwgc2VyaWFsaXplLCB2YWxpZGF0ZSB9IGZyb20gJy4vbG9hZE9yZGVyJztcbmltcG9ydCB7IG1pZ3JhdGUwMjAsIG1pZ3JhdGUxMDAsIG1pZ3JhdGUxMDExIH0gZnJvbSAnLi9taWdyYXRpb25zJztcbmltcG9ydCB7IElMb2FkT3JkZXJFbnRyeSwgSVByb3BzIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBlbnN1cmVMT0ZpbGUsIGdlblByb3BzLCBnZXRNb2ROYW1lLCBtYWtlUHJlZml4LCByZXZlcnNlUHJlZml4LCB0b0JsdWUgfSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCBTVEVBTV9JRCA9ICcyNTE1NzAnO1xuY29uc3QgU1RFQU1fRExMID0gJ3N0ZWFtY2xpZW50NjQuZGxsJztcblxuY29uc3QgUk9PVF9NT0RfQ0FORElEQVRFUyA9IFsnYmVwaW5leCddO1xuXG5mdW5jdGlvbiByZXNldFByZWZpeE9mZnNldChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpPy5pZDtcbiAgaWYgKHByb2ZpbGVJZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gSG93ID9cbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdObyBhY3RpdmUgcHJvZmlsZSBmb3IgN2R0ZCcsIHVuZGVmaW5lZCwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgYXBpLnN0b3JlLmRpc3BhdGNoKHNldFByZWZpeE9mZnNldChwcm9maWxlSWQsIDApKTtcbiAgY29uc3QgbG9hZE9yZGVyID0gYXBpLmdldFN0YXRlKCk/LnBlcnNpc3RlbnQ/LmxvYWRPcmRlcj8uW3Byb2ZpbGVJZF0gPz8gW107XG4gIGNvbnN0IG5ld0xPID0gbG9hZE9yZGVyLm1hcCgoZW50cnksIGlkeCkgPT4gKHtcbiAgICAuLi5lbnRyeSxcbiAgICBkYXRhOiB7XG4gICAgICBwcmVmaXg6IG1ha2VQcmVmaXgoaWR4KSxcbiAgICB9LFxuICB9KSk7XG4gIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlcihwcm9maWxlSWQsIG5ld0xPKSk7XG59XG5cbmZ1bmN0aW9uIHNldFByZWZpeE9mZnNldERpYWxvZyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgcmV0dXJuIGFwaS5zaG93RGlhbG9nKCdxdWVzdGlvbicsICdTZXQgTmV3IFByZWZpeCBPZmZzZXQnLCB7XG4gICAgdGV4dDogYXBpLnRyYW5zbGF0ZSgnSW5zZXJ0IG5ldyBwcmVmaXggb2Zmc2V0IGZvciBtb2RsZXRzIChBQUEtWlpaKTonKSxcbiAgICBpbnB1dDogW1xuICAgICAge1xuICAgICAgICBpZDogJzdkdGRwcmVmaXhvZmZzZXRpbnB1dCcsXG4gICAgICAgIGxhYmVsOiAnUHJlZml4IE9mZnNldCcsXG4gICAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgICAgcGxhY2Vob2xkZXI6ICdBQUEnLFxuICAgICAgfV0sXG4gIH0sIFsgeyBsYWJlbDogJ0NhbmNlbCcgfSwgeyBsYWJlbDogJ1NldCcsIGRlZmF1bHQ6IHRydWUgfSBdKVxuICAudGhlbihyZXN1bHQgPT4ge1xuICAgIGlmIChyZXN1bHQuYWN0aW9uID09PSAnU2V0Jykge1xuICAgICAgY29uc3QgcHJlZml4ID0gcmVzdWx0LmlucHV0Wyc3ZHRkcHJlZml4b2Zmc2V0aW5wdXQnXTtcbiAgICAgIGxldCBvZmZzZXQgPSAwO1xuICAgICAgdHJ5IHtcbiAgICAgICAgb2Zmc2V0ID0gcmV2ZXJzZVByZWZpeChwcmVmaXgpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgICAgfVxuICAgICAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgICAgIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKT8uaWQ7XG4gICAgICBpZiAocHJvZmlsZUlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gSG93ID9cbiAgICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignTm8gYWN0aXZlIHByb2ZpbGUgZm9yIDdkdGQnLCB1bmRlZmluZWQsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChzZXRQcmVmaXhPZmZzZXQocHJvZmlsZUlkLCBvZmZzZXQpKTtcbiAgICAgIGNvbnN0IGxvYWRPcmRlciA9IGFwaS5nZXRTdGF0ZSgpPy5wZXJzaXN0ZW50Py5sb2FkT3JkZXI/Lltwcm9maWxlSWRdID8/IFtdO1xuICAgICAgY29uc3QgbmV3TE8gPSBsb2FkT3JkZXIubWFwKGVudHJ5ID0+ICh7XG4gICAgICAgIC4uLmVudHJ5LFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgcHJlZml4OiBtYWtlUHJlZml4KHJldmVyc2VQcmVmaXgoZW50cnkuZGF0YS5wcmVmaXgpICsgb2Zmc2V0KSxcbiAgICAgICAgfSxcbiAgICAgIH0pKTtcbiAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlcihwcm9maWxlSWQsIG5ld0xPKSk7XG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfSlcbiAgLmNhdGNoKGVyciA9PiB7XG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHNldCBwcmVmaXggb2Zmc2V0JywgZXJyLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmaW5kR2FtZSgpIHtcbiAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFtTVEVBTV9JRF0pXG4gICAgLnRoZW4oZ2FtZSA9PiBnYW1lLmdhbWVQYXRoKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VBZGRpdGlvbmFsUGFyYW1ldGVycyhwYXJhbWV0ZXJzOiBzdHJpbmcpIHtcbiAgY29uc3QgdWRmUGFyYW0gPSBwYXJhbWV0ZXJzLnNwbGl0KCctJykuZmluZChwYXJhbSA9PiBwYXJhbS5zdGFydHNXaXRoKCdVc2VyRGF0YUZvbGRlcj0nKSk7XG4gIGNvbnN0IHVkZiA9IHVkZlBhcmFtID8gdWRmUGFyYW0uc3BsaXQoJz0nKT8uWzFdPy50cmltRW5kKCkgOiB1bmRlZmluZWQ7XG4gIHJldHVybiAodWRmICYmIHBhdGguaXNBYnNvbHV0ZSh1ZGYpKSA/IHVkZiA6IHVuZGVmaW5lZDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQpIHtcbiAgY29uc3QgcmVxdWlyZXNSZXN0YXJ0ID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKT8uc2V0dGluZ3M/LlsnN2RheXN0b2RpZSddPy51ZGYgPT09IHVuZGVmaW5lZDtcbiAgY29uc3QgbGF1bmNoZXJTZXR0aW5ncyA9IGxhdW5jaGVyU2V0dGluZ3NGaWxlUGF0aCgpO1xuICBjb25zdCByZWxhdW5jaEV4dCA9ICgpID0+IHtcbiAgICByZXR1cm4gY29udGV4dC5hcGkuc2hvd0RpYWxvZygnaW5mbycsICdSZXN0YXJ0IFJlcXVpcmVkJywge1xuICAgICAgdGV4dDogJ1RoZSBleHRlbnNpb24gcmVxdWlyZXMgYSByZXN0YXJ0IHRvIGNvbXBsZXRlIHRoZSBVREYgc2V0dXAuICdcbiAgICAgICAgICArICdUaGUgZXh0ZW5zaW9uIHdpbGwgbm93IGV4aXQgLSBwbGVhc2UgcmUtYWN0aXZhdGUgaXQgdmlhIHRoZSBnYW1lcyBwYWdlIG9yIGRhc2hib2FyZC4nLFxuICAgIH0sIFsgeyBsYWJlbDogJ1Jlc3RhcnQgRXh0ZW5zaW9uJyB9IF0pXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnUmVzdGFydCByZXF1aXJlZCcpKTtcbiAgICB9KTtcbiAgfVxuICBjb25zdCBzZWxlY3RVREYgPSBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgY29udGV4dC5hcGkuc2hvd0RpYWxvZygnaW5mbycsICdDaG9vc2UgVXNlciBEZWZpbmVkIEZvbGRlcicsIHtcbiAgICAgIHRleHQ6ICdUaGUgbW9kZGluZyBwYXR0ZXJuIGZvciA3RFREIGlzIGNoYW5naW5nLiBUaGUgTW9kcyBwYXRoIGluc2lkZSB0aGUgZ2FtZSBkaXJlY3RvcnkgJ1xuICAgICAgICAgICsgJ2lzIGJlaW5nIGRlcHJlY2F0ZWQgYW5kIG1vZHMgbG9jYXRlZCBpbiB0aGUgb2xkIHBhdGggd2lsbCBubyBsb25nZXIgd29yayBpbiB0aGUgbmVhciAnXG4gICAgICAgICAgKyAnZnV0dXJlLiBQbGVhc2Ugc2VsZWN0IHlvdXIgVXNlciBEZWZpbmVkIEZvbGRlciAoVURGKSAtIFZvcnRleCB3aWxsIGRlcGxveSB0byB0aGlzIG5ldyBsb2NhdGlvbi4nLFxuICAgIH0sXG4gICAgW1xuICAgICAgeyBsYWJlbDogJ0NhbmNlbCcgfSxcbiAgICAgIHsgbGFiZWw6ICdTZWxlY3QgVURGJyB9LFxuICAgIF0pO1xuICAgIGlmIChyZXMuYWN0aW9uICE9PSAnU2VsZWN0IFVERicpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0Nhbm5vdCBwcm9jZWVkIHdpdGhvdXQgVUZEJykpO1xuICAgIH1cbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShsYXVuY2hlclNldHRpbmdzKSk7XG4gICAgYXdhaXQgZW5zdXJlTE9GaWxlKGNvbnRleHQpO1xuICAgIGNvbnN0IGRpcmVjdG9yeSA9IGF3YWl0IGNvbnRleHQuYXBpLnNlbGVjdERpcih7XG4gICAgICB0aXRsZTogJ1NlbGVjdCBVc2VyIERhdGEgRm9sZGVyJyxcbiAgICAgIGRlZmF1bHRQYXRoOiBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKGxhdW5jaGVyU2V0dGluZ3MpKSxcbiAgICB9KTtcbiAgICBpZiAoIWRpcmVjdG9yeSkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnQ2Fubm90IHByb2NlZWQgd2l0aG91dCBVRkQnKSk7XG4gICAgfVxuICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5qb2luKGRpcmVjdG9yeSwgJ01vZHMnKSk7XG4gICAgY29uc3QgbGF1bmNoZXIgPSBERUZBVUxUX0xBVU5DSEVSX1NFVFRJTkdTO1xuICAgIGxhdW5jaGVyLkRlZmF1bHRSdW5Db25maWcuQWRkaXRpb25hbFBhcmFtZXRlcnMgPSBgLVVzZXJEYXRhRm9sZGVyPSR7ZGlyZWN0b3J5fWA7XG4gICAgY29uc3QgbGF1bmNoZXJEYXRhID0gSlNPTi5zdHJpbmdpZnkobGF1bmNoZXIsIG51bGwsIDIpO1xuICAgIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKGxhdW5jaGVyU2V0dGluZ3MsIGxhdW5jaGVyRGF0YSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKHNldFVERihkaXJlY3RvcnkpKTtcbiAgICByZXR1cm4gKHJlcXVpcmVzUmVzdGFydCkgPyByZWxhdW5jaEV4dCgpIDogUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH07XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhsYXVuY2hlclNldHRpbmdzLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgIGlmIChzZXR0aW5ncz8uRGVmYXVsdFJ1bkNvbmZpZz8uQWRkaXRpb25hbFBhcmFtZXRlcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgdWRmID0gcGFyc2VBZGRpdGlvbmFsUGFyYW1ldGVycyhzZXR0aW5ncy5EZWZhdWx0UnVuQ29uZmlnLkFkZGl0aW9uYWxQYXJhbWV0ZXJzKTtcbiAgICAgIGlmICghIXVkZikge1xuICAgICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguam9pbih1ZGYsICdNb2RzJykpO1xuICAgICAgICBhd2FpdCBlbnN1cmVMT0ZpbGUoY29udGV4dCk7XG4gICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKHNldFVERih1ZGYpKTtcbiAgICAgICAgcmV0dXJuIChyZXF1aXJlc1Jlc3RhcnQpID8gcmVsYXVuY2hFeHQoKSA6IFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHNlbGVjdFVERigpO1xuICAgICAgfVxuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIHNlbGVjdFVERigpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGxDb250ZW50KGZpbGVzOiBzdHJpbmdbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uUGF0aDogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkOiBzdHJpbmcpOiBQcm9taXNlPHR5cGVzLklJbnN0YWxsUmVzdWx0PiB7XG4gIC8vIFRoZSBtb2RpbmZvLnhtbCBmaWxlIGlzIGV4cGVjdGVkIHRvIGFsd2F5cyBiZSBwb3NpdGlvbmVkIGluIHRoZSByb290IGRpcmVjdG9yeVxuICAvLyAgb2YgdGhlIG1vZCBpdHNlbGY7IHdlJ3JlIGdvaW5nIHRvIGRpc3JlZ2FyZCBhbnl0aGluZyBwbGFjZWQgb3V0c2lkZSB0aGUgcm9vdC5cbiAgY29uc3QgbW9kRmlsZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IE1PRF9JTkZPKTtcbiAgY29uc3Qgcm9vdFBhdGggPSBwYXRoLmRpcm5hbWUobW9kRmlsZSk7XG4gIHJldHVybiBnZXRNb2ROYW1lKHBhdGguam9pbihkZXN0aW5hdGlvblBhdGgsIG1vZEZpbGUpKVxuICAgIC50aGVuKG1vZE5hbWUgPT4ge1xuICAgICAgbW9kTmFtZSA9IG1vZE5hbWUucmVwbGFjZSgvW15hLXpBLVowLTldL2csICcnKTtcblxuICAgICAgLy8gUmVtb3ZlIGRpcmVjdG9yaWVzIGFuZCBhbnl0aGluZyB0aGF0IGlzbid0IGluIHRoZSByb290UGF0aCAoYWxzbyBkaXJlY3RvcmllcykuXG4gICAgICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlUGF0aCA9PlxuICAgICAgICBmaWxlUGF0aC5zdGFydHNXaXRoKHJvb3RQYXRoKSAmJiAhZmlsZVBhdGguZW5kc1dpdGgocGF0aC5zZXApKTtcblxuICAgICAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IGZpbHRlcmVkLm1hcChmaWxlUGF0aCA9PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogJ2NvcHknLFxuICAgICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXG4gICAgICAgICAgZGVzdGluYXRpb246IHBhdGgucmVsYXRpdmUocm9vdFBhdGgsIGZpbGVQYXRoKSxcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiB0ZXN0U3VwcG9ydGVkQ29udGVudChmaWxlcywgZ2FtZUlkKSB7XG4gIC8vIE1ha2Ugc3VyZSB3ZSdyZSBhYmxlIHRvIHN1cHBvcnQgdGhpcyBtb2QuXG4gIGNvbnN0IHN1cHBvcnRlZCA9IChnYW1lSWQgPT09IEdBTUVfSUQpICYmXG4gICAgKGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IE1PRF9JTkZPKSAhPT0gdW5kZWZpbmVkKTtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgc3VwcG9ydGVkLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxuICB9KTtcbn1cblxuZnVuY3Rpb24gZmluZENhbmRGaWxlKGZpbGVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBmaWxlcy5maW5kKGZpbGUgPT4gZmlsZS50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKVxuICAgIC5maW5kKHNlZyA9PiBST09UX01PRF9DQU5ESURBVEVTLmluY2x1ZGVzKHNlZykpICE9PSB1bmRlZmluZWQpO1xufVxuXG5mdW5jdGlvbiBoYXNDYW5kaWRhdGUoZmlsZXM6IHN0cmluZ1tdKTogYm9vbGVhbiB7XG4gIGNvbnN0IGNhbmRpZGF0ZSA9IGZpbmRDYW5kRmlsZShmaWxlcyk7XG4gIHJldHVybiBjYW5kaWRhdGUgIT09IHVuZGVmaW5lZDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gaW5zdGFsbFJvb3RNb2QoZmlsZXM6IHN0cmluZ1tdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkOiBzdHJpbmcpOiBQcm9taXNlPHR5cGVzLklJbnN0YWxsUmVzdWx0PiB7XG4gIGNvbnN0IGZpbHRlcmVkID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4gIWZpbGUuZW5kc1dpdGgocGF0aC5zZXApKTtcbiAgY29uc3QgY2FuZGlkYXRlID0gZmluZENhbmRGaWxlKGZpbGVzKTtcbiAgY29uc3QgY2FuZElkeCA9IGNhbmRpZGF0ZS50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKVxuICAgIC5maW5kSW5kZXgoc2VnID0+IFJPT1RfTU9EX0NBTkRJREFURVMuaW5jbHVkZXMoc2VnKSk7XG4gIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPSBmaWx0ZXJlZC5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PiB7XG4gICAgYWNjdW0ucHVzaCh7XG4gICAgICB0eXBlOiAnY29weScsXG4gICAgICBzb3VyY2U6IGl0ZXIsXG4gICAgICBkZXN0aW5hdGlvbjogaXRlci5zcGxpdChwYXRoLnNlcCkuc2xpY2UoY2FuZElkeCkuam9pbihwYXRoLnNlcCksXG4gICAgfSk7XG4gICAgcmV0dXJuIGFjY3VtO1xuICB9LCBbXSk7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHRlc3RSb290TW9kKGZpbGVzOiBzdHJpbmdbXSwgZ2FtZUlkOiBzdHJpbmcpOiBQcm9taXNlPHR5cGVzLklTdXBwb3J0ZWRSZXN1bHQ+IHtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgcmVxdWlyZWRGaWxlczogW10sXG4gICAgc3VwcG9ydGVkOiBoYXNDYW5kaWRhdGUoZmlsZXMpICYmIGdhbWVJZCA9PT0gR0FNRV9JRCxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHRvTE9QcmVmaXgoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsIG1vZDogdHlwZXMuSU1vZCk6IHN0cmluZyB7XG4gIGNvbnN0IHByb3BzOiBJUHJvcHMgPSBnZW5Qcm9wcyhjb250ZXh0KTtcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gJ1paWlotJyArIG1vZC5pZDtcbiAgfVxuXG4gIC8vIFJldHJpZXZlIHRoZSBsb2FkIG9yZGVyIGFzIHN0b3JlZCBpbiBWb3J0ZXgncyBhcHBsaWNhdGlvbiBzdGF0ZS5cbiAgY29uc3QgbG9hZE9yZGVyID0gcHJvcHMuc3RhdGU/LnBlcnNpc3RlbnQ/LmxvYWRPcmRlcj8uW3Byb3BzLnByb2ZpbGUuaWRdID8/IFtdO1xuXG4gIC8vIEZpbmQgdGhlIG1vZCBlbnRyeSBpbiB0aGUgbG9hZCBvcmRlciBzdGF0ZSBhbmQgaW5zZXJ0IHRoZSBwcmVmaXggaW4gZnJvbnRcbiAgLy8gIG9mIHRoZSBtb2QncyBuYW1lL2lkL3doYXRldmVyXG4gIGxldCBsb0VudHJ5OiBJTG9hZE9yZGVyRW50cnkgPSBsb2FkT3JkZXIuZmluZChsb0VudHJ5ID0+IGxvRW50cnkuaWQgPT09IG1vZC5pZCk7XG4gIGlmIChsb0VudHJ5ID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBUaGUgbW9kIGVudHJ5IHdhc24ndCBmb3VuZCBpbiB0aGUgbG9hZCBvcmRlciBzdGF0ZSAtIHRoaXMgaXMgcG90ZW50aWFsbHlcbiAgICAvLyAgZHVlIHRvIHRoZSBtb2QgYmVpbmcgcmVtb3ZlZCBhcyBwYXJ0IG9mIGFuIHVwZGF0ZSBvciB1bmluc3RhbGxhdGlvbi5cbiAgICAvLyAgSXQncyBpbXBvcnRhbnQgd2UgZmluZCB0aGUgcHJlZml4IG9mIHRoZSBtb2QgaW4gdGhpcyBjYXNlLCBhcyB0aGUgZGVwbG95bWVudFxuICAgIC8vICBtZXRob2QgY291bGQgcG90ZW50aWFsbHkgZmFpbCB0byByZW1vdmUgdGhlIG1vZCEgV2UncmUgZ29pbmcgdG8gY2hlY2tcbiAgICAvLyAgdGhlIHByZXZpb3VzIGxvYWQgb3JkZXIgc2F2ZWQgZm9yIHRoaXMgcHJvZmlsZSBhbmQgdXNlIHRoYXQgaWYgaXQgZXhpc3RzLlxuICAgIGNvbnN0IHByZXYgPSBwcm9wcy5zdGF0ZT8uc2V0dGluZ3M/LlsnN2RheXN0b2RpZSddPy5wcmV2aW91c0xPPy5bcHJvcHMucHJvZmlsZS5pZF0gPz8gW107XG4gICAgbG9FbnRyeSA9IHByZXYuZmluZChsb0VudHJ5ID0+IGxvRW50cnkuaWQgPT09IG1vZC5pZCk7XG4gIH1cblxuICByZXR1cm4gKGxvRW50cnk/LmRhdGE/LnByZWZpeCAhPT0gdW5kZWZpbmVkKVxuICAgID8gbG9FbnRyeS5kYXRhLnByZWZpeCArICctJyArIG1vZC5pZFxuICAgIDogJ1paWlotJyArIG1vZC5pZDtcbn1cblxuZnVuY3Rpb24gcmVxdWlyZXNMYXVuY2hlcihnYW1lUGF0aCkge1xuICByZXR1cm4gZnMucmVhZGRpckFzeW5jKGdhbWVQYXRoKVxuICAgIC50aGVuKGZpbGVzID0+IChmaWxlcy5maW5kKGZpbGUgPT4gZmlsZS5lbmRzV2l0aChTVEVBTV9ETEwpKSAhPT0gdW5kZWZpbmVkKVxuICAgICAgPyBQcm9taXNlLnJlc29sdmUoeyBsYXVuY2hlcjogJ3N0ZWFtJyB9KVxuICAgICAgOiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKSlcbiAgICAuY2F0Y2goZXJyID0+IFByb21pc2UucmVqZWN0KGVycikpO1xufVxuXG5mdW5jdGlvbiBJbmZvUGFuZWwocHJvcHMpIHtcbiAgY29uc3QgeyB0LCBjdXJyZW50T2Zmc2V0IH0gPSBwcm9wcztcblxuICByZXR1cm4gKFxuICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJywgcGFkZGluZzogJzE2cHgnIH19PlxuICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIHdoaXRlU3BhY2U6ICdub3dyYXAnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJyB9fT5cbiAgICAgICAge3QoJ0N1cnJlbnQgUHJlZml4IE9mZnNldDogJyl9XG4gICAgICAgIDxoci8+XG4gICAgICAgIDxsYWJlbCBzdHlsZT17eyBjb2xvcjogJ3JlZCcgfX0+e2N1cnJlbnRPZmZzZXR9PC9sYWJlbD5cbiAgICAgIDwvZGl2PlxuICAgICAgPGhyLz5cbiAgICAgIDxkaXY+XG4gICAgICAgIHt0KCc3IERheXMgdG8gRGllIGxvYWRzIG1vZHMgaW4gYWxwaGFiZXRpYyBvcmRlciBzbyBWb3J0ZXggcHJlZml4ZXMgJ1xuICAgICAgICAgKyAndGhlIGRpcmVjdG9yeSBuYW1lcyB3aXRoIFwiQUFBLCBBQUIsIEFBQywgLi4uXCIgdG8gZW5zdXJlIHRoZXkgbG9hZCBpbiB0aGUgb3JkZXIgeW91IHNldCBoZXJlLicpfVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbmZ1bmN0aW9uIEluZm9QYW5lbFdyYXAocHJvcHM6IHsgYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcm9maWxlSWQ6IHN0cmluZyB9KSB7XG4gIGNvbnN0IHsgYXBpLCBwcm9maWxlSWQgfSA9IHByb3BzO1xuICBjb25zdCBjdXJyZW50T2Zmc2V0ID0gdXNlU2VsZWN0b3IoKHN0YXRlOiB0eXBlcy5JU3RhdGUpID0+XG4gICAgbWFrZVByZWZpeChzdGF0ZT8uc2V0dGluZ3M/LlsnN2RheXN0b2RpZSddPy5wcmVmaXhPZmZzZXQ/Lltwcm9maWxlSWRdID8/IDApKTtcblxuICByZXR1cm4gKFxuICAgIDxJbmZvUGFuZWxcbiAgICAgIHQ9e2FwaS50cmFuc2xhdGV9XG4gICAgICBjdXJyZW50T2Zmc2V0PXtjdXJyZW50T2Zmc2V0fVxuICAgIC8+XG4gICk7XG59XG5cbmZ1bmN0aW9uIG1haW4oY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcbiAgY29udGV4dC5yZWdpc3RlclJlZHVjZXIoWydzZXR0aW5ncycsICc3ZGF5c3RvZGllJ10sIHJlZHVjZXIpO1xuXG4gIGNvbnN0IGdldE1vZHNQYXRoID0gKCkgPT4ge1xuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCB1ZGYgPSBzdGF0ZT8uc2V0dGluZ3M/LlsnN2RheXN0b2RpZSddPy51ZGY7XG4gICAgcmV0dXJuIHVkZiAhPT0gdW5kZWZpbmVkID8gcGF0aC5qb2luKHVkZiwgJ01vZHMnKSA6ICdNb2RzJztcbiAgfVxuXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcbiAgICBpZDogR0FNRV9JRCxcbiAgICBuYW1lOiAnNyBEYXlzIHRvIERpZScsXG4gICAgbWVyZ2VNb2RzOiAobW9kKSA9PiB0b0xPUHJlZml4KGNvbnRleHQsIG1vZCksXG4gICAgcXVlcnlQYXRoOiB0b0JsdWUoZmluZEdhbWUpLFxuICAgIHN1cHBvcnRlZFRvb2xzOiBbXSxcbiAgICBxdWVyeU1vZFBhdGg6IGdldE1vZHNQYXRoLFxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXG4gICAgZXhlY3V0YWJsZTogZ2FtZUV4ZWN1dGFibGUsXG4gICAgcmVxdWlyZWRGaWxlczogW1xuICAgICAgZ2FtZUV4ZWN1dGFibGUoKSxcbiAgICBdLFxuICAgIHJlcXVpcmVzTGF1bmNoZXIsXG4gICAgc2V0dXA6IHRvQmx1ZSgoZGlzY292ZXJ5KSA9PiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LCBkaXNjb3ZlcnkpKSxcbiAgICBlbnZpcm9ubWVudDoge1xuICAgICAgU3RlYW1BUFBJZDogU1RFQU1fSUQsXG4gICAgfSxcbiAgICBkZXRhaWxzOiB7XG4gICAgICBzdGVhbUFwcElkOiArU1RFQU1fSUQsXG4gICAgICBoYXNoRmlsZXM6IFsnN0RheXNUb0RpZV9EYXRhL01hbmFnZWQvQXNzZW1ibHktQ1NoYXJwLmRsbCddLFxuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJMb2FkT3JkZXIoe1xuICAgIGRlc2VyaWFsaXplTG9hZE9yZGVyOiAoKSA9PiBkZXNlcmlhbGl6ZShjb250ZXh0KSxcbiAgICBzZXJpYWxpemVMb2FkT3JkZXI6ICgobG9hZE9yZGVyLCBwcmV2KSA9PiBzZXJpYWxpemUoY29udGV4dCwgbG9hZE9yZGVyLCBwcmV2KSkgYXMgYW55LFxuICAgIHZhbGlkYXRlLFxuICAgIGdhbWVJZDogR0FNRV9JRCxcbiAgICB0b2dnbGVhYmxlRW50cmllczogZmFsc2UsXG4gICAgdXNhZ2VJbnN0cnVjdGlvbnM6ICgoKSA9PiB7XG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XG4gICAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk/LmlkO1xuICAgICAgaWYgKHByb2ZpbGVJZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgcmV0dXJuIChcbiAgICAgICAgPEluZm9QYW5lbFdyYXAgYXBpPXtjb250ZXh0LmFwaX0gcHJvZmlsZUlkPXtwcm9maWxlSWR9IC8+XG4gICAgICApO1xuICAgIH0pIGFzIGFueSxcbiAgfSk7XG5cbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignZmItbG9hZC1vcmRlci1pY29ucycsIDE1MCwgJ2xvb3Qtc29ydCcsIHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICdQcmVmaXggT2Zmc2V0IEFzc2lnbicsICgpID0+IHtcbiAgICBzZXRQcmVmaXhPZmZzZXREaWFsb2coY29udGV4dC5hcGkpO1xuICB9LCAoKSA9PiB7XG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IGFjdGl2ZUdhbWUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcbiAgICByZXR1cm4gYWN0aXZlR2FtZSA9PT0gR0FNRV9JRDtcbiAgfSk7XG5cbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignZmItbG9hZC1vcmRlci1pY29ucycsIDE1MCwgJ2xvb3Qtc29ydCcsIHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICdQcmVmaXggT2Zmc2V0IFJlc2V0JywgKCkgPT4ge1xuICAgIHJlc2V0UHJlZml4T2Zmc2V0KGNvbnRleHQuYXBpKTtcbiAgfSwgKCkgPT4ge1xuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBhY3RpdmVHYW1lID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XG4gICAgcmV0dXJuIGFjdGl2ZUdhbWUgPT09IEdBTUVfSUQ7XG4gIH0pO1xuXG4gIGNvbnN0IGdldE92ZXJoYXVsUGF0aCA9IChnYW1lOiB0eXBlcy5JR2FtZSkgPT4ge1xuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBkaXNjb3ZlcnkgPSBzZWxlY3RvcnMuZGlzY292ZXJ5QnlHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgICByZXR1cm4gZGlzY292ZXJ5Py5wYXRoO1xuICB9O1xuXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJzdkdGQtbW9kJywgMjUsXG4gICAgdG9CbHVlKHRlc3RTdXBwb3J0ZWRDb250ZW50KSwgdG9CbHVlKGluc3RhbGxDb250ZW50KSk7XG5cbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignN2R0ZC1yb290LW1vZCcsIDIwLCB0b0JsdWUodGVzdFJvb3RNb2QpLCB0b0JsdWUoaW5zdGFsbFJvb3RNb2QpKTtcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJzdkdGQtcm9vdC1tb2QnLCAyMCwgKGdhbWVJZCkgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxuICAgIGdldE92ZXJoYXVsUGF0aCwgKGluc3RydWN0aW9ucykgPT4ge1xuICAgICAgY29uc3QgY2FuZGlkYXRlRm91bmQgPSBoYXNDYW5kaWRhdGUoaW5zdHJ1Y3Rpb25zXG4gICAgICAgIC5maWx0ZXIoaW5zdHIgPT4gISFpbnN0ci5kZXN0aW5hdGlvbilcbiAgICAgICAgLm1hcChpbnN0ciA9PiBpbnN0ci5kZXN0aW5hdGlvbikpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjYW5kaWRhdGVGb3VuZCkgYXMgYW55O1xuICAgIH0sXG4gICAgICB7IG5hbWU6ICdSb290IERpcmVjdG9yeSBNb2QnLCBtZXJnZU1vZHM6IHRydWUsIGRlcGxveW1lbnRFc3NlbnRpYWw6IGZhbHNlIH0pO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJNaWdyYXRpb24odG9CbHVlKG9sZCA9PiBtaWdyYXRlMDIwKGNvbnRleHQuYXBpLCBvbGQpKSk7XG4gIGNvbnRleHQucmVnaXN0ZXJNaWdyYXRpb24odG9CbHVlKG9sZCA9PiBtaWdyYXRlMTAwKGNvbnRleHQsIG9sZCkpKTtcbiAgY29udGV4dC5yZWdpc3Rlck1pZ3JhdGlvbih0b0JsdWUob2xkID0+IG1pZ3JhdGUxMDExKGNvbnRleHQsIG9sZCkpKTtcblxuICByZXR1cm4gdHJ1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGRlZmF1bHQ6IG1haW4sXG59O1xuIl19