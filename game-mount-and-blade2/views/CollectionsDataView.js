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
const collectionUtil_1 = require("../collections/collectionUtil");
const NAMESPACE = 'mnb2-collections-data';
class CollectionsDataView extends vortex_api_1.ComponentEx {
    static getDerivedStateFromProps(newProps, state) {
        const { loadOrder, mods, collection } = newProps;
        const sortedMods = (0, collectionUtil_1.genCollectionLoadOrder)(loadOrder, mods, collection);
        return (sortedMods !== state.sortedMods) ? { sortedMods } : null;
    }
    constructor(props) {
        super(props);
        this.renderLoadOrderEditInfo = () => {
            const { t } = this.props;
            return (react_1.default.createElement(vortex_api_1.FlexLayout, { type: 'row', id: 'collection-edit-loadorder-edit-info-container' },
                react_1.default.createElement(vortex_api_1.FlexLayout.Fixed, { className: 'loadorder-edit-info-icon' },
                    react_1.default.createElement(vortex_api_1.Icon, { name: 'dialog-info' })),
                react_1.default.createElement(vortex_api_1.FlexLayout.Fixed, { className: 'collection-edit-loadorder-edit-info' },
                    t('You can make changes to this data from the '),
                    react_1.default.createElement("a", { className: 'fake-link', onClick: this.openLoadOrderPage, title: t('Go to Load Order Page') }, t('Load Order page.')),
                    t(' If you believe a load order entry is missing, please ensure the '
                        + 'relevant mod is enabled and has been added to the collection.'))));
        };
        this.openLoadOrderPage = () => {
            this.context.api.events.emit('show-main-page', 'generic-loadorder');
        };
        this.renderOpenLOButton = () => {
            const { t } = this.props;
            return (react_1.default.createElement(react_bootstrap_1.Button, { id: 'btn-more-mods', className: 'collection-add-mods-btn', onClick: this.openLoadOrderPage, bsStyle: 'ghost' }, t('Open Load Order Page')));
        };
        this.renderPlaceholder = () => {
            const { t } = this.props;
            return (react_1.default.createElement(vortex_api_1.EmptyPlaceholder, { icon: 'sort-none', text: t('You have no load order entries (for the current mods in the collection)'), subtext: this.renderOpenLOButton() }));
        };
        this.renderModEntry = (modId) => {
            const loEntry = this.state.sortedMods[modId];
            const key = modId + JSON.stringify(loEntry);
            const name = vortex_api_1.util.renderModName(this.props.mods[modId]) || modId;
            const classes = ['load-order-entry', 'collection-tab'];
            return (react_1.default.createElement(react_bootstrap_1.ListGroupItem, { key: key, className: classes.join(' ') },
                react_1.default.createElement(vortex_api_1.FlexLayout, { type: 'row' },
                    react_1.default.createElement("p", { className: 'load-order-index' }, loEntry.pos),
                    react_1.default.createElement("p", null, name))));
        };
        const { loadOrder, mods, collection } = props;
        this.initState({
            sortedMods: (0, collectionUtil_1.genCollectionLoadOrder)(loadOrder, mods, collection) || {},
        });
    }
    componentDidMount() {
        const { loadOrder, mods, collection } = this.props;
        this.nextState.sortedMods = (0, collectionUtil_1.genCollectionLoadOrder)(loadOrder, mods, collection);
    }
    render() {
        const { t } = this.props;
        const { sortedMods } = this.state;
        return (!!sortedMods && Object.keys(sortedMods).length !== 0)
            ? (react_1.default.createElement("div", { style: { overflow: 'auto' } },
                react_1.default.createElement("h4", null, t('Load Order')),
                react_1.default.createElement("p", null, t('This is a snapshot of the load order information that '
                    + 'will be exported with this collection.')),
                this.renderLoadOrderEditInfo(),
                react_1.default.createElement(react_bootstrap_1.ListGroup, { id: 'collections-load-order-list' }, Object.keys(sortedMods).map(this.renderModEntry)))) : this.renderPlaceholder();
    }
}
const empty = {};
function mapStateToProps(state, ownProps) {
    const profile = vortex_api_1.selectors.activeProfile(state) || undefined;
    let loadOrder = {};
    if (!!profile?.gameId) {
        loadOrder = state?.persistent?.loadOrder?.[profile.id] ?? empty;
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
exports.default = (0, react_i18next_1.withTranslation)(['common', NAMESPACE])((0, react_redux_1.connect)(mapStateToProps, mapDispatchToProps)(CollectionsDataView));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29sbGVjdGlvbnNEYXRhVmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkNvbGxlY3Rpb25zRGF0YVZpZXcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQ0Esa0RBQTBCO0FBQzFCLHFEQUFtRTtBQUNuRSxpREFBZ0Q7QUFDaEQsNkNBQXNDO0FBRXRDLDJDQUNtRDtBQUduRCxrRUFBdUU7QUFHdkUsTUFBTSxTQUFTLEdBQVcsdUJBQXVCLENBQUM7QUFtQmxELE1BQU0sbUJBQW9CLFNBQVEsd0JBQW9DO0lBQzdELE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxRQUFnQixFQUFFLEtBQXNCO1FBQzdFLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxHQUFHLFFBQVEsQ0FBQztRQUNqRCxNQUFNLFVBQVUsR0FBRyxJQUFBLHVDQUFzQixFQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDdkUsT0FBTyxDQUFDLFVBQVUsS0FBSyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUNuRSxDQUFDO0lBRUQsWUFBWSxLQUFhO1FBQ3ZCLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQStCUCw0QkFBdUIsR0FBRyxHQUFHLEVBQUU7WUFDckMsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDekIsT0FBTyxDQUNMLDhCQUFDLHVCQUFVLElBQUMsSUFBSSxFQUFDLEtBQUssRUFBQyxFQUFFLEVBQUMsK0NBQStDO2dCQUN2RSw4QkFBQyx1QkFBVSxDQUFDLEtBQUssSUFBQyxTQUFTLEVBQUMsMEJBQTBCO29CQUNwRCw4QkFBQyxpQkFBSSxJQUFDLElBQUksRUFBQyxhQUFhLEdBQUUsQ0FDVDtnQkFDbkIsOEJBQUMsdUJBQVUsQ0FBQyxLQUFLLElBQUMsU0FBUyxFQUFDLHFD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QUUsT0FBTyxFQUFFLE1BQU07UUFDdkIsU0FBUztRQUNULElBQUksRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFO1FBQ3JELE9BQU87S0FDUixDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsa0JBQWtCLENBQUMsUUFBYTtJQUN2QyxPQUFPLEVBQUUsQ0FBQztBQUNaLENBQUM7QUFFRCxrQkFBZSxJQUFBLCtCQUFlLEVBQUMsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FDbkQsSUFBQSxxQkFBTyxFQUFDLGVBQWUsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQ2xFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IEJ1dHRvbiwgTGlzdEdyb3VwLCBMaXN0R3JvdXBJdGVtIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcbmltcG9ydCB7IHdpdGhUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xuaW1wb3J0IHsgY29ubmVjdCB9IGZyb20gJ3JlYWN0LXJlZHV4JztcblxuaW1wb3J0IHsgQ29tcG9uZW50RXgsIEVtcHR5UGxhY2Vob2xkZXIsIEZsZXhMYXlvdXQsXG4gIHNlbGVjdG9ycywgdHlwZXMsIEljb24sIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IHsgSUV4dGVuZGVkSW50ZXJmYWNlUHJvcHMgfSBmcm9tICcuLi9jb2xsZWN0aW9ucy90eXBlcyc7XG5pbXBvcnQgeyBnZW5Db2xsZWN0aW9uTG9hZE9yZGVyIH0gZnJvbSAnLi4vY29sbGVjdGlvbnMvY29sbGVjdGlvblV0aWwnO1xuaW1wb3J0IHsgSUxvYWRPcmRlciwgSUxvYWRPcmRlckVudHJ5IH0gZnJvbSAnLi4vdHlwZXMnO1xuXG5jb25zdCBOQU1FU1BBQ0U6IHN0cmluZyA9ICdtbmIyLWNvbGxlY3Rpb25zLWRhdGEnO1xuXG5pbnRlcmZhY2UgSUJhc2VTdGF0ZSB7XG4gIHNvcnRlZE1vZHM6IElMb2FkT3JkZXI7XG59XG5cbmludGVyZmFjZSBJQ29ubmVjdGVkUHJvcHMge1xuICBnYW1lSWQ6IHN0cmluZztcbiAgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfTtcbiAgbG9hZE9yZGVyOiBJTG9hZE9yZGVyO1xuICBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZTtcbn1cblxuaW50ZXJmYWNlIElBY3Rpb25Qcm9wcyB7XG59XG5cbnR5cGUgSVByb3BzID0gSUFjdGlvblByb3BzICYgSUV4dGVuZGVkSW50ZXJmYWNlUHJvcHMgJiBJQ29ubmVjdGVkUHJvcHM7XG50eXBlIElDb21wb25lbnRTdGF0ZSA9IElCYXNlU3RhdGU7XG5cbmNsYXNzIENvbGxlY3Rpb25zRGF0YVZpZXcgZXh0ZW5kcyBDb21wb25lbnRFeDxJUHJvcHMsIElDb21wb25lbnRTdGF0ZT4ge1xuICBwdWJsaWMgc3RhdGljIGdldERlcml2ZWRTdGF0ZUZyb21Qcm9wcyhuZXdQcm9wczogSVByb3BzLCBzdGF0ZTogSUNvbXBvbmVudFN0YXRlKSB7XG4gICAgY29uc3QgeyBsb2FkT3JkZXIsIG1vZHMsIGNvbGxlY3Rpb24gfSA9IG5ld1Byb3BzO1xuICAgIGNvbnN0IHNvcnRlZE1vZHMgPSBnZW5Db2xsZWN0aW9uTG9hZE9yZGVyKGxvYWRPcmRlciwgbW9kcywgY29sbGVjdGlvbik7XG4gICAgcmV0dXJuIChzb3J0ZWRNb2RzICE9PSBzdGF0ZS5zb3J0ZWRNb2RzKSA/IHsgc29ydGVkTW9kcyB9IDogbnVsbDtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKHByb3BzOiBJUHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcyk7XG4gICAgY29uc3QgeyBsb2FkT3JkZXIsIG1vZHMsIGNvbGxlY3Rpb24gfSA9IHByb3BzO1xuICAgIHRoaXMuaW5pdFN0YXRlKHtcbiAgICAgIHNvcnRlZE1vZHM6IGdlbkNvbGxlY3Rpb25Mb2FkT3JkZXIobG9hZE9yZGVyLCBtb2RzLCBjb2xsZWN0aW9uKSB8fCB7fSxcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICBjb25zdCB7IGxvYWRPcmRlciwgbW9kcywgY29sbGVjdGlvbiB9ID0gdGhpcy5wcm9wcztcbiAgICB0aGlzLm5leHRTdGF0ZS5zb3J0ZWRNb2RzID0gZ2VuQ29sbGVjdGlvbkxvYWRPcmRlcihsb2FkT3JkZXIsIG1vZHMsIGNvbGxlY3Rpb24pO1xuICB9XG5cbiAgcHVibGljIHJlbmRlcigpOiBKU1guRWxlbWVudCB7XG4gICAgY29uc3QgeyB0IH0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHsgc29ydGVkTW9kcyB9ID0gdGhpcy5zdGF0ZTtcbiAgICByZXR1cm4gKCEhc29ydGVkTW9kcyAmJiBPYmplY3Qua2V5cyhzb3J0ZWRNb2RzKS5sZW5ndGggIT09IDApXG4gICAgICA/IChcbiAgICAgICAgPGRpdiBzdHlsZT17eyBvdmVyZmxvdzogJ2F1dG8nIH19PlxuICAgICAgICAgIDxoND57dCgnTG9hZCBPcmRlcicpfTwvaDQ+XG4gICAgICAgICAgPHA+XG4gICAgICAgICAge3QoJ1RoaXMgaXMgYSBzbmFwc2hvdCBvZiB0aGUgbG9hZCBvcmRlciBpbmZvcm1hdGlvbiB0aGF0ICdcbiAgICAgICAgICAgKyAnd2lsbCBiZSBleHBvcnRlZCB3aXRoIHRoaXMgY29sbGVjdGlvbi4nKX1cbiAgICAgICAgICA8L3A+XG4gICAgICAgICAge3RoaXMucmVuZGVyTG9hZE9yZGVyRWRpdEluZm8oKX1cbiAgICAgICAgICA8TGlzdEdyb3VwIGlkPSdjb2xsZWN0aW9ucy1sb2FkLW9yZGVyLWxpc3QnPlxuICAgICAgICAgICAge09iamVjdC5rZXlzKHNvcnRlZE1vZHMpLm1hcCh0aGlzLnJlbmRlck1vZEVudHJ5KX1cbiAgICAgICAgICA8L0xpc3RHcm91cD5cbiAgICAgICAgPC9kaXY+XG4gICAgKSA6IHRoaXMucmVuZGVyUGxhY2Vob2xkZXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyTG9hZE9yZGVyRWRpdEluZm8gPSAoKSA9PiB7XG4gICAgY29uc3QgeyB0IH0gPSB0aGlzLnByb3BzO1xuICAgIHJldHVybiAoXG4gICAgICA8RmxleExheW91dCB0eXBlPSdyb3cnIGlkPSdjb2xsZWN0aW9uLWVkaXQtbG9hZG9yZGVyLWVkaXQtaW5mby1jb250YWluZXInPlxuICAgICAgICA8RmxleExheW91dC5GaXhlZCBjbGFzc05hbWU9J2xvYWRvcmRlci1lZGl0LWluZm8taWNvbic+XG4gICAgICAgICAgPEljb24gbmFtZT0nZGlhbG9nLWluZm8nLz5cbiAgICAgICAgPC9GbGV4TGF5b3V0LkZpeGVkPlxuICAgICAgICA8RmxleExheW91dC5GaXhlZCBjbGFzc05hbWU9J2NvbGxlY3Rpb24tZWRpdC1sb2Fkb3JkZXItZWRpdC1pbmZvJz5cbiAgICAgICAgICB7dCgnWW91IGNhbiBtYWtlIGNoYW5nZXMgdG8gdGhpcyBkYXRhIGZyb20gdGhlICcpfVxuICAgICAgICAgIDxhXG4gICAgICAgICAgICBjbGFzc05hbWU9J2Zha2UtbGluaydcbiAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub3BlbkxvYWRPcmRlclBhZ2V9XG4gICAgICAgICAgICB0aXRsZT17dCgnR28gdG8gTG9hZCBPcmRlciBQYWdlJyl9XG4gICAgICAgICAgPlxuICAgICAgICAgICAge3QoJ0xvYWQgT3JkZXIgcGFnZS4nKX1cbiAgICAgICAgICA8L2E+XG4gICAgICAgICAge3QoJyBJZiB5b3UgYmVsaWV2ZSBhIGxvYWQgb3JkZXIgZW50cnkgaXMgbWlzc2luZywgcGxlYXNlIGVuc3VyZSB0aGUgJ1xuICAgICAgICAgICsgJ3JlbGV2YW50IG1vZCBpcyBlbmFibGVkIGFuZCBoYXMgYmVlbiBhZGRlZCB0byB0aGUgY29sbGVjdGlvbi4nKX1cbiAgICAgICAgPC9GbGV4TGF5b3V0LkZpeGVkPlxuICAgICAgPC9GbGV4TGF5b3V0PlxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIG9wZW5Mb2FkT3JkZXJQYWdlID0gKCkgPT4ge1xuICAgIHRoaXMuY29udGV4dC5hcGkuZXZlbnRzLmVtaXQoJ3Nob3ctbWFpbi1wYWdlJywgJ2dlbmVyaWMtbG9hZG9yZGVyJyk7XG4gIH1cbiAgcHJpdmF0ZSByZW5kZXJPcGVuTE9CdXR0b24gPSAoKSA9PiB7XG4gICAgY29uc3QgeyB0IH0gPSB0aGlzLnByb3BzO1xuICAgIHJldHVybiAoPEJ1dHRvblxuICAgICAgaWQ9J2J0bi1tb3JlLW1vZHMnXG4gICAgICBjbGFzc05hbWU9J2NvbGxlY3Rpb24tYWRkLW1vZHMtYnRuJ1xuICAgICAgb25DbGljaz17dGhpcy5vcGVuTG9hZE9yZGVyUGFnZX1cbiAgICAgIGJzU3R5bGU9J2dob3N0J1xuICAgID5cbiAgICAgIHt0KCdPcGVuIExvYWQgT3JkZXIgUGFnZScpfVxuICAgIDwvQnV0dG9uPik7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlclBsYWNlaG9sZGVyID0gKCkgPT4ge1xuICAgIGNvbnN0IHsgdCB9ID0gdGhpcy5wcm9wcztcbiAgICByZXR1cm4gKFxuICAgICAgPEVtcHR5UGxhY2Vob2xkZXJcbiAgICAgICAgaWNvbj0nc29ydC1ub25lJ1xuICAgICAgICB0ZXh0PXt0KCdZb3UgaGF2ZSBubyBsb2FkIG9yZGVyIGVudHJpZXMgKGZvciB0aGUgY3VycmVudCBtb2RzIGluIHRoZSBjb2xsZWN0aW9uKScpfVxuICAgICAgICBzdWJ0ZXh0PXt0aGlzLnJlbmRlck9wZW5MT0J1dHRvbigpfVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJNb2RFbnRyeSA9IChtb2RJZDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgbG9FbnRyeTogSUxvYWRPcmRlckVudHJ5ID0gdGhpcy5zdGF0ZS5zb3J0ZWRNb2RzW21vZElkXTtcbiAgICBjb25zdCBrZXkgPSBtb2RJZCArIEpTT04uc3RyaW5naWZ5KGxvRW50cnkpO1xuICAgIGNvbnN0IG5hbWUgPSB1dGlsLnJlbmRlck1vZE5hbWUodGhpcy5wcm9wcy5tb2RzW21vZElkXSkgfHwgbW9kSWQ7XG4gICAgY29uc3QgY2xhc3NlcyA9IFsnbG9hZC1vcmRlci1lbnRyeScsICdjb2xsZWN0aW9uLXRhYiddO1xuICAgIHJldHVybiAoXG4gICAgICA8TGlzdEdyb3VwSXRlbVxuICAgICAgICBrZXk9e2tleX1cbiAgICAgICAgY2xhc3NOYW1lPXtjbGFzc2VzLmpvaW4oJyAnKX1cbiAgICAgID5cbiAgICAgICAgPEZsZXhMYXlvdXQgdHlwZT0ncm93Jz5cbiAgICAgICAgICA8cCBjbGFzc05hbWU9J2xvYWQtb3JkZXItaW5kZXgnPntsb0VudHJ5LnBvc308L3A+XG4gICAgICAgICAgPHA+e25hbWV9PC9wPlxuICAgICAgICA8L0ZsZXhMYXlvdXQ+XG4gICAgICA8L0xpc3RHcm91cEl0ZW0+XG4gICAgKTtcbiAgfVxufVxuXG5jb25zdCBlbXB0eSA9IHt9O1xuZnVuY3Rpb24gbWFwU3RhdGVUb1Byb3BzKHN0YXRlOiB0eXBlcy5JU3RhdGUsIG93blByb3BzOiBJUHJvcHMpOiBJQ29ubmVjdGVkUHJvcHMge1xuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpIHx8IHVuZGVmaW5lZDtcbiAgbGV0IGxvYWRPcmRlcjogSUxvYWRPcmRlciA9IHt9O1xuICBpZiAoISFwcm9maWxlPy5nYW1lSWQpIHtcbiAgICBsb2FkT3JkZXIgPSBzdGF0ZT8ucGVyc2lzdGVudD8ubG9hZE9yZGVyPy5bcHJvZmlsZS5pZF0gPz8gZW1wdHk7IC8vIEZJWE1FIHR5cGUgZGlzY3JlcGVuY3lcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZ2FtZUlkOiBwcm9maWxlPy5nYW1lSWQsXG4gICAgbG9hZE9yZGVyLFxuICAgIG1vZHM6IHN0YXRlPy5wZXJzaXN0ZW50Py5tb2RzPy5bcHJvZmlsZS5nYW1lSWRdID8/IHt9LFxuICAgIHByb2ZpbGUsXG4gIH07XG59XG5cbmZ1bmN0aW9uIG1hcERpc3BhdGNoVG9Qcm9wcyhkaXNwYXRjaDogYW55KTogSUFjdGlvblByb3BzIHtcbiAgcmV0dXJuIHt9O1xufVxuXG5leHBvcnQgZGVmYXVsdCB3aXRoVHJhbnNsYXRpb24oWydjb21tb24nLCBOQU1FU1BBQ0VdKShcbiAgY29ubmVjdChtYXBTdGF0ZVRvUHJvcHMsIG1hcERpc3BhdGNoVG9Qcm9wcykoQ29sbGVjdGlvbnNEYXRhVmlldylcbik7XG4iXX0=