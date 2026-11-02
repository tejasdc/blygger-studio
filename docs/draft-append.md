# Idempotent draft append

`POST /api/items/{id}/append` adds one Markdown section to a private thread
working copy. It is for clients which assemble one draft from separately owned
source blocks while the author may also edit the draft in Studio.

The caller supplies an operation id, the private `draft_revision` it last saw,
and the Markdown section. Migration 0033 stores the operation receipt and uses
one database trigger to append the section and advance the revision in the same
transaction. Repeating an operation id returns the current item without adding
the section twice. A different operation at a stale revision returns 409. The
author's existing Markdown is never replaced by append.

Ordinary item edits also advance `draft_revision`. A source client that replaces
one reusable draft item can pass `expected_revision` to `PATCH /api/items/{id}`;
a concurrent Studio edit then returns 409 instead of being overwritten.

This is draft authority. It neither publishes nor changes any pinned or public
version. Native transclusion identity still comes from Blyg item ids; an
ordinary external URL remains a cited quotation rather than a Blyg transclusion.
