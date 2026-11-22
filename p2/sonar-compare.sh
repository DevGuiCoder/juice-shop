#!/usr/bin/env bash
set -euo pipefail
evidence="$PWD/p2/evidence/sonar"
baseline="$RUNNER_TEMP/p2-baseline"
mkdir -p "$baseline" "$evidence"
git archive 1618a61 | tar -x -C "$baseline"
export SONAR_HOST_URL=http://127.0.0.1:9000
SONAR_TOKEN=$(curl -fsS -u admin:admin -X POST "$SONAR_HOST_URL/api/user_tokens/generate" --data-urlencode name=p2-session | jq -r .token)
export SONAR_TOKEN
echo "::add-mask::$SONAR_TOKEN"
curl -fsS -u "$SONAR_TOKEN:" "$SONAR_HOST_URL/api/server/version" > "$evidence/server-version.txt"
docker pull sonarsource/sonar-scanner-cli
docker image inspect sonarsource/sonar-scanner-cli --format '{{json .RepoDigests}}' > "$evidence/scanner-image.json"
for phase in baseline posterior; do
  source="$PWD"
  revision=$(git rev-parse HEAD)
  if [ "$phase" = baseline ]; then source="$baseline"; revision=$(git rev-parse 1618a61); fi
  docker run --rm --user 0 --network host -e SONAR_HOST_URL -e SONAR_TOKEN -v "$source:/usr/src" -v "$evidence:/evidence" sonarsource/sonar-scanner-cli \
    -Dsonar.projectKey=p2-juice-shop \
    -Dsonar.projectName='Juice Shop P2' \
    -Dsonar.projectVersion="$revision" \
    -Dsonar.sources=lib,routes,models,frontend/src \
    -Dsonar.exclusions='**/*.spec.ts,**/assets/**,**/node_modules/**' \
    -Dsonar.scanner.metadataFilePath="/evidence/$phase-task.txt" \
    -Dsonar.sourceEncoding=UTF-8 2>&1 | tee "$evidence/$phase-scanner.txt"
  task=$(sed -n 's/^ceTaskId=//p' "$evidence/$phase-task.txt")
  ready=false
  for attempt in $(seq 1 90); do
    curl -fsS -u "$SONAR_TOKEN:" "$SONAR_HOST_URL/api/ce/task?id=$task" > "$evidence/$phase-task.json"
    state=$(jq -r .task.status "$evidence/$phase-task.json")
    if [ "$state" = SUCCESS ]; then ready=true; break; fi
    if [ "$state" = FAILED ] || [ "$state" = CANCELED ]; then exit 1; fi
    sleep 3
  done
  if [ "$ready" != true ]; then exit 1; fi
  curl -fsS -u "$SONAR_TOKEN:" "$SONAR_HOST_URL/api/measures/component?component=p2-juice-shop&metricKeys=bugs,vulnerabilities,code_smells,coverage,duplicated_lines_density,ncloc,reliability_rating,security_rating,sqale_rating" > "$evidence/$phase-measures.json"
  analysis=$(jq -r .task.analysisId "$evidence/$phase-task.json")
  curl -fsS -u "$SONAR_TOKEN:" "$SONAR_HOST_URL/api/qualitygates/project_status?analysisId=$analysis" > "$evidence/$phase-qualitygate.json"
done
curl -fsS -u "$SONAR_TOKEN:" "$SONAR_HOST_URL/api/project_analyses/search?project=p2-juice-shop" > "$evidence/analyses.json"
