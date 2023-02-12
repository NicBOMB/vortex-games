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
const React = __importStar(require("react"));
const react_i18next_1 = require("react-i18next");
const react_redux_1 = require("react-redux");
const vortex_api_1 = require("vortex-api");
function Settings(props) {
    const { t, autoSortOnDeploy, onSetSortOnDeploy, profileId } = props;
    const onSetSort = React.useCallback((value) => {
        if (profileId !== undefined) {
            onSetSortOnDeploy(profileId, value);
        }
    }, [onSetSortOnDeploy]);
    return (React.createElement("div", null,
        React.createElement(vortex_api_1.Toggle, { checked: autoSortOnDeploy, onToggle: onSetSort },
            t('Sort Bannerlord mods automatically on deployment'),
            React.createElement(vortex_api_1.More, { id: 'mnb2-sort-setting', name: t('Running sort on deploy') }, t('Any time you deploy, Vortex will attempt to automatically sort your load order '
                + 'for you to reduce game crashes caused by incorrect module order.\n\n'
                + 'Important: Please ensure to lock any load order entries you wish to stop from '
                + 'shifting positions.')))));
}
function mapStateToProps(state) {
    const profileId = vortex_api_1.selectors.activeProfile(state)?.id;
    return {
        profileId,
        autoSortOnDeploy: (state?.settings?.['mountandblade2']?.sortOnDeploy?.[profileId] ?? true),
    };
}
exports.default = (0, react_i18next_1.withTranslation)(['common', 'mnb2-settings'])((0, react_redux_1.connect)(mapStateToProps)(Settings));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTZXR0aW5ncy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLDZDQUErQjtBQUMvQixpREFBZ0Q7QUFDaEQsNkNBQXNDO0FBQ3RDLDJDQUE0RDtBQWM1RCxTQUFTLFFBQVEsQ0FBQyxLQUFhO0lBQzdCLE1BQU0sRUFBRSxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsaUJBQWlCLEVBQUUsU0FBUyxFQUFFLEdBQUcsS0FBSyxDQUFDO0lBQ3BFLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUM1QyxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7WUFDM0IsaUJBQWlCLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ3JDO0lBQ0gsQ0FBQyxFQUFFLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO0lBRXhCLE9BQU8sQ0FDTDtRQUNFLG9CQUFDLG1CQUFNLElBQ0wsT0FBTyxFQUFFLGdCQUFnQixFQUN6QixRQUFRLEVBQUUsU0FBUztZQUVsQixDQUFDLENBQUMsa0RBQWtELENBQUM7WUFDdEQsb0JBQUMsaUJBQUksSUFBQyxFQUFFLEVBQUMsbUJBQW1CLEVBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxJQUMzRCxDQUFDLENBQUMsaUZBQWlGO2tCQUNqRixzRUFBc0U7a0JBQ3RFLGdGQUFnRjtrQkFDaEYscUJBQXFCLENBQUMsQ0FDcEIsQ0FDQSxDQUNMLENBQ1AsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FBQyxLQUFtQjtJQUMxQyxNQUFNLFNBQVMsR0FBVyxzQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLENBQUM7SUFDN0QsT0FBTztRQUNMLFNBQVM7UUFDVCxnQkFBZ0IsRUFBRSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLFlBQVksRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLElBQUksQ0FBQztLQUMzRixDQUFDO0FBQ0osQ0FBQztBQUVELGtCQUFlLElBQUEsK0JBQWUsRUFBQyxDQUFDLFFBQVEsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUN6RCxJQUFBLHFCQUFPLEVBQUMsZUFBZSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQ25DLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgSTE4bmV4dCBmcm9tICdpMThuZXh0JztcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHdpdGhUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xuaW1wb3J0IHsgY29ubmVjdCB9IGZyb20gJ3JlYWN0LXJlZHV4JztcbmltcG9ydCB7IE1vcmUsIFRvZ2dsZSwgc2VsZWN0b3JzLCB0eXBlcyB9IGZyb20gJ3ZvcnRleC1hcGknO1xuXG5pbnRlcmZhY2UgSUJhc2VQcm9wcyB7XG4gIHQ6IHR5cGVvZiBJMThuZXh0LnQ7XG4gIG9uU2V0U29ydE9uRGVwbG95OiAocHJvZmlsZUlkOiBzdHJpbmcsIHNvcnQ6IGJvb2xlYW4pID0+IHZvaWQ7XG59XG5cbmludGVyZmFjZSBJQ29ubmVjdGVkUHJvcHMge1xuICBwcm9maWxlSWQ6IHN0cmluZztcbiAgYXV0b1NvcnRPbkRlcGxveTogYm9vbGVhbjtcbn1cblxudHlwZSBJUHJvcHMgPSBJQmFzZVByb3BzICYgSUNvbm5lY3RlZFByb3BzO1xuXG5mdW5jdGlvbiBTZXR0aW5ncyhwcm9wczogSVByb3BzKSB7XG4gIGNvbnN0IHsgdCwgYXV0b1NvcnRPbkRlcGxveSwgb25TZXRTb3J0T25EZXBsb3ksIHByb2ZpbGVJZCB9ID0gcHJvcHM7XG4gIGNvbnN0IG9uU2V0U29ydCA9IFJlYWN0LnVzZUNhbGxiYWNrKCh2YWx1ZSkgPT4ge1xuICAgIGlmIChwcm9maWxlSWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgb25TZXRTb3J0T25EZXBsb3kocHJvZmlsZUlkLCB2YWx1ZSk7XG4gICAgfVxuICB9LCBbb25TZXRTb3J0T25EZXBsb3ldKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXY+XG4gICAgICA8VG9nZ2xlXG4gICAgICAgIGNoZWNrZWQ9e2F1dG9Tb3J0T25EZXBsb3l9XG4gICAgICAgIG9uVG9nZ2xlPXtvblNldFNvcnR9XG4gICAgICA+XG4gICAgICAgIHt0KCdTb3J0IEJhbm5lcmxvcmQgbW9kcyBhdXRvbWF0aWNhbGx5IG9uIGRlcGxveW1lbnQnKX1cbiAgICAgICAgPE1vcmUgaWQ9J21uYjItc29ydC1zZXR0aW5nJyBuYW1lPXt0KCdSdW5uaW5nIHNvcnQgb24gZGVwbG95Jyl9PlxuICAgICAgICAgIHt0KCdBbnkgdGltZSB5b3UgZGVwbG95LCBWb3J0ZXggd2lsbCBhdHRlbXB0IHRvIGF1dG9tYXRpY2FsbHkgc29ydCB5b3VyIGxvYWQgb3JkZXIgJ1xuICAgICAgICAgICArICdmb3IgeW91IHRvIHJlZHVjZSBnYW1lIGNyYXNoZXMgY2F1c2VkIGJ5IGluY29ycmVjdCBtb2R1bGUgb3JkZXIuXFxuXFxuJ1xuICAgICAgICAgICArICdJbXBvcnRhbnQ6IFBsZWFzZSBlbnN1cmUgdG8gbG9jayBhbnkgbG9hZCBvcmRlciBlbnRyaWVzIHlvdSB3aXNoIHRvIHN0b3AgZnJvbSAnXG4gICAgICAgICAgICsgJ3NoaWZ0aW5nIHBvc2l0aW9ucy4nKX1cbiAgICAgICAgPC9Nb3JlPlxuICAgICAgPC9Ub2dnbGU+XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbmZ1bmN0aW9uIG1hcFN0YXRlVG9Qcm9wcyhzdGF0ZTogdHlwZXMuSVN0YXRlKTogSUNvbm5lY3RlZFByb3BzIHtcbiAgY29uc3QgcHJvZmlsZUlkOiBzdHJpbmcgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk/LmlkO1xuICByZXR1cm4ge1xuICAgIHByb2ZpbGVJZCxcbiAgICBhdXRvU29ydE9uRGVwbG95OiAoc3RhdGU/LnNldHRpbmdzPy5bJ21vdW50YW5kYmxhZGUyJ10/LnNvcnRPbkRlcGxveT8uW3Byb2ZpbGVJZF0gPz8gdHJ1ZSksXG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IHdpdGhUcmFuc2xhdGlvbihbJ2NvbW1vbicsICdtbmIyLXNldHRpbmdzJ10pKFxuICBjb25uZWN0KG1hcFN0YXRlVG9Qcm9wcykoU2V0dGluZ3MpXG4pO1xuIl19