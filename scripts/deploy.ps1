# Build the container and deploy to Google Cloud Run.
# Prereqs (one time): gcloud CLI installed and `gcloud init` done, Docker Desktop running,
# billing linked, and the `gemini-api-key` secret created (see README "Deploy to Cloud Run").
# Usage:  powershell -ExecutionPolicy Bypass -File scripts/deploy.ps1
$ErrorActionPreference = "Stop"

$PROJECT_ID     = "subham-planner"
$PROJECT_NUMBER = "320300452030"
$REGION         = "asia-south1"
$SERVICE        = "subham"
$IMAGE          = "$REGION-docker.pkg.dev/$PROJECT_ID/subham/web"
$SITE_URL       = "https://$SERVICE-$PROJECT_NUMBER.$REGION.run.app"

# Firebase web config: public by design, inlined into the browser bundle at build time.
$FB_API_KEY = "AIzaSyBoM4CSQxMB2jcbu5Lmy_4cEGvE0tB2T8s"
$FB_APP_ID  = "1:320300452030:web:d45335738ab3f7e74736ef"

function Check($step) { if ($LASTEXITCODE -ne 0) { throw "$step failed (exit $LASTEXITCODE)" } }

gcloud config set project $PROJECT_ID; Check "gcloud config"

docker build -t $IMAGE `
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY=$FB_API_KEY `
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="$PROJECT_ID.firebaseapp.com" `
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID=$PROJECT_ID `
  --build-arg NEXT_PUBLIC_FIREBASE_APP_ID=$FB_APP_ID `
  --build-arg NEXT_PUBLIC_SITE_URL=$SITE_URL .
Check "docker build"

docker push $IMAGE; Check "docker push"

gcloud run deploy $SERVICE --image $IMAGE --region $REGION --allow-unauthenticated `
  --set-env-vars AI_PROVIDER=gemini `
  --set-secrets GEMINI_API_KEY=gemini-api-key:latest
Check "gcloud run deploy"

Write-Host "`nDeployed. Expected URL: $SITE_URL"
Write-Host "If gcloud printed a different Service URL, update `$SITE_URL in this script and re-run."
