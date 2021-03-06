#!/usr/bin/env node

import yargs from 'yargs';
import { deployHandler, removeHandler, infoHandler } from './handlers';

yargs
    .command(
        ['deploy'],
        'Deploy a static directory to AWS',
        {
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
            },
            assumeYes: {
                describe: 'Assume yes to create or update a deployment that does not already exist',
                default: false,
                alias: 'y',
                type: 'boolean'
            }
        },
        argv => {
            deployHandler(argv.name, argv.path, argv.region, argv.defaultIndex, argv.stage, argv.assumeYes);
        }
    )
    .help()
    .command(
        'remove',
        'Remove a project deployed using this from AWS, removes all files from S3 and removes all created resources.',
        {
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
        },
        argv => {
            removeHandler(argv.name, argv.region, argv.stage);
        }
    )
    .command(
        'info',
        'Get info about current deployments',
        {
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
        },
        argv => {
            infoHandler(argv.region, argv.name);
        }
    )
    .help()
    .version()
    .strict().argv;
