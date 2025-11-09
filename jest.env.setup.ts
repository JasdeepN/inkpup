// Ensure React and related packages load their testing/development builds.
if (process.env.NODE_ENV !== 'test') {
  // @ts-expect-error - NODE_ENV is readonly in newer Node versions
  process.env.NODE_ENV = 'test';
}
