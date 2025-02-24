using Amazon.CDK;
using Amazon.CDK.AWS.EC2;
using Amazon.CDK.AWS.Ecr.Assets;
using Amazon.CDK.AWS.ECS;
using Amazon.CDK.AWS.ECS.Patterns;
using Amazon.CDK.AWS.IAM;
using Constructs;
using System.Collections.Generic;
using System.IO;

namespace EcsFargateCdk
{
    public class EcsFargateCdkStack : Stack
    {
        internal EcsFargateCdkStack(Construct scope, string id, IStackProps props = null) : base(scope, id, props)
        {
            var sourceDir = Path.Combine(Directory.GetCurrentDirectory(), "../WebApi");
            var targetDir = Path.Combine(Directory.GetCurrentDirectory(), "WebApiCopy");

            if (Directory.Exists(targetDir))
            {
                Directory.Delete(targetDir, true);
            }
            CopyDirectory(sourceDir, targetDir);

            //Create a VPC
            var vpc = new Vpc(this, "MyVpc", new VpcProps
            {
                MaxAzs = 2 // Number of Availability Zones
            });

            // Create an ECS Cluster
            var cluster = new Cluster(this, "MyCluster", new ClusterProps
            {
                Vpc = vpc,
            });

            // Create a Docker Image Asset (Builds Image from Local Dockerfile)
            var dockerImage = new DockerImageAsset(this, "MyDockerImage", new DockerImageAssetProps
            {
                Directory = Path.Combine(Directory.GetCurrentDirectory(), targetDir),
                Invalidation = new DockerImageAssetInvalidationOptions
                {
                    BuildArgs = false // Prevents unnecessary rebuilds
                },
            });

            // Create an ECS Fargate Service using the Docker Image
            var fargateService = new ApplicationLoadBalancedFargateService(this, "MyFargateService", new ApplicationLoadBalancedFargateServiceProps
            {
                Cluster = cluster,  // ECS Cluster
                DesiredCount = 1,   // Number of running tasks
                TaskImageOptions = new ApplicationLoadBalancedTaskImageOptions
                {
                    Image = ContainerImage.FromDockerImageAsset(dockerImage), // Use the built Docker image,
                    ContainerPort = 8080,
                    Environment = new Dictionary<string, string>
                    {
                        { "ASPNETCORE_ENVIRONMENT", "Development" },
                    },
                    LogDriver = LogDriver.AwsLogs(new AwsLogDriverProps
                    {
                        StreamPrefix = "MyFargateApp"
                    })
                },
                MemoryLimitMiB = 1024,
                Cpu = 512,
                AssignPublicIp = true,
                PublicLoadBalancer = true,
                TaskSubnets = new SubnetSelection { SubnetType = SubnetType.PUBLIC },
            });

            // Explicitly enable public IP assignment for the Fargate task
            var cfnService = fargateService.Service.Node.DefaultChild as CfnService;
            if (cfnService != null)
            {
                cfnService.AddPropertyOverride("NetworkConfiguration.AwsvpcConfiguration.AssignPublicIp", "ENABLED");
            }

            // Grant permissions to the ECS Task Role
            fargateService.TaskDefinition.TaskRole.AddManagedPolicy(
                ManagedPolicy.FromAwsManagedPolicyName("AmazonEC2ContainerRegistryReadOnly"));

            // Allow HTTP Traffic from Anywhere
            fargateService.TargetGroup.ConfigureHealthCheck(new Amazon.CDK.AWS.ElasticLoadBalancingV2.HealthCheck
            {
                Path = "/health", // Matches the ASP.NET Core health check endpoint
                Interval = Duration.Seconds(30),
                Timeout = Duration.Seconds(5),
                HealthyThresholdCount = 2,
                UnhealthyThresholdCount = 3
            });

            // Open the Security Group for Public Access (IPv4)
            fargateService.Service.Connections.SecurityGroups[0].AddIngressRule(
                Peer.AnyIpv4(),
                Port.Tcp(8080),
                "Allow public HTTP access over IPv4"
            );

            // Open the Security Group for Public Access (IPv6)
            fargateService.Service.Connections.SecurityGroups[0].AddIngressRule(
                Peer.AnyIpv6(),
                Port.Tcp(8080),
                "Allow public HTTP access over IPv6"
            );
        }

        private void CopyDirectory(string sourceDir, string targetDir)
        {
            Directory.CreateDirectory(targetDir);

            foreach (var file in Directory.GetFiles(sourceDir))
            {
                File.Copy(file, Path.Combine(targetDir, Path.GetFileName(file)), true);
            }

            foreach (var dir in Directory.GetDirectories(sourceDir))
            {
                CopyDirectory(dir, Path.Combine(targetDir, Path.GetFileName(dir)));
            }
        }
    }
}
