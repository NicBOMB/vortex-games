"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModLimitPatcher = void 0;
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const actions_1 = require("./actions");
const common_1 = require("./common");
const RANGE_START = 0xB94000;
const RANGE_END = 0xB98000;
const UNPATCHED_SEQ = [0xBA, 0xC0, 0x00, 0x00, 0x00, 0x48, 0x8D, 0x4B];
const PATCHED_SEQ = [0xBA, 0xF4, 0x01, 0x00, 0x00, 0x48, 0x8D, 0x4B];
const OFFSET = 65536;
class ModLimitPatcher {
    constructor(api) {
        this.mApi = api;
        this.mIsPatched = false;
    }
    async ensureModLimitPatch() {
        const state = this.mApi.getState();
        const game = vortex_api_1.selectors.gameById(state, common_1.GAME_ID);
        const discovery = state.settings.gameMode.discovered[common_1.GAME_ID];
        if (!discovery?.path) {
            throw new vortex_api_1.util.ProcessCanceled('Game is not discovered');
        }
        await this.queryPatch();
        const stagingPath = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
        const modName = 'Mod Limit Patcher';
        let mod = state?.persistent?.mods?.[common_1.GAME_ID]?.[modName];
        if (mod === undefined) {
            try {
                await this.createModLimitPatchMod(modName);
                mod = this.mApi.getState()?.persistent?.mods?.[common_1.GAME_ID]?.[modName];
            }
            catch (err) {
                return Promise.reject(err);
            }
        }
        try {
            const src = path_1.default.join(discovery.path, game.executable);
            const dest = path_1.default.join(stagingPath, mod.installationPath, game.executable);
            await vortex_api_1.fs.removeAsync(dest)
                .catch(err => ['ENOENT'].includes(err.code) ? Promise.resolve() : Promise.reject(err));
            await vortex_api_1.fs.copyAsync(src, dest);
            const tempFile = dest + '.tmp';
            await this.streamExecutable(RANGE_START, RANGE_END, dest, tempFile);
            await vortex_api_1.fs.removeAsync(dest);
            await vortex_api_1.fs.renameAsync(tempFile, dest);
            this.mApi.sendNotification({
                message: 'Patch generated successfully',
                type: 'success',
                displayMS: 5000,
            });
        }
        catch (err) {
            const allowReport = !(err instanceof vortex_api_1.util.UserCanceled);
            this.mApi.showErrorNotification('Failed to generate mod limit patch', err, { allowReport });
            this.mApi.events.emit('remove-mod', common_1.GAME_ID, modName);
            return Promise.resolve(undefined);
        }
        return Promise.resolve(modName);
    }
    getLimitText(t) {
        return t('Witcher 3 is restricted to 192 file handles which is quickly reached when '
            + 'adding mods (about ~25 mods) - Vortex has detected that the current mods environment may be '
            + 'breaching this limit; this issue will usually exhibit itself by the game failing to start up.{{bl}}'
            + 'Vortex can attempt to patch your game executable to increase the available file handles to 500 '
            + 'which should cater for most if not all modding environments.{{bl}}Please note - the patch is applied as '
            + 'a mod which will be generated and automatically enabled; to disable the patch, simply remove or disable '
            + 'the "Witcher 3 Mod Limit Patcher" mod and the original game executable will be restored.', { ns: common_1.I18N_NAMESPACE, replace: { bl: '[br][/br][br][/br]', br: '[br][/br]' } });
    }
    async queryPatch() {
        const t = this.mApi.translate;
        const message = this.getLimitText(t);
        const res = await this.mApi.showDialog('question', 'Mod Limit Patch', {
            bbcode: message,
            checkboxes: [
                { id: 'suppress-limit-patcher-test', text: 'Do not ask again', value: false }
            ],
        }, [
            { label: 'Cancel' },
            { label: 'Generate Patch' },
        ]);
        if (res.input['suppress-limit-patcher-test'] === true) {
            this.mApi.store.dispatch((0, actions_1.setSuppressModLimitPatch)(true));
        }
        if (res.action === 'Cancel') {
            throw new vortex_api_1.util.UserCanceled();
        }
        return Promise.resolve();
    }
    createModLimitPatchMod(modName) {
        const mod = {
            id: modName,
            state: 'installed',
            attributes: {
                name: 'Mod Limit Patcher',
                description: 'Witcher 3 is restricted to 192 file handles which is quickly reached when '
                    + 'adding mods (about ~25 mods) - this mod increases the limit to 500',
                logicalFileName: 'Witcher 3 Mod Limit Patcher',
                modId: 42,
                version: '1.0.0',
                installTime: new Date(),
            },
            installationPath: modName,
            type: 'w3modlimitpatcher',
        };
        return new Promise((resolve, reject) => {
            this.mApi.events.emit('create-mod', common_1.GAME_ID, mod, async (error) => {
                if (error !== null) {
                    return reject(error);
                }
                const profileId = vortex_api_1.selectors.lastActiveProfileForGame(this.mApi.getState(), common_1.GAME_ID);
                this.mApi.store.dispatch(vortex_api_1.actions.setModEnabled(profileId, modName, true));
                return resolve();
            });
        });
    }
    hasSequence(sequence, chunk) {
        const firstSeqByte = sequence[0];
        let foundSeq = false;
        let iter = 0;
        while (iter < chunk.length) {
            if (!foundSeq && chunk[iter] === firstSeqByte) {
                const subArray = lodash_1.default.cloneDeep(Array.from(chunk.slice(iter, iter + sequence.length)));
                foundSeq = lodash_1.default.isEqual(sequence, Buffer.from(subArray));
            }
            iter++;
        }
        return foundSeq;
    }
    patchChunk(chunk) {
        const idx = chunk.indexOf(Buffer.from(UNPATCHED_SEQ));
        const patchedBuffer = Buffer.from(PATCHED_SEQ);
        const data = Buffer.alloc(chunk.length);
        data.fill(chunk.slice(0, idx), 0, idx);
        data.fill(patchedBuffer, idx, idx + patchedBuffer.length);
        data.fill(chunk.slice(idx + patchedBuffer.length), idx + patchedBuffer.length);
        return data;
    }
    async streamExecutable(start, end, filePath, tempPath) {
        return new Promise((resolve, reject) => {
            const writer = vortex_api_1.fs.createWriteStream(tempPath);
            const stream = vortex_api_1.fs.createReadStream(filePath);
            const unpatched = Buffer.from(UNPATCHED_SEQ);
            const patched = Buffer.from(PATCHED_SEQ);
            const onError = (err) => {
                this.mIsPatched = false;
                writer.end();
                if (!stream.destroyed) {
                    stream.close();
                }
                return reject(err);
            };
            stream.on('end', () => {
                this.mIsPatched = false;
                writer.end();
                return resolve();
            });
            stream.on('error', onError);
            stream.on('data', ((chunk) => {
                if (this.mIsPatched || (stream.bytesRead + OFFSET) < start || stream.bytesRead > end + OFFSET) {
                    writer.write(chunk);
                }
                else {
                    if (this.hasSequence(unpatched, chunk)) {
                        const patchedBuffer = this.patchChunk(chunk);
                        writer.write(patchedBuffer);
                        this.mIsPatched = true;
                    }
                    else if (this.hasSequence(patched, chunk)) {
                        this.mIsPatched = true;
                        writer.write(chunk);
                    }
                    else {
                        writer.write(chunk);
                    }
                }
            }));
        });
    }
}
exports.ModLimitPatcher = ModLimitPatcher;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kTGltaXRQYXRjaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1vZExpbWl0UGF0Y2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsb0RBQXVCO0FBQ3ZCLGdEQUF3QjtBQUN4QiwyQ0FBaUU7QUFFakUsdUNBQXFEO0FBRXJELHFDQUFtRDtBQUVuRCxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUM7QUFDN0IsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDO0FBRTNCLE1BQU0sYUFBYSxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3ZFLE1BQU0sV0FBVyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBRXJFLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQztBQUVyQixNQUFhLGVBQWU7SUFJMUIsWUFBWSxHQUF3QjtRQUNsQyxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztRQUNoQixJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztJQUMxQixDQUFDO0lBRU0sS0FBSyxDQUFDLG1CQUFtQjtRQUM5QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ25DLE1BQU0sSUFBSSxHQUFzQixzQkFBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1FBQ25FLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxnQkFBTyxDQUFDLENBQUM7UUFDOUQsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUU7WUFDcEIsTUFBTSxJQUFJLGlCQUFJLENBQUMsZUFB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QyxDQUFDLEtBQWEsRUFBRSxFQUFFO2dCQUNuQyxJQUFJLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxHQUFHLEtBQUssSUFBSSxNQUFNLENBQUMsU0FBUyxHQUFHLEdBQUcsR0FBRyxNQUFNLEVBQUU7b0JBQzdGLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7aUJBQ3JCO3FCQUFNO29CQUNMLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLEVBQUU7d0JBQ3RDLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQzdDLE1BQU0sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7d0JBQzVCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO3FCQUN4Qjt5QkFBTSxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxFQUFFO3dCQUUzQyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQzt3QkFDdkIsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztxQkFDckI7eUJBQU07d0JBQ0wsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztxQkFDckI7aUJBQ0Y7WUFDSCxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ04sQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF0TEQsMENBc0xDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgYWN0aW9ucywgZnMsIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IHsgc2V0U3VwcHJlc3NNb2RMaW1pdFBhdGNoIH0gZnJvbSAnLi9hY3Rpb25zJztcblxuaW1wb3J0IHsgR0FNRV9JRCwgSTE4Tl9OQU1FU1BBQ0UgfSBmcm9tICcuL2NvbW1vbic7XG5cbmNvbnN0IFJBTkdFX1NUQVJUID0gMHhCOTQwMDA7XG5jb25zdCBSQU5HRV9FTkQgPSAweEI5ODAwMDtcblxuY29uc3QgVU5QQVRDSEVEX1NFUSA9IFsweEJBLCAweEMwLCAweDAwLCAweDAwLCAweDAwLCAweDQ4LCAweDhELCAweDRCXTtcbmNvbnN0IFBBVENIRURfU0VRID0gWzB4QkEsIDB4RjQsIDB4MDEsIDB4MDAsIDB4MDAsIDB4NDgsIDB4OEQsIDB4NEJdO1xuXG5jb25zdCBPRkZTRVQgPSA2NTUzNjtcblxuZXhwb3J0IGNsYXNzIE1vZExpbWl0UGF0Y2hlciB7XG4gIHByaXZhdGUgbUFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcbiAgcHJpdmF0ZSBtSXNQYXRjaGVkOiBib29sZWFuO1xuXG4gIGNvbnN0cnVjdG9yKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xuICAgIHRoaXMubUFwaSA9IGFwaTtcbiAgICB0aGlzLm1Jc1BhdGNoZWQgPSBmYWxzZTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBlbnN1cmVNb2RMaW1pdFBhdGNoKCkge1xuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5tQXBpLmdldFN0YXRlKCk7XG4gICAgY29uc3QgZ2FtZTogdHlwZXMuSUdhbWVTdG9yZWQgPSBzZWxlY3RvcnMuZ2FtZUJ5SWQoc3RhdGUsIEdBTUVfSUQpO1xuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHN0YXRlLnNldHRpbmdzLmdhbWVNb2RlLmRpc2NvdmVyZWRbR0FNRV9JRF07XG4gICAgaWYgKCFkaXNjb3Zlcnk/LnBhdGgpIHtcbiAgICAgIHRocm93IG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnR2FtZSBpcyBub3QgZGlzY292ZXJlZCcpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLnF1ZXJ5UGF0Y2goKTtcbiAgICBjb25zdCBzdGFnaW5nUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICAgIGNvbnN0IG1vZE5hbWUgPSAnTW9kIExpbWl0IFBhdGNoZXInO1xuICAgIGxldCBtb2QgPSBzdGF0ZT8ucGVyc2lzdGVudD8ubW9kcz8uW0dBTUVfSURdPy5bbW9kTmFtZV07XG4gICAgaWYgKG1vZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCB0aGlzLmNyZWF0ZU1vZExpbWl0UGF0Y2hNb2QobW9kTmFtZSk7XG4gICAgICAgIG1vZCA9IHRoaXMubUFwaS5nZXRTdGF0ZSgpPy5wZXJzaXN0ZW50Py5tb2RzPy5bR0FNRV9JRF0/Llttb2ROYW1lXTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHNyYyA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgZ2FtZS5leGVjdXRhYmxlKTtcbiAgICAgIGNvbnN0IGRlc3QgPSBwYXRoLmpvaW4oc3RhZ2luZ1BhdGgsIG1vZC5pbnN0YWxsYXRpb25QYXRoLCBnYW1lLmV4ZWN1dGFibGUpO1xuICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZGVzdClcbiAgICAgICAgLmNhdGNoKGVyciA9PiBbJ0VOT0VOVCddLmluY2x1ZGVzKGVyci5jb2RlKSA/IFByb21pc2UucmVzb2x2ZSgpIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XG4gICAgICBhd2FpdCBmcy5jb3B5QXN5bmMoc3JjLCBkZXN0KTtcbiAgICAgIGNvbnN0IHRlbXBGaWxlID0gZGVzdCArICcudG1wJztcbiAgICAgIGF3YWl0IHRoaXMuc3RyZWFtRXhlY3V0YWJsZShSQU5HRV9TVEFSVCwgUkFOR0VfRU5ELCBkZXN0LCB0ZW1wRmlsZSk7XG4gICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhkZXN0KTtcbiAgICAgIGF3YWl0IGZzLnJlbmFtZUFzeW5jKHRlbXBGaWxlLCBkZXN0KTtcbiAgICAgIHRoaXMubUFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICAgICAgbWVzc2FnZTogJ1BhdGNoIGdlbmVyYXRlZCBzdWNjZXNzZnVsbHknLFxuICAgICAgICB0eXBlOiAnc3VjY2VzcycsXG4gICAgICAgIGRpc3BsYXlNUzogNTAwMCxcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc3QgYWxsb3dSZXBvcnQgPSAhKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKVxuICAgICAgdGhpcy5tQXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGdlbmVyYXRlIG1vZCBsaW1pdCBwYXRjaCcsIGVyciwgeyBhbGxvd1JlcG9ydCB9KTtcbiAgICAgIHRoaXMubUFwaS5ldmVudHMuZW1pdCgncmVtb3ZlLW1vZCcsIEdBTUVfSUQsIG1vZE5hbWUpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgIH1cblxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobW9kTmFtZSk7XG4gIH1cblxuICBwdWJsaWMgZ2V0TGltaXRUZXh0KHQ6IGFueSkge1xuICAgIHJldHVybiB0KCdXaXRjaGVyIDMgaXMgcmVzdHJpY3RlZCB0byAxOTIgZmlsZSBoYW5kbGVzIHdoaWNoIGlzIHF1aWNrbHkgcmVhY2hlZCB3aGVuICdcbiAgICAgICsgJ2FkZGluZyBtb2RzIChhYm91dCB+MjUgbW9kcykgLSBWb3J0ZXggaGFzIGRldGVjdGVkIHRoYXQgdGhlIGN1cnJlbnQgbW9kcyBlbnZpcm9ubWVudCBtYXkgYmUgJ1xuICAgICAgKyAnYnJlYWNoaW5nIHRoaXMgbGltaXQ7IHRoaXMgaXNzdWUgd2lsbCB1c3VhbGx5IGV4aGliaXQgaXRzZWxmIGJ5IHRoZSBnYW1lIGZhaWxpbmcgdG8gc3RhcnQgdXAue3tibH19J1xuICAgICAgKyAnVm9ydGV4IGNhbiBhdHRlbXB0IHRvIHBhdGNoIHlvdXIgZ2FtZSBleGVjdXRhYmxlIHRvIGluY3JlYXNlIHRoZSBhdmFpbGFibGUgZmlsZSBoYW5kbGVzIHRvIDUwMCAnXG4gICAgICArICd3aGljaCBzaG91bGQgY2F0ZXIgZm9yIG1vc3QgaWYgbm90IGFsbCBtb2RkaW5nIGVudmlyb25tZW50cy57e2JsfX1QbGVhc2Ugbm90ZSAtIHRoZSBwYXRjaCBpcyBhcHBsaWVkIGFzICdcbiAgICAgICsgJ2EgbW9kIHdoaWNoIHdpbGwgYmUgZ2VuZXJhdGVkIGFuZCBhdXRvbWF0aWNhbGx5IGVuYWJsZWQ7IHRvIGRpc2FibGUgdGhlIHBhdGNoLCBzaW1wbHkgcmVtb3ZlIG9yIGRpc2FibGUgJ1xuICAgICAgKyAndGhlIFwiV2l0Y2hlciAzIE1vZCBMaW1pdCBQYXRjaGVyXCIgbW9kIGFuZCB0aGUgb3JpZ2luYWwgZ2FtZSBleGVjdXRhYmxlIHdpbGwgYmUgcmVzdG9yZWQuJyxcbiAgICAgIHsgbnM6IEkxOE5fTkFNRVNQQUNFLCByZXBsYWNlOiB7IGJsOiAnW2JyXVsvYnJdW2JyXVsvYnJdJywgYnI6ICdbYnJdWy9icl0nIH0gfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHF1ZXJ5UGF0Y2goKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgdCA9IHRoaXMubUFwaS50cmFuc2xhdGU7XG4gICAgY29uc3QgbWVzc2FnZSA9IHRoaXMuZ2V0TGltaXRUZXh0KHQpO1xuICAgIGNvbnN0IHJlczogdHlwZXMuSURpYWxvZ1Jlc3VsdCA9IGF3YWl0ICh0aGlzLm1BcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnTW9kIExpbWl0IFBhdGNoJywge1xuICAgICAgYmJjb2RlOiBtZXNzYWdlLFxuICAgICAgY2hlY2tib3hlczogW1xuICAgICAgICB7IGlkOiAnc3VwcHJlc3MtbGltaXQtcGF0Y2hlci10ZXN0JywgdGV4dDogJ0RvIG5vdCBhc2sgYWdhaW4nLCB2YWx1ZTogZmFsc2UgfVxuICAgICAgXSxcbiAgICB9LCBbXG4gICAgICB7IGxhYmVsOiAnQ2FuY2VsJyB9LFxuICAgICAgeyBsYWJlbDogJ0dlbmVyYXRlIFBhdGNoJyB9LFxuICAgIF0pIGFzIGFueSk7XG4gICAgaWYgKHJlcy5pbnB1dFsnc3VwcHJlc3MtbGltaXQtcGF0Y2hlci10ZXN0J10gPT09IHRydWUpIHtcbiAgICAgIHRoaXMubUFwaS5zdG9yZS5kaXNwYXRjaChzZXRTdXBwcmVzc01vZExpbWl0UGF0Y2godHJ1ZSkpO1xuICAgIH1cbiAgICBpZiAocmVzLmFjdGlvbiA9PT0gJ0NhbmNlbCcpIHtcbiAgICAgIHRocm93IG5ldyB1dGlsLlVzZXJDYW5jZWxlZCgpO1xuICAgIH1cblxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlTW9kTGltaXRQYXRjaE1vZChtb2ROYW1lOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtb2QgPSB7XG4gICAgICBpZDogbW9kTmFtZSxcbiAgICAgIHN0YXRlOiAnaW5zdGFsbGVkJyxcbiAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgbmFtZTogJ01vZCBMaW1pdCBQYXRjaGVyJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdXaXRjaGVyIDMgaXMgcmVzdHJpY3RlZCB0byAxOTIgZmlsZSBoYW5kbGVzIHdoaWNoIGlzIHF1aWNrbHkgcmVhY2hlZCB3aGVuICdcbiAgICAgICAgICAgICAgICAgICArICdhZGRpbmcgbW9kcyAoYWJvdXQgfjI1IG1vZHMpIC0gdGhpcyBtb2QgaW5jcmVhc2VzIHRoZSBsaW1pdCB0byA1MDAnLFxuICAgICAgICBsb2dpY2FsRmlsZU5hbWU6ICdXaXRjaGVyIDMgTW9kIExpbWl0IFBhdGNoZXInLFxuICAgICAgICBtb2RJZDogNDIsIC8vIE1lYW5pbmcgb2YgbGlmZVxuICAgICAgICB2ZXJzaW9uOiAnMS4wLjAnLFxuICAgICAgICBpbnN0YWxsVGltZTogbmV3IERhdGUoKSxcbiAgICAgIH0sXG4gICAgICBpbnN0YWxsYXRpb25QYXRoOiBtb2ROYW1lLFxuICAgICAgdHlwZTogJ3czbW9kbGltaXRwYXRjaGVyJyxcbiAgICB9O1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHRoaXMubUFwaS5ldmVudHMuZW1pdCgnY3JlYXRlLW1vZCcsIEdBTUVfSUQsIG1vZCwgYXN5bmMgKGVycm9yKSA9PiB7XG4gICAgICAgIGlmIChlcnJvciAhPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiByZWplY3QoZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUodGhpcy5tQXBpLmdldFN0YXRlKCksIEdBTUVfSUQpO1xuICAgICAgICB0aGlzLm1BcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RFbmFibGVkKHByb2ZpbGVJZCwgbW9kTmFtZSwgdHJ1ZSkpO1xuICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGhhc1NlcXVlbmNlKHNlcXVlbmNlOiBCdWZmZXIsIGNodW5rOiBCdWZmZXIpIHtcbiAgICBjb25zdCBmaXJzdFNlcUJ5dGUgPSBzZXF1ZW5jZVswXTtcbiAgICBsZXQgZm91bmRTZXEgPSBmYWxzZTtcbiAgICBsZXQgaXRlciA9IDA7XG4gICAgd2hpbGUgKGl0ZXIgPCBjaHVuay5sZW5ndGgpIHtcbiAgICAgIGlmICghZm91bmRTZXEgJiYgY2h1bmtbaXRlcl0gPT09IGZpcnN0U2VxQnl0ZSkge1xuICAgICAgICBjb25zdCBzdWJBcnJheSA9IF8uY2xvbmVEZWVwKEFycmF5LmZyb20oY2h1bmsuc2xpY2UoaXRlciwgaXRlciArIHNlcXVlbmNlLmxlbmd0aCkpKTtcbiAgICAgICAgZm91bmRTZXEgPSBfLmlzRXF1YWwoc2VxdWVuY2UsIEJ1ZmZlci5mcm9tKHN1YkFycmF5KSk7XG4gICAgICB9XG4gICAgICBpdGVyKys7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZvdW5kU2VxO1xuICB9XG5cbiAgcHJpdmF0ZSBwYXRjaENodW5rKGNodW5rOiBCdWZmZXIpOiBCdWZmZXIge1xuICAgIGNvbnN0IGlkeCA9IGNodW5rLmluZGV4T2YoQnVmZmVyLmZyb20oVU5QQVRDSEVEX1NFUSkpO1xuICAgIGNvbnN0IHBhdGNoZWRCdWZmZXIgPSBCdWZmZXIuZnJvbShQQVRDSEVEX1NFUSk7XG4gICAgY29uc3QgZGF0YSA9IEJ1ZmZlci5hbGxvYyhjaHVuay5sZW5ndGgpO1xuICAgIGRhdGEuZmlsbChjaHVuay5zbGljZSgwLCBpZHgpLCAwLCBpZHgpO1xuICAgIGRhdGEuZmlsbChwYXRjaGVkQnVmZmVyLCBpZHgsIGlkeCArIHBhdGNoZWRCdWZmZXIubGVuZ3RoKTtcbiAgICBkYXRhLmZpbGwoY2h1bmsuc2xpY2UoaWR4ICsgcGF0Y2hlZEJ1ZmZlci5sZW5ndGgpLCBpZHggKyBwYXRjaGVkQnVmZmVyLmxlbmd0aCk7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHN0cmVhbUV4ZWN1dGFibGUoc3RhcnQ6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZDogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZVBhdGg6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3Qgd3JpdGVyID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0odGVtcFBhdGgpO1xuICAgICAgY29uc3Qgc3RyZWFtID0gZnMuY3JlYXRlUmVhZFN0cmVhbShmaWxlUGF0aCk7XG4gICAgICBjb25zdCB1bnBhdGNoZWQgPSBCdWZmZXIuZnJvbShVTlBBVENIRURfU0VRKTtcbiAgICAgIGNvbnN0IHBhdGNoZWQgPSBCdWZmZXIuZnJvbShQQVRDSEVEX1NFUSk7XG4gICAgICBjb25zdCBvbkVycm9yID0gKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgdGhpcy5tSXNQYXRjaGVkID0gZmFsc2U7XG4gICAgICAgIHdyaXRlci5lbmQoKTtcbiAgICAgICAgaWYgKCFzdHJlYW0uZGVzdHJveWVkKSB7XG4gICAgICAgICAgc3RyZWFtLmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xuICAgICAgfTtcbiAgICAgIHN0cmVhbS5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICB0aGlzLm1Jc1BhdGNoZWQgPSBmYWxzZTtcbiAgICAgICAgd3JpdGVyLmVuZCgpO1xuICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xuICAgICAgfSk7XG4gICAgICBzdHJlYW0ub24oJ2Vycm9yJywgb25FcnJvcik7XG4gICAgICBzdHJlYW0ub24oJ2RhdGEnLCAoKGNodW5rOiBCdWZmZXIpID0+IHtcbiAgICAgICAgaWYgKHRoaXMubUlzUGF0Y2hlZCB8fCAoc3RyZWFtLmJ5dGVzUmVhZCArIE9GRlNFVCkgPCBzdGFydCB8fCBzdHJlYW0uYnl0ZXNSZWFkID4gZW5kICsgT0ZGU0VUKSB7XG4gICAgICAgICAgd3JpdGVyLndyaXRlKGNodW5rKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAodGhpcy5oYXNTZXF1ZW5jZSh1bnBhdGNoZWQsIGNodW5rKSkge1xuICAgICAgICAgICAgY29uc3QgcGF0Y2hlZEJ1ZmZlciA9IHRoaXMucGF0Y2hDaHVuayhjaHVuayk7XG4gICAgICAgICAgICB3cml0ZXIud3JpdGUocGF0Y2hlZEJ1ZmZlcik7XG4gICAgICAgICAgICB0aGlzLm1Jc1BhdGNoZWQgPSB0cnVlO1xuICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5oYXNTZXF1ZW5jZShwYXRjaGVkLCBjaHVuaykpIHtcbiAgICAgICAgICAgIC8vIGV4ZWMgaXMgYWxyZWFkeSBwYXRjaGVkLlxuICAgICAgICAgICAgdGhpcy5tSXNQYXRjaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHdyaXRlci53cml0ZShjaHVuayk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHdyaXRlci53cml0ZShjaHVuayk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KSk7XG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==