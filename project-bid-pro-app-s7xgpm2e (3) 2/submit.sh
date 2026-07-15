#!/bin/bash
cd /home/user
export EXPO_TOKEN="f_xbRwARysLNYvfYU9FskxrNBwfmbWoxl86S0DIs"
npx eas-cli submit --platform ios --latest --non-interactive > /tmp/eas-submit.log 2>&1
echo "Exit code: $?" >> /tmp/eas-submit.log
