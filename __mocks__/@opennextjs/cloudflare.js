const getCloudflareContext = jest.fn(() => {
  throw new Error('getCloudflareContext mock not initialized for this test.');
});

module.exports = {
  getCloudflareContext,
};
