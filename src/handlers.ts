import { updateCreateCloudFormation, removeCloudFormation, getBucketName } from './cloudformation';
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
};

export const removeHandler = async (name: string, region: string, stage: string) => {
    const cfName = `${name}-${stage}`;
    try {
        const bucketName = await getBucketName(cfName, region);
        await removeAllFilesFromBucket(bucketName, region);
        console.log('Removing cloudformation stack.');
        await removeCloudFormation(cfName, region);
        console.log('The removal process of the cloudformation stack has begun, view the status in the web console.');
    } catch (e) {
        console.log(e);
    }
};
