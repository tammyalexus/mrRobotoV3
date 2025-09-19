#!/bin/bash
# Delete all state files in logs/ starting with 0 or currentState_

LOGS_DIR="$(dirname "$0")/logs"

find "$LOGS_DIR" -type f \( -name '0*' -o -name 'serverMessage.log' -o -name 'statelessMessage.log' -o -name 'currentState_*' -o -name 'stateful*' \) -exec rm -f {} +

echo "Deleted all state files in $LOGS_DIR starting with 0 or currentState_. or stateful"
