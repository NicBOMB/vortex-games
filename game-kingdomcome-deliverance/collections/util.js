"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModId = exports.genCollectionLoadOrder = exports.isModInCollection = exports.isValidMod = void 0;
const vortex_api_1 = require("vortex-api");
const util_1 = require("../util");
function isValidMod(mod) {
    return (mod !== undefined)
        && (mod.type !== 'collection');
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
    const sortedMods = loadOrder.filter(loId => {
        const modId = getModId(mods, loId);
        return (collection !== undefined)
            ? isValidMod(mods[modId]) && (isModInCollection(collection, mods[modId]))
            : isValidMod(mods[modId]);
    });
    return sortedMods;
}
exports.genCollectionLoadOrder = genCollectionLoadOrder;
function getModId(mods, loId) {
    return Object.keys(mods).find(modId => (0, util_1.transformId)(modId) === loId);
}
exports.getModId = getModId;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsMkNBQXlDO0FBRXpDLGtDQUFzQztBQUV0QyxTQUFnQixVQUFVLENBQUMsR0FBZTtJQUN4QyxPQUFPLENBQUMsR0FBRyxLQUFLLFNBQVMsQ0FBQztXQUNyQixDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssWUFBWSxDQUFDLENBQUM7QUFDbkMsQ0FBQztBQUhELGdDQUdDO0FBRUQsU0FBZ0IsaUJBQWlCLENBQUMsYUFBeUIsRUFBRSxHQUFlO0lBQzFFLElBQUksYUFBYSxDQUFDLEtBQUssS0FBSyxTQUFTLEVBQUU7UUFDckMsT0FBTyxLQUFLLENBQUM7S0FDZDtJQUVELE9BQU8sYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FDckMsaUJBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEtBQUssU0FBUyxDQUFDO0FBQzlELENBQUM7QUFQRCw4Q0FPQztBQUVELFNBQWdCLHNCQUFzQixDQUNwQyxTQUFtQixFQUNuQixJQUFxQyxFQUNyQyxVQUF1QjtJQUV2QixNQUFNLFVBQVUsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ3pDLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbkMsT0FBTyxDQUFDLFVBQVUsS0FBSyxTQUFTLENBQUM7WUFDL0IsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUN6RSxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQzlCLENBQUMsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxVQUFVLENBQUM7QUFDcEIsQ0FBQztBQVpELHdEQVlDO0FBRUQsU0FBZ0IsUUFBUSxDQUFDLElBQXFDLEVBQUUsSUFBWTtJQUMxRSxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBQSxrQkFBVyxFQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDO0FBQ3RFLENBQUM7QUFGRCw0QkFFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IHRyYW5zZm9ybUlkIH0gZnJvbSAnLi4vdXRpbCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1ZhbGlkTW9kKG1vZDogdHlwZXMuSU1vZCkge1xuICByZXR1cm4gKG1vZCAhPT0gdW5kZWZpbmVkKVxuICAgICYmIChtb2QudHlwZSAhPT0gJ2NvbGxlY3Rpb24nKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTW9kSW5Db2xsZWN0aW9uKGNvbGxlY3Rpb25Nb2Q6IHR5cGVzLklNb2QsIG1vZDogdHlwZXMuSU1vZCkge1xuICBpZiAoY29sbGVjdGlvbk1vZC5ydWxlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIGNvbGxlY3Rpb25Nb2QucnVsZXMuZmluZChydWxlID0+XG4gICAgdXRpbC50ZXN0TW9kUmVmZXJlbmNlKG1vZCwgcnVsZS5yZWZlcmVuY2UpKSAhPT0gdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2VuQ29sbGVjdGlvbkxvYWRPcmRlcihcbiAgbG9hZE9yZGVyOiBzdHJpbmdbXSxcbiAgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSxcbiAgY29sbGVjdGlvbj86IHR5cGVzLklNb2Rcbik6IHN0cmluZ1tdIHtcbiAgY29uc3Qgc29ydGVkTW9kcyA9IGxvYWRPcmRlci5maWx0ZXIobG9JZCA9PiB7XG4gICAgY29uc3QgbW9kSWQgPSBnZXRNb2RJZChtb2RzLCBsb0lkKTtcbiAgICByZXR1cm4gKGNvbGxlY3Rpb24gIT09IHVuZGVmaW5lZClcbiAgICAgID8gaXNWYWxpZE1vZChtb2RzW21vZElkXSkgJiYgKGlzTW9kSW5Db2xsZWN0aW9uKGNvbGxlY3Rpb24sIG1vZHNbbW9kSWRdKSlcbiAgICAgIDogaXNWYWxpZE1vZChtb2RzW21vZElkXSk7XG4gIH0pO1xuICByZXR1cm4gc29ydGVkTW9kcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1vZElkKG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0sIGxvSWQ6IHN0cmluZykge1xuICByZXR1cm4gT2JqZWN0LmtleXMobW9kcykuZmluZChtb2RJZCA9PiB0cmFuc2Zvcm1JZChtb2RJZCkgPT09IGxvSWQpO1xufVxuIl19