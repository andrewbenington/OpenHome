module.exports = {
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.json' }],
    // '^.+\\.[tj]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [],
  testEnvironment: 'node',
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[tj]sx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^@pokemon-files/(.*)$': '<rootDir>/packages/pokemon-files/src/$1',
  },
}
