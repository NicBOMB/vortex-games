"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const util_1 = require("./util");
const path_1 = __importDefault(require("path"));
class DependencyManager {
    constructor(api) {
        this.mLoading = false;
        this.mApi = api;
    }
    async getManifests() {
        await this.scanManifests();
        return this.mManifests;
    }
    async refresh() {
        if (this.mLoading) {
            return;
        }
        this.mLoading = true;
        await this.scanManifests(true);
        this.mLoading = false;
    }
    async scanManifests(force) {
        if (!force && this.mManifests !== undefined) {
            return;
        }
        const state = this.mApi.getState();
        const staging = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
        const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
        const profile = vortex_api_1.selectors.profileById(state, profileId);
        const isActive = (modId) => profile?.modState?.[modId]?.enabled ?? false;
        const mods = state?.persistent?.mods?.[common_1.GAME_ID] ?? {};
        const manifests = await Object.values(mods).reduce(async (accumP, iter) => {
            const accum = await accumP;
            if (!isActive(iter.id)) {
                return Promise.resolve(accum);
            }
            const modPath = path_1.default.join(staging, iter.installationPath);
            return (0, turbowalk_1.default)(modPath, async (entries) => {
                for (const entry of entries) {
                    if (path_1.default.basename(entry.filePath) === 'manifest.json') {
                        let manifest;
                        try {
                            manifest = await (0, util_1.parseManifest)(entry.filePath);
                        }
                        catch (err) {
                            (0, vortex_api_1.log)('error', 'failed to parse manifest', { error: err.message, manifest: entry.filePath });
                            continue;
                        }
                        const list = accum[iter.id] ?? [];
                        list.push(manifest);
                        accum[iter.id] = list;
                    }
                }
            }, { skipHidden: false, recurse: true, skipInaccessible: true, skipLinks: true })
                .then(() => Promise.resolve(accum))
                .catch(err => {
                if (err['code'] === 'ENOENT') {
                    return Promise.resolve([]);
                }
                else {
                    return Promise.reject(err);
                }
            });
        }, {});
        this.mManifests = manifests;
        return Promise.resolve();
    }
}
exports.default = DependencyManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGVwZW5kZW5jeU1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJEZXBlbmRlbmN5TWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUNBLDBEQUFrQztBQUNsQywyQ0FBeUQ7QUFDekQscUNBQW1DO0FBRW5DLGlDQUF1QztBQUV2QyxnREFBd0I7QUFHeEIsTUFBcUIsaUJBQWlCO0lBS3BDLFlBQVksR0FBd0I7UUFGNUIsYUFBUSxHQUFZLEtBQUssQ0FBQztRQUdoQyxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztJQUNsQixDQUFDO0lBRU0sS0FBSyxDQUFDLFlBQVk7UUFDdkIsTUFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDM0IsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO0lBQ3pCLENBQUM7SUFFTSxLQUFLLENBQUMsT0FBTztRQUNsQixJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDakIsT0FBTztTQUNSO1FBQ0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7UUFDckIsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO0lBQ3hCLENBQUM7SUFFTSxLQUFLLENBQUMsYUFBYSxDQUFDLEtBQWU7UUFDeEMsSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsVUFBVSxLQUFLLFNBQVMsRUFBRTtZQUMzQyxPQUFPO1NBQ1I7UUFDRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ25DLE1BQU0sT0FBTyxHQUFHLHNCQUFTLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLGdCQUFPLENBQUMsQ0FBQztRQUM3RCxNQUFNLFNBQVMsR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7UUFDckUsTUFBTSxPQUFPLEdBQUcsc0JBQVMsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3hELE1BQU0sUUFBUSxHQUFHLENBQUMsS0FBYSxFQUFFLEVBQUUsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsT0FBTyxJQUFJLEtBQUssQ0FBQztRQUNqRixNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxDQUFDLGdCQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDdEQsTUFBTSxTQUFTLEdBQUcsTUFBTSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFO1lBQ3hFLE1BQU0sS0FBSyxHQUFHLE1BQU0sTUFBTSxDQUFDO1lBQzNCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFO2dCQUN0QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDL0I7WUFDRCxNQUFNLE9BQU8sR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUMxRCxPQUFPLElBQUEsbUJBQVMsRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFDLE9BQU8sRUFBQyxFQUFFO2dCQUMxQyxLQUFLLE1BQU0sS0FBSyxJQUFJLE9BQU8sRUFBRTtvQkFDM0IsSUFBSSxjQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxlQUFlLEVBQUU7d0JBQ3JELElBQUksUUFBUSxDQUFDO3dCQUNiLElBQUk7NEJBQ0YsUUFBUSxHQUFHLE1BQU0sSUFBQSxvQkFBYSxFQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQzt5QkFDaEQ7d0JBQUMsT0FBTyxHQUFHLEVBQUU7NEJBQ1osSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSwwQkFBMEIsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQzs0QkFDM0YsU0FBUzt5QkFDVjt3QkFDRCxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQzt3QkFDbEMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQzt3QkFDcEIsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUM7cUJBQ3ZCO2lCQUNGO1lBQ0QsQ0FBQyxFQUFFLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFDLENBQUM7aUJBQy9FLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO2lCQUNsQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ1gsSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssUUFBUSxFQUFFO29CQUM1QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQzVCO3FCQUFNO29CQUNMLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztpQkFDNUI7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNQLElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDO1FBQzVCLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzNCLENBQUM7Q0FDRjtBQW5FRCxvQ0FtRUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJU0RWTW9kTWFuaWZlc3QgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB0dXJib3dhbGsgZnJvbSAndHVyYm93YWxrJztcbmltcG9ydCB7IGxvZywgdHlwZXMsIHNlbGVjdG9ycywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuaW1wb3J0IHsgR0FNRV9JRCB9IGZyb20gJy4vY29tbW9uJztcblxuaW1wb3J0IHsgcGFyc2VNYW5pZmVzdCB9IGZyb20gJy4vdXRpbCc7XG5cbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG50eXBlIE1hbmlmZXN0TWFwID0geyBbbW9kSWQ6IHN0cmluZ106IElTRFZNb2RNYW5pZmVzdFtdIH07XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEZXBlbmRlbmN5TWFuYWdlciB7XG4gIHByaXZhdGUgbUFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcbiAgcHJpdmF0ZSBtTWFuaWZlc3RzOiBNYW5pZmVzdE1hcDtcbiAgcHJpdmF0ZSBtTG9hZGluZzogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xuICAgIHRoaXMubUFwaSA9IGFwaTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBnZXRNYW5pZmVzdHMoKTogUHJvbWlzZTxNYW5pZmVzdE1hcD4ge1xuICAgIGF3YWl0IHRoaXMuc2Nhbk1hbmlmZXN0cygpO1xuICAgIHJldHVybiB0aGlzLm1NYW5pZmVzdHM7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgcmVmcmVzaCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5tTG9hZGluZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLm1Mb2FkaW5nID0gdHJ1ZTtcbiAgICBhd2FpdCB0aGlzLnNjYW5NYW5pZmVzdHModHJ1ZSk7XG4gICAgdGhpcy5tTG9hZGluZyA9IGZhbHNlO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIHNjYW5NYW5pZmVzdHMoZm9yY2U/OiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCFmb3JjZSAmJiB0aGlzLm1NYW5pZmVzdHMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMubUFwaS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IHN0YWdpbmcgPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xuICAgIGNvbnN0IGlzQWN0aXZlID0gKG1vZElkOiBzdHJpbmcpID0+IHByb2ZpbGU/Lm1vZFN0YXRlPy5bbW9kSWRdPy5lbmFibGVkID8/IGZhbHNlO1xuICAgIGNvbnN0IG1vZHMgPSBzdGF0ZT8ucGVyc2lzdGVudD8ubW9kcz8uW0dBTUVfSURdID8/IHt9O1xuICAgIGNvbnN0IG1hbmlmZXN0cyA9IGF3YWl0IE9iamVjdC52YWx1ZXMobW9kcykucmVkdWNlKGFzeW5jIChhY2N1bVAsIGl0ZXIpID0+IHtcbiAgICAgIGNvbnN0IGFjY3VtID0gYXdhaXQgYWNjdW1QO1xuICAgICAgaWYgKCFpc0FjdGl2ZShpdGVyLmlkKSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG1vZFBhdGggPSBwYXRoLmpvaW4oc3RhZ2luZywgaXRlci5pbnN0YWxsYXRpb25QYXRoKTtcbiAgICAgIHJldHVybiB0dXJib3dhbGsobW9kUGF0aCwgYXN5bmMgZW50cmllcyA9PiB7XG4gICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICAgICAgaWYgKHBhdGguYmFzZW5hbWUoZW50cnkuZmlsZVBhdGgpID09PSAnbWFuaWZlc3QuanNvbicpIHtcbiAgICAgICAgICBsZXQgbWFuaWZlc3Q7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIG1hbmlmZXN0ID0gYXdhaXQgcGFyc2VNYW5pZmVzdChlbnRyeS5maWxlUGF0aCk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBwYXJzZSBtYW5pZmVzdCcsIHsgZXJyb3I6IGVyci5tZXNzYWdlLCBtYW5pZmVzdDogZW50cnkuZmlsZVBhdGggfSk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgbGlzdCA9IGFjY3VtW2l0ZXIuaWRdID8/IFtdO1xuICAgICAgICAgIGxpc3QucHVzaChtYW5pZmVzdCk7XG4gICAgICAgICAgYWNjdW1baXRlci5pZF0gPSBsaXN0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB9LCB7IHNraXBIaWRkZW46IGZhbHNlLCByZWN1cnNlOiB0cnVlLCBza2lwSW5hY2Nlc3NpYmxlOiB0cnVlLCBza2lwTGlua3M6IHRydWV9KVxuICAgICAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBpZiAoZXJyWydjb2RlJ10gPT09ICdFTk9FTlQnKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sIHt9KTtcbiAgICB0aGlzLm1NYW5pZmVzdHMgPSBtYW5pZmVzdHM7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG59XG4iXX0=