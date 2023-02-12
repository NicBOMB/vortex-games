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
Object.defineProperty(exports, "__esModule", { value: true });
const https = __importStar(require("https"));
const semver = __importStar(require("semver"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const constants_1 = require("./constants");
const util_1 = require("./util");
const SMAPI_HOST = 'smapi.io';
class SMAPIProxy {
    constructor(api) {
        this.mAPI = api;
        this.mOptions = {
            host: SMAPI_HOST,
            method: 'POST',
            protocol: 'https:',
            path: '/api/v3.0/mods',
            headers: {
                'Content-Type': 'application/json',
            },
        };
    }
    async find(query) {
        if (query.name !== undefined) {
            const res = await this.findByNames([{ id: query.name }]);
            if ((res.length === 0) || (res[0].metadata?.main === undefined)) {
                return [];
            }
            const key = this.makeKey(query);
            if (res[0].metadata.nexusID !== undefined) {
                return await this.lookupOnNexus(query, res[0].metadata.nexusID, res[0].metadata.main.version);
            }
            else {
                return [
                    { key, value: {
                            gameId: common_1.GAME_ID,
                            fileMD5: undefined,
                            fileName: query.name,
                            fileSizeBytes: 0,
                            fileVersion: '',
                            sourceURI: res[0].metadata.main?.url,
                        } },
                ];
            }
        }
        else {
            return [];
        }
    }
    async findByNames(query) {
        return new Promise((resolve, reject) => {
            const req = https.request(this.mOptions, res => {
                let body = Buffer.from([]);
                res
                    .on('error', err => reject(err))
                    .on('data', chunk => {
                    body = Buffer.concat([body, chunk]);
                })
                    .on('end', () => {
                    const textual = body.toString('utf8');
                    try {
                        const parsed = JSON.parse(textual);
                        resolve(parsed);
                    }
                    catch (err) {
                        (0, vortex_api_1.log)('error', 'failed to parse smapi response', textual);
                        reject(err);
                    }
                });
            })
                .on('error', err => reject(err));
            req.write(JSON.stringify({
                mods: query,
                includeExtendedMetadata: true,
                apiVersion: constants_1.SMAPI_IO_API_VERSION,
            }));
            req.end();
        });
    }
    makeKey(query) {
        return `smapio:${query.name}:${query.versionMatch}`;
    }
    async lookupOnNexus(query, nexusId, version) {
        await this.mAPI.ext.ensureLoggedIn();
        const files = await this.mAPI.ext.nexusGetModFiles?.(common_1.GAME_ID, nexusId) ?? [];
        const versionPattern = `>=${version}`;
        const file = files
            .filter(iter => semver.satisfies((0, util_1.coerce)(iter.version), versionPattern))
            .sort((lhs, rhs) => (0, util_1.semverCompare)(rhs.version, lhs.version))[0];
        if (file === undefined) {
            throw new Error('no file found');
        }
        return [{
                key: this.makeKey(query),
                value: {
                    fileMD5: undefined,
                    fileName: file.file_name,
                    fileSizeBytes: file.size * 1024,
                    fileVersion: file.version,
                    gameId: common_1.GAME_ID,
                    sourceURI: `nxm://${common_1.GAME_ID}/mods/${nexusId}/files/${file.file_id}`,
                    logicalFileName: query.name.toLowerCase(),
                    source: 'nexus',
                    domainName: common_1.GAME_ID,
                    details: {
                        category: file.category_id.toString(),
                        description: file.description,
                        modId: nexusId.toString(),
                        fileId: file.file_id.toString(),
                    }
                },
            }];
    }
}
exports.default = SMAPIProxy;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic21hcGlQcm94eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNtYXBpUHJveHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLDZDQUErQjtBQUUvQiwrQ0FBaUM7QUFDakMsMkNBQXdDO0FBQ3hDLHFDQUFtQztBQUNuQywyQ0FBbUQ7QUFFbkQsaUNBQStDO0FBRS9DLE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQztBQUU5QixNQUFNLFVBQVU7SUFHZCxZQUFZLEdBQXdCO1FBQ2xDLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1FBQ2hCLElBQUksQ0FBQyxRQUFRLEdBQUc7WUFDZCxJQUFJLEVBQUUsVUFBVTtZQUNoQixNQUFNLEVBQUUsTUFBTTtZQUNkLFFBQVEsRUFBRSxRQUFRO1lBQ2xCLElBQUksRUFBRSxnQkFBZ0I7WUFDdEIsT0FBTyxFQUFFO2dCQUNQLGNBQWMsRUFBRSxrQkFBa0I7YUFDbkM7U0FDRixDQUFDO0lBQ0osQ0FBQztJQUVNLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBYTtRQUM3QixJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUFFO1lBQzVCLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLElBQUksS0FBSyxTQUFTLENBQUMsRUFBRTtnQkFDL0QsT0FBTyxFQUFFLENBQUM7YUFDWDtZQUNELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDaEMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8s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Q0FBQyxXQUFXO3dCQUM3QixLQUFLLEVBQUUsT0FBTyxDQUFDLFFBQVEsRUFBRTt3QkFDekIsTUFBTSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFO3FCQUNoQztpQkFDRjthQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQUVELGtCQUFlLFVBQVUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IElGaWxlSW5mbyB9IGZyb20gJ0BuZXh1c21vZHMvbmV4dXMtYXBpJztcbmltcG9ydCAqIGFzIGh0dHBzIGZyb20gJ2h0dHBzJztcbmltcG9ydCB7IElMb29rdXBSZXN1bHQsIElRdWVyeSB9IGZyb20gJ21vZG1ldGEtZGInO1xuaW1wb3J0ICogYXMgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgeyBsb2csIHR5cGVzIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0IHsgU01BUElfSU9fQVBJX1ZFUlNJT04gfSBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgeyBJU01BUElJT1F1ZXJ5LCBJU01BUElSZXN1bHQgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IGNvZXJjZSwgc2VtdmVyQ29tcGFyZSB9IGZyb20gJy4vdXRpbCc7XG5cbmNvbnN0IFNNQVBJX0hPU1QgPSAnc21hcGkuaW8nO1xuXG5jbGFzcyBTTUFQSVByb3h5IHtcbiAgcHJpdmF0ZSBtQVBJOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xuICBwcml2YXRlIG1PcHRpb25zOiBodHRwcy5SZXF1ZXN0T3B0aW9ucztcbiAgY29uc3RydWN0b3IoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XG4gICAgdGhpcy5tQVBJID0gYXBpO1xuICAgIHRoaXMubU9wdGlvbnMgPSB7XG4gICAgICBob3N0OiBTTUFQSV9IT1NULFxuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBwcm90b2NvbDogJ2h0dHBzOicsXG4gICAgICBwYXRoOiAnL2FwaS92My4wL21vZHMnLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgcHVibGljIGFzeW5jIGZpbmQocXVlcnk6IElRdWVyeSk6IFByb21pc2U8SUxvb2t1cFJlc3VsdFtdPiB7XG4gICAgaWYgKHF1ZXJ5Lm5hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy5maW5kQnlOYW1lcyhbeyBpZDogcXVlcnkubmFtZSB9XSk7XG4gICAgICBpZiAoKHJlcy5sZW5ndGggPT09IDApIHx8IChyZXNbMF0ubWV0YWRhdGE/Lm1haW4gPT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgfVxuICAgICAgY29uc3Qga2V5ID0gdGhpcy5tYWtlS2V5KHF1ZXJ5KTtcbiAgICAgIGlmIChyZXNbMF0ubWV0YWRhdGEubmV4dXNJRCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmxvb2t1cE9uTmV4dXMoXG4gICAgICAgICAgcXVlcnksIHJlc1swXS5tZXRhZGF0YS5uZXh1c0lELCByZXNbMF0ubWV0YWRhdGEubWFpbi52ZXJzaW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgeyBrZXksIHZhbHVlOiB7XG4gICAgICAgICAgICBnYW1lSWQ6IEdBTUVfSUQsXG4gICAgICAgICAgICBmaWxlTUQ1OiB1bmRlZmluZWQsXG4gICAgICAgICAgICBmaWxlTmFtZTogcXVlcnkubmFtZSxcbiAgICAgICAgICAgIGZpbGVTaXplQnl0ZXM6IDAsXG4gICAgICAgICAgICBmaWxlVmVyc2lvbjogJycsXG4gICAgICAgICAgICBzb3VyY2VVUkk6IHJlc1swXS5tZXRhZGF0YS5tYWluPy51cmwsXG4gICAgICAgICAgfSB9LFxuICAgICAgICBdO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICB9XG5cbiAgcHVibGljIGFzeW5jIGZpbmRCeU5hbWVzKHF1ZXJ5OiBJU01BUElJT1F1ZXJ5W10pOiBQcm9taXNlPElTTUFQSVJlc3VsdFtdPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHJlcSA9IGh0dHBzLnJlcXVlc3QodGhpcy5tT3B0aW9ucywgcmVzID0+IHtcbiAgICAgICAgbGV0IGJvZHkgPSBCdWZmZXIuZnJvbShbXSk7XG4gICAgICAgIHJlc1xuICAgICAgICAgIC5vbignZXJyb3InLCBlcnIgPT4gcmVqZWN0KGVycikpXG4gICAgICAgICAgLm9uKCdkYXRhJywgY2h1bmsgPT4ge1xuICAgICAgICAgICAgYm9keSA9IEJ1ZmZlci5jb25jYXQoW2JvZHksIGNodW5rXSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAub24oJ2VuZCcsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRleHR1YWwgPSBib2R5LnRvU3RyaW5nKCd1dGY4Jyk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKHRleHR1YWwpO1xuICAgICAgICAgICAgICByZXNvbHZlKHBhcnNlZCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gcGFyc2Ugc21hcGkgcmVzcG9uc2UnLCB0ZXh0dWFsKTtcbiAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgICAub24oJ2Vycm9yJywgZXJyID0+IHJlamVjdChlcnIpKVxuICAgICAgcmVxLndyaXRlKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgbW9kczogcXVlcnksXG4gICAgICAgIGluY2x1ZGVFeHRlbmRlZE1ldGFkYXRhOiB0cnVlLFxuICAgICAgICBhcGlWZXJzaW9uOiBTTUFQSV9JT19BUElfVkVSU0lPTixcbiAgICAgIH0pKTtcbiAgICAgIHJlcS5lbmQoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgbWFrZUtleShxdWVyeTogSVF1ZXJ5KTogc3RyaW5nIHtcbiAgICByZXR1cm4gYHNtYXBpbzoke3F1ZXJ5Lm5hbWV9OiR7cXVlcnkudmVyc2lvbk1hdGNofWA7ICAgIFxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBsb29rdXBPbk5leHVzKHF1ZXJ5OiBJUXVlcnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh1c0lkOiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiBzdHJpbmcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFByb21pc2U8SUxvb2t1cFJlc3VsdFtdPiB7XG4gICAgYXdhaXQgdGhpcy5tQVBJLmV4dC5lbnN1cmVMb2dnZWRJbigpO1xuXG4gICAgY29uc3QgZmlsZXM6IElGaWxlSW5mb1tdID0gYXdhaXQgdGhpcy5tQVBJLmV4dC5uZXh1c0dldE1vZEZpbGVzPy4oR0FNRV9JRCwgbmV4dXNJZCkgPz8gW107XG5cbiAgICBjb25zdCB2ZXJzaW9uUGF0dGVybiA9IGA+PSR7dmVyc2lvbn1gO1xuXG4gICAgY29uc3QgZmlsZSA9IGZpbGVzXG4gICAgICAuZmlsdGVyKGl0ZXIgPT4gc2VtdmVyLnNhdGlzZmllcyhjb2VyY2UoaXRlci52ZXJzaW9uKSwgdmVyc2lvblBhdHRlcm4pKVxuICAgICAgLnNvcnQoKGxocywgcmhzKSA9PiBzZW12ZXJDb21wYXJlKHJocy52ZXJzaW9uLCBsaHMudmVyc2lvbikpWzBdO1xuXG4gICAgaWYgKGZpbGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdubyBmaWxlIGZvdW5kJyk7XG4gICAgfVxuICAgIHJldHVybiBbe1xuICAgICAga2V5OiB0aGlzLm1ha2VLZXkocXVlcnkpLFxuICAgICAgdmFsdWU6IHtcbiAgICAgICAgZmlsZU1ENTogdW5kZWZpbmVkLFxuICAgICAgICBmaWxlTmFtZTogZmlsZS5maWxlX25hbWUsXG4gICAgICAgIGZpbGVTaXplQnl0ZXM6IGZpbGUuc2l6ZSAqIDEwMjQsXG4gICAgICAgIGZpbGVWZXJzaW9uOiBmaWxlLnZlcnNpb24sXG4gICAgICAgIGdhbWVJZDogR0FNRV9JRCxcbiAgICAgICAgc291cmNlVVJJOiBgbnhtOi8vJHtHQU1FX0lEfS9tb2RzLyR7bmV4dXNJZH0vZmlsZXMvJHtmaWxlLmZpbGVfaWR9YCxcbiAgICAgICAgbG9naWNhbEZpbGVOYW1lOiBxdWVyeS5uYW1lLnRvTG93ZXJDYXNlKCksXG4gICAgICAgIHNvdXJjZTogJ25leHVzJyxcbiAgICAgICAgZG9tYWluTmFtZTogR0FNRV9JRCxcbiAgICAgICAgZGV0YWlsczoge1xuICAgICAgICAgIGNhdGVnb3J5OiBmaWxlLmNhdGVnb3J5X2lkLnRvU3RyaW5nKCksXG4gICAgICAgICAgZGVzY3JpcHRpb246IGZpbGUuZGVzY3JpcHRpb24sXG4gICAgICAgICAgbW9kSWQ6IG5leHVzSWQudG9TdHJpbmcoKSxcbiAgICAgICAgICBmaWxlSWQ6IGZpbGUuZmlsZV9pZC50b1N0cmluZygpLFxuICAgICAgICB9XG4gICAgICB9LFxuICAgIH1dO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNNQVBJUHJveHk7XG4iXX0=