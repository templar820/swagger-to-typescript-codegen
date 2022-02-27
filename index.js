const {CreateApiService} = require("./dist/index");
const path = require("path")


CreateApiService({
    outputPath: "./api",
    swaggerEndpoint: path.resolve(__dirname, "./swagger.yaml"),
})
