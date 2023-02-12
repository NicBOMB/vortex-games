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
const react_1 = __importDefault(require("react"));
const semver_1 = __importDefault(require("semver"));
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
const winapi = __importStar(require("winapi-bindings"));
const actions_1 = require("./actions");
const CompatibilityIcon_1 = __importDefault(require("./CompatibilityIcon"));
const constants_1 = require("./constants");
const DependencyManager_1 = __importDefault(require("./DependencyManager"));
const reducers_1 = __importDefault(require("./reducers"));
const Settings_1 = __importDefault(require("./Settings"));
const smapiProxy_1 = __importDefault(require("./smapiProxy"));
const tests_1 = require("./tests");
const types_1 = require("./types");
const util_1 = require("./util");
const path = require('path'), { clipboard } = require('electron'), rjson = require('relaxed-json'), { SevenZip } = vortex_api_1.util, { deploySMAPI, downloadSMAPI, findSMAPIMod } = require('./SMAPI'), { GAME_ID } = require('./common');
const MANIFEST_FILE = 'manifest.json';
const PTRN_CONTENT = path.sep + 'Content' + path.sep;
const SMAPI_EXE = 'StardewModdingAPI.exe';
const SMAPI_DLL = 'SMAPI.Installer.dll';
const SMAPI_DATA = ['windows-install.dat', 'install.dat'];
const _SMAPI_BUNDLED_MODS = ['ErrorHandler', 'ConsoleCommands', 'SaveBackup'];
const getBundledMods = () => {
    return Array.from(new Set(_SMAPI_BUNDLED_MODS.map(modName => modName.toLowerCase())));
};
function toBlue(func) {
    return (...args) => bluebird_1.default.resolve(func(...args));
}
class StardewValley {
    constructor(context) {
        this.id = GAME_ID;
        this.name = 'Stardew Valley';
        this.logo = 'gameart.jpg';
        this.environment = {
            SteamAPPId: '413150',
        };
        this.details = {
            steamAppId: 413150
        };
        this.supportedTools = [
            {
                id: 'smapi',
                name: 'SMAPI',
                logo: 'smapi.png',
                executable: () => SMAPI_EXE,
                requiredFiles: [SMAPI_EXE],
                shell: true,
                exclusive: true,
                relative: true,
                defaultPrimary: true,
            }
        ];
        this.mergeMods = true;
        this.requiresCleanup = true;
        this.shell = process.platform === 'win32';
        this.queryPath = toBlue(async () => {
            const game = await vortex_api_1.util.GameStoreHelper.findByAppId(['413150', '1453375253']);
            if (game)
                return game.gamePath;
            for (const defaultPath of this.defaultPaths) {
                if (await this.getPathExistsAsync(defaultPath))
                    return defaultPath;
            }
        });
        this.setup = toBlue(async (discovery) => {
            try {
                await vortex_api_1.fs.ensureDirWritableAsync(path.join(discovery.path, 'Mods'));
            }
            catch (err) {
                return Promise.reject(err);
            }
            const smapiPath = path.join(discovery.path, SMAPI_EXE);
            const smapiFound = await this.getPathExistsAsync(smapiPath);
            if (!smapiFound) {
                this.recommendSmapi();
            }
            const state = this.context.api.getState();
            if (state.settings['SDV'].useRecommendations === undefined) {
                this.context.api.showDialog('question', 'Show Recommendations?', {
                    text: 'Vortex can optionally use data from SMAPI\'s database and '
                        + 'the manifest files included with mods to recommend additional '
                        + 'compatible mods that work with those that you have installed. '
                        + 'In some cases, this information could be wrong or incomplete '
                        + 'which may lead to unreliable prompts showing in the app.\n'
                        + 'All recommendations shown should be carefully considered '
                        + 'before accepting them - if you are unsure please check the '
                        + 'mod page to see if the author has provided any further instructions. '
                        + 'Would you like to enable this feature? You can update your choice '
                        + 'from the Settings menu at any time.'
                }, [
                    { label: 'Continue without recommendations', action: () => {
                            this.context.api.store.dispatch((0, actions_1.setRecommendations)(false));
                        } },
                    { label: 'Enable recommendations', action: () => {
                            this.context.api.store.dispatch((0, actions_1.setRecommendations)(true));
                        } },
                ]);
            }
        });
        this.context = context;
        this.requiredFiles = process.platform == 'win32'
            ? ['Stardew Valley.exe']
            : ['StardewValley', 'StardewValley.exe'];
        this.defaultPaths = [
            process.env.HOME + '/GOG Games/Stardew Valley/game',
            process.env.HOME + '/.local/share/Steam/steamapps/common/Stardew Valley',
            '/Applications/Stardew Valley.app/Contents/MacOS',
            process.env.HOME + '/Library/Application Support/Steam/steamapps/common/Stardew Valley/Contents/MacOS',
            'C:\\Program Files (x86)\\GalaxyClient\\Games\\Stardew Valley',
            'C:\\Program Files (x86)\\GOG Galaxy\\Games\\Stardew Valley',
            'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Stardew Valley'
        ];
    }
    executable() {
        return process.platform == 'win32'
            ? 'Stardew Valley.exe'
            : 'StardewValley';
    }
    queryModPath() {
        return 'Mods';
    }
    recommendSmapi() {
        const smapiMod = findSMAPIMod(this.context.api);
        const title = smapiMod ? 'SMAPI is not deployed' : 'SMAPI is not installed';
        const actionTitle = smapiMod ? 'Deploy' : 'Get SMAPI';
        const action = () => (smapiMod
            ? deploySMAPI(this.context.api)
            : downloadSMAPI(this.context.api))
            .then(() => this.context.api.dismissNotification('smapi-missing'));
        this.context.api.sendNotification({
            id: 'smapi-missing',
            type: 'warning',
            title,
            message: 'SMAPI is required to mod Stardew Valley.',
            actions: [
                {
                    title: actionTitle,
                    action,
                },
            ]
        });
    }
    async getPathExistsAsync(path) {
        try {
            await vortex_api_1.fs.statAsync(path);
            return true;
        }
        catch (err) {
            return false;
        }
    }
    async readRegistryKeyAsync(hive, key, name) {
        try {
            const instPath = winapi.RegGetValue(hive, key, name);
            if (!instPath) {
                throw new Error('empty registry key');
            }
            return Promise.resolve(instPath.value);
        }
        catch (err) {
            return Promise.resolve(undefined);
        }
    }
}
function testRootFolder(files, gameId) {
    const filtered = files.filter(file => file.endsWith(path.sep))
        .map(file => path.join('fakeDir', file));
    const contentDir = filtered.find(file => file.endsWith(PTRN_CONTENT));
    const supported = ((gameId === GAME_ID)
        && (contentDir !== undefined));
    return bluebird_1.default.resolve({ supported, requiredFiles: [] });
}
function installRootFolder(files, destinationPath) {
    const contentFile = files.find(file => path.join('fakeDir', file).endsWith(PTRN_CONTENT));
    const idx = contentFile.indexOf(PTRN_CONTENT) + 1;
    const rootDir = path.basename(contentFile.substring(0, idx));
    const filtered = files.filter(file => !file.endsWith(path.sep)
        && (file.indexOf(rootDir) !== -1)
        && (path.extname(file) !== '.txt'));
    const instructions = filtered.map(file => {
        return {
            type: 'copy',
            source: file,
            destination: file.substr(idx),
        };
    });
    return bluebird_1.default.resolve({ instructions });
}
function isValidManifest(filePath) {
    const segments = filePath.toLowerCase().split(path.sep);
    const isManifestFile = segments[segments.length - 1] === MANIFEST_FILE;
    const isLocale = segments.includes('locale');
    return isManifestFile && !isLocale;
}
function testSupported(files, gameId) {
    const supported = (gameId === GAME_ID)
        && (files.find(isValidManifest) !== undefined)
        && (files.find(file => {
            const testFile = path.join('fakeDir', file);
            return (testFile.endsWith(PTRN_CONTENT));
        }) === undefined);
    return bluebird_1.default.resolve({ supported, requiredFiles: [] });
}
async function install(api, dependencyManager, files, destinationPath) {
    const manifestFiles = files.filter(isValidManifest);
    let parseError;
    await dependencyManager.scanManifests(true);
    let mods = await Promise.all(manifestFiles.map(async (manifestFile) => {
        const rootFolder = path.dirname(manifestFile);
        const manifestIndex = manifestFile.toLowerCase().indexOf(MANIFEST_FILE);
        const filterFunc = (file) => (rootFolder !== '.')
            ? ((file.indexOf(rootFolder) !== -1)
                && (path.dirname(file) !== '.')
                && !file.endsWith(path.sep))
            : !file.endsWith(path.sep);
        try {
            const manifest = await (0, util_1.parseManifest)(path.join(destinationPath, manifestFile));
            const modFiles = files.filter(filterFunc);
            return {
                manifest,
                rootFolder,
                manifestIndex,
                modFiles,
            };
        }
        catch (err) {
            (0, vortex_api_1.log)('warn', 'Failed to parse manifest', { manifestFile, error: err.message });
            parseError = err;
            return undefined;
        }
    }));
    mods = mods.filter(x => x !== undefined);
    if (mods.length === 0) {
        api.showErrorNotification('The mod manifest is invalid and can\'t be read. You can try to install the mod anyway via right-click -> "Unpack (as-is)"', parseError, {
            allowReport: false,
        });
    }
    return bluebird_1.default.map(mods, mod => {
        const modName = (mod.rootFolder !== '.')
            ? mod.rootFolder
            : mod.manifest.Name;
        const dependencies = mod.manifest.Dependencies || [];
        const instructions = [];
        for (const file of mod.modFiles) {
            const destination = path.join(modName, file.substr(mod.manifestIndex));
            instructions.push({
                type: 'copy',
                source: file,
                destination: destination,
            });
        }
        const addRuleForDependency = (dep) => {
            if ((dep.UniqueID === undefined)
                || (dep.UniqueID.toLowerCase() === 'yourname.yourotherspacksandmods')) {
                return;
            }
            const versionMatch = dep.MinimumVersion !== undefined
                ? `>=${dep.MinimumVersion}`
                : '*';
            const rule = {
                type: 'recommends',
                reference: {
                    logicalFileName: dep.UniqueID.toLowerCase(),
                    versionMatch,
                },
                extra: {
                    onlyIfFulfillable: true,
                    automatic: true,
                },
            };
            instructions.push({
                type: 'rule',
                rule,
            });
        };
        if (api.getState().settings['SDV']?.useRecommendations ?? false) {
            for (const dep of dependencies) {
                addRuleForDependency(dep);
            }
            if (mod.manifest.ContentPackFor !== undefined) {
                addRuleForDependency(mod.manifest.ContentPackFor);
            }
        }
        return instructions;
    })
        .then(data => {
        const instructions = [].concat(data).reduce((accum, iter) => accum.concat(iter), []);
        return Promise.resolve({ instructions });
    });
}
function isSMAPIModType(instructions) {
    const smapiData = instructions.find(inst => (inst.type === 'copy') && inst.source.endsWith(SMAPI_EXE));
    return bluebird_1.default.resolve(smapiData !== undefined);
}
function testSMAPI(files, gameId) {
    const supported = (gameId === GAME_ID) && (files.find(file => path.basename(file) === SMAPI_DLL) !== undefined);
    return bluebird_1.default.resolve({
        supported,
        requiredFiles: [],
    });
}
async function installSMAPI(getDiscoveryPath, files, destinationPath) {
    const folder = process.platform === 'win32'
        ? 'windows'
        : process.platform === 'linux'
            ? 'linux'
            : 'macos';
    const fileHasCorrectPlatform = (file) => {
        const segments = file.split(path.sep).map(seg => seg.toLowerCase());
        return (segments.includes(folder));
    };
    const dataFile = files.find(file => {
        const isCorrectPlatform = fileHasCorrectPlatform(file);
        return isCorrectPlatform && SMAPI_DATA.includes(path.basename(file).toLowerCase());
    });
    if (dataFile === undefined) {
        return Promise.reject(new vortex_api_1.util.DataInvalid('Failed to find the SMAPI data files - download appears '
            + 'to be corrupted; please re-download SMAPI and try again'));
    }
    let data = '';
    try {
        data = await vortex_api_1.fs.readFileAsync(path.join(getDiscoveryPath(), 'Stardew Valley.deps.json'), { encoding: 'utf8' });
    }
    catch (err) {
        (0, vortex_api_1.log)('error', 'failed to parse SDV dependencies', err);
    }
    const updatedFiles = [];
    const szip = new SevenZip();
    await szip.extractFull(path.join(destinationPath, dataFile), destinationPath);
    await vortex_api_1.util.walk(destinationPath, (iter, stats) => {
        const relPath = path.relative(destinationPath, iter);
        if (!files.includes(relPath) && stats.isFile() && !files.includes(relPath + path.sep))
            updatedFiles.push(relPath);
        const segments = relPath.toLocaleLowerCase().split(path.sep);
        const modsFolderIdx = segments.indexOf('mods');
        if ((modsFolderIdx !== -1) && (segments.length > modsFolderIdx + 1)) {
            _SMAPI_BUNDLED_MODS.push(segments[modsFolderIdx + 1]);
        }
        return bluebird_1.default.resolve();
    });
    const smapiExe = updatedFiles.find(file => file.toLowerCase().endsWith(SMAPI_EXE.toLowerCase()));
    if (smapiExe === undefined) {
        return Promise.reject(new vortex_api_1.util.DataInvalid(`Failed to extract ${SMAPI_EXE} - download appears `
            + 'to be corrupted; please re-download SMAPI and try again'));
    }
    const idx = smapiExe.indexOf(path.basename(smapiExe));
    const instructions = updatedFiles.map(file => {
        return {
            type: 'copy',
            source: file,
            destination: path.join(file.substr(idx)),
        };
    });
    instructions.push({
        type: 'attribute',
        key: 'smapiBundledMods',
        value: getBundledMods(),
    });
    instructions.push({
        type: 'generatefile',
        data,
        destination: 'StardewModdingAPI.deps.json',
    });
    return Promise.resolve({ instructions });
}
async function showSMAPILog(api, basePath, logFile) {
    const logData = await vortex_api_1.fs.readFileAsync(path.join(basePath, logFile), { encoding: 'utf-8' });
    await api.showDialog('info', 'SMAPI Log', {
        text: 'Your SMAPI log is displayed below. To share it, click "Copy & Share" which will copy it to your clipboard and open the SMAPI log sharing website. ' +
            'Next, paste your code into the text box and press "save & parse log". You can now share a link to this page with others so they can see your log file.\n\n' + logData
    }, [{
            label: 'Copy & Share log', action: () => {
                const timestamp = new Date().toISOString().replace(/^.+T([^\.]+).+/, '$1');
                clipboard.writeText(`[${timestamp} INFO Vortex] Log exported by Vortex ${vortex_api_1.util.getApplication().version}.\n` + logData);
                return vortex_api_1.util.opn('https://smapi.io/log').catch(err => undefined);
            }
        }, { label: 'Close', action: () => undefined }]);
}
async function onShowSMAPILog(api) {
    const basePath = path.join(vortex_api_1.util.getVortexPath('appData'), 'stardewvalley', 'errorlogs');
    try {
        await showSMAPILog(api, basePath, "SMAPI-crash.txt");
    }
    catch (err) {
        try {
            await showSMAPILog(api, basePath, "SMAPI-latest.txt");
        }
        catch (err) {
            api.sendNotification({ type: 'info', title: 'No SMAPI logs found.', message: '', displayMS: 5000 });
        }
    }
}
function getModManifests(modPath) {
    const manifests = [];
    if (modPath === undefined) {
        return Promise.resolve([]);
    }
    return (0, turbowalk_1.default)(modPath, async (entries) => {
        for (const entry of entries) {
            if (path.basename(entry.filePath) === 'manifest.json') {
                manifests.push(entry.filePath);
            }
        }
    }, { skipHidden: false, recurse: true, skipInaccessible: true, skipLinks: true })
        .then(() => manifests);
}
function updateConflictInfo(api, smapi, gameId, modId) {
    const mod = api.getState().persistent.mods[gameId][modId];
    if (mod === undefined) {
        return Promise.resolve();
    }
    const now = Date.now();
    if ((now - mod.attributes?.lastSMAPIQuery ?? 0) < constants_1.SMAPI_QUERY_FREQUENCY) {
        return Promise.resolve();
    }
    let additionalLogicalFileNames = mod.attributes?.additionalLogicalFileNames;
    if (!additionalLogicalFileNames) {
        if (mod.attributes?.logicalFileName) {
            additionalLogicalFileNames = [mod.attributes?.logicalFileName];
        }
        else {
            additionalLogicalFileNames = [];
        }
    }
    const query = additionalLogicalFileNames
        .map(name => {
        const res = {
            id: name,
        };
        const ver = mod.attributes?.manifestVersion
            ?? semver_1.default.coerce(mod.attributes?.version)?.version;
        if (!!ver) {
            res['installedVersion'] = ver;
        }
        return res;
    });
    const stat = (item) => {
        const status = item.metadata?.compatibilityStatus?.toLowerCase?.();
        if (!types_1.compatibilityOptions.includes(status)) {
            return 'unknown';
        }
        else {
            return status;
        }
    };
    const compatibilityPrio = (item) => types_1.compatibilityOptions.indexOf(stat(item));
    return smapi.findByNames(query)
        .then(results => {
        const worstStatus = results
            .sort((lhs, rhs) => compatibilityPrio(lhs) - compatibilityPrio(rhs));
        if (worstStatus.length > 0) {
            api.store.dispatch(vortex_api_1.actions.setModAttributes(gameId, modId, {
                lastSMAPIQuery: now,
                compatibilityStatus: worstStatus[0].metadata.compatibilityStatus,
                compatibilityMessage: worstStatus[0].metadata.compatibilitySummary,
                compatibilityUpdate: worstStatus[0].suggestedUpdate?.version,
            }));
        }
        else {
            (0, vortex_api_1.log)('debug', 'no manifest');
            api.store.dispatch(vortex_api_1.actions.setModAttribute(gameId, modId, 'lastSMAPIQuery', now));
        }
    })
        .catch(err => {
        (0, vortex_api_1.log)('warn', 'error reading manifest', err.message);
        api.store.dispatch(vortex_api_1.actions.setModAttribute(gameId, modId, 'lastSMAPIQuery', now));
    });
}
function init(context) {
    let dependencyManager;
    const getDiscoveryPath = () => {
        const state = context.api.store.getState();
        const discovery = state?.settings?.gameMode?.discovered?.[GAME_ID];
        if ((discovery === undefined) || (discovery.path === undefined)) {
            (0, vortex_api_1.log)('error', 'stardewvalley was not discovered');
            return undefined;
        }
        return discovery.path;
    };
    const getSMAPIPath = (game) => {
        const state = context.api.store.getState();
        const discovery = state.settings.gameMode.discovered[game.id];
        return discovery.path;
    };
    const isModCandidateValid = (mod, entry) => {
        if (mod?.id === undefined || mod.type === 'sdvrootfolder') {
            return false;
        }
        if (mod.type !== 'SMAPI') {
            return true;
        }
        const segments = entry.filePath.toLowerCase().split(path.sep).filter(seg => !!seg);
        const modsSegIdx = segments.indexOf('mods');
        const modFolderName = ((modsSegIdx !== -1) && (segments.length > modsSegIdx + 1))
            ? segments[modsSegIdx + 1] : undefined;
        let bundledMods = mod?.attributes?.smapiBundledMods ?? [];
        bundledMods = bundledMods.length > 0 ? bundledMods : getBundledMods();
        if (segments.includes('content')) {
            return false;
        }
        return (modFolderName !== undefined) && bundledMods.includes(modFolderName);
    };
    const manifestExtractor = toBlue(async (modInfo, modPath) => {
        if (vortex_api_1.selectors.activeGameId(context.api.getState()) !== GAME_ID) {
            return Promise.resolve({});
        }
        const manifests = await getModManifests(modPath);
        const parsedManifests = (await Promise.all(manifests.map(async (manifest) => {
            try {
                return await (0, util_1.parseManifest)(manifest);
            }
            catch (err) {
                (0, vortex_api_1.log)('warn', 'Failed to parse manifest', { manifestFile: manifest, error: err.message });
                return undefined;
            }
        }))).filter(manifest => manifest !== undefined);
        if (parsedManifests.length === 0) {
            return Promise.resolve({});
        }
        const refManifest = parsedManifests[0];
        const additionalLogicalFileNames = parsedManifests
            .filter(manifest => manifest.UniqueID !== undefined)
            .map(manifest => manifest.UniqueID.toLowerCase());
        const minSMAPIVersion = parsedManifests
            .map(manifest => manifest.MinimumApiVersion)
            .filter(version => semver_1.default.valid(version))
            .sort((lhs, rhs) => semver_1.default.compare(rhs, lhs))[0];
        const result = {
            additionalLogicalFileNames,
            minSMAPIVersion,
        };
        if (refManifest !== undefined) {
            if (modInfo.download.modInfo?.nexus?.ids?.modId !== 2400) {
                result['customFileName'] = refManifest.Name;
            }
            if (typeof (refManifest.Version) === 'string') {
                result['manifestVersion'] = refManifest.Version;
            }
        }
        return Promise.resolve(result);
    });
    context.registerGame(new StardewValley(context));
    context.registerReducer(['settings', 'SDV'], reducers_1.default);
    context.registerSettings('Mods', Settings_1.default, undefined, () => vortex_api_1.selectors.activeGameId(context.api.getState()) === GAME_ID, 50);
    context.registerInstaller('smapi-installer', 30, testSMAPI, (files, dest) => bluebird_1.default.resolve(installSMAPI(getDiscoveryPath, files, dest)));
    context.registerModType('SMAPI', 30, gameId => gameId === GAME_ID, getSMAPIPath, isSMAPIModType);
    context.registerInstaller('stardew-valley-installer', 50, testSupported, (files, destinationPath) => bluebird_1.default.resolve(install(context.api, dependencyManager, files, destinationPath)));
    context.registerInstaller('sdvrootfolder', 50, testRootFolder, installRootFolder);
    context.registerModType('sdvrootfolder', 25, (gameId) => (gameId === GAME_ID), () => getDiscoveryPath(), (instructions) => {
        const copyInstructions = instructions.filter(instr => instr.type === 'copy');
        const hasManifest = copyInstructions.find(instr => instr.destination.endsWith(MANIFEST_FILE));
        const hasModsFolder = copyInstructions.find(instr => instr.destination.startsWith('Mods' + path.sep)) !== undefined;
        const hasContentFolder = copyInstructions.find(instr => instr.destination.startsWith('Content' + path.sep)) !== undefined;
        return (hasManifest)
            ? bluebird_1.default.resolve(hasContentFolder && hasModsFolder)
            : bluebird_1.default.resolve(hasContentFolder);
    });
    context.registerAction('mod-icons', 999, 'changelog', {}, 'SMAPI Log', () => { onShowSMAPILog(context.api); }, () => {
        const state = context.api.store.getState();
        const gameMode = vortex_api_1.selectors.activeGameId(state);
        return (gameMode === GAME_ID);
    });
    context.registerAttributeExtractor(25, manifestExtractor);
    context.registerTableAttribute('mods', {
        id: 'sdv-compatibility',
        position: 100,
        condition: () => vortex_api_1.selectors.activeGameId(context.api.getState()) === GAME_ID,
        placement: 'table',
        calc: (mod) => mod.attributes?.compatibilityStatus,
        customRenderer: (mod, detailCell, t) => {
            return react_1.default.createElement(CompatibilityIcon_1.default, { t, mod, detailCell }, []);
        },
        name: 'Compatibility',
        isDefaultVisible: true,
        edit: {},
    });
    context.registerTest('sdv-incompatible-mods', 'gamemode-activated', () => bluebird_1.default.resolve((0, tests_1.testSMAPIOutdated)(context.api, dependencyManager)));
    context.once(() => {
        const proxy = new smapiProxy_1.default(context.api);
        context.api.setStylesheet('sdv', path.join(__dirname, 'sdvstyle.scss'));
        context.api.addMetaServer('smapi.io', {
            url: '',
            loopbackCB: (query) => {
                return bluebird_1.default.resolve(proxy.find(query))
                    .catch(err => {
                    (0, vortex_api_1.log)('error', 'failed to look up smapi meta info', err.message);
                    return bluebird_1.default.resolve([]);
                });
            },
            cacheDurationSec: 86400,
            priority: 25,
        });
        dependencyManager = new DependencyManager_1.default(context.api);
        context.api.onAsync('added-files', async (profileId, files) => {
            const state = context.api.store.getState();
            const profile = vortex_api_1.selectors.profileById(state, profileId);
            if (profile?.gameId !== GAME_ID) {
                return;
            }
            const game = vortex_api_1.util.getGame(GAME_ID);
            const discovery = vortex_api_1.selectors.discoveryByGame(state, GAME_ID);
            const modPaths = game.getModPaths(discovery.path);
            const installPath = vortex_api_1.selectors.installPathForGame(state, GAME_ID);
            await bluebird_1.default.map(files, async (entry) => {
                if (entry.candidates.length === 1) {
                    const mod = state.persistent.mods?.[GAME_ID]?.[entry.candidates[0]];
                    if (!isModCandidateValid(mod, entry)) {
                        return Promise.resolve();
                    }
                    const from = modPaths[mod.type ?? ''];
                    if (from === undefined) {
                        (0, vortex_api_1.log)('error', 'failed to resolve mod path for mod type', mod.type);
                        return Promise.resolve();
                    }
                    const relPath = path.relative(from, entry.filePath);
                    const targetPath = path.join(installPath, mod.id, relPath);
                    try {
                        await vortex_api_1.fs.ensureDirAsync(path.dirname(targetPath));
                        await vortex_api_1.fs.copyAsync(entry.filePath, targetPath);
                        await vortex_api_1.fs.removeAsync(entry.filePath);
                    }
                    catch (err) {
                        if (!err.message.includes('are the same file')) {
                            (0, vortex_api_1.log)('error', 'failed to re-import added file to mod', err.message);
                        }
                    }
                }
            });
        });
        context.api.onAsync('did-deploy', async (profileId) => {
            const state = context.api.getState();
            const profile = vortex_api_1.selectors.profileById(state, profileId);
            if (profile?.gameId !== GAME_ID) {
                return Promise.resolve();
            }
            const smapiMod = findSMAPIMod(context.api);
            const primaryTool = state?.settings?.interface?.primaryTool?.[GAME_ID];
            if (smapiMod && primaryTool === undefined) {
                context.api.store.dispatch(vortex_api_1.actions.setPrimaryTool(GAME_ID, 'smapi'));
            }
            return Promise.resolve();
        });
        context.api.onAsync('did-purge', async (profileId) => {
            const state = context.api.getState();
            const profile = vortex_api_1.selectors.profileById(state, profileId);
            if (profile?.gameId !== GAME_ID) {
                return Promise.resolve();
            }
            const smapiMod = findSMAPIMod(context.api);
            const primaryTool = state?.settings?.interface?.primaryTool?.[GAME_ID];
            if (smapiMod && primaryTool === 'smapi') {
                context.api.store.dispatch(vortex_api_1.actions.setPrimaryTool(GAME_ID, undefined));
            }
            return Promise.resolve();
        });
        context.api.events.on('did-install-mod', (gameId, archiveId, modId) => {
            if (gameId !== GAME_ID) {
                return;
            }
            updateConflictInfo(context.api, proxy, gameId, modId)
                .then(() => (0, vortex_api_1.log)('debug', 'added compatibility info', { modId }))
                .catch(err => (0, vortex_api_1.log)('error', 'failed to add compatibility info', { modId, error: err.message }));
        });
        context.api.events.on('gamemode-activated', (gameMode) => {
            if (gameMode !== GAME_ID) {
                return;
            }
            const state = context.api.getState();
            (0, vortex_api_1.log)('debug', 'updating SDV compatibility info');
            Promise.all(Object.keys(state.persistent.mods[gameMode] ?? {}).map(modId => updateConflictInfo(context.api, proxy, gameMode, modId)))
                .then(() => {
                (0, vortex_api_1.log)('debug', 'done updating compatibility info');
            })
                .catch(err => {
                (0, vortex_api_1.log)('error', 'failed to update conflict info', err.message);
            });
        });
    });
}
exports.default = init;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBRWhDLGtEQUEwQjtBQUMxQixvREFBNEI7QUFDNUIsMERBQWtDO0FBQ2xDLDJDQUFzRTtBQUN0RSx3REFBMEM7QUFDMUMsdUNBQStDO0FBQy9DLDRFQUFvRDtBQUNwRCwyQ0FBb0Q7QUFFcEQsNEVBQW9EO0FBQ3BELDBEQUFxQztBQUNyQywwREFBa0M7QUFDbEMsOERBQXNDO0FBQ3RDLG1DQUE0QztBQUM1QyxtQ0FBbUg7QUFDbkgsaUNBQXVDO0FBRXZDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFDMUIsRUFBRSxTQUFTLEVBQUUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQ25DLEtBQUssR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLEVBQy9CLEVBQUUsUUFBUSxFQUFFLEdBQUcsaUJBQUksRUFDbkIsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFDakUsRUFBRSxPQUFPLEVBQUUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFFcEMsTUFBTSxhQUFhLEdBQUcsZUFBZSxDQUFDO0FBQ3RDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7QUFDckQsTUFBTSxTQUFTLEdBQUcsdUJBQXVCLENBQUM7QUFDMUMsTUFBTSxTQUFTLEdBQUcscUJBQXFCLENBQUM7QUFDeEMsTUFBTSxVQUFVLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUUxRCxNQUFNLG1CQUFtQixHQUFHLENBQUMsY0FBYyxFQUFFLGlCQUFpQixFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQzlFLE1BQU0sY0FB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LENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ1gsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSxnQ0FBZ0MsRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDOUQsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELGtCQUFlLElBQUksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgeyBJUXVlcnkgfSBmcm9tICdtb2RtZXRhLWRiJztcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgdHVyYm93YWxrIGZyb20gJ3R1cmJvd2Fsayc7XG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgbG9nLCBzZWxlY3RvcnMsIHV0aWwsIHR5cGVzIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5pbXBvcnQgKiBhcyB3aW5hcGkgZnJvbSAnd2luYXBpLWJpbmRpbmdzJztcbmltcG9ydCB7IHNldFJlY29tbWVuZGF0aW9ucyB9IGZyb20gJy4vYWN0aW9ucyc7XG5pbXBvcnQgQ29tcGF0aWJpbGl0eUljb24gZnJvbSAnLi9Db21wYXRpYmlsaXR5SWNvbic7XG5pbXBvcnQgeyBTTUFQSV9RVUVSWV9GUkVRVUVOQ1kgfSBmcm9tICcuL2NvbnN0YW50cyc7XG5cbmltcG9ydCBEZXBlbmRlbmN5TWFuYWdlciBmcm9tICcuL0RlcGVuZGVuY3lNYW5hZ2VyJztcbmltcG9ydCBzZHZSZWR1Y2VycyBmcm9tICcuL3JlZHVjZXJzJztcbmltcG9ydCBTZXR0aW5ncyBmcm9tICcuL1NldHRpbmdzJztcbmltcG9ydCBTTUFQSVByb3h5IGZyb20gJy4vc21hcGlQcm94eSc7XG5pbXBvcnQgeyB0ZXN0U01BUElPdXRkYXRlZCB9IGZyb20gJy4vdGVzdHMnO1xuaW1wb3J0IHsgY29tcGF0aWJpbGl0eU9wdGlvbnMsIENvbXBhdGliaWxpdHlTdGF0dXMsIElTRFZEZXBlbmRlbmN5LCBJU0RWTW9kTWFuaWZlc3QsIElTTUFQSVJlc3VsdCB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgcGFyc2VNYW5pZmVzdCB9IGZyb20gJy4vdXRpbCc7XG5cbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyksXG4gIHsgY2xpcGJvYXJkIH0gPSByZXF1aXJlKCdlbGVjdHJvbicpLFxuICByanNvbiA9IHJlcXVpcmUoJ3JlbGF4ZWQtanNvbicpLFxuICB7IFNldmVuWmlwIH0gPSB1dGlsLFxuICB7IGRlcGxveVNNQVBJLCBkb3dubG9hZFNNQVBJLCBmaW5kU01BUElNb2QgfSA9IHJlcXVpcmUoJy4vU01BUEknKSxcbiAgeyBHQU1FX0lEIH0gPSByZXF1aXJlKCcuL2NvbW1vbicpO1xuXG5jb25zdCBNQU5JRkVTVF9GSUxFID0gJ21hbmlmZXN0Lmpzb24nO1xuY29uc3QgUFRSTl9DT05URU5UID0gcGF0aC5zZXAgKyAnQ29udGVudCcgKyBwYXRoLnNlcDtcbmNvbnN0IFNNQVBJX0VYRSA9ICdTdGFyZGV3TW9kZGluZ0FQSS5leGUnO1xuY29uc3QgU01BUElfRExMID0gJ1NNQVBJLkluc3RhbGxlci5kbGwnO1xuY29uc3QgU01BUElfREFUQSA9IFsnd2luZG93cy1pbnN0YWxsLmRhdCcsICdpbnN0YWxsLmRhdCddO1xuXG5jb25zdCBfU01BUElfQlVORExFRF9NT0RTID0gWydFcnJvckhhbmRsZXInLCAnQ29uc29sZUNvbW1hbmRzJywgJ1NhdmVCYWNrdXAnXTtcbmNvbnN0IGdldEJ1bmRsZWRNb2RzID0gKCkgPT4ge1xuICByZXR1cm4gQXJyYXkuZnJvbShuZXcgU2V0KF9TTUFQSV9CVU5ETEVEX01PRFMubWFwKG1vZE5hbWUgPT4gbW9kTmFtZS50b0xvd2VyQ2FzZSgpKSkpO1xufVxuXG5mdW5jdGlvbiB0b0JsdWU8VD4oZnVuYzogKC4uLmFyZ3M6IGFueVtdKSA9PiBQcm9taXNlPFQ+KTogKC4uLmFyZ3M6IGFueVtdKSA9PiBCbHVlYmlyZDxUPiB7XG4gIHJldHVybiAoLi4uYXJnczogYW55W10pID0+IEJsdWViaXJkLnJlc29sdmUoZnVuYyguLi5hcmdzKSk7XG59XG5cbmNsYXNzIFN0YXJkZXdWYWxsZXkgaW1wbGVtZW50cyB0eXBlcy5JR2FtZSB7XG4gIHB1YmxpYyBjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dDtcbiAgcHVibGljIGlkOiBzdHJpbmcgPSBHQU1FX0lEO1xuICBwdWJsaWMgbmFtZTogc3RyaW5nID0gJ1N0YXJkZXcgVmFsbGV5JztcbiAgcHVibGljIGxvZ286IHN0cmluZyA9ICdnYW1lYXJ0LmpwZyc7XG4gIHB1YmxpYyByZXF1aXJlZEZpbGVzOiBzdHJpbmdbXTtcbiAgcHVibGljIGVudmlyb25tZW50OiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9ID0ge1xuICAgIFN0ZWFtQVBQSWQ6ICc0MTMxNTAnLFxuICB9O1xuICBwdWJsaWMgZGV0YWlsczogeyBba2V5OiBzdHJpbmddOiBhbnkgfSA9IHtcbiAgICBzdGVhbUFwcElkOiA0MTMxNTBcbiAgfTtcbiAgcHVibGljIHN1cHBvcnRlZFRvb2xzOiBhbnlbXSA9IFtcbiAgICB7XG4gICAgICBpZDogJ3NtYXBpJyxcbiAgICAgIG5hbWU6ICdTTUFQSScsXG4gICAgICBsb2dvOiAnc21hcGkucG5nJyxcbiAgICAgIGV4ZWN1dGFibGU6ICgpID0+IFNNQVBJX0VYRSxcbiAgICAgIHJlcXVpcmVkRmlsZXM6IFtTTUFQSV9FWEVdLFxuICAgICAgc2hlbGw6IHRydWUsXG4gICAgICBleGNsdXNpdmU6IHRydWUsXG4gICAgICByZWxhdGl2ZTogdHJ1ZSxcbiAgICAgIGRlZmF1bHRQcmltYXJ5OiB0cnVlLFxuICAgIH1cbiAgXTtcbiAgcHVibGljIG1lcmdlTW9kczogYm9vbGVhbiA9IHRydWU7XG4gIHB1YmxpYyByZXF1aXJlc0NsZWFudXA6IGJvb2xlYW4gPSB0cnVlO1xuICBwdWJsaWMgc2hlbGw6IGJvb2xlYW4gPSBwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInO1xuICBwdWJsaWMgZGVmYXVsdFBhdGhzOiBzdHJpbmdbXTtcblxuICAvKioqKioqKioqXG4gICoqIFZvcnRleCBBUElcbiAgKioqKioqKioqL1xuICAvKipcbiAgICogQ29uc3RydWN0IGFuIGluc3RhbmNlLlxuICAgKiBAcGFyYW0ge0lFeHRlbnNpb25Db250ZXh0fSBjb250ZXh0IC0tIFRoZSBWb3J0ZXggZXh0ZW5zaW9uIGNvbnRleHQuXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xuICAgIC8vIHByb3BlcnRpZXMgdXNlZCBieSBWb3J0ZXhcbiAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgIHRoaXMucmVxdWlyZWRGaWxlcyA9IHByb2Nlc3MucGxhdGZvcm0gPT0gJ3dpbjMyJ1xuICAgICAgPyBbJ1N0YXJkZXcgVmFsbGV5LmV4ZSddXG4gICAgICA6IFsnU3RhcmRld1ZhbGxleScsICdTdGFyZGV3VmFsbGV5LmV4ZSddO1xuXG4gICAgLy8gY3VzdG9tIHByb3BlcnRpZXNcbiAgICB0aGlzLmRlZmF1bHRQYXRocyA9IFtcbiAgICAgIC8vIExpbnV4XG4gICAgICBwcm9jZXNzLmVudi5IT01FICsgJy9HT0cgR2FtZXMvU3RhcmRldyBWYWxsZXkvZ2FtZScsXG4gICAgICBwcm9jZXNzLmVudi5IT01FICsgJy8ubG9jYWwvc2hhcmUvU3RlYW0vc3RlYW1hcHBzL2NvbW1vbi9TdGFyZGV3IFZhbGxleScsXG5cbiAgICAgIC8vIE1hY1xuICAgICAgJy9BcHBsaWNhdGlvbnMvU3RhcmRldyBWYWxsZXkuYXBwL0NvbnRlbnRzL01hY09TJyxcbiAgICAgIHByb2Nlc3MuZW52LkhPTUUgKyAnL0xpYnJhcnkvQXBwbGljYXRpb24gU3VwcG9ydC9TdGVhbS9zdGVhbWFwcHMvY29tbW9uL1N0YXJkZXcgVmFsbGV5L0NvbnRlbnRzL01hY09TJyxcblxuICAgICAgLy8gV2luZG93c1xuICAgICAgJ0M6XFxcXFByb2dyYW0gRmlsZXMgKHg4NilcXFxcR2FsYXh5Q2xpZW50XFxcXEdhbWVzXFxcXFN0YXJkZXcgVmFsbGV5JyxcbiAgICAgICdDOlxcXFxQcm9ncmFtIEZpbGVzICh4ODYpXFxcXEdPRyBHYWxheHlcXFxcR2FtZXNcXFxcU3RhcmRldyBWYWxsZXknLFxuICAgICAgJ0M6XFxcXFByb2dyYW0gRmlsZXMgKHg4NilcXFxcU3RlYW1cXFxcc3RlYW1hcHBzXFxcXGNvbW1vblxcXFxTdGFyZGV3IFZhbGxleSdcbiAgICBdO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzeW5jaHJvbm91c2x5IGZpbmQgdGhlIGdhbWUgaW5zdGFsbCBwYXRoLlxuICAgKlxuICAgKiBUaGlzIGZ1bmN0aW9uIHNob3VsZCByZXR1cm4gcXVpY2tseSBhbmQsIGlmIGl0IHJldHVybnMgYSB2YWx1ZSwgaXQgc2hvdWxkIGRlZmluaXRpdmVseSBiZSB0aGVcbiAgICogdmFsaWQgZ2FtZSBwYXRoLiBVc3VhbGx5IHRoaXMgZnVuY3Rpb24gd2lsbCBxdWVyeSB0aGUgcGF0aCBmcm9tIHRoZSByZWdpc3RyeSBvciBmcm9tIHN0ZWFtLlxuICAgKiBUaGlzIGZ1bmN0aW9uIG1heSByZXR1cm4gYSBwcm9taXNlIGFuZCBpdCBzaG91bGQgZG8gdGhhdCBpZiBpdCdzIGRvaW5nIEkvTy5cbiAgICpcbiAgICogVGhpcyBtYXkgYmUgbGVmdCB1bmRlZmluZWQgYnV0IHRoZW4gdGhlIHRvb2wvZ2FtZSBjYW4gb25seSBiZSBkaXNjb3ZlcmVkIGJ5IHNlYXJjaGluZyB0aGUgZGlza1xuICAgKiB3aGljaCBpcyBzbG93IGFuZCBvbmx5IGhhcHBlbnMgbWFudWFsbHkuXG4gICAqL1xuICBwdWJsaWMgcXVlcnlQYXRoID0gdG9CbHVlKGFzeW5jICgpID0+IHtcbiAgICAvLyBjaGVjayBTdGVhbVxuICAgIGNvbnN0IGdhbWUgPSBhd2FpdCB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbJzQxMzE1MCcsICcxNDUzMzc1MjUzJ10pO1xuICAgIGlmIChnYW1lKVxuICAgICAgcmV0dXJuIGdhbWUuZ2FtZVBhdGg7XG5cbiAgICAvLyBjaGVjayBkZWZhdWx0IHBhdGhzXG4gICAgZm9yIChjb25zdCBkZWZhdWx0UGF0aCBvZiB0aGlzLmRlZmF1bHRQYXRocylcbiAgICB7XG4gICAgICBpZiAoYXdhaXQgdGhpcy5nZXRQYXRoRXhpc3RzQXN5bmMoZGVmYXVsdFBhdGgpKVxuICAgICAgICByZXR1cm4gZGVmYXVsdFBhdGg7XG4gICAgfVxuICB9KTtcblxuICAvKipcbiAgICogR2V0IHRoZSBwYXRoIG9mIHRoZSB0b29sIGV4ZWN1dGFibGUgcmVsYXRpdmUgdG8gdGhlIHRvb2wgYmFzZSBwYXRoLCBpLmUuIGJpbmFyaWVzL1VUMy5leGUgb3JcbiAgICogVEVTVi5leGUuIFRoaXMgaXMgYSBmdW5jdGlvbiBzbyB0aGF0IHlvdSBjYW4gcmV0dXJuIGRpZmZlcmVudCB0aGluZ3MgYmFzZWQgb24gdGhlIG9wZXJhdGluZ1xuICAgKiBzeXN0ZW0gZm9yIGV4YW1wbGUgYnV0IGJlIGF3YXJlIHRoYXQgaXQgd2lsbCBiZSBldmFsdWF0ZWQgYXQgYXBwbGljYXRpb24gc3RhcnQgYW5kIG9ubHkgb25jZSxcbiAgICogc28gdGhlIHJldHVybiB2YWx1ZSBjYW4gbm90IGRlcGVuZCBvbiB0aGluZ3MgdGhhdCBjaGFuZ2UgYXQgcnVudGltZS5cbiAgICovXG4gIHB1YmxpYyBleGVjdXRhYmxlKCkge1xuICAgIHJldHVybiBwcm9jZXNzLnBsYXRmb3JtID09ICd3aW4zMidcbiAgICAgID8gJ1N0YXJkZXcgVmFsbGV5LmV4ZSdcbiAgICAgIDogJ1N0YXJkZXdWYWxsZXknO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgZGVmYXVsdCBkaXJlY3Rvcnkgd2hlcmUgbW9kcyBmb3IgdGhpcyBnYW1lIHNob3VsZCBiZSBzdG9yZWQuXG4gICAqXG4gICAqIElmIHRoaXMgcmV0dXJucyBhIHJlbGF0aXZlIHBhdGggdGhlbiB0aGUgcGF0aCBpcyB0cmVhdGVkIGFzIHJlbGF0aXZlIHRvIHRoZSBnYW1lIGluc3RhbGxhdGlvblxuICAgKiBkaXJlY3RvcnkuIFNpbXBseSByZXR1cm4gYSBkb3QgKCAoKSA9PiAnLicgKSBpZiBtb2RzIGFyZSBpbnN0YWxsZWQgZGlyZWN0bHkgaW50byB0aGUgZ2FtZVxuICAgKiBkaXJlY3RvcnkuXG4gICAqL1xuICBwdWJsaWMgcXVlcnlNb2RQYXRoKClcbiAge1xuICAgIHJldHVybiAnTW9kcyc7XG4gIH1cblxuICAvKipcbiAgICogT3B0aW9uYWwgc2V0dXAgZnVuY3Rpb24uIElmIHRoaXMgZ2FtZSByZXF1aXJlcyBzb21lIGZvcm0gb2Ygc2V0dXAgYmVmb3JlIGl0IGNhbiBiZSBtb2RkZWQgKGxpa2VcbiAgICogY3JlYXRpbmcgYSBkaXJlY3RvcnksIGNoYW5naW5nIGEgcmVnaXN0cnkga2V5LCAuLi4pIGRvIGl0IGhlcmUuIEl0IHdpbGwgYmUgY2FsbGVkIGV2ZXJ5IHRpbWVcbiAgICogYmVmb3JlIHRoZSBnYW1lIG1vZGUgaXMgYWN0aXZhdGVkLlxuICAgKiBAcGFyYW0ge0lEaXNjb3ZlcnlSZXN1bHR9IGRpc2NvdmVyeSAtLSBiYXNpYyBpbmZvIGFib3V0IHRoZSBnYW1lIGJlaW5nIGxvYWRlZC5cbiAgICovXG4gIHB1YmxpYyBzZXR1cCA9IHRvQmx1ZShhc3luYyAoZGlzY292ZXJ5KSA9PiB7XG4gICAgLy8gTWFrZSBzdXJlIHRoZSBmb2xkZXIgZm9yIFNNQVBJIG1vZHMgZXhpc3RzLlxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ01vZHMnKSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICB9XG4gICAgLy8gc2tpcCBpZiBTTUFQSSBmb3VuZFxuICAgIGNvbnN0IHNtYXBpUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgU01BUElfRVhFKTtcbiAgICBjb25zdCBzbWFwaUZvdW5kID0gYXdhaXQgdGhpcy5nZXRQYXRoRXhpc3RzQXN5bmMoc21hcGlQYXRoKTtcbiAgICBpZiAoIXNtYXBpRm91bmQpIHtcbiAgICAgIHRoaXMucmVjb21tZW5kU21hcGkoKTtcbiAgICB9XG5cbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMuY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcbiAgICBpZiAoc3RhdGUuc2V0dGluZ3NbJ1NEViddLnVzZVJlY29tbWVuZGF0aW9ucyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmNvbnRleHQuYXBpLnNob3dEaWFsb2coJ3F1ZXN0aW9uJywgJ1Nob3cgUmVjb21tZW5kYXRpb25zPycsIHtcbiAgICAgICAgdGV4dDogJ1ZvcnRleCBjYW4gb3B0aW9uYWxseSB1c2UgZGF0YSBmcm9tIFNNQVBJXFwncyBkYXRhYmFzZSBhbmQgJ1xuICAgICAgICAgICAgKyAndGhlIG1hbmlmZXN0IGZpbGVzIGluY2x1ZGVkIHdpdGggbW9kcyB0byByZWNvbW1lbmQgYWRkaXRpb25hbCAnXG4gICAgICAgICAgICArICdjb21wYXRpYmxlIG1vZHMgdGhhdCB3b3JrIHdpdGggdGhvc2UgdGhhdCB5b3UgaGF2ZSBpbnN0YWxsZWQuICdcbiAgICAgICAgICAgICsgJ0luIHNvbWUgY2FzZXMsIHRoaXMgaW5mb3JtYXRpb24gY291bGQgYmUgd3Jvbmcgb3IgaW5jb21wbGV0ZSAnXG4gICAgICAgICAgICArICd3aGljaCBtYXkgbGVhZCB0byB1bnJlbGlhYmxlIHByb21wdHMgc2hvd2luZyBpbiB0aGUgYXBwLlxcbidcbiAgICAgICAgICAgICsgJ0FsbCByZWNvbW1lbmRhdGlvbnMgc2hvd24gc2hvdWxkIGJlIGNhcmVmdWxseSBjb25zaWRlcmVkICdcbiAgICAgICAgICAgICsgJ2JlZm9yZSBhY2NlcHRpbmcgdGhlbSAtIGlmIHlvdSBhcmUgdW5zdXJlIHBsZWFzZSBjaGVjayB0aGUgJ1xuICAgICAgICAgICAgKyAnbW9kIHBhZ2UgdG8gc2VlIGlmIHRoZSBhdXRob3IgaGFzIHByb3ZpZGVkIGFueSBmdXJ0aGVyIGluc3RydWN0aW9ucy4gJ1xuICAgICAgICAgICAgKyAnV291bGQgeW91IGxpa2UgdG8gZW5hYmxlIHRoaXMgZmVhdHVyZT8gWW91IGNhbiB1cGRhdGUgeW91ciBjaG9pY2UgJ1xuICAgICAgICAgICAgKyAnZnJvbSB0aGUgU2V0dGluZ3MgbWVudSBhdCBhbnkgdGltZS4nXG4gICAgICB9LCBbXG4gICAgICAgIHsgbGFiZWw6ICdDb250aW51ZSB3aXRob3V0IHJlY29tbWVuZGF0aW9ucycsIGFjdGlvbjogKCkgPT4ge1xuICAgICAgICAgIHRoaXMuY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goc2V0UmVjb21tZW5kYXRpb25zKGZhbHNlKSk7XG4gICAgICAgIH0gfSxcbiAgICAgICAgeyBsYWJlbDogJ0VuYWJsZSByZWNvbW1lbmRhdGlvbnMnLCBhY3Rpb246ICgpID0+IHtcbiAgICAgICAgICB0aGlzLmNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKHNldFJlY29tbWVuZGF0aW9ucyh0cnVlKSk7XG4gICAgICAgIH0gfSxcbiAgICAgIF0pXG4gICAgfVxuICB9KTtcblxuICBwcml2YXRlIHJlY29tbWVuZFNtYXBpKCkge1xuICAgIGNvbnN0IHNtYXBpTW9kID0gZmluZFNNQVBJTW9kKHRoaXMuY29udGV4dC5hcGkpO1xuICAgIGNvbnN0IHRpdGxlID0gc21hcGlNb2QgPyAnU01BUEkgaXMgbm90IGRlcGxveWVkJyA6ICdTTUFQSSBpcyBub3QgaW5zdGFsbGVkJztcbiAgICBjb25zdCBhY3Rpb25UaXRsZSA9IHNtYXBpTW9kID8gJ0RlcGxveScgOiAnR2V0IFNNQVBJJztcbiAgICBjb25zdCBhY3Rpb24gPSAoKSA9PiAoc21hcGlNb2RcbiAgICAgID8gZGVwbG95U01BUEkodGhpcy5jb250ZXh0LmFwaSlcbiAgICAgIDogZG93bmxvYWRTTUFQSSh0aGlzLmNvbnRleHQuYXBpKSlcbiAgICAgIC50aGVuKCgpID0+IHRoaXMuY29udGV4dC5hcGkuZGlzbWlzc05vdGlmaWNhdGlvbignc21hcGktbWlzc2luZycpKTtcblxuICAgIHRoaXMuY29udGV4dC5hcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgICBpZDogJ3NtYXBpLW1pc3NpbmcnLFxuICAgICAgdHlwZTogJ3dhcm5pbmcnLFxuICAgICAgdGl0bGUsXG4gICAgICBtZXNzYWdlOiAnU01BUEkgaXMgcmVxdWlyZWQgdG8gbW9kIFN0YXJkZXcgVmFsbGV5LicsXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgIHtcbiAgICAgICAgICB0aXRsZTogYWN0aW9uVGl0bGUsXG4gICAgICAgICAgYWN0aW9uLFxuICAgICAgICB9LFxuICAgICAgXVxuICAgIH0pO1xuICB9XG5cbiAgLyoqKioqKioqKlxuICAqKiBJbnRlcm5hbCBtZXRob2RzXG4gICoqKioqKioqKi9cblxuICAvKipcbiAgICogQXN5bmNocm9ub3VzbHkgY2hlY2sgd2hldGhlciBhIGZpbGUgb3IgZGlyZWN0b3J5IHBhdGggZXhpc3RzLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIFRoZSBmaWxlIG9yIGRpcmVjdG9yeSBwYXRoLlxuICAgKi9cbiAgYXN5bmMgZ2V0UGF0aEV4aXN0c0FzeW5jKHBhdGgpXG4gIHtcbiAgICB0cnkge1xuICAgICBhd2FpdCBmcy5zdGF0QXN5bmMocGF0aCk7XG4gICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjYXRjaChlcnIpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQXN5bmNocm9ub3VzbHkgcmVhZCBhIHJlZ2lzdHJ5IGtleSB2YWx1ZS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGhpdmUgLSBUaGUgcmVnaXN0cnkgaGl2ZSB0byBhY2Nlc3MuIFRoaXMgc2hvdWxkIGJlIGEgY29uc3RhbnQgbGlrZSBSZWdpc3RyeS5IS0xNLlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IC0gVGhlIHJlZ2lzdHJ5IGtleS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgdmFsdWUgdG8gcmVhZC5cbiAgICovXG4gIGFzeW5jIHJlYWRSZWdpc3RyeUtleUFzeW5jKGhpdmUsIGtleSwgbmFtZSlcbiAge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBpbnN0UGF0aCA9IHdpbmFwaS5SZWdHZXRWYWx1ZShoaXZlLCBrZXksIG5hbWUpO1xuICAgICAgaWYgKCFpbnN0UGF0aCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2VtcHR5IHJlZ2lzdHJ5IGtleScpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShpbnN0UGF0aC52YWx1ZSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHRlc3RSb290Rm9sZGVyKGZpbGVzLCBnYW1lSWQpIHtcbiAgLy8gV2UgYXNzdW1lIHRoYXQgYW55IG1vZCBjb250YWluaW5nIFwiL0NvbnRlbnQvXCIgaW4gaXRzIGRpcmVjdG9yeVxuICAvLyAgc3RydWN0dXJlIGlzIG1lYW50IHRvIGJlIGRlcGxveWVkIHRvIHRoZSByb290IGZvbGRlci5cbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiBmaWxlLmVuZHNXaXRoKHBhdGguc2VwKSlcbiAgICAubWFwKGZpbGUgPT4gcGF0aC5qb2luKCdmYWtlRGlyJywgZmlsZSkpO1xuICBjb25zdCBjb250ZW50RGlyID0gZmlsdGVyZWQuZmluZChmaWxlID0+IGZpbGUuZW5kc1dpdGgoUFRSTl9DT05URU5UKSk7XG4gIGNvbnN0IHN1cHBvcnRlZCA9ICgoZ2FtZUlkID09PSBHQU1FX0lEKVxuICAgICYmIChjb250ZW50RGlyICE9PSB1bmRlZmluZWQpKTtcblxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7IHN1cHBvcnRlZCwgcmVxdWlyZWRGaWxlczogW10gfSk7XG59XG5cbmZ1bmN0aW9uIGluc3RhbGxSb290Rm9sZGVyKGZpbGVzLCBkZXN0aW5hdGlvblBhdGgpIHtcbiAgLy8gV2UncmUgZ29pbmcgdG8gZGVwbG95IFwiL0NvbnRlbnQvXCIgYW5kIHdoYXRldmVyIGZvbGRlcnMgY29tZSBhbG9uZ3NpZGUgaXQuXG4gIC8vICBpLmUuIFNvbWVNb2QuN3pcbiAgLy8gIFdpbGwgYmUgZGVwbG95ZWQgICAgID0+IC4uL1NvbWVNb2QvQ29udGVudC9cbiAgLy8gIFdpbGwgYmUgZGVwbG95ZWQgICAgID0+IC4uL1NvbWVNb2QvTW9kcy9cbiAgLy8gIFdpbGwgTk9UIGJlIGRlcGxveWVkID0+IC4uL1JlYWRtZS5kb2NcbiAgY29uc3QgY29udGVudEZpbGUgPSBmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5qb2luKCdmYWtlRGlyJywgZmlsZSkuZW5kc1dpdGgoUFRSTl9DT05URU5UKSk7XG4gIGNvbnN0IGlkeCA9IGNvbnRlbnRGaWxlLmluZGV4T2YoUFRSTl9DT05URU5UKSArIDE7XG4gIGNvbnN0IHJvb3REaXIgPSBwYXRoLmJhc2VuYW1lKGNvbnRlbnRGaWxlLnN1YnN0cmluZygwLCBpZHgpKTtcbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiAhZmlsZS5lbmRzV2l0aChwYXRoLnNlcClcbiAgICAmJiAoZmlsZS5pbmRleE9mKHJvb3REaXIpICE9PSAtMSlcbiAgICAmJiAocGF0aC5leHRuYW1lKGZpbGUpICE9PSAnLnR4dCcpKTtcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zID0gZmlsdGVyZWQubWFwKGZpbGUgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnY29weScsXG4gICAgICBzb3VyY2U6IGZpbGUsXG4gICAgICBkZXN0aW5hdGlvbjogZmlsZS5zdWJzdHIoaWR4KSxcbiAgICB9O1xuICB9KTtcblxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcbn1cblxuZnVuY3Rpb24gaXNWYWxpZE1hbmlmZXN0KGZpbGVQYXRoKSB7XG4gIGNvbnN0IHNlZ21lbnRzID0gZmlsZVBhdGgudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCk7XG4gIGNvbnN0IGlzTWFuaWZlc3RGaWxlID0gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV0gPT09IE1BTklGRVNUX0ZJTEU7XG4gIGNvbnN0IGlzTG9jYWxlID0gc2VnbWVudHMuaW5jbHVkZXMoJ2xvY2FsZScpO1xuICByZXR1cm4gaXNNYW5pZmVzdEZpbGUgJiYgIWlzTG9jYWxlO1xufVxuXG5mdW5jdGlvbiB0ZXN0U3VwcG9ydGVkKGZpbGVzLCBnYW1lSWQpIHtcbiAgY29uc3Qgc3VwcG9ydGVkID0gKGdhbWVJZCA9PT0gR0FNRV9JRClcbiAgICAmJiAoZmlsZXMuZmluZChpc1ZhbGlkTWFuaWZlc3QpICE9PSB1bmRlZmluZWQpXG4gICAgJiYgKGZpbGVzLmZpbmQoZmlsZSA9PiB7XG4gICAgICAvLyBXZSBjcmVhdGUgYSBwcmVmaXggZmFrZSBkaXJlY3RvcnkganVzdCBpbiBjYXNlIHRoZSBjb250ZW50XG4gICAgICAvLyAgZm9sZGVyIGlzIGluIHRoZSBhcmNoaXZlJ3Mgcm9vdCBmb2xkZXIuIFRoaXMgaXMgdG8gZW5zdXJlIHdlXG4gICAgICAvLyAgZmluZCBhIG1hdGNoIGZvciBcIi9Db250ZW50L1wiXG4gICAgICBjb25zdCB0ZXN0RmlsZSA9IHBhdGguam9pbignZmFrZURpcicsIGZpbGUpO1xuICAgICAgcmV0dXJuICh0ZXN0RmlsZS5lbmRzV2l0aChQVFJOX0NPTlRFTlQpKTtcbiAgICB9KSA9PT0gdW5kZWZpbmVkKTtcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoeyBzdXBwb3J0ZWQsIHJlcXVpcmVkRmlsZXM6IFtdIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbnN0YWxsKGFwaSxcbiAgICAgICAgICAgICAgICAgICAgICAgZGVwZW5kZW5jeU1hbmFnZXIsXG4gICAgICAgICAgICAgICAgICAgICAgIGZpbGVzLFxuICAgICAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvblBhdGgpIHtcbiAgLy8gVGhlIGFyY2hpdmUgbWF5IGNvbnRhaW4gbXVsdGlwbGUgbWFuaWZlc3QgZmlsZXMgd2hpY2ggd291bGRcbiAgLy8gIGltcGx5IHRoYXQgd2UncmUgaW5zdGFsbGluZyBtdWx0aXBsZSBtb2RzLlxuICBjb25zdCBtYW5pZmVzdEZpbGVzID0gZmlsZXMuZmlsdGVyKGlzVmFsaWRNYW5pZmVzdCk7XG5cbiAgaW50ZXJmYWNlIElNb2RJbmZvIHtcbiAgICBtYW5pZmVzdDogSVNEVk1vZE1hbmlmZXN0O1xuICAgIHJvb3RGb2xkZXI6IHN0cmluZztcbiAgICBtYW5pZmVzdEluZGV4OiBudW1iZXI7XG4gICAgbW9kRmlsZXM6IHN0cmluZ1tdO1xuICB9XG5cbiAgbGV0IHBhcnNlRXJyb3I6IEVycm9yO1xuXG4gIGF3YWl0IGRlcGVuZGVuY3lNYW5hZ2VyLnNjYW5NYW5pZmVzdHModHJ1ZSk7XG4gIGxldCBtb2RzOiBJTW9kSW5mb1tdID0gYXdhaXQgUHJvbWlzZS5hbGwobWFuaWZlc3RGaWxlcy5tYXAoYXN5bmMgbWFuaWZlc3RGaWxlID0+IHtcbiAgICBjb25zdCByb290Rm9sZGVyID0gcGF0aC5kaXJuYW1lKG1hbmlmZXN0RmlsZSk7XG4gICAgY29uc3QgbWFuaWZlc3RJbmRleCA9IG1hbmlmZXN0RmlsZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoTUFOSUZFU1RfRklMRSk7XG4gICAgY29uc3QgZmlsdGVyRnVuYyA9IChmaWxlKSA9PiAocm9vdEZvbGRlciAhPT0gJy4nKVxuICAgICAgPyAoKGZpbGUuaW5kZXhPZihyb290Rm9sZGVyKSAhPT0gLTEpXG4gICAgICAgICYmIChwYXRoLmRpcm5hbWUoZmlsZSkgIT09ICcuJylcbiAgICAgICAgJiYgIWZpbGUuZW5kc1dpdGgocGF0aC5zZXApKVxuICAgICAgOiAhZmlsZS5lbmRzV2l0aChwYXRoLnNlcCk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1hbmlmZXN0OiBJU0RWTW9kTWFuaWZlc3QgPVxuICAgICAgICBhd2FpdCBwYXJzZU1hbmlmZXN0KHBhdGguam9pbihkZXN0aW5hdGlvblBhdGgsIG1hbmlmZXN0RmlsZSkpO1xuICAgICAgY29uc3QgbW9kRmlsZXMgPSBmaWxlcy5maWx0ZXIoZmlsdGVyRnVuYyk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBtYW5pZmVzdCxcbiAgICAgICAgcm9vdEZvbGRlcixcbiAgICAgICAgbWFuaWZlc3RJbmRleCxcbiAgICAgICAgbW9kRmlsZXMsXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgLy8ganVzdCBhIHdhcm5pbmcgYXQgdGhpcyBwb2ludCBhcyB0aGlzIG1heSBub3QgYmUgdGhlIG1haW4gbWFuaWZlc3QgZm9yIHRoZSBtb2RcbiAgICAgIGxvZygnd2FybicsICdGYWlsZWQgdG8gcGFyc2UgbWFuaWZlc3QnLCB7IG1hbmlmZXN0RmlsZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgcGFyc2VFcnJvciA9IGVycjtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICB9KSk7XG5cbiAgbW9kcyA9IG1vZHMuZmlsdGVyKHggPT4geCAhPT0gdW5kZWZpbmVkKTtcblxuICBpZiAobW9kcy5sZW5ndGggPT09IDApIHtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKFxuICAgICAgJ1RoZSBtb2QgbWFuaWZlc3QgaXMgaW52YWxpZCBhbmQgY2FuXFwndCBiZSByZWFkLiBZb3UgY2FuIHRyeSB0byBpbnN0YWxsIHRoZSBtb2QgYW55d2F5IHZpYSByaWdodC1jbGljayAtPiBcIlVucGFjayAoYXMtaXMpXCInLFxuICAgICAgcGFyc2VFcnJvciwge1xuICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIEJsdWViaXJkLm1hcChtb2RzLCBtb2QgPT4ge1xuICAgIGNvbnN0IG1vZE5hbWUgPSAobW9kLnJvb3RGb2xkZXIgIT09ICcuJylcbiAgICAgID8gbW9kLnJvb3RGb2xkZXJcbiAgICAgIDogbW9kLm1hbmlmZXN0Lk5hbWU7XG5cbiAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBtb2QubWFuaWZlc3QuRGVwZW5kZW5jaWVzIHx8IFtdO1xuXG4gICAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIG1vZC5tb2RGaWxlcykge1xuICAgICAgY29uc3QgZGVzdGluYXRpb24gPSBwYXRoLmpvaW4obW9kTmFtZSwgZmlsZS5zdWJzdHIobW9kLm1hbmlmZXN0SW5kZXgpKTtcbiAgICAgIGluc3RydWN0aW9ucy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2NvcHknLFxuICAgICAgICBzb3VyY2U6IGZpbGUsXG4gICAgICAgIGRlc3RpbmF0aW9uOiBkZXN0aW5hdGlvbixcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGFkZFJ1bGVGb3JEZXBlbmRlbmN5ID0gKGRlcDogSVNEVkRlcGVuZGVuY3kpID0+IHtcbiAgICAgIGlmICgoZGVwLlVuaXF1ZUlEID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgfHwgKGRlcC5VbmlxdWVJRC50b0xvd2VyQ2FzZSgpID09PSAneW91cm5hbWUueW91cm90aGVyc3BhY2tzYW5kbW9kcycpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdmVyc2lvbk1hdGNoID0gZGVwLk1pbmltdW1WZXJzaW9uICE9PSB1bmRlZmluZWRcbiAgICAgICAgPyBgPj0ke2RlcC5NaW5pbXVtVmVyc2lvbn1gXG4gICAgICAgIDogJyonO1xuICAgICAgY29uc3QgcnVsZTogdHlwZXMuSU1vZFJ1bGUgPSB7XG4gICAgICAgIC8vIHRyZWF0aW5nIGFsbCBkZXBlbmRlbmNpZXMgYXMgcmVjb21tZW5kYXRpb25zIGJlY2F1c2UgdGhlIGRlcGVuZGVuY3kgaW5mb3JtYXRpb25cbiAgICAgICAgLy8gcHJvdmlkZWQgYnkgc29tZSBtb2QgYXV0aG9ycyBpcyBhIGJpdCBoaXQtYW5kLW1pc3MgYW5kIFZvcnRleCBmYWlybHkgYWdncmVzc2l2ZWx5XG4gICAgICAgIC8vIGVuZm9yY2VzIHJlcXVpcmVtZW50c1xuICAgICAgICAvLyB0eXBlOiAoZGVwLklzUmVxdWlyZWQgPz8gdHJ1ZSkgPyAncmVxdWlyZXMnIDogJ3JlY29tbWVuZHMnLFxuICAgICAgICB0eXBlOiAncmVjb21tZW5kcycsXG4gICAgICAgIHJlZmVyZW5jZToge1xuICAgICAgICAgIGxvZ2ljYWxGaWxlTmFtZTogZGVwLlVuaXF1ZUlELnRvTG93ZXJDYXNlKCksXG4gICAgICAgICAgdmVyc2lvbk1hdGNoLFxuICAgICAgICB9LFxuICAgICAgICBleHRyYToge1xuICAgICAgICAgIG9ubHlJZkZ1bGZpbGxhYmxlOiB0cnVlLFxuICAgICAgICAgIGF1dG9tYXRpYzogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgICBpbnN0cnVjdGlvbnMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdydWxlJyxcbiAgICAgICAgcnVsZSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChhcGkuZ2V0U3RhdGUoKS5zZXR0aW5nc1snU0RWJ10/LnVzZVJlY29tbWVuZGF0aW9ucyA/PyBmYWxzZSkge1xuICAgICAgZm9yIChjb25zdCBkZXAgb2YgZGVwZW5kZW5jaWVzKSB7XG4gICAgICAgIGFkZFJ1bGVGb3JEZXBlbmRlbmN5KGRlcCk7XG4gICAgICB9XG4gICAgICBpZiAobW9kLm1hbmlmZXN0LkNvbnRlbnRQYWNrRm9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYWRkUnVsZUZvckRlcGVuZGVuY3kobW9kLm1hbmlmZXN0LkNvbnRlbnRQYWNrRm9yKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGluc3RydWN0aW9ucztcbiAgfSlcbiAgICAudGhlbihkYXRhID0+IHtcbiAgICAgIGNvbnN0IGluc3RydWN0aW9ucyA9IFtdLmNvbmNhdChkYXRhKS5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PiBhY2N1bS5jb25jYXQoaXRlciksIFtdKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGlzU01BUElNb2RUeXBlKGluc3RydWN0aW9ucykge1xuICAvLyBGaW5kIHRoZSBTTUFQSSBleGUgZmlsZS5cbiAgY29uc3Qgc21hcGlEYXRhID0gaW5zdHJ1Y3Rpb25zLmZpbmQoaW5zdCA9PiAoaW5zdC50eXBlID09PSAnY29weScpICYmIGluc3Quc291cmNlLmVuZHNXaXRoKFNNQVBJX0VYRSkpO1xuXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHNtYXBpRGF0YSAhPT0gdW5kZWZpbmVkKTtcbn1cblxuZnVuY3Rpb24gdGVzdFNNQVBJKGZpbGVzLCBnYW1lSWQpIHtcbiAgLy8gTWFrZSBzdXJlIHRoZSBkb3dubG9hZCBjb250YWlucyB0aGUgU01BUEkgZGF0YSBhcmNoaXZlLnNcbiAgY29uc3Qgc3VwcG9ydGVkID0gKGdhbWVJZCA9PT0gR0FNRV9JRCkgJiYgKGZpbGVzLmZpbmQoZmlsZSA9PlxuICAgIHBhdGguYmFzZW5hbWUoZmlsZSkgPT09IFNNQVBJX0RMTCkgIT09IHVuZGVmaW5lZClcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoe1xuICAgICAgc3VwcG9ydGVkLFxuICAgICAgcmVxdWlyZWRGaWxlczogW10sXG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbnN0YWxsU01BUEkoZ2V0RGlzY292ZXJ5UGF0aCwgZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkge1xuICBjb25zdCBmb2xkZXIgPSBwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInXG4gICAgPyAnd2luZG93cydcbiAgICA6IHByb2Nlc3MucGxhdGZvcm0gPT09ICdsaW51eCdcbiAgICAgID8gJ2xpbnV4J1xuICAgICAgOiAnbWFjb3MnO1xuICBjb25zdCBmaWxlSGFzQ29ycmVjdFBsYXRmb3JtID0gKGZpbGUpID0+IHtcbiAgICBjb25zdCBzZWdtZW50cyA9IGZpbGUuc3BsaXQocGF0aC5zZXApLm1hcChzZWcgPT4gc2VnLnRvTG93ZXJDYXNlKCkpO1xuICAgIHJldHVybiAoc2VnbWVudHMuaW5jbHVkZXMoZm9sZGVyKSk7XG4gIH1cbiAgLy8gRmluZCB0aGUgU01BUEkgZGF0YSBhcmNoaXZlXG4gIGNvbnN0IGRhdGFGaWxlID0gZmlsZXMuZmluZChmaWxlID0+IHtcbiAgICBjb25zdCBpc0NvcnJlY3RQbGF0Zm9ybSA9IGZpbGVIYXNDb3JyZWN0UGxhdGZvcm0oZmlsZSk7XG4gICAgcmV0dXJuIGlzQ29ycmVjdFBsYXRmb3JtICYmIFNNQVBJX0RBVEEuaW5jbHVkZXMocGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpKVxuICB9KTtcbiAgaWYgKGRhdGFGaWxlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoJ0ZhaWxlZCB0byBmaW5kIHRoZSBTTUFQSSBkYXRhIGZpbGVzIC0gZG93bmxvYWQgYXBwZWFycyAnXG4gICAgICArICd0byBiZSBjb3JydXB0ZWQ7IHBsZWFzZSByZS1kb3dubG9hZCBTTUFQSSBhbmQgdHJ5IGFnYWluJykpO1xuICB9XG4gIGxldCBkYXRhID0gJyc7XG4gIHRyeSB7XG4gICAgZGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKGdldERpc2NvdmVyeVBhdGgoKSwgJ1N0YXJkZXcgVmFsbGV5LmRlcHMuanNvbicpLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHBhcnNlIFNEViBkZXBlbmRlbmNpZXMnLCBlcnIpO1xuICB9XG5cbiAgLy8gZmlsZSB3aWxsIGJlIG91dGRhdGVkIGFmdGVyIHRoZSB3YWxrIG9wZXJhdGlvbiBzbyBwcmVwYXJlIGEgcmVwbGFjZW1lbnQuXG4gIGNvbnN0IHVwZGF0ZWRGaWxlcyA9IFtdO1xuXG4gIGNvbnN0IHN6aXAgPSBuZXcgU2V2ZW5aaXAoKTtcbiAgLy8gVW56aXAgdGhlIGZpbGVzIGZyb20gdGhlIGRhdGEgYXJjaGl2ZS4gVGhpcyBkb2Vzbid0IHNlZW0gdG8gYmVoYXZlIGFzIGRlc2NyaWJlZCBoZXJlOiBodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS9ub2RlLTd6I2V2ZW50c1xuICBhd2FpdCBzemlwLmV4dHJhY3RGdWxsKHBhdGguam9pbihkZXN0aW5hdGlvblBhdGgsIGRhdGFGaWxlKSwgZGVzdGluYXRpb25QYXRoKTtcblxuICAvLyBGaW5kIGFueSBmaWxlcyB0aGF0IGFyZSBub3QgaW4gdGhlIHBhcmVudCBmb2xkZXIuXG4gIGF3YWl0IHV0aWwud2FsayhkZXN0aW5hdGlvblBhdGgsIChpdGVyLCBzdGF0cykgPT4ge1xuICAgICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUoZGVzdGluYXRpb25QYXRoLCBpdGVyKTtcbiAgICAgIC8vIEZpbHRlciBvdXQgZmlsZXMgZnJvbSB0aGUgb3JpZ2luYWwgaW5zdGFsbCBhcyB0aGV5J3JlIG5vIGxvbmdlciByZXF1aXJlZC5cbiAgICAgIGlmICghZmlsZXMuaW5jbHVkZXMocmVsUGF0aCkgJiYgc3RhdHMuaXNGaWxlKCkgJiYgIWZpbGVzLmluY2x1ZGVzKHJlbFBhdGgrcGF0aC5zZXApKSB1cGRhdGVkRmlsZXMucHVzaChyZWxQYXRoKTtcbiAgICAgIGNvbnN0IHNlZ21lbnRzID0gcmVsUGF0aC50b0xvY2FsZUxvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKTtcbiAgICAgIGNvbnN0IG1vZHNGb2xkZXJJZHggPSBzZWdtZW50cy5pbmRleE9mKCdtb2RzJyk7XG4gICAgICBpZiAoKG1vZHNGb2xkZXJJZHggIT09IC0xKSAmJiAoc2VnbWVudHMubGVuZ3RoID4gbW9kc0ZvbGRlcklkeCArIDEpKSB7XG4gICAgICAgIF9TTUFQSV9CVU5ETEVEX01PRFMucHVzaChzZWdtZW50c1ttb2RzRm9sZGVySWR4ICsgMV0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKTtcbiAgfSk7XG5cbiAgLy8gRmluZCB0aGUgU01BUEkgZXhlIGZpbGUuXG4gIGNvbnN0IHNtYXBpRXhlID0gdXBkYXRlZEZpbGVzLmZpbmQoZmlsZSA9PiBmaWxlLnRvTG93ZXJDYXNlKCkuZW5kc1dpdGgoU01BUElfRVhFLnRvTG93ZXJDYXNlKCkpKTtcbiAgaWYgKHNtYXBpRXhlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoYEZhaWxlZCB0byBleHRyYWN0ICR7U01BUElfRVhFfSAtIGRvd25sb2FkIGFwcGVhcnMgYFxuICAgICAgKyAndG8gYmUgY29ycnVwdGVkOyBwbGVhc2UgcmUtZG93bmxvYWQgU01BUEkgYW5kIHRyeSBhZ2FpbicpKTtcbiAgfVxuICBjb25zdCBpZHggPSBzbWFwaUV4ZS5pbmRleE9mKHBhdGguYmFzZW5hbWUoc21hcGlFeGUpKTtcblxuICAvLyBCdWlsZCB0aGUgaW5zdHJ1Y3Rpb25zIGZvciBpbnN0YWxsYXRpb24uXG4gIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPSB1cGRhdGVkRmlsZXMubWFwKGZpbGUgPT4ge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiAnY29weScsXG4gICAgICAgICAgc291cmNlOiBmaWxlLFxuICAgICAgICAgIGRlc3RpbmF0aW9uOiBwYXRoLmpvaW4oZmlsZS5zdWJzdHIoaWR4KSksXG4gICAgICB9XG4gIH0pO1xuXG4gIGluc3RydWN0aW9ucy5wdXNoKHtcbiAgICB0eXBlOiAnYXR0cmlidXRlJyxcbiAgICBrZXk6ICdzbWFwaUJ1bmRsZWRNb2RzJyxcbiAgICB2YWx1ZTogZ2V0QnVuZGxlZE1vZHMoKSxcbiAgfSk7XG5cbiAgaW5zdHJ1Y3Rpb25zLnB1c2goe1xuICAgIHR5cGU6ICdnZW5lcmF0ZWZpbGUnLFxuICAgIGRhdGEsXG4gICAgZGVzdGluYXRpb246ICdTdGFyZGV3TW9kZGluZ0FQSS5kZXBzLmpzb24nLFxuICB9KTtcblxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBzaG93U01BUElMb2coYXBpLCBiYXNlUGF0aCwgbG9nRmlsZSkge1xuICBjb25zdCBsb2dEYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhwYXRoLmpvaW4oYmFzZVBhdGgsIGxvZ0ZpbGUpLCB7IGVuY29kaW5nOiAndXRmLTgnIH0pO1xuICBhd2FpdCBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdTTUFQSSBMb2cnLCB7XG4gICAgdGV4dDogJ1lvdXIgU01BUEkgbG9nIGlzIGRpc3BsYXllZCBiZWxvdy4gVG8gc2hhcmUgaXQsIGNsaWNrIFwiQ29weSAmIFNoYXJlXCIgd2hpY2ggd2lsbCBjb3B5IGl0IHRvIHlvdXIgY2xpcGJvYXJkIGFuZCBvcGVuIHRoZSBTTUFQSSBsb2cgc2hhcmluZyB3ZWJzaXRlLiAnICtcbiAgICAgICdOZXh0LCBwYXN0ZSB5b3VyIGNvZGUgaW50byB0aGUgdGV4dCBib3ggYW5kIHByZXNzIFwic2F2ZSAmIHBhcnNlIGxvZ1wiLiBZb3UgY2FuIG5vdyBzaGFyZSBhIGxpbmsgdG8gdGhpcyBwYWdlIHdpdGggb3RoZXJzIHNvIHRoZXkgY2FuIHNlZSB5b3VyIGxvZyBmaWxlLlxcblxcbicgKyBsb2dEYXRhXG4gIH0sIFt7XG4gICAgbGFiZWw6ICdDb3B5ICYgU2hhcmUgbG9nJywgYWN0aW9uOiAoKSA9PiB7XG4gICAgICBjb25zdCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkucmVwbGFjZSgvXi4rVChbXlxcLl0rKS4rLywgJyQxJyk7XG4gICAgICBjbGlwYm9hcmQud3JpdGVUZXh0KGBbJHt0aW1lc3RhbXB9IElORk8gVm9ydGV4XSBMb2cgZXhwb3J0ZWQgYnkgVm9ydGV4ICR7dXRpbC5nZXRBcHBsaWNhdGlvbigpLnZlcnNpb259LlxcbmAgKyBsb2dEYXRhKTtcbiAgICAgIHJldHVybiB1dGlsLm9wbignaHR0cHM6Ly9zbWFwaS5pby9sb2cnKS5jYXRjaChlcnIgPT4gdW5kZWZpbmVkKTtcbiAgICB9XG4gIH0sIHsgbGFiZWw6ICdDbG9zZScsIGFjdGlvbjogKCkgPT4gdW5kZWZpbmVkIH1dKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gb25TaG93U01BUElMb2coYXBpKSB7XG4gIC8vUmVhZCBhbmQgZGlzcGxheSB0aGUgbG9nLlxuICBjb25zdCBiYXNlUGF0aCA9IHBhdGguam9pbih1dGlsLmdldFZvcnRleFBhdGgoJ2FwcERhdGEnKSwgJ3N0YXJkZXd2YWxsZXknLCAnZXJyb3Jsb2dzJyk7XG4gIHRyeSB7XG4gICAgLy9JZiB0aGUgY3Jhc2ggbG9nIGV4aXN0cywgc2hvdyB0aGF0LlxuICAgIGF3YWl0IHNob3dTTUFQSUxvZyhhcGksIGJhc2VQYXRoLCBcIlNNQVBJLWNyYXNoLnR4dFwiKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdHJ5IHtcbiAgICAgIC8vT3RoZXJ3aXNlIHNob3cgdGhlIG5vcm1hbCBsb2cuXG4gICAgICBhd2FpdCBzaG93U01BUElMb2coYXBpLCBiYXNlUGF0aCwgXCJTTUFQSS1sYXRlc3QudHh0XCIpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgLy9PciBJbmZvcm0gdGhlIHVzZXIgdGhlcmUgYXJlIG5vIGxvZ3MuXG4gICAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7IHR5cGU6ICdpbmZvJywgdGl0bGU6ICdObyBTTUFQSSBsb2dzIGZvdW5kLicsIG1lc3NhZ2U6ICcnLCBkaXNwbGF5TVM6IDUwMDAgfSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGdldE1vZE1hbmlmZXN0cyhtb2RQYXRoPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICBjb25zdCBtYW5pZmVzdHM6IHN0cmluZ1tdID0gW107XG5cbiAgaWYgKG1vZFBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICB9XG5cbiAgcmV0dXJuIHR1cmJvd2Fsayhtb2RQYXRoLCBhc3luYyBlbnRyaWVzID0+IHtcbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICAgIGlmIChwYXRoLmJhc2VuYW1lKGVudHJ5LmZpbGVQYXRoKSA9PT0gJ21hbmlmZXN0Lmpzb24nKSB7XG4gICAgICAgIG1hbmlmZXN0cy5wdXNoKGVudHJ5LmZpbGVQYXRoKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHsgc2tpcEhpZGRlbjogZmFsc2UsIHJlY3Vyc2U6IHRydWUsIHNraXBJbmFjY2Vzc2libGU6IHRydWUsIHNraXBMaW5rczogdHJ1ZSB9KVxuICAgIC50aGVuKCgpID0+IG1hbmlmZXN0cyk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUNvbmZsaWN0SW5mbyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc21hcGk6IFNNQVBJUHJveHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kSWQ6IHN0cmluZylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBtb2QgPSBhcGkuZ2V0U3RhdGUoKS5wZXJzaXN0ZW50Lm1vZHNbZ2FtZUlkXVttb2RJZF07XG5cbiAgaWYgKG1vZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG5cbiAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcblxuICBpZiAoKG5vdyAtIG1vZC5hdHRyaWJ1dGVzPy5sYXN0U01BUElRdWVyeSA/PyAwKSA8IFNNQVBJX1FVRVJZX0ZSRVFVRU5DWSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIGxldCBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcyA9IG1vZC5hdHRyaWJ1dGVzPy5hZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcztcbiAgaWYgKCFhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcykge1xuICAgIGlmIChtb2QuYXR0cmlidXRlcz8ubG9naWNhbEZpbGVOYW1lKSB7XG4gICAgICBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcyA9IFttb2QuYXR0cmlidXRlcz8ubG9naWNhbEZpbGVOYW1lXTtcbiAgICB9IGVsc2Uge1xuICAgICAgYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXMgPSBbXTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBxdWVyeSA9IGFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzXG4gICAgLm1hcChuYW1lID0+IHtcbiAgICAgIGNvbnN0IHJlcyA9IHtcbiAgICAgICAgaWQ6IG5hbWUsXG4gICAgICB9O1xuICAgICAgY29uc3QgdmVyID0gbW9kLmF0dHJpYnV0ZXM/Lm1hbmlmZXN0VmVyc2lvblxuICAgICAgICAgICAgICAgICAgICAgPz8gc2VtdmVyLmNvZXJjZShtb2QuYXR0cmlidXRlcz8udmVyc2lvbik/LnZlcnNpb247XG4gICAgICBpZiAoISF2ZXIpIHtcbiAgICAgICAgcmVzWydpbnN0YWxsZWRWZXJzaW9uJ10gPSB2ZXI7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXM7XG4gICAgfSk7XG5cbiAgY29uc3Qgc3RhdCA9IChpdGVtOiBJU01BUElSZXN1bHQpOiBDb21wYXRpYmlsaXR5U3RhdHVzID0+IHtcbiAgICBjb25zdCBzdGF0dXMgPSBpdGVtLm1ldGFkYXRhPy5jb21wYXRpYmlsaXR5U3RhdHVzPy50b0xvd2VyQ2FzZT8uKCk7XG4gICAgaWYgKCFjb21wYXRpYmlsaXR5T3B0aW9ucy5pbmNsdWRlcyhzdGF0dXMgYXMgYW55KSkge1xuICAgICAgcmV0dXJuICd1bmtub3duJztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHN0YXR1cyBhcyBDb21wYXRpYmlsaXR5U3RhdHVzO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBjb21wYXRpYmlsaXR5UHJpbyA9IChpdGVtOiBJU01BUElSZXN1bHQpID0+IGNvbXBhdGliaWxpdHlPcHRpb25zLmluZGV4T2Yoc3RhdChpdGVtKSk7XG5cbiAgcmV0dXJuIHNtYXBpLmZpbmRCeU5hbWVzKHF1ZXJ5KVxuICAgIC50aGVuKHJlc3VsdHMgPT4ge1xuICAgICAgY29uc3Qgd29yc3RTdGF0dXM6IElTTUFQSVJlc3VsdFtdID0gcmVzdWx0c1xuICAgICAgICAuc29ydCgobGhzLCByaHMpID0+IGNvbXBhdGliaWxpdHlQcmlvKGxocykgLSBjb21wYXRpYmlsaXR5UHJpbyhyaHMpKTtcbiAgICAgIGlmICh3b3JzdFN0YXR1cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZXMoZ2FtZUlkLCBtb2RJZCwge1xuICAgICAgICAgIGxhc3RTTUFQSVF1ZXJ5OiBub3csXG4gICAgICAgICAgY29tcGF0aWJpbGl0eVN0YXR1czogd29yc3RTdGF0dXNbMF0ubWV0YWRhdGEuY29tcGF0aWJpbGl0eVN0YXR1cyxcbiAgICAgICAgICBjb21wYXRpYmlsaXR5TWVzc2FnZTogd29yc3RTdGF0dXNbMF0ubWV0YWRhdGEuY29tcGF0aWJpbGl0eVN1bW1hcnksXG4gICAgICAgICAgY29tcGF0aWJpbGl0eVVwZGF0ZTogd29yc3RTdGF0dXNbMF0uc3VnZ2VzdGVkVXBkYXRlPy52ZXJzaW9uLFxuICAgICAgICB9KSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsb2coJ2RlYnVnJywgJ25vIG1hbmlmZXN0Jyk7XG4gICAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShnYW1lSWQsIG1vZElkLCAnbGFzdFNNQVBJUXVlcnknLCBub3cpKTtcbiAgICAgIH1cbiAgICB9KVxuICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgbG9nKCd3YXJuJywgJ2Vycm9yIHJlYWRpbmcgbWFuaWZlc3QnLCBlcnIubWVzc2FnZSk7XG4gICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUoZ2FtZUlkLCBtb2RJZCwgJ2xhc3RTTUFQSVF1ZXJ5Jywgbm93KSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGluaXQoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcbiAgbGV0IGRlcGVuZGVuY3lNYW5hZ2VyOiBEZXBlbmRlbmN5TWFuYWdlcjtcbiAgY29uc3QgZ2V0RGlzY292ZXJ5UGF0aCA9ICgpID0+IHtcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gICAgY29uc3QgZGlzY292ZXJ5ID0gc3RhdGU/LnNldHRpbmdzPy5nYW1lTW9kZT8uZGlzY292ZXJlZD8uW0dBTUVfSURdO1xuICAgIGlmICgoZGlzY292ZXJ5ID09PSB1bmRlZmluZWQpIHx8IChkaXNjb3ZlcnkucGF0aCA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgLy8gc2hvdWxkIG5ldmVyIGhhcHBlbiBhbmQgaWYgaXQgZG9lcyBpdCB3aWxsIGNhdXNlIGVycm9ycyBlbHNld2hlcmUgYXMgd2VsbFxuICAgICAgbG9nKCdlcnJvcicsICdzdGFyZGV3dmFsbGV5IHdhcyBub3QgZGlzY292ZXJlZCcpO1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICByZXR1cm4gZGlzY292ZXJ5LnBhdGg7XG4gIH1cblxuICBjb25zdCBnZXRTTUFQSVBhdGggPSAoZ2FtZSkgPT4ge1xuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBkaXNjb3ZlcnkgPSBzdGF0ZS5zZXR0aW5ncy5nYW1lTW9kZS5kaXNjb3ZlcmVkW2dhbWUuaWRdO1xuICAgIHJldHVybiBkaXNjb3ZlcnkucGF0aDtcbiAgfTtcblxuICBjb25zdCBpc01vZENhbmRpZGF0ZVZhbGlkID0gKG1vZCwgZW50cnkpID0+IHtcbiAgICBpZiAobW9kPy5pZCA9PT0gdW5kZWZpbmVkIHx8IG1vZC50eXBlID09PSAnc2R2cm9vdGZvbGRlcicpIHtcbiAgICAgIC8vIFRoZXJlIGlzIG5vIHJlbGlhYmxlIHdheSB0byBhc2NlcnRhaW4gd2hldGhlciBhIG5ldyBmaWxlIGVudHJ5XG4gICAgICAvLyAgYWN0dWFsbHkgYmVsb25ncyB0byBhIHJvb3QgbW9kVHlwZSBhcyBzb21lIG9mIHRoZXNlIG1vZHMgd2lsbCBhY3RcbiAgICAgIC8vICBhcyByZXBsYWNlbWVudCBtb2RzLiBUaGlzIG9idmlvdXNseSBtZWFucyB0aGF0IGlmIHRoZSBnYW1lIGhhc1xuICAgICAgLy8gIGEgc3Vic3RhbnRpYWwgdXBkYXRlIHdoaWNoIGludHJvZHVjZXMgbmV3IGZpbGVzIHdlIGNvdWxkIHBvdGVudGlhbGx5XG4gICAgICAvLyAgYWRkIGEgdmFuaWxsYSBnYW1lIGZpbGUgaW50byB0aGUgbW9kJ3Mgc3RhZ2luZyBmb2xkZXIgY2F1c2luZyBjb25zdGFudFxuICAgICAgLy8gIGNvbnRlbnRpb24gYmV0d2VlbiB0aGUgZ2FtZSBpdHNlbGYgKHdoZW4gaXQgdXBkYXRlcykgYW5kIHRoZSBtb2QuXG4gICAgICAvL1xuICAgICAgLy8gVGhlcmUgaXMgYWxzbyBhIHBvdGVudGlhbCBjaGFuY2UgZm9yIHJvb3QgbW9kVHlwZXMgdG8gY29uZmxpY3Qgd2l0aCByZWd1bGFyXG4gICAgICAvLyAgbW9kcywgd2hpY2ggaXMgd2h5IGl0J3Mgbm90IHNhZmUgdG8gYXNzdW1lIHRoYXQgYW55IGFkZGl0aW9uIGluc2lkZSB0aGVcbiAgICAgIC8vICBtb2RzIGRpcmVjdG9yeSBjYW4gYmUgc2FmZWx5IGFkZGVkIHRvIHRoaXMgbW9kJ3Mgc3RhZ2luZyBmb2xkZXIgZWl0aGVyLlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChtb2QudHlwZSAhPT0gJ1NNQVBJJykge1xuICAgICAgLy8gT3RoZXIgbW9kIHR5cGVzIGRvIG5vdCByZXF1aXJlIGZ1cnRoZXIgdmFsaWRhdGlvbiAtIGl0IHNob3VsZCBiZSBmaW5lXG4gICAgICAvLyAgdG8gYWRkIHRoaXMgZW50cnkuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBjb25zdCBzZWdtZW50cyA9IGVudHJ5LmZpbGVQYXRoLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApLmZpbHRlcihzZWcgPT4gISFzZWcpO1xuICAgIGNvbnN0IG1vZHNTZWdJZHggPSBzZWdtZW50cy5pbmRleE9mKCdtb2RzJyk7XG4gICAgY29uc3QgbW9kRm9sZGVyTmFtZSA9ICgobW9kc1NlZ0lkeCAhPT0gLTEpICYmIChzZWdtZW50cy5sZW5ndGggPiBtb2RzU2VnSWR4ICsgMSkpXG4gICAgICA/IHNlZ21lbnRzW21vZHNTZWdJZHggKyAxXSA6IHVuZGVmaW5lZDtcblxuICAgIGxldCBidW5kbGVkTW9kcyA9IG1vZD8uYXR0cmlidXRlcz8uc21hcGlCdW5kbGVkTW9kcyA/PyBbXTtcbiAgICBidW5kbGVkTW9kcyA9IGJ1bmRsZWRNb2RzLmxlbmd0aCA+IDAgPyBidW5kbGVkTW9kcyA6IGdldEJ1bmRsZWRNb2RzKCk7XG4gICAgaWYgKHNlZ21lbnRzLmluY2x1ZGVzKCdjb250ZW50JykpIHtcbiAgICAgIC8vIFNNQVBJIGlzIG5vdCBzdXBwb3NlZCB0byBvdmVyd3JpdGUgdGhlIGdhbWUncyBjb250ZW50IGRpcmVjdGx5LlxuICAgICAgLy8gIHRoaXMgaXMgY2xlYXJseSBub3QgYSBTTUFQSSBmaWxlIGFuZCBzaG91bGQgX25vdF8gYmUgYWRkZWQgdG8gaXQuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIChtb2RGb2xkZXJOYW1lICE9PSB1bmRlZmluZWQpICYmIGJ1bmRsZWRNb2RzLmluY2x1ZGVzKG1vZEZvbGRlck5hbWUpO1xuICB9O1xuXG4gIGNvbnN0IG1hbmlmZXN0RXh0cmFjdG9yID0gdG9CbHVlKFxuICAgIGFzeW5jIChtb2RJbmZvOiBhbnksIG1vZFBhdGg/OiBzdHJpbmcpOiBQcm9taXNlPHsgW2tleTogc3RyaW5nXTogYW55OyB9PiA9PiB7XG4gICAgICBpZiAoc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpKSAhPT0gR0FNRV9JRCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHt9KTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbWFuaWZlc3RzID0gYXdhaXQgZ2V0TW9kTWFuaWZlc3RzKG1vZFBhdGgpO1xuXG4gICAgICBjb25zdCBwYXJzZWRNYW5pZmVzdHMgPSAoYXdhaXQgUHJvbWlzZS5hbGwobWFuaWZlc3RzLm1hcChcbiAgICAgICAgYXN5bmMgbWFuaWZlc3QgPT4ge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgcGFyc2VNYW5pZmVzdChtYW5pZmVzdCk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBsb2coJ3dhcm4nLCAnRmFpbGVkIHRvIHBhcnNlIG1hbmlmZXN0JywgeyBtYW5pZmVzdEZpbGU6IG1hbmlmZXN0LCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkpKS5maWx0ZXIobWFuaWZlc3QgPT4gbWFuaWZlc3QgIT09IHVuZGVmaW5lZCk7XG5cbiAgICAgIGlmIChwYXJzZWRNYW5pZmVzdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe30pO1xuICAgICAgfVxuXG4gICAgICAvLyB3ZSBjYW4gb25seSB1c2Ugb25lIG1hbmlmZXN0IHRvIGdldCB0aGUgaWQgZnJvbVxuICAgICAgY29uc3QgcmVmTWFuaWZlc3QgPSBwYXJzZWRNYW5pZmVzdHNbMF07XG5cbiAgICAgIGNvbnN0IGFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzID0gcGFyc2VkTWFuaWZlc3RzXG4gICAgICAgIC5maWx0ZXIobWFuaWZlc3QgPT4gbWFuaWZlc3QuVW5pcXVlSUQgIT09IHVuZGVmaW5lZClcbiAgICAgICAgLm1hcChtYW5pZmVzdCA9PiBtYW5pZmVzdC5VbmlxdWVJRC50b0xvd2VyQ2FzZSgpKTtcblxuICAgICAgY29uc3QgbWluU01BUElWZXJzaW9uID0gcGFyc2VkTWFuaWZlc3RzXG4gICAgICAgIC5tYXAobWFuaWZlc3QgPT4gbWFuaWZlc3QuTWluaW11bUFwaVZlcnNpb24pXG4gICAgICAgIC5maWx0ZXIodmVyc2lvbiA9PiBzZW12ZXIudmFsaWQodmVyc2lvbikpXG4gICAgICAgIC5zb3J0KChsaHMsIHJocykgPT4gc2VtdmVyLmNvbXBhcmUocmhzLCBsaHMpKVswXTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0ge1xuICAgICAgICBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcyxcbiAgICAgICAgbWluU01BUElWZXJzaW9uLFxuICAgICAgfTtcblxuICAgICAgaWYgKHJlZk1hbmlmZXN0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gZG9uJ3Qgc2V0IGEgY3VzdG9tIGZpbGUgbmFtZSBmb3IgU01BUElcbiAgICAgICAgaWYgKG1vZEluZm8uZG93bmxvYWQubW9kSW5mbz8ubmV4dXM/Lmlkcz8ubW9kSWQgIT09IDI0MDApIHtcbiAgICAgICAgICByZXN1bHRbJ2N1c3RvbUZpbGVOYW1lJ10gPSByZWZNYW5pZmVzdC5OYW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiAocmVmTWFuaWZlc3QuVmVyc2lvbikgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgcmVzdWx0WydtYW5pZmVzdFZlcnNpb24nXSA9IHJlZk1hbmlmZXN0LlZlcnNpb247XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXN1bHQpO1xuICAgIH0pO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKG5ldyBTdGFyZGV3VmFsbGV5KGNvbnRleHQpKTtcbiAgY29udGV4dC5yZWdpc3RlclJlZHVjZXIoWydzZXR0aW5ncycsICdTRFYnXSwgc2R2UmVkdWNlcnMpO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJTZXR0aW5ncygnTW9kcycsIFNldHRpbmdzLCB1bmRlZmluZWQsICgpID0+XG4gICAgc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpKSA9PT0gR0FNRV9JRCwgNTApO1xuXG4gIC8vIFJlZ2lzdGVyIG91ciBTTUFQSSBtb2QgdHlwZSBhbmQgaW5zdGFsbGVyLiBOb3RlOiBUaGlzIGN1cnJlbnRseSBmbGFncyBhbiBlcnJvciBpbiBWb3J0ZXggb24gaW5zdGFsbGluZyBjb3JyZWN0bHkuXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3NtYXBpLWluc3RhbGxlcicsIDMwLCB0ZXN0U01BUEksIChmaWxlcywgZGVzdCkgPT4gQmx1ZWJpcmQucmVzb2x2ZShpbnN0YWxsU01BUEkoZ2V0RGlzY292ZXJ5UGF0aCwgZmlsZXMsIGRlc3QpKSk7XG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCdTTUFQSScsIDMwLCBnYW1lSWQgPT4gZ2FtZUlkID09PSBHQU1FX0lELCBnZXRTTUFQSVBhdGgsIGlzU01BUElNb2RUeXBlKTtcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignc3RhcmRldy12YWxsZXktaW5zdGFsbGVyJywgNTAsIHRlc3RTdXBwb3J0ZWQsXG4gICAgKGZpbGVzLCBkZXN0aW5hdGlvblBhdGgpID0+IEJsdWViaXJkLnJlc29sdmUoaW5zdGFsbChjb250ZXh0LmFwaSwgZGVwZW5kZW5jeU1hbmFnZXIsIGZpbGVzLCBkZXN0aW5hdGlvblBhdGgpKSk7XG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3NkdnJvb3Rmb2xkZXInLCA1MCwgdGVzdFJvb3RGb2xkZXIsIGluc3RhbGxSb290Rm9sZGVyKTtcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ3NkdnJvb3Rmb2xkZXInLCAyNSwgKGdhbWVJZCkgPT4gKGdhbWVJZCA9PT0gR0FNRV9JRCksXG4gICAgKCkgPT4gZ2V0RGlzY292ZXJ5UGF0aCgpLCAoaW5zdHJ1Y3Rpb25zKSA9PiB7XG4gICAgICAvLyBPbmx5IGludGVyZXN0ZWQgaW4gY29weSBpbnN0cnVjdGlvbnMuXG4gICAgICBjb25zdCBjb3B5SW5zdHJ1Y3Rpb25zID0gaW5zdHJ1Y3Rpb25zLmZpbHRlcihpbnN0ciA9PiBpbnN0ci50eXBlID09PSAnY29weScpO1xuICAgICAgLy8gVGhpcyBpcyBhIHRyaWNreSBwYXR0ZXJuIHNvIHdlJ3JlIGdvaW5nIHRvIDFzdCBwcmVzZW50IHRoZSBkaWZmZXJlbnQgcGFja2FnaW5nXG4gICAgICAvLyAgcGF0dGVybnMgd2UgbmVlZCB0byBjYXRlciBmb3I6XG4gICAgICAvLyAgMS4gUmVwbGFjZW1lbnQgbW9kIHdpdGggXCJDb250ZW50XCIgZm9sZGVyLiBEb2VzIG5vdCByZXF1aXJlIFNNQVBJIHNvIG5vXG4gICAgICAvLyAgICBtYW5pZmVzdCBmaWxlcyBhcmUgaW5jbHVkZWQuXG4gICAgICAvLyAgMi4gUmVwbGFjZW1lbnQgbW9kIHdpdGggXCJDb250ZW50XCIgZm9sZGVyICsgb25lIG9yIG1vcmUgU01BUEkgbW9kcyBpbmNsdWRlZFxuICAgICAgLy8gICAgYWxvbmdzaWRlIHRoZSBDb250ZW50IGZvbGRlciBpbnNpZGUgYSBcIk1vZHNcIiBmb2xkZXIuXG4gICAgICAvLyAgMy4gQSByZWd1bGFyIFNNQVBJIG1vZCB3aXRoIGEgXCJDb250ZW50XCIgZm9sZGVyIGluc2lkZSB0aGUgbW9kJ3Mgcm9vdCBkaXIuXG4gICAgICAvL1xuICAgICAgLy8gcGF0dGVybiAxOlxuICAgICAgLy8gIC0gRW5zdXJlIHdlIGRvbid0IGhhdmUgbWFuaWZlc3QgZmlsZXNcbiAgICAgIC8vICAtIEVuc3VyZSB3ZSBoYXZlIGEgXCJDb250ZW50XCIgZm9sZGVyXG4gICAgICAvL1xuICAgICAgLy8gVG8gc29sdmUgcGF0dGVybnMgMiBhbmQgMyB3ZSdyZSBnb2luZyB0bzpcbiAgICAgIC8vICBDaGVjayB3aGV0aGVyIHdlIGhhdmUgYW55IG1hbmlmZXN0IGZpbGVzLCBpZiB3ZSBkbywgd2UgZXhwZWN0IHRoZSBmb2xsb3dpbmdcbiAgICAgIC8vICAgIGFyY2hpdmUgc3RydWN0dXJlIGluIG9yZGVyIGZvciB0aGUgbW9kVHlwZSB0byBmdW5jdGlvbiBjb3JyZWN0bHk6XG4gICAgICAvLyAgICBhcmNoaXZlLnppcCA9PlxuICAgICAgLy8gICAgICAuLi9Db250ZW50L1xuICAgICAgLy8gICAgICAuLi9Nb2RzL1xuICAgICAgLy8gICAgICAuLi9Nb2RzL0FfU01BUElfTU9EXFxtYW5pZmVzdC5qc29uXG4gICAgICBjb25zdCBoYXNNYW5pZmVzdCA9IGNvcHlJbnN0cnVjdGlvbnMuZmluZChpbnN0ciA9PlxuICAgICAgICBpbnN0ci5kZXN0aW5hdGlvbi5lbmRzV2l0aChNQU5JRkVTVF9GSUxFKSlcbiAgICAgIGNvbnN0IGhhc01vZHNGb2xkZXIgPSBjb3B5SW5zdHJ1Y3Rpb25zLmZpbmQoaW5zdHIgPT5cbiAgICAgICAgaW5zdHIuZGVzdGluYXRpb24uc3RhcnRzV2l0aCgnTW9kcycgKyBwYXRoLnNlcCkpICE9PSB1bmRlZmluZWQ7XG4gICAgICBjb25zdCBoYXNDb250ZW50Rm9sZGVyID0gY29weUluc3RydWN0aW9ucy5maW5kKGluc3RyID0+XG4gICAgICAgIGluc3RyLmRlc3RpbmF0aW9uLnN0YXJ0c1dpdGgoJ0NvbnRlbnQnICsgcGF0aC5zZXApKSAhPT0gdW5kZWZpbmVkXG5cbiAgICAgIHJldHVybiAoaGFzTWFuaWZlc3QpXG4gICAgICAgID8gQmx1ZWJpcmQucmVzb2x2ZShoYXNDb250ZW50Rm9sZGVyICYmIGhhc01vZHNGb2xkZXIpXG4gICAgICAgIDogQmx1ZWJpcmQucmVzb2x2ZShoYXNDb250ZW50Rm9sZGVyKTtcbiAgICB9KTtcblxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdtb2QtaWNvbnMnLCA5OTksICdjaGFuZ2Vsb2cnLCB7fSwgJ1NNQVBJIExvZycsXG4gICAgKCkgPT4geyBvblNob3dTTUFQSUxvZyhjb250ZXh0LmFwaSk7IH0sXG4gICAgKCkgPT4ge1xuICAgICAgLy9Pbmx5IHNob3cgdGhlIFNNQVBJIGxvZyBidXR0b24gZm9yIFNEVi5cbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XG4gICAgICByZXR1cm4gKGdhbWVNb2RlID09PSBHQU1FX0lEKTtcbiAgICB9KTtcblxuICBjb250ZXh0LnJlZ2lzdGVyQXR0cmlidXRlRXh0cmFjdG9yKDI1LCBtYW5pZmVzdEV4dHJhY3Rvcik7XG5cbiAgY29udGV4dC5yZWdpc3RlclRhYmxlQXR0cmlidXRlKCdtb2RzJywge1xuICAgIGlkOiAnc2R2LWNvbXBhdGliaWxpdHknLFxuICAgIHBvc2l0aW9uOiAxMDAsXG4gICAgY29uZGl0aW9uOiAoKSA9PiBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpID09PSBHQU1FX0lELFxuICAgIHBsYWNlbWVudDogJ3RhYmxlJyxcbiAgICBjYWxjOiAobW9kOiB0eXBlcy5JTW9kKSA9PiBtb2QuYXR0cmlidXRlcz8uY29tcGF0aWJpbGl0eVN0YXR1cyxcbiAgICBjdXN0b21SZW5kZXJlcjogKG1vZDogdHlwZXMuSU1vZCwgZGV0YWlsQ2VsbDogYm9vbGVhbiwgdDogdHlwZXMuVEZ1bmN0aW9uKSA9PiB7XG4gICAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChDb21wYXRpYmlsaXR5SWNvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgdCwgbW9kLCBkZXRhaWxDZWxsIH0sIFtdKTtcbiAgICB9LFxuICAgIG5hbWU6ICdDb21wYXRpYmlsaXR5JyxcbiAgICBpc0RlZmF1bHRWaXNpYmxlOiB0cnVlLFxuICAgIGVkaXQ6IHt9LFxuICB9KTtcblxuICAvKlxuICBjb250ZXh0LnJlZ2lzdGVyVGVzdCgnc2R2LW1pc3NpbmctZGVwZW5kZW5jaWVzJywgJ2dhbWVtb2RlLWFjdGl2YXRlZCcsXG4gICAgKCkgPT4gdGVzdE1pc3NpbmdEZXBlbmRlbmNpZXMoY29udGV4dC5hcGksIGRlcGVuZGVuY3lNYW5hZ2VyKSk7XG4gICovXG4gIGNvbnRleHQucmVnaXN0ZXJUZXN0KCdzZHYtaW5jb21wYXRpYmxlLW1vZHMnLCAnZ2FtZW1vZGUtYWN0aXZhdGVkJyxcbiAgICAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKHRlc3RTTUFQSU91dGRhdGVkKGNvbnRleHQuYXBpLCBkZXBlbmRlbmN5TWFuYWdlcikpKTtcblxuICBpbnRlcmZhY2UgSUFkZGVkRmlsZSB7XG4gICAgZmlsZVBhdGg6IHN0cmluZztcbiAgICBjYW5kaWRhdGVzOiBzdHJpbmdbXTtcbiAgfVxuXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XG4gICAgY29uc3QgcHJveHkgPSBuZXcgU01BUElQcm94eShjb250ZXh0LmFwaSk7XG4gICAgY29udGV4dC5hcGkuc2V0U3R5bGVzaGVldCgnc2R2JywgcGF0aC5qb2luKF9fZGlybmFtZSwgJ3NkdnN0eWxlLnNjc3MnKSk7XG5cbiAgICBjb250ZXh0LmFwaS5hZGRNZXRhU2VydmVyKCdzbWFwaS5pbycsIHtcbiAgICAgIHVybDogJycsXG4gICAgICBsb29wYmFja0NCOiAocXVlcnk6IElRdWVyeSkgPT4ge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShwcm94eS5maW5kKHF1ZXJ5KSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGxvb2sgdXAgc21hcGkgbWV0YSBpbmZvJywgZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoW10pO1xuICAgICAgICAgIH0pO1xuICAgICAgfSxcbiAgICAgIGNhY2hlRHVyYXRpb25TZWM6IDg2NDAwLFxuICAgICAgcHJpb3JpdHk6IDI1LFxuICAgIH0pO1xuICAgIGRlcGVuZGVuY3lNYW5hZ2VyID0gbmV3IERlcGVuZGVuY3lNYW5hZ2VyKGNvbnRleHQuYXBpKTtcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdhZGRlZC1maWxlcycsIGFzeW5jIChwcm9maWxlSWQsIGZpbGVzOiBJQWRkZWRGaWxlW10pID0+IHtcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XG4gICAgICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgICAgIC8vIGRvbid0IGNhcmUgYWJvdXQgYW55IG90aGVyIGdhbWVzXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGdhbWUgPSB1dGlsLmdldEdhbWUoR0FNRV9JRCk7XG4gICAgICBjb25zdCBkaXNjb3ZlcnkgPSBzZWxlY3RvcnMuZGlzY292ZXJ5QnlHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgICAgIGNvbnN0IG1vZFBhdGhzID0gZ2FtZS5nZXRNb2RQYXRocyhkaXNjb3ZlcnkucGF0aCk7XG4gICAgICBjb25zdCBpbnN0YWxsUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuXG4gICAgICBhd2FpdCBCbHVlYmlyZC5tYXAoZmlsZXMsIGFzeW5jIGVudHJ5ID0+IHtcbiAgICAgICAgLy8gb25seSBhY3QgaWYgd2UgZGVmaW5pdGl2ZWx5IGtub3cgd2hpY2ggbW9kIG93bnMgdGhlIGZpbGVcbiAgICAgICAgaWYgKGVudHJ5LmNhbmRpZGF0ZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgY29uc3QgbW9kID0gc3RhdGUucGVyc2lzdGVudC5tb2RzPy5bR0FNRV9JRF0/LltlbnRyeS5jYW5kaWRhdGVzWzBdXTtcbiAgICAgICAgICBpZiAoIWlzTW9kQ2FuZGlkYXRlVmFsaWQobW9kLCBlbnRyeSkpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgZnJvbSA9IG1vZFBhdGhzW21vZC50eXBlID8/ICcnXTtcbiAgICAgICAgICBpZiAoZnJvbSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyBIb3cgaXMgdGhpcyBldmVuIHBvc3NpYmxlPyByZWdhcmRsZXNzIGl0J3Mgbm90IHRoaXNcbiAgICAgICAgICAgIC8vICBmdW5jdGlvbidzIGpvYiB0byByZXBvcnQgdGhpcy5cbiAgICAgICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHJlc29sdmUgbW9kIHBhdGggZm9yIG1vZCB0eXBlJywgbW9kLnR5cGUpO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShmcm9tLCBlbnRyeS5maWxlUGF0aCk7XG4gICAgICAgICAgY29uc3QgdGFyZ2V0UGF0aCA9IHBhdGguam9pbihpbnN0YWxsUGF0aCwgbW9kLmlkLCByZWxQYXRoKTtcbiAgICAgICAgICAvLyBjb3B5IHRoZSBuZXcgZmlsZSBiYWNrIGludG8gdGhlIGNvcnJlc3BvbmRpbmcgbW9kLCB0aGVuIGRlbGV0ZSBpdC4gVGhhdCB3YXksIHZvcnRleCB3aWxsXG4gICAgICAgICAgLy8gY3JlYXRlIGEgbGluayB0byBpdCB3aXRoIHRoZSBjb3JyZWN0IGRlcGxveW1lbnQgbWV0aG9kIGFuZCBub3QgYXNrIHRoZSB1c2VyIGFueSBxdWVzdGlvbnNcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyQXN5bmMocGF0aC5kaXJuYW1lKHRhcmdldFBhdGgpKTtcbiAgICAgICAgICAgIGF3YWl0IGZzLmNvcHlBc3luYyhlbnRyeS5maWxlUGF0aCwgdGFyZ2V0UGF0aCk7XG4gICAgICAgICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhlbnRyeS5maWxlUGF0aCk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBpZiAoIWVyci5tZXNzYWdlLmluY2x1ZGVzKCdhcmUgdGhlIHNhbWUgZmlsZScpKSB7XG4gICAgICAgICAgICAgIC8vIHNob3VsZCB3ZSBiZSByZXBvcnRpbmcgdGhpcyB0byB0aGUgdXNlcj8gVGhpcyBpcyBhIGNvbXBsZXRlbHlcbiAgICAgICAgICAgICAgLy8gYXV0b21hdGVkIHByb2Nlc3MgYW5kIGlmIGl0IGZhaWxzIG1vcmUgb2Z0ZW4gdGhhbiBub3QgdGhlXG4gICAgICAgICAgICAgIC8vIHVzZXIgcHJvYmFibHkgZG9lc24ndCBjYXJlXG4gICAgICAgICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHJlLWltcG9ydCBhZGRlZCBmaWxlIHRvIG1vZCcsIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLWRlcGxveScsIGFzeW5jIChwcm9maWxlSWQpID0+IHtcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XG4gICAgICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc21hcGlNb2QgPSBmaW5kU01BUElNb2QoY29udGV4dC5hcGkpO1xuICAgICAgY29uc3QgcHJpbWFyeVRvb2wgPSBzdGF0ZT8uc2V0dGluZ3M/LmludGVyZmFjZT8ucHJpbWFyeVRvb2w/LltHQU1FX0lEXTtcbiAgICAgIGlmIChzbWFwaU1vZCAmJiBwcmltYXJ5VG9vbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0UHJpbWFyeVRvb2woR0FNRV9JRCwgJ3NtYXBpJykpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfSlcblxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1wdXJnZScsIGFzeW5jIChwcm9maWxlSWQpID0+IHtcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XG4gICAgICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc21hcGlNb2QgPSBmaW5kU01BUElNb2QoY29udGV4dC5hcGkpO1xuICAgICAgY29uc3QgcHJpbWFyeVRvb2wgPSBzdGF0ZT8uc2V0dGluZ3M/LmludGVyZmFjZT8ucHJpbWFyeVRvb2w/LltHQU1FX0lEXTtcbiAgICAgIGlmIChzbWFwaU1vZCAmJiBwcmltYXJ5VG9vbCA9PT0gJ3NtYXBpJykge1xuICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldFByaW1hcnlUb29sKEdBTUVfSUQsIHVuZGVmaW5lZCkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfSk7XG5cbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2RpZC1pbnN0YWxsLW1vZCcsIChnYW1lSWQ6IHN0cmluZywgYXJjaGl2ZUlkOiBzdHJpbmcsIG1vZElkOiBzdHJpbmcpID0+IHtcbiAgICAgIGlmIChnYW1lSWQgIT09IEdBTUVfSUQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdXBkYXRlQ29uZmxpY3RJbmZvKGNvbnRleHQuYXBpLCBwcm94eSwgZ2FtZUlkLCBtb2RJZClcbiAgICAgICAgLnRoZW4oKCkgPT4gbG9nKCdkZWJ1ZycsICdhZGRlZCBjb21wYXRpYmlsaXR5IGluZm8nLCB7IG1vZElkIH0pKVxuICAgICAgICAuY2F0Y2goZXJyID0+IGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGFkZCBjb21wYXRpYmlsaXR5IGluZm8nLCB7IG1vZElkLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSkpO1xuXG4gICAgfSk7XG5cbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2dhbWVtb2RlLWFjdGl2YXRlZCcsIChnYW1lTW9kZTogc3RyaW5nKSA9PiB7XG4gICAgICBpZiAoZ2FtZU1vZGUgIT09IEdBTUVfSUQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XG4gICAgICBsb2coJ2RlYnVnJywgJ3VwZGF0aW5nIFNEViBjb21wYXRpYmlsaXR5IGluZm8nKTtcbiAgICAgIFByb21pc2UuYWxsKE9iamVjdC5rZXlzKHN0YXRlLnBlcnNpc3RlbnQubW9kc1tnYW1lTW9kZV0gPz8ge30pLm1hcChtb2RJZCA9PlxuICAgICAgICB1cGRhdGVDb25mbGljdEluZm8oY29udGV4dC5hcGksIHByb3h5LCBnYW1lTW9kZSwgbW9kSWQpKSlcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIGxvZygnZGVidWcnLCAnZG9uZSB1cGRhdGluZyBjb21wYXRpYmlsaXR5IGluZm8nKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gdXBkYXRlIGNvbmZsaWN0IGluZm8nLCBlcnIubWVzc2FnZSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgaW5pdDtcbiJdfQ==