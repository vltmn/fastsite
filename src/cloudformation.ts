import { sleep, tagsEquals } from './util';
import aws from 'aws-sdk';
import { getTemplate as getTemplateStr, templatesEquals } from './template';
import { Stack, Tags } from 'aws-sdk/clients/cloudformation';
import yesno from 'yesno';

let cloudFormation: aws.CloudFormation;

interface BaseParams {
    StackName: string;
    TemplateBody: string;
    Tags?: Tags;
}

interface DeploymentInfo {
    name: string;
    distributionUrl: string;
}
export const buildStackName = (name: string, stage: string): string => `${name}-${stage}`;

const buildParams = (name: string, stage: string, template: string): BaseParams => ({
    StackName: buildStackName(name, stage),
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

const createStack = (params: BaseParams) => cloudFormation.createStack(params).promise();
const updateStack = (params: BaseParams) => cloudFormation.updateStack(params).promise();
const deleteStack = (stackName: string): Promise<void> =>
    cloudFormation
        .deleteStack({ StackName: stackName })
        .promise()
        .then(() => {
            return;
        });
const getTemplate = (stackName: string): Promise<string | undefined> =>
    cloudFormation
        .getTemplate({ StackName: stackName })
        .promise()
        .then(r => r.TemplateBody);
const getTags = (stackName: string): Promise<Tags | undefined> =>
    cloudFormation
        .describeStacks({ StackName: stackName })
        .promise()
        .then(r => {
            if (!r.Stacks || r.$response.error) {
                throw new Error('Could not get stack for getting tags');
            }
            return r.Stacks[0].Tags;
        });

const checkCloudFormation = (stackName: string) =>
    cloudFormation
        .describeStacks({
            StackName: stackName
        })
        .promise()
        .then(s => s.Stacks && s.Stacks[0]);

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

const listStacksRecurse = (nextToken?: string): Promise<aws.CloudFormation.StackSummary[]> => {
    return cloudFormation
        .listStacks({ NextToken: nextToken })
        .promise()
        .then(res => {
            const summaries = res.StackSummaries ? res.StackSummaries.map(s => s) : [];
            if (res.NextToken) {
                return listStacksRecurse(res.NextToken).then(nested => {
                    return [...summaries, ...nested];
                });
            } else {
                return summaries;
            }
        });
};

const stackExists = (stackName: string): Promise<boolean> =>
    listStacksRecurse()
        .then(
            stacks =>
                stacks.filter(ss => ss.StackName === stackName).filter(ss => ss.StackStatus !== 'DELETE_COMPLETE')
                    .length > 0
        )
        .then(res => !!res);

export const removeCloudFormation = async (name: string, stage: string, region: string): Promise<void> => {
    aws.config.update({
        region: region
    });
    cloudFormation = new aws.CloudFormation();
    const stackName = buildStackName(name, stage);
    await stackExists(stackName);
    await deleteStack(stackName);
};

const getOutputValueFromStack = (stack: Stack, output: string): string | undefined =>
    stack.Outputs && stack.Outputs.filter(o => o.OutputKey === output)[0].OutputValue;

export const getBucketName = async (name: string, stage: string, region: string): Promise<string> => {
    aws.config.update({
        region: region
    });
    cloudFormation = new aws.CloudFormation();
    const stackName = buildStackName(name, stage);
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

export const updateCreateCloudFormation = async (
    name: string,
    stage: string,
    useIndexAsDefault: boolean,
    region: string,
    assumeYes: boolean
): Promise<{ bucket: string; cloudfront: string }> => {
    aws.config.update({
        region: region
    });
    cloudFormation = new aws.CloudFormation();
    const stackName = buildStackName(name, stage);
    const template = getTemplateStr({ defaultIndex: useIndexAsDefault });
    const params = buildParams(name, stage, template);
    const exists = await stackExists(stackName);
    if (exists) {
        const currentTemplate = await getTemplate(stackName);
        const currentTags = await getTags(stackName);
        if (!currentTemplate) throw new Error('No template found');
        if (!templatesEquals(currentTemplate || '', template) || !tagsEquals(currentTags, params.Tags)) {
            if (!assumeYes) {
                const resp = await yesno({
                    question: 'The cloudformation stack will be updated. Do you want to continue?'
                });
                if (!resp) {
                    throw new Error('Operation cancelled');
                }
            }
            console.log('Updating stack...');
            await updateStack(params);
        }
    } else {
        if (!assumeYes) {
            const resp = await yesno({
                question: 'A new deployment will be created. Do you want to continue?'
            });
            if (!resp) {
                throw new Error('Operation cancelled');
            }
        }
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
    if (!bucketName || !distName) {
        throw new Error('Bad output values');
    }
    return {
        bucket: bucketName,
        cloudfront: distName
    };
};

export const getDeployments = async (region: string, name?: string): Promise<DeploymentInfo[]> => {
    aws.config.update({
        region
    });
    cloudFormation = new aws.CloudFormation();
    const response = await cloudFormation.describeStacks({}).promise();
    if (response.$response.error) {
        throw new Error('Error getting stacks ' + response.$response.error);
    }
    return (
        response.Stacks?.filter(stack => stack.Tags?.some(tag => tag.Key === 'fastsite' && tag.Value === 'true'))
            .filter(stack => (name ? stack.Tags?.some(tag => tag.Key === 'fastsite-name' && tag.Value === name) : true))
            .map(stack => ({
                name: stack.StackName,
                distributionUrl: getOutputValueFromStack(stack, 'WebsiteURL') || ''
            })) || []
    );
};
