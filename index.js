const {CreateApiService} = require("./dist/index");

CreateApiService({
    outputPath: "./api",
    swaggerEndpoint: "http://51.250.9.175/api/schema/?format=yaml",
})
