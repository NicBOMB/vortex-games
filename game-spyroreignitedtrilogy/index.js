"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const loadOrder_1 = require("./loadOrder");
const migrations_1 = require("./migrations");
const util_1 = require("./util");
const STEAM_ID = '996580';
async function findGame() {
    return vortex_api_1.util.GameStoreHelper.findByAppId([STEAM_ID])
        .then(game => game.gamePath);
}
async function externalFilesWarning(api, externalMods) {
    const t = api.translate;
    if (externalMods.length === 0) {
        return Promise.resolve(undefined);
    }
    return new Promise((resolve, reject) => {
        api.showDialog('info', 'External Mod Files Detected', {
            bbcode: t('Vortex has discovered the following unmanaged/external files in the '
                + 'the game\'s mods directory:[br][/br][br][/br]{{files}}'
                + '[br][/br]Please note that the existence of these mods interferes with Vortex\'s '
                + 'load ordering functionality and as such, they should be removed using the same '
                + 'medium through which they have been added.[br][/br][br][/br]'
                + 'Alternatively, Vortex can try to import these files into its mods list which will '
                + 'allow Vortex to take control over them and display them inside the load ordering page. '
                + 'Vortex\'s load ordering functionality will not display external mod entries unless imported!', { replace: { files: externalMods.map(mod => `"${mod}"`).join('[br][/br]') } }),
        }, [
            { label: 'Close', action: () => reject(new vortex_api_1.util.UserCanceled()) },
            { label: 'Import External Mods', action: () => resolve(undefined) },
        ]);
    });
}
async function ImportExternalMods(api, external) {
    const state = api.getState();
    const downloadsPath = vortex_api_1.selectors.downloadPathForGame(state, common_1.GAME_ID);
    const szip = new vortex_api_1.util.SevenZip();
    for (const modFile of external) {
        const archivePath = path_1.default.join(downloadsPath, path_1.default.basename(modFile, common_1.MOD_FILE_EXT) + '.zip');
        try {
            await szip.add(archivePath, [modFile], { raw: ['-r'] });
            await vortex_api_1.fs.removeAsync(modFile);
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
}
async function prepareForModding(context, discovery) {
    const state = context.api.getState();
    const modsPath = path_1.default.join(discovery.path, (0, common_1.modsRelPath)());
    try {
        await vortex_api_1.fs.ensureDirWritableAsync(modsPath);
        const installPath = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
        const managedFiles = await (0, util_1.getPakFiles)(installPath);
        const deployedFiles = await (0, util_1.getPakFiles)(modsPath);
        const modifier = (filePath) => path_1.default.basename(filePath).toLowerCase();
        const unManagedPredicate = (filePath) => managedFiles.find(managed => modifier(managed) === modifier(filePath)) === undefined;
        const externalMods = deployedFiles.filter(unManagedPredicate);
        try {
            await externalFilesWarning(context.api, externalMods);
            await ImportExternalMods(context.api, externalMods);
        }
        catch (err) {
            if (err instanceof vortex_api_1.util.UserCanceled) {
            }
            else {
                return Promise.reject(err);
            }
        }
    }
    catch (err) {
        return Promise.reject(err);
    }
}
function installContent(files) {
    const modFile = files.find(file => path_1.default.extname(file).toLowerCase() === common_1.MOD_FILE_EXT);
    const idx = modFile.indexOf(path_1.default.basename(modFile));
    const rootPath = path_1.default.dirname(modFile);
    const filtered = files.filter(file => ((file.indexOf(rootPath) !== -1)
        && (!file.endsWith(path_1.default.sep))));
    const instructions = filtered.map(file => {
        return {
            type: 'copy',
            source: file,
            destination: path_1.default.join(file.substr(idx)),
        };
    });
    return Promise.resolve({ instructions });
}
function testSupportedContent(files, gameId) {
    let supported = (gameId === common_1.GAME_ID) &&
        (files.find(file => path_1.default.extname(file).toLowerCase() === common_1.MOD_FILE_EXT) !== undefined);
    if (supported && files.find(file => (path_1.default.basename(file).toLowerCase() === 'moduleconfig.xml')
        && (path_1.default.basename(path_1.default.dirname(file)).toLowerCase() === 'fomod'))) {
        supported = false;
    }
    return Promise.resolve({
        supported,
        requiredFiles: [],
    });
}
function toLOPrefix(context, mod) {
    const props = (0, util_1.genProps)(context);
    if (props === undefined) {
        return 'ZZZZ-' + mod.id;
    }
    const loadOrder = props.state?.persistent?.loadOrder?.[props.profile.id] ?? [];
    const loEntry = loadOrder.find(loEntry => loEntry.id === mod.id);
    return (loEntry?.data?.prefix !== undefined)
        ? loEntry.data.prefix + '-' + mod.id
        : 'ZZZZ-' + mod.id;
}
function main(context) {
    context.registerGame({
        id: common_1.GAME_ID,
        name: 'Spyro Reignited Trilogy',
        mergeMods: (mod) => toLOPrefix(context, mod),
        queryPath: (0, util_1.toBlue)(findGame),
        requiresCleanup: true,
        supportedTools: [],
        queryModPath: () => (0, common_1.modsRelPath)(),
        logo: 'gameart.jpg',
        executable: () => 'Spyro.exe',
        requiredFiles: [
            'Spyro.exe',
        ],
        setup: (0, util_1.toBlue)((discovery) => prepareForModding(context, discovery)),
        environment: {
            SteamAPPId: STEAM_ID,
        },
        details: {
            steamAppId: +STEAM_ID,
        },
    });
    context.registerLoadOrder({
        deserializeLoadOrder: () => (0, loadOrder_1.deserialize)(context),
        serializeLoadOrder: (loadOrder) => (0, loadOrder_1.serialize)(context, loadOrder),
        validate: loadOrder_1.validate,
        gameId: common_1.GAME_ID,
        toggleableEntries: false,
        usageInstructions: 'Re-position entries by drag and dropping them - note that '
            + 'the mod with the higher index value will win any conflicts.',
    });
    context.registerInstaller('spyroreignitedtrilogy-mod', 25, (0, util_1.toBlue)(testSupportedContent), (0, util_1.toBlue)(installContent));
    context.registerMigration((0, util_1.toBlue)(oldVer => (0, migrations_1.migrate100)(context, oldVer)));
    return true;
}
module.exports = {
    default: main,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLGdEQUF3QjtBQUN4QiwyQ0FBNkQ7QUFFN0QscUNBQThEO0FBQzlELDJDQUErRDtBQUMvRCw2Q0FBMEM7QUFFMUMsaUNBQXVEO0FBRXZELE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQztBQUUxQixLQUFLLFVBQVUsUUFBUTtJQUNyQixPQUFPLGlCQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ2hELElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqQyxDQUFDO0FBRUQsS0FBSyxVQUFVLG9CQUFvQixDQUFDLEdBQXdCLEVBQUUsWUFBc0I7SUFDbEYsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQztJQUN4QixJQUFJLFlBQVksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQzdCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztLQUNuQztJQUNELE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDckMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsNkJBQTZCLEVBQUU7WUFDcEQsTUFBTSxFQUFFLENBQUMsQ0FBQyxzRUFBc0U7a0JBQzVFLHdEQUF3RDtrQkFDeEQsa0ZBQWtGO2tCQUNsRixpRkFBaUY7a0JBQ2pGLDhEQUE4RDtrQkFDOUQsb0ZBQW9GO2tCQUNwRix5RkFBeUY7a0JBQ3pGLDhGQUE4RixFQUNoRyxFQUFFLE9BQU8sRUFBRSxFQUFFLEtBQUssRUFBRSxZQUFZLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxF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QUFDLE9BQU8sQ0FBQztRQUNoRCxrQkFBa0IsRUFBRSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsSUFBQSxxQkFBUyxFQUFDLE9BQU8sRUFBRSxTQUFTLENBQUM7UUFDaEUsUUFBUSxFQUFSLG9CQUFRO1FBQ1IsTUFBTSxFQUFFLGdCQUFPO1FBQ2YsaUJBQWlCLEVBQUUsS0FBSztRQUN4QixpQkFBaUIsRUFBRSw0REFBNEQ7Y0FDM0UsNkRBQTZEO0tBQ2xFLENBQUMsQ0FBQztJQUVILE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQywyQkFBMkIsRUFBRSxFQUFFLEVBQ3ZELElBQUEsYUFBTSxFQUFDLG9CQUFvQixDQUFDLEVBQUUsSUFBQSxhQUFNLEVBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztJQUV4RCxPQUFPLENBQUMsaUJBQWlCLENBQUMsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFBLHVCQUFVLEVBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUV6RSxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHO0lBQ2YsT0FBTyxFQUFFLElBQUk7Q0FDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IEdBTUVfSUQsIE1PRF9GSUxFX0VYVCwgbW9kc1JlbFBhdGggfSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQgeyBkZXNlcmlhbGl6ZSwgc2VyaWFsaXplLCB2YWxpZGF0ZSB9IGZyb20gJy4vbG9hZE9yZGVyJztcbmltcG9ydCB7IG1pZ3JhdGUxMDAgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xuaW1wb3J0IHsgSUxvYWRPcmRlckVudHJ5LCBJUHJvcHMsIExvYWRPcmRlciB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgZ2VuUHJvcHMsIGdldFBha0ZpbGVzLCB0b0JsdWUgfSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCBTVEVBTV9JRCA9ICc5OTY1ODAnO1xuXG5hc3luYyBmdW5jdGlvbiBmaW5kR2FtZSgpIHtcbiAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFtTVEVBTV9JRF0pXG4gICAgLnRoZW4oZ2FtZSA9PiBnYW1lLmdhbWVQYXRoKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZXh0ZXJuYWxGaWxlc1dhcm5pbmcoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBleHRlcm5hbE1vZHM6IHN0cmluZ1tdKSB7XG4gIGNvbnN0IHQgPSBhcGkudHJhbnNsYXRlO1xuICBpZiAoZXh0ZXJuYWxNb2RzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgfVxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ0V4dGVybmFsIE1vZCBGaWxlcyBEZXRlY3RlZCcsIHtcbiAgICAgIGJiY29kZTogdCgnVm9ydGV4IGhhcyBkaXNjb3ZlcmVkIHRoZSBmb2xsb3dpbmcgdW5tYW5hZ2VkL2V4dGVybmFsIGZpbGVzIGluIHRoZSAnXG4gICAgICAgICsgJ3RoZSBnYW1lXFwncyBtb2RzIGRpcmVjdG9yeTpbYnJdWy9icl1bYnJdWy9icl17e2ZpbGVzfX0nXG4gICAgICAgICsgJ1ticl1bL2JyXVBsZWFzZSBub3RlIHRoYXQgdGhlIGV4aXN0ZW5jZSBvZiB0aGVzZSBtb2RzIGludGVyZmVyZXMgd2l0aCBWb3J0ZXhcXCdzICdcbiAgICAgICAgKyAnbG9hZCBvcmRlcmluZyBmdW5jdGlvbmFsaXR5IGFuZCBhcyBzdWNoLCB0aGV5IHNob3VsZCBiZSByZW1vdmVkIHVzaW5nIHRoZSBzYW1lICdcbiAgICAgICAgKyAnbWVkaXVtIHRocm91Z2ggd2hpY2ggdGhleSBoYXZlIGJlZW4gYWRkZWQuW2JyXVsvYnJdW2JyXVsvYnJdJ1xuICAgICAgICArICdBbHRlcm5hdGl2ZWx5LCBWb3J0ZXggY2FuIHRyeSB0byBpbXBvcnQgdGhlc2UgZmlsZXMgaW50byBpdHMgbW9kcyBsaXN0IHdoaWNoIHdpbGwgJ1xuICAgICAgICArICdhbGxvdyBWb3J0ZXggdG8gdGFrZSBjb250cm9sIG92ZXIgdGhlbSBhbmQgZGlzcGxheSB0aGVtIGluc2lkZSB0aGUgbG9hZCBvcmRlcmluZyBwYWdlLiAnXG4gICAgICAgICsgJ1ZvcnRleFxcJ3MgbG9hZCBvcmRlcmluZyBmdW5jdGlvbmFsaXR5IHdpbGwgbm90IGRpc3BsYXkgZXh0ZXJuYWwgbW9kIGVudHJpZXMgdW5sZXNzIGltcG9ydGVkIScsXG4gICAgICAgIHsgcmVwbGFjZTogeyBmaWxlczogZXh0ZXJuYWxNb2RzLm1hcChtb2QgPT4gYFwiJHttb2R9XCJgKS5qb2luKCdbYnJdWy9icl0nKSB9IH0pLFxuICAgIH0sIFtcbiAgICAgIHsgbGFiZWw6ICdDbG9zZScsIGFjdGlvbjogKCkgPT4gcmVqZWN0KG5ldyB1dGlsLlVzZXJDYW5jZWxlZCgpKSB9LFxuICAgICAgeyBsYWJlbDogJ0ltcG9ydCBFeHRlcm5hbCBNb2RzJywgYWN0aW9uOiAoKSA9PiByZXNvbHZlKHVuZGVmaW5lZCkgfSxcbiAgICBdKTtcbiAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIEltcG9ydEV4dGVybmFsTW9kcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGV4dGVybmFsOiBzdHJpbmdbXSkge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBkb3dubG9hZHNQYXRoID0gc2VsZWN0b3JzLmRvd25sb2FkUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICBjb25zdCBzemlwID0gbmV3IHV0aWwuU2V2ZW5aaXAoKTtcbiAgZm9yIChjb25zdCBtb2RGaWxlIG9mIGV4dGVybmFsKSB7XG4gICAgY29uc3QgYXJjaGl2ZVBhdGggPSBwYXRoLmpvaW4oZG93bmxvYWRzUGF0aCwgcGF0aC5iYXNlbmFtZShtb2RGaWxlLCBNT0RfRklMRV9FWFQpICsgJy56aXAnKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgc3ppcC5hZGQoYXJjaGl2ZVBhdGgsIFsgbW9kRmlsZSBdLCB7IHJhdzogWyctciddIH0pO1xuICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMobW9kRmlsZSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICB9XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQpIHtcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBtb2RzUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgbW9kc1JlbFBhdGgoKSk7XG4gIHRyeSB7XG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhtb2RzUGF0aCk7XG4gICAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgICBjb25zdCBtYW5hZ2VkRmlsZXMgPSBhd2FpdCBnZXRQYWtGaWxlcyhpbnN0YWxsUGF0aCk7XG4gICAgY29uc3QgZGVwbG95ZWRGaWxlcyA9IGF3YWl0IGdldFBha0ZpbGVzKG1vZHNQYXRoKTtcbiAgICBjb25zdCBtb2RpZmllciA9IChmaWxlUGF0aCkgPT4gcGF0aC5iYXNlbmFtZShmaWxlUGF0aCkudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCB1bk1hbmFnZWRQcmVkaWNhdGUgPSAoZmlsZVBhdGg6IHN0cmluZykgPT5cbiAgICAgIG1hbmFnZWRGaWxlcy5maW5kKG1hbmFnZWQgPT4gbW9kaWZpZXIobWFuYWdlZCkgPT09IG1vZGlmaWVyKGZpbGVQYXRoKSkgPT09IHVuZGVmaW5lZDtcbiAgICBjb25zdCBleHRlcm5hbE1vZHMgPSBkZXBsb3llZEZpbGVzLmZpbHRlcih1bk1hbmFnZWRQcmVkaWNhdGUpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBleHRlcm5hbEZpbGVzV2FybmluZyhjb250ZXh0LmFwaSwgZXh0ZXJuYWxNb2RzKTtcbiAgICAgIGF3YWl0IEltcG9ydEV4dGVybmFsTW9kcyhjb250ZXh0LmFwaSwgZXh0ZXJuYWxNb2RzKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZCkge1xuICAgICAgICAvLyBub3BcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgICAgfVxuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5zdGFsbENvbnRlbnQoZmlsZXMpIHtcbiAgY29uc3QgbW9kRmlsZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmV4dG5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gTU9EX0ZJTEVfRVhUKTtcbiAgY29uc3QgaWR4ID0gbW9kRmlsZS5pbmRleE9mKHBhdGguYmFzZW5hbWUobW9kRmlsZSkpO1xuICBjb25zdCByb290UGF0aCA9IHBhdGguZGlybmFtZShtb2RGaWxlKTtcblxuICAvLyBSZW1vdmUgZGlyZWN0b3JpZXMgYW5kIGFueXRoaW5nIHRoYXQgaXNuJ3QgaW4gdGhlIHJvb3RQYXRoLlxuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+XG4gICAgKChmaWxlLmluZGV4T2Yocm9vdFBhdGgpICE9PSAtMSlcbiAgICAmJiAoIWZpbGUuZW5kc1dpdGgocGF0aC5zZXApKSkpO1xuXG4gIGNvbnN0IGluc3RydWN0aW9ucyA9IGZpbHRlcmVkLm1hcChmaWxlID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2NvcHknLFxuICAgICAgc291cmNlOiBmaWxlLFxuICAgICAgZGVzdGluYXRpb246IHBhdGguam9pbihmaWxlLnN1YnN0cihpZHgpKSxcbiAgICB9O1xuICB9KTtcblxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xufVxuXG5mdW5jdGlvbiB0ZXN0U3VwcG9ydGVkQ29udGVudChmaWxlcywgZ2FtZUlkKSB7XG4gIC8vIE1ha2Ugc3VyZSB3ZSdyZSBhYmxlIHRvIHN1cHBvcnQgdGhpcyBtb2QuXG4gIGxldCBzdXBwb3J0ZWQgPSAoZ2FtZUlkID09PSBHQU1FX0lEKSAmJlxuICAgIChmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5leHRuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IE1PRF9GSUxFX0VYVCkgIT09IHVuZGVmaW5lZCk7XG5cbiAgaWYgKHN1cHBvcnRlZCAmJiBmaWxlcy5maW5kKGZpbGUgPT5cbiAgICAgIChwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09ICdtb2R1bGVjb25maWcueG1sJylcbiAgICAgICYmIChwYXRoLmJhc2VuYW1lKHBhdGguZGlybmFtZShmaWxlKSkudG9Mb3dlckNhc2UoKSA9PT0gJ2ZvbW9kJykpKSB7XG4gICAgc3VwcG9ydGVkID0gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICBzdXBwb3J0ZWQsXG4gICAgcmVxdWlyZWRGaWxlczogW10sXG4gIH0pO1xufVxuXG5mdW5jdGlvbiB0b0xPUHJlZml4KGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LCBtb2Q6IHR5cGVzLklNb2QpOiBzdHJpbmcge1xuICBjb25zdCBwcm9wczogSVByb3BzID0gZ2VuUHJvcHMoY29udGV4dCk7XG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuICdaWlpaLScgKyBtb2QuaWQ7XG4gIH1cblxuICAvLyBSZXRyaWV2ZSB0aGUgbG9hZCBvcmRlciBhcyBzdG9yZWQgaW4gVm9ydGV4J3MgYXBwbGljYXRpb24gc3RhdGUuXG4gIGNvbnN0IGxvYWRPcmRlciA9IHByb3BzLnN0YXRlPy5wZXJzaXN0ZW50Py5sb2FkT3JkZXI/Lltwcm9wcy5wcm9maWxlLmlkXSA/PyBbXTtcblxuICAvLyBGaW5kIHRoZSBtb2QgZW50cnkgaW4gdGhlIGxvYWQgb3JkZXIgc3RhdGUgYW5kIGluc2VydCB0aGUgcHJlZml4IGluIGZyb250XG4gIC8vICBvZiB0aGUgbW9kJ3MgbmFtZS9pZC93aGF0ZXZlclxuICBjb25zdCBsb0VudHJ5OiBJTG9hZE9yZGVyRW50cnkgPSBsb2FkT3JkZXIuZmluZChsb0VudHJ5ID0+IGxvRW50cnkuaWQgPT09IG1vZC5pZCk7XG4gIHJldHVybiAobG9FbnRyeT8uZGF0YT8ucHJlZml4ICE9PSB1bmRlZmluZWQpXG4gICAgPyBsb0VudHJ5LmRhdGEucHJlZml4ICsgJy0nICsgbW9kLmlkXG4gICAgOiAnWlpaWi0nICsgbW9kLmlkO1xufVxuXG5mdW5jdGlvbiBtYWluKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcbiAgICBpZDogR0FNRV9JRCxcbiAgICBuYW1lOiAnU3B5cm8gUmVpZ25pdGVkIFRyaWxvZ3knLFxuICAgIG1lcmdlTW9kczogKG1vZCkgPT4gdG9MT1ByZWZpeChjb250ZXh0LCBtb2QpLFxuICAgIHF1ZXJ5UGF0aDogdG9CbHVlKGZpbmRHYW1lKSxcbiAgICByZXF1aXJlc0NsZWFudXA6IHRydWUsXG4gICAgc3VwcG9ydGVkVG9vbHM6IFtdLFxuICAgIHF1ZXJ5TW9kUGF0aDogKCkgPT4gbW9kc1JlbFBhdGgoKSxcbiAgICBsb2dvOiAnZ2FtZWFydC5qcGcnLFxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdTcHlyby5leGUnLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtcbiAgICAgICdTcHlyby5leGUnLFxuICAgIF0sXG4gICAgc2V0dXA6IHRvQmx1ZSgoZGlzY292ZXJ5KSA9PiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LCBkaXNjb3ZlcnkpKSxcbiAgICBlbnZpcm9ubWVudDoge1xuICAgICAgU3RlYW1BUFBJZDogU1RFQU1fSUQsXG4gICAgfSxcbiAgICBkZXRhaWxzOiB7XG4gICAgICBzdGVhbUFwcElkOiArU1RFQU1fSUQsXG4gICAgfSxcbiAgfSk7XG5cbiAgY29udGV4dC5yZWdpc3RlckxvYWRPcmRlcih7XG4gICAgZGVzZXJpYWxpemVMb2FkT3JkZXI6ICgpID0+IGRlc2VyaWFsaXplKGNvbnRleHQpLFxuICAgIHNlcmlhbGl6ZUxvYWRPcmRlcjogKGxvYWRPcmRlcikgPT4gc2VyaWFsaXplKGNvbnRleHQsIGxvYWRPcmRlciksXG4gICAgdmFsaWRhdGUsXG4gICAgZ2FtZUlkOiBHQU1FX0lELFxuICAgIHRvZ2dsZWFibGVFbnRyaWVzOiBmYWxzZSxcbiAgICB1c2FnZUluc3RydWN0aW9uczogJ1JlLXBvc2l0aW9uIGVudHJpZXMgYnkgZHJhZyBhbmQgZHJvcHBpbmcgdGhlbSAtIG5vdGUgdGhhdCAnXG4gICAgICArICd0aGUgbW9kIHdpdGggdGhlIGhpZ2hlciBpbmRleCB2YWx1ZSB3aWxsIHdpbiBhbnkgY29uZmxpY3RzLicsXG4gIH0pO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3NweXJvcmVpZ25pdGVkdHJpbG9neS1tb2QnLCAyNSxcbiAgICB0b0JsdWUodGVzdFN1cHBvcnRlZENvbnRlbnQpLCB0b0JsdWUoaW5zdGFsbENvbnRlbnQpKTtcblxuICBjb250ZXh0LnJlZ2lzdGVyTWlncmF0aW9uKHRvQmx1ZShvbGRWZXIgPT4gbWlncmF0ZTEwMChjb250ZXh0LCBvbGRWZXIpKSk7XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBkZWZhdWx0OiBtYWluLFxufTtcbiJdfQ==