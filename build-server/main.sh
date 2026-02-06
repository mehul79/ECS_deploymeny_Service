#!/bin/bash

export GITHUB_REPOSITORY_URL="${GITHUB_REPOSITORY_URL"

git clone "${GITHUB_REPOSITORY_URL}" /home/app/output

exec script.js
