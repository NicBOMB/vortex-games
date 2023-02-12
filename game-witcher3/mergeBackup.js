"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeOnContextImport = exports.importScriptMerges = exports.exportScriptMerges = exports.queryScriptMerges = exports.restoreFromProfile = exports.storeToProfile = void 0;
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const shortid_1 = require("shortid");
const util_1 = require("./collections/util");
const mergeInventoryParsing_1 = require("./mergeInventoryParsing");
const scriptmerger_1 = require("./scriptmerger");
const util_2 = require("./util");
const sortInc = (lhs, rhs) => lhs.length - rhs.length;
const sortDec = (lhs, rhs) => rhs.length - lhs.length;
function genBaseProps(context, profileId, force) {
    if (!profileId) {
        return undefined;
    }
    const state = context.api.getState();
    const profile = vortex_api_1.selectors.profileById(state, profileId);
    if (profile?.gameId !== common_1.GAME_ID) {
        return undefined;
    }
    const localMergedScripts = (force) ? true :
        state?.persistent?.profiles?.[profileId]?.features?.local_merges ?? false;
    if (!localMergedScripts) {
        return undefined;
    }
    const discovery = state?.settings?.gameMode?.discovered?.[common_1.GAME_ID];
    const scriptMergerTool = discovery?.tools?.[common_1.SCRIPT_MERGER_ID];
    if (!scriptMergerTool?.path) {
        return undefined;
    }
    return { api: context.api, state, profile, scriptMergerTool, gamePath: discovery.path };
}
function getFileEntries(filePath) {
    let files = [];
    return (0, turbowalk_1.default)(filePath, entries => {
        const validEntries = entries.filter(entry => !entry.isDirectory)
            .map(entry => entry.filePath);
        files = files.concat(validEntries);
    }, { recurse: true })
        .catch(err => ['ENOENT', 'ENOTFOUND'].includes(err.code)
        ? Promise.resolve()
        : Promise.reject(err))
        .then(() => Promise.resolve(files));
}
async function moveFile(from, to, fileName) {
    const src = path_1.default.join(from, fileName);
    const dest = path_1.default.join(to, fileName);
    try {
        await copyFile(src, dest);
    }
    catch (err) {
        return (err.code !== 'ENOENT')
            ? Promise.reject(err)
            : Promise.resolve();
    }
}
async function removeFile(filePath) {
    if (path_1.default.extname(filePath) === '') {
        return;
    }
    try {
        await vortex_api_1.fs.removeAsync(filePath);
    }
    catch (err) {
        return (err.code === 'ENOENT')
            ? Promise.resolve()
            : Promise.reject(err);
    }
}
async function copyFile(src, dest) {
    try {
        await vortex_api_1.fs.ensureDirWritableAsync(path_1.default.dirname(dest));
        await removeFile(dest);
        await vortex_api_1.fs.copyAsync(src, dest);
    }
    catch (err) {
        return Promise.reject(err);
    }
}
async function moveFiles(src, dest, props) {
    const t = props.api.translate;
    const removeDestFiles = async () => {
        try {
            const destFiles = await getFileEntries(dest);
            destFiles.sort(sortDec);
            for (const destFile of destFiles) {
                await vortex_api_1.fs.removeAsync(destFile);
            }
        }
        catch (err) {
            if (['EPERM'].includes(err.code)) {
                return props.api.showDialog('error', 'Failed to restore merged files', {
                    bbcode: t('Vortex encountered a permissions related error while attempting '
                        + 'to replace:{{bl}}"{{filePath}}"{{bl}}'
                        + 'Please try to resolve any permissions related issues and return to this '
                        + 'dialog when you think you managed to fix it. There are a couple of things '
                        + 'you can try to fix this:[br][/br][list][*] Close/Disable any applications that may '
                        + 'interfere with Vortex\'s operations such as the game itself, the witcher script merger, '
                        + 'any external modding tools, any anti-virus software. '
                        + '[*] Ensure that your Windows user account has full read/write permissions to the file specified '
                        + '[/list]', { replace: { filePath: err.path, bl: '[br][/br][br][/br]' } }),
                }, [
                    { label: 'Cancel', action: () => Promise.reject(new vortex_api_1.util.UserCanceled()) },
                    { label: 'Try Again', action: () => removeDestFiles() },
                ]);
            }
            else {
                return Promise.reject(new vortex_api_1.util.ProcessCanceled(err.message));
            }
        }
    };
    await removeDestFiles();
    const copied = [];
    try {
        const srcFiles = await getFileEntries(src);
        srcFiles.sort(sortInc);
        for (const srcFile of srcFiles) {
            const relPath = path_1.default.relative(src, srcFile);
            const targetPath = path_1.default.join(dest, relPath);
            try {
                await copyFile(srcFile, targetPath);
                copied.push(targetPath);
            }
            catch (err) {
                (0, vortex_api_1.log)('error', 'failed to move file', err);
            }
        }
    }
    catch (err) {
        if (!!err.path && !err.path.includes(dest)) {
            return;
        }
        copied.sort(sortDec);
        for (const link of copied) {
            await vortex_api_1.fs.removeAsync(link);
        }
    }
}
function backupPath(profile) {
    return path_1.default.join(vortex_api_1.util.getVortexPath('userData'), profile.gameId, 'profiles', profile.id, 'backup');
}
async function handleMergedScripts(props, opType, dest) {
    const { scriptMergerTool, profile, gamePath } = props;
    if (!scriptMergerTool?.path) {
        return Promise.reject(new vortex_api_1.util.NotFound('Script merging tool path'));
    }
    if (!profile?.id) {
        return Promise.reject(new vortex_api_1.util.ArgumentInvalid('invalid profile'));
    }
    try {
        const mergerToolDir = path_1.default.dirname(scriptMergerTool.path);
        const profilePath = (dest === undefined)
            ? path_1.default.join(mergerToolDir, profile.id)
            : dest;
        const loarOrderFilepath = (0, common_1.getLoadOrderFilePath)();
        const mergedModName = await (0, scriptmerger_1.getMergedModName)(mergerToolDir);
        const mergedScriptsPath = path_1.default.join(gamePath, 'Mods', mergedModName);
        await vortex_api_1.fs.ensureDirWritableAsync(mergedScriptsPath);
        if (opType === 'export') {
            await moveFile(mergerToolDir, profilePath, common_1.MERGE_INV_MANIFEST);
            await moveFile(path_1.default.dirname(loarOrderFilepath), profilePath, path_1.default.basename(loarOrderFilepath));
            await moveFiles(mergedScriptsPath, path_1.default.join(profilePath, mergedModName), props);
        }
        else if (opType === 'import') {
            await moveFile(profilePath, mergerToolDir, common_1.MERGE_INV_MANIFEST);
            await moveFile(profilePath, path_1.default.dirname(loarOrderFilepath), path_1.default.basename(loarOrderFilepath));
            await moveFiles(path_1.default.join(profilePath, mergedModName), mergedScriptsPath, props);
        }
        return Promise.resolve();
    }
    catch (err) {
        (0, vortex_api_1.log)('error', 'failed to store/restore merged scripts', err);
        return Promise.reject(err);
    }
}
async function storeToProfile(context, profileId) {
    const props = genBaseProps(context, profileId);
    if (props === undefined) {
        return;
    }
    const bakPath = backupPath(props.profile);
    try {
        await handleMergedScripts(props, 'export', bakPath);
    }
    catch (err) {
        return Promise.reject(err);
    }
    return handleMergedScripts(props, 'export');
}
exports.storeToProfile = storeToProfile;
async function restoreFromProfile(context, profileId) {
    const props = genBaseProps(context, profileId);
    if (props === undefined) {
        return;
    }
    const bakPath = backupPath(props.profile);
    try {
        await handleMergedScripts(props, 'import', bakPath);
    }
    catch (err) {
        return Promise.reject(err);
    }
    return handleMergedScripts(props, 'import');
}
exports.restoreFromProfile = restoreFromProfile;
async function queryScriptMerges(context, includedModIds, collection) {
    const state = context.api.getState();
    const mods = state?.persistent?.mods?.[common_1.GAME_ID] ?? {};
    const modTypes = vortex_api_1.selectors.modPathsForGame(state, common_1.GAME_ID);
    const deployment = await (0, util_2.getDeployment)(context.api, includedModIds);
    const deployedNames = Object.keys(modTypes).reduce((accum, typeId) => {
        const modPath = modTypes[typeId];
        const files = deployment[typeId];
        const isRootMod = modPath.toLowerCase().split(path_1.default.sep).indexOf('mods') === -1;
        const names = files.map(file => {
            const nameSegments = file.relPath.split(path_1.default.sep);
            if (isRootMod) {
                const nameIdx = nameSegments.map(seg => seg.toLowerCase()).indexOf('mods') + 1;
                return (nameIdx > 0)
                    ? nameSegments[nameIdx]
                    : undefined;
            }
            else {
                return nameSegments[0];
            }
        });
        accum = accum.concat(names.filter(name => !!name));
        return accum;
    }, []);
    const uniqueDeployed = Array.from(new Set(deployedNames));
    const merged = await (0, mergeInventoryParsing_1.getNamesOfMergedMods)(context);
    const diff = lodash_1.default.difference(merged, uniqueDeployed);
    const isOptional = (modId) => (collection.rules ?? []).find(rule => {
        const mod = mods[modId];
        if (mod === undefined) {
            return false;
        }
        const validType = ['recommends'].includes(rule.type);
        if (!validType) {
            return false;
        }
        const matchedRule = vortex_api_1.util.testModReference(mod, rule.reference);
        return matchedRule;
    }) !== undefined;
    const optionalMods = includedModIds.filter(isOptional);
    if (optionalMods.length > 0 || diff.length !== 0) {
        throw new common_1.MergeDataViolationError(diff || [], optionalMods || [], vortex_api_1.util.renderModName(collection));
    }
}
exports.queryScriptMerges = queryScriptMerges;
async function exportScriptMerges(context, profileId, includedModIds, collection) {
    const props = genBaseProps(context, profileId, true);
    if (props === undefined) {
        return;
    }
    const exportMergedData = async () => {
        try {
            const tempPath = path_1.default.join(common_1.W3_TEMP_DATA_DIR, (0, shortid_1.generate)());
            await vortex_api_1.fs.ensureDirWritableAsync(tempPath);
            await handleMergedScripts(props, 'export', tempPath);
            const data = await (0, util_1.prepareFileData)(tempPath);
            return Promise.resolve(data);
        }
        catch (err) {
            return Promise.reject(err);
        }
    };
    try {
        await queryScriptMerges(context, includedModIds, collection);
        return exportMergedData();
    }
    catch (err) {
        if (err instanceof common_1.MergeDataViolationError) {
            const violationError = err;
            const optional = violationError.Optional;
            const notIncluded = violationError.NotIncluded;
            const optionalSegment = (optional.length > 0)
                ? 'Marked as "optional" but need to be marked "required":{{br}}[list]'
                    + optional.map(opt => `[*]${opt}`) + '[/list]{{br}}'
                : '';
            const notIncludedSegment = (notIncluded.length > 0)
                ? 'No longer part of the collection and need to be re-added:{{br}}[list]'
                    + notIncluded.map(ni => `[*]${ni}`) + '[/list]{{br}}'
                : '';
            return context.api.showDialog('question', 'Potential merged data mismatch', {
                bbcode: 'Your collection includes a script merge that is referencing mods '
                    + `that are...{{bl}} ${notIncludedSegment}${optionalSegment}`
                    + 'For the collection to function correctly you will need to address the '
                    + 'above or re-run the Script Merger to remove traces of merges referencing '
                    + 'these mods. Please, do only proceed to upload the collection/revision as '
                    + 'is if you intend to upload the script merge as is and if the reference for '
                    + 'the merge will e.g. be acquired from an external source as part of the collection.',
                parameters: { br: '[br][/br]', bl: '[br][/br][br][/br]' },
            }, [
                { label: 'Cancel' },
                { label: 'Upload Collection' }
            ]).then(res => (res.action === 'Cancel')
                ? Promise.reject(new vortex_api_1.util.UserCanceled)
                : exportMergedData());
        }
        return Promise.reject(err);
    }
}
exports.exportScriptMerges = exportScriptMerges;
async function importScriptMerges(context, profileId, fileData) {
    const props = genBaseProps(context, profileId, true);
    if (props === undefined) {
        return;
    }
    const res = await context.api.showDialog('question', 'Script Merges Import', {
        text: 'The collection you are importing contains script merges which the creator of '
            + 'the collection deemed necessary for the mods to function correctly. Please note that '
            + 'importing these will overwrite any existing script merges you may have effectuated. '
            + 'Please ensure to back up any existing merges (if applicable/required) before '
            + 'proceeding.',
    }, [
        { label: 'Cancel' },
        { label: 'Import Merges' },
    ], 'import-w3-script-merges-warning');
    if (res.action === 'Cancel') {
        return Promise.reject(new vortex_api_1.util.UserCanceled());
    }
    try {
        const tempPath = path_1.default.join(common_1.W3_TEMP_DATA_DIR, (0, shortid_1.generate)());
        await vortex_api_1.fs.ensureDirWritableAsync(tempPath);
        const data = await (0, util_1.restoreFileData)(fileData, tempPath);
        await handleMergedScripts(props, 'import', tempPath);
        context.api.sendNotification({
            message: 'Script merges imported successfully',
            id: 'witcher3-script-merges-status',
            type: 'success',
        });
        return data;
    }
    catch (err) {
        return Promise.reject(err);
    }
}
exports.importScriptMerges = importScriptMerges;
async function makeOnContextImport(context, collectionId) {
    const state = context.api.getState();
    const mods = state?.persistent?.mods?.[common_1.GAME_ID] ?? {};
    const collectionMod = mods[collectionId];
    if (collectionMod?.installationPath === undefined) {
        (0, vortex_api_1.log)('error', 'collection mod is missing', collectionId);
        return;
    }
    const stagingFolder = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
    try {
        const fileData = await vortex_api_1.fs.readFileAsync(path_1.default.join(stagingFolder, collectionMod.installationPath, 'collection.json'), { encoding: 'utf8' });
        const collection = JSON.parse(fileData);
        const { scriptMergedData } = collection.mergedData;
        if (scriptMergedData !== undefined) {
            const scriptMergerTool = state?.settings?.gameMode?.discovered?.[common_1.GAME_ID]?.tools?.[common_1.SCRIPT_MERGER_ID];
            if (scriptMergerTool === undefined) {
                await (0, scriptmerger_1.downloadScriptMerger)(context);
            }
            const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
            await importScriptMerges(context, profileId, (0, util_1.hex2Buffer)(scriptMergedData));
        }
    }
    catch (err) {
        if (!(err instanceof vortex_api_1.util.UserCanceled)) {
            context.api.showErrorNotification('Failed to import script merges', err);
        }
    }
}
exports.makeOnContextImport = makeOnContextImport;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VCYWNrdXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtZXJnZUJhY2t1cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSxvREFBdUI7QUFDdkIsZ0RBQXdCO0FBQ3hCLDBEQUFrQztBQUNsQywyQ0FBNkQ7QUFFN0QscUNBQ2dGO0FBRWhGLHFDQUFtQztBQUVuQyw2Q0FBa0Y7QUFFbEYsbUVBQStEO0FBRS9ELGlEQUF3RTtBQUV4RSxpQ0FBdUM7QUFhdkMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFXLEVBQUUsR0FBVyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFDdEUsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFXLEVBQUUsR0FBVyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFFdEUsU0FBUyxZQUFZLENBQUMsT0FBZ0MsRUFDaEMsU0FBaUIsRUFBRSxLQUFlO0lBQ3RELElBQUksQ0FBQyxTQUFTLEVBQUU7UUFDZCxPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUNELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDckMsTUFBTSxPQUFPLEdBQW1CLHNCQUFTLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN4RSxJQUFJLE9BQU8sRUFBRSxNQUFNLEtBQUssZ0JBQU8sRUFBRTtRQUMvQixPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUVELE1BQU0sa0JBQWtCLEdBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEQsS0FBSyxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxTQUFTLENBQUMsRUFBRSxRQUFRLEVBQUUsWUFBWSxJQUFJLEtBQUssQ0FBQztJQUM1RSxJQUFJLENBQUMsa0JBQWtC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O0tBQ0Y7SUFBQyxPQUFPLEdBQUcsRUFBRTtRQUNaLElBQUksQ0FBQyxDQUFDLEdBQUcsWUFBWSxpQkFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFO1lBQ3ZDLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsZ0NBQWdDLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDMUU7S0FDRjtBQUNILENBQUM7QUE1QkQsa0RBNEJDIiwic291cmNlc0NvbnRlbnQiOlsiXG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgdHVyYm93YWxrIGZyb20gJ3R1cmJvd2Fsayc7XG5pbXBvcnQgeyBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IEdBTUVfSUQsIGdldExvYWRPcmRlckZpbGVQYXRoLCBNRVJHRV9JTlZfTUFOSUZFU1QsXG4gIFNDUklQVF9NRVJHRVJfSUQsIFczX1RFTVBfREFUQV9ESVIsIE1lcmdlRGF0YVZpb2xhdGlvbkVycm9yIH0gZnJvbSAnLi9jb21tb24nO1xuXG5pbXBvcnQgeyBnZW5lcmF0ZSB9IGZyb20gJ3Nob3J0aWQnO1xuXG5pbXBvcnQgeyBoZXgyQnVmZmVyLCBwcmVwYXJlRmlsZURhdGEsIHJlc3RvcmVGaWxlRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMvdXRpbCc7XG5cbmltcG9ydCB7IGdldE5hbWVzT2ZNZXJnZWRNb2RzIH0gZnJvbSAnLi9tZXJnZUludmVudG9yeVBhcnNpbmcnO1xuXG5pbXBvcnQgeyBnZXRNZXJnZWRNb2ROYW1lLCBkb3dubG9hZFNjcmlwdE1lcmdlciB9IGZyb20gJy4vc2NyaXB0bWVyZ2VyJztcblxuaW1wb3J0IHsgZ2V0RGVwbG95bWVudCB9IGZyb20gJy4vdXRpbCc7XG5cbmltcG9ydCB7IElEZXBsb3llZEZpbGUsIElEZXBsb3ltZW50IH0gZnJvbSAnLi90eXBlcyc7XG5cbnR5cGUgT3BUeXBlID0gJ2ltcG9ydCcgfCAnZXhwb3J0JztcbmludGVyZmFjZSBJQmFzZVByb3BzIHtcbiAgYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xuICBzdGF0ZTogdHlwZXMuSVN0YXRlO1xuICBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZTtcbiAgc2NyaXB0TWVyZ2VyVG9vbDogdHlwZXMuSURpc2NvdmVyZWRUb29sO1xuICBnYW1lUGF0aDogc3RyaW5nO1xufVxuXG5jb25zdCBzb3J0SW5jID0gKGxoczogc3RyaW5nLCByaHM6IHN0cmluZykgPT4gbGhzLmxlbmd0aCAtIHJocy5sZW5ndGg7XG5jb25zdCBzb3J0RGVjID0gKGxoczogc3RyaW5nLCByaHM6IHN0cmluZykgPT4gcmhzLmxlbmd0aCAtIGxocy5sZW5ndGg7XG5cbmZ1bmN0aW9uIGdlbkJhc2VQcm9wcyhjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlSWQ6IHN0cmluZywgZm9yY2U/OiBib29sZWFuKTogSUJhc2VQcm9wcyB7XG4gIGlmICghcHJvZmlsZUlkKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IHByb2ZpbGU6IHR5cGVzLklQcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGNvbnN0IGxvY2FsTWVyZ2VkU2NyaXB0czogYm9vbGVhbiA9IChmb3JjZSkgPyB0cnVlIDpcbiAgICBzdGF0ZT8ucGVyc2lzdGVudD8ucHJvZmlsZXM/Lltwcm9maWxlSWRdPy5mZWF0dXJlcz8ubG9jYWxfbWVyZ2VzID8/IGZhbHNlO1xuICBpZiAoIWxvY2FsTWVyZ2VkU2NyaXB0cykge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBjb25zdCBkaXNjb3ZlcnkgPSBzdGF0ZT8uc2V0dGluZ3M/LmdhbWVNb2RlPy5kaXNjb3ZlcmVkPy5bR0FNRV9JRF07XG4gIGNvbnN0IHNjcmlwdE1lcmdlclRvb2wgPSBkaXNjb3Zlcnk/LnRvb2xzPy5bU0NSSVBUX01FUkdFUl9JRF07XG4gIGlmICghc2NyaXB0TWVyZ2VyVG9vbD8ucGF0aCkge1xuICAgIC8vIFJlZ2FyZGxlc3Mgb2YgdGhlIHVzZXIncyBwcm9maWxlIHNldHRpbmdzIC0gdGhlcmUncyBubyBwb2ludCBpbiBiYWNraW5nIHVwXG4gICAgLy8gIHRoZSBtZXJnZXMgaWYgd2UgZG9uJ3Qga25vdyB3aGVyZSB0aGUgc2NyaXB0IG1lcmdlciBpcyFcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgcmV0dXJuIHsgYXBpOiBjb250ZXh0LmFwaSwgc3RhdGUsIHByb2ZpbGUsIHNjcmlwdE1lcmdlclRvb2wsIGdhbWVQYXRoOiBkaXNjb3ZlcnkucGF0aCB9O1xufVxuXG5mdW5jdGlvbiBnZXRGaWxlRW50cmllcyhmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICBsZXQgZmlsZXM6IHN0cmluZ1tdID0gW107XG4gIHJldHVybiB0dXJib3dhbGsoZmlsZVBhdGgsIGVudHJpZXMgPT4ge1xuICAgIGNvbnN0IHZhbGlkRW50cmllcyA9IGVudHJpZXMuZmlsdGVyKGVudHJ5ID0+ICFlbnRyeS5pc0RpcmVjdG9yeSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcChlbnRyeSA9PiBlbnRyeS5maWxlUGF0aCk7XG4gICAgZmlsZXMgPSBmaWxlcy5jb25jYXQodmFsaWRFbnRyaWVzKTtcbiAgfSwgeyByZWN1cnNlOiB0cnVlIH0pXG4gIC5jYXRjaChlcnIgPT4gWydFTk9FTlQnLCAnRU5PVEZPVU5EJ10uaW5jbHVkZXMoZXJyLmNvZGUpXG4gICAgPyBQcm9taXNlLnJlc29sdmUoKVxuICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSlcbiAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGZpbGVzKSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG1vdmVGaWxlKGZyb206IHN0cmluZywgdG86IHN0cmluZywgZmlsZU5hbWU6IHN0cmluZykge1xuICBjb25zdCBzcmMgPSBwYXRoLmpvaW4oZnJvbSwgZmlsZU5hbWUpO1xuICBjb25zdCBkZXN0ID0gcGF0aC5qb2luKHRvLCBmaWxlTmFtZSk7XG4gIHRyeSB7XG4gICAgYXdhaXQgY29weUZpbGUoc3JjLCBkZXN0KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgLy8gSXQncyBwZXJmZWN0bHkgcG9zc2libGUgZm9yIHRoZSB1c2VyIG5vdCB0byBoYXZlIGFueSBtZXJnZXMgeWV0LlxuICAgIHJldHVybiAoZXJyLmNvZGUgIT09ICdFTk9FTlQnKVxuICAgICAgPyBQcm9taXNlLnJlamVjdChlcnIpXG4gICAgICA6IFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlbW92ZUZpbGUoZmlsZVBhdGg6IHN0cmluZykge1xuICBpZiAocGF0aC5leHRuYW1lKGZpbGVQYXRoKSA9PT0gJycpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdHJ5IHtcbiAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhmaWxlUGF0aCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKVxuICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNvcHlGaWxlKHNyYzogc3RyaW5nLCBkZXN0OiBzdHJpbmcpIHtcbiAgdHJ5IHtcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShkZXN0KSk7XG4gICAgYXdhaXQgcmVtb3ZlRmlsZShkZXN0KTtcbiAgICBhd2FpdCBmcy5jb3B5QXN5bmMoc3JjLCBkZXN0KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gbW92ZUZpbGVzKHNyYzogc3RyaW5nLCBkZXN0OiBzdHJpbmcsIHByb3BzOiBJQmFzZVByb3BzKSB7XG4gIGNvbnN0IHQgPSBwcm9wcy5hcGkudHJhbnNsYXRlO1xuICBjb25zdCByZW1vdmVEZXN0RmlsZXMgPSBhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGRlc3RGaWxlczogc3RyaW5nW10gPSBhd2FpdCBnZXRGaWxlRW50cmllcyhkZXN0KTtcbiAgICAgIGRlc3RGaWxlcy5zb3J0KHNvcnREZWMpO1xuICAgICAgZm9yIChjb25zdCBkZXN0RmlsZSBvZiBkZXN0RmlsZXMpIHtcbiAgICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZGVzdEZpbGUpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgaWYgKFsnRVBFUk0nXS5pbmNsdWRlcyhlcnIuY29kZSkpIHtcbiAgICAgICAgcmV0dXJuIHByb3BzLmFwaS5zaG93RGlhbG9nKCdlcnJvcicsICdGYWlsZWQgdG8gcmVzdG9yZSBtZXJnZWQgZmlsZXMnLCB7XG4gICAgICAgICAgYmJjb2RlOiB0KCdWb3J0ZXggZW5jb3VudGVyZWQgYSBwZXJtaXNzaW9ucyByZWxhdGVkIGVycm9yIHdoaWxlIGF0dGVtcHRpbmcgJ1xuICAgICAgICAgICAgKyAndG8gcmVwbGFjZTp7e2JsfX1cInt7ZmlsZVBhdGh9fVwie3tibH19J1xuICAgICAgICAgICAgKyAnUGxlYXNlIHRyeSB0byByZXNvbHZlIGFueSBwZXJtaXNzaW9ucyByZWxhdGVkIGlzc3VlcyBhbmQgcmV0dXJuIHRvIHRoaXMgJ1xuICAgICAgICAgICAgKyAnZGlhbG9nIHdoZW4geW91IHRoaW5rIHlvdSBtYW5hZ2VkIHRvIGZpeCBpdC4gVGhlcmUgYXJlIGEgY291cGxlIG9mIHRoaW5ncyAnXG4gICAgICAgICAgICArICd5b3UgY2FuIHRyeSB0byBmaXggdGhpczpbYnJdWy9icl1bbGlzdF1bKl0gQ2xvc2UvRGlzYWJsZSBhbnkgYXBwbGljYXRpb25zIHRoYXQgbWF5ICdcbiAgICAgICAgICAgICsgJ2ludGVyZmVyZSB3aXRoIFZvcnRleFxcJ3Mgb3BlcmF0aW9ucyBzdWNoIGFzIHRoZSBnYW1lIGl0c2VsZiwgdGhlIHdpdGNoZXIgc2NyaXB0IG1lcmdlciwgJ1xuICAgICAgICAgICAgKyAnYW55IGV4dGVybmFsIG1vZGRpbmcgdG9vbHMsIGFueSBhbnRpLXZpcnVzIHNvZnR3YXJlLiAnXG4gICAgICAgICAgICArICdbKl0gRW5zdXJlIHRoYXQgeW91ciBXaW5kb3dzIHVzZXIgYWNjb3VudCBoYXMgZnVsbCByZWFkL3dyaXRlIHBlcm1pc3Npb25zIHRvIHRoZSBmaWxlIHNwZWNpZmllZCAnXG4gICAgICAgICAgICArICdbL2xpc3RdJywgeyByZXBsYWNlOiB7IGZpbGVQYXRoOiBlcnIucGF0aCwgYmw6ICdbYnJdWy9icl1bYnJdWy9icl0nIH0gfSksXG4gICAgICAgIH0sXG4gICAgICAgIFtcbiAgICAgICAgICB7IGxhYmVsOiAnQ2FuY2VsJywgYWN0aW9uOiAoKSA9PiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Vc2VyQ2FuY2VsZWQoKSkgfSxcbiAgICAgICAgICB7IGxhYmVsOiAnVHJ5IEFnYWluJywgYWN0aW9uOiAoKSA9PiByZW1vdmVEZXN0RmlsZXMoKSB9LFxuICAgICAgICBdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFdlIGZhaWxlZCB0byBjbGVhbiB1cCB0aGUgZGVzdGluYXRpb24gZm9sZGVyIC0gd2UgY2FuJ3RcbiAgICAgICAgLy8gIGNvbnRpbnVlLlxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKGVyci5tZXNzYWdlKSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGF3YWl0IHJlbW92ZURlc3RGaWxlcygpO1xuICBjb25zdCBjb3BpZWQ6IHN0cmluZ1tdID0gW107XG4gIHRyeSB7XG4gICAgY29uc3Qgc3JjRmlsZXM6IHN0cmluZ1tdID0gYXdhaXQgZ2V0RmlsZUVudHJpZXMoc3JjKTtcbiAgICBzcmNGaWxlcy5zb3J0KHNvcnRJbmMpO1xuICAgIGZvciAoY29uc3Qgc3JjRmlsZSBvZiBzcmNGaWxlcykge1xuICAgICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUoc3JjLCBzcmNGaWxlKTtcbiAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBwYXRoLmpvaW4oZGVzdCwgcmVsUGF0aCk7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBjb3B5RmlsZShzcmNGaWxlLCB0YXJnZXRQYXRoKTtcbiAgICAgICAgY29waWVkLnB1c2godGFyZ2V0UGF0aCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gbW92ZSBmaWxlJywgZXJyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBpZiAoY2xlYW5VcCkge1xuICAgIC8vICAgLy8gV2UgbWFuYWdlZCB0byBjb3B5IGFsbCB0aGUgZmlsZXMsIGNsZWFuIHVwIHRoZSBzb3VyY2VcbiAgICAvLyAgIHNyY0ZpbGVzLnNvcnQoc29ydERlYyk7XG4gICAgLy8gICBmb3IgKGNvbnN0IHNyY0ZpbGUgb2Ygc3JjRmlsZXMpIHtcbiAgICAvLyAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoc3JjRmlsZSk7XG4gICAgLy8gICB9XG4gICAgLy8gfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoISFlcnIucGF0aCAmJiAhZXJyLnBhdGguaW5jbHVkZXMoZGVzdCkpIHtcbiAgICAgIC8vIFdlIGZhaWxlZCB0byBjbGVhbiB1cCB0aGUgc291cmNlXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gV2UgZmFpbGVkIHRvIGNvcHkgLSBjbGVhbiB1cC5cbiAgICBjb3BpZWQuc29ydChzb3J0RGVjKTtcbiAgICBmb3IgKGNvbnN0IGxpbmsgb2YgY29waWVkKSB7XG4gICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhsaW5rKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gYmFja3VwUGF0aChwcm9maWxlOiB0eXBlcy5JUHJvZmlsZSk6IHN0cmluZyB7XG4gIHJldHVybiBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCd1c2VyRGF0YScpLFxuICAgIHByb2ZpbGUuZ2FtZUlkLCAncHJvZmlsZXMnLCBwcm9maWxlLmlkLCAnYmFja3VwJyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZU1lcmdlZFNjcmlwdHMocHJvcHM6IElCYXNlUHJvcHMsIG9wVHlwZTogT3BUeXBlLCBkZXN0Pzogc3RyaW5nKSB7XG4gIGNvbnN0IHsgc2NyaXB0TWVyZ2VyVG9vbCwgcHJvZmlsZSwgZ2FtZVBhdGggfSA9IHByb3BzO1xuICBpZiAoIXNjcmlwdE1lcmdlclRvb2w/LnBhdGgpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuTm90Rm91bmQoJ1NjcmlwdCBtZXJnaW5nIHRvb2wgcGF0aCcpKTtcbiAgfVxuICBpZiAoIXByb2ZpbGU/LmlkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkFyZ3VtZW50SW52YWxpZCgnaW52YWxpZCBwcm9maWxlJykpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBtZXJnZXJUb29sRGlyID0gcGF0aC5kaXJuYW1lKHNjcmlwdE1lcmdlclRvb2wucGF0aCk7XG4gICAgY29uc3QgcHJvZmlsZVBhdGg6IHN0cmluZyA9IChkZXN0ID09PSB1bmRlZmluZWQpXG4gICAgICA/IHBhdGguam9pbihtZXJnZXJUb29sRGlyLCBwcm9maWxlLmlkKVxuICAgICAgOiBkZXN0O1xuICAgIGNvbnN0IGxvYXJPcmRlckZpbGVwYXRoOiBzdHJpbmcgPSBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpO1xuICAgIGNvbnN0IG1lcmdlZE1vZE5hbWUgPSBhd2FpdCBnZXRNZXJnZWRNb2ROYW1lKG1lcmdlclRvb2xEaXIpO1xuICAgIGNvbnN0IG1lcmdlZFNjcmlwdHNQYXRoID0gcGF0aC5qb2luKGdhbWVQYXRoLCAnTW9kcycsIG1lcmdlZE1vZE5hbWUpO1xuXG4gICAgLy8gSnVzdCBpbiBjYXNlIGl0J3MgbWlzc2luZy5cbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKG1lcmdlZFNjcmlwdHNQYXRoKTtcblxuICAgIGlmIChvcFR5cGUgPT09ICdleHBvcnQnKSB7XG4gICAgICBhd2FpdCBtb3ZlRmlsZShtZXJnZXJUb29sRGlyLCBwcm9maWxlUGF0aCwgTUVSR0VfSU5WX01BTklGRVNUKTtcbiAgICAgIGF3YWl0IG1vdmVGaWxlKHBhdGguZGlybmFtZShsb2FyT3JkZXJGaWxlcGF0aCksIHByb2ZpbGVQYXRoLCBwYXRoLmJhc2VuYW1lKGxvYXJPcmRlckZpbGVwYXRoKSk7XG4gICAgICBhd2FpdCBtb3ZlRmlsZXMobWVyZ2VkU2NyaXB0c1BhdGgsIHBhdGguam9pbihwcm9maWxlUGF0aCwgbWVyZ2VkTW9kTmFtZSksIHByb3BzKTtcbiAgICB9IGVsc2UgaWYgKG9wVHlwZSA9PT0gJ2ltcG9ydCcpIHtcbiAgICAgIGF3YWl0IG1vdmVGaWxlKHByb2ZpbGVQYXRoLCBtZXJnZXJUb29sRGlyLCBNRVJHRV9JTlZfTUFOSUZFU1QpO1xuICAgICAgYXdhaXQgbW92ZUZpbGUocHJvZmlsZVBhdGgsIHBhdGguZGlybmFtZShsb2FyT3JkZXJGaWxlcGF0aCksIHBhdGguYmFzZW5hbWUobG9hck9yZGVyRmlsZXBhdGgpKTtcbiAgICAgIGF3YWl0IG1vdmVGaWxlcyhwYXRoLmpvaW4ocHJvZmlsZVBhdGgsIG1lcmdlZE1vZE5hbWUpLCBtZXJnZWRTY3JpcHRzUGF0aCwgcHJvcHMpO1xuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHN0b3JlL3Jlc3RvcmUgbWVyZ2VkIHNjcmlwdHMnLCBlcnIpO1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdG9yZVRvUHJvZmlsZShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCwgcHJvZmlsZUlkOiBzdHJpbmcpIHtcbiAgY29uc3QgcHJvcHM6IElCYXNlUHJvcHMgPSBnZW5CYXNlUHJvcHMoY29udGV4dCwgcHJvZmlsZUlkKTtcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBiYWtQYXRoID0gYmFja3VwUGF0aChwcm9wcy5wcm9maWxlKTtcbiAgdHJ5IHtcbiAgICBhd2FpdCBoYW5kbGVNZXJnZWRTY3JpcHRzKHByb3BzLCAnZXhwb3J0JywgYmFrUGF0aCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9XG4gIHJldHVybiBoYW5kbGVNZXJnZWRTY3JpcHRzKHByb3BzLCAnZXhwb3J0Jyk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXN0b3JlRnJvbVByb2ZpbGUoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsIHByb2ZpbGVJZDogc3RyaW5nKSB7XG4gIGNvbnN0IHByb3BzOiBJQmFzZVByb3BzID0gZ2VuQmFzZVByb3BzKGNvbnRleHQsIHByb2ZpbGVJZCk7XG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgYmFrUGF0aCA9IGJhY2t1cFBhdGgocHJvcHMucHJvZmlsZSk7XG4gIHRyeSB7XG4gICAgYXdhaXQgaGFuZGxlTWVyZ2VkU2NyaXB0cyhwcm9wcywgJ2ltcG9ydCcsIGJha1BhdGgpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgfVxuICByZXR1cm4gaGFuZGxlTWVyZ2VkU2NyaXB0cyhwcm9wcywgJ2ltcG9ydCcpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcXVlcnlTY3JpcHRNZXJnZXMoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZWRNb2RJZHM6IHN0cmluZ1tdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb246IHR5cGVzLklNb2QpIHtcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBtb2RzID0gc3RhdGU/LnBlcnNpc3RlbnQ/Lm1vZHM/LltHQU1FX0lEXSA/PyB7fTtcbiAgY29uc3QgbW9kVHlwZXMgPSBzZWxlY3RvcnMubW9kUGF0aHNGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgY29uc3QgZGVwbG95bWVudDogSURlcGxveW1lbnQgPSBhd2FpdCBnZXREZXBsb3ltZW50KGNvbnRleHQuYXBpLCBpbmNsdWRlZE1vZElkcyk7XG4gIGNvbnN0IGRlcGxveWVkTmFtZXM6IHN0cmluZ1tdID0gT2JqZWN0LmtleXMobW9kVHlwZXMpLnJlZHVjZSgoYWNjdW0sIHR5cGVJZCkgPT4ge1xuICAgIGNvbnN0IG1vZFBhdGggPSBtb2RUeXBlc1t0eXBlSWRdO1xuICAgIGNvbnN0IGZpbGVzOiBJRGVwbG95ZWRGaWxlW10gPSBkZXBsb3ltZW50W3R5cGVJZF07XG4gICAgY29uc3QgaXNSb290TW9kID0gbW9kUGF0aC50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKS5pbmRleE9mKCdtb2RzJykgPT09IC0xO1xuICAgIGNvbnN0IG5hbWVzID0gZmlsZXMubWFwKGZpbGUgPT4ge1xuICAgICAgY29uc3QgbmFtZVNlZ21lbnRzID0gZmlsZS5yZWxQYXRoLnNwbGl0KHBhdGguc2VwKTtcbiAgICAgIGlmIChpc1Jvb3RNb2QpIHtcbiAgICAgICAgY29uc3QgbmFtZUlkeCA9IG5hbWVTZWdtZW50cy5tYXAoc2VnID0+IHNlZy50b0xvd2VyQ2FzZSgpKS5pbmRleE9mKCdtb2RzJykgKyAxO1xuICAgICAgICByZXR1cm4gKG5hbWVJZHggPiAwKVxuICAgICAgICAgID8gbmFtZVNlZ21lbnRzW25hbWVJZHhdXG4gICAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmFtZVNlZ21lbnRzWzBdO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGFjY3VtID0gYWNjdW0uY29uY2F0KG5hbWVzLmZpbHRlcihuYW1lID0+ICEhbmFtZSkpO1xuICAgIHJldHVybiBhY2N1bTtcbiAgfSwgW10pO1xuICBjb25zdCB1bmlxdWVEZXBsb3llZCA9IEFycmF5LmZyb20obmV3IFNldChkZXBsb3llZE5hbWVzKSk7XG4gIGNvbnN0IG1lcmdlZCA9IGF3YWl0IGdldE5hbWVzT2ZNZXJnZWRNb2RzKGNvbnRleHQpO1xuICBjb25zdCBkaWZmID0gXy5kaWZmZXJlbmNlKG1lcmdlZCwgdW5pcXVlRGVwbG95ZWQpO1xuICBjb25zdCBpc09wdGlvbmFsID0gKG1vZElkOiBzdHJpbmcpID0+IChjb2xsZWN0aW9uLnJ1bGVzID8/IFtdKS5maW5kKHJ1bGUgPT4ge1xuICAgIGNvbnN0IG1vZDogdHlwZXMuSU1vZCA9IG1vZHNbbW9kSWRdO1xuICAgIGlmIChtb2QgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCB2YWxpZFR5cGUgPSBbJ3JlY29tbWVuZHMnXS5pbmNsdWRlcyhydWxlLnR5cGUpO1xuICAgIGlmICghdmFsaWRUeXBlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IG1hdGNoZWRSdWxlID0gdXRpbC50ZXN0TW9kUmVmZXJlbmNlKG1vZCwgcnVsZS5yZWZlcmVuY2UpO1xuICAgIHJldHVybiBtYXRjaGVkUnVsZTtcbiAgfSkgIT09IHVuZGVmaW5lZDtcbiAgY29uc3Qgb3B0aW9uYWxNb2RzID0gaW5jbHVkZWRNb2RJZHMuZmlsdGVyKGlzT3B0aW9uYWwpO1xuICBpZiAob3B0aW9uYWxNb2RzLmxlbmd0aCA+IDAgfHwgZGlmZi5sZW5ndGggIT09IDApIHtcbiAgICB0aHJvdyBuZXcgTWVyZ2VEYXRhVmlvbGF0aW9uRXJyb3IoZGlmZiB8fCBbXSxcbiAgICAgIG9wdGlvbmFsTW9kcyB8fCBbXSwgdXRpbC5yZW5kZXJNb2ROYW1lKGNvbGxlY3Rpb24pKTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhwb3J0U2NyaXB0TWVyZ2VzKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlSWQ6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZWRNb2RJZHM6IHN0cmluZ1tdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiB0eXBlcy5JTW9kKSB7XG4gIGNvbnN0IHByb3BzOiBJQmFzZVByb3BzID0gZ2VuQmFzZVByb3BzKGNvbnRleHQsIHByb2ZpbGVJZCwgdHJ1ZSk7XG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgZXhwb3J0TWVyZ2VkRGF0YSA9IGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdGVtcFBhdGggPSBwYXRoLmpvaW4oVzNfVEVNUF9EQVRBX0RJUiwgZ2VuZXJhdGUoKSk7XG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHRlbXBQYXRoKTtcbiAgICAgIGF3YWl0IGhhbmRsZU1lcmdlZFNjcmlwdHMocHJvcHMsICdleHBvcnQnLCB0ZW1wUGF0aCk7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgcHJlcGFyZUZpbGVEYXRhKHRlbXBQYXRoKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZGF0YSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICB9XG4gIH07XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCBxdWVyeVNjcmlwdE1lcmdlcyhjb250ZXh0LCBpbmNsdWRlZE1vZElkcywgY29sbGVjdGlvbik7XG4gICAgcmV0dXJuIGV4cG9ydE1lcmdlZERhdGEoKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKGVyciBpbnN0YW5jZW9mIE1lcmdlRGF0YVZpb2xhdGlvbkVycm9yKSB7XG4gICAgICBjb25zdCB2aW9sYXRpb25FcnJvciA9IChlcnIgYXMgTWVyZ2VEYXRhVmlvbGF0aW9uRXJyb3IpO1xuICAgICAgY29uc3Qgb3B0aW9uYWwgPSB2aW9sYXRpb25FcnJvci5PcHRpb25hbDtcbiAgICAgIGNvbnN0IG5vdEluY2x1ZGVkID0gdmlvbGF0aW9uRXJyb3IuTm90SW5jbHVkZWQ7XG4gICAgICBjb25zdCBvcHRpb25hbFNlZ21lbnQgPSAob3B0aW9uYWwubGVuZ3RoID4gMClcbiAgICAgICAgPyAnTWFya2VkIGFzIFwib3B0aW9uYWxcIiBidXQgbmVlZCB0byBiZSBtYXJrZWQgXCJyZXF1aXJlZFwiOnt7YnJ9fVtsaXN0XSdcbiAgICAgICAgICArIG9wdGlvbmFsLm1hcChvcHQgPT4gYFsqXSR7b3B0fWApICsgJ1svbGlzdF17e2JyfX0nXG4gICAgICAgIDogJyc7XG4gICAgICBjb25zdCBub3RJbmNsdWRlZFNlZ21lbnQgPSAobm90SW5jbHVkZWQubGVuZ3RoID4gMClcbiAgICAgICAgPyAnTm8gbG9uZ2VyIHBhcnQgb2YgdGhlIGNvbGxlY3Rpb24gYW5kIG5lZWQgdG8gYmUgcmUtYWRkZWQ6e3ticn19W2xpc3RdJ1xuICAgICAgICAgICsgbm90SW5jbHVkZWQubWFwKG5pID0+IGBbKl0ke25pfWApICsgJ1svbGlzdF17e2JyfX0nXG4gICAgICAgIDogJyc7XG4gICAgICByZXR1cm4gY29udGV4dC5hcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnUG90ZW50aWFsIG1lcmdlZCBkYXRhIG1pc21hdGNoJywge1xuICAgICAgICBiYmNvZGU6ICdZb3VyIGNvbGxlY3Rpb24gaW5jbHVkZXMgYSBzY3JpcHQgbWVyZ2UgdGhhdCBpcyByZWZlcmVuY2luZyBtb2RzICdcbiAgICAgICAgICArIGB0aGF0IGFyZS4uLnt7Ymx9fSAke25vdEluY2x1ZGVkU2VnbWVudH0ke29wdGlvbmFsU2VnbWVudH1gXG4gICAgICAgICAgKyAnRm9yIHRoZSBjb2xsZWN0aW9uIHRvIGZ1bmN0aW9uIGNvcnJlY3RseSB5b3Ugd2lsbCBuZWVkIHRvIGFkZHJlc3MgdGhlICdcbiAgICAgICAgICArICdhYm92ZSBvciByZS1ydW4gdGhlIFNjcmlwdCBNZXJnZXIgdG8gcmVtb3ZlIHRyYWNlcyBvZiBtZXJnZXMgcmVmZXJlbmNpbmcgJ1xuICAgICAgICAgICsgJ3RoZXNlIG1vZHMuIFBsZWFzZSwgZG8gb25seSBwcm9jZWVkIHRvIHVwbG9hZCB0aGUgY29sbGVjdGlvbi9yZXZpc2lvbiBhcyAnXG4gICAgICAgICAgKyAnaXMgaWYgeW91IGludGVuZCB0byB1cGxvYWQgdGhlIHNjcmlwdCBtZXJnZSBhcyBpcyBhbmQgaWYgdGhlIHJlZmVyZW5jZSBmb3IgJ1xuICAgICAgICAgICsgJ3RoZSBtZXJnZSB3aWxsIGUuZy4gYmUgYWNxdWlyZWQgZnJvbSBhbiBleHRlcm5hbCBzb3VyY2UgYXMgcGFydCBvZiB0aGUgY29sbGVjdGlvbi4nLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7IGJyOiAnW2JyXVsvYnJdJywgYmw6ICdbYnJdWy9icl1bYnJdWy9icl0nIH0sXG4gICAgICB9LCBbXG4gICAgICAgIHsgbGFiZWw6ICdDYW5jZWwnIH0sXG4gICAgICAgIHsgbGFiZWw6ICdVcGxvYWQgQ29sbGVjdGlvbicgfVxuICAgICAgXSkudGhlbihyZXMgPT4gKHJlcy5hY3Rpb24gPT09ICdDYW5jZWwnKVxuICAgICAgICA/IFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlVzZXJDYW5jZWxlZClcbiAgICAgICAgOiBleHBvcnRNZXJnZWREYXRhKCkpO1xuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW1wb3J0U2NyaXB0TWVyZ2VzKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlSWQ6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZURhdGE6IEJ1ZmZlcikge1xuICBjb25zdCBwcm9wczogSUJhc2VQcm9wcyA9IGdlbkJhc2VQcm9wcyhjb250ZXh0LCBwcm9maWxlSWQsIHRydWUpO1xuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCByZXMgPSBhd2FpdCBjb250ZXh0LmFwaS5zaG93RGlhbG9nKCdxdWVzdGlvbicsICdTY3JpcHQgTWVyZ2VzIEltcG9ydCcsIHtcbiAgICB0ZXh0OiAnVGhlIGNvbGxlY3Rpb24geW91IGFyZSBpbXBvcnRpbmcgY29udGFpbnMgc2NyaXB0IG1lcmdlcyB3aGljaCB0aGUgY3JlYXRvciBvZiAnXG4gICAgICAgICsgJ3RoZSBjb2xsZWN0aW9uIGRlZW1lZCBuZWNlc3NhcnkgZm9yIHRoZSBtb2RzIHRvIGZ1bmN0aW9uIGNvcnJlY3RseS4gUGxlYXNlIG5vdGUgdGhhdCAnXG4gICAgICAgICsgJ2ltcG9ydGluZyB0aGVzZSB3aWxsIG92ZXJ3cml0ZSBhbnkgZXhpc3Rpbmcgc2NyaXB0IG1lcmdlcyB5b3UgbWF5IGhhdmUgZWZmZWN0dWF0ZWQuICdcbiAgICAgICAgKyAnUGxlYXNlIGVuc3VyZSB0byBiYWNrIHVwIGFueSBleGlzdGluZyBtZXJnZXMgKGlmIGFwcGxpY2FibGUvcmVxdWlyZWQpIGJlZm9yZSAnXG4gICAgICAgICsgJ3Byb2NlZWRpbmcuJyxcbiAgfSxcbiAgW1xuICAgIHsgbGFiZWw6ICdDYW5jZWwnIH0sXG4gICAgeyBsYWJlbDogJ0ltcG9ydCBNZXJnZXMnIH0sXG4gIF0sICdpbXBvcnQtdzMtc2NyaXB0LW1lcmdlcy13YXJuaW5nJyk7XG5cbiAgaWYgKHJlcy5hY3Rpb24gPT09ICdDYW5jZWwnKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlVzZXJDYW5jZWxlZCgpKTtcbiAgfVxuICB0cnkge1xuICAgIGNvbnN0IHRlbXBQYXRoID0gcGF0aC5qb2luKFczX1RFTVBfREFUQV9ESVIsIGdlbmVyYXRlKCkpO1xuICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmModGVtcFBhdGgpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXN0b3JlRmlsZURhdGEoZmlsZURhdGEsIHRlbXBQYXRoKTtcbiAgICBhd2FpdCBoYW5kbGVNZXJnZWRTY3JpcHRzKHByb3BzLCAnaW1wb3J0JywgdGVtcFBhdGgpO1xuICAgIGNvbnRleHQuYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgICAgbWVzc2FnZTogJ1NjcmlwdCBtZXJnZXMgaW1wb3J0ZWQgc3VjY2Vzc2Z1bGx5JyxcbiAgICAgIGlkOiAnd2l0Y2hlcjMtc2NyaXB0LW1lcmdlcy1zdGF0dXMnLFxuICAgICAgdHlwZTogJ3N1Y2Nlc3MnLFxuICAgIH0pO1xuICAgIHJldHVybiBkYXRhO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWFrZU9uQ29udGV4dEltcG9ydChjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCwgY29sbGVjdGlvbklkOiBzdHJpbmcpIHtcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBtb2RzID0gc3RhdGU/LnBlcnNpc3RlbnQ/Lm1vZHM/LltHQU1FX0lEXSA/PyB7fTtcbiAgY29uc3QgY29sbGVjdGlvbk1vZCA9IG1vZHNbY29sbGVjdGlvbklkXTtcbiAgaWYgKGNvbGxlY3Rpb25Nb2Q/Lmluc3RhbGxhdGlvblBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgIGxvZygnZXJyb3InLCAnY29sbGVjdGlvbiBtb2QgaXMgbWlzc2luZycsIGNvbGxlY3Rpb25JZCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qgc3RhZ2luZ0ZvbGRlciA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICB0cnkge1xuICAgIGNvbnN0IGZpbGVEYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhwYXRoLmpvaW4oc3RhZ2luZ0ZvbGRlciwgY29sbGVjdGlvbk1vZC5pbnN0YWxsYXRpb25QYXRoLCAnY29sbGVjdGlvbi5qc29uJyksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgICBjb25zdCBjb2xsZWN0aW9uID0gSlNPTi5wYXJzZShmaWxlRGF0YSk7XG4gICAgY29uc3QgeyBzY3JpcHRNZXJnZWREYXRhIH0gPSBjb2xsZWN0aW9uLm1lcmdlZERhdGE7XG4gICAgaWYgKHNjcmlwdE1lcmdlZERhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gTWFrZSBzdXJlIHdlIGhhdmUgdGhlIHNjcmlwdCBtZXJnZXIgaW5zdGFsbGVkIHN0cmFpZ2h0IGF3YXkhXG4gICAgICBjb25zdCBzY3JpcHRNZXJnZXJUb29sID0gc3RhdGU/LnNldHRpbmdzPy5nYW1lTW9kZT8uZGlzY292ZXJlZD8uW0dBTUVfSURdPy50b29scz8uW1NDUklQVF9NRVJHRVJfSURdO1xuICAgICAgaWYgKHNjcmlwdE1lcmdlclRvb2wgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBhd2FpdCBkb3dubG9hZFNjcmlwdE1lcmdlcihjb250ZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICAgICAgYXdhaXQgaW1wb3J0U2NyaXB0TWVyZ2VzKGNvbnRleHQsIHByb2ZpbGVJZCwgaGV4MkJ1ZmZlcihzY3JpcHRNZXJnZWREYXRhKSk7XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoIShlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZCkpIHtcbiAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGltcG9ydCBzY3JpcHQgbWVyZ2VzJywgZXJyKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==