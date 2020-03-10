# Gobear Tech Challenge

[![CircleCI](https://circleci.com/gh/ZY-Ang/gobear-tech-challenge/tree/master.svg?style=svg&circle-token=e2137c44ad3b80d3475cce5d42788e555fdf3a61)](https://circleci.com/gh/ZY-Ang/gobear-tech-challenge/tree/master)

## Prerequisites

- An AWS Account.
- A recent version of nodejs to deploy architecture.
- Docker to build and test the `notejam-express` and `notejam-flask` services on the predefined environments.

## QuickStart

1. Fork & clone the repository
2. Sign up for a [CircleCI](https://circleci.com/) account
3. Once you've signed up, click add projects in the CircleCI dashboard sidebar and add the project
`gobear-tech-challenge`.
4. You can skip all the steps and head straight to build the project.
    1. The project will not pass on the first run.
    2. Head over to `Project Settings > Environment Variables` and add the following **9** environment variables:
        - `AWS_ACCESS_KEY_ID` - Access Key ID of an IAM user from the AWS platform. While in development, you can assign
        the `AdministratorAccess` Managed Policy to allow 95% permission access to resources within the AWS account. See
        [here](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html) for a guide on how to
        generate your access keys.
        - `AWS_SECRET_ACCESS_KEY` - Secret Access Key that corresponds to the above `AWS_ACCESS_KEY_ID`.
        - `AWS_REGION` - Region of AWS you would like the application to be deployed to. To find out more about the
        valid values and AWS regions and availability zones, visit
        [here](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.RegionsAndAvailabilityZones.html).
        - `EXPRESSJAM_DB_USER` - The username of the MySQL RDS database for the express notejam application to be
        created.
        - `EXPRESSJAM_DB_PASS` - The password of the MySQL RDS database for the express notejam application to be
        created.
        - `EXPRESSJAM_DB_SCHEMA` - The name of the initial database to be created for the express notejam application.
        - `FLASKJAM_DB_USER` - The username of the MySQL RDS database for the flask notejam application to be created.
        - `FLASKJAM_DB_PASS` - The password of the MySQL RDS database for the flask notejam application to be created.
        - `FLASKJAM_DB_SCHEMA` - The name of the initial database to be created for the flask notejam application.
    3. Open up workflows/pipelines in the sidebar of CircleCI and rerun the failed job.
        - **NOTE**: The RDS job will most likely timeout if this is your first time running the workflow. This is
        because it takes roughly ~20 minutes to create the databases and the CircleCI context times out at 10 minutes.
        If you want to save on CircleCI credits, cancel the job and wait for the CloudFormation stack to deploy
        completely before re-running the workflow from failed jobs. This will pick up where you left off, without
        wasting precious build credits.
5. Once you've waited for a bit, head over to the AWS CloudFormation console (for the region you specified) and voila,
you should see the following:
![cfstacks](https://github.com/zy-ang/gobear-tech-challenge/blob/master/docs/cfstacks.png).
6. Open up `gb-challenge-app-prod > Outputs > AlbEndpoint` and copy the URL and paste it into your browser.

## Architecture Overview

![Overall Architecture](https://github.com/zy-ang/gobear-tech-challenge/blob/master/docs/overarch.png)

## DevOps Workflow

The CircleCI workflow aptly describes the deployment flow of the architecture.

![workflow](https://github.com/zy-ang/gobear-tech-challenge/blob/master/docs/workflow.png)

### 1. ECR

ECR is the container registry that holds the images used for the express and flask applications and has to be created
first. Simply install serverless, set up the AWS CLI and run  the registries that host the app's docker images.

### 2. RDS

To ensure high-availability, reliability and get a shit ton of backups and redundancy, RDS is used for the application.
The creation process takes quite a while so you may choose to deploy this from a local machine instead on your first
run. Note that this step also includes a script that adds an ingress rule allowing internet connections from port 3306
to the security group for the default VPC for the region to be deployed in.

### 3. Flask/Express Applications

Once the RDS and ECR resources have been provisioned, we can start building, testing and pushing the express and flask
container images into the ECR repository. The database has to be created first as the database cloudformation stack
outputs a MySQL database endpoint value which would be used in the application in production.

### 4. Application Infrastructure

Once the images have been pushed to the repository, we can provision the infrastructure that runs the images. For this,
I opted to use Fargate because the application could simply run on the default VPC, allowing me to skip creation of a 
custom VPC which may not be covered under my free AWS credits.

#### (Optional) Local Installation

You may choose to deploy the services locally from your pc instead of using CircleCI.

1. Run `cd <project root> && npm install` to install serverless for the project's context.
2. Download and install the latest [AWS CLI](https://aws.amazon.com/cli/).
3. Run `aws configure --profile gobear` and follow the prompts to set up the AWS profile used for the project.
4. Run `cd <project root>/services/notejam-express && npm install` to install dependencies for the express
app. This requires you to be running nodejs version 6.7.0 to working correctly.
5. Create a virtualenv using python2.7 as base and run
`cd <project root>/services/notejam-flask && pip install -r requirements.txt` to install dependencies for the flask app.

## Serverless + CloudFormation

The [Serverless Framework](https://serverless.com/) is chosen as this project's IaC tool. It runs CloudFormation is
under the hood.
 
### Why Serverless?
There are a bunch of open source plugins you can use, like changesets, minification, etc. Also, plugins are written in
nodejs unlike TerraForm (Go) which I can write extremely well in. Also, you don't really need to install any global CLI
tools that fuck with your machine/environment. With serverless, you can just use it in the project's context using npm
scripts.

## Container Registry

AWS ECR is used to store the application images, as opposed to docker hub to streamline platform security.

## Database

- RDS MySQL instead of in-memory/sqlite files.
- SQLite is not available on RDS :(
- Deployed across Multi-AZ. In case of earthquakes, power outages or whatever in one availability zone, the secondary AZ
will take over as the master and still allow the application to function.
- Automated daily backups (snapshots that expire after 35 days)
- The database is publicly accessible from the internet. The `PubliclyAccessible` field set to `true` in
`/arch/database/serverless.yml` as the docker build environment is outside of the AWS VPC. The file `dbingress.js`
contains a script to automatically open up traffic on port 3306 in the default VPC's security group for the specified
`AWS_REGION`. There were no security requirements, so there.
- Vertical Scaling:
    - Storage: From 20gb to 1000gb
    - Compute: Managed by CloudFormation

## Application

### Express

- Express is used as the default application. When visiting the default route `/`, the request will be forwarded to
`/express`.
- Given that the project was written quite a while back, only node6.7 seemed to work with the project. The node6.7
environment is using `nodesource/node:6.7` pulled from Docker Hub. See the relevant Dockerfile for more information.
- The default express port 3000 is used and exposed.
- Tests are run at docker container build time. If tests fail, so will the docker build, and subsequently, the CI Job.

### Flask

- **Important** - the flask application can't create new note without creating a pad first. I would probably fix the
ORM-MySQL bindings if I don't have time constraints. 
- Given that the project was written quite a while back, only python2.7 seemed to work with the project. The environment
is using `ubuntu:16.04` pulled from Docker Hub, installed with `libmysqlclient-dev`, `python-pip` and `python-dev`. See
the relevant Dockerfile for more information.
- Tests are run at docker container build time. If tests fail, so will the docker build, and subsequently, the CI Job.

### Docker using ECS (Fargate)

The Express and Flask services run on ECS under the Fargate configuration. The configuration autoscales each task
(vCPU=0.25, memory=0.5) at a minimum of 2 to a maximum of 100, tracking the average CPU utilization of 90%. Settings can
be changed within `/arch/app/serverless.yml`.

![App Arch Template](https://github.com/zy-ang/gobear-tech-challenge/blob/master/docs/apptemplate.png)

An [Application Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html) is
used to route `/` and `/express*` to the express service and `/flask*` to the flask service, in addition to load
balancing service it provides to automatically route to the various auto-generated ENIs on ECS Fargate.

![ALB - src https://www.youtube.com/watch?v=qy7zNaDTYGQ](https://github.com/zy-ang/gobear-tech-challenge/blob/master/docs/alb.png)

A new route `/health` is created on both express and flask applications. This is used to check if the running tasks are
healthy and if not, be spun down and replaced with new task(s) under the corresponding Service.

## Logs

All logs are sent to AWS CloudWatch and can be accessed on the AWS console. There are logs on most layers, including the
database and application tasks and services. I have added the X-Ray agent for the applications and you can configure an
X-Ray topic for the two application services to view service tracing for individual requests.

## Networking
For simplicity, the default VPC created in each region by default is used for infrastructure/networking. The ECS Fargate
services are distributed across all default subnets in all availability zones in a particular AWS region. The default
VPC will have a new rule that allows ingress at port 3306 to allow connections to the RDS instance, for analytics or 
other operations. The application can function correctly, if the rule is removed as the ECS tasks and RDS instance are
within the same VPC, just that CI will not work based on my current setup.

## Kubernetes
I attempted to pick up Kubernetes using EKS with the ALB-ingress-controller but, only got about 50% done after 2-3 days
and no significant progress was made. Will probably try another time to get the right configuration.
