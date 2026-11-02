-- A source-aware client can add one section to a thread without replacing a
-- Studio edit. The receipt and content update share the insert transaction;
-- the trigger refuses a stale private draft revision before either can land.
ALTER TABLE items ADD COLUMN draft_revision INTEGER NOT NULL DEFAULT 0 CHECK(typeof(draft_revision)='integer' AND draft_revision >= 0);

CREATE TABLE draft_appends (
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  operation_id TEXT NOT NULL,
  expected_revision INTEGER NOT NULL,
  content_md TEXT NOT NULL,
  created TEXT NOT NULL,
  PRIMARY KEY (item_id, operation_id)
);

CREATE TRIGGER draft_append_guard
BEFORE INSERT ON draft_appends
BEGIN
  SELECT RAISE(ABORT, 'draft changed')
  WHERE NOT EXISTS (
    SELECT 1 FROM items
    WHERE id = NEW.item_id AND kind = 'thread' AND draft_revision = NEW.expected_revision
  );
END;

CREATE TRIGGER draft_append_apply
AFTER INSERT ON draft_appends
BEGIN
  UPDATE items SET
    content_md = rtrim(content_md) || (CASE WHEN trim(content_md) = '' THEN '' ELSE char(10) || char(10) END) || trim(NEW.content_md) || char(10),
    dirty = 1,
    draft_revision = draft_revision + 1,
    updated = CASE WHEN version = 0 THEN NEW.created ELSE updated END
  WHERE id = NEW.item_id;
END;
