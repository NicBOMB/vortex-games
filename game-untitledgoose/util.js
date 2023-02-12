"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDiscoveryPath = exports.toBlue = void 0;
const bluebird_1 = __importDefault(require("bluebird"));
const vortex_api_1 = require("vortex-api");
const statics_1 = require("./statics");
function toBlue(func) {
    return (...args) => bluebird_1.default.resolve(func(...args));
}
exports.toBlue = toBlue;
function getDiscoveryPath(state) {
    const discovery = state?.settings?.gameMode?.discovered?.[statics_1.GAME_ID];
    if ((discovery === undefined) || (discovery.path === undefined)) {
        (0, vortex_api_1.log)('debug', 'untitledgoosegame was not discovered');
        return undefined;
    }
    return discovery.path;
}
exports.getDiscoveryPath = getDiscoveryPath;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsd0RBQWdDO0FBQ2hDLDJDQUF1QztBQUN2Qyx1Q0FBb0M7QUFJcEMsU0FBZ0IsTUFBTSxDQUFJLElBQW9DO0lBQzVELE9BQU8sQ0FBQyxHQUFHLElBQVcsRUFBRSxFQUFFLENBQUMsa0JBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUM3RCxDQUFDO0FBRkQsd0JBRUM7QUFFRCxTQUFnQixnQkFBZ0IsQ0FBQyxLQUFLO0lBQ3BDLE1BQU0sU0FBUyxHQUFHLEtBQUssRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxDQUFDLGlCQUFPLENBQUMsQ0FBQztJQUNuRSxJQUFJLENBQUMsU0FBUyxLQUFLLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsRUFBRTtRQUMvRCxJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLHNDQUFzQyxDQUFDLENBQUM7UUFDckQsT0FBTyxTQUFTLENBQUM7S0FDbEI7SUFFRCxPQUFPLFNBQVMsQ0FBQyxJQUFJLENBQUM7QUFDeEIsQ0FBQztBQVJELDRDQVFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7IGxvZywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuaW1wb3J0IHsgR0FNRV9JRCB9IGZyb20gJy4vc3RhdGljcyc7XG5cbi8vIFdlIF9zaG91bGRfIGp1c3QgZXhwb3J0IHRoaXMgZnJvbSB2b3J0ZXgtYXBpLCBidXQgSSBndWVzcyBpdCdzIG5vdCB3aXNlIHRvIG1ha2UgaXRcbi8vICBlYXN5IGZvciB1c2VycyBzaW5jZSB3ZSB3YW50IHRvIG1vdmUgYXdheSBmcm9tIGJsdWViaXJkIGluIHRoZSBmdXR1cmUgP1xuZXhwb3J0IGZ1bmN0aW9uIHRvQmx1ZTxUPihmdW5jOiAoLi4uYXJnczogYW55W10pID0+IFByb21pc2U8VD4pOiAoLi4uYXJnczogYW55W10pID0+IEJsdWViaXJkPFQ+IHtcbiAgcmV0dXJuICguLi5hcmdzOiBhbnlbXSkgPT4gQmx1ZWJpcmQucmVzb2x2ZShmdW5jKC4uLmFyZ3MpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERpc2NvdmVyeVBhdGgoc3RhdGUpIHtcbiAgY29uc3QgZGlzY292ZXJ5ID0gc3RhdGU/LnNldHRpbmdzPy5nYW1lTW9kZT8uZGlzY292ZXJlZD8uW0dBTUVfSURdO1xuICBpZiAoKGRpc2NvdmVyeSA9PT0gdW5kZWZpbmVkKSB8fCAoZGlzY292ZXJ5LnBhdGggPT09IHVuZGVmaW5lZCkpIHtcbiAgICBsb2coJ2RlYnVnJywgJ3VudGl0bGVkZ29vc2VnYW1lIHdhcyBub3QgZGlzY292ZXJlZCcpO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICByZXR1cm4gZGlzY292ZXJ5LnBhdGg7XG59XG4iXX0=