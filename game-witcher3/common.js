"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DO_NOT_DEPLOY = exports.DO_NOT_DISPLAY = exports.LOCKED_PREFIX = exports.UNI_PATCH = exports.W3_TEMP_DATA_DIR = exports.CONFIG_MATRIX_REL_PATH = exports.I18N_NAMESPACE = exports.LOAD_ORDER_FILENAME = exports.MERGE_INV_MANIFEST = exports.SCRIPT_MERGER_ID = exports.PART_SUFFIX = exports.INPUT_XML_FILENAME = exports.GAME_ID = exports.getSuppressModLimitBranch = exports.getPriorityTypeBranch = exports.getLoadOrderFilePath = exports.getHash = exports.calcHashImpl = exports.MergeDataViolationError = exports.ResourceInaccessibleError = exports.MD5ComparisonError = void 0;
const crypto_1 = __importDefault(require("crypto"));
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
class MergeDataViolationError extends Error {
    constructor(notIncluded, optional, collectionName) {
        super(`Merged script data for ${collectionName} is referencing missing/undeployed/optional mods`);
        this.name = 'MergeDataViolationError';
        this.mOptional = optional;
        this.mNotIncluded = notIncluded;
        this.mCollectionName = collectionName;
    }
    get Optional() {
        return this.mOptional;
    }
    get NotIncluded() {
        return this.mNotIncluded;
    }
    get CollectionName() {
        return this.mCollectionName;
    }
}
exports.MergeDataViolationError = MergeDataViolationError;
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
function getLoadOrderFilePath() {
    return path_1.default.join(vortex_api_1.util.getVortexPath('documents'), 'The Witcher 3', exports.LOAD_ORDER_FILENAME);
}
exports.getLoadOrderFilePath = getLoadOrderFilePath;
function getPriorityTypeBranch() {
    return ['settings', 'witcher3', 'prioritytype'];
}
exports.getPriorityTypeBranch = getPriorityTypeBranch;
function getSuppressModLimitBranch() {
    return ['settings', 'witcher3', 'suppressModLimitPatch'];
}
exports.getSuppressModLimitBranch = getSuppressModLimitBranch;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLG9EQUE0QjtBQUM1QixnREFBd0I7QUFDeEIsMkNBQXNDO0FBQ3RDLE1BQWEsa0JBQW1CLFNBQVEsS0FBSztJQUUzQyxZQUFZLE9BQU8sRUFBRSxJQUFJO1FBQ3ZCLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNmLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBQ3BCLENBQUM7SUFFRCxJQUFJLFlBQVk7UUFDZCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDcEIsQ0FBQztJQUVELElBQUksWUFBWTtRQUNkLE9BQU8sSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUMxQyxDQUFDO0NBQ0Y7QUFkRCxnREFjQztBQUVELE1BQWEseUJBQTBCLFNBQVEsS0FBSztJQUdsRCxZQUFZLFFBQVEsRUFBRSxXQUFXLEdBQUcsS0FBSztRQUN2QyxLQUFLLENBQUMsSUFBSSxRQUFRLDJDQUEyQyxDQUFDLENBQUM7UUFDL0QsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7UUFDMUIsSUFBSSxDQUFDLG1CQUFtQixHQUFHLFdBQVcsQ0FBQztJQUN6QyxDQUFDO0lBRUQsSUFBSSxVQUFVO1FBQ1osTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsY0FBSSxDQUFDLEdBQUcsQ0FBQzthQUM1QyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO2FBQ3BCLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1FBQ2pDLE9BQU8sUUFBUSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBRUQsSUFBSSxXQUFXO1FB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QU8sQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0FBQ2xELENBQUM7QUFGRCxzREFFQztBQUVELFNBQWdCLHlCQUF5QjtJQUN2QyxPQUFPLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO0FBQzNELENBQUM7QUFGRCw4REFFQztBQUVZLFFBQUEsT0FBTyxHQUFHLFVBQVUsQ0FBQztBQUdyQixRQUFBLGtCQUFrQixHQUFHLFdBQVcsQ0FBQztBQUtqQyxRQUFBLFdBQVcsR0FBRyxXQUFXLENBQUM7QUFFMUIsUUFBQSxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQztBQUNwQyxRQUFBLGtCQUFrQixHQUFHLG9CQUFvQixDQUFDO0FBQzFDLFFBQUEsbUJBQW1CLEdBQUcsZUFBZSxDQUFDO0FBQ3RDLFFBQUEsY0FBYyxHQUFHLGVBQWUsQ0FBQztBQUNqQyxRQUFBLHNCQUFzQixHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFFMUYsUUFBQSxnQkFBZ0IsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBRXZFLFFBQUEsU0FBUyxHQUFHLCtCQUErQixDQUFDO0FBQzVDLFFBQUEsYUFBYSxHQUFHLFVBQVUsQ0FBQztBQUUzQixRQUFBLGNBQWMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLENBQUM7QUFDekMsUUFBQSxhQUFhLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjcnlwdG8gZnJvbSAnY3J5cHRvJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZnMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcbmV4cG9ydCBjbGFzcyBNRDVDb21wYXJpc29uRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIHByaXZhdGUgbVBhdGg7XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2UsIGZpbGUpIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB0aGlzLm1QYXRoID0gZmlsZTtcbiAgfVxuXG4gIGdldCBhZmZlY3RlZEZpbGUoKSB7XG4gICAgcmV0dXJuIHRoaXMubVBhdGg7XG4gIH1cblxuICBnZXQgZXJyb3JNZXNzYWdlKCkge1xuICAgIHJldHVybiB0aGlzLm1lc3NhZ2UgKyAnOiAnICsgdGhpcy5tUGF0aDtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUmVzb3VyY2VJbmFjY2Vzc2libGVFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgcHJpdmF0ZSBtSXNSZXBvcnRpbmdBbGxvd2VkO1xuICBwcml2YXRlIG1GaWxlUGF0aDtcbiAgY29uc3RydWN0b3IoZmlsZVBhdGgsIGFsbG93UmVwb3J0ID0gZmFsc2UpIHtcbiAgICBzdXBlcihgXCIke2ZpbGVQYXRofVwiIGlzIGJlaW5nIG1hbmlwdWxhdGVkIGJ5IGFub3RoZXIgcHJvY2Vzc2ApO1xuICAgIHRoaXMubUZpbGVQYXRoID0gZmlsZVBhdGg7XG4gICAgdGhpcy5tSXNSZXBvcnRpbmdBbGxvd2VkID0gYWxsb3dSZXBvcnQ7XG4gIH1cblxuICBnZXQgaXNPbmVEcml2ZSgpIHtcbiAgICBjb25zdCBzZWdtZW50cyA9IHRoaXMubUZpbGVQYXRoLnNwbGl0KHBhdGguc2VwKVxuICAgICAgLmZpbHRlcihzZWcgPT4gISFzZWcpXG4gICAgICAubWFwKHNlZyA9PiBzZWcudG9Mb3dlckNhc2UoKSk7XG4gICAgcmV0dXJuIHNlZ21lbnRzLmluY2x1ZGVzKCdvbmVkcml2ZScpO1xuICB9XG5cbiAgZ2V0IGFsbG93UmVwb3J0KCkge1xuICAgIHJldHVybiB0aGlzLm1Jc1JlcG9ydGluZ0FsbG93ZWQ7XG4gIH1cblxuICBnZXQgZXJyb3JNZXNzYWdlKCkge1xuICAgIHJldHVybiAodGhpcy5pc09uZURyaXZlKVxuICAgICAgPyB0aGlzLm1lc3NhZ2UgKyAnOiAnICsgJ3Byb2JhYmx5IGJ5IHRoZSBPbmVEcml2ZSBzZXJ2aWNlLidcbiAgICAgIDogdGhpcy5tZXNzYWdlICsgJzogJyArICdjbG9zZSBhbGwgYXBwbGljYXRpb25zIHRoYXQgbWF5IGJlIHVzaW5nIHRoaXMgZmlsZS4nO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIE1lcmdlRGF0YVZpb2xhdGlvbkVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICAvLyBNZXJnZSBkYXRhIHZpb2xhdGlvbiBlcnJvcnMgaW50ZW5kcyB0byBjYXRlciBmb3IvYmxvY2sgY3VyYXRvcnNcbiAgLy8gIGZyb20gdXBsb2FkaW5nIGEgY29sbGVjdGlvbiB3aXRoIGZhdWx0eSBtZXJnZWQgZGF0YS5cbiAgLy8gV2UgZGVmaW5lIGZhdWx0eSBtZXJnZWQgZGF0YSBhczpcbiAgLy8gIDEuIEEgbWVyZ2VkIHNjcmlwdCBzZWdtZW50IHdoaWNoIHJlbGllcyBvbiBhIGNlcnRhaW4gbW9kIHRvIGJlIGluY2x1ZGVkIGluIHRoZVxuICAvLyAgICAgY29sbGVjdGlvbiwgeWV0IGl0IGlzIG5vdCBpbmNsdWRlZC5cbiAgLy8gIDIuIEEgbWVyZ2VkIHNjcmlwdCBzZWdtZW50IHdoaWNoIHJlcXVpcmVzIGEgc3BlY2lmaWMgbW9kIHRvIGJlIGluc3RhbGxlZCxcbiAgLy8gICAgIHlldCB0aGUgY29sbGVjdGlvbiBoaWdobGlnaHRlZCBzYWlkIG1vZCBhcyBcIm9wdGlvbmFsXCI7IHBvdGVudGlhbGx5XG4gIC8vICAgICByZXN1bHRpbmcgaW4gdGhlIG1vZCBiZWluZyBtaXNzaW5nIG9uIHRoZSB1c2VyIGVuZC5cbiAgcHJpdmF0ZSBtTm90SW5jbHVkZWQ6IHN0cmluZ1tdO1xuICBwcml2YXRlIG1PcHRpb25hbDogc3RyaW5nW107XG4gIHByaXZhdGUgbUNvbGxlY3Rpb25OYW1lOiBzdHJpbmc7XG4gIGNvbnN0cnVjdG9yKG5vdEluY2x1ZGVkOiBzdHJpbmdbXSwgb3B0aW9uYWw6IHN0cmluZ1tdLCBjb2xsZWN0aW9uTmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYE1lcmdlZCBzY3JpcHQgZGF0YSBmb3IgJHtjb2xsZWN0aW9uTmFtZX0gaXMgcmVmZXJlbmNpbmcgbWlzc2luZy91bmRlcGxveWVkL29wdGlvbmFsIG1vZHNgKTtcbiAgICB0aGlzLm5hbWUgPSAnTWVyZ2VEYXRhVmlvbGF0aW9uRXJyb3InO1xuICAgIHRoaXMubU9wdGlvbmFsID0gb3B0aW9uYWw7XG4gICAgdGhpcy5tTm90SW5jbHVkZWQgPSBub3RJbmNsdWRlZDtcbiAgICB0aGlzLm1Db2xsZWN0aW9uTmFtZSA9IGNvbGxlY3Rpb25OYW1lO1xuICB9XG5cbiAgcHVibGljIGdldCBPcHRpb25hbCgpIHtcbiAgICByZXR1cm4gdGhpcy5tT3B0aW9uYWw7XG4gIH1cblxuICBwdWJsaWMgZ2V0IE5vdEluY2x1ZGVkKCkge1xuICAgIHJldHVybiB0aGlzLm1Ob3RJbmNsdWRlZDtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgQ29sbGVjdGlvbk5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMubUNvbGxlY3Rpb25OYW1lXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhbGNIYXNoSW1wbChmaWxlUGF0aCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNvbnN0IGhhc2ggPSBjcnlwdG8uY3JlYXRlSGFzaCgnbWQ1Jyk7XG4gICAgY29uc3Qgc3RyZWFtID0gZnMuY3JlYXRlUmVhZFN0cmVhbShmaWxlUGF0aCk7XG4gICAgc3RyZWFtLm9uKCdyZWFkYWJsZScsICgpID0+IHtcbiAgICAgIGNvbnN0IGRhdGEgPSBzdHJlYW0ucmVhZCgpO1xuICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgaGFzaC51cGRhdGUoZGF0YSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgc3RyZWFtLm9uKCdlbmQnLCAoKSA9PiByZXNvbHZlKGhhc2guZGlnZXN0KCdoZXgnKSkpO1xuICAgIHN0cmVhbS5vbignZXJyb3InLCByZWplY3QpO1xuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEhhc2goZmlsZVBhdGgsIHRyaWVzID0gMykge1xuICByZXR1cm4gY2FsY0hhc2hJbXBsKGZpbGVQYXRoKVxuICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgaWYgKFsnRU1GSUxFJywgJ0VCQURGJ10uaW5jbHVkZXMoZXJyWydjb2RlJ10pICYmICh0cmllcyA+IDApKSB7XG4gICAgICAgIHJldHVybiBnZXRIYXNoKGZpbGVQYXRoLCB0cmllcyAtIDEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICB9XG4gICAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpIHtcbiAgcmV0dXJuIHBhdGguam9pbih1dGlsLmdldFZvcnRleFBhdGgoJ2RvY3VtZW50cycpLCAnVGhlIFdpdGNoZXIgMycsIExPQURfT1JERVJfRklMRU5BTUUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJpb3JpdHlUeXBlQnJhbmNoKCkge1xuICByZXR1cm4gWydzZXR0aW5ncycsICd3aXRjaGVyMycsICdwcmlvcml0eXR5cGUnXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFN1cHByZXNzTW9kTGltaXRCcmFuY2goKSB7XG4gIHJldHVybiBbJ3NldHRpbmdzJywgJ3dpdGNoZXIzJywgJ3N1cHByZXNzTW9kTGltaXRQYXRjaCddO1xufVxuXG5leHBvcnQgY29uc3QgR0FNRV9JRCA9ICd3aXRjaGVyMyc7XG5cbi8vIEZpbGUgdXNlZCBieSBzb21lIG1vZHMgdG8gZGVmaW5lIGhvdGtleS9pbnB1dCBtYXBwaW5nXG5leHBvcnQgY29uc3QgSU5QVVRfWE1MX0ZJTEVOQU1FID0gJ2lucHV0LnhtbCc7XG5cbi8vIFRoZSBXM01NIG1lbnUgbW9kIHBhdHRlcm4gc2VlbXMgdG8gZW5mb3JjZSBhIG1vZGRpbmcgcGF0dGVyblxuLy8gIHdoZXJlIHtmaWxlbmFtZX0ucGFydC50eHQgaG9sZHMgYSBkaWZmIG9mIHdoYXQgbmVlZHMgdG8gYmVcbi8vICBhZGRlZCB0byB0aGUgb3JpZ2luYWwgZmlsZSAtIHdlJ3JlIGdvaW5nIHRvIHVzZSB0aGlzIHBhdHRlcm4gYXMgd2VsbC5cbmV4cG9ydCBjb25zdCBQQVJUX1NVRkZJWCA9ICcucGFydC50eHQnO1xuXG5leHBvcnQgY29uc3QgU0NSSVBUX01FUkdFUl9JRCA9ICdXM1NjcmlwdE1lcmdlcic7XG5leHBvcnQgY29uc3QgTUVSR0VfSU5WX01BTklGRVNUID0gJ01lcmdlSW52ZW50b3J5LnhtbCc7XG5leHBvcnQgY29uc3QgTE9BRF9PUkRFUl9GSUxFTkFNRSA9ICdtb2RzLnNldHRpbmdzJztcbmV4cG9ydCBjb25zdCBJMThOX05BTUVTUEFDRSA9ICdnYW1lLXdpdGNoZXIzJztcbmV4cG9ydCBjb25zdCBDT05GSUdfTUFUUklYX1JFTF9QQVRIID0gcGF0aC5qb2luKCdiaW4nLCAnY29uZmlnJywgJ3I0Z2FtZScsICd1c2VyX2NvbmZpZ19tYXRyaXgnLCAncGMnKTtcblxuZXhwb3J0IGNvbnN0IFczX1RFTVBfREFUQV9ESVIgPSBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCd0ZW1wJyksICdXM1RlbXBEYXRhJyk7XG5cbmV4cG9ydCBjb25zdCBVTklfUEFUQ0ggPSAnbW9kMDAwMF9fX19Db21waWxhdGlvblRyaWdnZXInO1xuZXhwb3J0IGNvbnN0IExPQ0tFRF9QUkVGSVggPSAnbW9kMDAwMF8nO1xuXG5leHBvcnQgY29uc3QgRE9fTk9UX0RJU1BMQVkgPSBbJ2NvbW11bml0eXBhdGNoLWJhc2UnXTtcbmV4cG9ydCBjb25zdCBET19OT1RfREVQTE9ZID0gWydyZWFkbWUudHh0J107Il19