import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../../server.js';

test('production server healthcheck returns 200 with valid schema', async () => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/healthz`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as { status: string; timestamp: string };
    assert.equal(body.status, 'healthy');
    assert.ok(typeof body.timestamp === 'string');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('production server serves index.html on arbitrary SPA routes', async () => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/curriculum/mod-05`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('<!doctype html>') || text.includes('<html'));
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
