import { updateCreateCloudFormation, removeCloudFormation } from './cloudformation';
import { copyFolderToS3, removeAllFilesFromBucket } from './s3';

export const deployHandler = async (name: string, path: string, region: string, stage: string) => {
    const cfName = `${name}-${stage}`;
    try {
        const returnVal = await updateCreateCloudFormation(cfName, region);
        await copyFolderToS3(returnVal.bucket, path, region);
        console.log('Bucket name: ', returnVal.bucket);
        console.log('Cloudfront domain: ', returnVal.cloudfront);
    } catch (e) {
        console.log(e);
    }
    console.log('DONE');
};

export const removeHandler = async (name: string, region: string, stage: string) => {
};
