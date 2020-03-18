import fs from 'fs';
import path from 'path';
import aws, { S3 } from 'aws-sdk';
import mime from 'mime-types';
import crypto from 'crypto';

let s3: S3;

interface File {
    s3Key: string;
    contentType: string;
    data: Buffer;
    hash: string;
}

const getContentType = (filePath: string): string | false => mime.lookup(filePath);

const getFile = async (filePath: string, baseFolder: string): Promise<File | undefined> => {
    const content = fs.readFileSync(filePath);
    const str = content.toString('utf8');
    const md5 = crypto
        .createHash('md5')
        .update(str)
        .digest('hex');
    const key = filePath.indexOf(baseFolder) == -1 ? filePath : filePath.substring((baseFolder + '/').length);
    const contentType = getContentType(filePath) || 'application/octet-stream';
    return {
        s3Key: key,
        contentType,
        data: content,
        hash: md5
    };
};

// get all recursive files from a given folder
const getAllFiles = async (folder: string, baseFolder: string): Promise<File[]> => {
    const files = fs.readdirSync(folder);
    const fileDirMap = files
        .map(file => path.join(folder, file))
        .map(path => ({ path, isDir: fs.lstatSync(path).isDirectory() }));

    const allPromise = fileDirMap.filter(e => e.isDir).map(p => getAllFiles(p.path, baseFolder));
    const subDirFiles: File[] = await Promise.all(allPromise).then(files =>
        files.reduce((acc, curr) => [...acc, ...curr], [])
    );

    const directFiles: File[] = await Promise.all(
        fileDirMap.filter(e => !e.isDir).map(p => getFile(p.path, baseFolder))
    ).then(files => files.filter(f => f !== undefined).map(f => f as File));
    return [...subDirFiles, ...directFiles];
};

// returns true if the s3 hash is NOT equal and the file should be uploaded
const s3HashNotEquals = async (file: File, bucketName: string): Promise<boolean> => {
    const resp = await s3
        .listObjectsV2({
            Bucket: bucketName,
            Prefix: file.s3Key
        })
        .promise();
    if (resp.$response.error || !resp.$response.data) {
        console.error(resp.$response);
        throw new Error('S3 list objects returned error');
    }
    const content = resp.$response.data.Contents;
    if (!content || content.length === 0) {
        return true;
    }
    const [first] = content;
    const s3Etag = (first.ETag as string).replace(/^"(.*)"$/, '$1').toLocaleLowerCase();
    const fileHash = file.hash.toLocaleLowerCase();
    return s3Etag !== fileHash;
};

// get files to upload with s3 diff
const getFilesToUpload = async (bucketName: string, folder: string): Promise<File[]> => {
    const allFiles = await getAllFiles(folder, folder);
    const filteredFiles = (
        await Promise.all(allFiles.map(f => s3HashNotEquals(f, bucketName).then(ne => ({ f, upload: ne }))))
    )
        .filter(f => f.upload)
        .map(f => f.f);
    console.log(`Uploading ${filteredFiles.length} out of ${allFiles.length} files`);
    return filteredFiles;
};

const putFile = async (file: File, bucket: string): Promise<void> => {
    return s3
        .putObject({
            Bucket: bucket,
            Key: file.s3Key,
            Body: file.data,
            ContentType: file.contentType
        })
        .promise()
        .then(() => {
            return;
        });
};

export const copyFolderToS3 = async (bucketName: string, folder: string, region: string) => {
    aws.config.update({
        region
    });
    s3 = new aws.S3();
    const filesToUpload: File[] = await getFilesToUpload(bucketName, folder);
    await Promise.all(filesToUpload.map(ftu => putFile(ftu, bucketName)));
};

const removeOneBatchFromBucket = async (bucket: string): Promise<number> => {
    const resp = await s3.listObjectsV2({ Bucket: bucket }).promise();
    if (!resp.Contents || resp.Contents.length == 0) return 0;
    const keys: string[] = [];
    for (const entry of resp.Contents) {
        if (!entry.Key) continue;
        keys.push(entry.Key);
    }

    await s3
        .deleteObjects({
            Bucket: bucket,
            Delete: {
                Objects: keys.map(k => ({ Key: k }))
            }
        })
        .promise();
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
