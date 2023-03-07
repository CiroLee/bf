/**** string case convert *****/
const convertRefExp = /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g;

export const camelCase = (str: string): string => {
  const matches = str.match(convertRefExp) as RegExpExecArray;
  const s = matches.map((x) => x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase()).join('');
  return s.slice(0, 1).toLowerCase() + s.slice(1);
};

export const pascalCase = (str: string): string => {
  const matches = str.match(convertRefExp) as RegExpExecArray;
  return matches.map((x) => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase()).join('');
};

export const kebabCase = (str: string): string => {
  const matches = str.match(convertRefExp) as RegExpExecArray;
  return matches.map((x) => x.toLowerCase()).join('-');
};

export const snakeCase = (str: string) => {
  const matches = str.match(convertRefExp) as RegExpExecArray;
  return matches.map((x) => x.toLowerCase()).join('_');
};
