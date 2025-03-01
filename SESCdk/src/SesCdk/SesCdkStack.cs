using Amazon.CDK;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.SES;
using Constructs;

namespace SesCdk
{
    public class SesCdkStack : Stack
    {
        internal SesCdkStack(Construct scope, string id, IStackProps props = null) : base(scope, id, props)
        {
            var verifiedEmailIdentity = new CfnEmailIdentity(this, "VerifiedEmail", new CfnEmailIdentityProps
            {
                EmailIdentity = "example@gmail.com"
            });

            // IAM Role to allow sending emails
            var sesSendEmailPolicy = new PolicyStatement(new PolicyStatementProps
            {
                Effect = Effect.ALLOW,
                Actions =
                [
                    "ses:SendEmail",
                    "ses:SendRawEmail"
                ],
                Resources = ["*"] // Allow sending emails from any verified identity
            });

            var sesRole = new Role(this, "SesSendEmailRole", new RoleProps
            {
                AssumedBy = new ServicePrincipal("lambda.amazonaws.com") // Adjust if another service is sending emails
            });

            sesRole.AddToPolicy(sesSendEmailPolicy);

            new CfnOutput(this, "VerifiedEmailOutput", new CfnOutputProps
            {
                Value = verifiedEmailIdentity.EmailIdentity,
                Description = "SES Verified Email Identity"
            });
        }
    }
}
