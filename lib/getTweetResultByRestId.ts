import type {TweetResult} from './types/tweetResult.ts'

export async function TweetResultByRestID(tweetId: string, headers: HeadersInit): Promise<TweetResult> {
    let url = "https://api.twitter.com/graphql/ncDeACNGIApPMaqGVuF_rw/TweetResultByRestId"
    const variables = {
        tweetId: tweetId,
        includePromotedContent: true,
        withBirdwatchNotes: true,
        withCommunity: true,
        withDownvotePerspective: true,
        withReactionsMetadata: true,
        withReactionsPerspective: true,
        withSuperFollowsTweetFields: true,
        withSuperFollowsUserFields: true,
        withVoice: true,
    }

    const features = {
        freedom_of_speech_not_reach_fetch_enabled: true,
        graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
        interactive_text_enabled: true,
        longform_notetweets_consumption_enabled: true,
        longform_notetweets_richtext_consumption_enabled: true,
        responsive_web_edit_tweet_api_enabled: true,
        responsive_web_enhance_cards_enabled: true,
        responsive_web_graphql_exclude_directive_enabled: true,
        responsive_web_graphql_skip_user_profile_image_extensions_enabled: true,
        responsive_web_graphql_timeline_navigation_enabled: true,
        responsive_web_text_conversations_enabled: true,
        responsive_web_twitter_blue_verified_badge_is_enabled: true,
        standardized_nudges_misinfo: true,
        tweet_awards_web_tipping_enabled: true,
        tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
        tweetypie_unmention_optimization_enabled: true,
        verified_phone_label_enabled: true,
        vibe_api_enabled: true,
        view_counts_everywhere_api_enabled: true,
    }

    url = `${url}?variables=${encodeURI(JSON.stringify(variables))}&features=${encodeURI(JSON.stringify(features))}`
    const response = await fetch(url, { method: 'GET', headers: headers })
    const json = await response.json();
    return json
}
