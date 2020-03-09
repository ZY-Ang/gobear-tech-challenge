# Gobear Tech Challenge

[![CircleCI](https://circleci.com/gh/ZY-Ang/gobear-tech-challenge/tree/master.svg?style=svg&circle-token=e2137c44ad3b80d3475cce5d42788e555fdf3a61)](https://circleci.com/gh/ZY-Ang/gobear-tech-challenge/tree/master)

## Installation & Setup

## Workflow

## Architecture Overview

## Container Registry

## Database

- RDS MySQL instead of in-memory/sqlite files.
- Multi-AZ (in case of earthquakes or whatever)
- Automated daily backups (snapshots that expire after 35 days)

Important changes to core code - flask application can't create new note without creating a pad first.
I would probably fix the ORM-MySQL bindings if I don't have the time constraints. The database is
publicly accessible from the internet but should work even without the `PubliclyAccessible` field set
to `false` in `/arch/database/serverless.yml` as all resources are running within the same VPC. Only
check if the security groups are configured correctly.

## Application

## Networking
For simplicity, the default VPC created in each region by default is used for infrastructure/networking.

## Kubernetes
I attempted to pick up Kubernetes using EKS with the ALB-ingress-controller but, only got about 50% done
when 2-3 days were up and no significant progress was made.
