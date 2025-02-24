using Amazon.CDK;

namespace EcsFargateCdk
{
    sealed class Program
    {
        public static void Main(string[] args)
        {
            var app = new App();
            new EcsFargateCdkStack(app, "ECSFargateStack", new StackProps
            {

            });
            app.Synth();
        }
    }
}
