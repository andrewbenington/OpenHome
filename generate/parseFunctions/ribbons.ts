export function parseFunction(line: string): {
  key: string;
  str: string;
} {
  const [key, str] = line.split('\t');
  return {
    key: key.slice(6),
    str,
  };
}
