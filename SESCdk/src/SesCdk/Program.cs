using Amazon.CDK;

namespace SesCdk
{
    sealed class Program
    {
        public static void Main(string[] args)
        {
            var app = new App();
            new SesCdkStack(app, "SesCdkStack", new StackProps
            {
            });
            app.Synth();
        }
    }
}
