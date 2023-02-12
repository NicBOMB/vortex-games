"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const vortex_api_1 = require("vortex-api");
const iconMap = {
    broken: 'feedback-error',
    obsolete: 'feedback-error',
    abandoned: 'feedback-warning',
    unofficial: 'feedback-warning',
    workaround: 'feedback-warning',
    unknown: 'feedback-info',
    optional: 'feedback-success',
    ok: 'feedback-success',
};
function CompatibilityIcon(props) {
    const { t, mod } = props;
    const version = mod.attributes?.manifestVersion
        ?? mod.attributes?.version;
    if ((mod.attributes?.compatibilityUpdate !== undefined)
        && (mod.attributes?.compatibilityUpdate !== version)) {
        return (react_1.default.createElement(vortex_api_1.tooltip.Icon, { name: 'auto-update', tooltip: t('SMAPI suggests updating this mod to {{update}}. '
                + 'Please use Vortex to check for mod updates', {
                replace: {
                    update: mod.attributes?.compatibilityUpdate,
                },
            }) }));
    }
    const status = (mod.attributes?.compatibilityStatus ?? 'unknown').toLowerCase();
    const icon = iconMap[status] ?? iconMap['unknown'];
    return (react_1.default.createElement(vortex_api_1.tooltip.Icon, { name: icon, className: `sdv-compatibility-${status}`, tooltip: mod.attributes?.compatibilityMessage ?? t('No information') }));
}
exports.default = CompatibilityIcon;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29tcGF0aWJpbGl0eUljb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJDb21wYXRpYmlsaXR5SWNvbi50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxrREFBMEI7QUFDMUIsMkNBQTRDO0FBUzVDLE1BQU0sT0FBTyxHQUF3QztJQUNuRCxNQUFNLEVBQUUsZ0JBQWdCO0lBQ3hCLFFBQVEsRUFBRSxnQkFBZ0I7SUFDMUIsU0FBUyxFQUFFLGtCQUFrQjtJQUM3QixVQUFVLEVBQUUsa0JBQWtCO0lBQzlCLFVBQVUsRUFBRSxrQkFBa0I7SUFDOUIsT0FBTyxFQUFFLGVBQWU7SUFDeEIsUUFBUSxFQUFFLGtCQUFrQjtJQUM1QixFQUFFLEVBQUUsa0JBQWtCO0NBQ3ZCLENBQUM7QUFFRixTQUFTLGlCQUFpQixDQUFDLEtBQThCO0lBQ3ZELE1BQU0sRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsS0FBSyxDQUFDO0lBRXpCLE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxVQUFVLEVBQUUsZUFBZTtXQUMvQixHQUFHLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQztJQUV4QyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxtQkFBbUIsS0FBSyxTQUFTLENBQUM7V0FDaEQsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLG1CQUFtQixLQUFLLE9BQU8sQ0FBQyxFQUFFO1FBQ3hELE9BQU8sQ0FDTCw4QkFBQyxvQkFBTyxDQUFDLElBQUksSUFDWCxJQUFJLEVBQUMsYUFBYSxFQUNsQixPQUFPLEVBQUUsQ0FBQyxDQUFDLGtEQUFrRDtrQkFDakQsNENBQTRDLEVBQUU7Z0JBQ3hELE9BQU8sRUFBRTtvQkFDUCxNQUFNLEVBQUUsR0FBRyxDQUFDLFVBQVUsRUFBRSxtQkFBbUI7aUJBQzVDO2FBQ0YsQ0FBQyxHQUNGLENBQ0gsQ0FBQztLQUNIO0lBRUQsTUFBTSxNQUFNLEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLG1CQUFtQixJQUFJLFNBQVMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ2hGLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDbkQsT0FBTyxDQUNMLDhCQUFDLG9CQUFPLENBQUMsSUFBSSxJQUNYLElBQUksRUFBRSxJQUFJLEVBQ1YsU0FBUyxFQUFFLHFCQUFxQixNQUFNLEVBQUUsRUFDeEMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxVQUFVLEVBQUUsb0JBQW9CLElBQUksQ0FBQyxDQUFDLGdCQUFnQixDQUFDLEdBQ3BFLENBQ0gsQ0FBQztBQUNKLENBQUM7QUFFRCxrQkFBZSxpQkFBaUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB0b29sdGlwLCB0eXBlcyB9IGZyb20gJ3ZvcnRleC1hcGknO1xuaW1wb3J0IHsgQ29tcGF0aWJpbGl0eVN0YXR1cyB9IGZyb20gJy4vdHlwZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIElDb21wYXRpYmlsaXR5SWNvblByb3BzIHtcbiAgdDogdHlwZXMuVEZ1bmN0aW9uLFxuICBtb2Q6IHR5cGVzLklNb2QsXG4gIGRldGFpbENlbGw6IGJvb2xlYW4sXG59XG5cbmNvbnN0IGljb25NYXA6IFJlY29yZDxDb21wYXRpYmlsaXR5U3RhdHVzLCBzdHJpbmc+ID0ge1xuICBicm9rZW46ICdmZWVkYmFjay1lcnJvcicsXG4gIG9ic29sZXRlOiAnZmVlZGJhY2stZXJyb3InLFxuICBhYmFuZG9uZWQ6ICdmZWVkYmFjay13YXJuaW5nJyxcbiAgdW5vZmZpY2lhbDogJ2ZlZWRiYWNrLXdhcm5pbmcnLFxuICB3b3JrYXJvdW5kOiAnZmVlZGJhY2std2FybmluZycsXG4gIHVua25vd246ICdmZWVkYmFjay1pbmZvJyxcbiAgb3B0aW9uYWw6ICdmZWVkYmFjay1zdWNjZXNzJyxcbiAgb2s6ICdmZWVkYmFjay1zdWNjZXNzJyxcbn07XG5cbmZ1bmN0aW9uIENvbXBhdGliaWxpdHlJY29uKHByb3BzOiBJQ29tcGF0aWJpbGl0eUljb25Qcm9wcykge1xuICBjb25zdCB7IHQsIG1vZCB9ID0gcHJvcHM7XG5cbiAgY29uc3QgdmVyc2lvbiA9IG1vZC5hdHRyaWJ1dGVzPy5tYW5pZmVzdFZlcnNpb25cbiAgICAgICAgICAgICAgID8/IG1vZC5hdHRyaWJ1dGVzPy52ZXJzaW9uO1xuXG4gIGlmICgobW9kLmF0dHJpYnV0ZXM/LmNvbXBhdGliaWxpdHlVcGRhdGUgIT09IHVuZGVmaW5lZClcbiAgICAgICYmIChtb2QuYXR0cmlidXRlcz8uY29tcGF0aWJpbGl0eVVwZGF0ZSAhPT0gdmVyc2lvbikpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPHRvb2x0aXAuSWNvblxuICAgICAgICBuYW1lPSdhdXRvLXVwZGF0ZSdcbiAgICAgICAgdG9vbHRpcD17dCgnU01BUEkgc3VnZ2VzdHMgdXBkYXRpbmcgdGhpcyBtb2QgdG8ge3t1cGRhdGV9fS4gJ1xuICAgICAgICAgICAgICAgICAgKyAnUGxlYXNlIHVzZSBWb3J0ZXggdG8gY2hlY2sgZm9yIG1vZCB1cGRhdGVzJywge1xuICAgICAgICAgIHJlcGxhY2U6IHtcbiAgICAgICAgICAgIHVwZGF0ZTogbW9kLmF0dHJpYnV0ZXM/LmNvbXBhdGliaWxpdHlVcGRhdGUsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSl9XG4gICAgICAvPlxuICAgICk7XG4gIH1cblxuICBjb25zdCBzdGF0dXMgPSAobW9kLmF0dHJpYnV0ZXM/LmNvbXBhdGliaWxpdHlTdGF0dXMgPz8gJ3Vua25vd24nKS50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBpY29uID0gaWNvbk1hcFtzdGF0dXNdID8/IGljb25NYXBbJ3Vua25vd24nXTtcbiAgcmV0dXJuIChcbiAgICA8dG9vbHRpcC5JY29uXG4gICAgICBuYW1lPXtpY29ufVxuICAgICAgY2xhc3NOYW1lPXtgc2R2LWNvbXBhdGliaWxpdHktJHtzdGF0dXN9YH1cbiAgICAgIHRvb2x0aXA9e21vZC5hdHRyaWJ1dGVzPy5jb21wYXRpYmlsaXR5TWVzc2FnZSA/PyB0KCdObyBpbmZvcm1hdGlvbicpfVxuICAgIC8+XG4gICk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IENvbXBhdGliaWxpdHlJY29uO1xuIl19