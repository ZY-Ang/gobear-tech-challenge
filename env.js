/**
 * This file exports env vars for use with CI
 */

const AWS = require("aws-sdk");
const shell = require("shelljs");
const path = require("path");

const getAWSAccountId = (credentials) => new Promise((resolve, reject) =>
    (new AWS.STS({credentials}))
        .getCallerIdentity({}, (err, data) => {
            if (err) {
                console.error("Error while calling sts.getCallerIdentity. You most likely forgot to set up aws credentials. See https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-shared.html for more information");
                reject(err);
            } else if (!data.Account) {
                console.error("Error while getting data.Account. This is unexpected.");
                reject(data);
            } else {
                resolve(data.Account);
            }
        })
);

const getCloudFormationExport = async (credentials, exportName) => {
    const exports = await new Promise((resolve, reject) =>
        (new AWS.CloudFormation({credentials}))
            .listExports({}, (err, data) => {
                if (err) {
                    console.error("Error while listing cloudformation exports.");
                    reject(err);
                } else {
                    resolve(data);
                }
            })
    );
    if (exports.Exports) {
        for (let exp of exports.Exports) {
            if (exp.Name === exportName) {
                return exp.Value;
            }
        }
    }
    throw new Error(`Export ${exportName} not found in exports: \n${JSON.stringify(exports)}`);
};

const getCloudFormationStackOutput = async (credentials, StackName, outputName) => {
    const {Stacks} = await new Promise((resolve, reject) =>
        (new AWS.CloudFormation({credentials}))
            .describeStacks({StackName}, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            })
    );

    return Stacks[0].Outputs.filter(({OutputKey}) => (OutputKey === outputName))[0].OutputValue;
};

const run = async () => {
    if (process.argv.length !== 4) {
        throw new Error("Invalid number of arguments. Please run node env.js <STACK_NAME> <STACK_OUTPUT>");
    }

    // console.log("================== ENVIRONMENT VARIABLES ==================");
    // NODE_ENV
    const DEFAULT_NODE_ENV = 'dev';
    // console.log(`NODE_ENV:\t\t\t\t\t\t${shell.env.NODE_ENV}${!shell.env.NODE_ENV?` => ${DEFAULT_NODE_ENV}`:''}`);
    shell.env.NODE_ENV = process.env.NODE_ENV || DEFAULT_NODE_ENV;

    // AWS_PROFILE
    const DEFAULT_AWS_PROFILE = `gobear`;
    // console.log(`AWS_PROFILE:\t\t\t\t\t${shell.env.AWS_PROFILE}${!shell.env.AWS_PROFILE?` => ${DEFAULT_AWS_PROFILE}`:''}`);
    shell.env.AWS_PROFILE = process.env.AWS_PROFILE || DEFAULT_AWS_PROFILE;

    // AWS_ACCESS_KEY_ID
    // console.log(`AWS_ACCESS_KEY_ID:\t\t\t\t${shell.env.AWS_ACCESS_KEY_ID}`);

    // AWS_SECRET_ACCESS_KEY
    // console.log(`AWS_SECRET_ACCESS_KEY:\t\t\t${shell.env.AWS_SECRET_ACCESS_KEY}`);

    // AWS_ACCOUNT_ID
    const credentials = (
        shell.env.AWS_ACCESS_KEY_ID &&
        shell.env.AWS_SECRET_ACCESS_KEY &&
        shell.env.CI === true // AWS.Credentials only on CI
    )
        ? new AWS.Credentials(shell.env.AWS_ACCESS_KEY_ID, shell.env.AWS_SECRET_ACCESS_KEY)
        : new AWS.SharedIniFileCredentials({profile: shell.env.AWS_PROFILE});
    shell.env.AWS_ACCOUNT_ID = await getAWSAccountId(credentials);
    // console.log(`AWS_ACCOUNT_ID:\t\t\t\t\t${(shell.env.AWS_ACCOUNT_ID)}`);

    // AWS_REGION
    const DEFAULT_AWS_REGION = 'ap-northeast-1';
    // console.log(`AWS_REGION:\t\t\t\t\t\t${shell.env.AWS_REGION}${!shell.env.AWS_REGION?` => ${DEFAULT_AWS_REGION}`:''}`);
    shell.env.AWS_REGION = process.env.AWS_REGION || DEFAULT_AWS_REGION;

    // ECRRepositoryArn
    const OUTPUT = await getCloudFormationStackOutput(credentials, process.argv[2], process.argv[3]);
    console.log(OUTPUT);
};

module.exports = run;

run().catch(err => {
    console.error(err);
    shell.exit(1);
});
