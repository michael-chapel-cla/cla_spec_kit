import 'framework-nodejs-appconfig';
import FrameworkFastify from 'framework-nodejs-fastify';

const framework = await FrameworkFastify.create();

await framework.initAppConfig({
  // azureAppConfigOptions: {
  //   useManagedIdentity: true,
  //   endpoint: APP_CONFIG_ENDPOINT,
  // },
  useEnvironmentVariables: false,
  fileConfigPath: './src/static-config.json',
});

// Start the server
await framework.start();
