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
const react_bootstrap_1 = require("react-bootstrap");
const react_i18next_1 = require("react-i18next");
const react_redux_1 = require("react-redux");
const vortex_api_1 = require("vortex-api");
const constants_1 = require("../constants");
const loadorder_1 = require("../loadorder");
const NAMESPACE = 'game-morrowind';
class MorrowindCollectionsDataView extends vortex_api_1.ComponentEx {
    constructor(props) {
        super(props);
        this.renderLoadOrderEditInfo = () => {
            const { t } = this.props;
            return (React.createElement(vortex_api_1.FlexLayout, { type: 'row', id: 'collection-edit-loadorder-edit-info-container' },
                React.createElement(vortex_api_1.FlexLayout.Fixed, { className: 'loadorder-edit-info-icon' },
                    React.createElement(vortex_api_1.Icon, { name: 'dialog-info' })),
                React.createElement(vortex_api_1.FlexLayout.Fixed, { className: 'collection-edit-loadorder-edit-info' },
                    t('You can make changes to this data from the '),
                    React.createElement("a", { className: 'fake-link', onClick: this.openLoadOrderPage, title: t('Go to Load Order Page') }, t('Load Order page.')),
                    t(' If you believe a load order entry is missing, please ensure the '
                        + 'relevant mod is enabled and has been added to the collection.'))));
        };
        this.openLoadOrderPage = () => {
            this.props.api.events.emit('show-main-page', 'file-based-loadorder');
        };
        this.renderOpenLOButton = () => {
            const { t } = this.props;
            return (React.createElement(react_bootstrap_1.Button, { id: 'btn-more-mods', className: 'collection-add-mods-btn', onClick: this.openLoadOrderPage, bsStyle: 'ghost' }, t('Open Load Order Page')));
        };
        this.renderPlaceholder = () => {
            const { t } = this.props;
            return (React.createElement(vortex_api_1.EmptyPlaceholder, { icon: 'sort-none', text: t('You have no load order entries (for the current mods in the collection)'), subtext: this.renderOpenLOButton() }));
        };
        this.renderModEntry = (loEntry, idx) => {
            const key = loEntry.id + JSON.stringify(loEntry);
            const classes = ['load-order-entry', 'collection-tab'];
            return (React.createElement(react_bootstrap_1.ListGroupItem, { key: key, className: classes.join(' ') },
                React.createElement(vortex_api_1.FlexLayout, { type: 'row' },
                    React.createElement("p", { className: 'load-order-index' }, idx),
                    React.createElement("p", null, loEntry.name))));
        };
        this.initState({
            sortedMods: [],
        });
    }
    componentDidMount() {
        this.updateSortedMods();
    }
    componentDidUpdate(prevProps, prevState) {
        if (JSON.stringify(this.state.sortedMods) !== JSON.stringify(this.props.loadOrder)) {
            this.updateSortedMods();
        }
    }
    render() {
        const { t } = this.props;
        const { sortedMods } = this.state;
        return (!!sortedMods && Object.keys(sortedMods).length !== 0)
            ? (React.createElement("div", { style: { overflow: 'auto' } },
                React.createElement("h4", null, t('Load Order')),
                React.createElement("p", null, t('This is a snapshot of the load order information that '
                    + 'will be exported with this collection.')),
                this.renderLoadOrderEditInfo(),
                React.createElement(react_bootstrap_1.ListGroup, { id: 'collections-load-order-list' }, sortedMods.map((entry, idx) => this.renderModEntry(entry, idx))))) : this.renderPlaceholder();
    }
    updateSortedMods() {
        const includedModIds = (this.props.collection?.rules || []).map(rule => rule.reference.id);
        const mods = Object.keys(this.props.mods).reduce((accum, iter) => {
            if (includedModIds.includes(iter)) {
                accum[iter] = this.props.mods[iter];
            }
            return accum;
        }, {});
        (0, loadorder_1.deserializeLoadOrder)(this.props.api, mods)
            .then(lo => {
            const filtered = lo.filter(entry => (constants_1.NATIVE_PLUGINS.includes(entry.id) || entry.modId !== undefined));
            this.nextState.sortedMods = filtered;
        });
    }
}
const empty = [];
function mapStateToProps(state, ownProps) {
    const profile = vortex_api_1.selectors.activeProfile(state) || undefined;
    let loadOrder = [];
    if (!!profile?.gameId) {
        loadOrder = state?.persistent?.loadOrder?.[profile.id] ?? [];
    }
    return {
        gameId: profile?.gameId,
        loadOrder,
        mods: state?.persistent?.mods?.[profile.gameId] ?? {},
        profile,
    };
}
function mapDispatchToProps(dispatch) {
    return {};
}
exports.default = (0, react_i18next_1.withTranslation)(['common', NAMESPACE])((0, react_redux_1.connect)(mapStateToProps, mapDispatchToProps)(MorrowindCollectionsDataView));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9ycm93aW5kQ29sbGVjdGlvbnNEYXRhVmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIk1vcnJvd2luZENvbGxlY3Rpb25zRGF0YVZpZXcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSw2Q0FBK0I7QUFDL0IscURBQW1FO0FBQ25FLGlEQUFpRTtBQUNqRSw2Q0FBc0M7QUFFdEMsMkNBQzZDO0FBSTdDLDRDQUE4QztBQUU5Qyw0Q0FBb0Q7QUFFcEQsTUFBTSxTQUFTLEdBQVcsZ0JBQWdCLENBQUM7QUF1QjNDLE1BQU0sNEJBQTZCLFNBQVEsd0JBQW9DO0lBQzdFLFlBQVksS0FBYTtRQUN2QixLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFrRFAsNEJBQXVCLEdBQUcsR0FBRyxFQUFFO1lBQ3JDLE1BQU0sRUFBRSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ3pCLE9BQU8sQ0FDTCxvQkFBQyx1QkFBVSxJQUFDLElBQUksRUFBQyxLQUFLLEVBQUMsRUFBRSxFQUFDLCtDQUErQztnQkFDdkUsb0JBQUMsdUJBQVUsQ0FBQyxLQUFLLElBQUMsU0FBUyxFQUFDLDBCQUEwQjtvQkFDcEQsb0JBQUMsaUJBQUksSUFBQyxJQUFJLEVBQUMsYUFBYSxHQUFFLENBQ1Q7Z0JBQ25CLG9CQUFDLHVCQUFVLENBQUMsS0FBSyxJQUFDLFNBQVMsRUFBQyxxQ0FBcUM7b0JBQzlELENBQUMsQ0FBQyw2Q0FBNkMsQ0FBQztvQkFDakQsMkJBQ0UsU0FBUyxFQUFDLFdBQVcsRUFDckIsT0FBTyxFQUFFLElBQUksQ0FBQyxpQkFBaUIsRUFDL0IsS0FBSyxFQUFFLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxJQUVoQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FDcEI7b0JBQ0gsQ0FBQyxDQUFDLG1FQUFtRTswQkFDcEUsK0RBQStELENBQUMsQ0FDakQsQ0FDUixDQUNkLENBQUM7UUFDSixDQUFD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QVMsQ0FBQyxVQUFVLEdBQUcsUUFBUSxDQUFDO1FBQ3ZDLENBQUMsQ0FBQyxDQUFBO0lBQ04sQ0FBQztDQWtFRjtBQUVELE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQztBQUNqQixTQUFTLGVBQWUsQ0FBQyxLQUFtQixFQUFFLFFBQWdCO0lBQzVELE1BQU0sT0FBTyxHQUFHLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLFNBQVMsQ0FBQztJQUM1RCxJQUFJLFNBQVMsR0FBc0IsRUFBRSxDQUFDO0lBQ3RDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUU7UUFDckIsU0FBUyxHQUFHLEtBQUssRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztLQUM5RDtJQUVELE9BQU87UUFDTCxNQUFNLEVBQUUsT0FBTyxFQUFFLE1BQU07UUFDdkIsU0FBUztRQUNULElBQUksRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFO1FBQ3JELE9BQU87S0FDUixDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsa0JBQWtCLENBQUMsUUFBYTtJQUN2QyxPQUFPLEVBQUUsQ0FBQztBQUNaLENBQUM7QUFFRCxrQkFBZSxJQUFBLCtCQUFlLEVBQUMsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FDbkQsSUFBQSxxQkFBTyxFQUFDLGVBQWUsRUFBRSxrQkFBa0IsQ0FBQyxDQUMxQyw0QkFBNEIsQ0FBUSxDQUErRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgQnV0dG9uLCBMaXN0R3JvdXAsIExpc3RHcm91cEl0ZW0gfSBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xuaW1wb3J0IHsgV2l0aFRyYW5zbGF0aW9uLCB3aXRoVHJhbnNsYXRpb24gfSBmcm9tICdyZWFjdC1pMThuZXh0JztcbmltcG9ydCB7IGNvbm5lY3QgfSBmcm9tICdyZWFjdC1yZWR1eCc7XG5cbmltcG9ydCB7IENvbXBvbmVudEV4LCBFbXB0eVBsYWNlaG9sZGVyLCBGbGV4TGF5b3V0LCBJY29uLFxuICBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IElFeHRlbmRlZEludGVyZmFjZVByb3BzLCBJTG9hZE9yZGVyRW50cnkgfSBmcm9tICcuLi90eXBlcy90eXBlcyc7XG5cbmltcG9ydCB7IE5BVElWRV9QTFVHSU5TIH0gZnJvbSAnLi4vY29uc3RhbnRzJztcblxuaW1wb3J0IHsgZGVzZXJpYWxpemVMb2FkT3JkZXIgfSBmcm9tICcuLi9sb2Fkb3JkZXInO1xuXG5jb25zdCBOQU1FU1BBQ0U6IHN0cmluZyA9ICdnYW1lLW1vcnJvd2luZCc7XG5cbmludGVyZmFjZSBJQmFzZVN0YXRlIHtcbiAgc29ydGVkTW9kczogSUxvYWRPcmRlckVudHJ5W107XG59XG5cbmludGVyZmFjZSBJQmFzZVByb3BzIHtcbiAgYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xufVxuXG5pbnRlcmZhY2UgSUNvbm5lY3RlZFByb3BzIHtcbiAgZ2FtZUlkOiBzdHJpbmc7XG4gIG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH07XG4gIGxvYWRPcmRlcjogSUxvYWRPcmRlckVudHJ5W107XG4gIHByb2ZpbGU6IHR5cGVzLklQcm9maWxlO1xufVxuXG5pbnRlcmZhY2UgSUFjdGlvblByb3BzIHtcbn1cblxudHlwZSBJUHJvcHMgPSBJQmFzZVByb3BzICYgSUFjdGlvblByb3BzICYgSUV4dGVuZGVkSW50ZXJmYWNlUHJvcHMgJiBJQ29ubmVjdGVkUHJvcHM7XG50eXBlIElDb21wb25lbnRTdGF0ZSA9IElCYXNlU3RhdGU7XG5cbmNsYXNzIE1vcnJvd2luZENvbGxlY3Rpb25zRGF0YVZpZXcgZXh0ZW5kcyBDb21wb25lbnRFeDxJUHJvcHMsIElDb21wb25lbnRTdGF0ZT4ge1xuICBjb25zdHJ1Y3Rvcihwcm9wczogSVByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpO1xuICAgIHRoaXMuaW5pdFN0YXRlKHtcbiAgICAgIHNvcnRlZE1vZHM6IFtdLFxuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgIHRoaXMudXBkYXRlU29ydGVkTW9kcygpO1xuICB9XG5cbiAgcHVibGljIGNvbXBvbmVudERpZFVwZGF0ZShwcmV2UHJvcHM6IElQcm9wcywgcHJldlN0YXRlOiBJQmFzZVN0YXRlKTogdm9pZCB7XG4gICAgaWYgKEpTT04uc3RyaW5naWZ5KHRoaXMuc3RhdGUuc29ydGVkTW9kcykgIT09IEpTT04uc3RyaW5naWZ5KHRoaXMucHJvcHMubG9hZE9yZGVyKSl7XG4gICAgICB0aGlzLnVwZGF0ZVNvcnRlZE1vZHMoKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgcmVuZGVyKCk6IEpTWC5FbGVtZW50IHtcbiAgICBjb25zdCB7IHQgfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3QgeyBzb3J0ZWRNb2RzIH0gPSB0aGlzLnN0YXRlO1xuICAgIHJldHVybiAoISFzb3J0ZWRNb2RzICYmIE9iamVjdC5rZXlzKHNvcnRlZE1vZHMpLmxlbmd0aCAhPT0gMClcbiAgICAgID8gKFxuICAgICAgICA8ZGl2IHN0eWxlPXt7IG92ZXJmbG93OiAnYXV0bycgfX0+XG4gICAgICAgICAgPGg0Pnt0KCdMb2FkIE9yZGVyJyl9PC9oND5cbiAgICAgICAgICA8cD5cbiAgICAgICAgICB7dCgnVGhpcyBpcyBhIHNuYXBzaG90IG9mIHRoZSBsb2FkIG9yZGVyIGluZm9ybWF0aW9uIHRoYXQgJ1xuICAgICAgICAgICArICd3aWxsIGJlIGV4cG9ydGVkIHdpdGggdGhpcyBjb2xsZWN0aW9uLicpfVxuICAgICAgICAgIDwvcD5cbiAgICAgICAgICB7dGhpcy5yZW5kZXJMb2FkT3JkZXJFZGl0SW5mbygpfVxuICAgICAgICAgIDxMaXN0R3JvdXAgaWQ9J2NvbGxlY3Rpb25zLWxvYWQtb3JkZXItbGlzdCc+XG4gICAgICAgICAgICB7c29ydGVkTW9kcy5tYXAoKGVudHJ5LCBpZHgpID0+IHRoaXMucmVuZGVyTW9kRW50cnkoZW50cnksIGlkeCkpfVxuICAgICAgICAgIDwvTGlzdEdyb3VwPlxuICAgICAgICA8L2Rpdj5cbiAgICApIDogdGhpcy5yZW5kZXJQbGFjZWhvbGRlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVTb3J0ZWRNb2RzKCkge1xuICAgIGNvbnN0IGluY2x1ZGVkTW9kSWRzID0gKHRoaXMucHJvcHMuY29sbGVjdGlvbj8ucnVsZXMgfHwgW10pLm1hcChydWxlID0+IHJ1bGUucmVmZXJlbmNlLmlkKTtcbiAgICBjb25zdCBtb2RzID0gT2JqZWN0LmtleXModGhpcy5wcm9wcy5tb2RzKS5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PiB7XG4gICAgICBpZiAoaW5jbHVkZWRNb2RJZHMuaW5jbHVkZXMoaXRlcikpIHtcbiAgICAgICAgYWNjdW1baXRlcl0gPSB0aGlzLnByb3BzLm1vZHNbaXRlcl07XG4gICAgICB9XG4gICAgICByZXR1cm4gYWNjdW07XG4gICAgfSwge30pXG4gICAgZGVzZXJpYWxpemVMb2FkT3JkZXIodGhpcy5wcm9wcy5hcGksIG1vZHMpXG4gICAgICAudGhlbihsbyA9PiB7XG4gICAgICAgIGNvbnN0IGZpbHRlcmVkID0gbG8uZmlsdGVyKGVudHJ5ID0+IChOQVRJVkVfUExVR0lOUy5pbmNsdWRlcyhlbnRyeS5pZCkgfHwgZW50cnkubW9kSWQgIT09IHVuZGVmaW5lZCkpO1xuICAgICAgICB0aGlzLm5leHRTdGF0ZS5zb3J0ZWRNb2RzID0gZmlsdGVyZWQ7XG4gICAgICB9KVxuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJMb2FkT3JkZXJFZGl0SW5mbyA9ICgpID0+IHtcbiAgICBjb25zdCB7IHQgfSA9IHRoaXMucHJvcHM7XG4gICAgcmV0dXJuIChcbiAgICAgIDxGbGV4TGF5b3V0IHR5cGU9J3JvdycgaWQ9J2NvbGxlY3Rpb24tZWRpdC1sb2Fkb3JkZXItZWRpdC1pbmZvLWNvbnRhaW5lcic+XG4gICAgICAgIDxGbGV4TGF5b3V0LkZpeGVkIGNsYXNzTmFtZT0nbG9hZG9yZGVyLWVkaXQtaW5mby1pY29uJz5cbiAgICAgICAgICA8SWNvbiBuYW1lPSdkaWFsb2ctaW5mbycvPlxuICAgICAgICA8L0ZsZXhMYXlvdXQuRml4ZWQ+XG4gICAgICAgIDxGbGV4TGF5b3V0LkZpeGVkIGNsYXNzTmFtZT0nY29sbGVjdGlvbi1lZGl0LWxvYWRvcmRlci1lZGl0LWluZm8nPlxuICAgICAgICAgIHt0KCdZb3UgY2FuIG1ha2UgY2hhbmdlcyB0byB0aGlzIGRhdGEgZnJvbSB0aGUgJyl9XG4gICAgICAgICAgPGFcbiAgICAgICAgICAgIGNsYXNzTmFtZT0nZmFrZS1saW5rJ1xuICAgICAgICAgICAgb25DbGljaz17dGhpcy5vcGVuTG9hZE9yZGVyUGFnZX1cbiAgICAgICAgICAgIHRpdGxlPXt0KCdHbyB0byBMb2FkIE9yZGVyIFBhZ2UnKX1cbiAgICAgICAgICA+XG4gICAgICAgICAgICB7dCgnTG9hZCBPcmRlciBwYWdlLicpfVxuICAgICAgICAgIDwvYT5cbiAgICAgICAgICB7dCgnIElmIHlvdSBiZWxpZXZlIGEgbG9hZCBvcmRlciBlbnRyeSBpcyBtaXNzaW5nLCBwbGVhc2UgZW5zdXJlIHRoZSAnXG4gICAgICAgICAgKyAncmVsZXZhbnQgbW9kIGlzIGVuYWJsZWQgYW5kIGhhcyBiZWVuIGFkZGVkIHRvIHRoZSBjb2xsZWN0aW9uLicpfVxuICAgICAgICA8L0ZsZXhMYXlvdXQuRml4ZWQ+XG4gICAgICA8L0ZsZXhMYXlvdXQ+XG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgb3BlbkxvYWRPcmRlclBhZ2UgPSAoKSA9PiB7XG4gICAgdGhpcy5wcm9wcy5hcGkuZXZlbnRzLmVtaXQoJ3Nob3ctbWFpbi1wYWdlJywgJ2ZpbGUtYmFzZWQtbG9hZG9yZGVyJyk7XG4gIH1cbiAgcHJpdmF0ZSByZW5kZXJPcGVuTE9CdXR0b24gPSAoKSA9PiB7XG4gICAgY29uc3QgeyB0IH0gPSB0aGlzLnByb3BzO1xuICAgIHJldHVybiAoPEJ1dHRvblxuICAgICAgaWQ9J2J0bi1tb3JlLW1vZHMnXG4gICAgICBjbGFzc05hbWU9J2NvbGxlY3Rpb24tYWRkLW1vZHMtYnRuJ1xuICAgICAgb25DbGljaz17dGhpcy5vcGVuTG9hZE9yZGVyUGFnZX1cbiAgICAgIGJzU3R5bGU9J2dob3N0J1xuICAgID5cbiAgICAgIHt0KCdPcGVuIExvYWQgT3JkZXIgUGFnZScpfVxuICAgIDwvQnV0dG9uPik7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlclBsYWNlaG9sZGVyID0gKCkgPT4ge1xuICAgIGNvbnN0IHsgdCB9ID0gdGhpcy5wcm9wcztcbiAgICByZXR1cm4gKFxuICAgICAgPEVtcHR5UGxhY2Vob2xkZXJcbiAgICAgICAgaWNvbj0nc29ydC1ub25lJ1xuICAgICAgICB0ZXh0PXt0KCdZb3UgaGF2ZSBubyBsb2FkIG9yZGVyIGVudHJpZXMgKGZvciB0aGUgY3VycmVudCBtb2RzIGluIHRoZSBjb2xsZWN0aW9uKScpfVxuICAgICAgICBzdWJ0ZXh0PXt0aGlzLnJlbmRlck9wZW5MT0J1dHRvbigpfVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJNb2RFbnRyeSA9IChsb0VudHJ5OiBJTG9hZE9yZGVyRW50cnksIGlkeDogbnVtYmVyKSA9PiB7XG4gICAgY29uc3Qga2V5ID0gbG9FbnRyeS5pZCArIEpTT04uc3RyaW5naWZ5KGxvRW50cnkpO1xuICAgIGNvbnN0IGNsYXNzZXMgPSBbJ2xvYWQtb3JkZXItZW50cnknLCAnY29sbGVjdGlvbi10YWInXTtcbiAgICByZXR1cm4gKFxuICAgICAgPExpc3RHcm91cEl0ZW1cbiAgICAgICAga2V5PXtrZXl9XG4gICAgICAgIGNsYXNzTmFtZT17Y2xhc3Nlcy5qb2luKCcgJyl9XG4gICAgICA+XG4gICAgICAgIDxGbGV4TGF5b3V0IHR5cGU9J3Jvdyc+XG4gICAgICAgICAgPHAgY2xhc3NOYW1lPSdsb2FkLW9yZGVyLWluZGV4Jz57aWR4fTwvcD5cbiAgICAgICAgICA8cD57bG9FbnRyeS5uYW1lfTwvcD5cbiAgICAgICAgPC9GbGV4TGF5b3V0PlxuICAgICAgPC9MaXN0R3JvdXBJdGVtPlxuICAgICk7XG4gIH1cbn1cblxuY29uc3QgZW1wdHkgPSBbXTtcbmZ1bmN0aW9uIG1hcFN0YXRlVG9Qcm9wcyhzdGF0ZTogdHlwZXMuSVN0YXRlLCBvd25Qcm9wczogSVByb3BzKTogSUNvbm5lY3RlZFByb3BzIHtcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKSB8fCB1bmRlZmluZWQ7XG4gIGxldCBsb2FkT3JkZXI6IElMb2FkT3JkZXJFbnRyeVtdID0gW107XG4gIGlmICghIXByb2ZpbGU/LmdhbWVJZCkge1xuICAgIGxvYWRPcmRlciA9IHN0YXRlPy5wZXJzaXN0ZW50Py5sb2FkT3JkZXI/Lltwcm9maWxlLmlkXSA/PyBbXTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZ2FtZUlkOiBwcm9maWxlPy5nYW1lSWQsXG4gICAgbG9hZE9yZGVyLFxuICAgIG1vZHM6IHN0YXRlPy5wZXJzaXN0ZW50Py5tb2RzPy5bcHJvZmlsZS5nYW1lSWRdID8/IHt9LFxuICAgIHByb2ZpbGUsXG4gIH07XG59XG5cbmZ1bmN0aW9uIG1hcERpc3BhdGNoVG9Qcm9wcyhkaXNwYXRjaDogYW55KTogSUFjdGlvblByb3BzIHtcbiAgcmV0dXJuIHt9O1xufVxuXG5leHBvcnQgZGVmYXVsdCB3aXRoVHJhbnNsYXRpb24oWydjb21tb24nLCBOQU1FU1BBQ0VdKShcbiAgY29ubmVjdChtYXBTdGF0ZVRvUHJvcHMsIG1hcERpc3BhdGNoVG9Qcm9wcykoXG4gICAgTW9ycm93aW5kQ29sbGVjdGlvbnNEYXRhVmlldykgYXMgYW55KSBhcyBSZWFjdC5Db21wb25lbnRDbGFzczxJQmFzZVByb3BzICYgSUV4dGVuZGVkSW50ZXJmYWNlUHJvcHM+O1xuIl19