# Database Sync Utilities

Tools for syncing data between local, dev, and production D1 databases.

## Quick Reference

```bash
# Export production data to local
./scripts/db/export-data.sh production
./scripts/db/import-data.sh local ./scripts/db/exports/production/latest

# Export production data to dev
./scripts/db/export-data.sh production
./scripts/db/import-data.sh dev ./scripts/db/exports/production/latest

# Backup production before making changes
./scripts/db/export-data.sh production ./scripts/db/backups
```

## Available Scripts

### 1. `export-data.sh` - Export Database to JSON

**Purpose:** Extract data from any environment (local, dev, production) to JSON files.

**Usage:**
```bash
./scripts/db/export-data.sh [environment] [output-directory]
```

**Arguments:**
- `environment`: `local`, `dev`, or `production` (default: `local`)
- `output-directory`: Where to save exports (default: `./scripts/db/exports`)

**Examples:**
```bash
# Export from production (creates timestamped directory)
./scripts/db/export-data.sh production

# Export from dev environment
./scripts/db/export-data.sh dev

# Export to custom directory (e.g., for backup)
./scripts/db/export-data.sh production ./backups/pricing-data
```

**Output Structure:**
```
scripts/db/exports/
└── production/
    ├── latest -> 20251122_152034/  (symlink to most recent)
    ├── 20251122_152034/
    │   ├── size_categories.json
    │   ├── styles.json
    │   ├── color_profiles.json
    │   ├── schema_migrations.json
    │   └── metadata.json
    └── 20251121_093012/
        └── ...
```

### 2. `import-data.sh` - Import JSON to Database

**Purpose:** Import previously exported JSON data into any environment.

**Usage:**
```bash
./scripts/db/import-data.sh [target-environment] [export-path]
```

**Arguments:**
- `target-environment`: `local`, `dev`, or `production` (default: `local`)
- `export-path`: Path to exported data (default: `./scripts/db/exports/production/latest`)

**Examples:**
```bash
# Import production data to local for testing
./scripts/db/import-data.sh local ./scripts/db/exports/production/latest

# Import production data to dev
./scripts/db/import-data.sh dev ./scripts/db/exports/production/latest

# Restore production from backup (requires confirmation)
./scripts/db/import-data.sh production ./backups/pricing-data/20251122_152034
```

**Safety Features:**
- Production imports require explicit confirmation: `IMPORT TO PRODUCTION`
- Shows SQL preview before execution
- Verifies row counts after import
- Records source environment in metadata

## Common Workflows

### Testing Production Data Locally

```bash
# 1. Export latest production data
./scripts/db/export-data.sh production

# 2. Import to local development
./scripts/db/import-data.sh local ./scripts/db/exports/production/latest

# 3. Test your changes locally
npm run dev

# 4. If needed, export your local changes
./scripts/db/export-data.sh local ./scripts/db/exports
```

### Syncing Production to Dev for QA

```bash
# Export from production
./scripts/db/export-data.sh production

# Import to dev environment
./scripts/db/import-data.sh dev ./scripts/db/exports/production/latest

# Deploy dev with production data
npx wrangler deploy --env dev
```

### Creating Backups Before Schema Changes

```bash
# Create timestamped backup before running migration
./scripts/db/export-data.sh production ./scripts/db/backups

# Run your migration
npx wrangler d1 execute inkpup-db --file=migrations/003_add_new_table.sql --remote

# If something goes wrong, restore from backup
./scripts/db/import-data.sh production ./scripts/db/backups/production/latest
```

### Promoting Dev Changes to Production

```bash
# 1. Test thoroughly on dev
# ... testing ...

# 2. Export dev data
./scripts/db/export-data.sh dev

# 3. Review the export
cat ./scripts/db/exports/dev/latest/*.json

# 4. Import to production (with confirmation)
./scripts/db/import-data.sh production ./scripts/db/exports/dev/latest
```

## Data Flow Diagrams

### Backward Sync (Production → Dev/Local)
```
Production DB
    │
    ├─── export-data.sh production
    │         │
    │         ↓
    │    JSON files (timestamped)
    │         │
    │         ├─── import-data.sh local ───→ Local DB
    │         │
    │         └─── import-data.sh dev ────→ Dev DB
```

### Forward Sync (Dev → Production)
```
Dev DB
    │
    ├─── export-data.sh dev
    │         │
    │         ↓
    │    JSON files (review & verify)
    │         │
    │         └─── import-data.sh production ──→ Production DB
                           ↑
                      (requires confirmation)
```

## File Formats

### Exported JSON Structure

**size_categories.json:**
```json
[
  {
    "id": "micro",
    "label": "Micro / Tiny (≤1\" or ≤2.5cm)",
    "min_price": 100,
    "max_price": 200,
    "description": "Simple linework / minimal symbol",
    "sort_order": 1
  }
]
```

**metadata.json:**
```json
{
  "environment": "production",
  "database": "inkpup-db",
  "timestamp": "20251122_152034",
  "export_date": "2025-11-22T15:20:34Z",
  "exported_by": "admin@server"
}
```

## Troubleshooting

### Export fails with "database not found"
- Verify you're logged into Wrangler: `npx wrangler login`
- Check database exists: `npx wrangler d1 list`

### Import shows "jq: command not found"
- Install jq: `sudo apt install jq` (Linux) or `brew install jq` (Mac)

### Import to production gets stuck at confirmation
- Type exactly: `IMPORT TO PRODUCTION` (case-sensitive)
- Press Enter

### Row counts don't match after import
- Check for errors in the SQL preview
- Verify source JSON files are not corrupted
- Re-run export and try again

## Advanced Usage

### Selective Export/Import

To export only specific tables, modify the scripts or run manual queries:

```bash
# Export only styles table
npx wrangler d1 execute inkpup-db \
  --command="SELECT * FROM styles ORDER BY sort_order;" \
  --json --remote > styles-only.json
```

### Automated Daily Backups

Add to crontab:
```cron
# Daily production backup at 2 AM
0 2 * * * cd /path/to/project && ./scripts/db/export-data.sh production ./backups/daily/$(date +\%Y\%m\%d)
```

### CI/CD Integration

In GitHub Actions workflow:
```yaml
- name: Sync production to dev for testing
  run: |
    ./scripts/db/export-data.sh production
    ./scripts/db/import-data.sh dev ./scripts/db/exports/production/latest
```

## Safety Checklist

Before importing to production:

- [ ] Backup current production data
- [ ] Review exported JSON files
- [ ] Test import on local first
- [ ] Test import on dev environment
- [ ] Verify row counts match expectations
- [ ] Schedule maintenance window (if needed)
- [ ] Have rollback plan ready
- [ ] Notify team of data changes

## Related Documentation

- [Database Schema](../../docs/database-schema.md) (TODO)
- [Migration Guide](./migrations/README.md) (TODO)
- [Wrangler D1 Documentation](https://developers.cloudflare.com/d1/)
