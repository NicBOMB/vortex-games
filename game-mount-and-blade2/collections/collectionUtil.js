"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genCollectionLoadOrder = exports.isModInCollection = exports.isValidMod = exports.CollectionParseError = exports.CollectionGenerateError = void 0;
const vortex_api_1 = require("vortex-api");
const common_1 = require("../common");
class CollectionGenerateError extends Error {
    constructor(why) {
        super(`Failed to generate game specific data for collection: ${why}`);
        this.name = 'CollectionGenerateError';
    }
}
exports.CollectionGenerateError = CollectionGenerateError;
class CollectionParseError extends Error {
    constructor(collectionName, why) {
        super(`Failed to parse game specific data for collection ${collectionName}: ${why}`);
        this.name = 'CollectionGenerateError';
    }
}
exports.CollectionParseError = CollectionParseError;
function isValidMod(mod) {
    return (mod?.type !== 'collection');
}
exports.isValidMod = isValidMod;
function isModInCollection(collectionMod, mod) {
    if (collectionMod.rules === undefined) {
        return false;
    }
    return collectionMod.rules.find(rule => vortex_api_1.util.testModReference(mod, rule.reference)) !== undefined;
}
exports.isModInCollection = isModInCollection;
function genCollectionLoadOrder(loadOrder, mods, collection) {
    const filteredMods = (collection !== undefined)
        ? Object.keys(mods)
            .filter(id => isValidMod(mods[id]) && isModInCollection(collection, mods[id]))
            .reduce((accum, iter) => {
            accum[iter] = mods[iter];
            return accum;
        }, {})
        : mods;
    const sortedMods = Object.keys(loadOrder)
        .filter(id => isValidSubMod(id, filteredMods))
        .sort((lhs, rhs) => loadOrder[lhs].pos - loadOrder[rhs].pos)
        .reduce((accum, iter, idx) => {
        accum[iter] = {
            ...loadOrder[iter],
            pos: idx,
        };
        return accum;
    }, {});
    return sortedMods;
}
exports.genCollectionLoadOrder = genCollectionLoadOrder;
function isValidSubMod(subModId, mods) {
    if (common_1.OFFICIAL_MODULES.has(subModId)) {
        return true;
    }
    const modIds = Object.keys(mods);
    const subModIds = modIds.reduce((accum, id) => accum.concat([id], mods[id]?.['attributes']?.['subModIds'] || []), []);
    return subModIds.map(id => id.toLowerCase()).includes(subModId.toLowerCase());
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdGlvblV0aWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjb2xsZWN0aW9uVXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwyQ0FBeUM7QUFHekMsc0NBQTZDO0FBRTdDLE1BQWEsdUJBQXdCLFNBQVEsS0FBSztJQUNoRCxZQUFZLEdBQVc7UUFDckIsS0FBSyxDQUFDLHlEQUF5RCxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ3RFLElBQUksQ0FBQyxJQUFJLEdBQUcseUJBQXlCLENBQUM7SUFDeEMsQ0FBQztDQUNGO0FBTEQsMERBS0M7QUFFRCxNQUFhLG9CQUFxQixTQUFRLEtBQUs7SUFDN0MsWUFBWSxjQUFzQixFQUFFLEdBQVc7UUFDN0MsS0FBSyxDQUFDLHFEQUFxRCxjQUFjLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQztRQUNyRixJQUFJLENBQUMsSUFBSSxHQUFHLHlCQUF5QixDQUFDO0lBQ3hDLENBQUM7Q0FDRjtBQUxELG9EQUtDO0FBRUQsU0FBZ0IsVUFBVSxDQUFDLEdBQWU7SUFDeEMsT0FBTyxDQUFDLEdBQUcsRUFBRSxJQUFJLEtBQUssWUFBWSxDQUFDLENBQUM7QUFDdEMsQ0FBQztBQUZELGdDQUVDO0FBRUQsU0FBZ0IsaUJBQWlCLENBQUMsYUFBeUIsRUFBRSxHQUFlO0lBQzFFLElBQUksYUFBYSxDQUFDLEtBQUssS0FBSyxTQUFTLEVBQUU7UUFDckMsT0FBTyxLQUFLLENBQUM7S0FDZDtJQUVELE9BQU8sYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FDckMsaUJBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEtBQUssU0FBUyxDQUFDO0FBQzlELENBQUM7QUFQRCw4Q0FPQztBQUVELFNBQWdCLHNCQUFzQixDQUFDLFNBQStDLEVBQy9DLElBQXFDLEVBQ3JDLFVBQXVCO0lBQzVELE1BQU0sWUFBWSxHQUFHLENBQUMsVUFBVSxLQUFLLFNBQVMsQ0FBQztRQUM3QyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7YUFDZCxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksaUJBQWlCLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2FBQzdFLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUN0QixLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pCLE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNWLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFFVCxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztTQUN0QyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsRUFBRSxFQUFFLFlBQVksQ0FBQyxDQUFDO1NBQzdDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQztTQUMzRCxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxFQUFFO1FBQzNCLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRztZQUNaLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQztZQUNsQixHQUFHLEVBQUUsR0FBRztTQUNULENBQUM7UUFDRixPQUFPLEtBQUssQ0FBQztJQUNmLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNULE9BQU8sVUFBVSxDQUFDO0FBQ3BCLENBQUM7QUF2QkQsd0RBdUJDO0FBRUQsU0FBUyxhQUFhLENBQUMsUUFBZ0IsRUFBRSxJQUFxQztJQUM1RSxJQUFJLHlCQUFnQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUVsQyxPQUFPLElBQUksQ0FBQztLQUNiO0lBSUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNqQyxNQUFNLFNBQVMsR0FBYSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQ3RELEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBRXpFLE9BQU8sU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztBQUNoRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcbmltcG9ydCB7IElMb2FkT3JkZXIsIElMb2FkT3JkZXJFbnRyeSB9IGZyb20gJy4uL3R5cGVzJztcblxuaW1wb3J0IHsgT0ZGSUNJQUxfTU9EVUxFUyB9IGZyb20gJy4uL2NvbW1vbic7XG5cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uR2VuZXJhdGVFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3Iod2h5OiBzdHJpbmcpIHtcbiAgICBzdXBlcihgRmFpbGVkIHRvIGdlbmVyYXRlIGdhbWUgc3BlY2lmaWMgZGF0YSBmb3IgY29sbGVjdGlvbjogJHt3aHl9YCk7XG4gICAgdGhpcy5uYW1lID0gJ0NvbGxlY3Rpb25HZW5lcmF0ZUVycm9yJztcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvblBhcnNlRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKGNvbGxlY3Rpb25OYW1lOiBzdHJpbmcsIHdoeTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYEZhaWxlZCB0byBwYXJzZSBnYW1lIHNwZWNpZmljIGRhdGEgZm9yIGNvbGxlY3Rpb24gJHtjb2xsZWN0aW9uTmFtZX06ICR7d2h5fWApO1xuICAgIHRoaXMubmFtZSA9ICdDb2xsZWN0aW9uR2VuZXJhdGVFcnJvcic7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzVmFsaWRNb2QobW9kOiB0eXBlcy5JTW9kKSB7XG4gIHJldHVybiAobW9kPy50eXBlICE9PSAnY29sbGVjdGlvbicpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNNb2RJbkNvbGxlY3Rpb24oY29sbGVjdGlvbk1vZDogdHlwZXMuSU1vZCwgbW9kOiB0eXBlcy5JTW9kKSB7XG4gIGlmIChjb2xsZWN0aW9uTW9kLnJ1bGVzID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gY29sbGVjdGlvbk1vZC5ydWxlcy5maW5kKHJ1bGUgPT5cbiAgICB1dGlsLnRlc3RNb2RSZWZlcmVuY2UobW9kLCBydWxlLnJlZmVyZW5jZSkpICE9PSB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZW5Db2xsZWN0aW9uTG9hZE9yZGVyKGxvYWRPcmRlcjogeyBbbW9kSWQ6IHN0cmluZ106IElMb2FkT3JkZXJFbnRyeSB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb24/OiB0eXBlcy5JTW9kKTogSUxvYWRPcmRlciB7XG4gIGNvbnN0IGZpbHRlcmVkTW9kcyA9IChjb2xsZWN0aW9uICE9PSB1bmRlZmluZWQpXG4gICAgPyBPYmplY3Qua2V5cyhtb2RzKVxuICAgICAgICAuZmlsdGVyKGlkID0+IGlzVmFsaWRNb2QobW9kc1tpZF0pICYmIGlzTW9kSW5Db2xsZWN0aW9uKGNvbGxlY3Rpb24sIG1vZHNbaWRdKSlcbiAgICAgICAgLnJlZHVjZSgoYWNjdW0sIGl0ZXIpID0+IHtcbiAgICAgICAgICBhY2N1bVtpdGVyXSA9IG1vZHNbaXRlcl07XG4gICAgICAgICAgcmV0dXJuIGFjY3VtO1xuICAgICAgICB9LCB7fSlcbiAgICA6IG1vZHM7XG5cbiAgY29uc3Qgc29ydGVkTW9kcyA9IE9iamVjdC5rZXlzKGxvYWRPcmRlcilcbiAgICAuZmlsdGVyKGlkID0+IGlzVmFsaWRTdWJNb2QoaWQsIGZpbHRlcmVkTW9kcykpXG4gICAgLnNvcnQoKGxocywgcmhzKSA9PiBsb2FkT3JkZXJbbGhzXS5wb3MgLSBsb2FkT3JkZXJbcmhzXS5wb3MpXG4gICAgLnJlZHVjZSgoYWNjdW0sIGl0ZXIsIGlkeCkgPT4ge1xuICAgICAgYWNjdW1baXRlcl0gPSB7XG4gICAgICAgIC4uLmxvYWRPcmRlcltpdGVyXSxcbiAgICAgICAgcG9zOiBpZHgsXG4gICAgICB9O1xuICAgICAgcmV0dXJuIGFjY3VtO1xuICAgIH0sIHt9KTtcbiAgcmV0dXJuIHNvcnRlZE1vZHM7XG59XG5cbmZ1bmN0aW9uIGlzVmFsaWRTdWJNb2Qoc3ViTW9kSWQ6IHN0cmluZywgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSkge1xuICBpZiAoT0ZGSUNJQUxfTU9EVUxFUy5oYXMoc3ViTW9kSWQpKSB7XG4gICAgLy8gb2ZmaWNpYWwgbW9kdWxlcyBhcmUgYWx3YXlzIGluY2x1ZGVkLlxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gVGhlIG1vZHMgbWFwIHNob3VsZCBvbmx5IGluY2x1ZGUgbW9kcyB0aGF0IGhhdmUgYmVlbiBpbmNsdWRlZCBpbiB0aGVcbiAgLy8gIGNvbGxlY3Rpb24gb3IgdGhpcyB3b24ndCB3b3JrLlxuICBjb25zdCBtb2RJZHMgPSBPYmplY3Qua2V5cyhtb2RzKTtcbiAgY29uc3Qgc3ViTW9kSWRzOiBzdHJpbmdbXSA9IG1vZElkcy5yZWR1Y2UoKGFjY3VtLCBpZCkgPT5cbiAgICBhY2N1bS5jb25jYXQoW2lkXSwgbW9kc1tpZF0/LlsnYXR0cmlidXRlcyddPy5bJ3N1Yk1vZElkcyddIHx8IFtdKSwgW10pO1xuXG4gIHJldHVybiBzdWJNb2RJZHMubWFwKGlkID0+IGlkLnRvTG93ZXJDYXNlKCkpLmluY2x1ZGVzKHN1Yk1vZElkLnRvTG93ZXJDYXNlKCkpO1xufVxuIl19