export default function buildUrl(host, paths = [], searchParams = []) {
  const url = new URL(paths.join('/'), `${host}`);
  url.search = new URLSearchParams(searchParams);
  return url;
}
