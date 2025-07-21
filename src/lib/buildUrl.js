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
};