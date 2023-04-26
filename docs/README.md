# tweet-browser

Experiment to display tweets offline.

# Usage

Download json data from list of tweet ids in `server/ids.json`. (Python because it has easy http2)

```sh
python3 scripts/batch.py
```

download photos
```sh
./scripts/getPics.sh
```

Download profile pics
```sh
./scripts/getProfilePics.sh
```
Start server
```sh
deno run --watch -A server/index.tsx
```
