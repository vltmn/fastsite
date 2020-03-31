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
const util_1 = require("./util");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const template_1 = require("./template");
let cloudFormation;
exports.buildStackName = (name, stage) => `${name}-${stage}`;
const buildParams = (name, stage, template) => ({
    StackName: exports.buildStackName(name, stage),
    TemplateBody: template,
    Tags: [
        {
            Key: 'fastsite',
            Value: 'true'
        },
        {
            Key: 'fastsite-name',
            Value: name
        },
        {
            Key: 'fastsite-stage',
            Value: stage
        }
    ]
});
const createStack = (params) => cloudFormation.createStack(params).promise();
const updateStack = (params) => cloudFormation.updateStack(params).promise();
const deleteStack = (stackName) => cloudFormation
    .deleteStack({ StackName: stackName })
    .promise()
    .then(() => {
    return;
});
const getTemplate = (stackName) => cloudFormation
    .getTemplate({ StackName: stackName })
    .promise()
    .then(r => r.TemplateBody);
const getTags = (stackName) => cloudFormation
    .describeStacks({ StackName: stackName })
    .promise()
    .then(r => {
    if (!r.Stacks || r.$response.error) {
        throw new Error('Could not get stack for getting tags');
    }
    return r.Stacks[0].Tags;
});
const checkCloudFormation = (stackName) => cloudFormation
    .describeStacks({
    StackName: stackName
})
    .promise()
    .then(s => s.Stacks && s.Stacks[0]);
const waitForCloudFormation = (stackName) => __awaiter(void 0, void 0, void 0, function* () {
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
const stackExists = (stackName) => cloudFormation
    .listStacks({})
    .promise()
    .then(stacks => stacks.StackSummaries &&
    stacks.StackSummaries.filter(ss => ss.StackName === stackName).filter(ss => ss.StackStatus !== 'DELETE_COMPLETE').length > 0)
    .then(res => !!res);
exports.removeCloudFormation = (name, stage, region) => __awaiter(void 0, void 0, void 0, function* () {
    aws_sdk_1.default.config.update({
        region: region
    });
    cloudFormation = new aws_sdk_1.default.CloudFormation();
    const stackName = exports.buildStackName(name, stage);
    yield stackExists(stackName);
    yield deleteStack(stackName);
});
const getOutputValueFromStack = (stack, output) => stack.Outputs && stack.Outputs.filter(o => o.OutputKey === output)[0].OutputValue;
exports.getBucketName = (name, stage, region) => __awaiter(void 0, void 0, void 0, function* () {
    aws_sdk_1.default.config.update({
        region: region
    });
    cloudFormation = new aws_sdk_1.default.CloudFormation();
    const stackName = exports.buildStackName(name, stage);
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
exports.updateCreateCloudFormation = (name, stage, useIndexAsDefault, region) => __awaiter(void 0, void 0, void 0, function* () {
    aws_sdk_1.default.config.update({
        region: region
    });
    cloudFormation = new aws_sdk_1.default.CloudFormation();
    const stackName = exports.buildStackName(name, stage);
    const template = template_1.getTemplate({ defaultIndex: useIndexAsDefault });
    const params = buildParams(name, stage, template);
    const exists = yield stackExists(stackName);
    if (exists) {
        const currentTemplate = yield getTemplate(stackName);
        const currentTags = yield getTags(stackName);
        if (!currentTemplate)
            throw new Error('No template found');
        if (!template_1.templatesEquals(currentTemplate || '', template) || !util_1.tagsEquals(currentTags, params.Tags)) {
            console.log('Updating stack...');
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
exports.getDeployments = (region, name) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    aws_sdk_1.default.config.update({
        region
    });
    cloudFormation = new aws_sdk_1.default.CloudFormation();
    const response = yield cloudFormation.describeStacks({}).promise();
    if (response.$response.error) {
        throw new Error('Error getting stacks ' + response.$response.error);
    }
    return (((_a = response.Stacks) === null || _a === void 0 ? void 0 : _a.filter(stack => { var _a; return (_a = stack.Tags) === null || _a === void 0 ? void 0 : _a.some(tag => tag.Key === 'fastsite' && tag.Value === 'true'); }).filter(stack => { var _a; return (name ? (_a = stack.Tags) === null || _a === void 0 ? void 0 : _a.some(tag => tag.Key === 'fastsite-name' && tag.Value === name) : true); }).map(stack => ({
        name: stack.StackName,
        distributionUrl: getOutputValueFromStack(stack, 'WebsiteURL') || ''
    }))) || []);
});
//# sourceMappingURL=cloudformation.js.map