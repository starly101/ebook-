/**
 * Success response wrapper
 */
export function success(data, message = 'Success') {
  return {
    success: true,
    message,
    data
  };
}

/**
 * Error response wrapper
 */
export function error(code, message, details = []) {
  return {
    success: false,
    error: {
      code,
      message,
      details
    }
  };
}
