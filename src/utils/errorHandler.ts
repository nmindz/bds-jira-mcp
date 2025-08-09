import axios from 'axios';

interface ErrorHandlerOptions {
  operation: string;
  ticketId?: string;
  issueKeys?: string[];
  customMessages?: Record<number, string>;
}

/**
 * Centralized error handler for JIRA API errors
 * Provides consistent error messaging across all JIRA operations
 */
export function handleJiraApiError(error: unknown, options: ErrorHandlerOptions): never {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const statusText = error.response?.statusText;

    // Handle common HTTP status codes with consistent messaging
    switch (status) {
      case 404:
        if (options.ticketId) {
          throw new Error(`JIRA ticket ${options.ticketId} not found`);
        }
        if (options.issueKeys && options.issueKeys.length > 0) {
          if (options.issueKeys.length === 1) {
            throw new Error(`Issue ${options.issueKeys[0]} not found`);
          } else {
            throw new Error(`One or both issues not found: ${options.issueKeys.join(', ')}`);
          }
        }
        throw new Error(`Resource not found for ${options.operation}`);

      case 401:
        throw new Error("JIRA authentication failed. Check your credentials.");

      case 403:
        if (options.customMessages?.[403]) {
          throw new Error(options.customMessages[403]);
        }
        throw new Error("Insufficient permissions to perform this operation.");

      case 400:
        if (options.customMessages?.[400]) {
          throw new Error(options.customMessages[400]);
        }
        // Handle detailed validation errors for ticket creation
        if (error.response?.data?.errors || error.response?.data?.errorMessages) {
          const errorMessages = error.response.data.errors || error.response.data.errorMessages || [];
          if (Array.isArray(errorMessages)) {
            throw new Error(`Invalid data: ${errorMessages.join(', ')}`);
          } else {
            const errorDetails = Object.entries(errorMessages).map(([field, message]) => `${field}: ${message}`).join(', ');
            throw new Error(`Invalid data: ${errorDetails || statusText}`);
          }
        }
        throw new Error(`Invalid request for ${options.operation}: ${statusText}`);

      default:
        // Use custom message if provided, otherwise generic API error
        if (options.customMessages?.[status || 0]) {
          throw new Error(options.customMessages[status || 0]);
        }
        throw new Error(`JIRA API error: ${status} ${statusText}`);
    }
  }

  // Handle non-axios errors
  throw new Error(`Failed to ${options.operation}: ${error}`);
}
