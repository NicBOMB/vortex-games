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
const util_1 = require("../collections/util");
const NAMESPACE = 'generic-load-order-extension';
class CollectionsDataView extends vortex_api_1.ComponentEx {
    static getDerivedStateFromProps(newProps, state) {
        const { loadOrder, mods, collection } = newProps;
        const sortedMods = (0, util_1.genCollectionLoadOrder)(loadOrder, mods, collection);
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
            sortedMods: (0, util_1.genCollectionLoadOrder)(loadOrder, mods, collection) || {},
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
            ? (react_1.default.createElement("div", { style: { overflow: 'auto' } },
                react_1.default.createElement("h4", null, t('Witcher 3 Merged Data')),
                react_1.default.createElement("p", null, t('The Witcher 3 game extension executes a series of file merges for UI/menu mods '
                    + 'whenever the mods are deployed - these will be included in the collection. '
                    + '(separate from the ones done using the script '
                    + 'merger utility) To ensure that Vortex includes the correct data when '
                    + 'uploading this collection, please make sure that the mods are enabled and '
                    + 'deployed before attempting to upload the collection.')),
                react_1.default.createElement("p", null, t('Additionally - please remember that any script merges (if applicable) done '
                    + 'through the script merger utility, should be reviewed before uploading, to '
                    + 'only include merges that are necessary for the collection to function correctly. '
                    + 'Merged scripts referencing a mod that is not included in your collection will most '
                    + 'definitively cause the game to crash!')),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29sbGVjdGlvbnNEYXRhVmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkNvbGxlY3Rpb25zRGF0YVZpZXcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQ0Esa0RBQTBCO0FBQzFCLHFEQUFtRTtBQUNuRSxpREFBZ0Q7QUFDaEQsNkNBQXNDO0FBRXRDLDJDQUM2QztBQUc3Qyw4Q0FBNkQ7QUFFN0QsTUFBTSxTQUFTLEdBQVcsOEJBQThCLENBQUM7QUFtQnpELE1BQU0sbUJBQW9CLFNBQVEsd0JBQW9DO0lBQzdELE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxRQUFnQixFQUFFLEtBQXNCO1FBQzdFLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxHQUFHLFFBQVEsQ0FBQztRQUNqRCxNQUFNLFVBQVUsR0FBRyxJQUFBLDZCQUFzQixFQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDdkUsT0FBTyxDQUFDLFVBQVUsS0FBSyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUNuRSxDQUFDO0lBRUQsWUFBWSxLQUFhO1FBQ3ZCLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQStDUCw0QkFBdUIsR0FBRyxHQUFHLEVBQUU7WUFDckMsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDekIsT0FBTyxDQUNMLDhCQUFDLHVCQUFVLElBQUMsSUFBSSxFQUFDLEtBQUssRUFBQyxFQUFFLEVBQUMsK0NBQStDO2dCQUN2RSw4QkFBQyx1QkFBVSxDQUFDLEtBQUssSUFBQyxTQUFTLEVBQUMsMEJBQTBCO29CQUNwRCw4QkFBQyxpQkFBSSxJQUFDLElBQUksRUFBQyxhQUFhLEdBQUUsQ0FDVDtnQkFDbkIsOEJBQUMsdUJBQVUsQ0FBQyxLQUFLLElBQUMsU0FBUyxFQUFDLHFD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QUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxTQUFTLENBQUM7SUFDNUQsSUFBSSxTQUFTLEdBQWUsRUFBRSxDQUFDO0lBQy9CLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUU7UUFDckIsU0FBUyxHQUFHLEtBQUssRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEtBQUssQ0FBQztLQUNqRTtJQUVELE9BQU87UUFDTCxNQUFNLEVBQUUsT0FBTyxFQUFFLE1BQU07UUFDdkIsU0FBUztRQUNULElBQUksRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFO1FBQ3JELE9BQU87S0FDUixDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsa0JBQWtCLENBQUMsUUFBYTtJQUN2QyxPQUFPLEVBQUUsQ0FBQztBQUNaLENBQUM7QUFFRCxrQkFBZSxJQUFBLCtCQUFlLEVBQUMsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FDbkQsSUFBQSxxQkFBTyxFQUFDLGVBQWUsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQ2xFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IEJ1dHRvbiwgTGlzdEdyb3VwLCBMaXN0R3JvdXBJdGVtIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcbmltcG9ydCB7IHdpdGhUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xuaW1wb3J0IHsgY29ubmVjdCB9IGZyb20gJ3JlYWN0LXJlZHV4JztcblxuaW1wb3J0IHsgQ29tcG9uZW50RXgsIEVtcHR5UGxhY2Vob2xkZXIsIEZsZXhMYXlvdXQsIEljb24sXG4gIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IHsgSUV4dGVuZGVkSW50ZXJmYWNlUHJvcHMsIElMb2FkT3JkZXIsIElMb2FkT3JkZXJFbnRyeSB9IGZyb20gJy4uL2NvbGxlY3Rpb25zL3R5cGVzJztcbmltcG9ydCB7IGdlbkNvbGxlY3Rpb25Mb2FkT3JkZXIgfSBmcm9tICcuLi9jb2xsZWN0aW9ucy91dGlsJztcblxuY29uc3QgTkFNRVNQQUNFOiBzdHJpbmcgPSAnZ2VuZXJpYy1sb2FkLW9yZGVyLWV4dGVuc2lvbic7XG5cbmludGVyZmFjZSBJQmFzZVN0YXRlIHtcbiAgc29ydGVkTW9kczogSUxvYWRPcmRlcjtcbn1cblxuaW50ZXJmYWNlIElDb25uZWN0ZWRQcm9wcyB7XG4gIGdhbWVJZDogc3RyaW5nO1xuICBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9O1xuICBsb2FkT3JkZXI6IElMb2FkT3JkZXI7XG4gIHByb2ZpbGU6IHR5cGVzLklQcm9maWxlO1xufVxuXG5pbnRlcmZhY2UgSUFjdGlvblByb3BzIHsgLy9GSVhNRSBlbXB0eSBpbnRlcmZhY2UuLi5cbn1cblxudHlwZSBJUHJvcHMgPSBJQWN0aW9uUHJvcHMgJiBJRXh0ZW5kZWRJbnRlcmZhY2VQcm9wcyAmIElDb25uZWN0ZWRQcm9wcztcbnR5cGUgSUNvbXBvbmVudFN0YXRlID0gSUJhc2VTdGF0ZTtcblxuY2xhc3MgQ29sbGVjdGlvbnNEYXRhVmlldyBleHRlbmRzIENvbXBvbmVudEV4PElQcm9wcywgSUNvbXBvbmVudFN0YXRlPiB7XG4gIHB1YmxpYyBzdGF0aWMgZ2V0RGVyaXZlZFN0YXRlRnJvbVByb3BzKG5ld1Byb3BzOiBJUHJvcHMsIHN0YXRlOiBJQ29tcG9uZW50U3RhdGUpIHtcbiAgICBjb25zdCB7IGxvYWRPcmRlciwgbW9kcywgY29sbGVjdGlvbiB9ID0gbmV3UHJvcHM7XG4gICAgY29uc3Qgc29ydGVkTW9kcyA9IGdlbkNvbGxlY3Rpb25Mb2FkT3JkZXIobG9hZE9yZGVyLCBtb2RzLCBjb2xsZWN0aW9uKTtcbiAgICByZXR1cm4gKHNvcnRlZE1vZHMgIT09IHN0YXRlLnNvcnRlZE1vZHMpID8geyBzb3J0ZWRNb2RzIH0gOiBudWxsO1xuICB9XG5cbiAgY29uc3RydWN0b3IocHJvcHM6IElQcm9wcykge1xuICAgIHN1cGVyKHByb3BzKTtcbiAgICBjb25zdCB7IGxvYWRPcmRlciwgbW9kcywgY29sbGVjdGlvbiB9ID0gcHJvcHM7XG4gICAgdGhpcy5pbml0U3RhdGUoe1xuICAgICAgc29ydGVkTW9kczogZ2VuQ29sbGVjdGlvbkxvYWRPcmRlcihsb2FkT3JkZXIsIG1vZHMsIGNvbGxlY3Rpb24pIHx8IHt9LFxuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgIGNvbnN0IHsgbG9hZE9yZGVyLCBtb2RzLCBjb2xsZWN0aW9uIH0gPSB0aGlzLnByb3BzO1xuICAgIHRoaXMubmV4dFN0YXRlLnNvcnRlZE1vZHMgPSBnZW5Db2xsZWN0aW9uTG9hZE9yZGVyKGxvYWRPcmRlciwgbW9kcywgY29sbGVjdGlvbik7XG4gIH1cblxuICBwdWJsaWMgcmVuZGVyKCk6IEpTWC5FbGVtZW50IHtcbiAgICBjb25zdCB7IHQgfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3QgeyBzb3J0ZWRNb2RzIH0gPSB0aGlzLnN0YXRlO1xuICAgIHJldHVybiAoISFzb3J0ZWRNb2RzICYmIE9iamVjdC5rZXlzKHNvcnRlZE1vZHMpLmxlbmd0aCAhPT0gMClcbiAgICAgID8gKFxuICAgICAgICA8ZGl2IHN0eWxlPXt7IG92ZXJmbG93OiAnYXV0bycgfX0+XG4gICAgICAgICAgPGg0Pnt0KCdXaXRjaGVyIDMgTWVyZ2VkIERhdGEnKX08L2g0PlxuICAgICAgICAgIDxwPlxuICAgICAgICAgIHt0KCdUaGUgV2l0Y2hlciAzIGdhbWUgZXh0ZW5zaW9uIGV4ZWN1dGVzIGEgc2VyaWVzIG9mIGZpbGUgbWVyZ2VzIGZvciBVSS9tZW51IG1vZHMgJ1xuICAgICAgICAgICArICd3aGVuZXZlciB0aGUgbW9kcyBhcmUgZGVwbG95ZWQgLSB0aGVzZSB3aWxsIGJlIGluY2x1ZGVkIGluIHRoZSBjb2xsZWN0aW9uLiAnXG4gICAgICAgICAgICsgJyhzZXBhcmF0ZSBmcm9tIHRoZSBvbmVzIGRvbmUgdXNpbmcgdGhlIHNjcmlwdCAnXG4gICAgICAgICAgICsgJ21lcmdlciB1dGlsaXR5KSBUbyBlbnN1cmUgdGhhdCBWb3J0ZXggaW5jbHVkZXMgdGhlIGNvcnJlY3QgZGF0YSB3aGVuICdcbiAgICAgICAgICAgKyAndXBsb2FkaW5nIHRoaXMgY29sbGVjdGlvbiwgcGxlYXNlIG1ha2Ugc3VyZSB0aGF0IHRoZSBtb2RzIGFyZSBlbmFibGVkIGFuZCAnXG4gICAgICAgICAgICsgJ2RlcGxveWVkIGJlZm9yZSBhdHRlbXB0aW5nIHRvIHVwbG9hZCB0aGUgY29sbGVjdGlvbi4nKX1cbiAgICAgICAgICA8L3A+XG4gICAgICAgICAgPHA+XG4gICAgICAgICAge3QoJ0FkZGl0aW9uYWxseSAtIHBsZWFzZSByZW1lbWJlciB0aGF0IGFueSBzY3JpcHQgbWVyZ2VzIChpZiBhcHBsaWNhYmxlKSBkb25lICdcbiAgICAgICAgICAgKyAndGhyb3VnaCB0aGUgc2NyaXB0IG1lcmdlciB1dGlsaXR5LCBzaG91bGQgYmUgcmV2aWV3ZWQgYmVmb3JlIHVwbG9hZGluZywgdG8gJ1xuICAgICAgICAgICArICdvbmx5IGluY2x1ZGUgbWVyZ2VzIHRoYXQgYXJlIG5lY2Vzc2FyeSBmb3IgdGhlIGNvbGxlY3Rpb24gdG8gZnVuY3Rpb24gY29ycmVjdGx5LiAnXG4gICAgICAgICAgICsgJ01lcmdlZCBzY3JpcHRzIHJlZmVyZW5jaW5nIGEgbW9kIHRoYXQgaXMgbm90IGluY2x1ZGVkIGluIHlvdXIgY29sbGVjdGlvbiB3aWxsIG1vc3QgJ1xuICAgICAgICAgICArICdkZWZpbml0aXZlbHkgY2F1c2UgdGhlIGdhbWUgdG8gY3Jhc2ghJyl9XG4gICAgICAgICAgPC9wPlxuICAgICAgICAgIDxoND57dCgnTG9hZCBPcmRlcicpfTwvaDQ+XG4gICAgICAgICAgPHA+XG4gICAgICAgICAge3QoJ1RoaXMgaXMgYSBzbmFwc2hvdCBvZiB0aGUgbG9hZCBvcmRlciBpbmZvcm1hdGlvbiB0aGF0ICdcbiAgICAgICAgICAgKyAnd2lsbCBiZSBleHBvcnRlZCB3aXRoIHRoaXMgY29sbGVjdGlvbi4nKX1cbiAgICAgICAgICA8L3A+XG4gICAgICAgICAge3RoaXMucmVuZGVyTG9hZE9yZGVyRWRpdEluZm8oKX1cbiAgICAgICAgICA8TGlzdEdyb3VwIGlkPSdjb2xsZWN0aW9ucy1sb2FkLW9yZGVyLWxpc3QnPlxuICAgICAgICAgICAge09iamVjdC5rZXlzKHNvcnRlZE1vZHMpLm1hcCh0aGlzLnJlbmRlck1vZEVudHJ5KX1cbiAgICAgICAgICA8L0xpc3RHcm91cD5cbiAgICAgICAgPC9kaXY+XG4gICAgKSA6IHRoaXMucmVuZGVyUGxhY2Vob2xkZXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyTG9hZE9yZGVyRWRpdEluZm8gPSAoKSA9PiB7XG4gICAgY29uc3QgeyB0IH0gPSB0aGlzLnByb3BzO1xuICAgIHJldHVybiAoXG4gICAgICA8RmxleExheW91dCB0eXBlPSdyb3cnIGlkPSdjb2xsZWN0aW9uLWVkaXQtbG9hZG9yZGVyLWVkaXQtaW5mby1jb250YWluZXInPlxuICAgICAgICA8RmxleExheW91dC5GaXhlZCBjbGFzc05hbWU9J2xvYWRvcmRlci1lZGl0LWluZm8taWNvbic+XG4gICAgICAgICAgPEljb24gbmFtZT0nZGlhbG9nLWluZm8nLz5cbiAgICAgICAgPC9GbGV4TGF5b3V0LkZpeGVkPlxuICAgICAgICA8RmxleExheW91dC5GaXhlZCBjbGFzc05hbWU9J2NvbGxlY3Rpb24tZWRpdC1sb2Fkb3JkZXItZWRpdC1pbmZvJz5cbiAgICAgICAgICB7dCgnWW91IGNhbiBtYWtlIGNoYW5nZXMgdG8gdGhpcyBkYXRhIGZyb20gdGhlICcpfVxuICAgICAgICAgIDxhXG4gICAgICAgICAgICBjbGFzc05hbWU9J2Zha2UtbGluaydcbiAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub3BlbkxvYWRPcmRlclBhZ2V9XG4gICAgICAgICAgICB0aXRsZT17dCgnR28gdG8gTG9hZCBPcmRlciBQYWdlJyl9XG4gICAgICAgICAgPlxuICAgICAgICAgICAge3QoJ0xvYWQgT3JkZXIgcGFnZS4nKX1cbiAgICAgICAgICA8L2E+XG4gICAgICAgICAge3QoJyBJZiB5b3UgYmVsaWV2ZSBhIGxvYWQgb3JkZXIgZW50cnkgaXMgbWlzc2luZywgcGxlYXNlIGVuc3VyZSB0aGUgJ1xuICAgICAgICAgICsgJ3JlbGV2YW50IG1vZCBpcyBlbmFibGVkIGFuZCBoYXMgYmVlbiBhZGRlZCB0byB0aGUgY29sbGVjdGlvbi4nKX1cbiAgICAgICAgPC9GbGV4TGF5b3V0LkZpeGVkPlxuICAgICAgPC9GbGV4TGF5b3V0PlxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIG9wZW5Mb2FkT3JkZXJQYWdlID0gKCkgPT4ge1xuICAgIHRoaXMuY29udGV4dC5hcGkuZXZlbnRzLmVtaXQoJ3Nob3ctbWFpbi1wYWdlJywgJ2dlbmVyaWMtbG9hZG9yZGVyJyk7XG4gIH1cbiAgcHJpdmF0ZSByZW5kZXJPcGVuTE9CdXR0b24gPSAoKSA9PiB7XG4gICAgY29uc3QgeyB0IH0gPSB0aGlzLnByb3BzO1xuICAgIHJldHVybiAoPEJ1dHRvblxuICAgICAgaWQ9J2J0bi1tb3JlLW1vZHMnXG4gICAgICBjbGFzc05hbWU9J2NvbGxlY3Rpb24tYWRkLW1vZHMtYnRuJ1xuICAgICAgb25DbGljaz17dGhpcy5vcGVuTG9hZE9yZGVyUGFnZX1cbiAgICAgIGJzU3R5bGU9J2dob3N0J1xuICAgID5cbiAgICAgIHt0KCdPcGVuIExvYWQgT3JkZXIgUGFnZScpfVxuICAgIDwvQnV0dG9uPik7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlclBsYWNlaG9sZGVyID0gKCkgPT4ge1xuICAgIGNvbnN0IHsgdCB9ID0gdGhpcy5wcm9wcztcbiAgICByZXR1cm4gKFxuICAgICAgPEVtcHR5UGxhY2Vob2xkZXJcbiAgICAgICAgaWNvbj0nc29ydC1ub25lJ1xuICAgICAgICB0ZXh0PXt0KCdZb3UgaGF2ZSBubyBsb2FkIG9yZGVyIGVudHJpZXMgKGZvciB0aGUgY3VycmVudCBtb2RzIGluIHRoZSBjb2xsZWN0aW9uKScpfVxuICAgICAgICBzdWJ0ZXh0PXt0aGlzLnJlbmRlck9wZW5MT0J1dHRvbigpfVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJNb2RFbnRyeSA9IChtb2RJZDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgbG9FbnRyeTogSUxvYWRPcmRlckVudHJ5ID0gdGhpcy5zdGF0ZS5zb3J0ZWRNb2RzW21vZElkXTtcbiAgICBjb25zdCBrZXkgPSBtb2RJZCArIEpTT04uc3RyaW5naWZ5KGxvRW50cnkpO1xuICAgIGNvbnN0IG5hbWUgPSB1dGlsLnJlbmRlck1vZE5hbWUodGhpcy5wcm9wcy5tb2RzW21vZElkXSkgfHwgbW9kSWQ7XG4gICAgY29uc3QgY2xhc3NlcyA9IFsnbG9hZC1vcmRlci1lbnRyeScsICdjb2xsZWN0aW9uLXRhYiddO1xuICAgIHJldHVybiAoXG4gICAgICA8TGlzdEdyb3VwSXRlbVxuICAgICAgICBrZXk9e2tleX1cbiAgICAgICAgY2xhc3NOYW1lPXtjbGFzc2VzLmpvaW4oJyAnKX1cbiAgICAgID5cbiAgICAgICAgPEZsZXhMYXlvdXQgdHlwZT0ncm93Jz5cbiAgICAgICAgICA8cCBjbGFzc05hbWU9J2xvYWQtb3JkZXItaW5kZXgnPntsb0VudHJ5LnBvc308L3A+XG4gICAgICAgICAgPHA+e25hbWV9PC9wPlxuICAgICAgICA8L0ZsZXhMYXlvdXQ+XG4gICAgICA8L0xpc3RHcm91cEl0ZW0+XG4gICAgKTtcbiAgfVxufVxuXG5jb25zdCBlbXB0eSA9IHt9O1xuZnVuY3Rpb24gbWFwU3RhdGVUb1Byb3BzKHN0YXRlOiB0eXBlcy5JU3RhdGUsIG93blByb3BzOiBJUHJvcHMpOiBJQ29ubmVjdGVkUHJvcHMge1xuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpIHx8IHVuZGVmaW5lZDtcbiAgbGV0IGxvYWRPcmRlcjogSUxvYWRPcmRlciA9IHt9O1xuICBpZiAoISFwcm9maWxlPy5nYW1lSWQpIHtcbiAgICBsb2FkT3JkZXIgPSBzdGF0ZT8ucGVyc2lzdGVudD8ubG9hZE9yZGVyPy5bcHJvZmlsZS5pZF0gPz8gZW1wdHk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGdhbWVJZDogcHJvZmlsZT8uZ2FtZUlkLFxuICAgIGxvYWRPcmRlcixcbiAgICBtb2RzOiBzdGF0ZT8ucGVyc2lzdGVudD8ubW9kcz8uW3Byb2ZpbGUuZ2FtZUlkXSA/PyB7fSxcbiAgICBwcm9maWxlLFxuICB9O1xufVxuXG5mdW5jdGlvbiBtYXBEaXNwYXRjaFRvUHJvcHMoZGlzcGF0Y2g6IGFueSk6IElBY3Rpb25Qcm9wcyB7XG4gIHJldHVybiB7fTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgd2l0aFRyYW5zbGF0aW9uKFsnY29tbW9uJywgTkFNRVNQQUNFXSkoXG4gIGNvbm5lY3QobWFwU3RhdGVUb1Byb3BzLCBtYXBEaXNwYXRjaFRvUHJvcHMpKENvbGxlY3Rpb25zRGF0YVZpZXcpXG4pO1xuIl19