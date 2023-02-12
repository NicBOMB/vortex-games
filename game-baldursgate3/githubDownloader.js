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
exports.downloadDivine = exports.checkForUpdates = exports.getLatestReleases = void 0;
const https = __importStar(require("https"));
const _ = __importStar(require("lodash"));
const semver = __importStar(require("semver"));
const url = __importStar(require("url"));
const common_1 = require("./common");
const vortex_api_1 = require("vortex-api");
const GITHUB_URL = 'https://api.github.com/repos/Norbyte/lslib';
function query(baseUrl, request) {
    return new Promise((resolve, reject) => {
        const getRequest = getRequestOptions(`${baseUrl}/${request}`);
        https.get(getRequest, (res) => {
            res.setEncoding('utf-8');
            const msgHeaders = res.headers;
            const callsRemaining = parseInt(msgHeaders['x-ratelimit-remaining'] ?? '0', 10);
            if ((res.statusCode === 403) && (callsRemaining === 0)) {
                const resetDate = parseInt(msgHeaders['x-ratelimit-reset'] ?? '0', 10);
                (0, vortex_api_1.log)('info', 'GitHub rate limit exceeded', { reset_at: (new Date(resetDate)).toString() });
                return reject(new vortex_api_1.util.ProcessCanceled('GitHub rate limit exceeded'));
            }
            let output = '';
            res
                .on('data', data => output += data)
                .on('end', () => {
                try {
                    return resolve(JSON.parse(output));
                }
                catch (parseErr) {
                    return reject(parseErr);
                }
            });
        })
            .on('error', err => {
            return reject(err);
        })
            .end();
    });
}
function getRequestOptions(link) {
    const relUrl = url.parse(link);
    return ({
        ..._.pick(relUrl, ['port', 'hostname', 'path']),
        headers: {
            'User-Agent': 'Vortex',
        },
    });
}
async function downloadConsent(api) {
    return api.showDialog('error', 'Divine tool is missing', {
        bbcode: api.translate('Baldur\'s Gate 3\'s modding pattern in most (if not all) cases will require a 3rd '
            + 'party tool named "{{name}}" to manipulate game files.[br][/br][br][/br]'
            + 'Vortex can download and install this tool for you as a mod entry. Please ensure that the '
            + 'tool is always enabled and deployed on the mods page.[br][/br][br][/br]'
            + 'Please note that some Anti-Virus software may flag this tool as malicious due '
            + 'to the nature of the tool (unpacks .pak files). We suggest you ensure that '
            + 'your security software is configured to allow this tool to install.', { replace: { name: 'LSLib' } }),
    }, [
        { label: 'Cancel' },
        { label: 'Download' },
    ])
        .then(result => (result.action === 'Cancel')
        ? Promise.reject(new vortex_api_1.util.UserCanceled())
        : Promise.resolve());
}
async function notifyUpdate(api, latest, current) {
    const gameId = vortex_api_1.selectors.activeGameId(api.store.getState());
    const t = api.translate;
    return new Promise((resolve, reject) => {
        api.sendNotification({
            type: 'info',
            id: `divine-update`,
            noDismiss: true,
            allowSuppress: true,
            title: 'Update for {{name}}',
            message: 'Latest: {{latest}}, Installed: {{current}}',
            replace: {
                latest,
                current,
            },
            actions: [
                { title: 'More', action: (dismiss) => {
                        api.showDialog('info', '{{name}} Update', {
                            text: 'Vortex has detected a newer version of {{name}} ({{latest}}) available to download from {{website}}. You currently have version {{current}} installed.'
                                + '\nVortex can download and attempt to install the new update for you.',
                            parameters: {
                                name: 'LSLib/Divine Tool',
                                website: common_1.LSLIB_URL,
                                latest,
                                current,
                            },
                        }, [
                            {
                                label: 'Download',
                                action: () => {
                                    resolve();
                                    dismiss();
                                },
                            },
                        ]);
                    },
                },
                {
                    title: 'Dismiss',
                    action: (dismiss) => {
                        resolve();
                        dismiss();
                    },
                },
            ],
        });
    });
}
async function getLatestReleases(currentVersion) {
    if (GITHUB_URL) {
        return query(GITHUB_URL, 'releases')
            .then((releases) => {
            if (!Array.isArray(releases)) {
                return Promise.reject(new vortex_api_1.util.DataInvalid('expected array of github releases'));
            }
            const current = releases
                .filter(rel => {
                const tagName = rel?.tag_name;
                const isPreRelease = rel?.prerelease ?? false;
                const version = semver.valid(tagName);
                return (!isPreRelease
                    && (version !== null)
                    && ((currentVersion === undefined) || (semver.gte(version, currentVersion))));
            })
                .sort((lhs, rhs) => semver.compare(rhs.tag_name, lhs.tag_name));
            return Promise.resolve(current);
        });
    }
}
exports.getLatestReleases = getLatestReleases;
async function startDownload(api, downloadLink) {
    const redirectionURL = await new Promise((resolve, reject) => {
        https.request(getRequestOptions(downloadLink), res => {
            return resolve(res.headers['location']);
        })
            .on('error', err => reject(err))
            .end();
    });
    const dlInfo = {
        game: common_1.GAME_ID,
        name: 'LSLib/Divine Tool',
    };
    api.events.emit('start-download', [redirectionURL], dlInfo, undefined, (error, id) => {
        if (error !== null) {
            if ((error.name === 'AlreadyDownloaded')
                && (error.downloadId !== undefined)) {
                id = error.downloadId;
            }
            else {
                api.showErrorNotification('Download failed', error, { allowReport: false });
                return Promise.resolve();
            }
        }
        api.events.emit('start-install-download', id, true, (err, modId) => {
            if (err !== null) {
                api.showErrorNotification('Failed to install LSLib', err, { allowReport: false });
            }
            const state = api.getState();
            const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
            api.store.dispatch(vortex_api_1.actions.setModEnabled(profileId, modId, true));
            return Promise.resolve();
        });
    }, 'ask');
}
async function resolveDownloadLink(currentReleases) {
    const archives = currentReleases[0].assets.filter(asset => asset.name.match(/(ExportTool-v[0-9]+.[0-9]+.[0-9]+.zip)/i));
    const downloadLink = archives[0]?.browser_download_url;
    return (downloadLink === undefined)
        ? Promise.reject(new vortex_api_1.util.DataInvalid('Failed to resolve browser download url'))
        : Promise.resolve(downloadLink);
}
async function checkForUpdates(api, currentVersion) {
    return getLatestReleases(currentVersion)
        .then(async (currentReleases) => {
        if (currentReleases[0] === undefined) {
            (0, vortex_api_1.log)('error', 'Unable to update LSLib', 'Failed to find any releases');
            return Promise.resolve(currentVersion);
        }
        const mostRecentVersion = currentReleases[0].tag_name.slice(1);
        const downloadLink = await resolveDownloadLink(currentReleases);
        if (semver.valid(mostRecentVersion) === null) {
            return Promise.resolve(currentVersion);
        }
        else {
            if (semver.gt(mostRecentVersion, currentVersion)) {
                return notifyUpdate(api, mostRecentVersion, currentVersion)
                    .then(() => startDownload(api, downloadLink))
                    .then(() => Promise.resolve(mostRecentVersion));
            }
            else {
                return Promise.resolve(currentVersion);
            }
        }
    }).catch(err => {
        if (err instanceof vortex_api_1.util.UserCanceled || err instanceof vortex_api_1.util.ProcessCanceled) {
            return Promise.resolve(currentVersion);
        }
        api.showErrorNotification('Unable to update LSLib', err);
        return Promise.resolve(currentVersion);
    });
}
exports.checkForUpdates = checkForUpdates;
async function downloadDivine(api) {
    const state = api.store.getState();
    const gameId = vortex_api_1.selectors.activeGameId(state);
    return getLatestReleases(undefined)
        .then(async (currentReleases) => {
        const downloadLink = await resolveDownloadLink(currentReleases);
        return downloadConsent(api)
            .then(() => startDownload(api, downloadLink));
    })
        .catch(err => {
        if (err instanceof vortex_api_1.util.UserCanceled || err instanceof vortex_api_1.util.ProcessCanceled) {
            return Promise.resolve();
        }
        else {
            api.showErrorNotification('Unable to download/install LSLib', err);
            return Promise.resolve();
        }
    });
}
exports.downloadDivine = downloadDivine;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0aHViRG93bmxvYWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImdpdGh1YkRvd25sb2FkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSw2Q0FBK0I7QUFDL0IsMENBQTRCO0FBQzVCLCtDQUFpQztBQUNqQyx5Q0FBMkI7QUFFM0IscUNBQThDO0FBRzlDLDJDQUFrRTtBQUVsRSxNQUFNLFVBQVUsR0FBRyw0Q0FBNEMsQ0FBQztBQUVoRSxTQUFTLEtBQUssQ0FBQyxPQUFlLEVBQUUsT0FBZTtJQUM3QyxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1FBQ3JDLE1BQU0sVUFBVSxHQUFHLGlCQUFpQixDQUFDLEdBQUcsT0FBTyxJQUFJLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDOUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxHQUFvQixFQUFFLEVBQUU7WUFDN0MsR0FBRyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN6QixNQUFNLFVBQVUsR0FBd0IsR0FBRyxDQUFDLE9BQU8sQ0FBQztZQUNwRCxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDLHVCQUF1QixDQUFxQixJQUFJLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNwRyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLGNBQWMsS0FBSyxDQUFDLENBQUMsRUFBRTtnQkFDdEQsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxtQkFBbUIsQ0FBcUIsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQzNGLElBQUEsZ0JBQUcsRUFBQyxNQUFNLEVBQUUsNEJBQTRCLEVBQ3RDLEVBQUUsUUFBUSxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FB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QU0sTUFBTSxHQUFHLHNCQUFTLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzdDLE9BQU8saUJBQWlCLENBQUMsU0FBUyxDQUFDO1NBQ2hDLElBQUksQ0FBQyxLQUFLLEVBQUMsZUFBZSxFQUFDLEVBQUU7UUFDNUIsTUFBTSxZQUFZLEdBQUcsTUFBTSxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUNoRSxPQUFPLGVBQWUsQ0FBQyxHQUFHLENBQUM7YUFDeEIsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQztJQUNsRCxDQUFDLENBQUM7U0FDRCxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDWCxJQUFJLEdBQUcsWUFBWSxpQkFBSSxDQUFDLFlBQVksSUFBSSxHQUFHLFlBQVksaUJBQUksQ0FBQyxlQUFlLEVBQUU7WUFDM0UsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDMUI7YUFBTTtZQUNMLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxrQ0FBa0MsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNuRSxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUMxQjtJQUNILENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQWpCRCx3Q0FpQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBodHRwcyBmcm9tICdodHRwcyc7XG5pbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcbmltcG9ydCAqIGFzIHVybCBmcm9tICd1cmwnO1xuXG5pbXBvcnQgeyBHQU1FX0lELCBMU0xJQl9VUkwgfSBmcm9tICcuL2NvbW1vbic7XG5cbmltcG9ydCB7IEluY29taW5nSHR0cEhlYWRlcnMsIEluY29taW5nTWVzc2FnZSB9IGZyb20gJ2h0dHAnO1xuaW1wb3J0IHsgYWN0aW9ucywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmNvbnN0IEdJVEhVQl9VUkwgPSAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy9Ob3JieXRlL2xzbGliJztcblxuZnVuY3Rpb24gcXVlcnkoYmFzZVVybDogc3RyaW5nLCByZXF1ZXN0OiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNvbnN0IGdldFJlcXVlc3QgPSBnZXRSZXF1ZXN0T3B0aW9ucyhgJHtiYXNlVXJsfS8ke3JlcXVlc3R9YCk7XG4gICAgaHR0cHMuZ2V0KGdldFJlcXVlc3QsIChyZXM6IEluY29taW5nTWVzc2FnZSkgPT4ge1xuICAgICAgcmVzLnNldEVuY29kaW5nKCd1dGYtOCcpO1xuICAgICAgY29uc3QgbXNnSGVhZGVyczogSW5jb21pbmdIdHRwSGVhZGVycyA9IHJlcy5oZWFkZXJzO1xuICAgICAgY29uc3QgY2FsbHNSZW1haW5pbmcgPSBwYXJzZUludChtc2dIZWFkZXJzWyd4LXJhdGVsaW1pdC1yZW1haW5pbmcnXSBhcyBzdHJpbmd8dW5kZWZpbmVkID8/ICcwJywgMTApO1xuICAgICAgaWYgKChyZXMuc3RhdHVzQ29kZSA9PT0gNDAzKSAmJiAoY2FsbHNSZW1haW5pbmcgPT09IDApKSB7XG4gICAgICAgIGNvbnN0IHJlc2V0RGF0ZSA9IHBhcnNlSW50KG1zZ0hlYWRlcnNbJ3gtcmF0ZWxpbWl0LXJlc2V0J10gYXMgc3RyaW5nfHVuZGVmaW5lZCA/PyAnMCcsIDEwKTtcbiAgICAgICAgbG9nKCdpbmZvJywgJ0dpdEh1YiByYXRlIGxpbWl0IGV4Y2VlZGVkJyxcbiAgICAgICAgICB7IHJlc2V0X2F0OiAobmV3IERhdGUocmVzZXREYXRlKSkudG9TdHJpbmcoKSB9KTtcbiAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0dpdEh1YiByYXRlIGxpbWl0IGV4Y2VlZGVkJykpO1xuICAgICAgfVxuXG4gICAgICBsZXQgb3V0cHV0OiBzdHJpbmcgPSAnJztcbiAgICAgIHJlc1xuICAgICAgICAub24oJ2RhdGEnLCBkYXRhID0+IG91dHB1dCArPSBkYXRhKVxuICAgICAgICAub24oJ2VuZCcsICgpID0+IHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoSlNPTi5wYXJzZShvdXRwdXQpKTtcbiAgICAgICAgICB9IGNhdGNoIChwYXJzZUVycikge1xuICAgICAgICAgICAgcmV0dXJuIHJlamVjdChwYXJzZUVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KVxuICAgICAgLm9uKCdlcnJvcicsIGVyciA9PiB7XG4gICAgICAgIHJldHVybiByZWplY3QoZXJyKTtcbiAgICAgIH0pXG4gICAgICAuZW5kKCk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRSZXF1ZXN0T3B0aW9ucyhsaW5rKSB7XG4gIGNvbnN0IHJlbFVybCA9IHVybC5wYXJzZShsaW5rKTtcbiAgcmV0dXJuICh7XG4gICAgLi4uXy5waWNrKHJlbFVybCwgWydwb3J0JywgJ2hvc3RuYW1lJywgJ3BhdGgnXSksXG4gICAgaGVhZGVyczoge1xuICAgICAgJ1VzZXItQWdlbnQnOiAnVm9ydGV4JyxcbiAgICB9LFxuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZG93bmxvYWRDb25zZW50KGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8dm9pZD4ge1xuICByZXR1cm4gYXBpLnNob3dEaWFsb2coJ2Vycm9yJywgJ0RpdmluZSB0b29sIGlzIG1pc3NpbmcnLCB7XG4gICAgYmJjb2RlOiBhcGkudHJhbnNsYXRlKCdCYWxkdXJcXCdzIEdhdGUgM1xcJ3MgbW9kZGluZyBwYXR0ZXJuIGluIG1vc3QgKGlmIG5vdCBhbGwpIGNhc2VzIHdpbGwgcmVxdWlyZSBhIDNyZCAnXG4gICAgICArICdwYXJ0eSB0b29sIG5hbWVkIFwie3tuYW1lfX1cIiB0byBtYW5pcHVsYXRlIGdhbWUgZmlsZXMuW2JyXVsvYnJdW2JyXVsvYnJdJ1xuICAgICAgKyAnVm9ydGV4IGNhbiBkb3dubG9hZCBhbmQgaW5zdGFsbCB0aGlzIHRvb2wgZm9yIHlvdSBhcyBhIG1vZCBlbnRyeS4gUGxlYXNlIGVuc3VyZSB0aGF0IHRoZSAnXG4gICAgICArICd0b29sIGlzIGFsd2F5cyBlbmFibGVkIGFuZCBkZXBsb3llZCBvbiB0aGUgbW9kcyBwYWdlLlticl1bL2JyXVticl1bL2JyXSdcbiAgICAgICsgJ1BsZWFzZSBub3RlIHRoYXQgc29tZSBBbnRpLVZpcnVzIHNvZnR3YXJlIG1heSBmbGFnIHRoaXMgdG9vbCBhcyBtYWxpY2lvdXMgZHVlICdcbiAgICAgICsgJ3RvIHRoZSBuYXR1cmUgb2YgdGhlIHRvb2wgKHVucGFja3MgLnBhayBmaWxlcykuIFdlIHN1Z2dlc3QgeW91IGVuc3VyZSB0aGF0ICdcbiAgICAgICsgJ3lvdXIgc2VjdXJpdHkgc29mdHdhcmUgaXMgY29uZmlndXJlZCB0byBhbGxvdyB0aGlzIHRvb2wgdG8gaW5zdGFsbC4nLCB7IHJlcGxhY2U6IHsgbmFtZTogJ0xTTGliJyB9IH0pLFxuICB9LCBbXG4gICAgeyBsYWJlbDogJ0NhbmNlbCcgfSxcbiAgICB7IGxhYmVsOiAnRG93bmxvYWQnIH0sXG4gIF0pXG4gIC50aGVuKHJlc3VsdCA9PiAocmVzdWx0LmFjdGlvbiA9PT0gJ0NhbmNlbCcpXG4gICAgPyBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Vc2VyQ2FuY2VsZWQoKSlcbiAgICA6IFByb21pc2UucmVzb2x2ZSgpKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gbm90aWZ5VXBkYXRlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgbGF0ZXN0OiBzdHJpbmcsIGN1cnJlbnQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBnYW1lSWQgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGFwaS5zdG9yZS5nZXRTdGF0ZSgpKTtcbiAgY29uc3QgdCA9IGFwaS50cmFuc2xhdGU7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgICAgdHlwZTogJ2luZm8nLFxuICAgICAgaWQ6IGBkaXZpbmUtdXBkYXRlYCxcbiAgICAgIG5vRGlzbWlzczogdHJ1ZSxcbiAgICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXG4gICAgICB0aXRsZTogJ1VwZGF0ZSBmb3Ige3tuYW1lfX0nLFxuICAgICAgbWVzc2FnZTogJ0xhdGVzdDoge3tsYXRlc3R9fSwgSW5zdGFsbGVkOiB7e2N1cnJlbnR9fScsXG4gICAgICByZXBsYWNlOiB7XG4gICAgICAgIGxhdGVzdCxcbiAgICAgICAgY3VycmVudCxcbiAgICAgIH0sXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgIHsgdGl0bGUgOiAnTW9yZScsIGFjdGlvbjogKGRpc21pc3M6ICgpID0+IHZvaWQpID0+IHtcbiAgICAgICAgICAgIGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ3t7bmFtZX19IFVwZGF0ZScsIHtcbiAgICAgICAgICAgICAgdGV4dDogJ1ZvcnRleCBoYXMgZGV0ZWN0ZWQgYSBuZXdlciB2ZXJzaW9uIG9mIHt7bmFtZX19ICh7e2xhdGVzdH19KSBhdmFpbGFibGUgdG8gZG93bmxvYWQgZnJvbSB7e3dlYnNpdGV9fS4gWW91IGN1cnJlbnRseSBoYXZlIHZlcnNpb24ge3tjdXJyZW50fX0gaW5zdGFsbGVkLidcbiAgICAgICAgICAgICAgKyAnXFxuVm9ydGV4IGNhbiBkb3dubG9hZCBhbmQgYXR0ZW1wdCB0byBpbnN0YWxsIHRoZSBuZXcgdXBkYXRlIGZvciB5b3UuJyxcbiAgICAgICAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdMU0xpYi9EaXZpbmUgVG9vbCcsXG4gICAgICAgICAgICAgICAgd2Vic2l0ZTogTFNMSUJfVVJMLFxuICAgICAgICAgICAgICAgIGxhdGVzdCxcbiAgICAgICAgICAgICAgICBjdXJyZW50LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSwgW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGxhYmVsOiAnRG93bmxvYWQnLFxuICAgICAgICAgICAgICAgICAgYWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgZGlzbWlzcygpO1xuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgdGl0bGU6ICdEaXNtaXNzJyxcbiAgICAgICAgICBhY3Rpb246IChkaXNtaXNzKSA9PiB7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICBkaXNtaXNzKCk7XG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG4gIH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TGF0ZXN0UmVsZWFzZXMoY3VycmVudFZlcnNpb246IHN0cmluZykge1xuICBpZiAoR0lUSFVCX1VSTCkge1xuICAgIHJldHVybiBxdWVyeShHSVRIVUJfVVJMLCAncmVsZWFzZXMnKVxuICAgIC50aGVuKChyZWxlYXNlcykgPT4ge1xuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJlbGVhc2VzKSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoJ2V4cGVjdGVkIGFycmF5IG9mIGdpdGh1YiByZWxlYXNlcycpKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGN1cnJlbnQgPSByZWxlYXNlc1xuICAgICAgICAuZmlsdGVyKHJlbCA9PiB7XG4gICAgICAgICAgY29uc3QgdGFnTmFtZSA9IHJlbD8udGFnX25hbWU7XG4gICAgICAgICAgY29uc3QgaXNQcmVSZWxlYXNlID0gcmVsPy5wcmVyZWxlYXNlID8/IGZhbHNlO1xuICAgICAgICAgIGNvbnN0IHZlcnNpb24gPSBzZW12ZXIudmFsaWQodGFnTmFtZSk7XG5cbiAgICAgICAgICByZXR1cm4gKCFpc1ByZVJlbGVhc2VcbiAgICAgICAgICAgICYmICh2ZXJzaW9uICE9PSBudWxsKVxuICAgICAgICAgICAgJiYgKChjdXJyZW50VmVyc2lvbiA9PT0gdW5kZWZpbmVkKSB8fCAoc2VtdmVyLmd0ZSh2ZXJzaW9uLCBjdXJyZW50VmVyc2lvbikpKSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5zb3J0KChsaHMsIHJocykgPT4gc2VtdmVyLmNvbXBhcmUocmhzLnRhZ19uYW1lLCBsaHMudGFnX25hbWUpKTtcblxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjdXJyZW50KTtcbiAgICB9KTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBzdGFydERvd25sb2FkKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZG93bmxvYWRMaW5rOiBzdHJpbmcpIHtcbiAgY29uc3QgcmVkaXJlY3Rpb25VUkwgPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgaHR0cHMucmVxdWVzdChnZXRSZXF1ZXN0T3B0aW9ucyhkb3dubG9hZExpbmspLCByZXMgPT4ge1xuICAgICAgcmV0dXJuIHJlc29sdmUocmVzLmhlYWRlcnNbJ2xvY2F0aW9uJ10pO1xuICAgIH0pXG4gICAgICAub24oJ2Vycm9yJywgZXJyID0+IHJlamVjdChlcnIpKVxuICAgICAgLmVuZCgpO1xuICB9KTtcbiAgY29uc3QgZGxJbmZvID0ge1xuICAgIGdhbWU6IEdBTUVfSUQsXG4gICAgbmFtZTogJ0xTTGliL0RpdmluZSBUb29sJyxcbiAgfTtcbiAgYXBpLmV2ZW50cy5lbWl0KCdzdGFydC1kb3dubG9hZCcsIFtyZWRpcmVjdGlvblVSTF0sIGRsSW5mbywgdW5kZWZpbmVkLFxuICAgIChlcnJvciwgaWQpID0+IHtcbiAgICAgIGlmIChlcnJvciAhPT0gbnVsbCkge1xuICAgICAgICBpZiAoKGVycm9yLm5hbWUgPT09ICdBbHJlYWR5RG93bmxvYWRlZCcpXG4gICAgICAgICAgICAmJiAoZXJyb3IuZG93bmxvYWRJZCAhPT0gdW5kZWZpbmVkKSkge1xuICAgICAgICAgIGlkID0gZXJyb3IuZG93bmxvYWRJZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdEb3dubG9hZCBmYWlsZWQnLFxuICAgICAgICAgICAgZXJyb3IsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYXBpLmV2ZW50cy5lbWl0KCdzdGFydC1pbnN0YWxsLWRvd25sb2FkJywgaWQsIHRydWUsIChlcnIsIG1vZElkKSA9PiB7XG4gICAgICAgIGlmIChlcnIgIT09IG51bGwpIHtcbiAgICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gaW5zdGFsbCBMU0xpYicsXG4gICAgICAgICAgICBlcnIsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgICAgICAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gICAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEVuYWJsZWQocHJvZmlsZUlkLCBtb2RJZCwgdHJ1ZSkpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9KTtcbiAgICB9LCAnYXNrJyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlc29sdmVEb3dubG9hZExpbmsoY3VycmVudFJlbGVhc2VzOiBhbnlbXSkge1xuICBjb25zdCBhcmNoaXZlcyA9IGN1cnJlbnRSZWxlYXNlc1swXS5hc3NldHMuZmlsdGVyKGFzc2V0ID0+XG4gICAgYXNzZXQubmFtZS5tYXRjaCgvKEV4cG9ydFRvb2wtdlswLTldKy5bMC05XSsuWzAtOV0rLnppcCkvaSkpO1xuXG4gIGNvbnN0IGRvd25sb2FkTGluayA9IGFyY2hpdmVzWzBdPy5icm93c2VyX2Rvd25sb2FkX3VybDtcbiAgcmV0dXJuIChkb3dubG9hZExpbmsgPT09IHVuZGVmaW5lZClcbiAgICA/IFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdGYWlsZWQgdG8gcmVzb2x2ZSBicm93c2VyIGRvd25sb2FkIHVybCcpKVxuICAgIDogUHJvbWlzZS5yZXNvbHZlKGRvd25sb2FkTGluayk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjaGVja0ZvclVwZGF0ZXMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmVyc2lvbjogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgcmV0dXJuIGdldExhdGVzdFJlbGVhc2VzKGN1cnJlbnRWZXJzaW9uKVxuICAgIC50aGVuKGFzeW5jIGN1cnJlbnRSZWxlYXNlcyA9PiB7XG4gICAgICBpZiAoY3VycmVudFJlbGVhc2VzWzBdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gV2UgZmFpbGVkIHRvIGNoZWNrIGZvciB1cGRhdGVzIC0gdGhhdCdzIHVuZm9ydHVuYXRlIGJ1dCBzaG91bGRuJ3RcbiAgICAgICAgLy8gIGJlIHJlcG9ydGVkIHRvIHRoZSB1c2VyIGFzIGl0IHdpbGwganVzdCBjb25mdXNlIHRoZW0uXG4gICAgICAgIGxvZygnZXJyb3InLCAnVW5hYmxlIHRvIHVwZGF0ZSBMU0xpYicsICdGYWlsZWQgdG8gZmluZCBhbnkgcmVsZWFzZXMnKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjdXJyZW50VmVyc2lvbik7XG4gICAgICB9XG4gICAgICBjb25zdCBtb3N0UmVjZW50VmVyc2lvbiA9IGN1cnJlbnRSZWxlYXNlc1swXS50YWdfbmFtZS5zbGljZSgxKTtcbiAgICAgIGNvbnN0IGRvd25sb2FkTGluayA9IGF3YWl0IHJlc29sdmVEb3dubG9hZExpbmsoY3VycmVudFJlbGVhc2VzKTtcbiAgICAgIGlmIChzZW12ZXIudmFsaWQobW9zdFJlY2VudFZlcnNpb24pID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY3VycmVudFZlcnNpb24pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHNlbXZlci5ndChtb3N0UmVjZW50VmVyc2lvbiwgY3VycmVudFZlcnNpb24pKSB7XG4gICAgICAgICAgcmV0dXJuIG5vdGlmeVVwZGF0ZShhcGksIG1vc3RSZWNlbnRWZXJzaW9uLCBjdXJyZW50VmVyc2lvbilcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHN0YXJ0RG93bmxvYWQoYXBpLCBkb3dubG9hZExpbmspKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKG1vc3RSZWNlbnRWZXJzaW9uKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjdXJyZW50VmVyc2lvbik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkIHx8IGVyciBpbnN0YW5jZW9mIHV0aWwuUHJvY2Vzc0NhbmNlbGVkKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY3VycmVudFZlcnNpb24pO1xuICAgICAgfVxuXG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdVbmFibGUgdG8gdXBkYXRlIExTTGliJywgZXJyKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY3VycmVudFZlcnNpb24pO1xuICAgIH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZG93bmxvYWREaXZpbmUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gIGNvbnN0IGdhbWVJZCA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xuICByZXR1cm4gZ2V0TGF0ZXN0UmVsZWFzZXModW5kZWZpbmVkKVxuICAgIC50aGVuKGFzeW5jIGN1cnJlbnRSZWxlYXNlcyA9PiB7XG4gICAgICBjb25zdCBkb3dubG9hZExpbmsgPSBhd2FpdCByZXNvbHZlRG93bmxvYWRMaW5rKGN1cnJlbnRSZWxlYXNlcyk7XG4gICAgICByZXR1cm4gZG93bmxvYWRDb25zZW50KGFwaSlcbiAgICAgICAgLnRoZW4oKCkgPT4gc3RhcnREb3dubG9hZChhcGksIGRvd25sb2FkTGluaykpO1xuICAgIH0pXG4gICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICBpZiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQgfHwgZXJyIGluc3RhbmNlb2YgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignVW5hYmxlIHRvIGRvd25sb2FkL2luc3RhbGwgTFNMaWInLCBlcnIpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9XG4gICAgfSk7XG59XG4iXX0=