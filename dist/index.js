#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const handlers_1 = require("./handlers");
yargs_1.default.command(['deploy'], 'Deploy a static directory to AWS', {
    name: {
        alias: 'n',
        describe: 'Name of the project to be created in AWS',
        demandOption: true,
        requiresArg: true,
        type: 'string',
        nargs: 1
    },
    path: {
        alias: 'p',
        describe: 'Path to the folder containing the static resources',
        requiresArg: true,
        demandOption: true,
        type: 'string',
        nargs: 1
    },
    region: {
        describe: 'AWS region to deploy in',
        default: 'eu-west-1',
        requiresArg: true,
        type: 'string',
        nargs: 1
    },
    defaultIndex: {
        describe: 'Use index.html as default page if a corresponding html page is not found',
        default: false,
        type: 'boolean'
    },
    stage: {
        describe: 'Stage of the deployment',
        default: 'dev',
        requiresArg: true,
        type: 'string',
        nargs: 1
    }
}, argv => {
    handlers_1.deployHandler(argv.name, argv.path, argv.region, argv.defaultIndex, argv.stage);
})
    .help()
    .command('remove', 'Remove a project deployed using this from AWS, removes all files from S3 and removes all created resources.', {
    name: {
        alias: 'n',
        describe: 'Name of the project to remove resources for',
        demandOption: true,
        requiresArg: true,
        type: 'string',
        nargs: 1
    },
    region: {
        describe: 'AWS region to remove from',
        default: 'eu-west-1',
        requiresArg: true,
        type: 'string',
        nargs: 1
    },
    stage: {
        describe: 'Stage of the deployment to remove',
        default: 'dev',
        requiresArg: true,
        type: 'string',
        nargs: 1
    }
}, argv => {
    handlers_1.removeHandler(argv.name, argv.region, argv.stage);
})
    .command('info', 'Get info about current deployments', {
    name: {
        alias: 'n',
        describe: 'Name of the project to get deployments for',
        requiresArg: true,
        type: 'string',
        nargs: 1
    },
    region: {
        describe: 'AWS region to get deployments from from',
        default: 'eu-west-1',
        requiresArg: true,
        type: 'string',
        nargs: 1
    }
}, argv => {
    handlers_1.infoHandler(argv.region, argv.name);
})
    .help()
    .version()
    .strict().argv;
//# sourceMappingURL=index.js.map