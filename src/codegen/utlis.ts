import fetch from "node-fetch";
import yaml from "js-yaml";
import camelCase from "camelcase";
import genUsername from "unique-username-generator";
import { uniqueNamesGenerator, Config, adjectives, colors, animals } from 'unique-names-generator';


export  function getResponse(jsonItem, restApiTag,operations){
    const responseStatus = getResponseStatus(jsonItem, restApiTag);
    const responses = jsonItem[restApiTag]?.responses[responseStatus]
    if (responses){
        const responseHTTP_TYPE_MAP =Object.values(responses)[0]
        if (typeof responseHTTP_TYPE_MAP === "object"){
            const HTTP_TYPE = Object.keys(responseHTTP_TYPE_MAP)[0]
            return `${operations}['responses']['${responseStatus}']['content']['${HTTP_TYPE}']`
        } else {
            return "any"
        }
    }
    return "any"
}

export function getResponseStatus(jsonItem, restApiTag){
    return Object.keys(jsonItem[restApiTag]?.responses)[0]
}

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

export async function getJSONSwagger(url){
    const res = await fetch(url, {
        headers: {
            'Content-Type': 'text/html'
        }
    });
    const data = await res.text();
    if (isJson(data)) {
        return JSON.parse(data);
    } else {
        return yaml.load(data, 'utf8');
    }

}

export const getRequestMethods = (jsonItem, allMethods) => allMethods.filter(el => el in jsonItem);

export const getMethodName = (sectionsArray, prefixName) => [...sectionsArray].reverse()
    .find(el => el !== prefixName && !el.includes('{'));

export const getSegmentName = (sectionsArray, prefixName) => {
    const prefixIndex = sectionsArray.findIndex(el => el === prefixName);
    return sectionsArray[prefixIndex + 1];
};

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
            if (!acc[current.in]){
                acc[current.in] = [];
            }
            acc.push({in: current.in, name: current.name, required: current.required })
            return acc;
        },[])
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

export function getRequestHeadersType (operation){
    if (operation.requestBody){
        return Object.keys(operation.requestBody.content)[0]
    } else {
        return 'application/json'
    }
}

export function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

export function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}

export function replaceAll(string,match, replace){
    return string.replace(new RegExp(match, 'g'), () => replace);
}

export function generateName(){
    return uniqueNamesGenerator({
        style: "lowerCase",
        dictionaries: [adjectives, colors, animals],
    })
    // return replaceAll(genUsername.generateUsername(""), "-", "_")
}
