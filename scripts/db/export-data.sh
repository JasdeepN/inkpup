#!/bin/bash
# Export data from D1 database to JSON files
# Usage: ./export-data.sh [local|dev|production] [output-dir]

set -e

ENV=${1:-local}
OUTPUT_DIR=${2:-./scripts/db/exports}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Determine database and remote flag
if [ "$ENV" = "local" ]; then
  DB_NAME="inkpup-db"
  REMOTE_FLAG=""
  ENV_FLAG=""
elif [ "$ENV" = "dev" ]; then
  DB_NAME="inkpup-db-dev"
  REMOTE_FLAG="--remote"
  ENV_FLAG=""
elif [ "$ENV" = "production" ]; then
  DB_NAME="inkpup-db"
  REMOTE_FLAG="--remote"
  ENV_FLAG=""
else
  echo "Error: Environment must be 'local', 'dev', or 'production'"
  exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR/$ENV/$TIMESTAMP"
EXPORT_PATH="$OUTPUT_DIR/$ENV/$TIMESTAMP"

echo "🗄️  Exporting data from $ENV environment ($DB_NAME)..."
echo "📁 Export path: $EXPORT_PATH"

# Export size_categories
echo "📊 Exporting size_categories..."
npx wrangler d1 execute $DB_NAME \
  --command="SELECT * FROM size_categories ORDER BY sort_order;" \
  --json $REMOTE_FLAG $ENV_FLAG > "$EXPORT_PATH/size_categories.json"

# Export styles
echo "📊 Exporting styles..."
npx wrangler d1 execute $DB_NAME \
  --command="SELECT * FROM styles ORDER BY sort_order;" \
  --json $REMOTE_FLAG $ENV_FLAG > "$EXPORT_PATH/styles.json"

# Export color_profiles
echo "📊 Exporting color_profiles..."
npx wrangler d1 execute $DB_NAME \
  --command="SELECT * FROM color_profiles ORDER BY sort_order;" \
  --json $REMOTE_FLAG $ENV_FLAG > "$EXPORT_PATH/color_profiles.json"

# Export schema_migrations for tracking
echo "📊 Exporting schema_migrations..."
npx wrangler d1 execute $DB_NAME \
  --command="SELECT * FROM schema_migrations ORDER BY version;" \
  --json $REMOTE_FLAG $ENV_FLAG > "$EXPORT_PATH/schema_migrations.json"

# Create metadata file
cat > "$EXPORT_PATH/metadata.json" << EOF
{
  "environment": "$ENV",
  "database": "$DB_NAME",
  "timestamp": "$TIMESTAMP",
  "export_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "exported_by": "$(whoami)@$(hostname)"
}
EOF

echo "✅ Export complete!"
echo "📁 Files saved to: $EXPORT_PATH"
echo ""
echo "Files exported:"
ls -lh "$EXPORT_PATH"

# Create symlink to latest export
ln -sfn "$TIMESTAMP" "$OUTPUT_DIR/$ENV/latest"
echo ""
echo "🔗 Latest export symlink: $OUTPUT_DIR/$ENV/latest -> $TIMESTAMP"
