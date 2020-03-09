/**
 * This file exports env vars from the default vpc for use with CI
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

const getDefaultVpcId = async (credentials) => {
    const {Vpcs} = await new Promise((resolve, reject) =>
        (new AWS.EC2({credentials}))
            .describeVpcs({Filters: [{Name: "isDefault", Values: ["true"]}]}, (err, data) => {
                if (err) {
                    console.error("Error while calling ec2.describeVpcs. You most likely forgot to set up aws credentials. See https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-shared.html for more information");
                    reject(err);
                } else if (!data.Vpcs || !data.Vpcs.length) {
                    console.error("Error while getting data.Vpcs. This is unexpected.");
                    reject(data);
                } else {
                    resolve(data);
                }
            })
    );

    return Vpcs[0].VpcId;
};

const getDefaultVpcSubnetIds = async (credentials, vpcId) => {
    const {Subnets} = await new Promise((resolve, reject) =>
        (new AWS.EC2({credentials}))
            .describeSubnets({Filters: [{Name: "vpc-id", Values: [vpcId]}]}, (err, data) => {
                if (err) {
                    console.error("Error while calling ec2.describeSubnets. You most likely forgot to set up aws credentials. See https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-shared.html for more information");
                    reject(err);
                } else if (!data.Subnets || !data.Subnets.length) {
                    console.error("Error while getting data.Vpcs. This is unexpected.");
                    reject(data);
                } else {
                    resolve(data);
                }
            })
    );

    return Subnets.map(({SubnetId}) => SubnetId);
};

const run = async () => {
    if (process.argv.length !== 3) {
        throw new Error("Invalid number of arguments. Please run node env.js <vpc/subnet>");
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

    // Command
    const defaultVpcId = await getDefaultVpcId(credentials);
    if (process.argv[2].toLowerCase().includes('vpc')) {
        console.log(defaultVpcId);
    } else if (process.argv[2].toLowerCase().includes('subnet')) {
        const vpcs = await getDefaultVpcSubnetIds(credentials, defaultVpcId);
        console.log(vpcs.join(','));
    } else {
        throw new Error(`Unrecognized command ${process.argv[2]}. Please use one of vpc/subnet`);
    }
};

module.exports = run;

run().catch(err => {
    console.error(err);
    process.exit(1);
});
