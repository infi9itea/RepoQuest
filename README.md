# RepoQuest

**An AI-assisted guide to exploring unfamiliar codebases.**

RepoQuest turns a public GitHub repository into three guided developer quests. Each quest provides an investigation goal, actionable steps, success criteria, and links to relevant source files and GitHub issues when available.

## Features

- Generate quests from public GitHub repositories.
- Use repository metadata, README content, source-file paths, and issue evidence.
- Link quests to relevant source files and real GitHub issues.
- Support repositories with no open issues.
- Track quest progress and save workspace snapshots in the browser.

## Architecture
<img width="2240" height="940" alt="image" src="https://github.com/user-attachments/assets/06f7d95a-1184-4514-8bf7-a9586b8daecb" />


- **Frontend:** Next.js, React, TypeScript
- **Workflow orchestration:** n8n
- **Quest generation:** Google Gemini API
- **Repository evidence:** GitHub REST API

## Getting Started

1. Install Node.js and npm.
2. Install the frontend dependencies:

   ```bash
   cd frontend
   npm install
   ```

3. Configure `frontend/.env.local` with the n8n webhook URL:

   ```env
   N8N_WEBHOOK_URL=http://127.0.0.1:5678/webhook/repoquest
   ```

4. Start n8n and import the workflow from `workflows/`.
5. Configure the required GitHub and Gemini credentials in n8n.
6. Start the frontend:

   ```bash
   npm run dev
   ```

7. Open http://localhost:3000.

Use your actual n8n webhook URL if it differs from the local example.

## How it works
1. The Next.js route (`/api/generate`) validates the input: HTTPS `github.com/owner/repo` URLs only.
2. The n8n workflow fetches repository metadata, README, file paths, and recent open issues.
3. It builds a context from that evidence and asks Gemini to generate three quests.
4. The response is parsed and validated, including source-file paths, before it reaches the UI. Repos with zero open issues are handled.
5. Quest progress and workspace snapshots are stored in the browser (`localStorage`).

## Security

Keep API tokens and credentials out of source control. Configure credentials in n8n and keep local environment files untracked.

## Project Status

Working prototype. Quest quality and source-file relevance depend on the evidence available for each repository.
