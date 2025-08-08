/**
 * Axios Mock Helper
 * Provides utilities for mocking Axios requests in tests
 */

import { jest } from '@jest/globals';
import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

export class AxiosMockHelper {
  private mockedAxios: jest.Mocked<typeof axios>;

  constructor() {
    this.mockedAxios = axios as jest.Mocked<typeof axios>;
  }

  /**
   * Mock successful GET request
   */
  mockGet(url: string, responseData: any, status = 200): void {
    this.mockedAxios.request.mockImplementation((config: AxiosRequestConfig) => {
      if (config.method?.toLowerCase() === 'get' && config.url === url) {
        return Promise.resolve({
          data: responseData,
          status,
          statusText: 'OK',
          headers: {},
          config
        } as AxiosResponse);
      }
      return Promise.reject(new Error(`Unmocked request: ${config.method} ${config.url}`));
    });
  }

  /**
   * Mock successful POST request
   */
  mockPost(url: string, responseData: any, status = 201): void {
    this.mockedAxios.request.mockImplementation((config: AxiosRequestConfig) => {
      if (config.method?.toLowerCase() === 'post' && config.url === url) {
        return Promise.resolve({
          data: responseData,
          status,
          statusText: 'Created',
          headers: {},
          config
        } as AxiosResponse);
      }
      return Promise.reject(new Error(`Unmocked request: ${config.method} ${config.url}`));
    });
  }

  /**
   * Mock successful PUT request
   */
  mockPut(url: string, responseData: any = {}, status = 200): void {
    this.mockedAxios.request.mockImplementation((config: AxiosRequestConfig) => {
      if (config.method?.toLowerCase() === 'put' && config.url === url) {
        return Promise.resolve({
          data: responseData,
          status,
          statusText: 'OK',
          headers: {},
          config
        } as AxiosResponse);
      }
      return Promise.reject(new Error(`Unmocked request: ${config.method} ${config.url}`));
    });
  }

  /**
   * Mock error response
   */
  mockError(url: string, status: number, errorData?: any): void {
    this.mockedAxios.request.mockImplementation((config: AxiosRequestConfig) => {
      if (config.url === url || url === '*') {
        const error = {
          isAxiosError: true,
          response: {
            status,
            statusText: this.getStatusText(status),
            data: errorData || { errorMessages: [`HTTP ${status} Error`] },
            headers: {},
            config
          },
          message: `Request failed with status code ${status}`,
          name: 'AxiosError',
          code: status.toString()
        };
        return Promise.reject(error);
      }
      return Promise.reject(new Error(`Unmocked request: ${config.method} ${config.url}`));
    });
  }

  /**
   * Mock multiple requests with different responses
   */
  mockMultiple(mocks: Array<{
    method: string;
    url: string;
    response?: any;
    status?: number;
    error?: { status: number; data?: any };
  }>): void {
    this.mockedAxios.request.mockImplementation((config: AxiosRequestConfig) => {
      const mock = mocks.find(m =>
        m.method.toLowerCase() === config.method?.toLowerCase() &&
        (m.url === config.url || this.urlMatches(config.url || '', m.url))
      );

      if (mock) {
        if (mock.error) {
          const error = {
            isAxiosError: true,
            response: {
              status: mock.error.status,
              statusText: this.getStatusText(mock.error.status),
              data: mock.error.data || { errorMessages: [`HTTP ${mock.error.status} Error`] },
              headers: {},
              config
            },
            message: `Request failed with status code ${mock.error.status}`,
            name: 'AxiosError',
            code: mock.error.status.toString()
          };
          return Promise.reject(error);
        }

        return Promise.resolve({
          data: mock.response || {},
          status: mock.status || (mock.method.toLowerCase() === 'post' ? 201 : 200),
          statusText: 'OK',
          headers: {},
          config
        } as AxiosResponse);
      }

      return Promise.reject(new Error(`Unmocked request: ${config.method} ${config.url}`));
    });
  }

  /**
   * Reset all mocks
   */
  reset(): void {
    this.mockedAxios.request.mockReset();
    this.mockedAxios.get.mockReset();
    this.mockedAxios.post.mockReset();
    this.mockedAxios.put.mockReset();
    this.mockedAxios.delete.mockReset();
  }

  /**
   * Verify request was made with specific parameters
   */
  verifyRequest(method: string, url: string, expectedData?: any): void {
    const calls = this.mockedAxios.request.mock.calls;
    const matchingCall = calls.find(call => {
      const config = call[0] as AxiosRequestConfig;
      return config.method?.toLowerCase() === method.toLowerCase() &&
             config.url === url;
    });

    expect(matchingCall).toBeDefined();

    if (expectedData && matchingCall) {
      const config = matchingCall[0] as AxiosRequestConfig;
      expect(config.data).toEqual(expectedData);
    }
  }

  /**
   * Get number of requests made to specific endpoint
   */
  getRequestCount(method: string, url: string): number {
    const calls = this.mockedAxios.request.mock.calls;
    return calls.filter(call => {
      const config = call[0] as AxiosRequestConfig;
      return config.method?.toLowerCase() === method.toLowerCase() &&
             config.url === url;
    }).length;
  }

  /**
   * Get all requests made
   */
  getAllRequests(): Array<{ method: string; url: string; data?: any }> {
    return this.mockedAxios.request.mock.calls.map(call => {
      const config = call[0] as AxiosRequestConfig;
      return {
        method: config.method || 'GET',
        url: config.url || '',
        data: config.data
      };
    });
  }

  private getStatusText(status: number): string {
    const statusTexts: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      429: 'Too Many Requests',
      500: 'Internal Server Error'
    };
    return statusTexts[status] || 'Unknown';
  }

  private urlMatches(actual: string, pattern: string): boolean {
    // Simple pattern matching - could be enhanced with regex if needed
    if (pattern.includes('*')) {
      const regexPattern = pattern.replace(/\*/g, '.*');
      return new RegExp(regexPattern).test(actual);
    }
    return actual === pattern;
  }
}
