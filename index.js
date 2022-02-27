const path = require('path');
const { CreateApiService } = require('./dist/index');

CreateApiService({
  outputPath: './api',
  swaggerEndpoint: path.resolve(__dirname, './swagger.yaml'),
});
