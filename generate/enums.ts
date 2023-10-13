import fs from 'fs';
import { dirname } from 'path';
import ts from 'typescript';

function removeDiacritics(str: string) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function convertToPascalCase(input: string): string {
  // Remove spaces and split the string into words
  const words = input.trim().split(/\s+/);

  // Capitalize the first letter of each word and join them
  const pascalCaseString = words
    .map((word) =>
      word.length === 0 ? '' : word[0].toUpperCase() + word.slice(1)
    )
    .join('');

  return pascalCaseString;
}

function pascalCaseKey(inputString: string) {
  // Convert the string to pascal case
  const pascalString = convertToPascalCase(removeDiacritics(inputString));

  // Remove punctuation
  let stringWithoutPunctuation = pascalString.replace(/[^\w\s]/g, '');

  if (stringWithoutPunctuation === '' || inputString.includes('???')) {
    stringWithoutPunctuation = 'Unknown';
  }

  return { key: stringWithoutPunctuation, str: inputString };
}

const generateEnumAndStringFunction = (
  enumName: string,
  values: string[],
  keyAndStringFromLine: (line: string) => { key: string; str: string }
) => {
  const duplicates: { [key: string]: number } = {};
  const enumMembers: ts.EnumMember[] = [];
  const caseClauses: ts.CaseOrDefaultClause[] = [];
  values.forEach((value) => {
    // eslint-disable-next-line prefer-const
    let { key, str } = keyAndStringFromLine(value);
    if (key in duplicates) {
      duplicates[key]++;
      key = `${key}_${duplicates[key]}`;
    } else {
      duplicates[key] = 0;
    }
    enumMembers.push(
      ts.factory.createEnumMember(ts.factory.createIdentifier(key))
    );
    caseClauses.push(
      ts.factory.createCaseClause(
        ts.factory.createIdentifier(`${enumName}.${key}`),
        [ts.factory.createReturnStatement(ts.factory.createStringLiteral(str))]
      )
    );
  });
  caseClauses.push(
    ts.factory.createDefaultClause([
      ts.factory.createReturnStatement(ts.factory.createStringLiteral('')),
    ])
  );

  const enumDeclaration = ts.factory.createEnumDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createIdentifier(enumName),
    enumMembers
  );

  const stringFunctionDeclaration = ts.factory.createFunctionDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    undefined,
    ts.factory.createIdentifier(`${enumName}ToString`),
    undefined,
    [
      ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        'item',
        undefined,
        ts.factory.createTypeReferenceNode(
          ts.factory.createIdentifier(enumName)
        )
      ),
    ],
    ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
    ts.factory.createBlock([
      ts.factory.createSwitchStatement(
        ts.factory.createIdentifier('item'),
        ts.factory.createCaseBlock(caseClauses)
      ),
    ])
  );

  return { enumDeclaration, stringFunctionDeclaration };
};

const readFileLinesToList = (filePath: string) => {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n').map((line) => line.trim());
    return lines;
  } catch (error: any) {
    console.error('Error reading the file:', error.message);
    return [];
  }
};

export const GenerateEnumFromTextFile = (
  enumName: string,
  textFile: string,
  codeFile: string,
  getKeyAndStr: ((line: string) => { key: string; str: string }) | undefined
) => {
  console.log(`generating ${codeFile} from ${textFile}...`);
  const outputFilePath = `${process.cwd()}/src/resources/gen/${codeFile}`;
  const resultFile = ts.createSourceFile(
    outputFilePath,
    '',
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS
  );
  const { enumDeclaration, stringFunctionDeclaration } =
    generateEnumAndStringFunction(
      enumName,
      readFileLinesToList(`${process.cwd()}/src/resources/${textFile}`),
      getKeyAndStr ?? pascalCaseKey
    );

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const enumContent = printer.printNode(
    ts.EmitHint.Unspecified,
    enumDeclaration,
    resultFile
  );

  const stringFunctionContent = printer.printNode(
    ts.EmitHint.Unspecified,
    stringFunctionDeclaration,
    resultFile
  );

  const outputFileContent = `// This file is auto-generated. Do not modify.\n\n${enumContent}`;

  if (!fs.existsSync(dirname(outputFilePath))) {
    console.log(`creating ${dirname(outputFilePath)}...`);
    fs.mkdirSync(dirname(outputFilePath), { recursive: true });
  }
  // Write the generated content to the output file
  fs.writeFileSync(
    outputFilePath,
    `${outputFileContent}\n${stringFunctionContent}`
  );
};
