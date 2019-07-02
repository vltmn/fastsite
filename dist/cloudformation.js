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
const util_1 = require("./util");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const template_1 = require("./template");
let cloudFormation;
const buildParams = (stackName, template) => ({
    StackName: stackName,
    TemplateBody: template
});
const createStack = (params) => cloudFormation.createStack(params).promise();
const updateStack = (params) => cloudFormation.updateStack(params).promise();
const deleteStack = (stackName) => cloudFormation.deleteStack(({ StackName: stackName })).promise().then(r => { return; });
const getTemplate = (stackName) => cloudFormation.getTemplate({ StackName: stackName })
    .promise().then(r => r.TemplateBody);
const waitForCloudFormation = (stackName) => __awaiter(this, void 0, void 0, function* () {
    let resp;
    resp = yield checkCloudFormation(stackName);
    if (!resp)
        throw new Error('Resp was undefined');
    while (resp.StackStatus == 'CREATE_IN_PROGRESS' ||
        resp.StackStatus == 'UPDATE_IN_PROGRESS' ||
        resp.StackStatus == 'DELETE_IN_PROGRESS') {
        yield util_1.sleep(500);
        resp = yield checkCloudFormation(stackName);
        if (!resp)
            throw new Error('Resp was undefined');
    }
});
const stackExists = (stackName) => cloudFormation.listStacks({}).promise()
    .then(stacks => stacks.StackSummaries && stacks.StackSummaries.filter(ss => ss.StackName === stackName).length > 0)
    .then(res => !!res);
const checkCloudFormation = (stackName) => cloudFormation.describeStacks({
    StackName: stackName
}).promise()
    .then(s => s.Stacks && s.Stacks[0]);
exports.removeCloudFormation = (name, region) => __awaiter(this, void 0, void 0, function* () {
    aws_sdk_1.default.config.update({
        region: region
    });
    cloudFormation = new aws_sdk_1.default.CloudFormation();
    const stackName = name;
    const exists = yield stackExists(stackName);
    yield deleteStack(stackName);
});
exports.getBucketName = (name, region) => __awaiter(this, void 0, void 0, function* () {
    aws_sdk_1.default.config.update({
        region: region
    });
    cloudFormation = new aws_sdk_1.default.CloudFormation();
    const stackName = name;
    const exists = yield stackExists(stackName);
    if (!exists) {
        throw new Error('The deployment supplied does not exist.');
    }
    const resp = yield checkCloudFormation(stackName);
    if (!resp)
        throw new Error('Undefined');
    const bucketName = getOutputValueFromStack(resp, 'S3BucketName');
    if (!bucketName)
        throw new Error('Undefined');
    return bucketName;
});
exports.updateCreateCloudFormation = (name, useIndexAsDefault, region) => __awaiter(this, void 0, void 0, function* () {
    aws_sdk_1.default.config.update({
        region: region
    });
    cloudFormation = new aws_sdk_1.default.CloudFormation();
    const stackName = name;
    const template = template_1.getTemplate({ defaultIndex: useIndexAsDefault });
    const params = buildParams(stackName, template);
    const exists = yield stackExists(stackName);
    if (exists) {
        const currentTemplate = yield getTemplate(stackName);
        if (!currentTemplate)
            throw new Error('No template found');
        if (currentTemplate != template) {
            yield updateStack(params);
        }
    }
    else {
        console.debug('Creating the cloudformation stack, this might take up to 15 minutes...');
        yield createStack(params);
    }
    yield waitForCloudFormation(stackName);
    const resp = yield checkCloudFormation(stackName);
    if (!resp) {
        throw new Error(resp);
    }
    const bucketName = getOutputValueFromStack(resp, 'S3BucketName');
    const distName = getOutputValueFromStack(resp, 'WebsiteURL');
    if (!bucketName || !distName) {
        throw new Error('Bad output values');
    }
    return {
        bucket: bucketName,
        cloudfront: distName
    };
});
const getOutputValueFromStack = (stack, output) => stack.Outputs && stack.Outputs.filter(o => o.OutputKey === output)[0].OutputValue;
//# sourceMappingURL=cloudformation.js.map