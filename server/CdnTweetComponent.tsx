/** @jsx jsx */
import { jsx } from "https://deno.land/x/hono@v3.1.3/middleware.ts";

import type { IUrlsItem } from "../lib/types/tweetResult.ts";
import type {
  IHashtagsItem,
  ISymbolsItem,
  IUserMentionsItem,
} from "../lib/types/cdnTweet.d.ts";
import type CDNTweet from "../lib/types/cdnTweet.d.ts";

import { unescapeHTML } from "./html-escaper.js";

export function CdnTweetComponent(props: {
  id: string;
  db: Record<string, CDNTweet>;
  layout: string;
}) {
  const tweet = props.db[props.id];
  const entities = genIndices(tweet);
  const pollData = parsePoll(tweet);
  function fmtdate(d: Date) {
    return d.toLocaleDateString("en-us", {});
  }
  return (
    <article class={`tweet ${props.layout || "focus"}`} lang="">
      {/* Profile Picture */}
      <div class="profile-pic">
        <picture>
          <img
            class="pic"
            width="45"
            height="45"
            loading="lazy"
            onerror="this.onerror=null; this.src='cdn/abs.twimg.com/sticky/default_profile_images/default_profile_bigger.png'"
            src={tweet.user.profile_image_url_https.replace("https://","/cdn/").replace("_normal", "_bigger")}
            alt=""
          />
        </picture>
      </div>

      {/* User Info */}
      <div class="user-info">
        <a
          class="name"
          href={`https://twitter.com/intent/user?user_id=${tweet.user.id_str}`}
        >
          <span class="name-str">{tweet.user.name}</span>
          <span class="checkmark">{tweet.user.verified && checkmarkSvg}</span>
        </a>
        {/* screen name */}
        <span class="scr-name">@{tweet.user.screen_name}</span>
        <div class="date-compact">
          {fmtdate(new Date(Date.parse(tweet.created_at)))}
        </div>
      </div>

      <div class="content">
        {/* Text */}
        <p class="text">
          {entities.map((e) => {
            switch (e.type) {
              case "url":
                // return <Link text={e.display_url} href={e.expanded_url} />
                return <Link text={e.display_url} href={e.expanded_url} />;
              case "hashtag":
                return (
                  <Link
                    href={`https://twitter.com/hashtag/${e.text}`}
                    text={substr2(tweet.text, e.start, e.end)}
                  />
                );
              case "symbol":
                return (
                  <Link
                    href={`https://twitter.com/search?q=${e}`}
                    text={substr2(tweet.text, e.start, e.end)}
                  />
                );
              case "mention":
                // Ignore Replies
                if (
                  tweet.display_text_range &&
                  e.start > tweet.display_text_range[0]
                ) {
                  return (
                    <a
                      href={`https://twitter.com/intent/user?user_id=${e.id_str}`}
                    >
                      {substr2(tweet.text, e.start, e.end)}
                    </a>
                  );
                } else {
                  return;
                }
              case "text":
                // Escapes html entities and the rest is handed over to jsx
                // to re escape it into proper html that's readable
                // TODO: Test sanitation is ok
                return <span>{unescapeHTML(e.text)}</span>;
              default:
                // This is not supposed to happen
                console.error(
                  `entity parsing bug in tweet with id ${tweet.id_str}\n${tweet.text}`
                );
            }
          })}
        </p>

        {/* Gallery */}
        {/* Note: On Gifs, the tweet.photos array is empty, not undefined */}
          {/* Images from personal archive */}
        {/* // src={p.url.replace(
        //   "https://pbs.twimg.com/media/",
        //   `/cdn/media/${props.id}-`
        // )} */}
        {tweet.photos && tweet.photos.length >= 1 && (
          <div class={`gallery gallery-${tweet.photos.length}`}>
            {tweet.photos.map((p) => (
              <picture>
                <img
                  class="pic"
                  width={p.width}
                  height={p.height}
                  loading="lazy"
                  onerror="this.onerror=null; this.src='data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=='"
                  data-original={p.url}
                  src={p.url.replace("https://","/cdn/")}
                  alt={p.accessibilityLabel}
                  style={
                    tweet.photos?.length == 1 &&
                    `aspect-ratio: ${p.width}/${p.height}`
                  }
                />
              </picture>
            ))}
          </div>
        )}

        {/* Card */}
        {(tweet.card?.name == "summary" ||
          tweet.card?.name == "player" ||
          tweet.card?.name == "summary_large_image") && (
            <section class="card card-small">
              {/* Image */}
              {/* FIXME: Twitter does not show opengraph images at all */}
              <div class="card-no-image">{/* {docSvg} */}</div>

              <div class="card-content">
                {/* vanity url */}
                {tweet.card.binding_values.vanity_url && (
                  <div class="vanity-url">
                    {tweet.card.binding_values.vanity_url.string_value}
                  </div>
                )}
                {/* Title */}
                <div
                  class={`title ${tweet.card.binding_values.description ? "" : "title-2"
                    }`}
                >
                  <a href="#todo" target="_blank" rel="noopener noreferrer">
                    <span>
                      {tweet.card.binding_values.title &&
                        tweet.card.binding_values.title.string_value}
                    </span>
                    {/* Overlay. FIXME:idk what it was for  */}
                    <div class="overlay" aria-hidden="true"></div>
                  </a>
                </div>

                {/* Description */}
                {tweet.card.binding_values.description && (
                  <p class="description">
                    {tweet.card.binding_values.description.string_value}
                  </p>
                )}
              </div>
            </section>
          )}

        {/* Polls */}
        {pollData && (
          <section class="polls">
            {pollData.entries.map((e: { count: number; label: string }) => {
              // (math.Round (mul (div (float .count) $total) 100))
              let percent = Math.round((e.count / pollData.total) * 100);
              if (e.count == 0) {
                percent = 0;
              }
              return (
                <div
                  class={`poll-container ${e.count >= pollData.max && "win"}`}
                >
                  <div class="progress-container-text">
                    <span>
                      {e.label} {e.count}{" "}
                    </span>
                    <span>{percent}%</span>
                  </div>
                  {/* Progress bar */}
                  <div
                    class={`progress-bar ${e.count == pollData.max && percent > 0 && "win-bar"
                      }`}
                    style={`width: ${percent + 1}%;`}
                    aria-hidden="true"
                  ></div>
                </div>
              );
            })}
            <div class="total">
              <span>{pollData.total} votes</span>
              {pollData.isFinal && <span>· Final results</span>}
            </div>
          </section>
        )}
        <span>
          {/* Date */}
          <a class="tw-date">
            {new Date(Date.parse(tweet.created_at)).toDateString()}
          </a>
          {/* Place */}
          {tweet.place && (
            <a
              class="tw-place"
              href={`https://twitter.com/places/${tweet.place.id}`}
            >
              {" "}
              from {tweet.place.full_name}{" "}
            </a>
          )}
        </span>

        <div class="meta">
          {/* Likes */}
          <a
            class="likes"
            href={`https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {/* {LikeSvg} */}
            {tweet.favorite_count &&
              tweet.favorite_count > 0 &&
              smol(tweet.favorite_count)}{" "}
            Likes
          </a>

          {/* Link to tweet */}
          <a
            class="link"
            href={`https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {LinkSvg}
            Link to Tweet
          </a>
          <a class="link" href={`/status/${tweet.id_str}`}>
            local link
          </a>
        </div>

        <div class="tweet-buttons-thread">
          <a href={`/status/${tweet.id_str}`} class="blue">
            {commentSVG}
            {smol(tweet.conversation_count)}
          </a>
          <a href={`/status/${tweet.id_str}`} class="green">
            {retweetSvg}
            0
          </a>
          <a href={`/status/${tweet.id_str}`} class="red">
            {LikeSvg}
            {smol(tweet.favorite_count)}
          </a>
          <a
            href={`https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`}
            class="blue"
          >
            {LinkSvg}
          </a>
        </div>
      </div>
    </article>
  );
}

export type Entity =
  | TextEntity
  | SymbolEntity
  | HashtagEntity
  | UserMentionEntity
  | UrlEntity;

interface EntityBase {
  start: number;
  end: number;
}

export interface TextEntity extends EntityBase {
  type: "text";
  id?: string;
  text: string;
}

export interface SymbolEntity extends EntityBase {
  type: "symbol";
  text: string;
}

export interface HashtagEntity extends EntityBase {
  type: "hashtag";
  text: string;
}

export interface UserMentionEntity extends EntityBase {
  type: "mention";
  screen_name: string;
  id_str: string;
}

export interface UrlEntity extends EntityBase {
  type: "url";
  expanded_url: string;
  display_url: string;
}

function smol(number: number): string {
  return new Number(number).toLocaleString("en", { notation: "compact" });
}

// Parse twitter poll data
function parsePoll(t: CDNTweet) {
  if (t.card == undefined) {
    return;
  }
  const b = t.card.binding_values;
  // No Polls
  if (
    b.choice1_count == undefined ||
    b.choice1_label == undefined ||
    b.choice2_count == undefined ||
    b.choice2_label == undefined
  ) {
    return undefined;
  }

  interface Poll {
    count: number;
    label: string;
  }

  // Initialize variables
  // Polls have a minimum of 2 choices. Add first 2
  const polls: Array<Poll> = [
    {
      count: parseInt(b.choice1_count.string_value, 10),
      label: b.choice1_label.string_value,
    },
    {
      count: parseInt(b.choice2_count.string_value, 10),
      label: b.choice2_label.string_value,
    },
  ];

  // 3rd Choice (Optional)
  if (b.choice3_count && b.choice3_label) {
    polls.push({
      count: parseInt(b.choice3_count.string_value, 10),
      label: b.choice3_label.string_value,
    });
  }

  // 4th Choice (Optional)
  if (b.choice4_count && b.choice4_label) {
    polls.push({
      count: parseInt(b.choice4_count.string_value, 10),
      label: b.choice4_label.string_value,
    });
  }

  let isFinal = false;
  if (b.counts_are_final != undefined) {
    isFinal = b.counts_are_final.boolean_value;
  }

  // Count totals and get winner
  let max = 0;
  let total = 0;
  polls.forEach((p) => {
    total = total + p.count;
    if (p.count > max) {
      max = p.count;
    }
  });

  return {
    isFinal: isFinal,
    max: max,
    total: total,
    entries: polls,
  };
}

function Link(props: { href: string; text: string }) {
  return (
    <a target="_blank" rel="noopener noreferrer" href={props.href}>
      {props.text}
    </a>
  );
}

export function genIndices(t: CDNTweet): Array<Entity> {
  if (t == undefined) {
    return [];
  }

  // Make everything an entity
  // FIXME: Use cleaner structure
  let entities: Array<Entity> = [];

  // Get indices of all entities and add data at index
  // Note: Media urls are never included
  // 1.Urls

  const endIdx = t.text.length;
  let s = "";
  s.indexOf("hello");
  if (t.entities && t.entities.urls && t.entities.urls.length >= 1) {
    entities = entities.concat(
      t.entities.urls.map((url: IUrlsItem): UrlEntity => {
        const start = url.indices[0];
        let end = url.indices[1];

        console.log(
          end - start,
          url.url.length,
          start,
          end,
          substr2(t.text, start, end)
        );
        if (end - start != url.url.length) {
          end = start + url.url.length;
        }

        const tmp: UrlEntity = {
          type: "url",
          expanded_url: url.expanded_url,
          display_url: url.display_url,
          start: start,
          end: end,
        };

        return tmp;
      })
    );
  }

  // 2. Hashtags
  if (t.entities && t.entities.hashtags && t.entities.hashtags.length >= 1) {
    entities = entities.concat(
      t.entities.hashtags.map((hashtag: IHashtagsItem): HashtagEntity => {
        return {
          type: "hashtag",
          text: hashtag.text,
          start: hashtag.indices[0],
          end: hashtag.indices[1],
        };
      })
    );
  }

  // 3. Symbols
  if (t.entities && t.entities.symbols && t.entities.symbols.length >= 1) {
    entities = entities.concat(
      t.entities.symbols.map((symbol: ISymbolsItem): SymbolEntity => {
        return {
          type: "symbol",
          text: symbol.text,
          start: symbol.indices[0],
          end: symbol.indices[1],
        };
      })
    );
  }

  // 4. User Mentions
  if (
    t.entities &&
    t.entities.user_mentions &&
    t.entities.user_mentions.length >= 1
  ) {
    entities = entities.concat(
      t.entities.user_mentions.map(
        (user: IUserMentionsItem): UserMentionEntity => {
          return {
            type: "mention",
            screen_name: user.screen_name,
            id_str: user.id_str,
            start: user.indices[0],
            end: user.indices[1],
          };
        }
      )
    );
  }

  // 5. media Links are ignored

  // 6. plaintext Links
  // If no indices... eg: All entities are media or tweet is just plaintext
  // TODO: find examples and make tests

  // Sort Entities by starting index
  entities = entities.sort((a, b) => a.start - b.start);
  // Tweet is just text (this includes emojis) and only has non text entities eg: photos & videos
  if (
    (entities.length == 0 || entities == null) &&
    t.display_text_range !== undefined
  ) {
    // TODO: Get tweets that match this case
    return [
      {
        type: "text",
        // Safe to use javascript native substring as that's what the server uses
        text: t.text.substring(
          t.display_text_range[0],
          t.display_text_range[1]
        ),
        start: t.display_text_range[0],
        end: t.display_text_range[1],
      },
    ];
  }

  // Tweet has missing starting text and there's other text entities as well eg: urls, mentions
  // If tweet has at least one entity and the starting index is not zero
  if (entities.length > 0 && entities[0].start != 0) {
    // TODO: Check tweets without display text range value
    const start = t.display_text_range ? t.display_text_range[0] : 0;
    const end = entities[0].start;
    const text = substr2(t.text, start, end);
    const tmp: Entity = {
      type: "text",
      id: "StartingText",
      text: text,
      start: start,
      end: end,
    };
    // Add to start of entity array
    entities.unshift(tmp);
  }

  // Sort media links
  const sortedMedia =
    t.entities && t.entities.media
      ? t.entities.media?.sort((a, b) => a.indices[0] - b.indices[0])
      : undefined;

  // 2. Ending element
  // TODO: Check if using -1 makes a difference
  const lastEntity = entities.at(-1);
  if (lastEntity && lastEntity.end != endIdx) {
    // FIXME
    // if + 1 is a media entity
    const tmp: TextEntity = {
      type: "text",
      id: "final",
      text: substr2(t.text, lastEntity.end, endIdx),
      start: lastEntity.end + 1,
      end: endIdx,
    };

    // If the display_text range is wrong for the last index.
    if (
      sortedMedia != undefined &&
      lastEntity.end + 1 == sortedMedia[0].indices[0]
    ) {
      // For some reason the display_text range is wrong
      // TODO: Research
      // console.log(t)
    } else {
      entities.push(tmp);
    }
  }

  entities = entities.sort((a, b) => a.start - b.start);

  // 3. Middle elements
  const mid_entities: Array<TextEntity> = [];
  // For each entity except the last
  for (let i = 1; i < entities.length - 1; i++) {
    const cur = entities[i];
    const next = entities[i + 1];

    if (cur.end + 1 !== next.start) {
      const tmp: TextEntity = {
        type: "text",
        id: "middle",
        text: "",
        start: cur.end,
        end: next.start,
      };

      tmp.text = substr2(t.text, tmp.start, tmp.end);
      mid_entities.push(tmp);
    }
  }

  // Merge the 2 arrays, then sort the data
  // FIXME: Insert elements in place
  entities = entities.concat(mid_entities);
  entities = entities.sort((a, b) => a.start - b.start);
  return entities;
}

export function substr2(string: string, start: number, end: number) {
  return Array.from(string)
    .splice(start, end - start)
    .join("");
}

export const docSvg = (
  <svg
    viewBox="0 0 24 24"
    width="48"
    height="48"
    aria-hidden="true"
    fill="currentColor"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g>
      <path d="M14 11.25H6c-.414 0-.75.336-.75.75s.336.75.75.75h8c.414 0 .75-.336.75-.75s-.336-.75-.75-.75zm0-4H6c-.414 0-.75.336-.75.75s.336.75.75.75h8c.414 0 .75-.336.75-.75s-.336-.75-.75-.75zm-3.25 8H6c-.414 0-.75.336-.75.75s.336.75.75.75h4.75c.414 0 .75-.336.75-.75s-.336-.75-.75-.75z"></path>
      <path d="M21.5 11.25h-3.25v-7C18.25 3.01 17.24 2 16 2H4C2.76 2 1.75 3.01 1.75 4.25v15.5C1.75 20.99 2.76 22 4 22h15.5c1.517 0 2.75-1.233 2.75-2.75V12c0-.414-.336-.75-.75-.75zm-18.25 8.5V4.25c0-.413.337-.75.75-.75h12c.413 0 .75.337.75.75v15c0 .452.12.873.315 1.25H4c-.413 0-.75-.337-.75-.75zm16.25.75c-.69 0-1.25-.56-1.25-1.25v-6.5h2.5v6.5c0 .69-.56 1.25-1.25 1.25z"></path>
    </g>
  </svg>
);

export const LikeSvg = (
  <svg
    xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="currentColor"
  >
    <g>
      <path
        d="M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.58 4.646 2.73.814-1.148 2.354-2.73 4.645-2.73 2.88 0 5.404 2.69 5.404 5.755 0 6.376-7.454 13.11-10.037 13.157H12zM7.354 4.225c-2.08 0-3.903 1.988-3.903 4.255 0 5.74 7.034 11.596 8.55 11.658 1.518-.062 8.55-5.917 8.55-11.658 0-2.267-1.823-4.255-3.903-4.255-2.528 0-3.94 2.936-3.952 2.965-.23.562-1.156.562-1.387 0-.014-.03-1.425-2.965-3.954-2.965z"
        fill="currentColor"
      ></path>
    </g>
  </svg>
);

export const checkmarkSvg = (
  <svg
    class="checkmark"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewbox="0 0 24 24"
    aria-label="CheckMark Icon"
    width="24"
    height="24"
  >
    <g>
      <path
        d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"
        fill="currentColor"
      />
    </g>
  </svg>
);

export const likeSVG = <svg
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
  viewBox="0 0 24 24"
  width="24"
  height="24"
  fill="currentColor"
>
  <g>
    <path
      d="M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.58 4.646 2.73.814-1.148 2.354-2.73 4.645-2.73 2.88 0 5.404 2.69 5.404 5.755 0 6.376-7.454 13.11-10.037 13.157H12zM7.354 4.225c-2.08 0-3.903 1.988-3.903 4.255 0 5.74 7.034 11.596 8.55 11.658 1.518-.062 8.55-5.917 8.55-11.658 0-2.267-1.823-4.255-3.903-4.255-2.528 0-3.94 2.936-3.952 2.965-.23.562-1.156.562-1.387 0-.014-.03-1.425-2.965-3.954-2.965z"
      fill="currentColor"
    ></path>
  </g>
</svg>

export const retweetSvg = <svg
  width="24"
  height="24"
  fill="currentColor"
  viewBox="0 0 24 24"
  aria-hidden="true"
  class="r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1hdv0qi"
>
  <g>
    <path d="M23.77 15.67c-.292-.293-.767-.293-1.06 0l-2.22 2.22V7.65c0-2.068-1.683-3.75-3.75-3.75h-5.85c-.414 0-.75.336-.75.75s.336.75.75.75h5.85c1.24 0 2.25 1.01 2.25 2.25v10.24l-2.22-2.22c-.293-.293-.768-.293-1.06 0s-.294.768 0 1.06l3.5 3.5c.145.147.337.22.53.22s.383-.072.53-.22l3.5-3.5c.294-.292.294-.767 0-1.06zm-10.66 3.28H7.26c-1.24 0-2.25-1.01-2.25-2.25V6.46l2.22 2.22c.148.147.34.22.532.22s.384-.073.53-.22c.293-.293.293-.768 0-1.06l-3.5-3.5c-.293-.294-.768-.294-1.06 0l-3.5 3.5c-.294.292-.294.767 0 1.06s.767.293 1.06 0l2.22-2.22V16.7c0 2.068 1.683 3.75 3.75 3.75h5.85c.414 0 .75-.336.75-.75s-.337-.75-.75-.75z"></path>
  </g>
</svg>

export const commentSVG = <svg
  width="24"
  height="24"
  fill="currentColor"
  viewBox="0 0 24 24"
  aria-hidden="true"
>
  <g>
    <path d="M14.046 2.242l-4.148-.01h-.002c-4.374 0-7.8 3.427-7.8 7.802 0 4.098 3.186 7.206 7.465 7.37v3.828c0 .108.044.286.12.403.142.225.384.347.632.347.138 0 .277-.038.402-.118.264-.168 6.473-4.14 8.088-5.506 1.902-1.61 3.04-3.97 3.043-6.312v-.017c-.006-4.367-3.43-7.787-7.8-7.788zm3.787 12.972c-1.134.96-4.862 3.405-6.772 4.643V16.67c0-.414-.335-.75-.75-.75h-.396c-3.66 0-6.318-2.476-6.318-5.886 0-3.534 2.768-6.302 6.3-6.302l4.147.01h.002c3.532 0 6.3 2.766 6.302 6.296-.003 1.91-.942 3.844-2.514 5.176z"></path>
  </g>
</svg>

export const LinkSvg = <svg
  viewBox="0 0 24 24"
  aria-hidden="true"
  width="24"
  height="24"
  fill="currentColor"
>
  <g>
    <path d="M17.53 7.47l-5-5c-.293-.293-.768-.293-1.06 0l-5 5c-.294.293-.294.768 0 1.06s.767.294 1.06 0l3.72-3.72V15c0 .414.336.75.75.75s.75-.336.75-.75V4.81l3.72 3.72c.146.147.338.22.53.22s.384-.072.53-.22c.293-.293.293-.767 0-1.06z"></path>
    <path d="M19.708 21.944H4.292C3.028 21.944 2 20.916 2 19.652V14c0-.414.336-.75.75-.75s.75.336.75.75v5.652c0 .437.355.792.792.792h15.416c.437 0 .792-.355.792-.792V14c0-.414.336-.75.75-.75s.75.336.75.75v5.652c0 1.264-1.028 2.292-2.292 2.292z"></path>
  </g>
</svg>