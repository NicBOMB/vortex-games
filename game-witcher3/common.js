"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DO_NOT_DEPLOY = exports.DO_NOT_DISPLAY = exports.LOCKED_PREFIX = exports.UNI_PATCH = exports.W3_TEMP_DATA_DIR = exports.CONFIG_MATRIX_REL_PATH = exports.I18N_NAMESPACE = exports.LOAD_ORDER_FILENAME = exports.MERGE_INV_MANIFEST = exports.SCRIPT_MERGER_ID = exports.PART_SUFFIX = exports.INPUT_XML_FILENAME = exports.GAME_ID = exports.getPriorityTypeBranch = exports.getLoadOrderFilePath = exports.UNIAPP = exports.getHash = exports.calcHashImpl = exports.ResourceInaccessibleError = exports.MD5ComparisonError = void 0;
const crypto_1 = __importDefault(require("crypto"));
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
class MD5ComparisonError extends Error {
    constructor(message, file) {
        super(message);
        this.mPath = file;
    }
    get affectedFile() {
        return this.mPath;
    }
    get errorMessage() {
        return this.message + ': ' + this.mPath;
    }
}
exports.MD5ComparisonError = MD5ComparisonError;
class ResourceInaccessibleError extends Error {
    constructor(filePath, allowReport = false) {
        super(`"${filePath}" is being manipulated by another process`);
        this.mFilePath = filePath;
        this.mIsReportingAllowed = allowReport;
    }
    get isOneDrive() {
        const segments = this.mFilePath.split(path_1.default.sep)
            .filter(seg => !!seg)
            .map(seg => seg.toLowerCase());
        return segments.includes('onedrive');
    }
    get allowReport() {
        return this.mIsReportingAllowed;
    }
    get errorMessage() {
        return (this.isOneDrive)
            ? this.message + ': ' + 'probably by the OneDrive service.'
            : this.message + ': ' + 'close all applications that may be using this file.';
    }
}
exports.ResourceInaccessibleError = ResourceInaccessibleError;
function calcHashImpl(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto_1.default.createHash('md5');
        const stream = vortex_api_1.fs.createReadStream(filePath);
        stream.on('readable', () => {
            const data = stream.read();
            if (data) {
                hash.update(data);
            }
        });
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
}
exports.calcHashImpl = calcHashImpl;
function getHash(filePath, tries = 3) {
    return calcHashImpl(filePath)
        .catch(err => {
        if (['EMFILE', 'EBADF'].includes(err['code']) && (tries > 0)) {
            return getHash(filePath, tries - 1);
        }
        else {
            return Promise.reject(err);
        }
    });
}
exports.getHash = getHash;
exports.UNIAPP = electron_1.app || electron_1.remote.app;
function getLoadOrderFilePath() {
    return path_1.default.join(exports.UNIAPP.getPath('documents'), 'The Witcher 3', exports.LOAD_ORDER_FILENAME);
}
exports.getLoadOrderFilePath = getLoadOrderFilePath;
function getPriorityTypeBranch() {
    return ['settings', 'witcher3', 'prioritytype'];
}
exports.getPriorityTypeBranch = getPriorityTypeBranch;
exports.GAME_ID = 'witcher3';
exports.INPUT_XML_FILENAME = 'input.xml';
exports.PART_SUFFIX = '.part.txt';
exports.SCRIPT_MERGER_ID = 'W3ScriptMerger';
exports.MERGE_INV_MANIFEST = 'MergeInventory.xml';
exports.LOAD_ORDER_FILENAME = 'mods.settings';
exports.I18N_NAMESPACE = 'game-witcher3';
exports.CONFIG_MATRIX_REL_PATH = path_1.default.join('bin', 'config', 'r4game', 'user_config_matrix', 'pc');
exports.W3_TEMP_DATA_DIR = path_1.default.join(vortex_api_1.util.getVortexPath('temp'), 'W3TempData');
exports.UNI_PATCH = 'mod0000____CompilationTrigger';
exports.LOCKED_PREFIX = 'mod0000_';
exports.DO_NOT_DISPLAY = ['communitypatch-base'];
exports.DO_NOT_DEPLOY = ['readme.txt'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLG9EQUE0QjtBQUM1Qix1Q0FBdUM7QUFDdkMsZ0RBQXdCO0FBQ3hCLDJDQUFzQztBQUN0QyxNQUFhLGtCQUFtQixTQUFRLEtBQUs7SUFFM0MsWUFBWSxPQUFPLEVBQUUsSUFBSTtRQUN2QixLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDZixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztJQUNwQixDQUFDO0lBRUQsSUFBSSxZQUFZO1FBQ2QsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3BCLENBQUM7SUFFRCxJQUFJLFlBQVk7UUFDZCxPQUFPLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDMUMsQ0FBQztDQUNGO0FBZEQsZ0RBY0M7QUFFRCxNQUFhLHlCQUEwQixTQUFRLEtBQUs7SUFHbEQsWUFBWSxRQUFRLEVBQUUsV0FBVyxHQUFHLEtBQUs7UUFDdkMsS0FBSyxDQUFDLElBQUksUUFBUSwyQ0FBMkMsQ0FBQyxDQUFDO1FBQy9ELElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1FBQzFCLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxXQUFXLENBQUM7SUFDekMsQ0FBQztJQUVELElBQUksVUFBVTtRQUNaLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLGNBQUksQ0FBQyxHQUFHLENBQUM7YUFDNUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQzthQUNwQixHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztRQUNqQyxPQUFPLFFBQVEsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVE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QUFFMUYsUUFBQSxnQkFBZ0IsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBRXZFLFFBQUEsU0FBUyxHQUFHLCtCQUErQixDQUFDO0FBQzVDLFFBQUEsYUFBYSxHQUFHLFVBQVUsQ0FBQztBQUUzQixRQUFBLGNBQWMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLENBQUM7QUFDekMsUUFBQSxhQUFhLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjcnlwdG8gZnJvbSAnY3J5cHRvJztcclxuaW1wb3J0IHsgYXBwLCByZW1vdGUgfSBmcm9tICdlbGVjdHJvbic7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBmcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5leHBvcnQgY2xhc3MgTUQ1Q29tcGFyaXNvbkVycm9yIGV4dGVuZHMgRXJyb3Ige1xyXG4gIHByaXZhdGUgbVBhdGg7XHJcbiAgY29uc3RydWN0b3IobWVzc2FnZSwgZmlsZSkge1xyXG4gICAgc3VwZXIobWVzc2FnZSk7XHJcbiAgICB0aGlzLm1QYXRoID0gZmlsZTtcclxuICB9XHJcblxyXG4gIGdldCBhZmZlY3RlZEZpbGUoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5tUGF0aDtcclxuICB9XHJcblxyXG4gIGdldCBlcnJvck1lc3NhZ2UoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5tZXNzYWdlICsgJzogJyArIHRoaXMubVBhdGg7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUmVzb3VyY2VJbmFjY2Vzc2libGVFcnJvciBleHRlbmRzIEVycm9yIHtcclxuICBwcml2YXRlIG1Jc1JlcG9ydGluZ0FsbG93ZWQ7XHJcbiAgcHJpdmF0ZSBtRmlsZVBhdGg7XHJcbiAgY29uc3RydWN0b3IoZmlsZVBhdGgsIGFsbG93UmVwb3J0ID0gZmFsc2UpIHtcclxuICAgIHN1cGVyKGBcIiR7ZmlsZVBhdGh9XCIgaXMgYmVpbmcgbWFuaXB1bGF0ZWQgYnkgYW5vdGhlciBwcm9jZXNzYCk7XHJcbiAgICB0aGlzLm1GaWxlUGF0aCA9IGZpbGVQYXRoO1xyXG4gICAgdGhpcy5tSXNSZXBvcnRpbmdBbGxvd2VkID0gYWxsb3dSZXBvcnQ7XHJcbiAgfVxyXG5cclxuICBnZXQgaXNPbmVEcml2ZSgpIHtcclxuICAgIGNvbnN0IHNlZ21lbnRzID0gdGhpcy5tRmlsZVBhdGguc3BsaXQocGF0aC5zZXApXHJcbiAgICAgIC5maWx0ZXIoc2VnID0+ICEhc2VnKVxyXG4gICAgICAubWFwKHNlZyA9PiBzZWcudG9Mb3dlckNhc2UoKSk7XHJcbiAgICByZXR1cm4gc2VnbWVudHMuaW5jbHVkZXMoJ29uZWRyaXZlJyk7XHJcbiAgfVxyXG5cclxuICBnZXQgYWxsb3dSZXBvcnQoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5tSXNSZXBvcnRpbmdBbGxvd2VkO1xyXG4gIH1cclxuXHJcbiAgZ2V0IGVycm9yTWVzc2FnZSgpIHtcclxuICAgIHJldHVybiAodGhpcy5pc09uZURyaXZlKVxyXG4gICAgICA/IHRoaXMubWVzc2FnZSArICc6ICcgKyAncHJvYmFibHkgYnkgdGhlIE9uZURyaXZlIHNlcnZpY2UuJ1xyXG4gICAgICA6IHRoaXMubWVzc2FnZSArICc6ICcgKyAnY2xvc2UgYWxsIGFwcGxpY2F0aW9ucyB0aGF0IG1heSBiZSB1c2luZyB0aGlzIGZpbGUuJztcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNhbGNIYXNoSW1wbChmaWxlUGF0aCkge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICBjb25zdCBoYXNoID0gY3J5cHRvLmNyZWF0ZUhhc2goJ21kNScpO1xyXG4gICAgY29uc3Qgc3RyZWFtID0gZnMuY3JlYXRlUmVhZFN0cmVhbShmaWxlUGF0aCk7XHJcbiAgICBzdHJlYW0ub24oJ3JlYWRhYmxlJywgKCkgPT4ge1xyXG4gICAgICBjb25zdCBkYXRhID0gc3RyZWFtLnJlYWQoKTtcclxuICAgICAgaWYgKGRhdGEpIHtcclxuICAgICAgICBoYXNoLnVwZGF0ZShkYXRhKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBzdHJlYW0ub24oJ2VuZCcsICgpID0+IHJlc29sdmUoaGFzaC5kaWdlc3QoJ2hleCcpKSk7XHJcbiAgICBzdHJlYW0ub24oJ2Vycm9yJywgcmVqZWN0KTtcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEhhc2goZmlsZVBhdGgsIHRyaWVzID0gMykge1xyXG4gIHJldHVybiBjYWxjSGFzaEltcGwoZmlsZVBhdGgpXHJcbiAgICAuY2F0Y2goZXJyID0+IHtcclxuICAgICAgaWYgKFsnRU1GSUxFJywgJ0VCQURGJ10uaW5jbHVkZXMoZXJyWydjb2RlJ10pICYmICh0cmllcyA+IDApKSB7XHJcbiAgICAgICAgcmV0dXJuIGdldEhhc2goZmlsZVBhdGgsIHRyaWVzIC0gMSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgVU5JQVBQID0gYXBwIHx8IHJlbW90ZS5hcHA7XHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpIHtcclxuICByZXR1cm4gcGF0aC5qb2luKFVOSUFQUC5nZXRQYXRoKCdkb2N1bWVudHMnKSwgJ1RoZSBXaXRjaGVyIDMnLCBMT0FEX09SREVSX0ZJTEVOQU1FKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFByaW9yaXR5VHlwZUJyYW5jaCgpIHtcclxuICByZXR1cm4gWydzZXR0aW5ncycsICd3aXRjaGVyMycsICdwcmlvcml0eXR5cGUnXTtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IEdBTUVfSUQgPSAnd2l0Y2hlcjMnO1xyXG5cclxuLy8gRmlsZSB1c2VkIGJ5IHNvbWUgbW9kcyB0byBkZWZpbmUgaG90a2V5L2lucHV0IG1hcHBpbmdcclxuZXhwb3J0IGNvbnN0IElOUFVUX1hNTF9GSUxFTkFNRSA9ICdpbnB1dC54bWwnO1xyXG5cclxuLy8gVGhlIFczTU0gbWVudSBtb2QgcGF0dGVybiBzZWVtcyB0byBlbmZvcmNlIGEgbW9kZGluZyBwYXR0ZXJuXHJcbi8vICB3aGVyZSB7ZmlsZW5hbWV9LnBhcnQudHh0IGhvbGRzIGEgZGlmZiBvZiB3aGF0IG5lZWRzIHRvIGJlXHJcbi8vICBhZGRlZCB0byB0aGUgb3JpZ2luYWwgZmlsZSAtIHdlJ3JlIGdvaW5nIHRvIHVzZSB0aGlzIHBhdHRlcm4gYXMgd2VsbC5cclxuZXhwb3J0IGNvbnN0IFBBUlRfU1VGRklYID0gJy5wYXJ0LnR4dCc7XHJcblxyXG5leHBvcnQgY29uc3QgU0NSSVBUX01FUkdFUl9JRCA9ICdXM1NjcmlwdE1lcmdlcic7XHJcbmV4cG9ydCBjb25zdCBNRVJHRV9JTlZfTUFOSUZFU1QgPSAnTWVyZ2VJbnZlbnRvcnkueG1sJztcclxuZXhwb3J0IGNvbnN0IExPQURfT1JERVJfRklMRU5BTUUgPSAnbW9kcy5zZXR0aW5ncyc7XHJcbmV4cG9ydCBjb25zdCBJMThOX05BTUVTUEFDRSA9ICdnYW1lLXdpdGNoZXIzJztcclxuZXhwb3J0IGNvbnN0IENPTkZJR19NQVRSSVhfUkVMX1BBVEggPSBwYXRoLmpvaW4oJ2JpbicsICdjb25maWcnLCAncjRnYW1lJywgJ3VzZXJfY29uZmlnX21hdHJpeCcsICdwYycpO1xyXG5cclxuZXhwb3J0IGNvbnN0IFczX1RFTVBfREFUQV9ESVIgPSBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCd0ZW1wJyksICdXM1RlbXBEYXRhJyk7XHJcblxyXG5leHBvcnQgY29uc3QgVU5JX1BBVENIID0gJ21vZDAwMDBfX19fQ29tcGlsYXRpb25UcmlnZ2VyJztcclxuZXhwb3J0IGNvbnN0IExPQ0tFRF9QUkVGSVggPSAnbW9kMDAwMF8nO1xyXG5cclxuZXhwb3J0IGNvbnN0IERPX05PVF9ESVNQTEFZID0gWydjb21tdW5pdHlwYXRjaC1iYXNlJ107XHJcbmV4cG9ydCBjb25zdCBET19OT1RfREVQTE9ZID0gWydyZWFkbWUudHh0J107Il19