import { sleep } from './util';
import aws from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import { Stack } from 'aws-sdk/clients/cloudformation';

let cloudFormation: aws.CloudFormation;
const CLOUDFORMATION_PATH = path.join(__dirname, 'cloudformation.yml');
const template: string = fs.readFileSync(CLOUDFORMATION_PATH, 'utf8');

interface BaseParams {
    StackName: string;
    TemplateBody: string;
}
const buildParams = (stackName: string): BaseParams => ({
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
        resp.StackStatus == 'UPDATE_IN_PROGRESS'
    ) {
        await sleep(500);
        resp = await checkCloudFormation(stackName);
        if (!resp) throw new Error('Resp was undefined');
    }
};

const stackExists = (stackName: string): Promise<boolean> =>
    cloudFormation.listStacks({}).promise()
        .then(stacks => stacks.StackSummaries && stacks.StackSummaries.filter(ss => ss.StackName === stackName).length > 0)
        .then(res => !!res);

const checkCloudFormation = (stackName: string) =>
    cloudFormation.describeStacks({
        StackName: stackName
    }).promise()
    .then(s => s.Stacks && s.Stacks[0]);

export const updateCreateCloudFormation = async (name: string, region: string) => {
    aws.config.update({
        region: region
    });
    cloudFormation = new aws.CloudFormation();
    const stackName = name;
    console.debug('STACK NAME: ', stackName);
    const params = buildParams(stackName);
    const exists = await stackExists(stackName);
    console.debug('STACK EXISTS: ', exists);
    if (exists) {
        console.debug('UPDATING STACK');
        const currentTemplate = await getTemplate(stackName);
        if (!currentTemplate) throw new Error('No template found');
        if (currentTemplate != template) {
            await updateStack(params);
        }
    } else {
        console.debug('CREATING STACK');
        await createStack(params);
    }

    await waitForCloudFormation(stackName);
    const resp = await checkCloudFormation(stackName);
    if (!resp) {
        throw new Error(resp);
    }
    const bucketName = getOutputValueFromStack(resp, 'S3BucketName');
    return bucketName;
};

const getOutputValueFromStack = (stack: Stack, output: string) =>
    stack.Outputs && stack.Outputs.filter(o => o.OutputKey === output)[0];