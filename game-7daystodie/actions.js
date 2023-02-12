"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPreviousLO = exports.setUDF = exports.setPrefixOffset = void 0;
const redux_act_1 = require("redux-act");
exports.setPrefixOffset = (0, redux_act_1.createAction)('7DTD_SET_PREFIX_OFFSET', (profile, offset) => ({ profile, offset }));
exports.setUDF = (0, redux_act_1.createAction)('7DTD_SET_UDF', (udf) => ({ udf }));
exports.setPreviousLO = (0, redux_act_1.createAction)('7DTD_SET_PREVIOUS_LO', (profile, previousLO) => ({ profile, previousLO }));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EseUNBQXlDO0FBRTVCLFFBQUEsZUFBZSxHQUFHLElBQUEsd0JBQVksRUFBQyx3QkFBd0IsRUFDbEUsQ0FBQyxPQUFlLEVBQUUsTUFBYyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztBQUVqRCxRQUFBLE1BQU0sR0FBRyxJQUFBLHdCQUFZLEVBQUMsY0FBYyxFQUMvQyxDQUFDLEdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUVqQixRQUFBLGFBQWEsR0FBRyxJQUFBLHdCQUFZLEVBQUMsc0JBQXNCLEVBQzlELENBQUMsT0FBZSxFQUFFLFVBQXFCLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTG9hZE9yZGVyIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBjcmVhdGVBY3Rpb24gfSBmcm9tICdyZWR1eC1hY3QnO1xuXG5leHBvcnQgY29uc3Qgc2V0UHJlZml4T2Zmc2V0ID0gY3JlYXRlQWN0aW9uKCc3RFREX1NFVF9QUkVGSVhfT0ZGU0VUJyxcbiAgKHByb2ZpbGU6IHN0cmluZywgb2Zmc2V0OiBudW1iZXIpID0+ICh7IHByb2ZpbGUsIG9mZnNldCB9KSk7XG5cbmV4cG9ydCBjb25zdCBzZXRVREYgPSBjcmVhdGVBY3Rpb24oJzdEVERfU0VUX1VERicsXG4gICh1ZGY6IHN0cmluZykgPT4gKHsgdWRmIH0pKTtcblxuZXhwb3J0IGNvbnN0IHNldFByZXZpb3VzTE8gPSBjcmVhdGVBY3Rpb24oJzdEVERfU0VUX1BSRVZJT1VTX0xPJyxcbiAgKHByb2ZpbGU6IHN0cmluZywgcHJldmlvdXNMTzogTG9hZE9yZGVyKSA9PiAoeyBwcm9maWxlLCBwcmV2aW91c0xPIH0pKTsiXX0=