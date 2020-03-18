"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const mime_types_1 = __importDefault(require("mime-types"));
const crypto_1 = __importDefault(require("crypto"));
let s3;
exports.copyFolderToS3 = (bucketName, folder, region) => __awaiter(void 0, void 0, void 0, function* () {
    aws_sdk_1.default.config.update({
        region
    });
    s3 = new aws_sdk_1.default.S3();
    const filesToUpload = yield getFilesToUpload(bucketName, folder);
    yield Promise.all(filesToUpload.map(ftu => putFile(ftu, bucketName)));
});
// get files to upload with s3 diff
const getFilesToUpload = (bucketName, folder) => __awaiter(void 0, void 0, void 0, function* () {
    const allFiles = yield getAllFiles(folder, folder);
    const filteredFiles = (yield Promise.all(allFiles.map(f => s3HashNotEquals(f, bucketName).then(ne => ({ f, upload: ne })))))
        .filter(f => f.upload).map(f => f.f);
    console.log(`Uploading ${filteredFiles.length} out of ${allFiles.length} files`);
    return filteredFiles;
});
// get all recursive files from a given folder
const getAllFiles = (folder, baseFolder) => __awaiter(void 0, void 0, void 0, function* () {
    const files = fs_1.default.readdirSync(folder);
    const fileDirMap = files.map(file => path_1.default.join(folder, file))
        .map(path => ({ path, isDir: fs_1.default.lstatSync(path).isDirectory() }));
    const subDirFiles = yield Promise.all(fileDirMap.filter(e => e.isDir)
        .map(p => getAllFiles(p.path, baseFolder)))
        .then(files => files.reduce((acc, curr) => [...acc, ...curr], []));
    const directFiles = yield Promise.all(fileDirMap.filter(e => !e.isDir)
        .map(p => getFile(p.path, baseFolder)))
        .then(files => files.filter(f => f !== undefined).map(f => f));
    return [...subDirFiles, ...directFiles];
});
// returns true if the s3 hash is NOT equal and the file should be uploaded
const s3HashNotEquals = (file, bucketName) => __awaiter(void 0, void 0, void 0, function* () {
    const resp = yield s3.listObjectsV2({
        Bucket: bucketName,
        Prefix: file.s3Key
    }).promise();
    if (resp.$response.error || !resp.$response.data) {
        console.error(resp.$response);
        throw new Error('S3 list objects returned error');
    }
    const content = resp.$response.data.Contents;
    if (!content || content.length === 0) {
        return true;
    }
    const [first, ..._] = content;
    const s3Etag = first.ETag.replace(/^"(.*)"$/, '$1').toLocaleLowerCase();
    const fileHash = file.hash.toLocaleLowerCase();
    return s3Etag !== fileHash;
});
const getFile = (filePath, baseFolder) => __awaiter(void 0, void 0, void 0, function* () {
    const content = fs_1.default.readFileSync(filePath);
    const str = content.toString('utf8');
    const md5 = crypto_1.default.createHash('md5').update(str).digest('hex');
    const key = filePath.indexOf(baseFolder) == -1 ? filePath : filePath.substring((baseFolder + '/').length);
    const contentType = getContentType(filePath) || 'application/octet-stream';
    return {
        s3Key: key,
        contentType,
        data: content,
        hash: md5
    };
});
const getContentType = (filePath) => mime_types_1.default.lookup(filePath);
const putFile = (file, bucket) => __awaiter(void 0, void 0, void 0, function* () {
    return s3.putObject({
        Bucket: bucket,
        Key: file.s3Key,
        Body: file.data,
        ContentType: file.contentType
    }).promise().then(() => { return; });
});
const removeOneBatchFromBucket = (bucket) => __awaiter(void 0, void 0, void 0, function* () {
    const resp = yield s3.listObjectsV2({
        Bucket: bucket
    }).promise();
    if (!resp.Contents || resp.Contents.length == 0)
        return 0;
    const keys = [];
    for (const entry of resp.Contents) {
        if (!entry.Key)
            continue;
        keys.push(entry.Key);
    }
    yield s3.deleteObjects({
        Bucket: bucket,
        Delete: {
            Objects: keys.map(k => ({ Key: k }))
        }
    }).promise();
    return keys.length;
});
exports.removeAllFilesFromBucket = (bucketName, region) => __awaiter(void 0, void 0, void 0, function* () {
    aws_sdk_1.default.config.update({
        region
    });
    s3 = new aws_sdk_1.default.S3();
    let contentLeft = true;
    while (contentLeft) {
        const removed = yield removeOneBatchFromBucket(bucketName);
        if (removed < 950)
            contentLeft = false;
    }
    console.log('Files removed from s3.');
});
//# sourceMappingURL=s3.js.map