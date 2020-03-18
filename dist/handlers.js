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
const cloudformation_1 = require("./cloudformation");
const s3_1 = require("./s3");
const fs_1 = __importDefault(require("fs"));
const assurePathExists = (path) => {
    try {
        fs_1.default.readdirSync(path);
        return true;
    }
    catch (ex) { }
    return false;
};
exports.deployHandler = (name, path, region, useIndexAsDefault, stage) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pathValid = assurePathExists(path);
        if (!pathValid) {
            throw new Error('The path supplied does not exist or is not readable');
        }
        const returnVal = yield cloudformation_1.updateCreateCloudFormation(name, stage, useIndexAsDefault, region);
        yield s3_1.copyFolderToS3(returnVal.bucket, path, region);
        console.log('Bucket name: ', returnVal.bucket);
        console.log('Cloudfront domain: ', returnVal.cloudfront);
    }
    catch (e) {
        console.log(e);
    }
});
exports.removeHandler = (name, region, stage) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bucketName = yield cloudformation_1.getBucketName(name, stage, region);
        yield s3_1.removeAllFilesFromBucket(bucketName, region);
        console.log('Removing cloudformation stack.');
        yield cloudformation_1.removeCloudFormation(name, stage, region);
        console.log('The removal process of the cloudformation stack has begun, view the status in the web console.');
    }
    catch (e) {
        console.log(e);
    }
});
exports.infoHandler = (region, name) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield cloudformation_1.getDeployments(region, name);
        console.table(data);
    }
    catch (e) {
        console.log(e);
    }
});
//# sourceMappingURL=handlers.js.map