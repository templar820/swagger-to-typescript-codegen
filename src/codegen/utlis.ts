import fetch from 'node-fetch';
import yaml from 'js-yaml';
import camelCase from 'camelcase';
import {
  uniqueNamesGenerator, adjectives, colors, animals
} from 'unique-names-generator';
import fs from "fs";
import requestConfig from '../config.json';
import RequestTreeTag from './RequestTreeTag';

export function getResponse(jsonItem, restApiTag, operations) {
  const responseStatus = getResponseStatus(jsonItem, restApiTag);
  const responses = jsonItem[restApiTag]?.responses[responseStatus];
  if (responses) {
    const responseHTTP_TYPE_MAP = Object.values(responses)[0];
    if (typeof responseHTTP_TYPE_MAP === 'object') {
      const HTTP_TYPE = Object.keys(responseHTTP_TYPE_MAP)[0];
      return `${operations}['responses']['${responseStatus}']['content']['${HTTP_TYPE}']`;
    }
    return 'any';
  }
  return 'any';
}

export function getResponseStatus(jsonItem, restApiTag) {
  return Object.keys(jsonItem[restApiTag]?.responses)[0];
}

function isJson(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

export async function getJSONSwagger(url) {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'text/html'
    }
  });
  const data = await res.text();
  // const data = fs.readFileSync(url);
  if (isJson(data)) {
    return JSON.parse(data as any);
  }
  return yaml.load(data, 'utf8');
}

export const getRequestMethods = (jsonItem, allMethods) => allMethods.filter(el => el in jsonItem);

export const getBodyType = (jsonItem, restApiTag) => {
  let answer = '';
  if (jsonItem[restApiTag].requestBody) {
    answer += "['requestBody']['content']";
    if (jsonItem[restApiTag].requestBody.content['text/json']
            || jsonItem[restApiTag].requestBody.content['application/json']
    ) {
      answer += "['application/json']";
    } else if (jsonItem[restApiTag].requestBody && jsonItem[restApiTag].requestBody.content['multipart/form-data']) {
      answer += "['multipart/form-data']";
    }
    return answer;
  }
  return null;
};

export const getParametersType = (jsonItem, restApiTag) => {
  let answer = '';

  if (jsonItem[restApiTag]?.parameters?.length) {
    answer += "['parameters']";
  }
  return answer;
};

export const getParameters = (jsonItem, restApiTag) => {
  if (jsonItem[restApiTag]?.parameters?.length) {
    return jsonItem[restApiTag]?.parameters.reduce((acc, current) => {
      if (!acc[current.in]) {
        acc[current.in] = [];
      }
      acc.push({ in: current.in, name: current.name, required: current.required });
      return acc;
    }, []);
  }
  return null;
};

export const setCamelCaseKeys = obj => {
  if (!isObject(obj)) return;
  Object.keys(obj).forEach(oldKey => {
    const newKey = camelCase(oldKey);

    if (newKey !== oldKey) {
      delete Object.assign(obj, { [newKey]: obj[oldKey] })[oldKey];
    }
    setCamelCaseKeys(obj[newKey]);
  });
};


export function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}


export function replaceAll(string, match, replace) {
  return string.replace(new RegExp(match, 'g'), () => replace);
}

export function generateName() {
  return uniqueNamesGenerator({
    style: 'lowerCase',
    dictionaries: [adjectives, colors, animals],
  });
}

export function swaggerParamsList(json, config, callback) {
  const pathsArray = Object.keys(json.paths);
  return (pathsArray.reduce((acc, item) => {
    const jsonItem = json.paths[item];
    const methods = getRequestMethods(jsonItem, requestConfig.restApiMethodsArray);
    if (!methods.length) return acc;
    const arr = item.split('/').filter(el => !!el);

    methods.forEach(restApiTag => {
      const result = callback(restApiTag, jsonItem, [...arr, restApiTag], item, acc);
      const path = arr.filter(el => !el.includes("{"))
      acc.addElementInTree([...path, restApiTag], result);
    });
    return acc;
  }, new RequestTreeTag())).tree;
}
