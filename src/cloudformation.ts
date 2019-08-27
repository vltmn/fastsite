import { sleep } from './util';
import aws from 'aws-sdk';
import fs from 'fs';
import { getTemplate as getTemplateStr } from './template'
import path from 'path';
import { Stack } from 'aws-sdk/clients/cloudformation';

let cloudFormation: aws.CloudFormation;

interface BaseParams {
    StackName: string;
    TemplateBody: string;
}
const buildParams = (stackName: string, template: string): BaseParams => ({
    StackName: stackName,
    TemplateBody: template
});

const createStack = (params: BaseParams) =>
    cloudFormation.createStack(params).promise();
const updateStack = (params: BaseParams) =>
    cloudFormation.updateStack(params).promise();
const deleteStack = (stackName: string): Promise<void> =>
    cloudFormation.deleteStack(({StackName: stackName})).promise().then(r => { return; });
const getTemplate = (stackName: string): Promise<string | undefined> =>
    cloudFormation.getTemplate({StackName: stackName})
    .promise().then(r => r.TemplateBody);

const waitForCloudFormation = async (stackName: string): Promise<void> => {
    let resp;
    resp = await checkCloudFormation(stackName);
    if (!resp) throw new Error('Resp was undefined');
    while (
        resp.StackStatus == 'CREATE_IN_PROGRESS' ||
        resp.StackStatus == 'UPDATE_IN_PROGRESS' ||
        resp.StackStatus == 'DELETE_IN_PROGRESS'
    ) {
        await sleep(500);
        resp = await checkCloudFormation(stackName);
        if (!resp) throw new Error('Resp was undefined');
    }
};

const stackExists = (stackName: string): Promise<boolean> =>
    cloudFormation.listStacks({}).promise()
        .then(stacks => stacks.StackSummaries && stacks.StackSummaries
            .filter(ss => ss.StackName === stackName)
            .filter(ss => ss.StackStatus !== 'DELETE_COMPLETE').length > 0)
        
        .then(res => !!res);

const checkCloudFormation = (stackName: string) =>
    cloudFormation.describeStacks({
        StackName: stackName
    }).promise()
    .then(s => s.Stacks && s.Stacks[0]);


export const removeCloudFormation = async (name: string, region: string): Promise<void> => {
    aws.config.update({
        region: region
    });
    cloudFormation = new aws.CloudFormation();
    const stackName = name;
    const exists = await stackExists(stackName);
    await deleteStack(stackName);
};

export const getBucketName = async (name: string, region: string): Promise<string> => {
    aws.config.update({
        region: region
    });
    cloudFormation = new aws.CloudFormation();
    const stackName = name;
    const exists = await stackExists(stackName);
    if (!exists) {
        throw new Error('The deployment supplied does not exist.');
    }
    const resp = await checkCloudFormation(stackName);
    if (!resp) throw new Error('Undefined');
    const bucketName = getOutputValueFromStack(resp, 'S3BucketName');
    if (!bucketName) throw new Error('Undefined');
    return bucketName;
};

export const updateCreateCloudFormation = async (name: string, useIndexAsDefault: boolean, region: string): Promise<{bucket: string, cloudfront: string}> => {
    aws.config.update({
        region: region
    });
    cloudFormation = new aws.CloudFormation();
    const stackName = name;
    const template = getTemplateStr({defaultIndex: useIndexAsDefault});
    const params = buildParams(stackName, template);
    const exists = await stackExists(stackName);
    if (exists) {
        const currentTemplate = await getTemplate(stackName);
        if (!currentTemplate) throw new Error('No template found');
        if (currentTemplate != template) {
            await updateStack(params);
        }
    } else {
        console.debug('Creating the cloudformation stack, this might take up to 15 minutes...');
        await createStack(params);
    }

    await waitForCloudFormation(stackName);
    const resp = await checkCloudFormation(stackName);
    if (!resp) {
        throw new Error(resp);
    }
    const bucketName = getOutputValueFromStack(resp, 'S3BucketName');
    const distName = getOutputValueFromStack(resp, 'WebsiteURL');
    if (!bucketName || ! distName) {
        throw new Error('Bad output values');
    }
    return {
        bucket: bucketName,
        cloudfront: distName
    };
};

const getOutputValueFromStack = (stack: Stack, output: string): string | undefined =>
    stack.Outputs && stack.Outputs.filter(o => o.OutputKey === output)[0].OutputValue;