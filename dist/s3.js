"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
let s3;
exports.copyFolderToS3 = (bucketName, folder, region) => __awaiter(this, void 0, void 0, function* () {
    aws_sdk_1.default.config.update({
        region
    });
    s3 = new aws_sdk_1.default.S3();
    yield internalCopyToS3(bucketName, folder, folder);
});
const internalCopyToS3 = (bucketName, folder, baseFolder) => __awaiter(this, void 0, void 0, function* () {
    const files = fs_1.default.readdirSync(folder);
    for (const file of files) {
        const filePath = path_1.default.join(folder, file);
        if (fs_1.default.lstatSync(filePath).isDirectory()) {
            // is a directory, recurse down
            yield internalCopyToS3(bucketName, filePath, baseFolder);
            continue;
        }
        const fileResp = yield getFile(filePath, baseFolder);
        if (!fileResp) {
            // file is not an OK mime type, continue
            continue;
        }
        yield putFile(fileResp, bucketName);
    }
});
const getFile = (filePath, baseFolder) => __awaiter(this, void 0, void 0, function* () {
    const content = fs_1.default.readFileSync(filePath);
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
});
const getContentType = (filePath) => mime_types_1.default.lookup(filePath);
const putFile = (file, bucket) => __awaiter(this, void 0, void 0, function* () {
    return s3.putObject({
        Bucket: bucket,
        Key: file.s3Key,
        Body: file.data,
        ContentType: file.contentType
    }).promise().then(() => { return; });
});
const removeOneBatchFromBucket = (bucket) => __awaiter(this, void 0, void 0, function* () {
    const resp = yield s3.listObjectsV2({
        Bucket: bucket
    }).promise();
    if (!resp.Contents)
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
exports.removeAllFilesFromBucket = (bucketName) => __awaiter(this, void 0, void 0, function* () {
    let contentLeft = true;
    while (contentLeft) {
        const removed = yield removeOneBatchFromBucket(bucketName);
        if (removed < 950)
            contentLeft = false;
    }
    console.log('Files removed from s3.');
});
//# sourceMappingURL=s3.js.map