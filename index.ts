import ApiService from "./api/Api.service";
import * as ISwagger from "./api/api"

import CreateApiService from "./src/codegen";

CreateApiService({
    outputPath: "./api",
    swaggerEndpoint: "http://51.250.9.175/api/schema/?format=yaml",
})


export {
  CreateApiService,
  ApiService,
  ISwagger
}
