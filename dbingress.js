/**
 * This file allows incoming connections at port 3306 on the default VPC.
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

const getDefaultSecurityGroup = async (credentials) => {
    const {SecurityGroups} = await new Promise((resolve, reject) =>
        (new AWS.EC2({credentials}))
            .describeSecurityGroups({Filters: [{Name: "group-name", Values: ["default"]}]}, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            })
    );

    return SecurityGroups[0];
};

const isPort3306OpenToPublic = ({IpPermissions}) => {
    if (!IpPermissions || !IpPermissions.length) return false;
    const filteredForPort3306 = IpPermissions.filter(({FromPort}) => (FromPort === 3306));
    if (!filteredForPort3306.length) return false;
    const filteredForIpRanges = filteredForPort3306.filter(({IpRanges, Ipv6Ranges}) => {
        return !!IpRanges &&
            !!Ipv6Ranges &&
            !!IpRanges.length &&
            !!Ipv6Ranges.length &&
            !!IpRanges.filter(({CidrIp}) => (CidrIp === "0.0.0.0/0")).length &&
            !!Ipv6Ranges.filter(({CidrIpv6}) => (CidrIpv6 === "::/0")).length;
    });
    return !!filteredForIpRanges.length;
};

const authorize3306Ingress = async (credentials, securityGroup) => {
    return await new Promise((resolve, reject) =>
        (new AWS.EC2({credentials}))
            .authorizeSecurityGroupIngress({
                GroupId: securityGroup.GroupId,
                IpPermissions: [{
                    FromPort: 3306,
                    IpProtocol: "tcp",
                    IpRanges: [{CidrIp: "0.0.0.0/0"}],
                    Ipv6Ranges: [{CidrIpv6: "::/0"}],
                    ToPort: 3306,
                }]
            }, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            })
    );
};

const run = async () => {
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
    const DEFAULT_AWS_REGION = 'ap-southeast-1';
    // console.log(`AWS_REGION:\t\t\t\t\t\t${shell.env.AWS_REGION}${!shell.env.AWS_REGION?` => ${DEFAULT_AWS_REGION}`:''}`);
    shell.env.AWS_REGION = process.env.AWS_REGION || DEFAULT_AWS_REGION;

    // Add Rule to default security group
    const securityGroup = await getDefaultSecurityGroup(credentials);

    // console.log(JSON.stringify(securityGroup, null, 2));
    if (isPort3306OpenToPublic(securityGroup)) {
        console.log("Skipping adding of ingress rule for port 3306 to security group.");
    } else {
        console.log(`Adding ingress rule for port 3306 to security group ${securityGroup.GroupId}`);
        await authorize3306Ingress(credentials, securityGroup);
        console.log(`Ingress rules for port 3306 added to security group ${securityGroup.GroupId}`);
    }
};

module.exports = run;

run().catch(err => {
    console.error(err);
    process.exit(1);
});
