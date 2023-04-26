#!/bin/bash
wget2 -nc -x -P cdn $(jq -r .[].user.profile_image_url_https server/db.json | sort -u | sed 's/_normal/_bigger/')