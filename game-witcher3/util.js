"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeployment = void 0;
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
async function getDeployment(api, includedMods) {
    const state = api.getState();
    const discovery = state?.settings?.gameMode?.discovered?.[common_1.GAME_ID];
    const game = vortex_api_1.util.getGame(common_1.GAME_ID);
    if ((game === undefined) || (discovery?.path === undefined)) {
        (0, vortex_api_1.log)('error', 'game is not discovered', common_1.GAME_ID);
        return undefined;
    }
    const mods = state?.persistent?.mods?.[common_1.GAME_ID] ?? {};
    const installationDirectories = Object.values(mods)
        .filter(mod => (includedMods !== undefined)
        ? includedMods.includes(mod.id)
        : true)
        .map(mod => mod.installationPath);
    const filterFunc = (file) => installationDirectories.includes(file.source);
    const modPaths = game.getModPaths(discovery.path);
    const modTypes = Object.keys(modPaths).filter(key => !!modPaths[key]);
    const deployment = await modTypes.reduce(async (accumP, modType) => {
        const accum = await accumP;
        try {
            const manifest = await vortex_api_1.util.getManifest(api, modType, common_1.GAME_ID);
            accum[modType] = manifest.files.filter(filterFunc);
        }
        catch (err) {
            (0, vortex_api_1.log)('error', 'failed to get manifest', err);
        }
        return accum;
    }, {});
    return deployment;
}
exports.getDeployment = getDeployment;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsMkNBQThDO0FBRTlDLHFDQUFtQztBQUk1QixLQUFLLFVBQVUsYUFBYSxDQUFDLEdBQXdCLEVBQ3hCLFlBQXVCO0lBQ3pELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM3QixNQUFNLFNBQVMsR0FBRyxLQUFLLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsQ0FBQyxnQkFBTyxDQUFDLENBQUM7SUFDbkUsTUFBTSxJQUFJLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQU8sQ0FBQyxDQUFDO0lBQ25DLElBQUksQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxLQUFLLFNBQVMsQ0FBQyxFQUFFO1FBQzNELElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1FBQ2hELE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0lBRUQsTUFBTSxJQUFJLEdBQUcsS0FBSyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxnQkFBTyxDQUFDLElBQUksRUFBRSxDQUFDO0lBRXRELE1BQU0sdUJBQXVCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7U0FDaEQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxZQUFZLEtBQUssU0FBUyxDQUFDO1FBQ3pDLENBQUMsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDL0IsQ0FBQyxDQUFDLElBQUksQ0FBQztTQUNSLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBRXBDLE1BQU0sVUFBVSxHQUFHLENBQUMsSUFBbUIsRUFBRSxFQUFFLENBQUMsdUJBQXVCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUUxRixNQUFNLFFBQVEsR0FBaUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEYsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDdEUsTUFBTSxVQUFVLEdBQWdCLE1BQU0sUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxFQUFFO1FBQzlFLE1BQU0sS0FBSyxHQUFHLE1BQU0sTUFBTSxDQUFDO1FBQzNCLElBQUk7WUFDRixNQUFNLFFBQVEsR0FBOEIsTUFBTSxpQkFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLGdCQUFPLENBQUMsQ0FBQztZQUMxRixLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDcEQ7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDN0M7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUVQLE9BQU8sVUFBVSxDQUFDO0FBQ3BCLENBQUM7QUFsQ0Qsc0NBa0NDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgbG9nLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuXG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi9jb21tb24nO1xuXG5pbXBvcnQgeyBJRGVwbG95ZWRGaWxlLCBJRGVwbG95bWVudCB9IGZyb20gJy4vdHlwZXMnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0RGVwbG95bWVudChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlZE1vZHM/OiBzdHJpbmdbXSk6IFByb21pc2U8SURlcGxveW1lbnQ+IHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgZGlzY292ZXJ5ID0gc3RhdGU/LnNldHRpbmdzPy5nYW1lTW9kZT8uZGlzY292ZXJlZD8uW0dBTUVfSURdO1xuICBjb25zdCBnYW1lID0gdXRpbC5nZXRHYW1lKEdBTUVfSUQpO1xuICBpZiAoKGdhbWUgPT09IHVuZGVmaW5lZCkgfHwgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSkge1xuICAgIGxvZygnZXJyb3InLCAnZ2FtZSBpcyBub3QgZGlzY292ZXJlZCcsIEdBTUVfSUQpO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBjb25zdCBtb2RzID0gc3RhdGU/LnBlcnNpc3RlbnQ/Lm1vZHM/LltHQU1FX0lEXSA/PyB7fTtcblxuICBjb25zdCBpbnN0YWxsYXRpb25EaXJlY3RvcmllcyA9IE9iamVjdC52YWx1ZXMobW9kcylcbiAgICAuZmlsdGVyKG1vZCA9PiAoaW5jbHVkZWRNb2RzICE9PSB1bmRlZmluZWQpXG4gICAgICA/IGluY2x1ZGVkTW9kcy5pbmNsdWRlcyhtb2QuaWQpXG4gICAgICA6IHRydWUpXG4gICAgLm1hcChtb2QgPT4gbW9kLmluc3RhbGxhdGlvblBhdGgpO1xuXG4gIGNvbnN0IGZpbHRlckZ1bmMgPSAoZmlsZTogSURlcGxveWVkRmlsZSkgPT4gaW5zdGFsbGF0aW9uRGlyZWN0b3JpZXMuaW5jbHVkZXMoZmlsZS5zb3VyY2UpO1xuXG4gIGNvbnN0IG1vZFBhdGhzOiB7IFt0eXBlSWQ6IHN0cmluZ106IHN0cmluZyB9ID0gZ2FtZS5nZXRNb2RQYXRocyhkaXNjb3ZlcnkucGF0aCk7XG4gIGNvbnN0IG1vZFR5cGVzID0gT2JqZWN0LmtleXMobW9kUGF0aHMpLmZpbHRlcihrZXkgPT4gISFtb2RQYXRoc1trZXldKTtcbiAgY29uc3QgZGVwbG95bWVudDogSURlcGxveW1lbnQgPSBhd2FpdCBtb2RUeXBlcy5yZWR1Y2UoYXN5bmMgKGFjY3VtUCwgbW9kVHlwZSkgPT4ge1xuICAgIGNvbnN0IGFjY3VtID0gYXdhaXQgYWNjdW1QO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBtYW5pZmVzdDogdHlwZXMuSURlcGxveW1lbnRNYW5pZmVzdCA9IGF3YWl0IHV0aWwuZ2V0TWFuaWZlc3QoYXBpLCBtb2RUeXBlLCBHQU1FX0lEKTtcbiAgICAgIGFjY3VtW21vZFR5cGVdID0gbWFuaWZlc3QuZmlsZXMuZmlsdGVyKGZpbHRlckZ1bmMpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gZ2V0IG1hbmlmZXN0JywgZXJyKTtcbiAgICB9XG4gICAgcmV0dXJuIGFjY3VtO1xuICB9LCB7fSk7XG5cbiAgcmV0dXJuIGRlcGxveW1lbnQ7XG59XG4iXX0=