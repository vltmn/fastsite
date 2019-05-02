import { sleep } from "./util";

const aws = require("aws-sdk");
const fs = require("fs");
const cloudFormation = new aws.CloudFormation();
const template = fs.readFileSync('cloudformation.yml', 'utf8');

const buildParams = stackName => ({
    StackName: stackName,
    TemplateBody: template
});

const createStack = params => cloudFormation.createStack(params).promise();
const updateStack = params => cloudFormation.updateStack(params).promise();
const deleteStack = stackName => cloudFormation.deleteStack(({StackName: stackName})).promise();
const getTemplate = stackName => cloudFormation.getTemplate({StackName: stackName})
    .promise().then(r => r.TemplateBody);

const waitForCloudFormation = stackName => {
    let resp;
    resp = await checkCloudFormation(stackName);
    while (
        resp.StackStatus == 'CREATE_IN_PROGRESS' ||
        resp.StackStatus == 'UPDATE_IN_PROGRESS'
    ) {
        await sleep(500);
        resp = await checkCloudFormation(stackName);
    }
}
const checkCloudFormation = stackName => 
    cloudFormation.describeStacks({
        StackName: stackName
    }).promise()
    .then(s => s.Stacks[0]);

export const updateCreateCloudFormation = async (name, region) => {
    const stackName = name;
    const params = buildParams(stackName);
    try {
        const resp = await checkCloudFormation(stackName);
        const currentTemplate = await getTemplate(stackName);
        if(currentTemplate != template) {
            await updateStack(params)
        }
    } catch (err) {
        //TODO
        throw err;
    }

    await waitForCloudFormation(stackName);
    const resp = await checkCloudFormation(stackName);
    const bucketName = getOutputValueFromStack(resp, 'S3BucketName');
    return bucketName;
}

const getOutputValueFromStack = (stack, output) => 
    stack.Outputs.filter(o => o.OutputKey === output)[0];