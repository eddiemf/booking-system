/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\.tsx?$': ['ts-jest', {}],
  },
  clearMocks: true,
  resetMocks: true,
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/application/$1',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@__utils__/(.*)$': '<rootDir>/src/__utils__/$1',
  },
};
