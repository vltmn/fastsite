import { updateCreateCloudFormation } from './cloudformation';
const s3 = require('./s3');

export const deployHandler = async (name: string, path: string, region: string, stage: string) => {
    const cfName = `${name}-${stage}`;
    try {
        const bucketName = await updateCreateCloudFormation(cfName, region);
        console.log('BUCKET NAME: ', bucketName);
    } catch (e) {
        console.log(e);
    }
    console.log('DONE');
};

export const removeHandler = async (name: string, region: string, stage: string) => {
};
