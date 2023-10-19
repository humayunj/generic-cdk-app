import { Stack, StackProps, Stage, Tags } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ec2 from "aws-cdk-lib/aws-ec2";

import { BuildConfig } from "../bin/cdk";
import { readFileSync } from "fs";

export class HelloAppStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: StackProps,
    config: BuildConfig
  ) {
    super(scope, id, props);

    const key = new ec2.CfnKeyPair(this, "scope", {
      keyName: `ec2-keypair-${config.Enviroment}`,
    });
    const appRole = new iam.Role(this, `RoleApp-${config.Enviroment}`, {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMFullAccess"),
      ],
    });

    const vpc = new ec2.Vpc(this, `APP-VPC-${config.Enviroment}`, {
      cidr: "10.0.0.0/16",
      natGateways: 0,
      subnetConfiguration: [
        { name: "public", cidrMask: 24, subnetType: ec2.SubnetType.PUBLIC },
      ],
    });

    const appSg = new ec2.SecurityGroup(
      this,
      `SecurityGroupJenkins-${config.Enviroment}`,
      {
        vpc,
        allowAllOutbound: true,
      }
    );

    appSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), "ssh");
    appSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), "http");
    appSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), "https");
    appSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8080), "jenkins");

    const osImage = ec2.MachineImage.fromSsmParameter(
      "/aws/service/canonical/ubuntu/server/focal/stable/current/amd64/hvm/ebs-gp2/ami-id",
      { os: ec2.OperatingSystemType.LINUX }
    );

    const instance = new ec2.Instance(this, `app-ec2-${config.Enviroment}`, {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      role: appRole,
      securityGroup: appSg,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: osImage,
      keyName: key.keyName,
      blockDevices: [
        {
          deviceName: "/dev/sda1",
          volume: ec2.BlockDeviceVolume.ebs(30, {
            encrypted: true,
            volumeType: ec2.EbsDeviceVolumeType.GP2,
          }),
        },
      ],
    });

    const userDataScript = readFileSync("./lib/app-user-data.sh", "utf-8");
    instance.addUserData(userDataScript);
    Tags.of(instance).add("Enviroment", config.Enviroment);
  }
}
