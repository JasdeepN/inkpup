import handler from './contact';

function mockReqRes(method = 'GET', body = null) {
  const req = { method, body };
  let status = 200;
  const res = {
    status(s) { status = s; return this; },
    json(payload) { this._payload = payload; return this; },
    _getStatus() { return status; },
    _getPayload() { return this._payload; }
  };
  return { req, res };
}

test('contact handler rejects non-POST', () => {
  const { req, res } = mockReqRes('GET');
  handler(req, res);
  expect(res._getStatus()).toBe(405);
});

test('contact handler rejects missing fields', () => {
  const { req, res } = mockReqRes('POST', { name: 'A' });
  handler(req, res);
  expect(res._getStatus()).toBe(400);
});

test('contact handler accepts valid payload', () => {
  const { req, res } = mockReqRes('POST', { name: 'A', email: 'a@b.com', message: 'hi' });
  handler(req, res);
  expect(res._getStatus()).toBe(200);
  expect(res._getPayload()).toEqual({ ok: true });
});
