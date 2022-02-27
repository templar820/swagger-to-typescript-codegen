import { pathList, PathListInterface } from './api';

const restApiMethodsArray = ['get', 'post', 'put', 'patch', 'delete'];

interface ApiServiceConfig {
    onBeforeRequest?: (path: string, parameters: any, type: string) => void;
    onAfterReceivingResponse?: (res: Response) => void;
    responseHandler:(res: Response) => any;
    endpoint: string;
    headers: HeadersInit;
}

type requestOptionsType = {
    method: string;
    headers: any;
    body?: string | FormData;
}

class ApiService {
  requests: PathListInterface;

  config: ApiServiceConfig;

  constructor(config: ApiServiceConfig = {} as ApiServiceConfig) {
    // @ts-ignore
    this.requests = pathList;

    this.config = config;
    this.initMethods();
  }

  private initMethods() {
    const getNestedMethod = obj => {
      if (!this.isObject(obj)) return;
      for (const [key, value] of Object.entries(obj)) {
        if (restApiMethodsArray.includes(key)) {
          const requestData = JSON.parse(JSON.stringify(obj[key]));
          const headers = this.getHeaders();
          obj[key] = ((...args) => {
            if (Array.isArray(requestData)) {
              const request = requestData.find(options => {
                const [body, parameters] = this.getBodyAndParamsFromArgs(options, args);
                const pathParams = options.parameters?.reduce((acc, current) => {
                  if (current.in === 'path' || current.in === 'query') {
                    acc.push(current);
                  }
                  return acc;
                }, []);
                if (!Array.isArray(pathParams) && !parameters?.path && !parameters?.query) return true;
                try {
                  // Тут внимательно сверяем что в апи, и что в функции прилетело ну т.е. чекаем на совпадение
                  return pathParams.some(el => ((parameters?.path && parameters.path[el.name]) && el.required)
                                        || ((el.in === 'query')
                                            && (!el.required || (parameters?.query && (parameters?.query[el.name])))
                                        ));
                } catch (e) {
                  return false;
                }
              });
              return this.createRequest(args, key, headers, request);
            }
            return this.createRequest(args, key, headers, requestData);
          });
        }
        getNestedMethod(value);
      }
    };

    getNestedMethod(this.requests);
  }

  private createRequest(args, key, headers, requestData) {
    const [body, parameters, options] = this.getBodyAndParamsFromArgs(requestData, args);

    const path = this.getPathWithParams(
      parameters,
      requestData
    );
    return this.fetch(path, body, key, headers, options);
  }

  private getBodyAndParamsFromArgs(requestData, args) {
    const body = requestData?.body ? args[0] : null;
    let parameters = null;
    let options;
    if (body) {
      if (args[1] && ('path' in args[1] || 'query' in args[1])) {
        options = args[2];
        parameters = args[1];
      } else {
        options = args[1];
      }
    } else {
      parameters = args[0];
      options = args[1];
    }
    return [body, parameters, options];
  }

  private getHeaders() {
    const headers = this.config.headers || {};
    headers['Content-Type'] = 'application/json';
    return headers;
  }

  private getPathWithParams(parameters, requestData) {
    let { path } = requestData;
    let firstQueryFlag = true;
    if (parameters) {
      requestData.parameters?.forEach(param => {
        if (requestData.path.includes(param.name) && param.in === 'path') {
          path = path.replace(`{${param.name}}`, parameters.path[param.name]);
        }
        if (param.in === 'query') {
          if (parameters.query[param.name]) {
            if (firstQueryFlag) {
              path += '?';
              firstQueryFlag = false;
            } else {
              path += '&';
            }
            path += `${ param.name }=${ parameters.query[param.name]}`;
          }
        }
      });
    }
    return path;
  }

  private isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }

  private async fetch(alias, parameters, type = 'POST', headers, requestOptions) {
    const options: requestOptionsType = {
      method: type.toUpperCase(),
      headers,
    };
    if (parameters) {
      if (requestOptions?.toFile) {
        const data = new FormData();
        for (const [key, value] of Object.entries(parameters)) {
          data.append(key, value as any);
        }
        options.body = data;
        delete options.headers['Content-Type'];
      } else {
        options.body = JSON.stringify(parameters);
      }
    }

    if (this.config.onBeforeRequest) {
      this.config.onBeforeRequest(alias, parameters, type);
    }

    try {
      const res = await fetch(this.config.endpoint + alias, options);
      return this.checkResponse(res);
    } catch (err) {
      return this.checkResponse(err);
    }
  }

  private async checkResponse(res) {
    let response;
    if (this.config.onAfterReceivingResponse) {
      this.config.onAfterReceivingResponse(res);
    }

    if (this.config.responseHandler) {
      return this.config.responseHandler(res);
    }
    try {
      response = await res.json();
    } catch (e) {
      throw new Error('internal server Error');
    }
    return response;
  }
}

export default ApiService;
