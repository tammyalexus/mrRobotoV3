// tests/buildUrl.test.js
const { buildUrl } = require('../../../src/lib/buildUrl.js');

describe('buildUrl', () => {
  test('throws an error when host is missing', () => {
    expect(() => buildUrl()).toThrow('Invalid host URL');
  });

  test('throws an error when host is not a string', () => {
    expect(() => buildUrl(123)).toThrow('Invalid host URL');
    expect(() => buildUrl({})).toThrow('Invalid host URL');
    expect(() => buildUrl(null)).toThrow('Invalid host URL');
  });

  test('throws an error when URL construction fails', () => {
    const invalidHost = 'ht!tp://:::/'; // deliberately malformed
    const paths = ['v3.0', 'groups'];

    expect(() => buildUrl(invalidHost, paths)).toThrow(/Invalid URL:/);
  });

  test('builds URL with object-style searchParams', () => {
    const result = buildUrl('https://example.com', ['api'], { foo: 'bar', baz: 'qux' });

    expect(result).toBe('https://example.com/api?foo=bar&baz=qux');
  });

  test('builds URL with URLSearchParams instance', () => {
    const params = new URLSearchParams({ test: 'true', user: 'admin' });
    const result = buildUrl('https://example.com', ['config'], params);

    expect(result).toBe('https://example.com/config?test=true&user=admin');
  });

  test('builds URL with plain object as searchParams', () => {
    const result = buildUrl('https://example.com', ['config'], { test: 'true', user: 'admin' });

    expect(result).toBe('https://example.com/config?test=true&user=admin');
  });

  test('forces coverage of plain object searchParams path', () => {
    const result = buildUrl('https://example.com', [], { a: '1' });
    expect(result).toBe('https://example.com/?a=1');
  });

  test('returns host when no paths or searchParams provided', () => {
    const url = buildUrl('https://example.com');
    expect(url).toBe('https://example.com/');
  });

  test('joins paths correctly', () => {
    const url = buildUrl('https://example.com', ['api', 'v1', 'users']);
    expect(url).toBe('https://example.com/api/v1/users');
  });

  test('adds search parameters correctly', () => {
    const url = buildUrl('https://example.com', [], [['foo', 'bar'], ['baz', 'qux']]);
    expect(url).toBe('https://example.com/?foo=bar&baz=qux');
  });

  test('builds full URL with paths and search parameters', () => {
    const url = buildUrl('https://example.com', ['api', 'v1'], [['page', '2'], ['limit', '10']]);
    expect(url).toBe('https://example.com/api/v1?page=2&limit=10');
  });

  test('encodes search parameters properly', () => {
    const url = buildUrl('https://example.com', [], [['name', 'A&B'], ['query', 'a+b=c']]);
    expect(url).toBe('https://example.com/?name=A%26B&query=a%2Bb%3Dc');
  });

  test('handles trailing slashes correctly in host', () => {
    const url = buildUrl('https://example.com/', ['api', 'v1']);
    expect(url).toBe('https://example.com/api/v1');
  });

  test('handles leading slashes in paths', () => {
    const url = buildUrl('https://example.com', ['/api', '/v1']);
    expect(url).toBe('https://example.com/api/v1');
  });

  test('trims leading and trailing slashes from path segments', () => {
    const result = buildUrl('https://example.com', ['/api/', '/v1/', 'users/']);
    expect(result).toBe('https://example.com/api/v1/users');
  });

  test('handles single string path input', () => {
    const result = buildUrl('https://example.com', '/dashboard');
    expect(result).toBe('https://example.com/dashboard');
  });
});
