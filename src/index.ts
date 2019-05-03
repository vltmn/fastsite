import yargs from 'yargs';
import { deployHandler, removeHandler } from './handlers';

yargs.command(['deploy', '$0'], 'Deploy a static directory to AWS', {
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
        stage: {
            describe: 'Stage of the deployment',
            default: 'dev',
            requiresArg: true,
            type: 'string',
            nargs: 1
        }
    }, argv => {
        deployHandler(argv.name, argv.path, argv.region, argv.stage);
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
        removeHandler(argv.name, argv.region, argv.stage);
    })
    .help()
    .version()
    .strict().argv;