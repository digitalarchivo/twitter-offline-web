import type CDNTweet from './types/cdnTweet.d.ts'

export async function getCDNTweet(id: string): Promise<CDNTweet | undefined> {
    const url = `https://cdn.syndication.twimg.com/tweet-result?id=${id}`
    try {
        const response = await fetch(url)
        if (!response.ok ){
            console.log(id)
            return
        }
        const json: CDNTweet = await response.json()
        if (response.ok) {
            return json
        }
    } catch (error) {
        console.error(error)
    }

}
