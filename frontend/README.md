# RepoQuest

RepoQuest is an AI-assisted open-source code exploration tool. It turns public GitHub repositories into structured developer quests, helping developers investigate real issues and understand unfamiliar codebases.

## How It Works

1. Enter a public GitHub repository URL.
2. The Next.js frontend sends the request to an n8n webhook.
3. n8n retrieves repository metadata, README content, open issues, and a source-file index.
4. Google Gemini generates three investigation quests.
5. The workflow validates issue references and filters suggested file paths against the retrieved file index.
6. The frontend displays quests, issue links, relevant source files, and progress tracking.

The source-file index contains paths and file sizes, not the complete source code. Developers should inspect files before drawing conclusions about their implementation.

## Technology Stack

- Next.js and React
- TypeScript
- n8n workflow automation
- GitHub API
- Google Gemini
- Browser local storage

## Prerequisites

- Node.js and npm
- A running n8n instance
- GitHub and Gemini credentials configured in n8n
- The RepoQuest workflow imported into n8n

The workflow export is located at `workflows/IQLnu9kBvNN68i0s.json`.

Configure the production webhook path as `repoquest` and ensure the frontend's webhook URL points to your n8n instance.

## Run Locally

From the repository root:

```bash
cd frontend
npm install
npm run dev
```

Open the forwarded port for the Next.js development server, usually port 3000.

## Configuration

Create `frontend/.env.local` and configure the webhook URL for your environment. For the local setup:

`N8N_WEBHOOK_URL=http://127.0.0.1:5678/webhook/repoquest`

Restart the frontend after changing environment variables. Never commit API keys, access tokens, or other secrets.

## Features

- Repository metadata and summary
- AI-generated investigation quests
- Difficulty filtering
- GitHub issue evidence links
- Clickable source-file links
- Quest progress tracking
- Knowledge checks for sample quests
- Saved workspace history

## Limitations

Quest quality depends on available repository evidence. File-path validation confirms that suggested paths appear in the retrieved index, but does not prove that a file implements the behavior described by the model. Progress and saved history are stored in the current browser.
