import fs from 'fs';
import path from 'path';
import aws, { S3 } from 'aws-sdk';
import mime from 'mime-types';

let s3: S3;
export const copyFolderToS3 = async (bucketName: string, folder: string, region: string) => {
    aws.config.update({
        region
    });
    s3 = new aws.S3();
    await internalCopyToS3(bucketName, folder, folder);
};

const internalCopyToS3 = async (bucketName: string, folder: string, baseFolder: string) => {
    const files = fs.readdirSync(folder);
    for (const file of files) {
        const filePath = path.join(folder, file);
        if (fs.lstatSync(filePath).isDirectory()) {
            // is a directory, recurse down
            await internalCopyToS3(bucketName, filePath, baseFolder);
            continue;
        }
        const fileResp = await getFile(filePath, baseFolder);
        if (!fileResp) {
            // file is not an OK mime type, continue
            continue;
        }
        await putFile(fileResp, bucketName);
    }
};

interface File {
    s3Key: string;
    contentType: string;
    data: Buffer;
}

const getFile = async (filePath: string, baseFolder: string): Promise<File | undefined> => {
    const content = fs.readFileSync(filePath);
    const key = filePath.indexOf(baseFolder) == -1 ? filePath : filePath.substring((baseFolder + '/').length);
    const contentType = getContentType(filePath);
    if (!contentType) {
        return undefined;
    }
    return {
        s3Key: key,
        contentType,
        data: content
    };
};

const getContentType = (filePath: string): string | false => mime.lookup(filePath);

const putFile = async (file: File, bucket: string): Promise<void> =>
    s3.putObject({
        Bucket: bucket,
        Key: file.s3Key,
        Body: file.data,
        ContentType: file.contentType
    }).promise().then(() => {return; });

const removeOneBatchFromBucket = async (bucket: string): Promise<number> => {
    const resp = await s3.listObjectsV2({
        Bucket: bucket
    }).promise();
    if (!resp.Contents || resp.Contents.length == 0) return 0;
    const keys: string[] = [];
    for (const entry of resp.Contents) {
        if (!entry.Key) continue;
        keys.push(entry.Key);
    }

    await s3.deleteObjects({
        Bucket: bucket,
        Delete: {
            Objects: keys.map(k => ({Key: k}))
        }
    }).promise();
    return keys.length;
};

export const removeAllFilesFromBucket = async (bucketName: string, region: string) => {
    aws.config.update({
        region
    });
    s3 = new aws.S3();
    let contentLeft = true;
    while (contentLeft) {
        const removed = await removeOneBatchFromBucket(bucketName);
        if (removed < 950) contentLeft = false;
    }
    console.log('Files removed from s3.');
};
