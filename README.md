# Getting Started with swagger-to-typescript

Yaml and json format is supported

## First step

create custom js script with

```js
CreateApiService({
    outputPath: "./api", // url to generate service in your app
    swaggerEndpoint: "YOUR_SWAGGER", // your swagger address (GET-Request)
})
```
starting this script to generate api
`node THIS_SCRIPT_NAME.js`

next, 2 files will be created along this path 
(it is recommended to create a folder named api for them).

## Second step
In your frontend App
```js
  import ApiService from "../api/Api.service"; // generate path folder === outputPath

  const apiService = new ApiService({
    endpoint: "YOUR_BACKEND_URL",
    headers: {}, //Your defaults headers, for example token
    responseHandler: res => {
        /*
        This is a very important handler, all requests that were sent through our service come here.
         The client must choose for himself how to parse the response body and whether it is necessary at all,
          as well as add handlers for response statuses from the server.
         */
    },
    onBeforeRequest: () => {
        // hook before every request. for example you can use this startLoader();
    },
    onAfterReceivingResponse: () => {
        // hook after every request. for example you can use this stopLoader();
    },

})
```

