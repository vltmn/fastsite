"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cloudformation_1 = require("./cloudformation");
const s3_1 = require("./s3");
exports.deployHandler = (name, path, region, stage) => __awaiter(this, void 0, void 0, function* () {
    const cfName = `${name}-${stage}`;
    try {
        const returnVal = yield cloudformation_1.updateCreateCloudFormation(cfName, region);
        yield s3_1.copyFolderToS3(returnVal.bucket, path, region);
        console.log('Bucket name: ', returnVal.bucket);
        console.log('Cloudfront domain: ', returnVal.cloudfront);
    }
    catch (e) {
        console.log(e);
    }
});
exports.removeHandler = (name, region, stage) => __awaiter(this, void 0, void 0, function* () {
    const cfName = `${name}-${stage}`;
    try {
        const bucketName = yield cloudformation_1.getBucketName(cfName, region);
        yield s3_1.removeAllFilesFromBucket(bucketName, region);
        console.log('Removing cloudformation stack.');
        yield cloudformation_1.removeCloudFormation(cfName, region);
        console.log('The removal process of the cloudformation stack has begun, view the status in the web console.');
    }
    catch (e) {
        console.log(e);
    }
});
//# sourceMappingURL=handlers.js.map