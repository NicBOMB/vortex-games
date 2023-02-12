import Bluebird from 'bluebird';
import { IQuery } from 'modmeta-db';
import React from 'react';
import semver from 'semver';
import turbowalk from 'turbowalk';
import { actions, fs, log, selectors, util, types } from 'vortex-api';
import * as winapi from 'winapi-bindings';
import { setRecommendations } from './actions';
import CompatibilityIcon from './CompatibilityIcon';
import { SMAPI_QUERY_FREQUENCY } from './constants';

import DependencyManager from './DependencyManager';
import sdvReducers from './reducers';
import Settings from './Settings';
import SMAPIProxy from './smapiProxy';
import { testSMAPIOutdated } from './tests';
import { compatibilityOptions, CompatibilityStatus, ISDVDependency, ISDVModManifest, ISMAPIResult } from './types';
import { parseManifest } from './util';

const path = require('path'),
  { clipboard } = require('electron'),
  rjson = require('relaxed-json'),
  { SevenZip } = util,
  { deploySMAPI, downloadSMAPI, findSMAPIMod } = require('./SMAPI'),
  { GAME_ID } = require('./common');

const MANIFEST_FILE = 'manifest.json';
const PTRN_CONTENT = path.sep + 'Content' + path.sep;
const SMAPI_EXE = 'StardewModdingAPI.exe';
const SMAPI_DLL = 'SMAPI.Installer.dll';
const SMAPI_DATA = ['windows-install.dat', 'install.dat'];

const _SMAPI_BUNDLED_MODS = ['ErrorHandler', 'ConsoleCommands', 'SaveBackup'];
const getBundledMods = () => {
  return Array.from(new Set(_SMAPI_BUNDLED_MODS.map(modName => modName.toLowerCase())));
}

function toBlue<T>(func: (...args: any[]) => Promise<T>): (...args: any[]) => Bluebird<T> {
  return (...args: any[]) => Bluebird.resolve(func(...args));
}

class StardewValley implements types.IGame {
  public context: types.IExtensionContext;
  public id: string = GAME_ID;
  public name: string = 'Stardew Valley';
  public logo: string = 'gameart.jpg';
  public requiredFiles: string[];
  public environment: { [key: string]: string } = {
    SteamAPPId: '413150',
  };
  public details: { [key: string]: any } = {
    steamAppId: 413150
  };
  public supportedTools: any[] = [
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
  public mergeMods: boolean = true;
  public requiresCleanup: boolean = true;
  public shell: boolean = process.platform === 'win32';
  public defaultPaths: string[];

  /*********
  ** Vortex API
  *********/
  /**
   * Construct an instance.
   * @param {IExtensionContext} context -- The Vortex extension context.
   */
  constructor(context: types.IExtensionContext) {
    // properties used by Vortex
    this.context = context;
    this.requiredFiles = process.platform == 'win32'
      ? ['Stardew Valley.exe']
      : ['StardewValley', 'StardewValley.exe'];

    // custom properties
    this.defaultPaths = [
      // Linux
      process.env.HOME + '/GOG Games/Stardew Valley/game',
      process.env.HOME + '/.local/share/Steam/steamapps/common/Stardew Valley',

      // Mac
      '/Applications/Stardew Valley.app/Contents/MacOS',
      process.env.HOME + '/Library/Application Support/Steam/steamapps/common/Stardew Valley/Contents/MacOS',

      // Windows
      'C:\\Program Files (x86)\\GalaxyClient\\Games\\Stardew Valley',
      'C:\\Program Files (x86)\\GOG Galaxy\\Games\\Stardew Valley',
      'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Stardew Valley'
    ];
  }

  /**
   * Asynchronously find the game install path.
   *
   * This function should return quickly and, if it returns a value, it should definitively be the
   * valid game path. Usually this function will query the path from the registry or from steam.
   * This function may return a promise and it should do that if it's doing I/O.
   *
   * This may be left undefined but then the tool/game can only be discovered by searching the disk
   * which is slow and only happens manually.
   */
  public queryPath = toBlue(async () => {
    // check Steam
    const game = await util.GameStoreHelper.findByAppId(['413150', '1453375253']);
    if (game)
      return game.gamePath;

    // check default paths
    for (const defaultPath of this.defaultPaths)
    {
      if (await this.getPathExistsAsync(defaultPath))
        return defaultPath;
    }
  });

  /**
   * Get the path of the tool executable relative to the tool base path, i.e. binaries/UT3.exe or
   * TESV.exe. This is a function so that you can return different things based on the operating
   * system for example but be aware that it will be evaluated at application start and only once,
   * so the return value can not depend on things that change at runtime.
   */
  public executable() {
    return process.platform == 'win32'
      ? 'Stardew Valley.exe'
      : 'StardewValley';
  }

  /**
   * Get the default directory where mods for this game should be stored.
   *
   * If this returns a relative path then the path is treated as relative to the game installation
   * directory. Simply return a dot ( () => '.' ) if mods are installed directly into the game
   * directory.
   */
  public queryModPath()
  {
    return 'Mods';
  }

  /**
   * Optional setup function. If this game requires some form of setup before it can be modded (like
   * creating a directory, changing a registry key, ...) do it here. It will be called every time
   * before the game mode is activated.
   * @param {IDiscoveryResult} discovery -- basic info about the game being loaded.
   */
  public setup = toBlue(async (discovery) => {
    // Make sure the folder for SMAPI mods exists.
    try {
      await fs.ensureDirWritableAsync(path.join(discovery.path, 'Mods'));
    } catch (err) {
      return Promise.reject(err);
    }
    // skip if SMAPI found
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
          this.context.api.store.dispatch(setRecommendations(false));
        } },
        { label: 'Enable recommendations', action: () => {
          this.context.api.store.dispatch(setRecommendations(true));
        } },
      ])
    }
  });

  private recommendSmapi() {
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

  /*********
  ** Internal methods
  *********/

  /**
   * Asynchronously check whether a file or directory path exists.
   * @param {string} path - The file or directory path.
   */
  async getPathExistsAsync(path)
  {
    try {
     await fs.statAsync(path);
     return true;
    }
    catch(err) {
      return false;
    }
  }

  /**
   * Asynchronously read a registry key value.
   * @param {string} hive - The registry hive to access. This should be a constant like Registry.HKLM.
   * @param {string} key - The registry key.
   * @param {string} name - The name of the value to read.
   */
  async readRegistryKeyAsync(hive, key, name)
  {
    try {
      const instPath = winapi.RegGetValue(hive, key, name);
      if (!instPath) {
        throw new Error('empty registry key');
      }
      return Promise.resolve(instPath.value);
    } catch (err) {
      return Promise.resolve(undefined);
    }
  }
}

function testRootFolder(files, gameId) {
  // We assume that any mod containing "/Content/" in its directory
  //  structure is meant to be deployed to the root folder.
  const filtered = files.filter(file => file.endsWith(path.sep))
    .map(file => path.join('fakeDir', file));
  const contentDir = filtered.find(file => file.endsWith(PTRN_CONTENT));
  const supported = ((gameId === GAME_ID)
    && (contentDir !== undefined));

  return Bluebird.resolve({ supported, requiredFiles: [] });
}

function installRootFolder(files, destinationPath) {
  // We're going to deploy "/Content/" and whatever folders come alongside it.
  //  i.e. SomeMod.7z
  //  Will be deployed     => ../SomeMod/Content/
  //  Will be deployed     => ../SomeMod/Mods/
  //  Will NOT be deployed => ../Readme.doc
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

  return Bluebird.resolve({ instructions });
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
      // We create a prefix fake directory just in case the content
      //  folder is in the archive's root folder. This is to ensure we
      //  find a match for "/Content/"
      const testFile = path.join('fakeDir', file);
      return (testFile.endsWith(PTRN_CONTENT));
    }) === undefined);
  return Bluebird.resolve({ supported, requiredFiles: [] });
}

async function install(api,
                       dependencyManager,
                       files,
                       destinationPath) {
  // The archive may contain multiple manifest files which would
  //  imply that we're installing multiple mods.
  const manifestFiles = files.filter(isValidManifest);

  interface IModInfo {
    manifest: ISDVModManifest;
    rootFolder: string;
    manifestIndex: number;
    modFiles: string[];
  }

  let parseError: Error;

  await dependencyManager.scanManifests(true);
  let mods: IModInfo[] = await Promise.all(manifestFiles.map(async manifestFile => {
    const rootFolder = path.dirname(manifestFile);
    const manifestIndex = manifestFile.toLowerCase().indexOf(MANIFEST_FILE);
    const filterFunc = (file) => (rootFolder !== '.')
      ? ((file.indexOf(rootFolder) !== -1)
        && (path.dirname(file) !== '.')
        && !file.endsWith(path.sep))
      : !file.endsWith(path.sep);
    try {
      const manifest: ISDVModManifest =
        await parseManifest(path.join(destinationPath, manifestFile));
      const modFiles = files.filter(filterFunc);
      return {
        manifest,
        rootFolder,
        manifestIndex,
        modFiles,
      };
    } catch (err) {
      // just a warning at this point as this may not be the main manifest for the mod
      log('warn', 'Failed to parse manifest', { manifestFile, error: err.message });
      parseError = err;
      return undefined;
    }
  }));

  mods = mods.filter(x => x !== undefined);

  if (mods.length === 0) {
    api.showErrorNotification(
      'The mod manifest is invalid and can\'t be read. You can try to install the mod anyway via right-click -> "Unpack (as-is)"',
      parseError, {
      allowReport: false,
    });
  }

  return Bluebird.map(mods, mod => {
    const modName = (mod.rootFolder !== '.')
      ? mod.rootFolder
      : mod.manifest.Name;

    const dependencies = mod.manifest.Dependencies || [];

    const instructions: types.IInstruction[] = [];

    for (const file of mod.modFiles) {
      const destination = path.join(modName, file.substr(mod.manifestIndex));
      instructions.push({
        type: 'copy',
        source: file,
        destination: destination,
      });
    }

    const addRuleForDependency = (dep: ISDVDependency) => {
      if ((dep.UniqueID === undefined)
          || (dep.UniqueID.toLowerCase() === 'yourname.yourotherspacksandmods')) {
        return;
      }

      const versionMatch = dep.MinimumVersion !== undefined
        ? `>=${dep.MinimumVersion}`
        : '*';
      const rule: types.IModRule = {
        // treating all dependencies as recommendations because the dependency information
        // provided by some mod authors is a bit hit-and-miss and Vortex fairly aggressively
        // enforces requirements
        // type: (dep.IsRequired ?? true) ? 'requires' : 'recommends',
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
    }

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
  // Find the SMAPI exe file.
  const smapiData = instructions.find(inst => (inst.type === 'copy') && inst.source.endsWith(SMAPI_EXE));

  return Bluebird.resolve(smapiData !== undefined);
}

function testSMAPI(files, gameId) {
  // Make sure the download contains the SMAPI data archive.s
  const supported = (gameId === GAME_ID) && (files.find(file =>
    path.basename(file) === SMAPI_DLL) !== undefined)
  return Bluebird.resolve({
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
  }
  // Find the SMAPI data archive
  const dataFile = files.find(file => {
    const isCorrectPlatform = fileHasCorrectPlatform(file);
    return isCorrectPlatform && SMAPI_DATA.includes(path.basename(file).toLowerCase())
  });
  if (dataFile === undefined) {
    return Promise.reject(new util.DataInvalid('Failed to find the SMAPI data files - download appears '
      + 'to be corrupted; please re-download SMAPI and try again'));
  }
  let data = '';
  try {
    data = await fs.readFileAsync(path.join(getDiscoveryPath(), 'Stardew Valley.deps.json'), { encoding: 'utf8' });
  } catch (err) {
    log('error', 'failed to parse SDV dependencies', err);
  }

  // file will be outdated after the walk operation so prepare a replacement.
  const updatedFiles = [];

  const szip = new SevenZip();
  // Unzip the files from the data archive. This doesn't seem to behave as described here: https://www.npmjs.com/package/node-7z#events
  await szip.extractFull(path.join(destinationPath, dataFile), destinationPath);

  // Find any files that are not in the parent folder.
  await util.walk(destinationPath, (iter, stats) => {
      const relPath = path.relative(destinationPath, iter);
      // Filter out files from the original install as they're no longer required.
      if (!files.includes(relPath) && stats.isFile() && !files.includes(relPath+path.sep)) updatedFiles.push(relPath);
      const segments = relPath.toLocaleLowerCase().split(path.sep);
      const modsFolderIdx = segments.indexOf('mods');
      if ((modsFolderIdx !== -1) && (segments.length > modsFolderIdx + 1)) {
        _SMAPI_BUNDLED_MODS.push(segments[modsFolderIdx + 1]);
      }
      return Bluebird.resolve();
  });

  // Find the SMAPI exe file.
  const smapiExe = updatedFiles.find(file => file.toLowerCase().endsWith(SMAPI_EXE.toLowerCase()));
  if (smapiExe === undefined) {
    return Promise.reject(new util.DataInvalid(`Failed to extract ${SMAPI_EXE} - download appears `
      + 'to be corrupted; please re-download SMAPI and try again'));
  }
  const idx = smapiExe.indexOf(path.basename(smapiExe));

  // Build the instructions for installation.
  const instructions: types.IInstruction[] = updatedFiles.map(file => {
      return {
          type: 'copy',
          source: file,
          destination: path.join(file.substr(idx)),
      }
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
  const logData = await fs.readFileAsync(path.join(basePath, logFile), { encoding: 'utf-8' });
  await api.showDialog('info', 'SMAPI Log', {
    text: 'Your SMAPI log is displayed below. To share it, click "Copy & Share" which will copy it to your clipboard and open the SMAPI log sharing website. ' +
      'Next, paste your code into the text box and press "save & parse log". You can now share a link to this page with others so they can see your log file.\n\n' + logData
  }, [{
    label: 'Copy & Share log', action: () => {
      const timestamp = new Date().toISOString().replace(/^.+T([^\.]+).+/, '$1');
      clipboard.writeText(`[${timestamp} INFO Vortex] Log exported by Vortex ${util.getApplication().version}.\n` + logData);
      return util.opn('https://smapi.io/log').catch(err => undefined);
    }
  }, { label: 'Close', action: () => undefined }]);
}

async function onShowSMAPILog(api) {
  //Read and display the log.
  const basePath = path.join(util.getVortexPath('appData'), 'stardewvalley', 'errorlogs');
  try {
    //If the crash log exists, show that.
    await showSMAPILog(api, basePath, "SMAPI-crash.txt");
  } catch (err) {
    try {
      //Otherwise show the normal log.
      await showSMAPILog(api, basePath, "SMAPI-latest.txt");
    } catch (err) {
      //Or Inform the user there are no logs.
      api.sendNotification({ type: 'info', title: 'No SMAPI logs found.', message: '', displayMS: 5000 });
    }
  }
}

function getModManifests(modPath?: string): Promise<string[]> {
  const manifests: string[] = [];

  if (modPath === undefined) {
    return Promise.resolve([]);
  }

  return turbowalk(modPath, async entries => {
    for (const entry of entries) {
      if (path.basename(entry.filePath) === 'manifest.json') {
        manifests.push(entry.filePath);
      }
    }
  }, { skipHidden: false, recurse: true, skipInaccessible: true, skipLinks: true })
    .then(() => manifests);
}

function updateConflictInfo(api: types.IExtensionApi,
                            smapi: SMAPIProxy,
                            gameId: string,
                            modId: string)
                            : Promise<void> {
  const mod = api.getState().persistent.mods[gameId][modId];

  if (mod === undefined) {
    return Promise.resolve();
  }

  const now = Date.now();

  if ((now - mod.attributes?.lastSMAPIQuery ?? 0) < SMAPI_QUERY_FREQUENCY) {
    return Promise.resolve();
  }

  let additionalLogicalFileNames = mod.attributes?.additionalLogicalFileNames;
  if (!additionalLogicalFileNames) {
    if (mod.attributes?.logicalFileName) {
      additionalLogicalFileNames = [mod.attributes?.logicalFileName];
    } else {
      additionalLogicalFileNames = [];
    }
  }

  const query = additionalLogicalFileNames
    .map(name => {
      const res = {
        id: name,
      };
      const ver = mod.attributes?.manifestVersion
                     ?? semver.coerce(mod.attributes?.version)?.version;
      if (!!ver) {
        res['installedVersion'] = ver;
      }

      return res;
    });

  const stat = (item: ISMAPIResult): CompatibilityStatus => {
    const status = item.metadata?.compatibilityStatus?.toLowerCase?.();
    if (!compatibilityOptions.includes(status as any)) {
      return 'unknown';
    } else {
      return status as CompatibilityStatus;
    }
  };

  const compatibilityPrio = (item: ISMAPIResult) => compatibilityOptions.indexOf(stat(item));

  return smapi.findByNames(query)
    .then(results => {
      const worstStatus: ISMAPIResult[] = results
        .sort((lhs, rhs) => compatibilityPrio(lhs) - compatibilityPrio(rhs));
      if (worstStatus.length > 0) {
        api.store.dispatch(actions.setModAttributes(gameId, modId, {
          lastSMAPIQuery: now,
          compatibilityStatus: worstStatus[0].metadata.compatibilityStatus,
          compatibilityMessage: worstStatus[0].metadata.compatibilitySummary,
          compatibilityUpdate: worstStatus[0].suggestedUpdate?.version,
        }));
      } else {
        log('debug', 'no manifest');
        api.store.dispatch(actions.setModAttribute(gameId, modId, 'lastSMAPIQuery', now));
      }
    })
    .catch(err => {
      log('warn', 'error reading manifest', err.message);
      api.store.dispatch(actions.setModAttribute(gameId, modId, 'lastSMAPIQuery', now));
    });
}

function init(context: types.IExtensionContext) {
  let dependencyManager: DependencyManager;
  const getDiscoveryPath = () => {
    const state = context.api.store.getState();
    const discovery = state?.settings?.gameMode?.discovered?.[GAME_ID];
    if ((discovery === undefined) || (discovery.path === undefined)) {
      // should never happen and if it does it will cause errors elsewhere as well
      log('error', 'stardewvalley was not discovered');
      return undefined;
    }

    return discovery.path;
  }

  const getSMAPIPath = (game) => {
    const state = context.api.store.getState();
    const discovery = state.settings.gameMode.discovered[game.id];
    return discovery.path;
  };

  const isModCandidateValid = (mod, entry) => {
    if (mod?.id === undefined || mod.type === 'sdvrootfolder') {
      // There is no reliable way to ascertain whether a new file entry
      //  actually belongs to a root modType as some of these mods will act
      //  as replacement mods. This obviously means that if the game has
      //  a substantial update which introduces new files we could potentially
      //  add a vanilla game file into the mod's staging folder causing constant
      //  contention between the game itself (when it updates) and the mod.
      //
      // There is also a potential chance for root modTypes to conflict with regular
      //  mods, which is why it's not safe to assume that any addition inside the
      //  mods directory can be safely added to this mod's staging folder either.
      return false;
    }

    if (mod.type !== 'SMAPI') {
      // Other mod types do not require further validation - it should be fine
      //  to add this entry.
      return true;
    }

    const segments = entry.filePath.toLowerCase().split(path.sep).filter(seg => !!seg);
    const modsSegIdx = segments.indexOf('mods');
    const modFolderName = ((modsSegIdx !== -1) && (segments.length > modsSegIdx + 1))
      ? segments[modsSegIdx + 1] : undefined;

    let bundledMods = mod?.attributes?.smapiBundledMods ?? [];
    bundledMods = bundledMods.length > 0 ? bundledMods : getBundledMods();
    if (segments.includes('content')) {
      // SMAPI is not supposed to overwrite the game's content directly.
      //  this is clearly not a SMAPI file and should _not_ be added to it.
      return false;
    }

    return (modFolderName !== undefined) && bundledMods.includes(modFolderName);
  };

  const manifestExtractor = toBlue(
    async (modInfo: any, modPath?: string): Promise<{ [key: string]: any; }> => {
      if (selectors.activeGameId(context.api.getState()) !== GAME_ID) {
        return Promise.resolve({});
      }

      const manifests = await getModManifests(modPath);

      const parsedManifests = (await Promise.all(manifests.map(
        async manifest => {
          try {
            return await parseManifest(manifest);
          } catch (err) {
            log('warn', 'Failed to parse manifest', { manifestFile: manifest, error: err.message });
            return undefined;
          }
        }))).filter(manifest => manifest !== undefined);

      if (parsedManifests.length === 0) {
        return Promise.resolve({});
      }

      // we can only use one manifest to get the id from
      const refManifest = parsedManifests[0];

      const additionalLogicalFileNames = parsedManifests
        .filter(manifest => manifest.UniqueID !== undefined)
        .map(manifest => manifest.UniqueID.toLowerCase());

      const minSMAPIVersion = parsedManifests
        .map(manifest => manifest.MinimumApiVersion)
        .filter(version => semver.valid(version))
        .sort((lhs, rhs) => semver.compare(rhs, lhs))[0];

      const result = {
        additionalLogicalFileNames,
        minSMAPIVersion,
      };

      if (refManifest !== undefined) {
        // don't set a custom file name for SMAPI
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
  context.registerReducer(['settings', 'SDV'], sdvReducers);

  context.registerSettings('Mods', Settings, undefined, () =>
    selectors.activeGameId(context.api.getState()) === GAME_ID, 50);

  // Register our SMAPI mod type and installer. Note: This currently flags an error in Vortex on installing correctly.
  context.registerInstaller('smapi-installer', 30, testSMAPI, (files, dest) => Bluebird.resolve(installSMAPI(getDiscoveryPath, files, dest)));
  context.registerModType('SMAPI', 30, gameId => gameId === GAME_ID, getSMAPIPath, isSMAPIModType);
  context.registerInstaller('stardew-valley-installer', 50, testSupported,
    (files, destinationPath) => Bluebird.resolve(install(context.api, dependencyManager, files, destinationPath)));
  context.registerInstaller('sdvrootfolder', 50, testRootFolder, installRootFolder);
  context.registerModType('sdvrootfolder', 25, (gameId) => (gameId === GAME_ID),
    () => getDiscoveryPath(), (instructions) => {
      // Only interested in copy instructions.
      const copyInstructions = instructions.filter(instr => instr.type === 'copy');
      // This is a tricky pattern so we're going to 1st present the different packaging
      //  patterns we need to cater for:
      //  1. Replacement mod with "Content" folder. Does not require SMAPI so no
      //    manifest files are included.
      //  2. Replacement mod with "Content" folder + one or more SMAPI mods included
      //    alongside the Content folder inside a "Mods" folder.
      //  3. A regular SMAPI mod with a "Content" folder inside the mod's root dir.
      //
      // pattern 1:
      //  - Ensure we don't have manifest files
      //  - Ensure we have a "Content" folder
      //
      // To solve patterns 2 and 3 we're going to:
      //  Check whether we have any manifest files, if we do, we expect the following
      //    archive structure in order for the modType to function correctly:
      //    archive.zip =>
      //      ../Content/
      //      ../Mods/
      //      ../Mods/A_SMAPI_MOD\manifest.json
      const hasManifest = copyInstructions.find(instr =>
        instr.destination.endsWith(MANIFEST_FILE))
      const hasModsFolder = copyInstructions.find(instr =>
        instr.destination.startsWith('Mods' + path.sep)) !== undefined;
      const hasContentFolder = copyInstructions.find(instr =>
        instr.destination.startsWith('Content' + path.sep)) !== undefined

      return (hasManifest)
        ? Bluebird.resolve(hasContentFolder && hasModsFolder)
        : Bluebird.resolve(hasContentFolder);
    });

  context.registerAction('mod-icons', 999, 'changelog', {}, 'SMAPI Log',
    () => { onShowSMAPILog(context.api); },
    () => {
      //Only show the SMAPI log button for SDV.
      const state = context.api.store.getState();
      const gameMode = selectors.activeGameId(state);
      return (gameMode === GAME_ID);
    });

  context.registerAttributeExtractor(25, manifestExtractor);

  context.registerTableAttribute('mods', {
    id: 'sdv-compatibility',
    position: 100,
    condition: () => selectors.activeGameId(context.api.getState()) === GAME_ID,
    placement: 'table',
    calc: (mod: types.IMod) => mod.attributes?.compatibilityStatus,
    customRenderer: (mod: types.IMod, detailCell: boolean, t: types.TFunction) => {
      return React.createElement(CompatibilityIcon,
                                 { t, mod, detailCell }, []);
    },
    name: 'Compatibility',
    isDefaultVisible: true,
    edit: {},
  });

  /*
  context.registerTest('sdv-missing-dependencies', 'gamemode-activated',
    () => testMissingDependencies(context.api, dependencyManager));
  */
  context.registerTest('sdv-incompatible-mods', 'gamemode-activated',
    () => Bluebird.resolve(testSMAPIOutdated(context.api, dependencyManager)));

  interface IAddedFile {
    filePath: string;
    candidates: string[];
  }

  context.once(() => {
    const proxy = new SMAPIProxy(context.api);
    context.api.setStylesheet('sdv', path.join(__dirname, 'sdvstyle.scss'));

    context.api.addMetaServer('smapi.io', {
      url: '',
      loopbackCB: (query: IQuery) => {
        return Bluebird.resolve(proxy.find(query))
          .catch(err => {
            log('error', 'failed to look up smapi meta info', err.message);
            return Bluebird.resolve([]);
          });
      },
      cacheDurationSec: 86400,
      priority: 25,
    });
    dependencyManager = new DependencyManager(context.api);
    context.api.onAsync('added-files', async (profileId, files: IAddedFile[]) => {
      const state = context.api.store.getState();
      const profile = selectors.profileById(state, profileId);
      if (profile?.gameId !== GAME_ID) {
        // don't care about any other games
        return;
      }
      const game = util.getGame(GAME_ID);
      const discovery = selectors.discoveryByGame(state, GAME_ID);
      const modPaths = game.getModPaths(discovery.path);
      const installPath = selectors.installPathForGame(state, GAME_ID);

      await Bluebird.map(files, async entry => {
        // only act if we definitively know which mod owns the file
        if (entry.candidates.length === 1) {
          const mod = state.persistent.mods?.[GAME_ID]?.[entry.candidates[0]];
          if (!isModCandidateValid(mod, entry)) {
            return Promise.resolve();
          }
          const from = modPaths[mod.type ?? ''];
          if (from === undefined) {
            // How is this even possible? regardless it's not this
            //  function's job to report this.
            log('error', 'failed to resolve mod path for mod type', mod.type);
            return Promise.resolve();
          }
          const relPath = path.relative(from, entry.filePath);
          const targetPath = path.join(installPath, mod.id, relPath);
          // copy the new file back into the corresponding mod, then delete it. That way, vortex will
          // create a link to it with the correct deployment method and not ask the user any questions
          try {
            await fs.ensureDirAsync(path.dirname(targetPath));
            await fs.copyAsync(entry.filePath, targetPath);
            await fs.removeAsync(entry.filePath);
          } catch (err) {
            if (!err.message.includes('are the same file')) {
              // should we be reporting this to the user? This is a completely
              // automated process and if it fails more often than not the
              // user probably doesn't care
              log('error', 'failed to re-import added file to mod', err.message);
            }
          }
        }
      });
    });

    context.api.onAsync('did-deploy', async (profileId) => {
      const state = context.api.getState();
      const profile = selectors.profileById(state, profileId);
      if (profile?.gameId !== GAME_ID) {
        return Promise.resolve();
      }

      const smapiMod = findSMAPIMod(context.api);
      const primaryTool = state?.settings?.interface?.primaryTool?.[GAME_ID];
      if (smapiMod && primaryTool === undefined) {
        context.api.store.dispatch(actions.setPrimaryTool(GAME_ID, 'smapi'));
      }

      return Promise.resolve();
    })

    context.api.onAsync('did-purge', async (profileId) => {
      const state = context.api.getState();
      const profile = selectors.profileById(state, profileId);
      if (profile?.gameId !== GAME_ID) {
        return Promise.resolve();
      }

      const smapiMod = findSMAPIMod(context.api);
      const primaryTool = state?.settings?.interface?.primaryTool?.[GAME_ID];
      if (smapiMod && primaryTool === 'smapi') {
        context.api.store.dispatch(actions.setPrimaryTool(GAME_ID, undefined));
      }

      return Promise.resolve();
    });

    context.api.events.on('did-install-mod', (gameId: string, archiveId: string, modId: string) => {
      if (gameId !== GAME_ID) {
        return;
      }
      updateConflictInfo(context.api, proxy, gameId, modId)
        .then(() => log('debug', 'added compatibility info', { modId }))
        .catch(err => log('error', 'failed to add compatibility info', { modId, error: err.message }));

    });

    context.api.events.on('gamemode-activated', (gameMode: string) => {
      if (gameMode !== GAME_ID) {
        return;
      }

      const state = context.api.getState();
      log('debug', 'updating SDV compatibility info');
      Promise.all(Object.keys(state.persistent.mods[gameMode] ?? {}).map(modId =>
        updateConflictInfo(context.api, proxy, gameMode, modId)))
        .then(() => {
          log('debug', 'done updating compatibility info');
        })
        .catch(err => {
          log('error', 'failed to update conflict info', err.message);
        });
    });
  });
}

export default init;
