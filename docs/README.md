# tweet-browser

Experiment to display tweets offline.

# Usage

Download json data from list of tweet ids in `server/ids.json`. (Python because it has easy http2)

```sh
# install dependencies
pip3 install asyncio httpx[http2]
python3 scripts/batch.py
```

download photos
```sh
# requires wget2 and jq
./scripts/getPics.sh
```

Download profile pics
```sh
# requires wget2 and jq
./scripts/getProfilePics.sh
```
Start server
```sh
# requires deno
deno run --watch -A server/index.tsx
```
