const argv = require('yargs')
    .command('$0', 'Deploy a static directory to AWS', {
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
    })
    .help()
    .version()
    .strict().argv;


const main = async (name, path) => {

}

// const program = require('commander');
// const version = require('./package.json').version;
// program
//     .version(version)
//     .option('-N, --name <name of project>', 'Name of the project to be created in AWS')
//     .option('-P, --path <path to distribution directory>', 'Path to the folder containing the static resources')
//     .parseExpectedArgs(process.argv);

//     console.log(`Deploying ${program.name} from ${program.path}`);