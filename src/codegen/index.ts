import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import {
  generateName, replaceAll, getBodyType, getJSONSwagger, swaggerParamsList, getParameters, getParametersType, getResponse, setCamelCaseKeys
} from './utlis';
import RequestTreeTag from './RequestTreeTag';

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
  // дождаться пока отработает, копирнуть в папку куда указал клиент
  fs.copyFileSync(path.resolve(__dirname, '../../src/api/Api.service.ts'), path.resolve(config.outputPath, 'Api.service.ts'));
}

let overloadType = '';

const addPaths = async (config: ICreateApiServiceConfig, filePath: string) => {
  const json = await getJSONSwagger(config.swaggerEndpoint);
  let pathListInterface = {};
  let pathList = {};
  try {
    pathListInterface = getPathListInterface(json, config);
    pathList = getPathList(json, config);
    setCamelCaseKeys(pathListInterface);
    setCamelCaseKeys(pathList);
  } catch (e) {
    console.log(e);
  }
  
  generateResult(pathListInterface, pathList, filePath);
};

function getPathList(json, config) {
  return swaggerParamsList(json, config, (restApiTag, jsonItem, path: string[], item, acc: RequestTreeTag) => {
    const { operationId } = jsonItem[restApiTag];
    const bodyType = getBodyType(jsonItem, restApiTag);
    const newData = {
      id: operationId,
      body: !!bodyType,
      parameters: getParameters(jsonItem, restApiTag),
      path: item,
    };
    if (Object.keys(acc.getElement(path)).length) {
      const oldData = acc.getElement(path)[restApiTag];
      return [newData, Array.isArray(oldData) ? [...oldData] : oldData];
    }
    return newData;
  });
}

function getPathListInterface(json, config) {
  return swaggerParamsList(json, config, (restApiTag, jsonItem, path, item, acc: RequestTreeTag) => {
    const bodyType = getBodyType(jsonItem, restApiTag);
    const parametersType = getParametersType(jsonItem, restApiTag);
  
    let functionType = '';
    const operations = `operations['${jsonItem[restApiTag].operationId}']`;
    const answer = `Promise<${getResponse(jsonItem, restApiTag, operations)}>`;

    if (bodyType && !parametersType) {
      functionType = `"(body: ${operations + bodyType}) => ${answer}"`;
    }
    if (!bodyType && parametersType) {
      const isRequired = jsonItem[restApiTag].parameters.every(el => el.required);
      functionType = `"(parameters ${isRequired ? '' : '?'}: ${operations + parametersType} ) => ${answer}"`;
    }
    if (bodyType && parametersType) {
      functionType = `"(body: ${operations + bodyType}, parameters : ${operations + parametersType} ) => ${answer}"`;
    }
    if (!bodyType && !parametersType) {
      functionType = `"() => ${answer}"`;
    }
    const name = generateName();
  
  
    if (Object.keys(acc.getElement(path)).length) {
      const oldType = acc.getElement(path)[restApiTag];
      overloadType += oldType.replace('(', `function ${name} (`).replace('=>', ':') + '\n';
      overloadType += functionType.replace('(', `function ${name} (`).replace('=>', ':') + '\n';
      functionType = `typeof ${name}`;
    }
    return functionType;
  });
}

function generateResult(pathListInterface, pathList, filePath) {
  const apiFile = fs.readFileSync(filePath, { encoding: 'utf8' });

  const result = `
  ${replaceAll(overloadType, '"', '')}
  
  export interface PathListInterface ${

      replaceAll(
        replaceAll(
          replaceAll(
            JSON.stringify(pathListInterface, null, 2),
            '"',
            ''
          ),
          ',\n',
          ';\n'
        ),
        /\\/g,
        ''
      )
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
