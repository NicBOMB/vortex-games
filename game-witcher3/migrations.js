"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrate148 = void 0;
const semver_1 = __importDefault(require("semver"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
async function migrate148(context, oldVersion) {
    if (semver_1.default.gte(oldVersion, '1.4.8')) {
        return Promise.resolve();
    }
    const state = context.api.getState();
    const lastActiveProfile = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
    const profile = vortex_api_1.selectors.profileById(state, lastActiveProfile);
    const mods = state?.persistent?.mods?.[common_1.GAME_ID] ?? {};
    const modState = profile?.modState ?? {};
    const isEnabled = (mod) => modState[mod.id]?.enabled === true;
    const limitPatchMod = Object.values(mods).find(mod => (mod.type === 'w3modlimitpatcher') && isEnabled(mod));
    if (limitPatchMod === undefined) {
        return Promise.resolve();
    }
    const t = context.api.translate;
    context.api.sendNotification({
        type: 'warning',
        allowSuppress: false,
        message: t('Faulty Witcher 3 Mod Limit Patch detected'),
        actions: [
            {
                title: 'More',
                action: (dismiss) => {
                    dismiss();
                    context.api.showDialog('info', 'Witcher 3 Mod Limit Patch', {
                        text: t('Due to a bug, the mod limit patch was not applied correctly. '
                            + 'Please Uninstall/Remove your existing mod limit match mod entry in '
                            + 'your mods page and re-apply the patch using the "Apply Mod Limit Patch" '
                            + 'button.'),
                    }, [
                        { label: 'Close' },
                    ]);
                },
            },
        ],
    });
    return Promise.resolve();
}
exports.migrate148 = migrate148;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1pZ3JhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0Esb0RBQTRCO0FBQzVCLDJDQUEyRDtBQUUzRCxxQ0FBbUM7QUFFNUIsS0FBSyxVQUFVLFVBQVUsQ0FBQyxPQUFnQyxFQUNoQyxVQUFrQjtJQUNqRCxJQUFJLGdCQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsRUFBRTtRQUNuQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztLQUMxQjtJQUVELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDckMsTUFBTSxpQkFBaUIsR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7SUFDN0UsTUFBTSxPQUFPLEdBQUcsc0JBQVMsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLGlCQUFpQixDQUFDLENBQUM7SUFDaEUsTUFBTSxJQUFJLEdBQUcsS0FBSyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxnQkFBTyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ3RELE1BQU0sUUFBUSxHQUFHLE9BQU8sRUFBRSxRQUFRLElBQUksRUFBRSxDQUFDO0lBQ3pDLE1BQU0sU0FBUyxHQUFHLENBQUMsR0FBZSxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLE9BQU8sS0FBSyxJQUFJLENBQUM7SUFDMUUsTUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FDbkQsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLG1CQUFtQixDQUFDLElBQUksU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDeEQsSUFBSSxhQUFhLEtBQUssU0FBUyxFQUFFO1FBQy9CLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0tBQzFCO0lBRUQsTUFBTSxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUM7SUFDaEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQztRQUMzQixJQUFJLEVBQUUsU0FBUztRQUNmLGFBQWEsRUFBRSxLQUFLO1FBQ3BCLE9BQU8sRUFBRSxDQUFDLENBQUMsMkNBQTJDLENBQUM7UUFDdkQsT0FBTyxFQUFFO1lBQ1A7Z0JBQ0UsS0FBSyxFQUFFLE1BQU07Z0JBQ2IsTUFBTSxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUU7b0JBQ2xCLE9BQU8sRUFBRSxDQUFDO29CQUNWLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSwyQkFBMkIsRUFBRTt3QkFDMUQsSUFBSSxFQUFFLENBQUMsQ0FBQywrREFBK0Q7OEJBQzVELHFFQUFxRTs4QkFDckUsMEVBQTBFOzhCQUMxRSxTQUFTLENBQUM7cUJBQ3RCLEVBQUU7d0JBQ0QsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFO3FCQUNuQixDQUFDLENBQUM7Z0JBQ0wsQ0FBQzthQUNGO1NBQ0Y7S0FDRixDQUFDLENBQUM7SUFFSCxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUMzQixDQUFDO0FBMUNELGdDQTBDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHNlbXZlciBmcm9tICdzZW12ZXInO1xuaW1wb3J0IHsgYWN0aW9ucywgZnMsIHNlbGVjdG9ycywgdHlwZXMgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IHsgR0FNRV9JRCB9IGZyb20gJy4vY29tbW9uJztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1pZ3JhdGUxNDgoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRWZXJzaW9uOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKHNlbXZlci5ndGUob2xkVmVyc2lvbiwgJzEuNC44JykpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IGxhc3RBY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIGxhc3RBY3RpdmVQcm9maWxlKTtcbiAgY29uc3QgbW9kcyA9IHN0YXRlPy5wZXJzaXN0ZW50Py5tb2RzPy5bR0FNRV9JRF0gPz8ge307XG4gIGNvbnN0IG1vZFN0YXRlID0gcHJvZmlsZT8ubW9kU3RhdGUgPz8ge307XG4gIGNvbnN0IGlzRW5hYmxlZCA9IChtb2Q6IHR5cGVzLklNb2QpID0+IG1vZFN0YXRlW21vZC5pZF0/LmVuYWJsZWQgPT09IHRydWU7XG4gIGNvbnN0IGxpbWl0UGF0Y2hNb2QgPSBPYmplY3QudmFsdWVzKG1vZHMpLmZpbmQobW9kID0+XG4gICAgKG1vZC50eXBlID09PSAndzNtb2RsaW1pdHBhdGNoZXInKSAmJiBpc0VuYWJsZWQobW9kKSk7XG4gIGlmIChsaW1pdFBhdGNoTW9kID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICBjb25zdCB0ID0gY29udGV4dC5hcGkudHJhbnNsYXRlO1xuICBjb250ZXh0LmFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICB0eXBlOiAnd2FybmluZycsXG4gICAgYWxsb3dTdXBwcmVzczogZmFsc2UsXG4gICAgbWVzc2FnZTogdCgnRmF1bHR5IFdpdGNoZXIgMyBNb2QgTGltaXQgUGF0Y2ggZGV0ZWN0ZWQnKSxcbiAgICBhY3Rpb25zOiBbXG4gICAgICB7XG4gICAgICAgIHRpdGxlOiAnTW9yZScsXG4gICAgICAgIGFjdGlvbjogKGRpc21pc3MpID0+IHtcbiAgICAgICAgICBkaXNtaXNzKCk7XG4gICAgICAgICAgY29udGV4dC5hcGkuc2hvd0RpYWxvZygnaW5mbycsICdXaXRjaGVyIDMgTW9kIExpbWl0IFBhdGNoJywge1xuICAgICAgICAgICAgdGV4dDogdCgnRHVlIHRvIGEgYnVnLCB0aGUgbW9kIGxpbWl0IHBhdGNoIHdhcyBub3QgYXBwbGllZCBjb3JyZWN0bHkuICdcbiAgICAgICAgICAgICAgICAgICAgICsgJ1BsZWFzZSBVbmluc3RhbGwvUmVtb3ZlIHlvdXIgZXhpc3RpbmcgbW9kIGxpbWl0IG1hdGNoIG1vZCBlbnRyeSBpbiAnXG4gICAgICAgICAgICAgICAgICAgICArICd5b3VyIG1vZHMgcGFnZSBhbmQgcmUtYXBwbHkgdGhlIHBhdGNoIHVzaW5nIHRoZSBcIkFwcGx5IE1vZCBMaW1pdCBQYXRjaFwiICdcbiAgICAgICAgICAgICAgICAgICAgICsgJ2J1dHRvbi4nKSxcbiAgICAgICAgICB9LCBbXG4gICAgICAgICAgICB7IGxhYmVsOiAnQ2xvc2UnIH0sXG4gICAgICAgICAgXSk7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF0sXG4gIH0pO1xuXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbn1cbiJdfQ==