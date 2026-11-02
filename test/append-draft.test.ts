import { expect, it } from 'vitest';
import { apiJson, login } from './helpers.ts';

it('appends a sourced section once and refuses to replace a Studio edit', async () => {
  const cookie = await login();
  const created = await apiJson(cookie, 'POST', '/api/items', { kind: 'thread', content_md: '# Working thread' });
  const id = created.json.id as string;
  const operation = { operation_id: 'annotation:reader-mark-1', expected_revision: created.json.draft_revision as number, content_md: '> Exact passage\n\nMy question' };

  const first = await apiJson(cookie, 'POST', `/api/items/${id}/append`, operation);
  expect(first.status).toBe(200);
  expect(first.json.appended).toBe(true);
  expect(first.json.item.content_md).toContain('> Exact passage\n\nMy question');

  const retry = await apiJson(cookie, 'POST', `/api/items/${id}/append`, operation);
  expect(retry.status).toBe(200);
  expect(retry.json.appended).toBe(false);
  expect(retry.json.item.content_md.match(/Exact passage/g)).toHaveLength(1);

  await apiJson(cookie, 'PATCH', `/api/items/${id}`, { content_md: `${retry.json.item.content_md}\nTejas edited this in Studio.` });
  const conflict = await apiJson(cookie, 'POST', `/api/items/${id}/append`, { operation_id: 'annotation:reader-mark-2', expected_revision: retry.json.item.draft_revision, content_md: '> Another passage' });
  expect(conflict.status).toBe(409);
  const held = await apiJson(cookie, 'GET', `/api/items/${id}`);
  expect(held.json.content_md).toContain('Tejas edited this in Studio.');
  expect(held.json.content_md).not.toContain('Another passage');

  const staleReplace = await apiJson(cookie, 'PATCH', `/api/items/${id}`, { expected_revision: retry.json.item.draft_revision, content_md: 'Replace from a stale reader note' });
  expect(staleReplace.status).toBe(409);
  expect((await apiJson(cookie, 'GET', `/api/items/${id}`)).json.content_md).toContain('Tejas edited this in Studio.');
});
