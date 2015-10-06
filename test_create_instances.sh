#!/bin/bash

##### NOTE
### Requirements:
### - AWS CLI
### - jsawk
### - key-pair 'test'

# If you need, set your default aws profile to create the resources on the right account
##export AWS_DEFAULT_PROFILE=


## Create EC2 instances
echo Creating EC2 instance
INSTANCE_ID=`aws --region ap-northeast-1 ec2 run-instances --image-id ami-936d9d93 --instance-type t2.micro --key-name test | jsawk "return this.Instances[0].InstanceId;"`
echo INSTANCE_ID=$INSTANCE_ID

## Create S3 bucket
echo Creating S3 bucket
aws --region ap-northeast-1 s3 mb s3://test-bucket-gs-autotag-1

# ## Create ELB
echo Creating ELB
aws --region ap-northeast-1 elb create-load-balancer \
  --load-balancer-name testLoadBalancer \
  --availability-zones ap-northeast-1a ap-northeast-1c \
  --listeners Protocol=HTTP,LoadBalancerPort=80,InstanceProtocol=HTTP,InstancePort=80


## Create RDS bucket
echo Creating RDS instance
aws --region ap-northeast-1 rds create-db-instance \
  --db-instance-identifier mytestrdsinstance \
  --db-instance-class db.t1.micro \
  --allocated-storage 5 \
  --engine MySQL \
  --master-username testtest \
  --master-user-password testtest

## Create VPC
echo Creating VPC
VPC_ID=`aws --region ap-northeast-1 ec2 create-vpc --cidr-block 10.0.0.0/16 | jsawk "return this.Vpc.VpcId;"`
echo VPC_ID=$VPC_ID

## Create VPC Subnet
echo Creating VPC Subnet
SUBNET_ID=`aws --region ap-northeast-1 ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.12.0/24 | jsawk "return this.Subnet.SubnetId;"`
echo SUBNET_ID=$SUBNET_ID

## Create Internet Gateway for VPC
echo Creating Internet Gateway
INTERNET_GATEWAY_ID=`aws --region ap-northeast-1 ec2 create-internet-gateway | jsawk "return this.InternetGateway.InternetGatewayId;"`
echo INTERNET_GATEWAY_ID=$INTERNET_GATEWAY_ID

## Create Elastic Map Reduce cluster
echo Creating EMR cluster
CLUSTER_ID`aws --region ap-northeast-1 emr create-cluster --release-label emr-4.0.0  --instance-groups InstanceGroupType=MASTER,InstanceCount=1,InstanceType=m1.medium InstanceGroupType=CORE,InstanceCount=2,InstanceType=m1.medium --use-default-roles | jsawk "return this.ClusterId;"`
echo CLUSTER_ID=$CLUSTER_ID
