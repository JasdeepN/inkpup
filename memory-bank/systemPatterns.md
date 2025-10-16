# System Patterns

## Architectural Patterns

- Pattern 1: Description

## Design Patterns

- Pattern 1: Description

## Common Idioms

- Idiom 1: Description

## Jest --forceExit required when running tests in Terminal

Project rule: When running tests in a Terminal with `npx jest`, always include the `--forceExit` flag.

Details (user-provided):
- Is using `npx jest` for any testing you MUST use the `--forceExit` flag in addition to any other flags you are using if running tests in Terminal.
- Do NOT run tests without this flag if you don't, test suite will hang forever and you will not be able to continue without human intervention.

Note: The user states they've had to intervene many times. Source: user instruction saved on 2025-10-15. This pattern ensures terminal test runs don't hang and preserves developer workflow. Examples: `npx jest --forceExit`, `npx jest --runInBand --forceExit`.
