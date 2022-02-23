import path from 'path';
import fs from 'fs';
import { execSync } from "child_process";
import requestConfig from "../config.json"
import { generateName, replaceAll, getBodyType, getJSONSwagger, getMethodName, getParameters, getParametersType, getRequestMethods, getResponse, getSegmentName, mergeDeep, setCamelCaseKeys } from "./utlis";



export interface ICreateApiServiceConfig{
    outputPath:string;
    swaggerEndpoint: string;
}


export default async function CreateApiService(config: ICreateApiServiceConfig) {
    const fileName = path.join(config.outputPath, 'api.ts');
    const filePath = path.resolve(fileName);
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    execSync(`npx openapi-typescript ${config.swaggerEndpoint} --output ${filePath}`);
    await addPaths(config, filePath);
    //дождаться пока отработает, копирнуть в папку куда указал клиент
    fs.copyFileSync(path.resolve(__dirname, "../../src/api/Api.service.ts"), path.resolve(config.outputPath ,"Api.service.ts"))
}


let overloadType = "";

const addPaths = async (config: ICreateApiServiceConfig, filePath: string) => {
    const json = await getJSONSwagger(config.swaggerEndpoint);

    const pathListInterface = swaggerParamsList(json, config, (restApiTag, jsonItem, segmentName, methodName, item, acc) => {
        const bodyType = getBodyType(jsonItem, restApiTag);
        const parametersType = getParametersType(jsonItem, restApiTag);

        let functionType = '';
        const operations = `operations['${jsonItem[restApiTag].operationId}']`;
        const answer = `Promise<${getResponse(jsonItem, restApiTag, operations)}>`


        if (bodyType && !parametersType) {
            functionType = `"(body: ${operations + bodyType}) => ${answer}"`;
        }
        if (!bodyType && parametersType) {
            let isRequired = jsonItem[restApiTag].parameters.every(el => el.required);
            functionType = `"(parameters ${isRequired ? "": "?"}: ${operations + parametersType} ) => ${answer}"`;
        }
        if (bodyType && parametersType) {
            functionType = `"(body: ${operations + bodyType}, parameters : ${operations + parametersType} ) => ${answer}"`;
        }
        if (!bodyType && !parametersType) {
            functionType = `"() => ${answer}"`;
        }
        const name = generateName();
        if (segmentName === methodName && acc[segmentName] && acc[segmentName][restApiTag]) {
            let oldType = acc[segmentName][restApiTag];
            overloadType += oldType.replace("(", `function ${name} (`).replace("=>", ":") + "\n"
            overloadType += functionType.replace("(", `function ${name} (`).replace("=>", ":") + "\n"
            functionType = `typeof ${name}`
        } else {
            if (acc[segmentName] && acc[segmentName][methodName] && acc[segmentName][methodName][restApiTag]){
                let oldType = acc[segmentName][methodName][restApiTag];
                overloadType += oldType.replace("(", `function ${name} (`).replace("=>", ":") + "\n"
                overloadType += functionType.replace("(", `function ${name} (`).replace("=>", ":") + "\n"
                functionType = `typeof ${name}`
            }
        }
        return functionType;
    })



    const pathList = swaggerParamsList(json, config,(restApiTag, jsonItem, segmentName, methodName, item, acc) => {
        const operationId = jsonItem[restApiTag].operationId
        const bodyType = getBodyType(jsonItem, restApiTag);
        const newData = {
            id: operationId,
            body: !!bodyType,
            parameters: getParameters(jsonItem, restApiTag),
            path: item,
        }


        if (segmentName === methodName && acc[segmentName] && acc[segmentName][restApiTag]) {
            let oldData = acc[segmentName][restApiTag];
            return [newData, oldData]
        } else {
            if (acc[segmentName] && acc[segmentName][methodName] && acc[segmentName][methodName][restApiTag]){
                let oldData = acc[segmentName][methodName][restApiTag];
                return [newData, Array.isArray(oldData)? [...oldData]: oldData]
            }
        }
        return newData
    })


    setCamelCaseKeys(pathListInterface);
    setCamelCaseKeys(pathList);
    generateResult(pathListInterface, pathList, filePath)
};



function swaggerParamsList(json, config, callback){
    const pathsArray = Object.keys(json.paths);
    return pathsArray.reduce((acc, item) => {
        const jsonItem = json.paths[item];
        const methods = getRequestMethods(jsonItem, requestConfig.restApiMethodsArray);
        if (!methods.length) return acc;
        const arr = item.split('/').filter(el => !!el);
        const segmentName = getSegmentName(arr, config.prefix);
        const methodName = getMethodName(arr, config.prefix);

        if (!segmentName || !methodName) return acc;
        const oldMethods = acc[segmentName] || {};
        const newMethod = {};
        const path = [...new Set([segmentName, methodName])]

        methods.forEach(restApiTag => {
            const result = callback(restApiTag, jsonItem, segmentName, methodName, item, acc);
            if (segmentName === methodName) {
                newMethod[restApiTag] = result
            } else {
                mergeDeep(newMethod, {
                    [methodName]: {
                        [restApiTag]: result
                    }
                });
            }
        });
        return {
            ...acc,
            [segmentName]:  mergeDeep(oldMethods, newMethod),
        };
    }, {});
}


function generateResult(pathListInterface, pathList, filePath){
    const apiFile = fs.readFileSync(filePath, { encoding: 'utf8' });

    const result = `
  ${replaceAll(overloadType,'"', '')}
  
  export interface PathListInterface ${
  
      replaceAll(
        replaceAll(
          replaceAll(
            JSON.stringify(pathListInterface, null, 2),
            '"', ''),
          ',\n', ';\n'),
        /\\/g, '')
    }\n
  export const pathList =  ${
        JSON.stringify(
            pathList,
            null,
            2
        )}
  ${apiFile}`;
    fs.writeFileSync(filePath, result);
}
