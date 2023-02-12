"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_bootstrap_1 = require("react-bootstrap");
const react_i18next_1 = require("react-i18next");
const react_redux_1 = require("react-redux");
const vortex_api_1 = require("vortex-api");
const actions_1 = require("./actions");
function Settings() {
    const useRecommendations = (0, react_redux_1.useSelector)((state) => state.settings['SDV']?.useRecommendations);
    const store = (0, react_redux_1.useStore)();
    const setUseRecommendations = react_1.default.useCallback((enabled) => {
        store.dispatch((0, actions_1.setRecommendations)(enabled));
    }, []);
    const { t } = (0, react_i18next_1.useTranslation)();
    return (react_1.default.createElement("form", null,
        react_1.default.createElement(react_bootstrap_1.FormGroup, { controlId: 'default-enable' },
            react_1.default.createElement(react_bootstrap_1.ControlLabel, null, t('Stardew Valley')),
            react_1.default.createElement(vortex_api_1.Toggle, { checked: useRecommendations, onToggle: setUseRecommendations }, t('Use recommendations from the mod manifests')),
            react_1.default.createElement(react_bootstrap_1.HelpBlock, null, t('If checked, when you install a mod for Stardew Valley you may get '
                + 'suggestions for installing further mods, required or recommended by it.'
                + 'This information could be wrong or incomplete so please carefully '
                + 'consider before accepting them.')))));
}
exports.default = Settings;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTZXR0aW5ncy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxrREFBMEI7QUFDMUIscURBQXFFO0FBQ3JFLGlEQUErQztBQUMvQyw2Q0FBb0Q7QUFDcEQsMkNBQW9DO0FBQ3BDLHVDQUErQztBQUUvQyxTQUFTLFFBQVE7SUFDZixNQUFNLGtCQUFrQixHQUFHLElBQUEseUJBQVcsRUFBQyxDQUFDLEtBQVUsRUFBRSxFQUFFLENBQ3BELEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztJQUU3QyxNQUFNLEtBQUssR0FBRyxJQUFBLHNCQUFRLEdBQUUsQ0FBQztJQUV6QixNQUFNLHFCQUFxQixHQUFHLGVBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQyxPQUFnQixFQUFFLEVBQUU7UUFDbkUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFBLDRCQUFrQixFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDOUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBRVAsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLElBQUEsOEJBQWMsR0FBRSxDQUFDO0lBRS9CLE9BQU8sQ0FDTDtRQUNFLDhCQUFDLDJCQUFTLElBQUMsU0FBUyxFQUFDLGdCQUFnQjtZQUNuQyw4QkFBQyw4QkFBWSxRQUFFLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFnQjtZQUNsRCw4QkFBQyxtQkFBTSxJQUNMLE9BQU8sRUFBRSxrQkFBa0IsRUFDM0IsUUFBUSxFQUFFLHFCQUFxQixJQUU5QixDQUFDLENBQUMsNENBQTRDLENBQUMsQ0FDekM7WUFDVCw4QkFBQywyQkFBUyxRQUNQLENBQUMsQ0FBQyxvRUFBb0U7a0JBQ2xFLHlFQUF5RTtrQkFDekUsb0VBQW9FO2tCQUNwRSxpQ0FBaUMsQ0FBQyxDQUM3QixDQUNGLENBQ1AsQ0FDUixDQUFDO0FBQ0osQ0FBQztBQUVELGtCQUFlLFFBQVEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBDb250cm9sTGFiZWwsIEZvcm1Hcm91cCwgSGVscEJsb2NrIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XG5pbXBvcnQgeyB1c2VTZWxlY3RvciwgdXNlU3RvcmUgfSBmcm9tICdyZWFjdC1yZWR1eCc7XG5pbXBvcnQgeyBUb2dnbGUgfSBmcm9tICd2b3J0ZXgtYXBpJztcbmltcG9ydCB7IHNldFJlY29tbWVuZGF0aW9ucyB9IGZyb20gJy4vYWN0aW9ucyc7XG5cbmZ1bmN0aW9uIFNldHRpbmdzKCkge1xuICBjb25zdCB1c2VSZWNvbW1lbmRhdGlvbnMgPSB1c2VTZWxlY3Rvcigoc3RhdGU6IGFueSkgPT5cbiAgICBzdGF0ZS5zZXR0aW5nc1snU0RWJ10/LnVzZVJlY29tbWVuZGF0aW9ucyk7XG5cbiAgY29uc3Qgc3RvcmUgPSB1c2VTdG9yZSgpO1xuXG4gIGNvbnN0IHNldFVzZVJlY29tbWVuZGF0aW9ucyA9IFJlYWN0LnVzZUNhbGxiYWNrKChlbmFibGVkOiBib29sZWFuKSA9PiB7XG4gICAgc3RvcmUuZGlzcGF0Y2goc2V0UmVjb21tZW5kYXRpb25zKGVuYWJsZWQpKTtcbiAgfSwgW10pO1xuICBcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGZvcm0+XG4gICAgICA8Rm9ybUdyb3VwIGNvbnRyb2xJZD0nZGVmYXVsdC1lbmFibGUnPlxuICAgICAgICA8Q29udHJvbExhYmVsPnt0KCdTdGFyZGV3IFZhbGxleScpfTwvQ29udHJvbExhYmVsPlxuICAgICAgICA8VG9nZ2xlXG4gICAgICAgICAgY2hlY2tlZD17dXNlUmVjb21tZW5kYXRpb25zfVxuICAgICAgICAgIG9uVG9nZ2xlPXtzZXRVc2VSZWNvbW1lbmRhdGlvbnN9XG4gICAgICAgID5cbiAgICAgICAgICB7dCgnVXNlIHJlY29tbWVuZGF0aW9ucyBmcm9tIHRoZSBtb2QgbWFuaWZlc3RzJyl9XG4gICAgICAgIDwvVG9nZ2xlPlxuICAgICAgICA8SGVscEJsb2NrPlxuICAgICAgICAgIHt0KCdJZiBjaGVja2VkLCB3aGVuIHlvdSBpbnN0YWxsIGEgbW9kIGZvciBTdGFyZGV3IFZhbGxleSB5b3UgbWF5IGdldCAnXG4gICAgICAgICAgICAgKyAnc3VnZ2VzdGlvbnMgZm9yIGluc3RhbGxpbmcgZnVydGhlciBtb2RzLCByZXF1aXJlZCBvciByZWNvbW1lbmRlZCBieSBpdC4nXG4gICAgICAgICAgICAgKyAnVGhpcyBpbmZvcm1hdGlvbiBjb3VsZCBiZSB3cm9uZyBvciBpbmNvbXBsZXRlIHNvIHBsZWFzZSBjYXJlZnVsbHkgJ1xuICAgICAgICAgICAgICsgJ2NvbnNpZGVyIGJlZm9yZSBhY2NlcHRpbmcgdGhlbS4nKX1cbiAgICAgICAgPC9IZWxwQmxvY2s+XG4gICAgICA8L0Zvcm1Hcm91cD5cbiAgICA8L2Zvcm0+XG4gICk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNldHRpbmdzO1xuIl19