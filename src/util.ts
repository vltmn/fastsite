import { Tags } from 'aws-sdk/clients/cloudformation';

export const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
const tagsToObj = (tags: Tags): { [key: string]: string } =>
    tags.sort((a, b) => a.Key.localeCompare(b.Key)).reduce((acc, curr) => ({ [curr.Key]: curr.Value, ...acc }), {});
export const tagsEquals = (tagsA: Tags | undefined, tagsB: Tags | undefined) => {
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
