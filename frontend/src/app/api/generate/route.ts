
export async function POST(request: Request) {
  // 1. Parse and validate the incoming JSON.
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("repository" in body) ||
    typeof body.repository !== "string"
  ) {
    return Response.json(
      { error: "Provide a repository URL in the repository field." },
      { status: 400 },
    );
  }

  const input = body.repository.trim();

  // 2. Accept only HTTPS GitHub repository URLs.
  let parsed: URL;

  try {
    parsed = new URL(input);
  } catch {
    return Response.json(
      { error: "The repository URL is invalid." },
      { status: 400 },
    );
  }

  const segments = parsed.pathname.split("/").filter(Boolean);

  if (
    parsed.protocol !== "https:" ||
    parsed.hostname.toLowerCase() !== "github.com" ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    segments.length !== 2
  ) {
    return Response.json(
      {
        error:
          "Use a GitHub repository URL, such as https://github.com/vercel/next.js.",
      },
      { status: 400 },
    );
  }

  const [owner, rawRepo] = segments;
  const repo = rawRepo.replace(/\.git$/i, "");

  if (
    !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(owner) ||
    !/^[A-Za-z0-9._-]{1,100}$/.test(repo) ||
    repo === "." ||
    repo === ".."
  ) {
    return Response.json(
      { error: "The GitHub owner or repository name is invalid." },
      { status: 400 },
    );
  }

  // 3. Read the n8n endpoint from server-side configuration.
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    return Response.json(
      { error: "The n8n webhook URL has not been configured." },
      { status: 500 },
    );
  }

  const repository = `https://github.com/${owner}/${repo}`;

  // 4. Forward the request to our n8n workflow.
  try {
    const upstream = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ repository }),
      cache: "no-store",
      signal: AbortSignal.timeout(120_000),
    });

    const raw = await upstream.text();

    let result: unknown;

    try {
      result = JSON.parse(raw);
    } catch {
      return Response.json(
        { error: "The automation service returned invalid JSON." },
        { status: 502 },
      );
    }

    if (!upstream.ok) {
      return Response.json(
        {
          error: `The automation service returned HTTP ${upstream.status}.`,
        },
        { status: 502 },
      );
    }

    // 5. Ensure we received the shape the frontend needs.
    if (
      !result ||
      typeof result !== "object" ||
      !("quests" in result) ||
      !Array.isArray(result.quests)
    ) {
      return Response.json(
        { error: "The automation service returned an unexpected result." },
        { status: 502 },
      );
    }

    return Response.json(result);
  } catch (error) {
    const timedOut =
      error instanceof Error && error.name === "TimeoutError";

    return Response.json(
      {
        error: timedOut
          ? "Quest generation took too long. Please try again."
          : "Could not reach n8n. Check that the workflow is running.",
      },
      { status: timedOut ? 504 : 502 },
    );
  }
}