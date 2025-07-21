// tests/buildUrl.test.js
const buildUrl = require('../../..//src/lib/buildUrl');

describe('buildUrl', () => {
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
});
