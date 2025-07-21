function buildUrl(host, paths = [], searchParams = []) {
  if (!host || typeof host !== 'string') {
    throw new Error('Invalid host URL');
  }

  // Normalize paths input
  const cleanPaths = (Array.isArray(paths) ? paths : [paths])
    .map(p => String(p).replace(/^\/+|\/+$/g, '')) // trim slashes
    .filter(Boolean);

  // Ensure host ends with "/"
  const base = host.endsWith('/') ? host : host + '/';

  let url;
  try {
    url = new URL(cleanPaths.join('/'), base);
  } catch (err) {
    throw new Error(`Invalid URL: ${err.message}`);
  }

  // Normalize searchParams
  if (Array.isArray(searchParams)) {
    url.search = new URLSearchParams(searchParams).toString();
  } else if (typeof searchParams === 'object' && searchParams !== null) {
    url.search = new URLSearchParams(Object.entries(searchParams)).toString();
  } else if (searchParams instanceof URLSearchParams) {
    url.search = searchParams.toString();
  }

  return url.toString();
}

module.exports = buildUrl;
