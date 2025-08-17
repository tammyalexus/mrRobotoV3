function assignSearchParams(url, searchParams) {
  if (Array.isArray(searchParams)) {
    // Case 1: array of key-value pairs
    url.search = new URLSearchParams(searchParams).toString();
  } else if (
    typeof searchParams === 'object' &&
    searchParams !== null &&
    !(searchParams instanceof URLSearchParams)
  ) {
    // Case 2: plain object
    url.search = new URLSearchParams(Object.entries(searchParams)).toString();
  } else if (searchParams instanceof URLSearchParams) {
    // Case 3: already a URLSearchParams instance
    url.search = searchParams.toString();
  }
  // Other types are ignored (e.g., string, null, number, etc.)
}

// Use built-in fetch (available in Node.js 18+)
// const fetch = require('node-fetch'); // Removed - using built-in fetch

const makeRequest = async ( url, options, extraHeaders ) => {
  // Convert string URL to URL object if needed
  const urlObj = typeof url === 'string' ? new URL(url) : url;
  
  // Handle data -> body conversion for fetch API
  const requestOptions = {
    headers: {
      accept: 'application/json',
      'accept-language': 'en-ZA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,af;q=0.6',
      'cache-control': 'max-age=0',
      'content-type': 'application/json',
      ...extraHeaders,
      ...(options.headers || {}) // Merge headers from options
    },
    ...options
  };
  
  // Remove headers from options to avoid duplication
  delete requestOptions.headers.headers;
  
  // Convert 'data' property to 'body' for fetch API compatibility
  if (requestOptions.data) {
    requestOptions.body = JSON.stringify(requestOptions.data);
    delete requestOptions.data;
  }
  
  try {
    const response = await fetch( urlObj.href, requestOptions )
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }
    return await response.json()
  } catch ( error ) {
    throw error; // Re-throw the error instead of silently swallowing it
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