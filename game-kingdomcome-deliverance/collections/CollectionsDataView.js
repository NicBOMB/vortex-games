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
const util_1 = require("./util");
const vortex_api_1 = require("vortex-api");
const NAMESPACE = 'generic-load-order-extension';
class CollectionsDataView extends vortex_api_1.ComponentEx {
    static getDerivedStateFromProps(newProps, state) {
        const { loadOrder, mods, collection } = newProps;
        const sortedMods = (0, util_1.genCollectionLoadOrder)(loadOrder, mods, collection);
        return (sortedMods !== state.sortedMods) ? { sortedMods } : null;
    }
    constructor(props) {
        super(props);
        this.openLoadOrderPage = () => {
            this.context.api.events.emit('show-main-page', 'generic-loadorder');
        };
        this.renderOpenLOButton = () => {
            const { t } = this.props;
            return (React.createElement(react_bootstrap_1.Button, { id: 'btn-more-mods', className: 'collection-add-mods-btn', onClick: this.openLoadOrderPage, bsStyle: 'ghost' }, t('Open Load Order Page')));
        };
        this.renderPlaceholder = () => {
            const { t } = this.props;
            return (React.createElement(vortex_api_1.EmptyPlaceholder, { icon: 'sort-none', text: t('You have no load order entries (for the current mods in the collection)'), subtext: this.renderOpenLOButton() }));
        };
        this.renderModEntry = (loId) => {
            const { mods } = this.props;
            const { sortedMods } = this.state;
            const loEntry = this.state.sortedMods[loId];
            const idx = this.state.sortedMods.indexOf(loId);
            const key = `${idx}-${loId}`;
            const modId = (0, util_1.getModId)(mods, loId);
            const name = vortex_api_1.util.renderModName(this.props.mods[modId]) || modId;
            const classes = ['load-order-entry', 'collection-tab'];
            return (React.createElement(react_bootstrap_1.ListGroupItem, { key: key, className: classes.join(' ') },
                React.createElement(vortex_api_1.FlexLayout, { type: 'row' },
                    React.createElement("p", { className: 'load-order-index' }, idx),
                    React.createElement("p", null, name))));
        };
        const { loadOrder, mods, collection } = props;
        this.initState({
            sortedMods: (0, util_1.genCollectionLoadOrder)(loadOrder, mods, collection) || [],
        });
    }
    componentDidMount() {
        const { loadOrder, mods, collection } = this.props;
        this.nextState.sortedMods = (0, util_1.genCollectionLoadOrder)(loadOrder, mods, collection);
    }
    render() {
        const { t } = this.props;
        const { sortedMods } = this.state;
        return (!!sortedMods && Object.keys(sortedMods).length !== 0)
            ? (React.createElement("div", { style: { overflow: 'auto' } },
                React.createElement("h4", null, t('Load Order')),
                React.createElement("p", null, t('Below is a preview of the load order for the mods that ' +
                    'are included in the current collection. If you wish to modify the load ' +
                    'please do so by opening the Load Order page; any changes made there ' +
                    'will be reflected in this collection.')),
                React.createElement(react_bootstrap_1.ListGroup, { id: 'collections-load-order-list' }, sortedMods.map(this.renderModEntry)))) : this.renderPlaceholder();
    }
}
function mapStateToProps(state, ownProps) {
    const profile = vortex_api_1.selectors.activeProfile(state) || undefined;
    return {
        gameId: profile?.gameId,
        loadOrder: !!profile?.gameId ? state?.persistent?.loadOrder?.[profile.id] ?? [] : [],
        mods: state?.persistent?.mods?.[profile.gameId] ?? {},
        profile,
    };
}
function mapDispatchToProps(dispatch) {
    return {};
}
exports.default = (0, react_i18next_1.withTranslation)(['common', NAMESPACE])((0, react_redux_1.connect)(mapStateToProps, mapDispatchToProps)(CollectionsDataView));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29sbGVjdGlvbnNEYXRhVmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkNvbGxlY3Rpb25zRGF0YVZpZXcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSw2Q0FBK0I7QUFDL0IscURBQW1FO0FBQ25FLGlEQUFnRDtBQUNoRCw2Q0FBc0M7QUFFdEMsaUNBQTBEO0FBRTFELDJDQUNvRDtBQUVwRCxNQUFNLFNBQVMsR0FBVyw4QkFBOEIsQ0FBQztBQXVCekQsTUFBTSxtQkFBb0IsU0FBUSx3QkFBb0M7SUFDN0QsTUFBTSxDQUFDLHdCQUF3QixDQUFDLFFBQWdCLEVBQUUsS0FBc0I7UUFDN0UsTUFBTSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLEdBQUcsUUFBUSxDQUFDO1FBQ2pELE1BQU0sVUFBVSxHQUFHLElBQUEsNkJBQXNCLEVBQUMsU0FBZ0MsRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDOUYsT0FBTyxDQUFDLFVBQVUsS0FBSyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUNuRSxDQUFDO0lBRUQsWUFBWSxLQUFhO1FBQ3ZCLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQWlDUCxzQkFBaUIsR0FBRyxHQUFHLEVBQUU7WUFDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3RFLENBQUMsQ0FBQTtRQUNPLHVCQUFrQixHQUFHLEdBQUcsRUFBRTtZQUNoQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUN6QixPQUFPLENBQUMsb0JBQUMsd0JBQU0sSUFDYixFQUFFLEVBQUMsZUFBZSxFQUNsQixTQUFTLEVBQUMseUJB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YWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IEJ1dHRvbiwgTGlzdEdyb3VwLCBMaXN0R3JvdXBJdGVtIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcbmltcG9ydCB7IHdpdGhUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xuaW1wb3J0IHsgY29ubmVjdCB9IGZyb20gJ3JlYWN0LXJlZHV4JztcblxuaW1wb3J0IHsgZ2VuQ29sbGVjdGlvbkxvYWRPcmRlciwgZ2V0TW9kSWQgfSBmcm9tICcuL3V0aWwnO1xuXG5pbXBvcnQgeyBDb21wb25lbnRFeCwgRW1wdHlQbGFjZWhvbGRlciwgRmxleExheW91dCxcbiAgc2VsZWN0b3JzLCB0eXBlcywgVXNhZ2UsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuY29uc3QgTkFNRVNQQUNFOiBzdHJpbmcgPSAnZ2VuZXJpYy1sb2FkLW9yZGVyLWV4dGVuc2lvbic7XG5cbmludGVyZmFjZSBJRXh0ZW5kZWRJbnRlcmZhY2VQcm9wcyB7XG4gIGNvbGxlY3Rpb246IHR5cGVzLklNb2Q7XG59XG5cbmludGVyZmFjZSBJQmFzZVN0YXRlIHtcbiAgc29ydGVkTW9kczogc3RyaW5nW107XG59XG5cbmludGVyZmFjZSBJQ29ubmVjdGVkUHJvcHMge1xuICBnYW1lSWQ6IHN0cmluZztcbiAgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfTtcbiAgbG9hZE9yZGVyOiB0eXBlcy5Mb2FkT3JkZXI7XG4gIHByb2ZpbGU6IHR5cGVzLklQcm9maWxlO1xufVxuXG5pbnRlcmZhY2UgSUFjdGlvblByb3BzIHtcbn1cblxudHlwZSBJUHJvcHMgPSBJQWN0aW9uUHJvcHMgJiBJRXh0ZW5kZWRJbnRlcmZhY2VQcm9wcyAmIElDb25uZWN0ZWRQcm9wcztcbnR5cGUgSUNvbXBvbmVudFN0YXRlID0gSUJhc2VTdGF0ZTtcblxuY2xhc3MgQ29sbGVjdGlvbnNEYXRhVmlldyBleHRlbmRzIENvbXBvbmVudEV4PElQcm9wcywgSUNvbXBvbmVudFN0YXRlPiB7XG4gIHB1YmxpYyBzdGF0aWMgZ2V0RGVyaXZlZFN0YXRlRnJvbVByb3BzKG5ld1Byb3BzOiBJUHJvcHMsIHN0YXRlOiBJQ29tcG9uZW50U3RhdGUpIHtcbiAgICBjb25zdCB7IGxvYWRPcmRlciwgbW9kcywgY29sbGVjdGlvbiB9ID0gbmV3UHJvcHM7IC8vIEZJWE1FOiBhcyB1bmtub3duIGFzIHN0cmluZ1tdXG4gICAgY29uc3Qgc29ydGVkTW9kcyA9IGdlbkNvbGxlY3Rpb25Mb2FkT3JkZXIobG9hZE9yZGVyIGFzIHVua25vd24gYXMgc3RyaW5nW10sIG1vZHMsIGNvbGxlY3Rpb24pO1xuICAgIHJldHVybiAoc29ydGVkTW9kcyAhPT0gc3RhdGUuc29ydGVkTW9kcykgPyB7IHNvcnRlZE1vZHMgfSA6IG51bGw7XG4gIH1cblxuICBjb25zdHJ1Y3Rvcihwcm9wczogSVByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpO1xuICAgIGNvbnN0IHsgbG9hZE9yZGVyLCBtb2RzLCBjb2xsZWN0aW9uIH0gPSBwcm9wcztcbiAgICB0aGlzLmluaXRTdGF0ZSh7IC8vIEZJWE1FOiBhcyB1bmtub3duIGFzIHN0cmluZ1tdXG4gICAgICBzb3J0ZWRNb2RzOiBnZW5Db2xsZWN0aW9uTG9hZE9yZGVyKGxvYWRPcmRlciBhcyB1bmtub3duIGFzIHN0cmluZ1tdLCBtb2RzLCBjb2xsZWN0aW9uKSB8fCBbXSxcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICBjb25zdCB7IGxvYWRPcmRlciwgbW9kcywgY29sbGVjdGlvbiB9ID0gdGhpcy5wcm9wczsgLy8gRklYTUU6IGFzIHVua25vd24gYXMgc3RyaW5nW11cbiAgICB0aGlzLm5leHRTdGF0ZS5zb3J0ZWRNb2RzID0gZ2VuQ29sbGVjdGlvbkxvYWRPcmRlcihsb2FkT3JkZXIgYXMgdW5rbm93biBhcyBzdHJpbmdbXSwgbW9kcywgY29sbGVjdGlvbik7XG4gIH1cblxuICBwdWJsaWMgcmVuZGVyKCk6IEpTWC5FbGVtZW50IHtcbiAgICBjb25zdCB7IHQgfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3QgeyBzb3J0ZWRNb2RzIH0gPSB0aGlzLnN0YXRlO1xuICAgIHJldHVybiAoISFzb3J0ZWRNb2RzICYmIE9iamVjdC5rZXlzKHNvcnRlZE1vZHMpLmxlbmd0aCAhPT0gMClcbiAgICAgID8gKFxuICAgICAgICA8ZGl2IHN0eWxlPXt7IG92ZXJmbG93OiAnYXV0bycgfX0+XG4gICAgICAgICAgPGg0Pnt0KCdMb2FkIE9yZGVyJyl9PC9oND5cbiAgICAgICAgICA8cD5cbiAgICAgICAgICB7dCgnQmVsb3cgaXMgYSBwcmV2aWV3IG9mIHRoZSBsb2FkIG9yZGVyIGZvciB0aGUgbW9kcyB0aGF0ICcgK1xuICAgICAgICAgICAgICdhcmUgaW5jbHVkZWQgaW4gdGhlIGN1cnJlbnQgY29sbGVjdGlvbi4gSWYgeW91IHdpc2ggdG8gbW9kaWZ5IHRoZSBsb2FkICcgK1xuICAgICAgICAgICAgICdwbGVhc2UgZG8gc28gYnkgb3BlbmluZyB0aGUgTG9hZCBPcmRlciBwYWdlOyBhbnkgY2hhbmdlcyBtYWRlIHRoZXJlICcgK1xuICAgICAgICAgICAgICd3aWxsIGJlIHJlZmxlY3RlZCBpbiB0aGlzIGNvbGxlY3Rpb24uJylcbiAgICAgICAgICB9XG4gICAgICAgICAgPC9wPlxuICAgICAgICAgIDxMaXN0R3JvdXAgaWQ9J2NvbGxlY3Rpb25zLWxvYWQtb3JkZXItbGlzdCc+XG4gICAgICAgICAgICB7c29ydGVkTW9kcy5tYXAodGhpcy5yZW5kZXJNb2RFbnRyeSl9XG4gICAgICAgICAgPC9MaXN0R3JvdXA+XG4gICAgICAgIDwvZGl2PlxuICAgICkgOiB0aGlzLnJlbmRlclBsYWNlaG9sZGVyKCk7XG4gIH1cblxuICBwcml2YXRlIG9wZW5Mb2FkT3JkZXJQYWdlID0gKCkgPT4ge1xuICAgIHRoaXMuY29udGV4dC5hcGkuZXZlbnRzLmVtaXQoJ3Nob3ctbWFpbi1wYWdlJywgJ2dlbmVyaWMtbG9hZG9yZGVyJyk7XG4gIH1cbiAgcHJpdmF0ZSByZW5kZXJPcGVuTE9CdXR0b24gPSAoKSA9PiB7XG4gICAgY29uc3QgeyB0IH0gPSB0aGlzLnByb3BzO1xuICAgIHJldHVybiAoPEJ1dHRvblxuICAgICAgaWQ9J2J0bi1tb3JlLW1vZHMnXG4gICAgICBjbGFzc05hbWU9J2NvbGxlY3Rpb24tYWRkLW1vZHMtYnRuJ1xuICAgICAgb25DbGljaz17dGhpcy5vcGVuTG9hZE9yZGVyUGFnZX1cbiAgICAgIGJzU3R5bGU9J2dob3N0J1xuICAgID5cbiAgICAgIHt0KCdPcGVuIExvYWQgT3JkZXIgUGFnZScpfVxuICAgIDwvQnV0dG9uPik7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlclBsYWNlaG9sZGVyID0gKCkgPT4ge1xuICAgIGNvbnN0IHsgdCB9ID0gdGhpcy5wcm9wcztcbiAgICByZXR1cm4gKFxuICAgICAgPEVtcHR5UGxhY2Vob2xkZXJcbiAgICAgICAgaWNvbj0nc29ydC1ub25lJ1xuICAgICAgICB0ZXh0PXt0KCdZb3UgaGF2ZSBubyBsb2FkIG9yZGVyIGVudHJpZXMgKGZvciB0aGUgY3VycmVudCBtb2RzIGluIHRoZSBjb2xsZWN0aW9uKScpfVxuICAgICAgICBzdWJ0ZXh0PXt0aGlzLnJlbmRlck9wZW5MT0J1dHRvbigpfVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJNb2RFbnRyeSA9IChsb0lkOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCB7IG1vZHMgfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3QgeyBzb3J0ZWRNb2RzIH0gPSB0aGlzLnN0YXRlO1xuICAgIGNvbnN0IGxvRW50cnk6IHN0cmluZyA9IHRoaXMuc3RhdGUuc29ydGVkTW9kc1tsb0lkXTtcbiAgICBjb25zdCBpZHggPSB0aGlzLnN0YXRlLnNvcnRlZE1vZHMuaW5kZXhPZihsb0lkKTtcbiAgICBjb25zdCBrZXkgPSBgJHtpZHh9LSR7bG9JZH1gO1xuICAgIGNvbnN0IG1vZElkID0gZ2V0TW9kSWQobW9kcywgbG9JZCk7XG4gICAgY29uc3QgbmFtZSA9IHV0aWwucmVuZGVyTW9kTmFtZSh0aGlzLnByb3BzLm1vZHNbbW9kSWRdKSB8fCBtb2RJZDtcbiAgICBjb25zdCBjbGFzc2VzID0gWydsb2FkLW9yZGVyLWVudHJ5JywgJ2NvbGxlY3Rpb24tdGFiJ107XG4gICAgcmV0dXJuIChcbiAgICAgIDxMaXN0R3JvdXBJdGVtXG4gICAgICAgIGtleT17a2V5fVxuICAgICAgICBjbGFzc05hbWU9e2NsYXNzZXMuam9pbignICcpfVxuICAgICAgPlxuICAgICAgICA8RmxleExheW91dCB0eXBlPSdyb3cnPlxuICAgICAgICAgIDxwIGNsYXNzTmFtZT0nbG9hZC1vcmRlci1pbmRleCc+e2lkeH08L3A+XG4gICAgICAgICAgPHA+e25hbWV9PC9wPlxuICAgICAgICA8L0ZsZXhMYXlvdXQ+XG4gICAgICA8L0xpc3RHcm91cEl0ZW0+XG4gICAgKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtYXBTdGF0ZVRvUHJvcHMoc3RhdGU6IHR5cGVzLklTdGF0ZSwgb3duUHJvcHM6IElQcm9wcyk6IElDb25uZWN0ZWRQcm9wcyB7XG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSkgfHwgdW5kZWZpbmVkO1xuICByZXR1cm4ge1xuICAgIGdhbWVJZDogcHJvZmlsZT8uZ2FtZUlkLFxuICAgIGxvYWRPcmRlcjogISFwcm9maWxlPy5nYW1lSWQgPyBzdGF0ZT8ucGVyc2lzdGVudD8ubG9hZE9yZGVyPy5bcHJvZmlsZS5pZF0gPz8gW10gOiBbXSxcbiAgICBtb2RzOiBzdGF0ZT8ucGVyc2lzdGVudD8ubW9kcz8uW3Byb2ZpbGUuZ2FtZUlkXSA/PyB7fSxcbiAgICBwcm9maWxlLFxuICB9O1xufVxuXG5mdW5jdGlvbiBtYXBEaXNwYXRjaFRvUHJvcHMoZGlzcGF0Y2g6IGFueSk6IElBY3Rpb25Qcm9wcyB7XG4gIHJldHVybiB7fTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgd2l0aFRyYW5zbGF0aW9uKFsnY29tbW9uJywgTkFNRVNQQUNFXSkoXG4gIGNvbm5lY3QobWFwU3RhdGVUb1Byb3BzLCBtYXBEaXNwYXRjaFRvUHJvcHMpKFxuICAgIENvbGxlY3Rpb25zRGF0YVZpZXcpIGFzIGFueSkgYXMgUmVhY3QuQ29tcG9uZW50Q2xhc3M8SUV4dGVuZGVkSW50ZXJmYWNlUHJvcHM+O1xuIl19