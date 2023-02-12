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
const child_process_1 = require("child_process");
const exe_version_1 = __importDefault(require("exe-version"));
const path = __importStar(require("path"));
const React = __importStar(require("react"));
const react_bootstrap_1 = require("react-bootstrap");
const react_redux_1 = require("react-redux");
const redux_act_1 = require("redux-act");
const semver = __importStar(require("semver"));
const shortid_1 = require("shortid");
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
const xml2js_1 = require("xml2js");
const common_1 = require("./common");
const gitHubDownloader = __importStar(require("./githubDownloader"));
const STOP_PATTERNS = ['[^/]*\\.pak$'];
function toWordExp(input) {
    return '(^|/)' + input + '(/|$)';
}
const setPlayerProfile = (0, redux_act_1.createAction)('BG3_SET_PLAYERPROFILE', name => name);
const settingsWritten = (0, redux_act_1.createAction)('BG3_SETTINGS_WRITTEN', (profile, time, count) => ({ profile, time, count }));
const reducer = {
    reducers: {
        [setPlayerProfile]: (state, payload) => vortex_api_1.util.setSafe(state, ['playerProfile'], payload),
        [settingsWritten]: (state, payload) => {
            const { profile, time, count } = payload;
            return vortex_api_1.util.setSafe(state, ['settingsWritten', profile], { time, count });
        },
    },
    defaults: {
        playerProfile: 'global',
        settingsWritten: {},
    },
};
function documentsPath() {
    return path.join(vortex_api_1.util.getVortexPath('localAppData'), 'Larian Studios', 'Baldur\'s Gate 3');
}
function modsPath() {
    return path.join(documentsPath(), 'Mods');
}
function profilesPath() {
    return path.join(documentsPath(), 'PlayerProfiles');
}
function globalProfilePath() {
    return path.join(documentsPath(), 'global');
}
function findGame() {
    return vortex_api_1.util.GameStoreHelper.findByAppId(['1456460669', '1086940'])
        .then(game => game.gamePath);
}
async function ensureGlobalProfile(api, discovery) {
    if (discovery?.path) {
        const profilePath = globalProfilePath();
        try {
            await vortex_api_1.fs.ensureDirWritableAsync(profilePath);
            const modSettingsFilePath = path.join(profilePath, 'modsettings.lsx');
            try {
                await vortex_api_1.fs.statAsync(modSettingsFilePath);
            }
            catch (err) {
                await vortex_api_1.fs.writeFileAsync(modSettingsFilePath, common_1.DEFAULT_MOD_SETTINGS, { encoding: 'utf8' });
            }
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
}
function prepareForModding(api, discovery) {
    const mp = modsPath();
    api.sendNotification({
        id: 'bg3-uses-lslib',
        type: 'info',
        title: 'BG3 support uses LSLib',
        message: common_1.LSLIB_URL,
        allowSuppress: true,
        actions: [
            { title: 'Visit Page', action: () => vortex_api_1.util.opn(common_1.LSLIB_URL).catch(() => null) },
        ],
    });
    return vortex_api_1.fs.statAsync(mp)
        .catch(() => vortex_api_1.fs.ensureDirWritableAsync(mp, () => bluebird_1.default.resolve())
        .then(() => api.showDialog('info', 'Early Access Game', {
        bbcode: 'Baldur\'s Gate 3 is currently in Early Access. It doesn\'t officially '
            + 'support modding, doesn\'t include any modding tools and will receive '
            + 'frequent updates.<br/>'
            + 'Mods may become incompatible within days of being released, generally '
            + 'not work and/or break unrelated things within the game.<br/><br/>'
            + '[color="red"]Please don\'t report issues that happen in connection with mods to the '
            + 'game developers (Larian Studios) or through the Vortex feedback system.[/color]',
    }, [{ label: 'I understand' }])))
        .finally(() => ensureGlobalProfile(api, discovery));
}
function getGamePath(api) {
    const state = api.getState();
    return state.settings.gameMode.discovered?.[common_1.GAME_ID]?.path;
}
function getGameDataPath(api) {
    const state = api.getState();
    const gameMode = vortex_api_1.selectors.activeGameId(state);
    const gamePath = state.settings.gameMode.discovered?.[common_1.GAME_ID]?.path;
    if (gamePath !== undefined) {
        return path.join(gamePath, 'Data');
    }
    else {
        return undefined;
    }
}
const ORIGINAL_FILES = new Set([
    'assets.pak',
    'assets.pak',
    'effects.pak',
    'engine.pak',
    'engineshaders.pak',
    'game.pak',
    'gameplatform.pak',
    'gustav.pak',
    'gustav_textures.pak',
    'icons.pak',
    'lowtex.pak',
    'materials.pak',
    'minimaps.pak',
    'models.pak',
    'shared.pak',
    'sharedsoundbanks.pak',
    'sharedsounds.pak',
    'textures.pak',
    'virtualtextures.pak',
]);
const LSLIB_FILES = new Set([
    'divine.exe',
    'lslib.dll',
]);
function isLSLib(api, files) {
    const origFile = files.find(iter => (iter.type === 'copy') && LSLIB_FILES.has(path.basename(iter.destination).toLowerCase()));
    return origFile !== undefined
        ? bluebird_1.default.resolve(true)
        : bluebird_1.default.resolve(false);
}
function testLSLib(files, gameId) {
    if (gameId !== common_1.GAME_ID) {
        return bluebird_1.default.resolve({ supported: false, requiredFiles: [] });
    }
    const matchedFiles = files.filter(file => LSLIB_FILES.has(path.basename(file).toLowerCase()));
    return bluebird_1.default.resolve({
        supported: matchedFiles.length >= 2,
        requiredFiles: [],
    });
}
async function installLSLib(files, destinationPath, gameId, progressDelegate) {
    const exe = files.find(file => path.basename(file.toLowerCase()) === 'divine.exe');
    const exePath = path.join(destinationPath, exe);
    let ver = await (0, exe_version_1.default)(exePath);
    ver = ver.split('.').slice(0, 3).join('.');
    const fileName = path.basename(destinationPath, path.extname(destinationPath));
    const idx = fileName.indexOf('-v');
    const fileNameVer = fileName.slice(idx + 2);
    if (semver.valid(fileNameVer) && ver !== fileNameVer) {
        ver = fileNameVer;
    }
    const versionAttr = { type: 'attribute', key: 'version', value: ver };
    const modtypeAttr = { type: 'setmodtype', value: 'bg3-lslib-divine-tool' };
    const instructions = files.reduce((accum, filePath) => {
        if (filePath.toLowerCase()
            .split(path.sep)
            .indexOf('tools') !== -1
            && !filePath.endsWith(path.sep)) {
            accum.push({
                type: 'copy',
                source: filePath,
                destination: path.join('tools', path.basename(filePath)),
            });
        }
        return accum;
    }, [modtypeAttr, versionAttr]);
    return Promise.resolve({ instructions });
}
function isReplacer(api, files) {
    const origFile = files.find(iter => (iter.type === 'copy') && ORIGINAL_FILES.has(iter.destination.toLowerCase()));
    const paks = files.filter(iter => (iter.type === 'copy') && (path.extname(iter.destination).toLowerCase() === '.pak'));
    if ((origFile !== undefined) || (paks.length === 0)) {
        return api.showDialog('question', 'Mod looks like a replacer', {
            bbcode: 'The mod you just installed looks like a "replacer", meaning it is intended to replace '
                + 'one of the files shipped with the game.<br/>'
                + 'You should be aware that such a replacer includes a copy of some game data from a '
                + 'specific version of the game and may therefore break as soon as the game gets updated.<br/>'
                + 'Even if doesn\'t break, it may revert bugfixes that the game '
                + 'developers have made.<br/><br/>'
                + 'Therefore [color="red"]please take extra care to keep this mod updated[/color] and remove it when it '
                + 'no longer matches the game version.',
        }, [
            { label: 'Install as Mod (will likely not work)' },
            { label: 'Install as Replacer' },
        ]).then(result => result.action === 'Install as Replacer');
    }
    else {
        return bluebird_1.default.resolve(false);
    }
}
function testReplacer(files, gameId) {
    if (gameId !== common_1.GAME_ID) {
        return bluebird_1.default.resolve({ supported: false, requiredFiles: [] });
    }
    const paks = files.filter(file => path.extname(file).toLowerCase() === '.pak');
    return bluebird_1.default.resolve({
        supported: paks.length === 0,
        requiredFiles: [],
    });
}
function installReplacer(files, destinationPath, gameId, progressDelegate) {
    const directories = Array.from(new Set(files.map(file => path.dirname(file).toUpperCase())));
    let dataPath = directories.find(dir => path.basename(dir) === 'DATA');
    if (dataPath === undefined) {
        const genOrPublic = directories
            .find(dir => ['PUBLIC', 'GENERATED'].includes(path.basename(dir)));
        if (genOrPublic !== undefined) {
            dataPath = path.dirname(genOrPublic);
        }
    }
    const instructions = (dataPath !== undefined)
        ? files.reduce((prev, filePath) => {
            if (filePath.endsWith(path.sep)) {
                return prev;
            }
            const relPath = path.relative(dataPath, filePath);
            if (!relPath.startsWith('..')) {
                prev.push({
                    type: 'copy',
                    source: filePath,
                    destination: relPath,
                });
            }
            return prev;
        }, [])
        : files.map((filePath) => ({
            type: 'copy',
            source: filePath,
            destination: filePath,
        }));
    return bluebird_1.default.resolve({
        instructions,
    });
}
const getPlayerProfiles = (() => {
    let cached = [];
    try {
        cached = vortex_api_1.fs.readdirSync(profilesPath())
            .filter(name => (path.extname(name) === '') && (name !== 'Default'));
    }
    catch (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }
    }
    return () => cached;
})();
function gameSupportsProfile(gameVersion) {
    return semver.lt(semver.coerce(gameVersion), '4.1.206');
}
function InfoPanel(props) {
    const { t, gameVersion, onInstallLSLib, onSetPlayerProfile, isLsLibInstalled } = props;
    const supportsProfiles = gameSupportsProfile(gameVersion);
    const currentProfile = supportsProfiles ? props.currentProfile : 'Public';
    const onSelect = React.useCallback((ev) => {
        onSetPlayerProfile(ev.currentTarget.value);
    }, [onSetPlayerProfile]);
    return isLsLibInstalled() ? (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', padding: '16px' } },
        React.createElement("div", { style: { display: 'flex', whiteSpace: 'nowrap', alignItems: 'center' } },
            t('Ingame Profile: '),
            supportsProfiles ? (React.createElement(react_bootstrap_1.FormControl, { componentClass: 'select', name: 'userProfile', className: 'form-control', value: currentProfile, onChange: onSelect },
                React.createElement("option", { key: 'global', value: 'global' }, t('All Profiles')),
                getPlayerProfiles().map(prof => (React.createElement("option", { key: prof, value: prof }, prof))))) : null),
        supportsProfiles ? null : (React.createElement("div", null,
            React.createElement(react_bootstrap_1.Alert, { bsStyle: 'info' }, t('Patch 9 removed the feature of switching profiles inside the game, savegames are '
                + 'now tied to the character.\n It is currently unknown if these profiles will '
                + 'return but of course you can continue to use Vortex profiles.')))),
        React.createElement("hr", null),
        React.createElement("div", null,
            t('Please refer to mod descriptions from mod authors to determine the right order. '
                + 'If you can\'t find any suggestions for a mod, it probably doesn\'t matter.'),
            React.createElement("hr", null),
            t('Some mods may be locked in this list because they are loaded differently by the engine '
                + 'and can therefore not be load-ordered by mod managers. If you want to disable '
                + 'such a mod, please do so on the "Mods" screen.')))) : (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', padding: '16px' } },
        React.createElement("div", { style: { display: 'flex', whiteSpace: 'nowrap', alignItems: 'center' } }, t('LSLib is not installed')),
        React.createElement("hr", null),
        React.createElement("div", null, t('To take full advantage of Vortex\'s BG3 modding capabilities such as managing the '
            + 'order in which mods are loaded into the game; Vortex requires a 3rd party tool "LSLib", '
            + 'please install the library using the buttons below to manage your load order.')),
        React.createElement(vortex_api_1.tooltip.Button, { tooltip: 'Install LSLib', onClick: onInstallLSLib }, t('Install LSLib'))));
}
async function getOwnGameVersion(state) {
    const discovery = vortex_api_1.selectors.discoveryByGame(state, common_1.GAME_ID);
    return await vortex_api_1.util.getGame(common_1.GAME_ID).getInstalledVersion(discovery);
}
async function getActivePlayerProfile(api) {
    return gameSupportsProfile(await getOwnGameVersion(api.getState()))
        ? api.store.getState().settings['baldursgate3']?.playerProfile || 'global'
        : 'Public';
}
async function writeLoadOrder(api, loadOrder) {
    const bg3profile = await getActivePlayerProfile(api);
    const playerProfiles = (bg3profile === 'global') ? getPlayerProfiles() : [bg3profile];
    if (playerProfiles.length === 0) {
        api.sendNotification({
            id: 'bg3-no-profiles',
            type: 'warning',
            title: 'No player profiles',
            message: 'Please run the game at least once and create a profile in-game',
        });
        return;
    }
    api.dismissNotification('bg3-no-profiles');
    try {
        const modSettings = await readModSettings(api);
        const region = findNode(modSettings?.save?.region, 'ModuleSettings');
        const root = findNode(region?.node, 'root');
        const modsNode = findNode(root?.children?.[0]?.node, 'Mods');
        const loNode = findNode(root?.children?.[0]?.node, 'ModOrder') ?? { children: [] };
        if ((loNode.children === undefined) || (loNode.children[0] === '')) {
            loNode.children = [{ node: [] }];
        }
        const descriptionNodes = modsNode?.children?.[0]?.node?.filter?.(iter => iter.attribute.find(attr => (attr.$.id === 'Name') && (attr.$.value === 'Gustav'))) ?? [];
        const enabledPaks = Object.keys(loadOrder)
            .filter(key => !!loadOrder[key].data?.uuid
            && loadOrder[key].enabled
            && !loadOrder[key].data?.isListed);
        for (const key of enabledPaks) {
            descriptionNodes.push({
                $: { id: 'ModuleShortDesc' },
                attribute: [
                    { $: { id: 'Folder', type: 'LSWString', value: loadOrder[key].data.folder } },
                    { $: { id: 'MD5', type: 'LSString', value: loadOrder[key].data.md5 } },
                    { $: { id: 'Name', type: 'FixedString', value: loadOrder[key].data.name } },
                    { $: { id: 'UUID', type: 'FixedString', value: loadOrder[key].data.uuid } },
                    { $: { id: 'Version', type: 'int32', value: loadOrder[key].data.version } },
                ],
            });
        }
        const loadOrderNodes = enabledPaks
            .sort((lhs, rhs) => loadOrder[lhs].pos - loadOrder[rhs].pos)
            .map((key) => ({
            $: { id: 'Module' },
            attribute: [
                { $: { id: 'UUID', type: 'FixedString', value: loadOrder[key].data.uuid } },
            ],
        }));
        modsNode.children[0].node = descriptionNodes;
        loNode.children[0].node = loadOrderNodes;
        if (bg3profile === 'global') {
            writeModSettings(api, modSettings, bg3profile);
        }
        for (const profile of playerProfiles) {
            writeModSettings(api, modSettings, profile);
            api.store.dispatch(settingsWritten(profile, Date.now(), enabledPaks.length));
        }
    }
    catch (err) {
        api.showErrorNotification('Failed to write load order', err, {
            allowReport: false,
            message: 'Please run the game at least once and create a profile in-game',
        });
    }
}
function getLatestLSLibMod(api) {
    const state = api.getState();
    const mods = state.persistent.mods[common_1.GAME_ID];
    if (mods === undefined) {
        (0, vortex_api_1.log)('warn', 'LSLib is not installed');
        return undefined;
    }
    const lsLib = Object.keys(mods).reduce((prev, id) => {
        if (mods[id].type === 'bg3-lslib-divine-tool') {
            const latestVer = prev?.attributes?.version ?? '0.0.0';
            const currentVer = mods[id]?.attributes?.version ?? '0.0.0';
            try {
                if (semver.gt(currentVer, latestVer)) {
                    prev = mods[id];
                }
            }
            catch (err) {
                (0, vortex_api_1.log)('warn', 'invalid mod version', { modId: id, version: currentVer });
            }
        }
        return prev;
    }, undefined);
    if (lsLib === undefined) {
        (0, vortex_api_1.log)('warn', 'LSLib is not installed');
        return undefined;
    }
    return lsLib;
}
class DivineExecMissing extends Error {
    constructor() {
        super('Divine executable is missing');
        this.name = 'DivineExecMissing';
    }
}
function divine(api, action, options) {
    return new Promise((resolve, reject) => {
        let returned = false;
        let stdout = '';
        const state = api.getState();
        const stagingFolder = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
        const lsLib = getLatestLSLibMod(api);
        if (lsLib === undefined) {
            const err = new Error('LSLib/Divine tool is missing');
            err['attachLogOnReport'] = false;
            return reject(err);
        }
        const exe = path.join(stagingFolder, lsLib.installationPath, 'tools', 'divine.exe');
        const args = [
            '--action', action,
            '--source', options.source,
            '--loglevel', 'off',
            '--game', 'bg3',
        ];
        if (options.destination !== undefined) {
            args.push('--destination', options.destination);
        }
        if (options.expression !== undefined) {
            args.push('--expression', options.expression);
        }
        const proc = (0, child_process_1.spawn)(exe, args);
        proc.stdout.on('data', data => stdout += data);
        proc.stderr.on('data', data => (0, vortex_api_1.log)('warn', data));
        proc.on('error', (errIn) => {
            if (!returned) {
                if (errIn['code'] === 'ENOENT') {
                    reject(new DivineExecMissing());
                }
                returned = true;
                const err = new Error('divine.exe failed: ' + errIn.message);
                err['attachLogOnReport'] = true;
                reject(err);
            }
        });
        proc.on('exit', (code) => {
            if (!returned) {
                returned = true;
                if (code === 0) {
                    return resolve({ stdout, returnCode: 0 });
                }
                else if ([2, 102].includes(code)) {
                    return resolve({ stdout: '', returnCode: 2 });
                }
                else {
                    if (code > 100) {
                        code -= 100;
                    }
                    const err = new Error(`divine.exe failed: ${code}`);
                    err['attachLogOnReport'] = true;
                    return reject(err);
                }
            }
        });
    });
}
async function extractPak(api, pakPath, destPath, pattern) {
    return divine(api, 'extract-package', { source: pakPath, destination: destPath, expression: pattern });
}
async function extractMeta(api, pakPath, mod) {
    const metaPath = path.join(vortex_api_1.util.getVortexPath('temp'), 'lsmeta', (0, shortid_1.generate)());
    await vortex_api_1.fs.ensureDirAsync(metaPath);
    await extractPak(api, pakPath, metaPath, '*/meta.lsx');
    try {
        let metaLSXPath = path.join(metaPath, 'meta.lsx');
        await (0, turbowalk_1.default)(metaPath, entries => {
            const temp = entries.find(e => path.basename(e.filePath).toLowerCase() === 'meta.lsx');
            if (temp !== undefined) {
                metaLSXPath = temp.filePath;
            }
        });
        const dat = await vortex_api_1.fs.readFileAsync(metaLSXPath);
        const meta = await (0, xml2js_1.parseStringPromise)(dat);
        await vortex_api_1.fs.removeAsync(metaPath);
        return meta;
    }
    catch (err) {
        await vortex_api_1.fs.removeAsync(metaPath);
        if (err.code === 'ENOENT') {
            return Promise.resolve(undefined);
        }
        else if (err.message.includes('Column') && (err.message.includes('Line'))) {
            api.sendNotification({
                type: 'warning',
                message: 'The meta.lsx file in "{{modName}}" is invalid, please report this to the author',
                actions: [{
                        title: 'More',
                        action: () => {
                            api.showDialog('error', 'Invalid meta.lsx file', {
                                message: err.message,
                            }, [{ label: 'Close' }]);
                        }
                    }],
                replace: {
                    modName: vortex_api_1.util.renderModName(mod),
                }
            });
            return Promise.resolve(undefined);
        }
        else {
            throw err;
        }
    }
}
function findNode(nodes, id) {
    return nodes?.find(iter => iter.$.id === id) ?? undefined;
}
const listCache = {};
async function listPackage(api, pakPath) {
    const res = await divine(api, 'list-package', { source: pakPath });
    const lines = res.stdout.split('\n').map(line => line.trim()).filter(line => line.length !== 0);
    return lines;
}
async function isLOListed(api, pakPath) {
    if (listCache[pakPath] === undefined) {
        listCache[pakPath] = listPackage(api, pakPath);
    }
    const lines = await listCache[pakPath];
    const metaLSX = lines.find(line => path.basename(line.split('\t')[0]).toLowerCase() === 'meta.lsx');
    return metaLSX === undefined;
}
async function extractPakInfoImpl(api, pakPath, mod) {
    const meta = await extractMeta(api, pakPath, mod);
    const config = findNode(meta?.save?.region, 'Config');
    const configRoot = findNode(config?.node, 'root');
    const moduleInfo = findNode(configRoot?.children?.[0]?.node, 'ModuleInfo');
    const attr = (name, fallback) => findNode(moduleInfo?.attribute, name)?.$?.value ?? fallback();
    const genName = path.basename(pakPath, path.extname(pakPath));
    return {
        author: attr('Author', () => 'Unknown'),
        description: attr('Description', () => 'Missing'),
        folder: attr('Folder', () => genName),
        md5: attr('MD5', () => ''),
        name: attr('Name', () => genName),
        type: attr('Type', () => 'Adventure'),
        uuid: attr('UUID', () => require('uuid').v4()),
        version: attr('Version', () => '1'),
        isListed: await isLOListed(api, pakPath),
    };
}
const fallbackPicture = path.join(__dirname, 'gameart.jpg');
let storedLO;
function parseModNode(node) {
    const name = findNode(node.attribute, 'Name').$.value;
    return {
        id: name,
        name,
        data: findNode(node.attribute, 'UUID').$.value,
    };
}
async function readModSettings(api) {
    const bg3profile = await getActivePlayerProfile(api);
    const playerProfiles = getPlayerProfiles();
    if (playerProfiles.length === 0) {
        storedLO = [];
        return;
    }
    const settingsPath = (bg3profile !== 'global')
        ? path.join(profilesPath(), bg3profile, 'modsettings.lsx')
        : path.join(globalProfilePath(), 'modsettings.lsx');
    const dat = await vortex_api_1.fs.readFileAsync(settingsPath);
    return (0, xml2js_1.parseStringPromise)(dat);
}
async function writeModSettings(api, data, bg3profile) {
    if (!bg3profile) {
        return;
    }
    const settingsPath = (bg3profile !== 'global')
        ? path.join(profilesPath(), bg3profile, 'modsettings.lsx')
        : path.join(globalProfilePath(), 'modsettings.lsx');
    const builder = new xml2js_1.Builder();
    const xml = builder.buildObject(data);
    try {
        await vortex_api_1.fs.ensureDirWritableAsync(path.dirname(settingsPath));
        await vortex_api_1.fs.writeFileAsync(settingsPath, xml);
    }
    catch (err) {
        storedLO = [];
        const allowReport = ['ENOENT', 'EPERM'].includes(err.code);
        api.showErrorNotification('Failed to write mod settings', err, { allowReport });
        return;
    }
}
async function readStoredLO(api) {
    const modSettings = await readModSettings(api);
    const config = findNode(modSettings?.save?.region, 'ModuleSettings');
    const configRoot = findNode(config?.node, 'root');
    const modOrderRoot = findNode(configRoot?.children?.[0]?.node, 'ModOrder');
    const modsRoot = findNode(configRoot?.children?.[0]?.node, 'Mods');
    const modOrderNodes = modOrderRoot?.children?.[0]?.node ?? [];
    const modNodes = modsRoot?.children?.[0]?.node ?? [];
    const modOrder = modOrderNodes.map(node => findNode(node.attribute, 'UUID').$?.value);
    const state = api.store.getState();
    const vProfile = vortex_api_1.selectors.activeProfile(state);
    const mods = state?.persistent?.mods?.[common_1.GAME_ID] ?? {};
    const enabled = Object.keys(mods).filter((id) => vProfile?.modState?.[id]?.enabled);
    const bg3profile = state.settings['baldursgate3']?.playerProfile;
    if (enabled.length > 0 && modNodes.length === 1) {
        const lastWrite = state.settings['baldursgate3']?.settingsWritten?.[bg3profile];
        if ((lastWrite !== undefined) && (lastWrite.count > 1)) {
            api.showDialog('info', '"modsettings.lsx" file was reset', {
                text: 'The game reset the list of active mods and ran without them.\n'
                    + 'This happens when an invalid or incompatible mod is installed. '
                    + 'The game will not load any mods if one of them is incompatible, unfortunately '
                    + 'there is no easy way to find out which one caused the problem.',
            }, [
                { label: 'Continue' },
            ]);
        }
    }
    storedLO = modNodes
        .map(node => parseModNode(node))
        .filter(entry => entry.id === 'Gustav')
        .sort((lhs, rhs) => modOrder
        .findIndex(i => i === lhs.data) - modOrder.findIndex(i => i === rhs.data));
}
async function readPAKList(api) {
    let paks;
    try {
        paks = (await vortex_api_1.fs.readdirAsync(modsPath()))
            .filter(fileName => path.extname(fileName).toLowerCase() === '.pak');
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            try {
                await vortex_api_1.fs.ensureDirWritableAsync(modsPath(), () => bluebird_1.default.resolve());
            }
            catch (err) {
            }
        }
        else {
            api.showErrorNotification('Failed to read mods directory', err, {
                id: 'bg3-failed-read-mods',
                message: modsPath(),
            });
        }
        paks = [];
    }
    return paks;
}
async function readPAKs(api) {
    const state = api.getState();
    const lsLib = getLatestLSLibMod(api);
    if (lsLib === undefined) {
        return [];
    }
    const paks = await readPAKList(api);
    let manifest;
    try {
        manifest = await vortex_api_1.util.getManifest(api, '', common_1.GAME_ID);
    }
    catch (err) {
        const allowReport = !['EPERM'].includes(err.code);
        api.showErrorNotification('Failed to read deployment manifest', err, { allowReport });
        return [];
    }
    const res = await Promise.all(paks.map(async (fileName) => {
        return vortex_api_1.util.withErrorContext('reading pak', fileName, () => {
            const func = async () => {
                try {
                    const manifestEntry = manifest.files.find(entry => entry.relPath === fileName);
                    const mod = (manifestEntry !== undefined)
                        ? state.persistent.mods[common_1.GAME_ID]?.[manifestEntry.source]
                        : undefined;
                    const pakPath = path.join(modsPath(), fileName);
                    return {
                        fileName,
                        mod,
                        info: await extractPakInfoImpl(api, pakPath, mod),
                    };
                }
                catch (err) {
                    if (err instanceof DivineExecMissing) {
                        const message = 'The installed copy of LSLib/Divine is corrupted - please '
                            + 'delete the existing LSLib mod entry and re-install it. Make sure to '
                            + 'disable or add any necessary exceptions to your security software to '
                            + 'ensure it does not interfere with Vortex/LSLib file operations.';
                        api.showErrorNotification('Divine executable is missing', message, { allowReport: false });
                        return undefined;
                    }
                    if (err.code !== 'ENOENT') {
                        api.showErrorNotification('Failed to read pak', err, {
                            allowReport: true,
                            message: fileName,
                        });
                    }
                    return undefined;
                }
            };
            return bluebird_1.default.resolve(func());
        });
    }));
    return res.filter(iter => iter !== undefined);
}
async function readLO(api) {
    try {
        const modSettings = await readModSettings(api);
        const config = findNode(modSettings?.save?.region, 'ModuleSettings');
        const configRoot = findNode(config?.node, 'root');
        const modOrderRoot = findNode(configRoot?.children?.[0]?.node, 'ModOrder');
        const modOrderNodes = modOrderRoot?.children?.[0]?.node ?? [];
        return modOrderNodes.map(node => findNode(node.attribute, 'UUID').$?.value);
    }
    catch (err) {
        api.showErrorNotification('Failed to read modsettings.lsx', err, {
            allowReport: false,
            message: 'Please run the game at least once and create a profile in-game',
        });
        return [];
    }
}
function serializeLoadOrder(api, order) {
    return writeLoadOrder(api, order);
}
const deserializeDebouncer = new vortex_api_1.util.Debouncer(() => {
    return Promise.resolve();
}, 1000);
async function deserializeLoadOrder(api) {
    await vortex_api_1.util.toPromise(cb => deserializeDebouncer.schedule(cb));
    const paks = await readPAKs(api);
    const order = await readLO(api);
    const orderValue = (info) => {
        return order.indexOf(info.uuid) + (info.isListed ? 0 : 1000);
    };
    return paks
        .sort((lhs, rhs) => orderValue(lhs.info) - orderValue(rhs.info))
        .map(({ fileName, mod, info }) => ({
        id: fileName,
        enabled: true,
        name: vortex_api_1.util.renderModName(mod),
        modId: mod?.id,
        locked: info.isListed,
        data: info,
    }));
}
function validate(before, after) {
    return Promise.resolve();
}
let forceRefresh;
function InfoPanelWrap(props) {
    const { api } = props;
    const currentProfile = (0, react_redux_1.useSelector)((state) => state.settings['baldursgate3']?.playerProfile);
    const [gameVersion, setGameVersion] = React.useState();
    React.useEffect(() => {
        forceRefresh = props.refresh;
    }, []);
    React.useEffect(() => {
        (async () => {
            setGameVersion(await getOwnGameVersion(api.getState()));
        })();
    }, []);
    const onSetProfile = React.useCallback((profileName) => {
        const impl = async () => {
            api.store.dispatch(setPlayerProfile(profileName));
            try {
                await readStoredLO(api);
            }
            catch (err) {
                api.showErrorNotification('Failed to read load order', err, {
                    message: 'Please run the game before you start modding',
                    allowReport: false,
                });
            }
            forceRefresh?.();
        };
        impl();
    }, [api]);
    const isLsLibInstalled = React.useCallback(() => {
        return getLatestLSLibMod(api) !== undefined;
    }, [api]);
    const onInstallLSLib = React.useCallback(() => {
        onGameModeActivated(api, common_1.GAME_ID);
    }, [api]);
    if (!gameVersion) {
        return null;
    }
    return (React.createElement(InfoPanel, { t: api.translate, gameVersion: gameVersion, currentProfile: currentProfile, onSetPlayerProfile: onSetProfile, isLsLibInstalled: isLsLibInstalled, onInstallLSLib: onInstallLSLib }));
}
function getLatestInstalledLSLibVer(api) {
    const state = api.getState();
    const mods = state?.persistent?.mods?.[common_1.GAME_ID] ?? {};
    return Object.keys(mods).reduce((prev, id) => {
        if (mods[id].type === 'bg3-lslib-divine-tool') {
            const arcId = mods[id].archiveId;
            const dl = state?.persistent?.downloads?.files?.[arcId];
            const storedVer = mods[id]?.attributes?.['version'] ?? '0.0.0';
            try {
                if (semver.gt(storedVer, prev)) {
                    prev = storedVer;
                }
            }
            catch (err) {
                (0, vortex_api_1.log)('warn', 'invalid version stored for lslib mod', { id, version: storedVer });
            }
            if (dl !== undefined) {
                const fileName = path.basename(dl.localPath, path.extname(dl.localPath));
                const idx = fileName.indexOf('-v');
                try {
                    const ver = semver.coerce(fileName.slice(idx + 2)).version;
                    if (semver.valid(ver) && ver !== storedVer) {
                        api.store.dispatch(vortex_api_1.actions.setModAttribute(common_1.GAME_ID, id, 'version', ver));
                        prev = ver;
                    }
                }
                catch (err) {
                    api.store.dispatch(vortex_api_1.actions.setModAttribute(common_1.GAME_ID, id, 'version', '1.0.0'));
                    prev = '1.0.0';
                }
            }
        }
        return prev;
    }, '0.0.0');
}
async function onCheckModVersion(api, gameId, mods) {
    const profile = vortex_api_1.selectors.activeProfile(api.getState());
    if (profile.gameId !== common_1.GAME_ID || gameId !== common_1.GAME_ID) {
        return;
    }
    const latestVer = getLatestInstalledLSLibVer(api);
    if (latestVer === '0.0.0') {
        return;
    }
    const newestVer = await gitHubDownloader.checkForUpdates(api, latestVer);
    if (!newestVer || newestVer === latestVer) {
        return;
    }
}
function nop() {
}
async function onGameModeActivated(api, gameId) {
    if (gameId !== common_1.GAME_ID) {
        return;
    }
    try {
        await readStoredLO(api);
    }
    catch (err) {
        api.showErrorNotification('Failed to read load order', err, {
            message: 'Please run the game before you start modding',
            allowReport: false,
        });
    }
    const latestVer = getLatestInstalledLSLibVer(api);
    if (latestVer === '0.0.0') {
        await gitHubDownloader.downloadDivine(api);
    }
}
function main(context) {
    context.registerReducer(['settings', 'baldursgate3'], reducer);
    context.registerGame({
        id: common_1.GAME_ID,
        name: 'Baldur\'s Gate 3',
        mergeMods: true,
        queryPath: findGame,
        supportedTools: [
            {
                id: 'exevulkan',
                name: 'Baldur\'s Gate 3 (Vulkan)',
                executable: () => 'bin/bg3.exe',
                requiredFiles: [
                    'bin/bg3.exe',
                ],
                relative: true,
            },
        ],
        queryModPath: modsPath,
        logo: 'gameart.jpg',
        executable: () => 'bin/bg3_dx11.exe',
        setup: discovery => prepareForModding(context.api, discovery),
        requiredFiles: [
            'bin/bg3_dx11.exe',
        ],
        environment: {
            SteamAPPId: '1086940',
        },
        details: {
            steamAppId: 1086940,
            stopPatterns: STOP_PATTERNS.map(toWordExp),
            ignoreConflicts: [
                'info.json',
            ],
            ignoreDeploy: [
                'info.json',
            ],
        },
    });
    context.registerAction('mod-icons', 300, 'settings', {}, 'Re-install LSLib/Divine', () => {
        const state = context.api.getState();
        const mods = state?.persistent?.mods?.[common_1.GAME_ID] ?? {};
        const lslibs = Object.keys(mods).filter((mod) => mods[mod].type === 'bg3-lslib-divine-tool');
        context.api.events.emit('remove-mods', common_1.GAME_ID, lslibs, (err) => {
            if (err !== null) {
                context.api.showErrorNotification('Failed to reinstall lslib', 'Please re-install manually', { allowReport: false });
                return;
            }
            gitHubDownloader.downloadDivine(context.api);
        });
    }, () => {
        const state = context.api.store.getState();
        const gameMode = vortex_api_1.selectors.activeGameId(state);
        return gameMode === common_1.GAME_ID;
    });
    context.registerInstaller('bg3-replacer', 25, testReplacer, installReplacer);
    context.registerInstaller('bg3-lslib-divine-tool', 15, testLSLib, installLSLib);
    context.registerModType('bg3-replacer', 25, (gameId) => gameId === common_1.GAME_ID, () => getGameDataPath(context.api), files => isReplacer(context.api, files), { name: 'BG3 Replacer' });
    context.registerModType('bg3-lslib-divine-tool', 15, (gameId) => gameId === common_1.GAME_ID, () => undefined, files => isLSLib(context.api, files), { name: 'BG3 LSLib' });
    context.registerLoadOrder({
        gameId: common_1.GAME_ID,
        deserializeLoadOrder: () => deserializeLoadOrder(context.api),
        serializeLoadOrder: (loadOrder) => serializeLoadOrder(context.api, loadOrder),
        validate,
        toggleableEntries: true,
        usageInstructions: (() => (React.createElement(InfoPanelWrap, { api: context.api, refresh: nop }))),
    });
    context.once(() => {
        context.api.onStateChange(['session', 'base', 'toolsRunning'], async (prev, current) => {
            const gameMode = vortex_api_1.selectors.activeGameId(context.api.getState());
            if ((gameMode === common_1.GAME_ID) && (Object.keys(current).length === 0)) {
                try {
                    await readStoredLO(context.api);
                }
                catch (err) {
                    context.api.showErrorNotification('Failed to read load order', err, {
                        message: 'Please run the game before you start modding',
                        allowReport: false,
                    });
                }
            }
        });
        context.api.onAsync('did-deploy', (profileId, deployment) => {
            const profile = vortex_api_1.selectors.profileById(context.api.getState(), profileId);
            if ((profile?.gameId === common_1.GAME_ID) && (forceRefresh !== undefined)) {
                forceRefresh();
            }
            return Promise.resolve();
        });
        context.api.events.on('check-mods-version', (gameId, mods) => onCheckModVersion(context.api, gameId, mods));
        context.api.events.on('gamemode-activated', async (gameMode) => onGameModeActivated(context.api, gameMode));
    });
    return true;
}
exports.default = main;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHdEQUFnQztBQUNoQyxpREFBc0M7QUFDdEMsOERBQXFDO0FBRXJDLDJDQUE2QjtBQUM3Qiw2Q0FBK0I7QUFDL0IscURBQXFEO0FBQ3JELDZDQUEwQztBQUMxQyx5Q0FBeUM7QUFDekMsK0NBQWlDO0FBQ2pDLHFDQUE4QztBQUM5QywwREFBeUM7QUFDekMsMkNBQStFO0FBQy9FLG1DQUFxRDtBQUdyRCxxQ0FBb0U7QUFDcEUscUVBQXVEO0FBRXZELE1BQU0sYUFBYSxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7QUFFdkMsU0FBUyxTQUFTLENBQUMsS0FBSztJQUN0QixPQUFPLE9BQU8sR0FBRyxLQUFLLEdBQUcsT0FBTyxDQUFDO0FBQ25DLENBQUM7QUFHRCxNQUFNLGdCQUFnQixHQUFHLElBQUEsd0JBQVksRUFBQyx1QkFBdUIsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzdFLE1BQU0sZUFBZSxHQUFHLElBQUEsd0JBQVksRUFBQyxzQkFBc0IsRUFDekQsQ0FBQyxPQUFlLEVBQUUsSUFBWSxFQUFFLEtBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBR2hGLE1BQU0sT0FBTyxHQUF1QjtJQUNsQyxRQUFRLEVBQUU7UUFDUixDQUFDLGdCQUF1QixDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxlQUFlLENBQUMsRUFBRSxPQUFPLENBQUM7UUFDOUYsQ0FBQyxlQUFzQixDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDM0MsTUFBTSxF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LFlBQVksRUFBRSxDQUFDLFNBQWlCLEVBQUUsVUFBVSxFQUFFLEVBQUU7WUFDbEUsTUFBTSxPQUFPLEdBQUcsc0JBQVMsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN6RSxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sS0FBSyxnQkFBTyxDQUFDLElBQUksQ0FBQyxZQUFZLEtBQUssU0FBUyxDQUFDLEVBQUU7Z0JBQ2pFLFlBQVksRUFBRSxDQUFDO2FBQ2hCO1lBQ0QsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDM0IsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsb0JBQW9CLEVBQ3hDLENBQUMsTUFBYyxFQUFFLElBQWtCLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFFeEYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLG9CQUFvQixFQUN4QyxLQUFLLEVBQUUsUUFBZ0IsRUFBRSxFQUFFLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQzVFLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsa0JBQWUsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7IHNwYXduIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgZ2V0VmVyc2lvbiBmcm9tICdleGUtdmVyc2lvbic7XG5pbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgQWxlcnQsIEZvcm1Db250cm9sIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcbmltcG9ydCB7IHVzZVNlbGVjdG9yIH0gZnJvbSAncmVhY3QtcmVkdXgnO1xuaW1wb3J0IHsgY3JlYXRlQWN0aW9uIH0gZnJvbSAncmVkdXgtYWN0JztcbmltcG9ydCAqIGFzIHNlbXZlciBmcm9tICdzZW12ZXInO1xuaW1wb3J0IHsgZ2VuZXJhdGUgYXMgc2hvcnRpZCB9IGZyb20gJ3Nob3J0aWQnO1xuaW1wb3J0IHdhbGssIHsgSUVudHJ5IH0gZnJvbSAndHVyYm93YWxrJztcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBsb2csIHNlbGVjdG9ycywgdG9vbHRpcCwgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcbmltcG9ydCB7IEJ1aWxkZXIsIHBhcnNlU3RyaW5nUHJvbWlzZSB9IGZyb20gJ3htbDJqcyc7XG5pbXBvcnQgeyBJTG9hZE9yZGVyRW50cnksIElNb2ROb2RlLCBJTW9kU2V0dGluZ3MsIElQYWtJbmZvLCBJWG1sTm9kZSB9IGZyb20gJy4vdHlwZXMnO1xuXG5pbXBvcnQgeyBERUZBVUxUX01PRF9TRVRUSU5HUywgR0FNRV9JRCwgTFNMSUJfVVJMIH0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0ICogYXMgZ2l0SHViRG93bmxvYWRlciBmcm9tICcuL2dpdGh1YkRvd25sb2FkZXInO1xuXG5jb25zdCBTVE9QX1BBVFRFUk5TID0gWydbXi9dKlxcXFwucGFrJCddO1xuXG5mdW5jdGlvbiB0b1dvcmRFeHAoaW5wdXQpIHtcbiAgcmV0dXJuICcoXnwvKScgKyBpbnB1dCArICcoL3wkKSc7XG59XG5cbi8vIGFjdGlvbnNcbmNvbnN0IHNldFBsYXllclByb2ZpbGUgPSBjcmVhdGVBY3Rpb24oJ0JHM19TRVRfUExBWUVSUFJPRklMRScsIG5hbWUgPT4gbmFtZSk7XG5jb25zdCBzZXR0aW5nc1dyaXR0ZW4gPSBjcmVhdGVBY3Rpb24oJ0JHM19TRVRUSU5HU19XUklUVEVOJyxcbiAgKHByb2ZpbGU6IHN0cmluZywgdGltZTogbnVtYmVyLCBjb3VudDogbnVtYmVyKSA9PiAoeyBwcm9maWxlLCB0aW1lLCBjb3VudCB9KSk7XG5cbi8vIHJlZHVjZXJcbmNvbnN0IHJlZHVjZXI6IHR5cGVzLklSZWR1Y2VyU3BlYyA9IHtcbiAgcmVkdWNlcnM6IHtcbiAgICBbc2V0UGxheWVyUHJvZmlsZSBhcyBhbnldOiAoc3RhdGUsIHBheWxvYWQpID0+IHV0aWwuc2V0U2FmZShzdGF0ZSwgWydwbGF5ZXJQcm9maWxlJ10sIHBheWxvYWQpLFxuICAgIFtzZXR0aW5nc1dyaXR0ZW4gYXMgYW55XTogKHN0YXRlLCBwYXlsb2FkKSA9PiB7XG4gICAgICBjb25zdCB7IHByb2ZpbGUsIHRpbWUsIGNvdW50IH0gPSBwYXlsb2FkO1xuICAgICAgcmV0dXJuIHV0aWwuc2V0U2FmZShzdGF0ZSwgWydzZXR0aW5nc1dyaXR0ZW4nLCBwcm9maWxlXSwgeyB0aW1lLCBjb3VudCB9KTtcbiAgICB9LFxuICB9LFxuICBkZWZhdWx0czoge1xuICAgIHBsYXllclByb2ZpbGU6ICdnbG9iYWwnLFxuICAgIHNldHRpbmdzV3JpdHRlbjoge30sXG4gIH0sXG59O1xuXG5mdW5jdGlvbiBkb2N1bWVudHNQYXRoKCkge1xuICByZXR1cm4gcGF0aC5qb2luKHV0aWwuZ2V0Vm9ydGV4UGF0aCgnbG9jYWxBcHBEYXRhJyksICdMYXJpYW4gU3R1ZGlvcycsICdCYWxkdXJcXCdzIEdhdGUgMycpO1xufVxuXG5mdW5jdGlvbiBtb2RzUGF0aCgpIHtcbiAgcmV0dXJuIHBhdGguam9pbihkb2N1bWVudHNQYXRoKCksICdNb2RzJyk7XG59XG5cbmZ1bmN0aW9uIHByb2ZpbGVzUGF0aCgpIHtcbiAgcmV0dXJuIHBhdGguam9pbihkb2N1bWVudHNQYXRoKCksICdQbGF5ZXJQcm9maWxlcycpO1xufVxuXG5mdW5jdGlvbiBnbG9iYWxQcm9maWxlUGF0aCgpIHtcbiAgcmV0dXJuIHBhdGguam9pbihkb2N1bWVudHNQYXRoKCksICdnbG9iYWwnKTtcbn1cblxuZnVuY3Rpb24gZmluZEdhbWUoKTogYW55IHtcbiAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFsnMTQ1NjQ2MDY2OScsICcxMDg2OTQwJ10pXG4gICAgLnRoZW4oZ2FtZSA9PiBnYW1lLmdhbWVQYXRoKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZW5zdXJlR2xvYmFsUHJvZmlsZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCkge1xuICBpZiAoZGlzY292ZXJ5Py5wYXRoKSB7XG4gICAgY29uc3QgcHJvZmlsZVBhdGggPSBnbG9iYWxQcm9maWxlUGF0aCgpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHByb2ZpbGVQYXRoKTtcbiAgICAgIGNvbnN0IG1vZFNldHRpbmdzRmlsZVBhdGggPSBwYXRoLmpvaW4ocHJvZmlsZVBhdGgsICdtb2RzZXR0aW5ncy5sc3gnKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGZzLnN0YXRBc3luYyhtb2RTZXR0aW5nc0ZpbGVQYXRoKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyhtb2RTZXR0aW5nc0ZpbGVQYXRoLCBERUZBVUxUX01PRF9TRVRUSU5HUywgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHByZXBhcmVGb3JNb2RkaW5nKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZGlzY292ZXJ5KTogYW55IHtcbiAgY29uc3QgbXAgPSBtb2RzUGF0aCgpO1xuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgaWQ6ICdiZzMtdXNlcy1sc2xpYicsXG4gICAgdHlwZTogJ2luZm8nLFxuICAgIHRpdGxlOiAnQkczIHN1cHBvcnQgdXNlcyBMU0xpYicsXG4gICAgbWVzc2FnZTogTFNMSUJfVVJMLFxuICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXG4gICAgYWN0aW9uczogW1xuICAgICAgeyB0aXRsZTogJ1Zpc2l0IFBhZ2UnLCBhY3Rpb246ICgpID0+IHV0aWwub3BuKExTTElCX1VSTCkuY2F0Y2goKCkgPT4gbnVsbCkgfSxcbiAgICBdLFxuICB9KTtcbiAgcmV0dXJuIGZzLnN0YXRBc3luYyhtcClcbiAgICAuY2F0Y2goKCkgPT4gZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhtcCwgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSgpIGFzIGFueSlcbiAgICAgIC50aGVuKCgpID0+IGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ0Vhcmx5IEFjY2VzcyBHYW1lJywge1xuICAgICAgICBiYmNvZGU6ICdCYWxkdXJcXCdzIEdhdGUgMyBpcyBjdXJyZW50bHkgaW4gRWFybHkgQWNjZXNzLiBJdCBkb2VzblxcJ3Qgb2ZmaWNpYWxseSAnXG4gICAgICAgICAgICArICdzdXBwb3J0IG1vZGRpbmcsIGRvZXNuXFwndCBpbmNsdWRlIGFueSBtb2RkaW5nIHRvb2xzIGFuZCB3aWxsIHJlY2VpdmUgJ1xuICAgICAgICAgICAgKyAnZnJlcXVlbnQgdXBkYXRlcy48YnIvPidcbiAgICAgICAgICAgICsgJ01vZHMgbWF5IGJlY29tZSBpbmNvbXBhdGlibGUgd2l0aGluIGRheXMgb2YgYmVpbmcgcmVsZWFzZWQsIGdlbmVyYWxseSAnXG4gICAgICAgICAgICArICdub3Qgd29yayBhbmQvb3IgYnJlYWsgdW5yZWxhdGVkIHRoaW5ncyB3aXRoaW4gdGhlIGdhbWUuPGJyLz48YnIvPidcbiAgICAgICAgICAgICsgJ1tjb2xvcj1cInJlZFwiXVBsZWFzZSBkb25cXCd0IHJlcG9ydCBpc3N1ZXMgdGhhdCBoYXBwZW4gaW4gY29ubmVjdGlvbiB3aXRoIG1vZHMgdG8gdGhlICdcbiAgICAgICAgICAgICsgJ2dhbWUgZGV2ZWxvcGVycyAoTGFyaWFuIFN0dWRpb3MpIG9yIHRocm91Z2ggdGhlIFZvcnRleCBmZWVkYmFjayBzeXN0ZW0uWy9jb2xvcl0nLFxuICAgICAgfSwgWyB7IGxhYmVsOiAnSSB1bmRlcnN0YW5kJyB9IF0pKSlcbiAgICAuZmluYWxseSgoKSA9PiBlbnN1cmVHbG9iYWxQcm9maWxlKGFwaSwgZGlzY292ZXJ5KSk7XG59XG5cbmZ1bmN0aW9uIGdldEdhbWVQYXRoKGFwaSkge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICByZXR1cm4gc3RhdGUuc2V0dGluZ3MuZ2FtZU1vZGUuZGlzY292ZXJlZD8uW0dBTUVfSURdPy5wYXRoO1xufVxuXG5mdW5jdGlvbiBnZXRHYW1lRGF0YVBhdGgoYXBpKSB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XG4gIGNvbnN0IGdhbWVQYXRoID0gc3RhdGUuc2V0dGluZ3MuZ2FtZU1vZGUuZGlzY292ZXJlZD8uW0dBTUVfSURdPy5wYXRoO1xuICBpZiAoZ2FtZVBhdGggIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBwYXRoLmpvaW4oZ2FtZVBhdGgsICdEYXRhJyk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufVxuXG5jb25zdCBPUklHSU5BTF9GSUxFUyA9IG5ldyBTZXQoW1xuICAnYXNzZXRzLnBhaycsXG4gICdhc3NldHMucGFrJyxcbiAgJ2VmZmVjdHMucGFrJyxcbiAgJ2VuZ2luZS5wYWsnLFxuICAnZW5naW5lc2hhZGVycy5wYWsnLFxuICAnZ2FtZS5wYWsnLFxuICAnZ2FtZXBsYXRmb3JtLnBhaycsXG4gICdndXN0YXYucGFrJyxcbiAgJ2d1c3Rhdl90ZXh0dXJlcy5wYWsnLFxuICAnaWNvbnMucGFrJyxcbiAgJ2xvd3RleC5wYWsnLFxuICAnbWF0ZXJpYWxzLnBhaycsXG4gICdtaW5pbWFwcy5wYWsnLFxuICAnbW9kZWxzLnBhaycsXG4gICdzaGFyZWQucGFrJyxcbiAgJ3NoYXJlZHNvdW5kYmFua3MucGFrJyxcbiAgJ3NoYXJlZHNvdW5kcy5wYWsnLFxuICAndGV4dHVyZXMucGFrJyxcbiAgJ3ZpcnR1YWx0ZXh0dXJlcy5wYWsnLFxuXSk7XG5cbmNvbnN0IExTTElCX0ZJTEVTID0gbmV3IFNldChbXG4gICdkaXZpbmUuZXhlJyxcbiAgJ2xzbGliLmRsbCcsXG5dKTtcblxuZnVuY3Rpb24gaXNMU0xpYihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGZpbGVzOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSkge1xuICBjb25zdCBvcmlnRmlsZSA9IGZpbGVzLmZpbmQoaXRlciA9PlxuICAgIChpdGVyLnR5cGUgPT09ICdjb3B5JykgJiYgTFNMSUJfRklMRVMuaGFzKHBhdGguYmFzZW5hbWUoaXRlci5kZXN0aW5hdGlvbikudG9Mb3dlckNhc2UoKSkpO1xuICByZXR1cm4gb3JpZ0ZpbGUgIT09IHVuZGVmaW5lZFxuICAgID8gQmx1ZWJpcmQucmVzb2x2ZSh0cnVlKVxuICAgIDogQmx1ZWJpcmQucmVzb2x2ZShmYWxzZSk7XG59XG5cbmZ1bmN0aW9uIHRlc3RMU0xpYihmaWxlczogc3RyaW5nW10sIGdhbWVJZDogc3RyaW5nKTogQmx1ZWJpcmQ8dHlwZXMuSVN1cHBvcnRlZFJlc3VsdD4ge1xuICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoeyBzdXBwb3J0ZWQ6IGZhbHNlLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcbiAgfVxuICBjb25zdCBtYXRjaGVkRmlsZXMgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiBMU0xJQl9GSUxFUy5oYXMocGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpKSk7XG5cbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoe1xuICAgIHN1cHBvcnRlZDogbWF0Y2hlZEZpbGVzLmxlbmd0aCA+PSAyLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gaW5zdGFsbExTTGliKGZpbGVzOiBzdHJpbmdbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvblBhdGg6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lSWQ6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmVzc0RlbGVnYXRlOiB0eXBlcy5Qcm9ncmVzc0RlbGVnYXRlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogUHJvbWlzZTx0eXBlcy5JSW5zdGFsbFJlc3VsdD4ge1xuICBjb25zdCBleGUgPSBmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlLnRvTG93ZXJDYXNlKCkpID09PSAnZGl2aW5lLmV4ZScpO1xuICBjb25zdCBleGVQYXRoID0gcGF0aC5qb2luKGRlc3RpbmF0aW9uUGF0aCwgZXhlKTtcbiAgbGV0IHZlcjogc3RyaW5nID0gYXdhaXQgZ2V0VmVyc2lvbihleGVQYXRoKTtcbiAgdmVyID0gdmVyLnNwbGl0KCcuJykuc2xpY2UoMCwgMykuam9pbignLicpO1xuXG4gIC8vIFVuZm9ydHVuYXRlbHkgdGhlIExTTGliIGRldmVsb3BlciBpcyBub3QgY29uc2lzdGVudCB3aGVuIGNoYW5naW5nXG4gIC8vICBmaWxlIHZlcnNpb25zIC0gdGhlIGV4ZWN1dGFibGUgYXR0cmlidXRlIG1pZ2h0IGhhdmUgYW4gb2xkZXIgdmVyc2lvblxuICAvLyAgdmFsdWUgdGhhbiB0aGUgb25lIHNwZWNpZmllZCBieSB0aGUgZmlsZW5hbWUgLSB3ZSdyZSBnb2luZyB0byB1c2VcbiAgLy8gIHRoZSBmaWxlbmFtZSBhcyB0aGUgcG9pbnQgb2YgdHJ1dGggKnVnaCpcbiAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKGRlc3RpbmF0aW9uUGF0aCwgcGF0aC5leHRuYW1lKGRlc3RpbmF0aW9uUGF0aCkpO1xuICBjb25zdCBpZHggPSBmaWxlTmFtZS5pbmRleE9mKCctdicpO1xuICBjb25zdCBmaWxlTmFtZVZlciA9IGZpbGVOYW1lLnNsaWNlKGlkeCArIDIpO1xuICBpZiAoc2VtdmVyLnZhbGlkKGZpbGVOYW1lVmVyKSAmJiB2ZXIgIT09IGZpbGVOYW1lVmVyKSB7XG4gICAgdmVyID0gZmlsZU5hbWVWZXI7XG4gIH1cbiAgY29uc3QgdmVyc2lvbkF0dHI6IHR5cGVzLklJbnN0cnVjdGlvbiA9IHsgdHlwZTogJ2F0dHJpYnV0ZScsIGtleTogJ3ZlcnNpb24nLCB2YWx1ZTogdmVyIH07XG4gIGNvbnN0IG1vZHR5cGVBdHRyOiB0eXBlcy5JSW5zdHJ1Y3Rpb24gPSB7IHR5cGU6ICdzZXRtb2R0eXBlJywgdmFsdWU6ICdiZzMtbHNsaWItZGl2aW5lLXRvb2wnIH07XG4gIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPVxuICAgIGZpbGVzLnJlZHVjZSgoYWNjdW06IHR5cGVzLklJbnN0cnVjdGlvbltdLCBmaWxlUGF0aDogc3RyaW5nKSA9PiB7XG4gICAgICBpZiAoZmlsZVBhdGgudG9Mb3dlckNhc2UoKVxuICAgICAgICAgICAgICAgICAgLnNwbGl0KHBhdGguc2VwKVxuICAgICAgICAgICAgICAgICAgLmluZGV4T2YoJ3Rvb2xzJykgIT09IC0xXG4gICAgICAmJiAhZmlsZVBhdGguZW5kc1dpdGgocGF0aC5zZXApKSB7XG4gICAgICAgIGFjY3VtLnB1c2goe1xuICAgICAgICAgIHR5cGU6ICdjb3B5JyxcbiAgICAgICAgICBzb3VyY2U6IGZpbGVQYXRoLFxuICAgICAgICAgIGRlc3RpbmF0aW9uOiBwYXRoLmpvaW4oJ3Rvb2xzJywgcGF0aC5iYXNlbmFtZShmaWxlUGF0aCkpLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhY2N1bTtcbiAgICB9LCBbIG1vZHR5cGVBdHRyLCB2ZXJzaW9uQXR0ciBdKTtcblxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xufVxuXG5mdW5jdGlvbiBpc1JlcGxhY2VyKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZmlsZXM6IHR5cGVzLklJbnN0cnVjdGlvbltdKSB7XG4gIGNvbnN0IG9yaWdGaWxlID0gZmlsZXMuZmluZChpdGVyID0+XG4gICAgKGl0ZXIudHlwZSA9PT0gJ2NvcHknKSAmJiBPUklHSU5BTF9GSUxFUy5oYXMoaXRlci5kZXN0aW5hdGlvbi50b0xvd2VyQ2FzZSgpKSk7XG5cbiAgY29uc3QgcGFrcyA9IGZpbGVzLmZpbHRlcihpdGVyID0+XG4gICAgKGl0ZXIudHlwZSA9PT0gJ2NvcHknKSAmJiAocGF0aC5leHRuYW1lKGl0ZXIuZGVzdGluYXRpb24pLnRvTG93ZXJDYXNlKCkgPT09ICcucGFrJykpO1xuXG4gIGlmICgob3JpZ0ZpbGUgIT09IHVuZGVmaW5lZCkgfHwgKHBha3MubGVuZ3RoID09PSAwKSkge1xuICAgIHJldHVybiBhcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnTW9kIGxvb2tzIGxpa2UgYSByZXBsYWNlcicsIHtcbiAgICAgIGJiY29kZTogJ1RoZSBtb2QgeW91IGp1c3QgaW5zdGFsbGVkIGxvb2tzIGxpa2UgYSBcInJlcGxhY2VyXCIsIG1lYW5pbmcgaXQgaXMgaW50ZW5kZWQgdG8gcmVwbGFjZSAnXG4gICAgICAgICAgKyAnb25lIG9mIHRoZSBmaWxlcyBzaGlwcGVkIHdpdGggdGhlIGdhbWUuPGJyLz4nXG4gICAgICAgICAgKyAnWW91IHNob3VsZCBiZSBhd2FyZSB0aGF0IHN1Y2ggYSByZXBsYWNlciBpbmNsdWRlcyBhIGNvcHkgb2Ygc29tZSBnYW1lIGRhdGEgZnJvbSBhICdcbiAgICAgICAgICArICdzcGVjaWZpYyB2ZXJzaW9uIG9mIHRoZSBnYW1lIGFuZCBtYXkgdGhlcmVmb3JlIGJyZWFrIGFzIHNvb24gYXMgdGhlIGdhbWUgZ2V0cyB1cGRhdGVkLjxici8+J1xuICAgICAgICAgICsgJ0V2ZW4gaWYgZG9lc25cXCd0IGJyZWFrLCBpdCBtYXkgcmV2ZXJ0IGJ1Z2ZpeGVzIHRoYXQgdGhlIGdhbWUgJ1xuICAgICAgICAgICsgJ2RldmVsb3BlcnMgaGF2ZSBtYWRlLjxici8+PGJyLz4nXG4gICAgICAgICAgKyAnVGhlcmVmb3JlIFtjb2xvcj1cInJlZFwiXXBsZWFzZSB0YWtlIGV4dHJhIGNhcmUgdG8ga2VlcCB0aGlzIG1vZCB1cGRhdGVkWy9jb2xvcl0gYW5kIHJlbW92ZSBpdCB3aGVuIGl0ICdcbiAgICAgICAgICArICdubyBsb25nZXIgbWF0Y2hlcyB0aGUgZ2FtZSB2ZXJzaW9uLicsXG4gICAgfSwgW1xuICAgICAgeyBsYWJlbDogJ0luc3RhbGwgYXMgTW9kICh3aWxsIGxpa2VseSBub3Qgd29yayknIH0sXG4gICAgICB7IGxhYmVsOiAnSW5zdGFsbCBhcyBSZXBsYWNlcicgfSxcbiAgICBdKS50aGVuKHJlc3VsdCA9PiByZXN1bHQuYWN0aW9uID09PSAnSW5zdGFsbCBhcyBSZXBsYWNlcicpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKGZhbHNlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB0ZXN0UmVwbGFjZXIoZmlsZXM6IHN0cmluZ1tdLCBnYW1lSWQ6IHN0cmluZyk6IEJsdWViaXJkPHR5cGVzLklTdXBwb3J0ZWRSZXN1bHQ+IHtcbiAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHsgc3VwcG9ydGVkOiBmYWxzZSwgcmVxdWlyZWRGaWxlczogW10gfSk7XG4gIH1cbiAgY29uc3QgcGFrcyA9IGZpbGVzLmZpbHRlcihmaWxlID0+IHBhdGguZXh0bmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSAnLnBhaycpO1xuXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHtcbiAgICBzdXBwb3J0ZWQ6IHBha3MubGVuZ3RoID09PSAwLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxuICB9KTtcbn1cblxuZnVuY3Rpb24gaW5zdGFsbFJlcGxhY2VyKGZpbGVzOiBzdHJpbmdbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvblBhdGg6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lSWQ6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmVzc0RlbGVnYXRlOiB0eXBlcy5Qcm9ncmVzc0RlbGVnYXRlKVxuICAgICAgICAgICAgICAgICAgICAgICAgIDogQmx1ZWJpcmQ8dHlwZXMuSUluc3RhbGxSZXN1bHQ+IHtcbiAgY29uc3QgZGlyZWN0b3JpZXMgPSBBcnJheS5mcm9tKG5ldyBTZXQoZmlsZXMubWFwKGZpbGUgPT4gcGF0aC5kaXJuYW1lKGZpbGUpLnRvVXBwZXJDYXNlKCkpKSk7XG4gIGxldCBkYXRhUGF0aDogc3RyaW5nID0gZGlyZWN0b3JpZXMuZmluZChkaXIgPT4gcGF0aC5iYXNlbmFtZShkaXIpID09PSAnREFUQScpO1xuICBpZiAoZGF0YVBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IGdlbk9yUHVibGljID0gZGlyZWN0b3JpZXNcbiAgICAgIC5maW5kKGRpciA9PiBbJ1BVQkxJQycsICdHRU5FUkFURUQnXS5pbmNsdWRlcyhwYXRoLmJhc2VuYW1lKGRpcikpKTtcbiAgICBpZiAoZ2VuT3JQdWJsaWMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgZGF0YVBhdGggPSBwYXRoLmRpcm5hbWUoZ2VuT3JQdWJsaWMpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPSAoZGF0YVBhdGggIT09IHVuZGVmaW5lZClcbiAgICA/IGZpbGVzLnJlZHVjZSgocHJldjogdHlwZXMuSUluc3RydWN0aW9uW10sIGZpbGVQYXRoOiBzdHJpbmcpID0+IHtcbiAgICAgIGlmIChmaWxlUGF0aC5lbmRzV2l0aChwYXRoLnNlcCkpIHtcbiAgICAgICAgcmV0dXJuIHByZXY7XG4gICAgICB9XG4gICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShkYXRhUGF0aCwgZmlsZVBhdGgpO1xuICAgICAgaWYgKCFyZWxQYXRoLnN0YXJ0c1dpdGgoJy4uJykpIHtcbiAgICAgICAgcHJldi5wdXNoKHtcbiAgICAgICAgICB0eXBlOiAnY29weScsXG4gICAgICAgICAgc291cmNlOiBmaWxlUGF0aCxcbiAgICAgICAgICBkZXN0aW5hdGlvbjogcmVsUGF0aCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcHJldjtcbiAgICB9LCBbXSlcbiAgICA6IGZpbGVzLm1hcCgoZmlsZVBhdGg6IHN0cmluZyk6IHR5cGVzLklJbnN0cnVjdGlvbiA9PiAoe1xuICAgICAgICB0eXBlOiAnY29weScsXG4gICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXG4gICAgICAgIGRlc3RpbmF0aW9uOiBmaWxlUGF0aCxcbiAgICAgIH0pKTtcblxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7XG4gICAgaW5zdHJ1Y3Rpb25zLFxuICB9KTtcbn1cblxuY29uc3QgZ2V0UGxheWVyUHJvZmlsZXMgPSAoKCkgPT4ge1xuICBsZXQgY2FjaGVkID0gW107XG4gIHRyeSB7XG4gICAgY2FjaGVkID0gKGZzIGFzIGFueSkucmVhZGRpclN5bmMocHJvZmlsZXNQYXRoKCkpXG4gICAgICAgIC5maWx0ZXIobmFtZSA9PiAocGF0aC5leHRuYW1lKG5hbWUpID09PSAnJykgJiYgKG5hbWUgIT09ICdEZWZhdWx0JykpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoZXJyLmNvZGUgIT09ICdFTk9FTlQnKSB7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICB9XG4gIHJldHVybiAoKSA9PiBjYWNoZWQ7XG59KSgpO1xuXG5mdW5jdGlvbiBnYW1lU3VwcG9ydHNQcm9maWxlKGdhbWVWZXJzaW9uOiBzdHJpbmcpIHtcbiAgcmV0dXJuIHNlbXZlci5sdChzZW12ZXIuY29lcmNlKGdhbWVWZXJzaW9uKSwgJzQuMS4yMDYnKTtcbn1cblxuZnVuY3Rpb24gSW5mb1BhbmVsKHByb3BzKSB7XG4gIGNvbnN0IHsgdCwgZ2FtZVZlcnNpb24sIG9uSW5zdGFsbExTTGliLFxuICAgICAgICAgIG9uU2V0UGxheWVyUHJvZmlsZSwgaXNMc0xpYkluc3RhbGxlZCB9ID0gcHJvcHM7XG5cbiAgY29uc3Qgc3VwcG9ydHNQcm9maWxlcyA9IGdhbWVTdXBwb3J0c1Byb2ZpbGUoZ2FtZVZlcnNpb24pO1xuICBjb25zdCBjdXJyZW50UHJvZmlsZSA9IHN1cHBvcnRzUHJvZmlsZXMgPyBwcm9wcy5jdXJyZW50UHJvZmlsZSA6ICdQdWJsaWMnO1xuXG4gIGNvbnN0IG9uU2VsZWN0ID0gUmVhY3QudXNlQ2FsbGJhY2soKGV2KSA9PiB7XG4gICAgb25TZXRQbGF5ZXJQcm9maWxlKGV2LmN1cnJlbnRUYXJnZXQudmFsdWUpO1xuICB9LCBbb25TZXRQbGF5ZXJQcm9maWxlXSk7XG5cbiAgcmV0dXJuIGlzTHNMaWJJbnN0YWxsZWQoKSA/IChcbiAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIHBhZGRpbmc6ICcxNnB4JyB9fT5cbiAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCB3aGl0ZVNwYWNlOiAnbm93cmFwJywgYWxpZ25JdGVtczogJ2NlbnRlcicgfX0+XG4gICAgICAgIHt0KCdJbmdhbWUgUHJvZmlsZTogJyl9XG4gICAgICAgIHtzdXBwb3J0c1Byb2ZpbGVzID8gKFxuICAgICAgICAgIDxGb3JtQ29udHJvbFxuICAgICAgICAgICAgY29tcG9uZW50Q2xhc3M9J3NlbGVjdCdcbiAgICAgICAgICAgIG5hbWU9J3VzZXJQcm9maWxlJ1xuICAgICAgICAgICAgY2xhc3NOYW1lPSdmb3JtLWNvbnRyb2wnXG4gICAgICAgICAgICB2YWx1ZT17Y3VycmVudFByb2ZpbGV9XG4gICAgICAgICAgICBvbkNoYW5nZT17b25TZWxlY3R9XG4gICAgICAgICAgPlxuICAgICAgICAgICAgPG9wdGlvbiBrZXk9J2dsb2JhbCcgdmFsdWU9J2dsb2JhbCc+e3QoJ0FsbCBQcm9maWxlcycpfTwvb3B0aW9uPlxuICAgICAgICAgICAge2dldFBsYXllclByb2ZpbGVzKCkubWFwKHByb2YgPT4gKDxvcHRpb24ga2V5PXtwcm9mfSB2YWx1ZT17cHJvZn0+e3Byb2Z9PC9vcHRpb24+KSl9XG4gICAgICAgICAgPC9Gb3JtQ29udHJvbD5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICA8L2Rpdj5cbiAgICAgIHtzdXBwb3J0c1Byb2ZpbGVzID8gbnVsbCA6IChcbiAgICAgICAgPGRpdj5cbiAgICAgICAgICA8QWxlcnQgYnNTdHlsZT0naW5mbyc+XG4gICAgICAgICAgICB7dCgnUGF0Y2ggOSByZW1vdmVkIHRoZSBmZWF0dXJlIG9mIHN3aXRjaGluZyBwcm9maWxlcyBpbnNpZGUgdGhlIGdhbWUsIHNhdmVnYW1lcyBhcmUgJ1xuICAgICAgICAgICAgICArICdub3cgdGllZCB0byB0aGUgY2hhcmFjdGVyLlxcbiBJdCBpcyBjdXJyZW50bHkgdW5rbm93biBpZiB0aGVzZSBwcm9maWxlcyB3aWxsICdcbiAgICAgICAgICAgICAgKyAncmV0dXJuIGJ1dCBvZiBjb3Vyc2UgeW91IGNhbiBjb250aW51ZSB0byB1c2UgVm9ydGV4IHByb2ZpbGVzLicpfVxuICAgICAgICAgIDwvQWxlcnQ+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cbiAgICAgIDxoci8+XG4gICAgICA8ZGl2PlxuICAgICAgICB7dCgnUGxlYXNlIHJlZmVyIHRvIG1vZCBkZXNjcmlwdGlvbnMgZnJvbSBtb2QgYXV0aG9ycyB0byBkZXRlcm1pbmUgdGhlIHJpZ2h0IG9yZGVyLiAnXG4gICAgICAgICAgKyAnSWYgeW91IGNhblxcJ3QgZmluZCBhbnkgc3VnZ2VzdGlvbnMgZm9yIGEgbW9kLCBpdCBwcm9iYWJseSBkb2VzblxcJ3QgbWF0dGVyLicpfVxuICAgICAgICA8aHIvPlxuICAgICAgICB7dCgnU29tZSBtb2RzIG1heSBiZSBsb2NrZWQgaW4gdGhpcyBsaXN0IGJlY2F1c2UgdGhleSBhcmUgbG9hZGVkIGRpZmZlcmVudGx5IGJ5IHRoZSBlbmdpbmUgJ1xuICAgICAgICAgICsgJ2FuZCBjYW4gdGhlcmVmb3JlIG5vdCBiZSBsb2FkLW9yZGVyZWQgYnkgbW9kIG1hbmFnZXJzLiBJZiB5b3Ugd2FudCB0byBkaXNhYmxlICdcbiAgICAgICAgICArICdzdWNoIGEgbW9kLCBwbGVhc2UgZG8gc28gb24gdGhlIFwiTW9kc1wiIHNjcmVlbi4nKX1cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApIDogKFxuICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJywgcGFkZGluZzogJzE2cHgnIH19PlxuICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIHdoaXRlU3BhY2U6ICdub3dyYXAnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJyB9fT5cbiAgICAgICAge3QoJ0xTTGliIGlzIG5vdCBpbnN0YWxsZWQnKX1cbiAgICAgIDwvZGl2PlxuICAgICAgPGhyLz5cbiAgICAgIDxkaXY+XG4gICAgICAgIHt0KCdUbyB0YWtlIGZ1bGwgYWR2YW50YWdlIG9mIFZvcnRleFxcJ3MgQkczIG1vZGRpbmcgY2FwYWJpbGl0aWVzIHN1Y2ggYXMgbWFuYWdpbmcgdGhlICdcbiAgICAgICAgICsgJ29yZGVyIGluIHdoaWNoIG1vZHMgYXJlIGxvYWRlZCBpbnRvIHRoZSBnYW1lOyBWb3J0ZXggcmVxdWlyZXMgYSAzcmQgcGFydHkgdG9vbCBcIkxTTGliXCIsICdcbiAgICAgICAgICsgJ3BsZWFzZSBpbnN0YWxsIHRoZSBsaWJyYXJ5IHVzaW5nIHRoZSBidXR0b25zIGJlbG93IHRvIG1hbmFnZSB5b3VyIGxvYWQgb3JkZXIuJyl9XG4gICAgICA8L2Rpdj5cbiAgICAgIDx0b29sdGlwLkJ1dHRvblxuICAgICAgICB0b29sdGlwPXsnSW5zdGFsbCBMU0xpYid9XG4gICAgICAgIG9uQ2xpY2s9e29uSW5zdGFsbExTTGlifVxuICAgICAgPlxuICAgICAgICB7dCgnSW5zdGFsbCBMU0xpYicpfVxuICAgICAgPC90b29sdGlwLkJ1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0T3duR2FtZVZlcnNpb24oc3RhdGU6IHR5cGVzLklTdGF0ZSk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IGRpc2NvdmVyeSA9IHNlbGVjdG9ycy5kaXNjb3ZlcnlCeUdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICByZXR1cm4gYXdhaXQgdXRpbC5nZXRHYW1lKEdBTUVfSUQpLmdldEluc3RhbGxlZFZlcnNpb24oZGlzY292ZXJ5KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0QWN0aXZlUGxheWVyUHJvZmlsZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgcmV0dXJuIGdhbWVTdXBwb3J0c1Byb2ZpbGUoYXdhaXQgZ2V0T3duR2FtZVZlcnNpb24oYXBpLmdldFN0YXRlKCkpKVxuICAgID8gYXBpLnN0b3JlLmdldFN0YXRlKCkuc2V0dGluZ3NbJ2JhbGR1cnNnYXRlMyddPy5wbGF5ZXJQcm9maWxlIHx8ICdnbG9iYWwnXG4gICAgOiAnUHVibGljJztcbn1cblxuYXN5bmMgZnVuY3Rpb24gd3JpdGVMb2FkT3JkZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9hZE9yZGVyOiB7IFtrZXk6IHN0cmluZ106IElMb2FkT3JkZXJFbnRyeSB9KSB7XG4gIGNvbnN0IGJnM3Byb2ZpbGU6IHN0cmluZyA9IGF3YWl0IGdldEFjdGl2ZVBsYXllclByb2ZpbGUoYXBpKTtcbiAgY29uc3QgcGxheWVyUHJvZmlsZXMgPSAoYmczcHJvZmlsZSA9PT0gJ2dsb2JhbCcpID8gZ2V0UGxheWVyUHJvZmlsZXMoKSA6IFtiZzNwcm9maWxlXTtcbiAgaWYgKHBsYXllclByb2ZpbGVzLmxlbmd0aCA9PT0gMCkge1xuICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICAgIGlkOiAnYmczLW5vLXByb2ZpbGVzJyxcbiAgICAgIHR5cGU6ICd3YXJuaW5nJyxcbiAgICAgIHRpdGxlOiAnTm8gcGxheWVyIHByb2ZpbGVzJyxcbiAgICAgIG1lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGF0IGxlYXN0IG9uY2UgYW5kIGNyZWF0ZSBhIHByb2ZpbGUgaW4tZ2FtZScsXG4gICAgfSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKCdiZzMtbm8tcHJvZmlsZXMnKTtcblxuICB0cnkge1xuICAgIGNvbnN0IG1vZFNldHRpbmdzID0gYXdhaXQgcmVhZE1vZFNldHRpbmdzKGFwaSk7XG5cbiAgICBjb25zdCByZWdpb24gPSBmaW5kTm9kZShtb2RTZXR0aW5ncz8uc2F2ZT8ucmVnaW9uLCAnTW9kdWxlU2V0dGluZ3MnKTtcbiAgICBjb25zdCByb290ID0gZmluZE5vZGUocmVnaW9uPy5ub2RlLCAncm9vdCcpO1xuICAgIGNvbnN0IG1vZHNOb2RlID0gZmluZE5vZGUocm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZHMnKTtcbiAgICBjb25zdCBsb05vZGUgPSBmaW5kTm9kZShyb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kT3JkZXInKSA/PyB7IGNoaWxkcmVuOiBbXSB9O1xuICAgIGlmICgobG9Ob2RlLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHx8ICgobG9Ob2RlLmNoaWxkcmVuWzBdIGFzIGFueSkgPT09ICcnKSkge1xuICAgICAgbG9Ob2RlLmNoaWxkcmVuID0gW3sgbm9kZTogW10gfV07XG4gICAgfVxuICAgIC8vIGRyb3AgYWxsIG5vZGVzIGV4Y2VwdCBmb3IgdGhlIGdhbWUgZW50cnlcbiAgICBjb25zdCBkZXNjcmlwdGlvbk5vZGVzID0gbW9kc05vZGU/LmNoaWxkcmVuPy5bMF0/Lm5vZGU/LmZpbHRlcj8uKGl0ZXIgPT5cbiAgICAgIGl0ZXIuYXR0cmlidXRlLmZpbmQoYXR0ciA9PiAoYXR0ci4kLmlkID09PSAnTmFtZScpICYmIChhdHRyLiQudmFsdWUgPT09ICdHdXN0YXYnKSkpID8/IFtdO1xuXG4gICAgY29uc3QgZW5hYmxlZFBha3MgPSBPYmplY3Qua2V5cyhsb2FkT3JkZXIpXG4gICAgICAgIC5maWx0ZXIoa2V5ID0+ICEhbG9hZE9yZGVyW2tleV0uZGF0YT8udXVpZFxuICAgICAgICAgICAgICAgICAgICAmJiBsb2FkT3JkZXJba2V5XS5lbmFibGVkXG4gICAgICAgICAgICAgICAgICAgICYmICFsb2FkT3JkZXJba2V5XS5kYXRhPy5pc0xpc3RlZCk7XG5cbiAgICAvLyBhZGQgbmV3IG5vZGVzIGZvciB0aGUgZW5hYmxlZCBtb2RzXG4gICAgZm9yIChjb25zdCBrZXkgb2YgZW5hYmxlZFBha3MpIHtcbiAgICAgIC8vIGNvbnN0IG1kNSA9IGF3YWl0IHV0aWwuZmlsZU1ENShwYXRoLmpvaW4obW9kc1BhdGgoKSwga2V5KSk7XG4gICAgICBkZXNjcmlwdGlvbk5vZGVzLnB1c2goe1xuICAgICAgICAkOiB7IGlkOiAnTW9kdWxlU2hvcnREZXNjJyB9LFxuICAgICAgICBhdHRyaWJ1dGU6IFtcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdGb2xkZXInLCB0eXBlOiAnTFNXU3RyaW5nJywgdmFsdWU6IGxvYWRPcmRlcltrZXldLmRhdGEuZm9sZGVyIH0gfSxcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdNRDUnLCB0eXBlOiAnTFNTdHJpbmcnLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS5tZDUgfSB9LFxuICAgICAgICAgIHsgJDogeyBpZDogJ05hbWUnLCB0eXBlOiAnRml4ZWRTdHJpbmcnLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS5uYW1lIH0gfSxcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdVVUlEJywgdHlwZTogJ0ZpeGVkU3RyaW5nJywgdmFsdWU6IGxvYWRPcmRlcltrZXldLmRhdGEudXVpZCB9IH0sXG4gICAgICAgICAgeyAkOiB7IGlkOiAnVmVyc2lvbicsIHR5cGU6ICdpbnQzMicsIHZhbHVlOiBsb2FkT3JkZXJba2V5XS5kYXRhLnZlcnNpb24gfSB9LFxuICAgICAgICBdLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgbG9hZE9yZGVyTm9kZXMgPSBlbmFibGVkUGFrc1xuICAgICAgLnNvcnQoKGxocywgcmhzKSA9PiBsb2FkT3JkZXJbbGhzXS5wb3MgLSBsb2FkT3JkZXJbcmhzXS5wb3MpXG4gICAgICAubWFwKChrZXk6IHN0cmluZyk6IElNb2ROb2RlID0+ICh7XG4gICAgICAgICQ6IHsgaWQ6ICdNb2R1bGUnIH0sXG4gICAgICAgIGF0dHJpYnV0ZTogW1xuICAgICAgICAgIHsgJDogeyBpZDogJ1VVSUQnLCB0eXBlOiAnRml4ZWRTdHJpbmcnLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS51dWlkIH0gfSxcbiAgICAgICAgXSxcbiAgICAgIH0pKTtcblxuICAgIG1vZHNOb2RlLmNoaWxkcmVuWzBdLm5vZGUgPSBkZXNjcmlwdGlvbk5vZGVzO1xuICAgIGxvTm9kZS5jaGlsZHJlblswXS5ub2RlID0gbG9hZE9yZGVyTm9kZXM7XG5cbiAgICBpZiAoYmczcHJvZmlsZSA9PT0gJ2dsb2JhbCcpIHtcbiAgICAgIHdyaXRlTW9kU2V0dGluZ3MoYXBpLCBtb2RTZXR0aW5ncywgYmczcHJvZmlsZSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgcHJvZmlsZSBvZiBwbGF5ZXJQcm9maWxlcykge1xuICAgICAgd3JpdGVNb2RTZXR0aW5ncyhhcGksIG1vZFNldHRpbmdzLCBwcm9maWxlKTtcbiAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChzZXR0aW5nc1dyaXR0ZW4ocHJvZmlsZSwgRGF0ZS5ub3coKSwgZW5hYmxlZFBha3MubGVuZ3RoKSk7XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gd3JpdGUgbG9hZCBvcmRlcicsIGVyciwge1xuICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYXQgbGVhc3Qgb25jZSBhbmQgY3JlYXRlIGEgcHJvZmlsZSBpbi1nYW1lJyxcbiAgICB9KTtcbiAgfVxufVxuXG50eXBlIERpdmluZUFjdGlvbiA9ICdjcmVhdGUtcGFja2FnZScgfCAnbGlzdC1wYWNrYWdlJyB8ICdleHRyYWN0LXNpbmdsZS1maWxlJ1xuICAgICAgICAgICAgICAgICAgfCAnZXh0cmFjdC1wYWNrYWdlJyB8ICdleHRyYWN0LXBhY2thZ2VzJyB8ICdjb252ZXJ0LW1vZGVsJ1xuICAgICAgICAgICAgICAgICAgfCAnY29udmVydC1tb2RlbHMnIHwgJ2NvbnZlcnQtcmVzb3VyY2UnIHwgJ2NvbnZlcnQtcmVzb3VyY2VzJztcblxuaW50ZXJmYWNlIElEaXZpbmVPcHRpb25zIHtcbiAgc291cmNlOiBzdHJpbmc7XG4gIGRlc3RpbmF0aW9uPzogc3RyaW5nO1xuICBleHByZXNzaW9uPzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgSURpdmluZU91dHB1dCB7XG4gIHN0ZG91dDogc3RyaW5nO1xuICByZXR1cm5Db2RlOiBudW1iZXI7XG59XG5cbmZ1bmN0aW9uIGdldExhdGVzdExTTGliTW9kKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gc3RhdGUucGVyc2lzdGVudC5tb2RzW0dBTUVfSURdO1xuICBpZiAobW9kcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbG9nKCd3YXJuJywgJ0xTTGliIGlzIG5vdCBpbnN0YWxsZWQnKTtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIGNvbnN0IGxzTGliOiB0eXBlcy5JTW9kID0gT2JqZWN0LmtleXMobW9kcykucmVkdWNlKChwcmV2OiB0eXBlcy5JTW9kLCBpZDogc3RyaW5nKSA9PiB7XG4gICAgaWYgKG1vZHNbaWRdLnR5cGUgPT09ICdiZzMtbHNsaWItZGl2aW5lLXRvb2wnKSB7XG4gICAgICBjb25zdCBsYXRlc3RWZXIgPSBwcmV2Py5hdHRyaWJ1dGVzPy52ZXJzaW9uID8/ICcwLjAuMCc7XG4gICAgICBjb25zdCBjdXJyZW50VmVyID0gbW9kc1tpZF0/LmF0dHJpYnV0ZXM/LnZlcnNpb24gPz8gJzAuMC4wJztcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChzZW12ZXIuZ3QoY3VycmVudFZlciwgbGF0ZXN0VmVyKSkge1xuICAgICAgICAgIHByZXYgPSBtb2RzW2lkXTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGxvZygnd2FybicsICdpbnZhbGlkIG1vZCB2ZXJzaW9uJywgeyBtb2RJZDogaWQsIHZlcnNpb246IGN1cnJlbnRWZXIgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwcmV2O1xuICB9LCB1bmRlZmluZWQpO1xuXG4gIGlmIChsc0xpYiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbG9nKCd3YXJuJywgJ0xTTGliIGlzIG5vdCBpbnN0YWxsZWQnKTtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgcmV0dXJuIGxzTGliO1xufVxuXG5jbGFzcyBEaXZpbmVFeGVjTWlzc2luZyBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoJ0RpdmluZSBleGVjdXRhYmxlIGlzIG1pc3NpbmcnKTtcbiAgICB0aGlzLm5hbWUgPSAnRGl2aW5lRXhlY01pc3NpbmcnO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRpdmluZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXG4gICAgICAgICAgICAgICAgYWN0aW9uOiBEaXZpbmVBY3Rpb24sXG4gICAgICAgICAgICAgICAgb3B0aW9uczogSURpdmluZU9wdGlvbnMpOiBQcm9taXNlPElEaXZpbmVPdXRwdXQ+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlPElEaXZpbmVPdXRwdXQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBsZXQgcmV0dXJuZWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICBsZXQgc3Rkb3V0OiBzdHJpbmcgPSAnJztcblxuICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gICAgY29uc3Qgc3RhZ2luZ0ZvbGRlciA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICAgIGNvbnN0IGxzTGliOiB0eXBlcy5JTW9kID0gZ2V0TGF0ZXN0TFNMaWJNb2QoYXBpKTtcbiAgICBpZiAobHNMaWIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdMU0xpYi9EaXZpbmUgdG9vbCBpcyBtaXNzaW5nJyk7XG4gICAgICBlcnJbJ2F0dGFjaExvZ09uUmVwb3J0J10gPSBmYWxzZTtcbiAgICAgIHJldHVybiByZWplY3QoZXJyKTtcbiAgICB9XG4gICAgY29uc3QgZXhlID0gcGF0aC5qb2luKHN0YWdpbmdGb2xkZXIsIGxzTGliLmluc3RhbGxhdGlvblBhdGgsICd0b29scycsICdkaXZpbmUuZXhlJyk7XG4gICAgY29uc3QgYXJncyA9IFtcbiAgICAgICctLWFjdGlvbicsIGFjdGlvbixcbiAgICAgICctLXNvdXJjZScsIG9wdGlvbnMuc291cmNlLFxuICAgICAgJy0tbG9nbGV2ZWwnLCAnb2ZmJyxcbiAgICAgICctLWdhbWUnLCAnYmczJyxcbiAgICBdO1xuXG4gICAgaWYgKG9wdGlvbnMuZGVzdGluYXRpb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgYXJncy5wdXNoKCctLWRlc3RpbmF0aW9uJywgb3B0aW9ucy5kZXN0aW5hdGlvbik7XG4gICAgfVxuICAgIGlmIChvcHRpb25zLmV4cHJlc3Npb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgYXJncy5wdXNoKCctLWV4cHJlc3Npb24nLCBvcHRpb25zLmV4cHJlc3Npb24pO1xuICAgIH1cblxuICAgIGNvbnN0IHByb2MgPSBzcGF3bihleGUsIGFyZ3MpO1xuXG4gICAgcHJvYy5zdGRvdXQub24oJ2RhdGEnLCBkYXRhID0+IHN0ZG91dCArPSBkYXRhKTtcbiAgICBwcm9jLnN0ZGVyci5vbignZGF0YScsIGRhdGEgPT4gbG9nKCd3YXJuJywgZGF0YSkpO1xuXG4gICAgcHJvYy5vbignZXJyb3InLCAoZXJySW46IEVycm9yKSA9PiB7XG4gICAgICBpZiAoIXJldHVybmVkKSB7XG4gICAgICAgIGlmIChlcnJJblsnY29kZSddID09PSAnRU5PRU5UJykge1xuICAgICAgICAgIHJlamVjdChuZXcgRGl2aW5lRXhlY01pc3NpbmcoKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuZWQgPSB0cnVlO1xuICAgICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ2RpdmluZS5leGUgZmFpbGVkOiAnICsgZXJySW4ubWVzc2FnZSk7XG4gICAgICAgIGVyclsnYXR0YWNoTG9nT25SZXBvcnQnXSA9IHRydWU7XG4gICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHByb2Mub24oJ2V4aXQnLCAoY29kZTogbnVtYmVyKSA9PiB7XG4gICAgICBpZiAoIXJldHVybmVkKSB7XG4gICAgICAgIHJldHVybmVkID0gdHJ1ZTtcbiAgICAgICAgaWYgKGNvZGUgPT09IDApIHtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZSh7IHN0ZG91dCwgcmV0dXJuQ29kZTogMCB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChbMiwgMTAyXS5pbmNsdWRlcyhjb2RlKSkge1xuICAgICAgICAgIHJldHVybiByZXNvbHZlKHsgc3Rkb3V0OiAnJywgcmV0dXJuQ29kZTogMiB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBkaXZpbmUuZXhlIHJldHVybnMgdGhlIGFjdHVhbCBlcnJvciBjb2RlICsgMTAwIGlmIGEgZmF0YWwgZXJyb3Igb2NjdXJlZFxuICAgICAgICAgIGlmIChjb2RlID4gMTAwKSB7XG4gICAgICAgICAgICBjb2RlIC09IDEwMDtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKGBkaXZpbmUuZXhlIGZhaWxlZDogJHtjb2RlfWApO1xuICAgICAgICAgIGVyclsnYXR0YWNoTG9nT25SZXBvcnQnXSA9IHRydWU7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBleHRyYWN0UGFrKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcGFrUGF0aCwgZGVzdFBhdGgsIHBhdHRlcm4pIHtcbiAgcmV0dXJuIGRpdmluZShhcGksICdleHRyYWN0LXBhY2thZ2UnLFxuICAgIHsgc291cmNlOiBwYWtQYXRoLCBkZXN0aW5hdGlvbjogZGVzdFBhdGgsIGV4cHJlc3Npb246IHBhdHRlcm4gfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGV4dHJhY3RNZXRhKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcGFrUGF0aDogc3RyaW5nLCBtb2Q6IHR5cGVzLklNb2QpOiBQcm9taXNlPElNb2RTZXR0aW5ncz4ge1xuICBjb25zdCBtZXRhUGF0aCA9IHBhdGguam9pbih1dGlsLmdldFZvcnRleFBhdGgoJ3RlbXAnKSwgJ2xzbWV0YScsIHNob3J0aWQoKSk7XG4gIGF3YWl0IGZzLmVuc3VyZURpckFzeW5jKG1ldGFQYXRoKTtcbiAgYXdhaXQgZXh0cmFjdFBhayhhcGksIHBha1BhdGgsIG1ldGFQYXRoLCAnKi9tZXRhLmxzeCcpO1xuICB0cnkge1xuICAgIC8vIHRoZSBtZXRhLmxzeCBtYXkgYmUgaW4gYSBzdWJkaXJlY3RvcnkuIFRoZXJlIGlzIHByb2JhYmx5IGEgcGF0dGVybiBoZXJlXG4gICAgLy8gYnV0IHdlJ2xsIGp1c3QgdXNlIGl0IGZyb20gd2hlcmV2ZXJcbiAgICBsZXQgbWV0YUxTWFBhdGg6IHN0cmluZyA9IHBhdGguam9pbihtZXRhUGF0aCwgJ21ldGEubHN4Jyk7XG4gICAgYXdhaXQgd2FsayhtZXRhUGF0aCwgZW50cmllcyA9PiB7XG4gICAgICBjb25zdCB0ZW1wID0gZW50cmllcy5maW5kKGUgPT4gcGF0aC5iYXNlbmFtZShlLmZpbGVQYXRoKS50b0xvd2VyQ2FzZSgpID09PSAnbWV0YS5sc3gnKTtcbiAgICAgIGlmICh0ZW1wICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbWV0YUxTWFBhdGggPSB0ZW1wLmZpbGVQYXRoO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGNvbnN0IGRhdCA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMobWV0YUxTWFBhdGgpO1xuICAgIGNvbnN0IG1ldGEgPSBhd2FpdCBwYXJzZVN0cmluZ1Byb21pc2UoZGF0KTtcbiAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhtZXRhUGF0aCk7XG4gICAgcmV0dXJuIG1ldGE7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKG1ldGFQYXRoKTtcbiAgICBpZiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XG4gICAgfSBlbHNlIGlmIChlcnIubWVzc2FnZS5pbmNsdWRlcygnQ29sdW1uJykgJiYgKGVyci5tZXNzYWdlLmluY2x1ZGVzKCdMaW5lJykpKSB7XG4gICAgICAvLyBhbiBlcnJvciBtZXNzYWdlIHNwZWNpZnlpbmcgY29sdW1uIGFuZCByb3cgaW5kaWNhdGUgYSBwcm9ibGVtIHBhcnNpbmcgdGhlIHhtbCBmaWxlXG4gICAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgICAgIHR5cGU6ICd3YXJuaW5nJyxcbiAgICAgICAgbWVzc2FnZTogJ1RoZSBtZXRhLmxzeCBmaWxlIGluIFwie3ttb2ROYW1lfX1cIiBpcyBpbnZhbGlkLCBwbGVhc2UgcmVwb3J0IHRoaXMgdG8gdGhlIGF1dGhvcicsXG4gICAgICAgIGFjdGlvbnM6IFt7XG4gICAgICAgICAgdGl0bGU6ICdNb3JlJyxcbiAgICAgICAgICBhY3Rpb246ICgpID0+IHtcbiAgICAgICAgICAgIGFwaS5zaG93RGlhbG9nKCdlcnJvcicsICdJbnZhbGlkIG1ldGEubHN4IGZpbGUnLCB7XG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGVyci5tZXNzYWdlLFxuICAgICAgICAgICAgfSwgW3sgbGFiZWw6ICdDbG9zZScgfV0pXG4gICAgICAgICAgfVxuICAgICAgICB9XSxcbiAgICAgICAgcmVwbGFjZToge1xuICAgICAgICAgIG1vZE5hbWU6IHV0aWwucmVuZGVyTW9kTmFtZShtb2QpLFxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGZpbmROb2RlPFQgZXh0ZW5kcyBJWG1sTm9kZTx7IGlkOiBzdHJpbmcgfT4sIFU+KG5vZGVzOiBUW10sIGlkOiBzdHJpbmcpOiBUIHtcbiAgcmV0dXJuIG5vZGVzPy5maW5kKGl0ZXIgPT4gaXRlci4kLmlkID09PSBpZCkgPz8gdW5kZWZpbmVkO1xufVxuXG5jb25zdCBsaXN0Q2FjaGU6IHsgW3BhdGg6IHN0cmluZ106IFByb21pc2U8c3RyaW5nW10+IH0gPSB7fTtcblxuYXN5bmMgZnVuY3Rpb24gbGlzdFBhY2thZ2UoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwYWtQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gIGNvbnN0IHJlcyA9IGF3YWl0IGRpdmluZShhcGksICdsaXN0LXBhY2thZ2UnLCB7IHNvdXJjZTogcGFrUGF0aCB9KTtcbiAgY29uc3QgbGluZXMgPSByZXMuc3Rkb3V0LnNwbGl0KCdcXG4nKS5tYXAobGluZSA9PiBsaW5lLnRyaW0oKSkuZmlsdGVyKGxpbmUgPT4gbGluZS5sZW5ndGggIT09IDApO1xuXG4gIHJldHVybiBsaW5lcztcbn1cblxuYXN5bmMgZnVuY3Rpb24gaXNMT0xpc3RlZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHBha1BhdGg6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICBpZiAobGlzdENhY2hlW3Bha1BhdGhdID09PSB1bmRlZmluZWQpIHtcbiAgICBsaXN0Q2FjaGVbcGFrUGF0aF0gPSBsaXN0UGFja2FnZShhcGksIHBha1BhdGgpO1xuICB9XG4gIGNvbnN0IGxpbmVzID0gYXdhaXQgbGlzdENhY2hlW3Bha1BhdGhdO1xuICAvLyBjb25zdCBub25HVUkgPSBsaW5lcy5maW5kKGxpbmUgPT4gIWxpbmUudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdwdWJsaWMvZ2FtZS9ndWknKSk7XG4gIGNvbnN0IG1ldGFMU1ggPSBsaW5lcy5maW5kKGxpbmUgPT5cbiAgICBwYXRoLmJhc2VuYW1lKGxpbmUuc3BsaXQoJ1xcdCcpWzBdKS50b0xvd2VyQ2FzZSgpID09PSAnbWV0YS5sc3gnKTtcbiAgcmV0dXJuIG1ldGFMU1ggPT09IHVuZGVmaW5lZDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZXh0cmFjdFBha0luZm9JbXBsKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcGFrUGF0aDogc3RyaW5nLCBtb2Q6IHR5cGVzLklNb2QpOiBQcm9taXNlPElQYWtJbmZvPiB7XG4gIGNvbnN0IG1ldGEgPSBhd2FpdCBleHRyYWN0TWV0YShhcGksIHBha1BhdGgsIG1vZCk7XG4gIGNvbnN0IGNvbmZpZyA9IGZpbmROb2RlKG1ldGE/LnNhdmU/LnJlZ2lvbiwgJ0NvbmZpZycpO1xuICBjb25zdCBjb25maWdSb290ID0gZmluZE5vZGUoY29uZmlnPy5ub2RlLCAncm9vdCcpO1xuICBjb25zdCBtb2R1bGVJbmZvID0gZmluZE5vZGUoY29uZmlnUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZHVsZUluZm8nKTtcblxuICBjb25zdCBhdHRyID0gKG5hbWU6IHN0cmluZywgZmFsbGJhY2s6ICgpID0+IGFueSkgPT5cbiAgICBmaW5kTm9kZShtb2R1bGVJbmZvPy5hdHRyaWJ1dGUsIG5hbWUpPy4kPy52YWx1ZSA/PyBmYWxsYmFjaygpO1xuXG4gIGNvbnN0IGdlbk5hbWUgPSBwYXRoLmJhc2VuYW1lKHBha1BhdGgsIHBhdGguZXh0bmFtZShwYWtQYXRoKSk7XG5cbiAgcmV0dXJuIHtcbiAgICBhdXRob3I6IGF0dHIoJ0F1dGhvcicsICgpID0+ICdVbmtub3duJyksXG4gICAgZGVzY3JpcHRpb246IGF0dHIoJ0Rlc2NyaXB0aW9uJywgKCkgPT4gJ01pc3NpbmcnKSxcbiAgICBmb2xkZXI6IGF0dHIoJ0ZvbGRlcicsICgpID0+IGdlbk5hbWUpLFxuICAgIG1kNTogYXR0cignTUQ1JywgKCkgPT4gJycpLFxuICAgIG5hbWU6IGF0dHIoJ05hbWUnLCAoKSA9PiBnZW5OYW1lKSxcbiAgICB0eXBlOiBhdHRyKCdUeXBlJywgKCkgPT4gJ0FkdmVudHVyZScpLFxuICAgIHV1aWQ6IGF0dHIoJ1VVSUQnLCAoKSA9PiByZXF1aXJlKCd1dWlkJykudjQoKSksXG4gICAgdmVyc2lvbjogYXR0cignVmVyc2lvbicsICgpID0+ICcxJyksXG4gICAgaXNMaXN0ZWQ6IGF3YWl0IGlzTE9MaXN0ZWQoYXBpLCBwYWtQYXRoKSxcbiAgfTtcbn1cblxuY29uc3QgZmFsbGJhY2tQaWN0dXJlID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJ2dhbWVhcnQuanBnJyk7XG5cbmxldCBzdG9yZWRMTzogYW55W107XG5cbmZ1bmN0aW9uIHBhcnNlTW9kTm9kZShub2RlOiBJTW9kTm9kZSkge1xuICBjb25zdCBuYW1lID0gZmluZE5vZGUobm9kZS5hdHRyaWJ1dGUsICdOYW1lJykuJC52YWx1ZTtcbiAgcmV0dXJuIHtcbiAgICBpZDogbmFtZSxcbiAgICBuYW1lLFxuICAgIGRhdGE6IGZpbmROb2RlKG5vZGUuYXR0cmlidXRlLCAnVVVJRCcpLiQudmFsdWUsXG4gIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlYWRNb2RTZXR0aW5ncyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPElNb2RTZXR0aW5ncz4ge1xuICBjb25zdCBiZzNwcm9maWxlOiBzdHJpbmcgPSBhd2FpdCBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlKGFwaSk7XG4gIGNvbnN0IHBsYXllclByb2ZpbGVzID0gZ2V0UGxheWVyUHJvZmlsZXMoKTtcbiAgaWYgKHBsYXllclByb2ZpbGVzLmxlbmd0aCA9PT0gMCkge1xuICAgIHN0b3JlZExPID0gW107XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qgc2V0dGluZ3NQYXRoID0gKGJnM3Byb2ZpbGUgIT09ICdnbG9iYWwnKVxuICAgID8gcGF0aC5qb2luKHByb2ZpbGVzUGF0aCgpLCBiZzNwcm9maWxlLCAnbW9kc2V0dGluZ3MubHN4JylcbiAgICA6IHBhdGguam9pbihnbG9iYWxQcm9maWxlUGF0aCgpLCAnbW9kc2V0dGluZ3MubHN4Jyk7XG4gIGNvbnN0IGRhdCA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMoc2V0dGluZ3NQYXRoKTtcbiAgcmV0dXJuIHBhcnNlU3RyaW5nUHJvbWlzZShkYXQpO1xufVxuXG5hc3luYyBmdW5jdGlvbiB3cml0ZU1vZFNldHRpbmdzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZGF0YTogSU1vZFNldHRpbmdzLCBiZzNwcm9maWxlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKCFiZzNwcm9maWxlKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qgc2V0dGluZ3NQYXRoID0gKGJnM3Byb2ZpbGUgIT09ICdnbG9iYWwnKVxuICAgID8gcGF0aC5qb2luKHByb2ZpbGVzUGF0aCgpLCBiZzNwcm9maWxlLCAnbW9kc2V0dGluZ3MubHN4JylcbiAgICA6IHBhdGguam9pbihnbG9iYWxQcm9maWxlUGF0aCgpLCAnbW9kc2V0dGluZ3MubHN4Jyk7XG5cbiAgY29uc3QgYnVpbGRlciA9IG5ldyBCdWlsZGVyKCk7XG4gIGNvbnN0IHhtbCA9IGJ1aWxkZXIuYnVpbGRPYmplY3QoZGF0YSk7XG4gIHRyeSB7XG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUoc2V0dGluZ3NQYXRoKSk7XG4gICAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmMoc2V0dGluZ3NQYXRoLCB4bWwpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBzdG9yZWRMTyA9IFtdO1xuICAgIGNvbnN0IGFsbG93UmVwb3J0ID0gWydFTk9FTlQnLCAnRVBFUk0nXS5pbmNsdWRlcyhlcnIuY29kZSk7XG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIG1vZCBzZXR0aW5ncycsIGVyciwgeyBhbGxvd1JlcG9ydCB9KTtcbiAgICByZXR1cm47XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVhZFN0b3JlZExPKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xuICBjb25zdCBtb2RTZXR0aW5ncyA9IGF3YWl0IHJlYWRNb2RTZXR0aW5ncyhhcGkpO1xuICBjb25zdCBjb25maWcgPSBmaW5kTm9kZShtb2RTZXR0aW5ncz8uc2F2ZT8ucmVnaW9uLCAnTW9kdWxlU2V0dGluZ3MnKTtcbiAgY29uc3QgY29uZmlnUm9vdCA9IGZpbmROb2RlKGNvbmZpZz8ubm9kZSwgJ3Jvb3QnKTtcbiAgY29uc3QgbW9kT3JkZXJSb290ID0gZmluZE5vZGUoY29uZmlnUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZE9yZGVyJyk7XG4gIGNvbnN0IG1vZHNSb290ID0gZmluZE5vZGUoY29uZmlnUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZHMnKTtcbiAgY29uc3QgbW9kT3JkZXJOb2RlcyA9IG1vZE9yZGVyUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSA/PyBbXTtcbiAgY29uc3QgbW9kTm9kZXMgPSBtb2RzUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSA/PyBbXTtcblxuICBjb25zdCBtb2RPcmRlciA9IG1vZE9yZGVyTm9kZXMubWFwKG5vZGUgPT4gZmluZE5vZGUobm9kZS5hdHRyaWJ1dGUsICdVVUlEJykuJD8udmFsdWUpO1xuXG4gIC8vIHJldHVybiB1dGlsLnNldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3NXcml0dGVuJywgcHJvZmlsZV0sIHsgdGltZSwgY291bnQgfSk7XG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gIGNvbnN0IHZQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICBjb25zdCBtb2RzID0gc3RhdGU/LnBlcnNpc3RlbnQ/Lm1vZHM/LltHQU1FX0lEXSA/PyB7fTtcbiAgY29uc3QgZW5hYmxlZCA9IE9iamVjdC5rZXlzKG1vZHMpLmZpbHRlcigoaWQpID0+IHZQcm9maWxlPy5tb2RTdGF0ZT8uW2lkXT8uZW5hYmxlZCk7XG4gIGNvbnN0IGJnM3Byb2ZpbGU6IHN0cmluZyA9IHN0YXRlLnNldHRpbmdzWydiYWxkdXJzZ2F0ZTMnXT8ucGxheWVyUHJvZmlsZTtcbiAgaWYgKGVuYWJsZWQubGVuZ3RoID4gMCAmJiBtb2ROb2Rlcy5sZW5ndGggPT09IDEpIHtcbiAgICBjb25zdCBsYXN0V3JpdGUgPSBzdGF0ZS5zZXR0aW5nc1snYmFsZHVyc2dhdGUzJ10/LnNldHRpbmdzV3JpdHRlbj8uW2JnM3Byb2ZpbGVdO1xuICAgIGlmICgobGFzdFdyaXRlICE9PSB1bmRlZmluZWQpICYmIChsYXN0V3JpdGUuY291bnQgPiAxKSkge1xuICAgICAgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnXCJtb2RzZXR0aW5ncy5sc3hcIiBmaWxlIHdhcyByZXNldCcsIHtcbiAgICAgICAgdGV4dDogJ1RoZSBnYW1lIHJlc2V0IHRoZSBsaXN0IG9mIGFjdGl2ZSBtb2RzIGFuZCByYW4gd2l0aG91dCB0aGVtLlxcbidcbiAgICAgICAgICAgICsgJ1RoaXMgaGFwcGVucyB3aGVuIGFuIGludmFsaWQgb3IgaW5jb21wYXRpYmxlIG1vZCBpcyBpbnN0YWxsZWQuICdcbiAgICAgICAgICAgICsgJ1RoZSBnYW1lIHdpbGwgbm90IGxvYWQgYW55IG1vZHMgaWYgb25lIG9mIHRoZW0gaXMgaW5jb21wYXRpYmxlLCB1bmZvcnR1bmF0ZWx5ICdcbiAgICAgICAgICAgICsgJ3RoZXJlIGlzIG5vIGVhc3kgd2F5IHRvIGZpbmQgb3V0IHdoaWNoIG9uZSBjYXVzZWQgdGhlIHByb2JsZW0uJyxcbiAgICAgIH0sIFtcbiAgICAgICAgeyBsYWJlbDogJ0NvbnRpbnVlJyB9LFxuICAgICAgXSk7XG4gICAgfVxuICB9XG5cbiAgc3RvcmVkTE8gPSBtb2ROb2Rlc1xuICAgIC5tYXAobm9kZSA9PiBwYXJzZU1vZE5vZGUobm9kZSkpXG4gICAgLy8gR3VzdGF2IGlzIHRoZSBjb3JlIGdhbWVcbiAgICAuZmlsdGVyKGVudHJ5ID0+IGVudHJ5LmlkID09PSAnR3VzdGF2JylcbiAgICAvLyBzb3J0IGJ5IHRoZSBpbmRleCBvZiBlYWNoIG1vZCBpbiB0aGUgbW9kT3JkZXIgbGlzdFxuICAgIC5zb3J0KChsaHMsIHJocykgPT4gbW9kT3JkZXJcbiAgICAgIC5maW5kSW5kZXgoaSA9PiBpID09PSBsaHMuZGF0YSkgLSBtb2RPcmRlci5maW5kSW5kZXgoaSA9PiBpID09PSByaHMuZGF0YSkpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZWFkUEFLTGlzdChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgbGV0IHBha3M6IHN0cmluZ1tdO1xuICB0cnkge1xuICAgIHBha3MgPSAoYXdhaXQgZnMucmVhZGRpckFzeW5jKG1vZHNQYXRoKCkpKVxuICAgICAgLmZpbHRlcihmaWxlTmFtZSA9PiBwYXRoLmV4dG5hbWUoZmlsZU5hbWUpLnRvTG93ZXJDYXNlKCkgPT09ICcucGFrJyk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmIChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMobW9kc1BhdGgoKSwgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSgpKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAvLyBub3BcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlYWQgbW9kcyBkaXJlY3RvcnknLCBlcnIsIHtcbiAgICAgICAgaWQ6ICdiZzMtZmFpbGVkLXJlYWQtbW9kcycsXG4gICAgICAgIG1lc3NhZ2U6IG1vZHNQYXRoKCksXG4gICAgICB9KTtcbiAgICB9XG4gICAgcGFrcyA9IFtdO1xuICB9XG5cbiAgcmV0dXJuIHBha3M7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlYWRQQUtzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSlcbiAgICA6IFByb21pc2U8QXJyYXk8eyBmaWxlTmFtZTogc3RyaW5nLCBtb2Q6IHR5cGVzLklNb2QsIGluZm86IElQYWtJbmZvIH0+PiB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IGxzTGliID0gZ2V0TGF0ZXN0TFNMaWJNb2QoYXBpKTtcbiAgaWYgKGxzTGliID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gW107XG4gIH1cbiAgY29uc3QgcGFrcyA9IGF3YWl0IHJlYWRQQUtMaXN0KGFwaSk7XG5cbiAgbGV0IG1hbmlmZXN0O1xuICB0cnkge1xuICAgIG1hbmlmZXN0ID0gYXdhaXQgdXRpbC5nZXRNYW5pZmVzdChhcGksICcnLCBHQU1FX0lEKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc3QgYWxsb3dSZXBvcnQgPSAhWydFUEVSTSddLmluY2x1ZGVzKGVyci5jb2RlKTtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBkZXBsb3ltZW50IG1hbmlmZXN0JywgZXJyLCB7IGFsbG93UmVwb3J0IH0pO1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGNvbnN0IHJlcyA9IGF3YWl0IFByb21pc2UuYWxsKHBha3MubWFwKGFzeW5jIGZpbGVOYW1lID0+IHtcbiAgICByZXR1cm4gdXRpbC53aXRoRXJyb3JDb250ZXh0KCdyZWFkaW5nIHBhaycsIGZpbGVOYW1lLCAoKSA9PiB7XG4gICAgICBjb25zdCBmdW5jID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IG1hbmlmZXN0RW50cnkgPSBtYW5pZmVzdC5maWxlcy5maW5kKGVudHJ5ID0+IGVudHJ5LnJlbFBhdGggPT09IGZpbGVOYW1lKTtcbiAgICAgICAgICBjb25zdCBtb2QgPSAobWFuaWZlc3RFbnRyeSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgPyBzdGF0ZS5wZXJzaXN0ZW50Lm1vZHNbR0FNRV9JRF0/LlttYW5pZmVzdEVudHJ5LnNvdXJjZV1cbiAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgICAgICAgY29uc3QgcGFrUGF0aCA9IHBhdGguam9pbihtb2RzUGF0aCgpLCBmaWxlTmFtZSk7XG5cbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZmlsZU5hbWUsXG4gICAgICAgICAgICBtb2QsXG4gICAgICAgICAgICBpbmZvOiBhd2FpdCBleHRyYWN0UGFrSW5mb0ltcGwoYXBpLCBwYWtQYXRoLCBtb2QpLFxuICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBEaXZpbmVFeGVjTWlzc2luZykge1xuICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9ICdUaGUgaW5zdGFsbGVkIGNvcHkgb2YgTFNMaWIvRGl2aW5lIGlzIGNvcnJ1cHRlZCAtIHBsZWFzZSAnXG4gICAgICAgICAgICAgICsgJ2RlbGV0ZSB0aGUgZXhpc3RpbmcgTFNMaWIgbW9kIGVudHJ5IGFuZCByZS1pbnN0YWxsIGl0LiBNYWtlIHN1cmUgdG8gJ1xuICAgICAgICAgICAgICArICdkaXNhYmxlIG9yIGFkZCBhbnkgbmVjZXNzYXJ5IGV4Y2VwdGlvbnMgdG8geW91ciBzZWN1cml0eSBzb2Z0d2FyZSB0byAnXG4gICAgICAgICAgICAgICsgJ2Vuc3VyZSBpdCBkb2VzIG5vdCBpbnRlcmZlcmUgd2l0aCBWb3J0ZXgvTFNMaWIgZmlsZSBvcGVyYXRpb25zLic7XG4gICAgICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdEaXZpbmUgZXhlY3V0YWJsZSBpcyBtaXNzaW5nJywgbWVzc2FnZSxcbiAgICAgICAgICAgICAgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBjb3VsZCBoYXBwZW4gaWYgdGhlIGZpbGUgZ290IGRlbGV0ZWQgc2luY2UgcmVhZGluZyB0aGUgbGlzdCBvZiBwYWtzLlxuICAgICAgICAgIC8vIGFjdHVhbGx5LCB0aGlzIHNlZW1zIHRvIGJlIGZhaXJseSBjb21tb24gd2hlbiB1cGRhdGluZyBhIG1vZFxuICAgICAgICAgIGlmIChlcnIuY29kZSAhPT0gJ0VOT0VOVCcpIHtcbiAgICAgICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIHBhaycsIGVyciwge1xuICAgICAgICAgICAgICBhbGxvd1JlcG9ydDogdHJ1ZSxcbiAgICAgICAgICAgICAgbWVzc2FnZTogZmlsZU5hbWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKGZ1bmMoKSk7XG4gICAgfSk7XG4gIH0pKTtcbiAgcmV0dXJuIHJlcy5maWx0ZXIoaXRlciA9PiBpdGVyICE9PSB1bmRlZmluZWQpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZWFkTE8oYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICB0cnkge1xuICAgIGNvbnN0IG1vZFNldHRpbmdzID0gYXdhaXQgcmVhZE1vZFNldHRpbmdzKGFwaSk7XG4gICAgY29uc3QgY29uZmlnID0gZmluZE5vZGUobW9kU2V0dGluZ3M/LnNhdmU/LnJlZ2lvbiwgJ01vZHVsZVNldHRpbmdzJyk7XG4gICAgY29uc3QgY29uZmlnUm9vdCA9IGZpbmROb2RlKGNvbmZpZz8ubm9kZSwgJ3Jvb3QnKTtcbiAgICBjb25zdCBtb2RPcmRlclJvb3QgPSBmaW5kTm9kZShjb25maWdSb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kT3JkZXInKTtcbiAgICBjb25zdCBtb2RPcmRlck5vZGVzID0gbW9kT3JkZXJSb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlID8/IFtdO1xuICAgIHJldHVybiBtb2RPcmRlck5vZGVzLm1hcChub2RlID0+IGZpbmROb2RlKG5vZGUuYXR0cmlidXRlLCAnVVVJRCcpLiQ/LnZhbHVlKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlYWQgbW9kc2V0dGluZ3MubHN4JywgZXJyLCB7XG4gICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXG4gICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBhdCBsZWFzdCBvbmNlIGFuZCBjcmVhdGUgYSBwcm9maWxlIGluLWdhbWUnLFxuICAgIH0pO1xuICAgIHJldHVybiBbXTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzZXJpYWxpemVMb2FkT3JkZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBvcmRlcik6IFByb21pc2U8dm9pZD4ge1xuICByZXR1cm4gd3JpdGVMb2FkT3JkZXIoYXBpLCBvcmRlcik7XG59XG5cbmNvbnN0IGRlc2VyaWFsaXplRGVib3VuY2VyID0gbmV3IHV0aWwuRGVib3VuY2VyKCgpID0+IHtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xufSwgMTAwMCk7XG5cbmFzeW5jIGZ1bmN0aW9uIGRlc2VyaWFsaXplTG9hZE9yZGVyKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8YW55PiB7XG4gIC8vIHRoaXMgZnVuY3Rpb24gbWlnaHQgYmUgaW52b2tlZCBieSB0aGUgbHNsaWIgbW9kIGJlaW5nICh1bilpbnN0YWxsZWQgaW4gd2hpY2ggY2FzZSBpdCBtaWdodCBiZVxuICAvLyBpbiB0aGUgbWlkZGxlIG9mIGJlaW5nIHVucGFja2VkIG9yIHJlbW92ZWQgd2hpY2ggbGVhZHMgdG8gd2VpcmQgZXJyb3IgbWVzc2FnZXMuXG4gIC8vIHRoaXMgaXMgYSBoYWNrIGhvcGVmdWxseSBlbnN1cmVpbmcgdGhlIGl0J3MgZWl0aGVyIGZ1bGx5IHRoZXJlIG9yIG5vdCBhdCBhbGxcbiAgYXdhaXQgdXRpbC50b1Byb21pc2UoY2IgPT4gZGVzZXJpYWxpemVEZWJvdW5jZXIuc2NoZWR1bGUoY2IpKTtcblxuICBjb25zdCBwYWtzID0gYXdhaXQgcmVhZFBBS3MoYXBpKTtcblxuICBjb25zdCBvcmRlciA9IGF3YWl0IHJlYWRMTyhhcGkpO1xuXG4gIGNvbnN0IG9yZGVyVmFsdWUgPSAoaW5mbzogSVBha0luZm8pID0+IHtcbiAgICByZXR1cm4gb3JkZXIuaW5kZXhPZihpbmZvLnV1aWQpICsgKGluZm8uaXNMaXN0ZWQgPyAwIDogMTAwMCk7XG4gIH07XG5cbiAgcmV0dXJuIHBha3NcbiAgICAuc29ydCgobGhzLCByaHMpID0+IG9yZGVyVmFsdWUobGhzLmluZm8pIC0gb3JkZXJWYWx1ZShyaHMuaW5mbykpXG4gICAgLm1hcCgoeyBmaWxlTmFtZSwgbW9kLCBpbmZvIH0pID0+ICh7XG4gICAgICBpZDogZmlsZU5hbWUsXG4gICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgbmFtZTogdXRpbC5yZW5kZXJNb2ROYW1lKG1vZCksXG4gICAgICBtb2RJZDogbW9kPy5pZCxcbiAgICAgIGxvY2tlZDogaW5mby5pc0xpc3RlZCxcbiAgICAgIGRhdGE6IGluZm8sXG4gICAgfSkpO1xufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZShiZWZvcmUsIGFmdGVyKTogUHJvbWlzZTxhbnk+IHtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xufVxuXG5sZXQgZm9yY2VSZWZyZXNoOiAoKSA9PiB2b2lkO1xuXG5mdW5jdGlvbiBJbmZvUGFuZWxXcmFwKHByb3BzOiB7IGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcmVmcmVzaDogKCkgPT4gdm9pZCB9KSB7XG4gIGNvbnN0IHsgYXBpIH0gPSBwcm9wcztcblxuICBjb25zdCBjdXJyZW50UHJvZmlsZSA9IHVzZVNlbGVjdG9yKChzdGF0ZTogdHlwZXMuSVN0YXRlKSA9PlxuICAgIHN0YXRlLnNldHRpbmdzWydiYWxkdXJzZ2F0ZTMnXT8ucGxheWVyUHJvZmlsZSk7XG5cbiAgY29uc3QgW2dhbWVWZXJzaW9uLCBzZXRHYW1lVmVyc2lvbl0gPSBSZWFjdC51c2VTdGF0ZTxzdHJpbmc+KCk7XG5cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBmb3JjZVJlZnJlc2ggPSBwcm9wcy5yZWZyZXNoO1xuICB9LCBbXSk7XG5cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgc2V0R2FtZVZlcnNpb24oYXdhaXQgZ2V0T3duR2FtZVZlcnNpb24oYXBpLmdldFN0YXRlKCkpKTtcbiAgICB9KSgpO1xuICB9LCBbXSk7XG5cbiAgY29uc3Qgb25TZXRQcm9maWxlID0gUmVhY3QudXNlQ2FsbGJhY2soKHByb2ZpbGVOYW1lOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBpbXBsID0gYXN5bmMgKCkgPT4ge1xuICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKHNldFBsYXllclByb2ZpbGUocHJvZmlsZU5hbWUpKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHJlYWRTdG9yZWRMTyhhcGkpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIGxvYWQgb3JkZXInLCBlcnIsIHtcbiAgICAgICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBiZWZvcmUgeW91IHN0YXJ0IG1vZGRpbmcnLFxuICAgICAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBmb3JjZVJlZnJlc2g/LigpO1xuICAgIH07XG4gICAgaW1wbCgpO1xuICB9LCBbIGFwaSBdKTtcblxuICBjb25zdCBpc0xzTGliSW5zdGFsbGVkID0gUmVhY3QudXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIHJldHVybiBnZXRMYXRlc3RMU0xpYk1vZChhcGkpICE9PSB1bmRlZmluZWQ7XG4gIH0sIFsgYXBpIF0pO1xuXG4gIGNvbnN0IG9uSW5zdGFsbExTTGliID0gUmVhY3QudXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIG9uR2FtZU1vZGVBY3RpdmF0ZWQoYXBpLCBHQU1FX0lEKTtcbiAgfSwgW2FwaV0pO1xuXG4gIGlmICghZ2FtZVZlcnNpb24pIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPEluZm9QYW5lbFxuICAgICAgdD17YXBpLnRyYW5zbGF0ZX1cbiAgICAgIGdhbWVWZXJzaW9uPXtnYW1lVmVyc2lvbn1cbiAgICAgIGN1cnJlbnRQcm9maWxlPXtjdXJyZW50UHJvZmlsZX1cbiAgICAgIG9uU2V0UGxheWVyUHJvZmlsZT17b25TZXRQcm9maWxlfVxuICAgICAgaXNMc0xpYkluc3RhbGxlZD17aXNMc0xpYkluc3RhbGxlZH1cbiAgICAgIG9uSW5zdGFsbExTTGliPXtvbkluc3RhbGxMU0xpYn1cbiAgICAvPlxuICApO1xufVxuXG5mdW5jdGlvbiBnZXRMYXRlc3RJbnN0YWxsZWRMU0xpYlZlcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgbW9kcyA9IHN0YXRlPy5wZXJzaXN0ZW50Py5tb2RzPy5bR0FNRV9JRF0gPz8ge307XG5cbiAgcmV0dXJuIE9iamVjdC5rZXlzKG1vZHMpLnJlZHVjZSgocHJldiwgaWQpID0+IHtcbiAgICBpZiAobW9kc1tpZF0udHlwZSA9PT0gJ2JnMy1sc2xpYi1kaXZpbmUtdG9vbCcpIHtcbiAgICAgIGNvbnN0IGFyY0lkID0gbW9kc1tpZF0uYXJjaGl2ZUlkO1xuICAgICAgY29uc3QgZGwgPSBzdGF0ZT8ucGVyc2lzdGVudD8uZG93bmxvYWRzPy5maWxlcz8uW2FyY0lkXTtcbiAgICAgIGNvbnN0IHN0b3JlZFZlciA9IG1vZHNbaWRdPy5hdHRyaWJ1dGVzPy5bJ3ZlcnNpb24nXSA/PyAnMC4wLjAnO1xuXG4gICAgICB0cnkge1xuICAgICAgICBpZiAoc2VtdmVyLmd0KHN0b3JlZFZlciwgcHJldikpIHtcbiAgICAgICAgICBwcmV2ID0gc3RvcmVkVmVyO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgbG9nKCd3YXJuJywgJ2ludmFsaWQgdmVyc2lvbiBzdG9yZWQgZm9yIGxzbGliIG1vZCcsIHsgaWQsIHZlcnNpb246IHN0b3JlZFZlciB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gVGhlIExTTGliIGRldmVsb3BlciBkb2Vzbid0IGFsd2F5cyB1cGRhdGUgdGhlIHZlcnNpb24gb24gdGhlIGV4ZWN1dGFibGVcbiAgICAgICAgLy8gIGl0c2VsZiAtIHdlJ3JlIGdvaW5nIHRvIHRyeSB0byBleHRyYWN0IGl0IGZyb20gdGhlIGFyY2hpdmUgd2hpY2ggdGVuZHNcbiAgICAgICAgLy8gIHRvIHVzZSB0aGUgY29ycmVjdCB2ZXJzaW9uLlxuICAgICAgICBjb25zdCBmaWxlTmFtZSA9IHBhdGguYmFzZW5hbWUoZGwubG9jYWxQYXRoLCBwYXRoLmV4dG5hbWUoZGwubG9jYWxQYXRoKSk7XG4gICAgICAgIGNvbnN0IGlkeCA9IGZpbGVOYW1lLmluZGV4T2YoJy12Jyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgdmVyID0gc2VtdmVyLmNvZXJjZShmaWxlTmFtZS5zbGljZShpZHggKyAyKSkudmVyc2lvbjtcbiAgICAgICAgICBpZiAoc2VtdmVyLnZhbGlkKHZlcikgJiYgdmVyICE9PSBzdG9yZWRWZXIpIHtcbiAgICAgICAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShHQU1FX0lELCBpZCwgJ3ZlcnNpb24nLCB2ZXIpKTtcbiAgICAgICAgICAgIHByZXYgPSB2ZXI7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAvLyBXZSBmYWlsZWQgdG8gZ2V0IHRoZSB2ZXJzaW9uLi4uIE9oIHdlbGwuLiBTZXQgYSBib2d1cyB2ZXJzaW9uIHNpbmNlXG4gICAgICAgICAgLy8gIHdlIGNsZWFybHkgaGF2ZSBsc2xpYiBpbnN0YWxsZWQgLSB0aGUgdXBkYXRlIGZ1bmN0aW9uYWxpdHkgc2hvdWxkIHRha2VcbiAgICAgICAgICAvLyAgY2FyZSBvZiB0aGUgcmVzdCAod2hlbiB0aGUgdXNlciBjbGlja3MgdGhlIGNoZWNrIGZvciB1cGRhdGVzIGJ1dHRvbilcbiAgICAgICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUoR0FNRV9JRCwgaWQsICd2ZXJzaW9uJywgJzEuMC4wJykpO1xuICAgICAgICAgIHByZXYgPSAnMS4wLjAnO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwcmV2O1xuICB9LCAnMC4wLjAnKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gb25DaGVja01vZFZlcnNpb24oYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBnYW1lSWQ6IHN0cmluZywgbW9kczogdHlwZXMuSU1vZFtdKSB7XG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShhcGkuZ2V0U3RhdGUoKSk7XG4gIGlmIChwcm9maWxlLmdhbWVJZCAhPT0gR0FNRV9JRCB8fCBnYW1lSWQgIT09IEdBTUVfSUQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBsYXRlc3RWZXI6IHN0cmluZyA9IGdldExhdGVzdEluc3RhbGxlZExTTGliVmVyKGFwaSk7XG5cbiAgaWYgKGxhdGVzdFZlciA9PT0gJzAuMC4wJykge1xuICAgIC8vIE5vdGhpbmcgdG8gdXBkYXRlLlxuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IG5ld2VzdFZlcjogc3RyaW5nID0gYXdhaXQgZ2l0SHViRG93bmxvYWRlci5jaGVja0ZvclVwZGF0ZXMoYXBpLCBsYXRlc3RWZXIpO1xuICBpZiAoIW5ld2VzdFZlciB8fCBuZXdlc3RWZXIgPT09IGxhdGVzdFZlcikge1xuICAgIHJldHVybjtcbiAgfVxufVxuXG5mdW5jdGlvbiBub3AoKSB7XG4gIC8vIG5vcFxufVxuXG5hc3luYyBmdW5jdGlvbiBvbkdhbWVNb2RlQWN0aXZhdGVkKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZ2FtZUlkOiBzdHJpbmcpIHtcbiAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRyeSB7XG4gICAgYXdhaXQgcmVhZFN0b3JlZExPKGFwaSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oXG4gICAgICAnRmFpbGVkIHRvIHJlYWQgbG9hZCBvcmRlcicsIGVyciwge1xuICAgICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBiZWZvcmUgeW91IHN0YXJ0IG1vZGRpbmcnLFxuICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXG4gICAgfSk7XG4gIH1cblxuICBjb25zdCBsYXRlc3RWZXI6IHN0cmluZyA9IGdldExhdGVzdEluc3RhbGxlZExTTGliVmVyKGFwaSk7XG4gIGlmIChsYXRlc3RWZXIgPT09ICcwLjAuMCcpIHtcbiAgICBhd2FpdCBnaXRIdWJEb3dubG9hZGVyLmRvd25sb2FkRGl2aW5lKGFwaSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWFpbihjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xuICBjb250ZXh0LnJlZ2lzdGVyUmVkdWNlcihbJ3NldHRpbmdzJywgJ2JhbGR1cnNnYXRlMyddLCByZWR1Y2VyKTtcblxuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XG4gICAgaWQ6IEdBTUVfSUQsXG4gICAgbmFtZTogJ0JhbGR1clxcJ3MgR2F0ZSAzJyxcbiAgICBtZXJnZU1vZHM6IHRydWUsXG4gICAgcXVlcnlQYXRoOiBmaW5kR2FtZSxcbiAgICBzdXBwb3J0ZWRUb29sczogW1xuICAgICAge1xuICAgICAgICBpZDogJ2V4ZXZ1bGthbicsXG4gICAgICAgIG5hbWU6ICdCYWxkdXJcXCdzIEdhdGUgMyAoVnVsa2FuKScsXG4gICAgICAgIGV4ZWN1dGFibGU6ICgpID0+ICdiaW4vYmczLmV4ZScsXG4gICAgICAgIHJlcXVpcmVkRmlsZXM6IFtcbiAgICAgICAgICAnYmluL2JnMy5leGUnLFxuICAgICAgICBdLFxuICAgICAgICByZWxhdGl2ZTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgXSxcbiAgICBxdWVyeU1vZFBhdGg6IG1vZHNQYXRoLFxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ2Jpbi9iZzNfZHgxMS5leGUnLFxuICAgIHNldHVwOiBkaXNjb3ZlcnkgPT4gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dC5hcGksIGRpc2NvdmVyeSksXG4gICAgcmVxdWlyZWRGaWxlczogW1xuICAgICAgJ2Jpbi9iZzNfZHgxMS5leGUnLFxuICAgIF0sXG4gICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgIFN0ZWFtQVBQSWQ6ICcxMDg2OTQwJyxcbiAgICB9LFxuICAgIGRldGFpbHM6IHtcbiAgICAgIHN0ZWFtQXBwSWQ6IDEwODY5NDAsXG4gICAgICBzdG9wUGF0dGVybnM6IFNUT1BfUEFUVEVSTlMubWFwKHRvV29yZEV4cCksXG4gICAgICBpZ25vcmVDb25mbGljdHM6IFtcbiAgICAgICAgJ2luZm8uanNvbicsXG4gICAgICBdLFxuICAgICAgaWdub3JlRGVwbG95OiBbXG4gICAgICAgICdpbmZvLmpzb24nLFxuICAgICAgXSxcbiAgICB9LFxuICB9KTtcblxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdtb2QtaWNvbnMnLCAzMDAsICdzZXR0aW5ncycsIHt9LCAnUmUtaW5zdGFsbCBMU0xpYi9EaXZpbmUnLCAoKSA9PiB7XG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IG1vZHMgPSBzdGF0ZT8ucGVyc2lzdGVudD8ubW9kcz8uW0dBTUVfSURdID8/IHt9O1xuICAgIGNvbnN0IGxzbGlicyA9IE9iamVjdC5rZXlzKG1vZHMpLmZpbHRlcigobW9kKSA9PiBtb2RzW21vZF0udHlwZSA9PT0gJ2JnMy1sc2xpYi1kaXZpbmUtdG9vbCcpO1xuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5lbWl0KCdyZW1vdmUtbW9kcycsIEdBTUVfSUQsIGxzbGlicywgKGVycikgPT4ge1xuICAgICAgaWYgKGVyciAhPT0gbnVsbCkge1xuICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWluc3RhbGwgbHNsaWInLFxuICAgICAgICAgICdQbGVhc2UgcmUtaW5zdGFsbCBtYW51YWxseScsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBnaXRIdWJEb3dubG9hZGVyLmRvd25sb2FkRGl2aW5lKGNvbnRleHQuYXBpKTtcbiAgICB9KTtcbiAgfSwgKCkgPT4ge1xuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBnYW1lTW9kZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xuICAgIHJldHVybiBnYW1lTW9kZSA9PT0gR0FNRV9JRDtcbiAgfSk7XG5cbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignYmczLXJlcGxhY2VyJywgMjUsIHRlc3RSZXBsYWNlciwgaW5zdGFsbFJlcGxhY2VyKTtcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignYmczLWxzbGliLWRpdmluZS10b29sJywgMTUsIHRlc3RMU0xpYiwgaW5zdGFsbExTTGliIGFzIGFueSk7XG5cbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ2JnMy1yZXBsYWNlcicsIDI1LCAoZ2FtZUlkKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsXG4gICAgKCkgPT4gZ2V0R2FtZURhdGFQYXRoKGNvbnRleHQuYXBpKSwgZmlsZXMgPT4gaXNSZXBsYWNlcihjb250ZXh0LmFwaSwgZmlsZXMpLFxuICAgIHsgbmFtZTogJ0JHMyBSZXBsYWNlcicgfSBhcyBhbnkpO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCdiZzMtbHNsaWItZGl2aW5lLXRvb2wnLCAxNSwgKGdhbWVJZCkgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxuICAgICgpID0+IHVuZGVmaW5lZCwgZmlsZXMgPT4gaXNMU0xpYihjb250ZXh0LmFwaSwgZmlsZXMpLFxuICAgIHsgbmFtZTogJ0JHMyBMU0xpYicgfSk7XG5cbiAgY29udGV4dC5yZWdpc3RlckxvYWRPcmRlcih7XG4gICAgZ2FtZUlkOiBHQU1FX0lELFxuICAgIGRlc2VyaWFsaXplTG9hZE9yZGVyOiAoKSA9PiBkZXNlcmlhbGl6ZUxvYWRPcmRlcihjb250ZXh0LmFwaSksXG4gICAgc2VyaWFsaXplTG9hZE9yZGVyOiAobG9hZE9yZGVyKSA9PiBzZXJpYWxpemVMb2FkT3JkZXIoY29udGV4dC5hcGksIGxvYWRPcmRlciksXG4gICAgdmFsaWRhdGUsXG4gICAgdG9nZ2xlYWJsZUVudHJpZXM6IHRydWUsXG4gICAgdXNhZ2VJbnN0cnVjdGlvbnM6ICgoKSA9PiAoPEluZm9QYW5lbFdyYXAgYXBpPXtjb250ZXh0LmFwaX0gcmVmcmVzaD17bm9wfSAvPikpIGFzIGFueSxcbiAgfSk7XG5cbiAgY29udGV4dC5vbmNlKCgpID0+IHtcbiAgICBjb250ZXh0LmFwaS5vblN0YXRlQ2hhbmdlKFsnc2Vzc2lvbicsICdiYXNlJywgJ3Rvb2xzUnVubmluZyddLFxuICAgICAgYXN5bmMgKHByZXY6IGFueSwgY3VycmVudDogYW55KSA9PiB7XG4gICAgICAgIC8vIHdoZW4gYSB0b29sIGV4aXRzLCByZS1yZWFkIHRoZSBsb2FkIG9yZGVyIGZyb20gZGlzayBhcyBpdCBtYXkgaGF2ZSBiZWVuXG4gICAgICAgIC8vIGNoYW5nZWRcbiAgICAgICAgY29uc3QgZ2FtZU1vZGUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpO1xuICAgICAgICBpZiAoKGdhbWVNb2RlID09PSBHQU1FX0lEKSAmJiAoT2JqZWN0LmtleXMoY3VycmVudCkubGVuZ3RoID09PSAwKSkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCByZWFkU3RvcmVkTE8oY29udGV4dC5hcGkpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBsb2FkIG9yZGVyJywgZXJyLCB7XG4gICAgICAgICAgICAgIG1lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGJlZm9yZSB5b3Ugc3RhcnQgbW9kZGluZycsXG4gICAgICAgICAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgKHByb2ZpbGVJZDogc3RyaW5nLCBkZXBsb3ltZW50KSA9PiB7XG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCksIHByb2ZpbGVJZCk7XG4gICAgICBpZiAoKHByb2ZpbGU/LmdhbWVJZCA9PT0gR0FNRV9JRCkgJiYgKGZvcmNlUmVmcmVzaCAhPT0gdW5kZWZpbmVkKSkge1xuICAgICAgICBmb3JjZVJlZnJlc2goKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9KTtcblxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignY2hlY2stbW9kcy12ZXJzaW9uJyxcbiAgICAgIChnYW1lSWQ6IHN0cmluZywgbW9kczogdHlwZXMuSU1vZFtdKSA9PiBvbkNoZWNrTW9kVmVyc2lvbihjb250ZXh0LmFwaSwgZ2FtZUlkLCBtb2RzKSk7XG5cbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2dhbWVtb2RlLWFjdGl2YXRlZCcsXG4gICAgICBhc3luYyAoZ2FtZU1vZGU6IHN0cmluZykgPT4gb25HYW1lTW9kZUFjdGl2YXRlZChjb250ZXh0LmFwaSwgZ2FtZU1vZGUpKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmV4cG9ydCBkZWZhdWx0IG1haW47XG4iXX0=