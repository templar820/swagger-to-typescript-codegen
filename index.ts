import CreateApiService from "./src/codegen";
import ApiService from "./api/Api.service";
import * as ISwagger from "./api/api"


// CreateApiService({
//     outputPath: "./api",
//     swaggerEndpoint: "http://51.250.9.175/api/schema/?format=yaml",
// })


export {
  CreateApiService,
  ApiService,
  ISwagger
}
