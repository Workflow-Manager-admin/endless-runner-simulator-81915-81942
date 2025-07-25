#!/bin/bash
cd /home/kavia/workspace/code-generation/endless-runner-simulator-81915-81942/game_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

