UPDATE teams
SET logo_url = REPLACE(logo_url, '.svg', '.png'),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE source = 'fixture:serie-a-2026-2027'
  AND logo_url LIKE '/assets/serie-a-2026-2027/%.svg';
