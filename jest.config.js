/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.ts',
    ],
    clearMocks: true,
    verbose: true,
    preset: 'ts-jest',
    testPathIgnorePatterns: [
        '<rootDir>/dist/',
        '<rootDir>/node_modules/',
    ],
    testResultsProcessor: 'jest-sonar-reporter',
    reporters: [
        "default",
        process.env.GITHUB_ACTIONS === 'true' ? 'jest-github-actions-reporter' : null,
    ].filter(Boolean),
    testLocationInResults: true
};
