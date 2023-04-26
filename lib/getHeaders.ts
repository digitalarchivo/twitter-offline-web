export async function genHeaders(): Promise<HeadersInit> {
    const url = "https://api.twitter.com/1.1/guest/activate.json";
    const bearer =
        `AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs=1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${bearer}`
        },
    });
    const json = await response.json();

    return {
        "Authorization": `Bearer ${bearer}`,
        "X-Guest-Token": json.guest_token,
    };
}
