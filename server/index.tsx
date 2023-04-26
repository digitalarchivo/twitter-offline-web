/** @jsx jsx */
import type CDNTweet from "../lib/types/cdnTweet.d.ts";
import { Hono } from "https://deno.land/x/hono@v3.1.3/mod.ts";
import {
  jsx,
  serveStatic,
} from "https://deno.land/x/hono@v3.1.3/middleware.ts";
import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { CdnTweetComponent, genIndices } from "./CdnTweetComponent.tsx";

const db: Record<string, CDNTweet> = JSON.parse(Deno.readTextFileSync(`server/db.json`));
const app = new Hono();

function Layout(props: { children?: string }) {
  return (
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-wi1dth, initial-scale=1.0"
        />
        <link rel="stylesheet" href="/style.css" />
        <title>Tweet Demo</title>
      </head>
      <body
        class=""
        style="font-family:sans-serif; background-color: var(--tw-bg);color:var(--tw-text)"
      >
        <button id="toggle"></button>
        <script src="/index.js"></script>
        {props.children}
      </body>
    </html>
  );
}

export function compact(n: number) {
  return n.toLocaleString("en", {
    notation: "compact",
    compactDisplay: "short",
  });
}

// Takes a tweet legacy object and returns an array of entries
// Required to render tweets from untrusted sources.
// Safer but complex compared to string replacing
// TODO: Clean this up & Make typescript happy
function chunkArr(arr: Array<any>, size: number): Array<any> {
  const result: Array<any> = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

function CDNTweetList(props: {
  db: Record<string, CDNTweet>;
  start: number;
  size: number;
}) {
  return (
    <Layout>
      <h2>CDN Tweets</h2>
      {Object.keys(props.db)
        .splice(props.start, props.size)
        .map((id) => (
          <div class="timeline chunk">
            <CdnTweetComponent layout="thread" id={id} db={props.db} />
          </div>
        ))}
    </Layout>
  );
}

app.use("/style.css", serveStatic({ path: "server/styles.css" }));
app.use("/index.js", serveStatic({ path: "server/index.js" }));

app.get("/", (c) => {
  return c.html(
    <div>
      <CDNTweetList start={0} size={50} db={db} />
      <a href="/pages/1">Next Page</a>
    </div>
  );
});

app.get("/all", (c) => {
  const chunks: Array<Array<string>> = chunkArr(
    Object.keys(db).sort((a, b) => parseInt(a) - parseInt(b)),
    200
  );
  return c.html(
    <Layout>
      {chunks.map((chunk) => (
        <div class="chunk contain timeline">
          {chunk.map((id) => (
            <CdnTweetComponent layout="thread" id={id} db={db} />
          ))}
        </div>
      ))}
    </Layout>
  );
});

app.get("/all/latest", (c) => {
  const chunks: Array<Array<string>> = chunkArr(
    Object.keys(db).sort((b, a) => parseInt(a) - parseInt(b)),
    200
  );
  return c.html(
    <Layout>
      {chunks.map((chunk) => (
        <div class="chunk contain timeline">
          {chunk.map((id) => (
            <CdnTweetComponent layout="thread" id={id} db={db} />
          ))}
        </div>
      ))}
    </Layout>
  );
});

app.get("/pages/:id", (c) => {
  const page = parseInt(c.req.param("id"));
  const size = 2;
  return c.html(
    <div>
      <div style="display:flex; width:50vw; justify-content:space-between;margin: auto">
        {page > 1 && (
          <a href={`/pages/${page - 1}`}>
            {" "}
            {"<--"} Page {page - 1}
          </a>
        )}
        <a href={`/pages/${page + 1}`}>
          Page {page + 1} {`-->`}
        </a>
      </div>
      <CDNTweetList start={page * size} size={size} db={db} />
    </div>
  );
});

app.get("/videos/", (c) => {
  let ids: string[] = [];
  // Populate ids to tweets with a 'video' key in the object
  // TODO: Make proper typescript types for the video
  Object.keys(db).map((d) => {
    const tweet = db[d];
    if (tweet.video != undefined) {
      ids.push(d);
    }
  });

  // Sorts videos by length
  ids = ids.sort(
    (a, b) => (db[a].video?.durationMs || 1) - (db[b].video?.durationMs || 1)
  );

  return c.html(
    <Layout>
      <pre>{JSON.stringify(ids)}</pre>
      {ids.map((id) => (
        <CdnTweetComponent layout="thread" id={id} db={db} />
      ))}
    </Layout>
  );
});


app.get("/photos/", (c) => {
  let ids: string[] = [];
  // Populate ids to tweets with a 'video' key in the object
  // TODO: Make proper typescript types for the video
  Object.keys(db).map((d) => {
    const tweet = db[d];
    if (tweet.photos != undefined) {
      ids.push(d);
    }
  });

  return c.html(
    <Layout>
      <pre>{JSON.stringify(ids)}</pre>
      {ids.map((id) => (
        <CdnTweetComponent layout="thread" id={id} db={db} />
      ))}
    </Layout>
  );
});


app.get("/status/:id/entities", (c) => {
  const id = c.req.param("id");
  if (db[id] == undefined) {
    return c.html("not in db");
  }
  const tweet = db[id];
  return c.text(JSON.stringify(genIndices(tweet), null, "  "));
});

app.get("/status/:id/json", (c) => {
  const id = c.req.param("id");
  if (db[id] == undefined) {
    return c.html("not in db");
  }
  const tweet = db[id];
  return c.text(JSON.stringify(tweet, null, "  "));
});

app.get("/status/:id/debug", (c) => {
  const id = c.req.param("id");
  if (db[id] == undefined) {
    return c.html("not in db");
  }
  const tweet = db[id];
  return c.html(
    <Layout>
      <CdnTweetComponent layout="focus" id={id} db={db} />
      {/* Show json */}
      <pre>{JSON.stringify(tweet, null, "  ")}</pre>
    </Layout>
  );
});

app.get("/status/:id", (c) => {
  const id = c.req.param("id");
  const tweet = db[id];

  if (!tweet) return c.html("not in db");

  return c.html(
    <Layout>
      <CdnTweetComponent layout="thread" id={id} db={db} />
    </Layout>
  );
});

app.use("/cdn/*", serveStatic({ root: "./" }));

serve(app.fetch);
