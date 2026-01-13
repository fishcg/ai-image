class ProviderError extends Error {
  constructor(message, { statusCode = 502, payload = {}, cause } = {}) {
    super(message);
    this.name = 'ProviderError';
    this.statusCode = statusCode;
    this.payload = payload;
    if (cause) this.cause = cause;
  }
}

module.exports = { ProviderError };
