import { updateCreateCloudFormation, removeCloudFormation, getBucketName, getDeployments } from './cloudformation';
import { copyFolderToS3, removeAllFilesFromBucket } from './s3';
import fs from 'fs';

const assurePathExists = (path: string): boolean => {
    try {
        fs.readdirSync(path);
        return true;
    } catch (ex) {}
    return false;
};

export const deployHandler = async (
    name: string,
    path: string,
    region: string,
    useIndexAsDefault: boolean,
    stage: string
) => {
    try {
        const pathValid = assurePathExists(path);
        if (!pathValid) {
            throw new Error('The path supplied does not exist or is not readable');
        }
        const returnVal = await updateCreateCloudFormation(name, stage, useIndexAsDefault, region);
        await copyFolderToS3(returnVal.bucket, path, region);
        console.log('Bucket name: ', returnVal.bucket);
        console.log('Cloudfront domain: ', returnVal.cloudfront);
    } catch (e) {
        console.log(e);
    }
};

export const removeHandler = async (name: string, region: string, stage: string) => {
    try {
        const bucketName = await getBucketName(name, stage, region);
        await removeAllFilesFromBucket(bucketName, region);
        console.log('Removing cloudformation stack.');
        await removeCloudFormation(name, stage, region);
        console.log('The removal process of the cloudformation stack has begun, view the status in the web console.');
    } catch (e) {
        console.log(e);
    }
};

export const infoHandler = async (region: string, name?: string) => {
    try {
        const data = await getDeployments(region, name);
        console.table(data);
    } catch (e) {
        console.log(e);
    }
};
