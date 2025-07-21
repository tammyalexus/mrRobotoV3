const { assignSearchParams } = require('../../../src/lib/buildUrl.js');

describe('assignSearchParams', () => {
  let url;

  beforeEach(() => {
    url = { search: '' };
  });

  test('assigns search from array of tuples', () => {
    assignSearchParams(url, [['foo', 'bar'], ['baz', 'qux']]);
    expect(url.search).toBe('foo=bar&baz=qux');
  });

  test('assigns search from plain object', () => {
    assignSearchParams(url, { foo: 'bar', baz: 'qux' });
    expect(url.search).toBe('foo=bar&baz=qux');
  });

  test('assigns search from URLSearchParams instance', () => {
    const params = new URLSearchParams({ foo: 'bar', baz: 'qux' });
    assignSearchParams(url, params);
    expect(url.search).toBe('foo=bar&baz=qux');
  });

  test('does not modify search if searchParams is null', () => {
    assignSearchParams(url, null);
    expect(url.search).toBe('');
  });

  test('does not modify search if searchParams is unsupported type', () => {
    assignSearchParams(url, 'foo=bar');
    expect(url.search).toBe('');
  });
});