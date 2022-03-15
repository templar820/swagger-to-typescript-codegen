const path = require('path');
const { CreateApiService } = require('./dist/index');

CreateApiService({
  outputPath: './api', // url to generate service in your app
  prefix: 'api', // for example: api -> /api/users/
  swaggerEndpoint: path.resolve(__dirname, './swagger.yaml'), // your swagger address (GET-Request)
});
