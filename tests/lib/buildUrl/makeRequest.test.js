const { makeRequest } = require('../../../src/lib/buildUrl.js');

// Mock fetch for testing
global.fetch = jest.fn();

describe('makeRequest', () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    fetch.mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should make successful request with string URL', async () => {
    const mockResponse = { success: true, data: 'test' };
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse)
    });

    const result = await makeRequest('https://api.example.com/test', {});

    expect(fetch).toHaveBeenCalledWith('https://api.example.com/test', {
      headers: {
        accept: 'application/json',
        'accept-language': 'en-ZA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,af;q=0.6',
        'cache-control': 'max-age=0',
        'content-type': 'application/json'
      }
    });
    expect(result).toEqual(mockResponse);
  });

  test('should make successful request with URL object', async () => {
    const mockResponse = { success: true };
    const urlObj = new URL('https://api.example.com/test');
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse)
    });

    const result = await makeRequest(urlObj, {});

    expect(fetch).toHaveBeenCalledWith('https://api.example.com/test', {
      headers: {
        accept: 'application/json',
        'accept-language': 'en-ZA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,af;q=0.6',
        'cache-control': 'max-age=0',
        'content-type': 'application/json'
      }
    });
    expect(result).toEqual(mockResponse);
  });

  test('should merge extra headers correctly', async () => {
    const mockResponse = { success: true };
    const extraHeaders = {
      'Authorization': 'Bearer token123',
      'X-Custom-Header': 'custom-value'
    };
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse)
    });

    await makeRequest('https://api.example.com/test', {}, extraHeaders);

    expect(fetch).toHaveBeenCalledWith('https://api.example.com/test', {
      headers: {
        accept: 'application/json',
        'accept-language': 'en-ZA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,af;q=0.6',
        'cache-control': 'max-age=0',
        'content-type': 'application/json',
        'Authorization': 'Bearer token123',
        'X-Custom-Header': 'custom-value'
      }
    });
  });

  test('should merge headers from options correctly', async () => {
    const mockResponse = { success: true };
    const options = {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer token456',
        'X-Request-ID': 'req-123'
      }
    };
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse)
    });

    await makeRequest('https://api.example.com/test', options);

    expect(fetch).toHaveBeenCalledWith('https://api.example.com/test', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'accept-language': 'en-ZA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,af;q=0.6',
        'cache-control': 'max-age=0',
        'content-type': 'application/json',
        'Authorization': 'Bearer token456',
        'X-Request-ID': 'req-123'
      }
    });
  });

  test('should handle data property by converting to body', async () => {
    const mockResponse = { success: true };
    const testData = { username: 'test', password: 'secret' };
    const options = {
      method: 'POST',
      data: testData
    };
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse)
    });

    await makeRequest('https://api.example.com/login', options);

    expect(fetch).toHaveBeenCalledWith('https://api.example.com/login', {
      method: 'POST',
      body: JSON.stringify(testData),
      headers: {
        accept: 'application/json',
        'accept-language': 'en-ZA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,af;q=0.6',
        'cache-control': 'max-age=0',
        'content-type': 'application/json'
      }
    });
  });

  test('should handle both extraHeaders and options.headers (options override extraHeaders, defaults preserved)', async () => {
    const mockResponse = { success: true };
    const extraHeaders = { 'Authorization': 'Bearer extra-token' };
    const options = {
      headers: { 'Authorization': 'Bearer options-token', 'X-Custom': 'value' }
    };
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse)
    });

    await makeRequest('https://api.example.com/test', options, extraHeaders);

    expect(fetch).toHaveBeenCalledWith('https://api.example.com/test', {
      headers: {
        accept: 'application/json',
        'accept-language': 'en-ZA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,af;q=0.6',
        'cache-control': 'max-age=0',
        'content-type': 'application/json',
        'Authorization': 'Bearer options-token',
        'X-Custom': 'value'
      }
    });
  });

  test('should throw error for HTTP error responses', async () => {
    const errorText = 'Unauthorized access';
    
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: jest.fn().mockResolvedValueOnce(errorText)
    });

    await expect(makeRequest('https://api.example.com/protected', {}))
      .rejects
      .toThrow('HTTP 401: Unauthorized - Unauthorized access');
  });

  test('should handle network errors', async () => {
    const networkError = new Error('Network connection failed');
    
    fetch.mockRejectedValueOnce(networkError);

    await expect(makeRequest('https://api.example.com/test', {}))
      .rejects
      .toThrow('Network connection failed');
  });

  test('should handle JSON parsing errors gracefully', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockRejectedValueOnce(new Error('Invalid JSON'))
    });

    await expect(makeRequest('https://api.example.com/test', {}))
      .rejects
      .toThrow('Invalid JSON');
  });

  test('should pass through all options except headers and data', async () => {
    const mockResponse = { success: true };
    const options = {
      method: 'PUT',
      credentials: 'include',
      timeout: 5000,
      signal: new AbortController().signal,
      data: { test: 'data' }
    };
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse)
    });

    await makeRequest('https://api.example.com/test', options);

    expect(fetch).toHaveBeenCalledWith('https://api.example.com/test', {
      method: 'PUT',
      credentials: 'include',
      timeout: 5000,
      signal: options.signal,
      body: JSON.stringify({ test: 'data' }),
      headers: {
        accept: 'application/json',
        'accept-language': 'en-ZA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,af;q=0.6',
        'cache-control': 'max-age=0',
        'content-type': 'application/json'
      }
    });
  });

  test('should handle request without data property', async () => {
    const mockResponse = { success: true };
    const options = { method: 'GET' };
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse)
    });

    await makeRequest('https://api.example.com/test', options);

    const callArgs = fetch.mock.calls[0][1];
    expect(callArgs.body).toBeUndefined();
    expect(callArgs.data).toBeUndefined();
  });
});
