function assignSearchParams(url, searchParams) {
  if (Array.isArray(searchParams)) {
    url.search = new URLSearchParams(searchParams).toString();
  } else if (
    typeof searchParams === 'object' &&
    searchParams !== null &&
    !(searchParams instanceof URLSearchParams)
  ) {
    url.search = new URLSearchParams(Object.entries(searchParams)).toString();
  } else if (searchParams instanceof URLSearchParams) {
    url.search = searchParams.toString();
  }
}

// Use built-in fetch (available in Node.js 18+)

const makeRequest = async (url, options = {}, extraHeaders = {}) => {
  const urlObj = typeof url === 'string' ? new URL(url) : url;

  const defaultHeaders = {
    accept: 'application/json',
    'accept-language': 'en-ZA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,af;q=0.6',
    'cache-control': 'max-age=0',
    'content-type': 'application/json'
  };

  const { headers: optionsHeaders = {}, data, ...restOptions } = options || {};

  // Merge order: defaults -> extraHeaders -> options.headers (options take precedence)
  const mergedHeaders = {
    ...defaultHeaders,
    ...extraHeaders,
    ...optionsHeaders
  };

  const requestOptions = {
    ...restOptions,
    headers: mergedHeaders
  };

  // Convert 'data' to 'body' with sensible defaults
  if (typeof data !== 'undefined') {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const isURLSearchParams = data instanceof URLSearchParams;

    if (isFormData) {
      requestOptions.body = data;
      // Let the runtime set the correct multipart boundary
      if (requestOptions.headers && requestOptions.headers['content-type']) {
        delete requestOptions.headers['content-type'];
      }
    } else if (isURLSearchParams) {
      requestOptions.body = data.toString();
      requestOptions.headers['content-type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
    } else if (typeof data === 'string' || Buffer.isBuffer(data)) {
      requestOptions.body = data;
    } else {
      requestOptions.body = JSON.stringify(data);
      if (!requestOptions.headers['content-type']) {
        requestOptions.headers['content-type'] = 'application/json';
      }
    }
  }

  try {
    const response = await fetch(urlObj.href, requestOptions);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
}

function buildUrl(host, paths = [], searchParams = []) {
  if (!host || typeof host !== 'string') {
    throw new Error('Invalid host URL');
  }

  // Normalize paths input
  const cleanPaths = (Array.isArray(paths) ? paths : [paths])
    .map(p => String(p).replace(/^\/+|\/+$/g, '')) // trim slashes
    .filter(Boolean); // remove empty segments

  // Ensure host ends with "/"
  const base = host.endsWith('/') ? host : host + '/';

  let url;
  try {
    url = new URL(cleanPaths.join('/'), base);
  } catch (err) {
    throw new Error(`Invalid URL: ${err.message}`);
  }

  // Add search parameters if provided
  assignSearchParams(url, searchParams);

  return url.toString();
}

module.exports = {
  buildUrl,
  assignSearchParams,
  makeRequest
};