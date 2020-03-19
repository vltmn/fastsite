"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = (ms) => new Promise(res => setTimeout(res, ms));
const tagsToObj = (tags) => tags.sort((a, b) => a.Key.localeCompare(b.Key)).reduce((acc, curr) => (Object.assign({ [curr.Key]: curr.Value }, acc)), {});
exports.tagsEquals = (tagsA, tagsB) => {
    if (tagsA === tagsB) {
        return true;
    }
    if (!tagsA || !tagsB) {
        return false;
    }
    if (tagsA.length !== tagsB.length) {
        return false;
    }
    const objA = tagsToObj(tagsA);
    const objB = tagsToObj(tagsB);
    const entriesB = Object.entries(objB);
    return Object.entries(objA).every((e, i) => entriesB[i][0] === e[0] && entriesB[i][1] === e[1]);
};
//# sourceMappingURL=util.js.map