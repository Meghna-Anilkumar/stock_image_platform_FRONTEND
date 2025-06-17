import { ResponseData } from "../interface/Interface";
import { AxiosError } from "axios";

export interface ErrorResponse extends ResponseData {
  data?: { [key: string]: string } | undefined
}

export function isErrorResponse(error: unknown): error is ErrorResponse {

  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error
  );

};


export const handleAxiosError = (error: unknown, defaultMessage: string) => {
  if (error instanceof AxiosError) {
    return error.response?.data || defaultMessage;
  }
  return defaultMessage;
};
