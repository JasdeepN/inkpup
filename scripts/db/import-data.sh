#!/bin/bash
# Import data from JSON export to D1 database
# Usage: ./import-data.sh [local|dev|production] [export-path]

set -e

TARGET_ENV=${1:-local}
EXPORT_PATH=${2:-"./scripts/db/exports/production/latest"}

# Determine database and remote flag
if [ "$TARGET_ENV" = "local" ]; then
  DB_NAME="inkpup-db"
  REMOTE_FLAG=""
elif [ "$TARGET_ENV" = "dev" ]; then
  DB_NAME="inkpup-db-dev"
  REMOTE_FLAG="--remote"
elif [ "$TARGET_ENV" = "production" ]; then
  DB_NAME="inkpup-db"
  REMOTE_FLAG="--remote"
else
  echo "Error: Environment must be 'local', 'dev', or 'production'"
  exit 1
fi

# Verify export path exists
if [ ! -d "$EXPORT_PATH" ]; then
  echo "Error: Export path does not exist: $EXPORT_PATH"
  exit 1
fi

# Load metadata
if [ -f "$EXPORT_PATH/metadata.json" ]; then
  SOURCE_ENV=$(jq -r '.environment' "$EXPORT_PATH/metadata.json")
  EXPORT_DATE=$(jq -r '.export_date' "$EXPORT_PATH/metadata.json")
  echo "📦 Import source: $SOURCE_ENV environment"
  echo "📅 Exported: $EXPORT_DATE"
else
  echo "⚠️  Warning: No metadata found. Proceeding anyway..."
  SOURCE_ENV="unknown"
fi

echo ""
echo "🎯 Target: $TARGET_ENV environment ($DB_NAME)"
echo ""

# Confirmation for production imports
if [ "$TARGET_ENV" = "production" ]; then
  echo "⚠️  WARNING: You are about to import data into PRODUCTION!"
  echo "   This will REPLACE existing data."
  read -p "   Type 'IMPORT TO PRODUCTION' to confirm: " CONFIRM
  if [ "$CONFIRM" != "IMPORT TO PRODUCTION" ]; then
    echo "❌ Import cancelled."
    exit 1
  fi
fi

# Create temporary SQL file
TEMP_SQL=$(mktemp)
trap "rm -f $TEMP_SQL" EXIT

echo "-- Generated import SQL from $SOURCE_ENV export" > "$TEMP_SQL"
echo "-- Target: $TARGET_ENV ($DB_NAME)" >> "$TEMP_SQL"
echo "-- $(date)" >> "$TEMP_SQL"
echo "" >> "$TEMP_SQL"

# Clear existing data
echo "🗑️  Clearing existing data..."
echo "DELETE FROM color_profiles;" >> "$TEMP_SQL"
echo "DELETE FROM styles;" >> "$TEMP_SQL"
echo "DELETE FROM size_categories;" >> "$TEMP_SQL"
echo "" >> "$TEMP_SQL"

# Convert JSON exports to SQL INSERT statements
echo "📊 Converting size_categories..."
if [ -f "$EXPORT_PATH/size_categories.json" ]; then
  jq -r '.[0].results[] | 
    "INSERT INTO size_categories (id, label, min_price, max_price, description, sort_order) VALUES (" +
    "\"" + (.id | gsub("\""; "\"\"")) + "\", " +
    "\"" + (.label | gsub("\""; "\"\"")) + "\", " +
    (.min_price|tostring) + ", " +
    (.max_price|tostring) + ", " +
    (if .description then "\"" + (.description | gsub("\""; "\"\"")) + "\"" else "NULL" end) + ", " +
    (.sort_order|tostring) + ");"
  ' "$EXPORT_PATH/size_categories.json" >> "$TEMP_SQL"
  echo "" >> "$TEMP_SQL"
fi

echo "📊 Converting styles..."
if [ -f "$EXPORT_PATH/styles.json" ]; then
  jq -r '.[0].results[] | 
    "INSERT INTO styles (id, label, multiplier, description, recommended_color_type, sort_order) VALUES (" +
    "\"" + (.id | gsub("\""; "\"\"")) + "\", " +
    "\"" + (.label | gsub("\""; "\"\"")) + "\", " +
    (.multiplier|tostring) + ", " +
    (if .description then "\"" + (.description | gsub("\""; "\"\"")) + "\"" else "NULL" end) + ", " +
    (if .recommended_color_type then "\"" + (.recommended_color_type | gsub("\""; "\"\"")) + "\"" else "NULL" end) + ", " +
    (.sort_order|tostring) + ");"
  ' "$EXPORT_PATH/styles.json" >> "$TEMP_SQL"
  echo "" >> "$TEMP_SQL"
fi

echo "📊 Converting color_profiles..."
if [ -f "$EXPORT_PATH/color_profiles.json" ]; then
  jq -r '.[0].results[] | 
    "INSERT INTO color_profiles (id, label, multiplier, description, sort_order) VALUES (" +
    "\"" + (.id | gsub("\""; "\"\"")) + "\", " +
    "\"" + (.label | gsub("\""; "\"\"")) + "\", " +
    (.multiplier|tostring) + ", " +
    (if .description then "\"" + (.description | gsub("\""; "\"\"")) + "\"" else "NULL" end) + ", " +
    (.sort_order|tostring) + ");"
  ' "$EXPORT_PATH/color_profiles.json" >> "$TEMP_SQL"
fi

# Show the SQL for review (first 30 lines)
echo ""
echo "📄 Generated SQL preview:"
head -30 "$TEMP_SQL"
echo "... (see $TEMP_SQL for full content)"
echo ""

# Execute the import
echo "⚡ Executing import to $TARGET_ENV..."
npx wrangler d1 execute $DB_NAME --file="$TEMP_SQL" $REMOTE_FLAG

echo ""
echo "✅ Import complete!"
echo ""
echo "🔍 Verifying row counts..."
npx wrangler d1 execute $DB_NAME \
  --command="SELECT COUNT(*) as count, 'styles' as table_name FROM styles UNION ALL SELECT COUNT(*), 'size_categories' FROM size_categories UNION ALL SELECT COUNT(*), 'color_profiles' FROM color_profiles;" \
  $REMOTE_FLAG
