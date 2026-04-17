module.exports = {
    collectCoverageFrom: ['src/**/*.ts'],
    moduleFileExtensions: ['js', 'json', 'ts', 'node'],
    moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/ts/$1',
    },
    roots: ['<rootDir>/tests', '<rootDir>/src'],
    setupFilesAfterEnv: ['jest-extended/all', '<rootDir>/tests/setup.ts'],
    testEnvironment: 'jsdom',
    testMatch: ['**/tests/**/*.test.ts'],
    transform: {'^.+\\.ts$': 'ts-jest'},
}
