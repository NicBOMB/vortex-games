"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.installMixed = exports.testSupportedMixed = exports.installDLCMod = exports.testDLCMod = void 0;
const path_1 = __importDefault(require("path"));
const common_1 = require("./common");
function testDLCMod(files, gameId) {
    if (gameId !== common_1.GAME_ID) {
        return Promise.resolve({ supported: false, requiredFiles: [] });
    }
    const nonDlcFile = files.find(file => !file.startsWith('dlc'));
    return (nonDlcFile !== undefined)
        ? Promise.resolve({ supported: false, requiredFiles: [] })
        : Promise.resolve({ supported: true, requiredFiles: [] });
}
exports.testDLCMod = testDLCMod;
function installDLCMod(files) {
    const modNames = [];
    const setModTypeInstr = {
        type: 'setmodtype',
        value: 'witcher3dlc',
    };
    const instructions = files.reduce((accum, iter) => {
        if (path_1.default.extname(iter) === '') {
            return accum;
        }
        const segments = iter.split(path_1.default.sep);
        const properlyFormatted = segments.length > 2
            ? (segments[0].toLowerCase() === 'dlc') && ((segments[2] || '').toLowerCase() === 'content')
            : false;
        const modName = properlyFormatted
            ? segments[1]
            : segments[0];
        modNames.push(modName);
        const destination = properlyFormatted
            ? segments.slice(1).join(path_1.default.sep)
            : segments.join(path_1.default.sep);
        accum.push({
            type: 'copy',
            source: iter,
            destination,
        });
        return accum;
    }, [setModTypeInstr]);
    const modNamesAttr = {
        type: 'attribute',
        key: 'modComponents',
        value: modNames,
    };
    instructions.push(modNamesAttr);
    return Promise.resolve({ instructions });
}
exports.installDLCMod = installDLCMod;
function testSupportedMixed(files, gameId) {
    if (gameId !== common_1.GAME_ID) {
        return Promise.resolve({ supported: false, requiredFiles: [] });
    }
    const hasConfigMatrixFile = files.find(file => path_1.default.basename(file).toLowerCase() === common_1.CONFIG_MATRIX_REL_PATH) !== undefined;
    if (hasConfigMatrixFile) {
        return Promise.resolve({ supported: false, requiredFiles: [] });
    }
    const hasPrefix = (prefix, fileEntry) => {
        const segments = fileEntry.toLowerCase().split(path_1.default.sep);
        if (segments.indexOf('content') !== 1) {
            return false;
        }
        return (segments[0].length > 3) && (segments[0].startsWith(prefix));
    };
    const supported = ((files.find(file => hasPrefix('dlc', file)) !== undefined)
        && (files.find(file => hasPrefix('mod', file)) !== undefined));
    return Promise.resolve({
        supported,
        requiredFiles: [],
    });
}
exports.testSupportedMixed = testSupportedMixed;
function installMixed(files) {
    const modNames = [];
    const instructions = files.reduce((accum, iter) => {
        const segments = iter.split(path_1.default.sep);
        if (!path_1.default.extname(segments[segments.length - 1])) {
            return accum;
        }
        const modName = segments[0].startsWith('mod')
            ? segments[0] : undefined;
        const destination = (segments[0].startsWith('dlc'))
            ? ['dlc'].concat(segments).join(path_1.default.sep)
            : (modName !== undefined)
                ? ['mods'].concat(segments).join(path_1.default.sep)
                : undefined;
        if (destination !== undefined) {
            if (modName !== undefined) {
                modNames.push(modName);
            }
            const instruction = {
                type: 'copy',
                source: iter,
                destination,
            };
            accum.push(instruction);
        }
        return accum;
    }, [])
        .concat({
        type: 'attribute',
        key: 'modComponents',
        value: modNames,
    });
    return Promise.resolve({ instructions });
}
exports.installMixed = installMixed;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFsbGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImluc3RhbGxlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsZ0RBQXdCO0FBRXhCLHFDQUEyRDtBQUkzRCxTQUFnQixVQUFVLENBQUMsS0FBZSxFQUFFLE1BQWM7SUFDeEQsSUFBSSxNQUFNLEtBQUssZ0JBQU8sRUFBRTtRQUN0QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0tBQ2pFO0lBRUQsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQy9ELE9BQU8sQ0FBQyxVQUFVLEtBQUssU0FBUyxDQUFDO1FBQy9CLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsRUFBRSxFQUFFLENBQUM7UUFDMUQsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQzlELENBQUM7QUFURCxnQ0FTQztBQUVELFNBQWdCLGFBQWEsQ0FBQyxLQUFlO0lBQzNDLE1BQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQztJQUNwQixNQUFNLGVBQWUsR0FBdUI7UUFDMUMsSUFBSSxFQUFFLFlBQVk7UUFDbEIsS0FBSyxFQUFFLGFBQWE7S0FDckIsQ0FBQztJQUNGLE1BQU0sWUFBWSxHQUF5QixLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFO1FBQ3RFLElBQUksY0FBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUU7WUFDN0Is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QyxDQUFDLENBQUMsQ0FBQyxPQUFPLEtBQUssU0FBUyxDQUFDO2dCQUN2QixDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQUksQ0FBQyxHQUFHLENBQUM7Z0JBQzFDLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDaEIsSUFBSSxXQUFXLEtBQUssU0FBUyxFQUFFO1lBQzdCLElBQUksT0FBTyxLQUFLLFNBQVMsRUFBRTtnQkFDekIsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUN4QjtZQUNELE1BQU0sV0FBVyxHQUF1QjtnQkFDdEMsSUFBSSxFQUFFLE1BQU07Z0JBQ1osTUFBTSxFQUFFLElBQUk7Z0JBQ1osV0FBVzthQUNaLENBQUM7WUFDRixLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQ3pCO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDLEVBQUUsRUFBRSxDQUFDO1NBQ0wsTUFBTSxDQUFDO1FBQ04sSUFBSSxFQUFFLFdBQVc7UUFDakIsR0FBRyxFQUFFLGVBQWU7UUFDcEIsS0FBSyxFQUFFLFFBQVE7S0FDaEIsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQztBQUMzQyxDQUFDO0FBbkNELG9DQW1DQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgdHlwZXMgfSBmcm9tICd2b3J0ZXgtYXBpJztcbmltcG9ydCB7IENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XG5cbmV4cG9ydCB0eXBlIFByZWZpeFR5cGUgPSAnZGxjJyB8ICdtb2QnO1xuXG5leHBvcnQgZnVuY3Rpb24gdGVzdERMQ01vZChmaWxlczogc3RyaW5nW10sIGdhbWVJZDogc3RyaW5nKTogUHJvbWlzZTx0eXBlcy5JU3VwcG9ydGVkUmVzdWx0PiB7XG4gIGlmIChnYW1lSWQgIT09IEdBTUVfSUQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgc3VwcG9ydGVkOiBmYWxzZSwgcmVxdWlyZWRGaWxlczogW10gfSk7XG4gIH1cblxuICBjb25zdCBub25EbGNGaWxlID0gZmlsZXMuZmluZChmaWxlID0+ICFmaWxlLnN0YXJ0c1dpdGgoJ2RsYycpKTtcbiAgcmV0dXJuIChub25EbGNGaWxlICE9PSB1bmRlZmluZWQpXG4gICAgPyBQcm9taXNlLnJlc29sdmUoeyBzdXBwb3J0ZWQ6IGZhbHNlLCByZXF1aXJlZEZpbGVzOiBbXSB9KVxuICAgIDogUHJvbWlzZS5yZXNvbHZlKHsgc3VwcG9ydGVkOiB0cnVlLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluc3RhbGxETENNb2QoZmlsZXM6IHN0cmluZ1tdKSB7XG4gIGNvbnN0IG1vZE5hbWVzID0gW107XG4gIGNvbnN0IHNldE1vZFR5cGVJbnN0cjogdHlwZXMuSUluc3RydWN0aW9uID0ge1xuICAgIHR5cGU6ICdzZXRtb2R0eXBlJyxcbiAgICB2YWx1ZTogJ3dpdGNoZXIzZGxjJyxcbiAgfTtcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IGZpbGVzLnJlZHVjZSgoYWNjdW0sIGl0ZXIpID0+IHtcbiAgICBpZiAocGF0aC5leHRuYW1lKGl0ZXIpID09PSAnJykge1xuICAgICAgcmV0dXJuIGFjY3VtO1xuICAgIH1cbiAgICBjb25zdCBzZWdtZW50cyA9IGl0ZXIuc3BsaXQocGF0aC5zZXApO1xuICAgIGNvbnN0IHByb3Blcmx5Rm9ybWF0dGVkID0gc2VnbWVudHMubGVuZ3RoID4gMlxuICAgICAgPyAoc2VnbWVudHNbMF0udG9Mb3dlckNhc2UoKSA9PT0gJ2RsYycpICYmICgoc2VnbWVudHNbMl0gfHwgJycpLnRvTG93ZXJDYXNlKCkgPT09ICdjb250ZW50JylcbiAgICAgIDogZmFsc2U7XG4gICAgY29uc3QgbW9kTmFtZSA9IHByb3Blcmx5Rm9ybWF0dGVkXG4gICAgICA/IHNlZ21lbnRzWzFdXG4gICAgICA6IHNlZ21lbnRzWzBdO1xuICAgIG1vZE5hbWVzLnB1c2gobW9kTmFtZSk7XG4gICAgY29uc3QgZGVzdGluYXRpb24gPSBwcm9wZXJseUZvcm1hdHRlZFxuICAgICAgPyBzZWdtZW50cy5zbGljZSgxKS5qb2luKHBhdGguc2VwKVxuICAgICAgOiBzZWdtZW50cy5qb2luKHBhdGguc2VwKTtcbiAgICBhY2N1bS5wdXNoKHtcbiAgICAgIHR5cGU6ICdjb3B5JyxcbiAgICAgIHNvdXJjZTogaXRlcixcbiAgICAgIGRlc3RpbmF0aW9uLFxuICAgIH0pXG4gICAgcmV0dXJuIGFjY3VtO1xuICB9LFsgc2V0TW9kVHlwZUluc3RyIF0pO1xuXG4gIGNvbnN0IG1vZE5hbWVzQXR0cjogdHlwZXMuSUluc3RydWN0aW9uID0ge1xuICAgIHR5cGU6ICdhdHRyaWJ1dGUnLFxuICAgIGtleTogJ21vZENvbXBvbmVudHMnLFxuICAgIHZhbHVlOiBtb2ROYW1lcyxcbiAgfTtcbiAgaW5zdHJ1Y3Rpb25zLnB1c2gobW9kTmFtZXNBdHRyKTtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRlc3RTdXBwb3J0ZWRNaXhlZChmaWxlczogc3RyaW5nW10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVJZDogc3RyaW5nKTogUHJvbWlzZTx0eXBlcy5JU3VwcG9ydGVkUmVzdWx0PiB7XG4gIGlmIChnYW1lSWQgIT09IEdBTUVfSUQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgc3VwcG9ydGVkOiBmYWxzZSwgcmVxdWlyZWRGaWxlczogW10gfSk7XG4gIH1cblxuICBjb25zdCBoYXNDb25maWdNYXRyaXhGaWxlID0gZmlsZXMuZmluZChmaWxlID0+XG4gICAgcGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSBDT05GSUdfTUFUUklYX1JFTF9QQVRIKSAhPT0gdW5kZWZpbmVkO1xuICBpZiAoaGFzQ29uZmlnTWF0cml4RmlsZSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBzdXBwb3J0ZWQ6IGZhbHNlLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcbiAgfVxuXG4gIGNvbnN0IGhhc1ByZWZpeCA9IChwcmVmaXg6IFByZWZpeFR5cGUsIGZpbGVFbnRyeTogc3RyaW5nKSA9PiB7XG4gICAgY29uc3Qgc2VnbWVudHMgPSBmaWxlRW50cnkudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCk7XG4gICAgaWYgKHNlZ21lbnRzLmluZGV4T2YoJ2NvbnRlbnQnKSAhPT0gMSkge1xuICAgICAgLy8gV2UgZXhwZWN0IHRoZSBjb250ZW50IGZvbGRlciB0byBiZSBuZXN0ZWQgb25lIGxldmVsIGJlbmVhdGhcbiAgICAgIC8vICB0aGUgbW9kJ3MgZm9sZGVyIGUuZy4gJ2FyY2hpdmUuemlwL2RsY01vZE5hbWUvY29udGVudC8nIG90aGVyd2lzZVxuICAgICAgLy8gIGl0J3Mgc2ltcGx5IHRvbyB1bnJlbGlhYmxlIHRvIGF0dGVtcHQgdG8gZGV0ZWN0IHRoaXMgcGFja2FnaW5nIHBhdHRlcm4uXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIChzZWdtZW50c1swXS5sZW5ndGggPiAzKSAmJiAoc2VnbWVudHNbMF0uc3RhcnRzV2l0aChwcmVmaXgpKTtcbiAgfTtcblxuICBjb25zdCBzdXBwb3J0ZWQgPSAoKGZpbGVzLmZpbmQoZmlsZSA9PiBoYXNQcmVmaXgoJ2RsYycsIGZpbGUpKSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgICAgICAgJiYgKGZpbGVzLmZpbmQoZmlsZSA9PiBoYXNQcmVmaXgoJ21vZCcsIGZpbGUpKSAhPT0gdW5kZWZpbmVkKSk7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgIHN1cHBvcnRlZCxcbiAgICByZXF1aXJlZEZpbGVzOiBbXSxcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnN0YWxsTWl4ZWQoZmlsZXM6IHN0cmluZ1tdKSB7XG4gIC8vIFdlIGNhbiBvbmx5IGFzc3VtZSB0aGF0IGZpbGVzIHdpdGggdGhlICdkbGMnIHByZWZpeCBnbyBpbnNpZGUgZGxjIGFuZCBmaWxlc1xuICAvLyAgd2l0aCB0aGUgJ21vZCcgcHJlZml4IGdvIGluc2lkZSBtb2RzLlxuICBjb25zdCBtb2ROYW1lczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IGZpbGVzLnJlZHVjZSgoYWNjdW0sIGl0ZXIpID0+IHtcbiAgICBjb25zdCBzZWdtZW50cyA9IGl0ZXIuc3BsaXQocGF0aC5zZXApO1xuICAgIGlmICghcGF0aC5leHRuYW1lKHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdKSkge1xuICAgICAgcmV0dXJuIGFjY3VtO1xuICAgIH1cbiAgICBjb25zdCBtb2ROYW1lID0gc2VnbWVudHNbMF0uc3RhcnRzV2l0aCgnbW9kJylcbiAgICAgID8gc2VnbWVudHNbMF0gOiB1bmRlZmluZWQ7XG4gICAgY29uc3QgZGVzdGluYXRpb24gPSAoc2VnbWVudHNbMF0uc3RhcnRzV2l0aCgnZGxjJykpXG4gICAgICA/IFsnZGxjJ10uY29uY2F0KHNlZ21lbnRzKS5qb2luKHBhdGguc2VwKVxuICAgICAgOiAobW9kTmFtZSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICA/IFsnbW9kcyddLmNvbmNhdChzZWdtZW50cykuam9pbihwYXRoLnNlcClcbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgaWYgKGRlc3RpbmF0aW9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmIChtb2ROYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbW9kTmFtZXMucHVzaChtb2ROYW1lKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGluc3RydWN0aW9uOiB0eXBlcy5JSW5zdHJ1Y3Rpb24gPSB7XG4gICAgICAgIHR5cGU6ICdjb3B5JyxcbiAgICAgICAgc291cmNlOiBpdGVyLFxuICAgICAgICBkZXN0aW5hdGlvbixcbiAgICAgIH07XG4gICAgICBhY2N1bS5wdXNoKGluc3RydWN0aW9uKTtcbiAgICB9XG4gICAgcmV0dXJuIGFjY3VtO1xuICB9LCBbXSlcbiAgLmNvbmNhdCh7XG4gICAgdHlwZTogJ2F0dHJpYnV0ZScsXG4gICAga2V5OiAnbW9kQ29tcG9uZW50cycsXG4gICAgdmFsdWU6IG1vZE5hbWVzLFxuICB9KTtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcbn1cbiJdfQ==