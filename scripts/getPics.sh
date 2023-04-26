#!/bin/bash
wget2 -nc -x -P cdn $(jq -r '.[].photos | select( . != null ) | .[].url' server/db.json | sort -u)