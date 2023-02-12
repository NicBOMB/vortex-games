"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird_1 = __importDefault(require("bluebird"));
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const migrations_1 = require("./migrations");
const statics_1 = require("./statics");
const util_1 = require("./util");
const BIX_CONFIG = 'BepInEx.cfg';
function ensureBIXConfig(discovery) {
    const src = path_1.default.join(__dirname, BIX_CONFIG);
    const dest = path_1.default.join(discovery.path, 'BepInEx', 'config', BIX_CONFIG);
    return vortex_api_1.fs.ensureDirWritableAsync(path_1.default.dirname(dest))
        .then(() => vortex_api_1.fs.copyAsync(src, dest))
        .catch(err => {
        if (err.code !== 'EEXIST') {
            (0, vortex_api_1.log)('warn', 'failed to write BIX config', err);
        }
        return bluebird_1.default.resolve();
    });
}
function requiresLauncher() {
    return vortex_api_1.util.epicGamesLauncher.isGameInstalled(statics_1.EPIC_APP_ID)
        .then(epic => epic
        ? { launcher: 'epic', addInfo: statics_1.EPIC_APP_ID }
        : undefined);
}
function findGame() {
    return vortex_api_1.util.epicGamesLauncher.findByAppId(statics_1.EPIC_APP_ID)
        .then(epicEntry => epicEntry.gamePath);
}
function modPath() {
    return path_1.default.join('BepInEx', 'plugins');
}
function prepareForModding(discovery) {
    if (discovery?.path === undefined) {
        return bluebird_1.default.reject(new vortex_api_1.util.ProcessCanceled('Game not discovered'));
    }
    return ensureBIXConfig(discovery)
        .then(() => vortex_api_1.fs.ensureDirWritableAsync(path_1.default.join(discovery.path, 'BepInEx', 'plugins')));
}
function main(context) {
    context.registerGame({
        id: statics_1.GAME_ID,
        name: 'Untitled Goose Game',
        mergeMods: true,
        queryPath: findGame,
        queryModPath: modPath,
        requiresLauncher,
        logo: 'gameart.jpg',
        executable: () => 'Untitled.exe',
        requiredFiles: [
            'Untitled.exe',
            'UnityPlayer.dll',
        ],
        setup: prepareForModding,
    });
    context.registerMigration((0, util_1.toBlue)(old => (0, migrations_1.migrate020)(context, old)));
    context.once(() => {
        if (context.api.ext.bepinexAddGame !== undefined) {
            context.api.ext.bepinexAddGame({
                gameId: statics_1.GAME_ID,
                autoDownloadBepInEx: true,
                doorstopConfig: {
                    doorstopType: 'default',
                    ignoreDisableSwitch: true,
                },
            });
        }
    });
    return true;
}
module.exports = {
    default: main,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLHdEQUFnQztBQUNoQyxnREFBd0I7QUFDeEIsMkNBQWtEO0FBRWxELDZDQUEwQztBQUMxQyx1Q0FBaUQ7QUFDakQsaUNBQWdDO0FBRWhDLE1BQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQztBQUNqQyxTQUFTLGVBQWUsQ0FBQyxTQUFpQztJQUN4RCxNQUFNLEdBQUcsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUM3QyxNQUFNLElBQUksR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUN4RSxPQUFPLGVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2pELElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxlQUFFLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUNuQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDWCxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFO1lBQ3pCLElBQUEsZ0JBQUcsRUFBQyxNQUFNLEVBQUUsNEJBQTRCLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDaEQ7UUFFRCxPQUFPLGtCQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDNUIsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBRUQsU0FBUyxnQkFBZ0I7SUFDdkIsT0FBTyxpQkFBSSxDQUFDLGlCQUFpQixDQUFDLGVBQWUsQ0FBQyxxQkFBVyxDQUFDO1NBQ3ZELElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDaEIsQ0FBQyxDQUFDLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUscUJBQVcsRUFBRTtRQUM1QyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDbkIsQ0FBQztBQUVELFNBQVMsUUFBUTtJQUNmLE9BQU8saUJBQUksQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMscUJBQVcsQ0FBQztTQUNuRCxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDM0MsQ0FBQztBQUVELFNBQVMsT0FBTztJQUNkLE9BQU8sY0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDekMsQ0FBQztBQUVELFNBQVMsaUJBQWlCLENBQUMsU0FBaUM7SUFDMUQsSUFBSSxTQUFTLEVBQUUsSUFBSSxLQUFLLFNBQVMsRUFBRTtRQUNqQyxPQUFPLGtCQUFRLENBQUMsTUFBTSxDQUFDLElBQUksaUJBQUksQ0FBQyxlQUFlLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO0tBQ3pFO0lBRUQsT0FBTyxlQUFlLENBQUMsU0FBUyxDQUFDO1NBQzlCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxlQUFFLENBQUMsc0JBQXNCLENBQUMsY0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUYsQ0FBQztBQUVELFNBQVMsSUFBSSxDQUFDLE9BQWdDO0lBQzVDLE9BQU8sQ0FBQyxZQUFZLENBQUM7UUFDbkIsRUFBRSxFQUFFLGlCQUFPO1FBQ1gsSUFBSSxFQUFFLHFCQUFxQjtRQUMzQixTQUFTLEVBQUUsSUFBSTtRQUNmLFNBQVMsRUFBRSxRQUFRO1FBQ25CLFlBQVksRUFBRSxPQUFPO1FBQ3JCLGdCQUFnQjtRQUNoQixJQUFJLEVBQUUsYUFBYTtRQUNuQixVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsY0FBYztRQUNoQyxhQUFhLEVBQUU7WUFDYixjQUFjO1lBQ2QsaUJBQWlCO1NBQ2xCO1FBQ0QsS0FBSyxFQUFFLGlCQUFpQjtLQUN6QixDQUFDLENBQUM7SUFHSCxPQUFPLENBQUMsaUJBQWlCLENBQUMsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFBLHVCQUFVLEVBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVuRSxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtRQUNoQixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLGNBQWMsS0FBSyxTQUFTLEVBQUU7WUFDaEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDO2dCQUM3QixNQUFNLEVBQUUsaUJBQU87Z0JBQ2YsbUJBQW1CLEVBQUUsSUFBSTtnQkFDekIsY0FBYyxFQUFFO29CQUNkLFlBQVksRUFBRSxTQUFTO29CQUN2QixtQkFBbUIsRUFBRSxJQUFJO2lCQUMxQjthQUNGLENBQUMsQ0FBQztTQUNKO0lBQ0gsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHO0lBQ2YsT0FBTyxFQUFFLElBQUk7Q0FDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZnMsIGxvZywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IHsgbWlncmF0ZTAyMCB9IGZyb20gJy4vbWlncmF0aW9ucyc7XG5pbXBvcnQgeyBFUElDX0FQUF9JRCwgR0FNRV9JRCB9IGZyb20gJy4vc3RhdGljcyc7XG5pbXBvcnQgeyB0b0JsdWUgfSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCBCSVhfQ09ORklHID0gJ0JlcEluRXguY2ZnJztcbmZ1bmN0aW9uIGVuc3VyZUJJWENvbmZpZyhkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQpOiBCbHVlYmlyZDx2b2lkPiB7XG4gIGNvbnN0IHNyYyA9IHBhdGguam9pbihfX2Rpcm5hbWUsIEJJWF9DT05GSUcpO1xuICBjb25zdCBkZXN0ID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnQmVwSW5FeCcsICdjb25maWcnLCBCSVhfQ09ORklHKTtcbiAgcmV0dXJuIGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5kaXJuYW1lKGRlc3QpKVxuICAgIC50aGVuKCgpID0+IGZzLmNvcHlBc3luYyhzcmMsIGRlc3QpKVxuICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgaWYgKGVyci5jb2RlICE9PSAnRUVYSVNUJykge1xuICAgICAgICBsb2coJ3dhcm4nLCAnZmFpbGVkIHRvIHdyaXRlIEJJWCBjb25maWcnLCBlcnIpO1xuICAgICAgfVxuICAgICAgLy8gbm9wIC0gdGhpcyBpcyBhIG5pY2UgdG8gaGF2ZSwgbm90IGEgbXVzdC5cbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKCk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHJlcXVpcmVzTGF1bmNoZXIoKSB7XG4gIHJldHVybiB1dGlsLmVwaWNHYW1lc0xhdW5jaGVyLmlzR2FtZUluc3RhbGxlZChFUElDX0FQUF9JRClcbiAgICAudGhlbihlcGljID0+IGVwaWNcbiAgICAgID8geyBsYXVuY2hlcjogJ2VwaWMnLCBhZGRJbmZvOiBFUElDX0FQUF9JRCB9XG4gICAgICA6IHVuZGVmaW5lZCk7XG59XG5cbmZ1bmN0aW9uIGZpbmRHYW1lKCkge1xuICByZXR1cm4gdXRpbC5lcGljR2FtZXNMYXVuY2hlci5maW5kQnlBcHBJZChFUElDX0FQUF9JRClcbiAgICAudGhlbihlcGljRW50cnkgPT4gZXBpY0VudHJ5LmdhbWVQYXRoKTtcbn1cblxuZnVuY3Rpb24gbW9kUGF0aCgpIHtcbiAgcmV0dXJuIHBhdGguam9pbignQmVwSW5FeCcsICdwbHVnaW5zJyk7XG59XG5cbmZ1bmN0aW9uIHByZXBhcmVGb3JNb2RkaW5nKGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCkge1xuICBpZiAoZGlzY292ZXJ5Py5wYXRoID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnR2FtZSBub3QgZGlzY292ZXJlZCcpKTtcbiAgfVxuXG4gIHJldHVybiBlbnN1cmVCSVhDb25maWcoZGlzY292ZXJ5KVxuICAgIC50aGVuKCgpID0+IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnQmVwSW5FeCcsICdwbHVnaW5zJykpKTtcbn1cblxuZnVuY3Rpb24gbWFpbihjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XG4gICAgaWQ6IEdBTUVfSUQsXG4gICAgbmFtZTogJ1VudGl0bGVkIEdvb3NlIEdhbWUnLFxuICAgIG1lcmdlTW9kczogdHJ1ZSxcbiAgICBxdWVyeVBhdGg6IGZpbmRHYW1lLFxuICAgIHF1ZXJ5TW9kUGF0aDogbW9kUGF0aCxcbiAgICByZXF1aXJlc0xhdW5jaGVyLFxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ1VudGl0bGVkLmV4ZScsXG4gICAgcmVxdWlyZWRGaWxlczogW1xuICAgICAgJ1VudGl0bGVkLmV4ZScsXG4gICAgICAnVW5pdHlQbGF5ZXIuZGxsJyxcbiAgICBdLFxuICAgIHNldHVwOiBwcmVwYXJlRm9yTW9kZGluZyxcbiAgfSk7XG5cbiAgLy8gY29udGV4dC5yZWdpc3Rlck1pZ3JhdGlvbih0b0JsdWUob2xkID0+IG1pZ3JhdGUwMTAoY29udGV4dCwgb2xkKSBhcyBhbnkpKTtcbiAgY29udGV4dC5yZWdpc3Rlck1pZ3JhdGlvbih0b0JsdWUob2xkID0+IG1pZ3JhdGUwMjAoY29udGV4dCwgb2xkKSkpO1xuXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XG4gICAgaWYgKGNvbnRleHQuYXBpLmV4dC5iZXBpbmV4QWRkR2FtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb250ZXh0LmFwaS5leHQuYmVwaW5leEFkZEdhbWUoe1xuICAgICAgICBnYW1lSWQ6IEdBTUVfSUQsXG4gICAgICAgIGF1dG9Eb3dubG9hZEJlcEluRXg6IHRydWUsXG4gICAgICAgIGRvb3JzdG9wQ29uZmlnOiB7XG4gICAgICAgICAgZG9vcnN0b3BUeXBlOiAnZGVmYXVsdCcsXG4gICAgICAgICAgaWdub3JlRGlzYWJsZVN3aXRjaDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBkZWZhdWx0OiBtYWluLFxufTtcbiJdfQ==