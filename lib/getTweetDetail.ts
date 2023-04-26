import type TweetDetail from './types/tweetDetail.d.ts'

export async function TweetDetail(focalTweetID: string, headers: HeadersInit): Promise<TweetDetail|undefined> {
    const endpoint = "https://api.twitter.com/graphql/wTXkouwCKcMNQtY-NcDgAA/TweetDetail"
    const variables = {
        focalTweetId: focalTweetID,
        includePromotedContent: true,
        withBirdwatchNotes: true,
        withDownvotePerspective: true,
        withReactionsMetadata: true,
        withReactionsPerspective: true,
        withVoice: true,
        with_rux_injections: true,
        withCommunity: true,
        withQuickPromoteEligibilityTweetFields: true,
        withV2Timeline: true,
    }

    const features = {
        responsive_web_twitter_blue_verified_badge_is_enabled: true,
        responsive_web_graphql_exclude_directive_enabled: true,
        verified_phone_label_enabled: true,
        responsive_web_graphql_timeline_navigation_enabled: true,
        responsive_web_graphql_skip_user_profile_image_extensions_enabled: true,
        tweetypie_unmention_optimization_enabled: true,
        vibe_api_enabled: true,
        responsive_web_edit_tweet_api_enabled: true,
        graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
        view_counts_everywhere_api_enabled: true,
        longform_notetweets_consumption_enabled: true,
        tweet_awards_web_tipping_enabled: true,
        freedom_of_speech_not_reach_fetch_enabled: true,
        standardized_nudges_misinfo: true,
        tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
        interactive_text_enabled: true,
        responsive_web_text_conversations_enabled: true,
        longform_notetweets_richtext_consumption_enabled: true,
        responsive_web_enhance_cards_enabled: true,
    }

    const url = `${endpoint}?variables=${encodeURI(JSON.stringify(variables))}&features=${encodeURI(JSON.stringify(features))}`
    const response = await fetch(url, { method: 'GET', headers: headers })
    if (response.ok) {
        return await response.json();
    } else {
        console.error(`error in TweetDetail id=${focalTweetID}`)
        return undefined
    }
}