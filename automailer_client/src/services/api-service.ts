import BaseService from "./base-service";
import type { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

export const ApiService = {
  fetchDataRaw<Response = unknown, Request = Record<string, unknown>>(
    param: AxiosRequestConfig<Request>,
  ) {
    return new Promise<AxiosResponse<Response>>((resolve, reject) => {
      BaseService(param)
        .then((response: AxiosResponse<Response>) => {
          resolve(response);
        })
        .catch((errors: AxiosError) => {
          reject(errors);
        });
    });
  },
  fetchData<Response = unknown, Request = Record<string, unknown>>(
    param: AxiosRequestConfig<Request>,
  ) {
    return new Promise<Response>((resolve, reject) => {
      BaseService(param)
        .then((response: AxiosResponse<Response>) => {
          resolve(response.data);
        })
        .catch((errors: AxiosError) => {
          reject(errors);
        });
    });
  },
};

export default ApiService;
