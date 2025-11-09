// Ensure React and related packages load their testing/development builds.
if (process.env.NODE_ENV !== 'test') {
  process.env.NODE_ENV = 'test';
}
