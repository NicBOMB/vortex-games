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
const actions_1 = require("../actions");
const TBI = vortex_api_1.ToolbarIcon;
class PriorityTypeButton extends vortex_api_1.ComponentEx {
    constructor() {
        super(...arguments);
        this.switch = () => {
            const current = this.props.priorityType;
            this.props.onSetPriorityType((current === 'position-based')
                ? 'prefix-based' : 'position-based');
        };
    }
    render() {
        const { t, priorityType } = this.props;
        return (React.createElement(TBI, { id: 'switch-priority-type-button', icon: 'sort-none', text: priorityType === 'position-based' ? t('To Prefix Based') : t('To Position Based'), tooltip: t('Changes priority assignment restrictions - prefix based is '
                + 'less restrictive and allows you to manually set priorities like '
                + '"5000", while position based will restrict priorities to their '
                + 'position in the load order page (in an incremental manner)'), onClick: this.switch }));
    }
}
function mapStateToProps(state, ownProps) {
    return {
        priorityType: state?.settings?.['witcher3']?.prioritytype ?? 'prefix-based',
    };
}
function mapDispatchToProps(dispatch) {
    return {
        onSetPriorityType: (type) => dispatch((0, actions_1.setPriorityType)(type)),
    };
}
exports.default = (0, react_i18next_1.withTranslation)(['common', 'witcher3'])((0, react_redux_1.connect)(mapStateToProps, mapDispatchToProps)(PriorityTypeButton));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHJpb3JpdHlUeXBlQnV0dG9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiUHJpb3JpdHlUeXBlQnV0dG9uLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsNkNBQStCO0FBQy9CLGlEQUFnRDtBQUNoRCw2Q0FBc0M7QUFDdEMsMkNBQW1FO0FBRW5FLHdDQUE2QztBQWE3QyxNQUFNLEdBQUcsR0FBRyx3QkFBa0IsQ0FBQztBQUMvQixNQUFNLGtCQUFtQixTQUFRLHdCQUF1QjtJQUF4RDs7UUFrQlUsV0FBTSxHQUFHLEdBQUcsRUFBRTtZQUNwQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQztZQUN4QyxJQUFJLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUMsT0FBTyxLQUFLLGdCQUFnQixDQUFDO2dCQUN6RCxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3pDLENBQUMsQ0FBQTtJQUNILENBQUM7SUF0QlEsTUFBTTtRQUNYLE1BQU0sRUFBRSxDQUFDLEVBQUUsWUFBWSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUV2QyxPQUFPLENBQ0wsb0JBQUMsR0FBRyxJQUNGLEVBQUUsRUFBQyw2QkFBNkIsRUFDaEMsSUFBSSxFQUFDLFdBQVcsRUFDaEIsSUFBSSxFQUFFLFlBQVksS0FBSyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxFQUN2RixPQUFPLEVBQUUsQ0FBQyxDQUFDLDZEQUE2RDtrQkFDOUQsa0VBQWtFO2tCQUNsRSxpRUFBaUU7a0JBQ2pFLDREQUE0RCxDQUFDLEVBQ3ZFLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxHQUNwQixDQUNILENBQUM7SUFDSixDQUFDO0NBT0Y7QUFFRCxTQUFTLGVBQWUsQ0FBQyxLQUFtQixFQUFFLFFBQWdCO0lBQzVELE9BQU87UUFDTCxZQUFZLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLFlBQVksSUFBSSxjQUFjO0tBQzVFLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBUyxrQkFBa0IsQ0FBQyxRQUFhO0lBQ3ZDLE9BQU87UUFDTCxpQkFBaUIsRUFBRSxDQUFDLElBQVksRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUEseUJBQWUsRUFBQyxJQUFJLENBQUMsQ0FBQztLQUNyRSxDQUFDO0FBQ0osQ0FBQztBQUVELGtCQUNFLElBQUEsK0JBQWUsRUFBQyxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUNyQyxJQUFBLHFCQUFPLEVBQUMsZUFBZSxFQUFFLGtCQUFrQixDQUFDLENBQUMsa0JBQXlCLENBQUMsQ0FDNUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHdpdGhUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xuaW1wb3J0IHsgY29ubmVjdCB9IGZyb20gJ3JlYWN0LXJlZHV4JztcbmltcG9ydCB7IENvbXBvbmVudEV4LCBUb29sYmFySWNvbiwgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IHsgc2V0UHJpb3JpdHlUeXBlIH0gZnJvbSAnLi4vYWN0aW9ucyc7XG5pbXBvcnQgeyBnZXRQcmlvcml0eVR5cGVCcmFuY2ggfSBmcm9tICcuLi9jb21tb24nO1xuaW1wb3J0IHsgUHJpb3JpdHlUeXBlIH0gZnJvbSAnLi4vcHJpb3JpdHlNYW5hZ2VyJztcblxuaW50ZXJmYWNlIElDb25uZWN0ZWRQcm9wcyB7XG4gIHByaW9yaXR5VHlwZTogUHJpb3JpdHlUeXBlO1xufVxuXG5pbnRlcmZhY2UgSUFjdGlvblByb3BzIHtcbiAgb25TZXRQcmlvcml0eVR5cGU6ICh0eXBlOiBzdHJpbmcpID0+IHZvaWQ7XG59XG5cbnR5cGUgSVByb3BzID0gSUNvbm5lY3RlZFByb3BzICYgSUFjdGlvblByb3BzO1xuY29uc3QgVEJJID0gVG9vbGJhckljb24gYXMgYW55O1xuY2xhc3MgUHJpb3JpdHlUeXBlQnV0dG9uIGV4dGVuZHMgQ29tcG9uZW50RXg8SVByb3BzLCB7fT4ge1xuICBwdWJsaWMgcmVuZGVyKCk6IEpTWC5FbGVtZW50IHtcbiAgICBjb25zdCB7IHQsIHByaW9yaXR5VHlwZSB9ID0gdGhpcy5wcm9wcztcblxuICAgIHJldHVybiAoXG4gICAgICA8VEJJXG4gICAgICAgIGlkPSdzd2l0Y2gtcHJpb3JpdHktdHlwZS1idXR0b24nXG4gICAgICAgIGljb249J3NvcnQtbm9uZSdcbiAgICAgICAgdGV4dD17cHJpb3JpdHlUeXBlID09PSAncG9zaXRpb24tYmFzZWQnID8gdCgnVG8gUHJlZml4IEJhc2VkJykgOiB0KCdUbyBQb3NpdGlvbiBCYXNlZCcpfVxuICAgICAgICB0b29sdGlwPXt0KCdDaGFuZ2VzIHByaW9yaXR5IGFzc2lnbm1lbnQgcmVzdHJpY3Rpb25zIC0gcHJlZml4IGJhc2VkIGlzICdcbiAgICAgICAgICAgICAgICArICdsZXNzIHJlc3RyaWN0aXZlIGFuZCBhbGxvd3MgeW91IHRvIG1hbnVhbGx5IHNldCBwcmlvcml0aWVzIGxpa2UgJ1xuICAgICAgICAgICAgICAgICsgJ1wiNTAwMFwiLCB3aGlsZSBwb3NpdGlvbiBiYXNlZCB3aWxsIHJlc3RyaWN0IHByaW9yaXRpZXMgdG8gdGhlaXIgJ1xuICAgICAgICAgICAgICAgICsgJ3Bvc2l0aW9uIGluIHRoZSBsb2FkIG9yZGVyIHBhZ2UgKGluIGFuIGluY3JlbWVudGFsIG1hbm5lciknKX1cbiAgICAgICAgb25DbGljaz17dGhpcy5zd2l0Y2h9XG4gICAgICAvPlxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIHN3aXRjaCA9ICgpID0+IHtcbiAgICBjb25zdCBjdXJyZW50ID0gdGhpcy5wcm9wcy5wcmlvcml0eVR5cGU7XG4gICAgdGhpcy5wcm9wcy5vblNldFByaW9yaXR5VHlwZSgoY3VycmVudCA9PT0gJ3Bvc2l0aW9uLWJhc2VkJylcbiAgICAgID8gJ3ByZWZpeC1iYXNlZCcgOiAncG9zaXRpb24tYmFzZWQnKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtYXBTdGF0ZVRvUHJvcHMoc3RhdGU6IHR5cGVzLklTdGF0ZSwgb3duUHJvcHM6IElQcm9wcyk6IElDb25uZWN0ZWRQcm9wcyB7XG4gIHJldHVybiB7XG4gICAgcHJpb3JpdHlUeXBlOiBzdGF0ZT8uc2V0dGluZ3M/Llsnd2l0Y2hlcjMnXT8ucHJpb3JpdHl0eXBlID8/ICdwcmVmaXgtYmFzZWQnLFxuICB9O1xufVxuXG5mdW5jdGlvbiBtYXBEaXNwYXRjaFRvUHJvcHMoZGlzcGF0Y2g6IGFueSk6IElBY3Rpb25Qcm9wcyB7XG4gIHJldHVybiB7XG4gICAgb25TZXRQcmlvcml0eVR5cGU6ICh0eXBlOiBzdHJpbmcpID0+IGRpc3BhdGNoKHNldFByaW9yaXR5VHlwZSh0eXBlKSksXG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0XG4gIHdpdGhUcmFuc2xhdGlvbihbJ2NvbW1vbicsICd3aXRjaGVyMyddKShcbiAgICBjb25uZWN0KG1hcFN0YXRlVG9Qcm9wcywgbWFwRGlzcGF0Y2hUb1Byb3BzKShQcmlvcml0eVR5cGVCdXR0b24gYXMgYW55KSxcbiAgKSBhcyBSZWFjdC5Db21wb25lbnRDbGFzczx7fT47XG4iXX0=