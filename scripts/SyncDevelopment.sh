#!/bin/bash
# Script to synchronize Production Firestore to Local Emulator

PROJECT_ID="standlo"
BUCKET_NAME="gs://standlo-emulator-exports"
EXPORT_PREFIX="firestore_export"

echo "🚀 Starting Production Data Sync for Local Emulator..."

# 1. Create a temporary bucket if it doesn't exist (ignore error if it does)
gcloud storage buckets create $BUCKET_NAME --project=$PROJECT_ID --location=europe-west4 2>/dev/null

# 2. Export Firestore Production Data to Cloud Storage
echo "📦 Exporting Production Firestore to $BUCKET_NAME..."
gcloud firestore export $BUCKET_NAME/$EXPORT_PREFIX --database='standlo' --project=$PROJECT_ID

# 3. Clean local seed directory
echo "🧹 Cleaning local emulator seed directory..."
rm -rf seed/firestore_export

# 4. Download Export to local seed directory
echo "⬇️ Downloading export to local machine..."
gsutil -m cp -r "$BUCKET_NAME/$EXPORT_PREFIX" ./seed/

echo "👤 Exporting Production Authentication users..."
mkdir -p ./seed/auth_export
firebase auth:export ./seed/auth_export/accounts.json --project=$PROJECT_ID --format=json

echo "📝 Creating firebase-export-metadata.json for named database routing..."
cat << EOF > ./seed/firebase-export-metadata.json
{
  "version": "13.6.0",
  "firestore": {
    "version": "1.19.1",
    "path": "firestore_export",
    "metadata_file": "firestore_export/firestore_export.overall_export_metadata",
    "database": "standlo"
  },
  "auth": {
    "path": "auth_export"
  }
}
EOF

# 5. Cleanup Cloud Storage
echo "🗑️ Cleaning up temporary Cloud Storage bucket..."
gsutil -m rm -r "$BUCKET_NAME/$EXPORT_PREFIX"

echo "✅ Sync Complete! You can now start the emulator with:"
echo "👉 npm run emulator"
