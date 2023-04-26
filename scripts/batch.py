# Explicitly uses http2
import asyncio
import httpx
import json

client = httpx.AsyncClient(http2=True)

retweet_map = {}
failed = [ ]
async def tweetResult(id: int) -> httpx.Response:
    url = f"https://cdn.syndication.twimg.com/tweet-result?id={id}"    
    response = await client.get(url)
    if response.status_code == 200:
        j = response.json()
        retweet_map[id] =  j['id_str']
        return j
    else:
        failed.append(id)

async def downloadAll(ids):
    tweets = await asyncio.gather(*map(tweetResult, ids))

    data = {}
    # Create Dict with tweet id as key
    for tweet in tweets:
        if tweet is not None:
            data[tweet['id_str']] = tweet
   
    with open(f"server/db.json", 'w', encoding='utf8') as f:
        f.write(json.dumps(data, ensure_ascii=False))

    with open(f"server/failed_ids.json", 'w', encoding='utf8') as f:
        f.write(json.dumps(failed, ensure_ascii=False))

    return

async def main():
    f = open('server/ids.json')
    data = json.load(f)
    await downloadAll(data)

asyncio.run(main())