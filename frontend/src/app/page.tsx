"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

type View = "workspace" | "repository" | "history";
type Difficulty = "Beginner" | "Intermediate" | "Advanced";
type QuestStatus = "planned" | "in-progress" | "completed";

type Issue = {
  number: number;
  title: string;
  url: string;
  label: string;
  updated?: string;
  comments?: number;
};

type Quest = {
  id: string;
  index: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  goal: string;
  whyItMatters: string;
  steps: string[];
  successCriteria: string[];
  issue: Issue | null;
  relevantFilePaths?: string[];
  challenge?: {
    question: string;
    options: string[];
    answer: number;
    explanation: string;
  };
};

type SavedRun = {
  id: string;
  repository: string;
  url: string;
  createdAt: string;
  questTitles: string[];
};



type GenerateApiResponse = {
  error?: string;
  repository: {
    name: string;
    fullName: string;
    description: string;
    url: string;
    language: string;
    stars: number;
    openIssues: number;
    defaultBranch: string;
    topics: string[];
  };
  repoSummary?: string;
  quests: Array<{
    title: string;
    difficulty: Difficulty;
    goal: string;
    whyItMatters: string;
    steps: string[];
    successCriteria: string[];
    relevantFilePaths?: string[];
    evidenceIssues?: Array<{
      number: number;
      title: string;
      url: string;
    }>;
  }>;
  generation?: {
    model?: string;
    finishReason?: string;
  };
};


const REPOSITORY = {
  name: "next.js",
  fullName: "vercel/next.js",
  description: "The React Framework",
  url: "https://github.com/vercel/next.js",
  language: "JavaScript",
  stars: 143260,
  openIssues: 3674,
  defaultBranch: "canary",
  topics: [
    "react",
    "compiler",
    "browser",
    "server-rendering",
    "static-site-generator",
    "nextjs",
    "vercel",
  ],
};

const ISSUES: Issue[] = [
  {
    number: 100179,
    title:
      "next/image: every cache HIT waits for the full disk-LRU scan after server start",
    url: "https://github.com/vercel/next.js/issues/100179",
    label: "Image optimization",
    updated: "Oct 14, 2026",
    comments: 0,
  },
  {
    number: 99983,
    title:
      "`next dev` retains heap on every App Router render",
    url: "https://github.com/vercel/next.js/issues/99983",
    label: "Performance",
    updated: "Oct 14, 2026",
    comments: 2,
  },
  {
    number: 99988,
    title:
      "Segment cache: unbounded re-prefetch loop for raw-colon routes",
    url: "https://github.com/vercel/next.js/issues/99988",
    label: "Routing",
    updated: "Oct 14, 2026",
    comments: 2,
  },
  {
    number: 100173,
    title:
      "Self-hosting cacheHandler example is an unbounded in-memory cache",
    url: "https://github.com/vercel/next.js/issues/100173",
    label: "Documentation",
    updated: "Oct 14, 2026",
    comments: 0,
  },
  {
    number: 99683,
    title: "next/image optimizer ignores HTTP(S)_PROXY",
    url: "https://github.com/vercel/next.js/issues/99683",
    label: "Networking",
    updated: "Oct 14, 2026",
    comments: 1,
  },
];

const QUESTS: Quest[] = [
  {
    id: "disk-lru",
    index: "01",
    title: "The cache that held the door",
    category: "PERFORMANCE INVESTIGATION",
    difficulty: "Advanced",
    goal:
      "Investigate why image-cache hits can wait for a full disk-LRU scan after the server starts.",
    whyItMatters:
      "A persisted cache containing thousands of files can turn an otherwise fast cache hit into a long request stall. This quest explores the trade-offs between startup work and serving requests quickly.",
    steps: [
      "Read the issue and follow its reproduction link to understand the reported behaviour.",
      "Locate the server-side image-cache and disk-LRU initialization code.",
      "Trace the startup sequence and determine when a cache hit must wait for the scan.",
      "Sketch an alternative that defers or reduces the blocking work.",
    ],
    successCriteria: [
      "Identify the code responsible for the disk-cache scan.",
      "Explain why the scan delays cache hits.",
      "Describe a test that would measure whether a proposed change improves startup latency.",
    ],
    issue: ISSUES[0],
    challenge: {
      question:
        "What is the central performance problem described in this issue?",
      options: [
        "Every image must be downloaded again after a restart.",
        "Cache-hit requests wait for the disk-LRU scan to finish.",
        "The server uses the wrong Git branch.",
      ],
      answer: 1,
      explanation:
        "The report says initial image requests can be blocked until the persisted image-cache directory has been scanned.",
    },
  },
  {
    id: "heap-growth",
    index: "02",
    title: "Where did the heap go?",
    category: "MEMORY & DEBUGGING",
    difficulty: "Advanced",
    goal:
      "Investigate reported linear heap growth across App Router renders in the development server.",
    whyItMatters:
      "Understanding retained memory helps developers diagnose slow-growing processes, costly restarts and possible memory leaks.",
    steps: [
      "Read the issue and inspect its reproduction repository.",
      "Understand how the provided probe compares memory before and after forced garbage collection.",
      "Compare the static and dynamic render cases described in the report.",
      "Form a hypothesis about which references remain reachable and design a way to test it.",
    ],
    successCriteria: [
      "Explain what the reproduction measures and what it does not prove.",
      "Identify promising parts of the render lifecycle to investigate.",
      "Propose a repeatable experiment for comparing memory retention.",
    ],
    issue: ISSUES[1],
    challenge: {
      question:
        "If heap usage remains elevated after forced garbage collection, what is a useful next question?",
      options: [
        "Which objects or references are still reachable?",
        "Which CSS colour does the application use?",
        "How many stars does the repository have?",
      ],
      answer: 0,
      explanation:
        "A heap snapshot and retainer analysis can help identify objects that remain reachable after garbage collection.",
    },
  },
  {
    id: "segment-cache",
    index: "03",
    title: "The route that never stops asking",
    category: "ROUTING & CACHING",
    difficulty: "Intermediate",
    goal:
      "Trace the reported repeated prefetch requests associated with raw colons in dynamic route segments.",
    whyItMatters:
      "Unexpected repeated requests can waste bandwidth and server capacity. Reproducing the behaviour is the first step towards understanding it.",
    steps: [
      "Read the issue and inspect its reproduction repository.",
      "Compare the raw-colon route examples with the encoded control case.",
      "Trace the relevant route matching and segment-cache behaviour.",
      "Design a small regression test that checks whether unnecessary prefetching stops.",
    ],
    successCriteria: [
      "Explain the reported difference between the failing case and its control.",
      "Identify the relevant code path or paths to investigate.",
      "Define a repeatable test for detecting repeated prefetch requests.",
    ],
    issue: ISSUES[2],
    challenge: {
      question:
        "What comparison is most useful when investigating this report?",
      options: [
        "Compare two unrelated repositories.",
        "Compare a raw-colon route with the encoded control case.",
        "Compare the number of repository stars each day.",
      ],
      answer: 1,
      explanation:
        "A controlled comparison helps narrow the investigation to the route-segment encoding difference reported in the issue.",
    },
  },
];

const PROGRESS_KEY = "repoquest-progress-v1";
const HISTORY_KEY = "repoquest-history-v1";

const statusLabels: Record<QuestStatus, string> = {
  planned: "Planned",
  "in-progress": "In progress",
  completed: "Completed",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Home() {
  const [activeView, setActiveView] = useState<View>("workspace");
  const [activeQuestId, setActiveQuestId] = useState(QUESTS[0].id);
  const [repositoryUrl, setRepositoryUrl] = useState(REPOSITORY.url);
  const [difficultyFilter, setDifficultyFilter] = useState("All levels");
  const [issueSearch, setIssueSearch] = useState("");
  const [progress, setProgress] = useState<Record<string, QuestStatus>>({});
  const [savedRuns, setSavedRuns] = useState<SavedRun[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [checkedQuests, setCheckedQuests] = useState<Record<string, boolean>>(
    {},
  );
  const [notice, setNotice] = useState("");
  const [repoData, setRepoData] = useState(REPOSITORY);
  const [issueData, setIssueData] = useState<Issue[]>(ISSUES);
  const [questData, setQuestData] = useState<Quest[]>(QUESTS);
  const [repoSummary, setRepoSummary] = useState(REPOSITORY.description);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedProgress = localStorage.getItem(PROGRESS_KEY);
      const storedHistory = localStorage.getItem(HISTORY_KEY);

      if (storedProgress) {
        setProgress(JSON.parse(storedProgress) as Record<string, QuestStatus>);
      }

      if (storedHistory) {
        setSavedRuns(JSON.parse(storedHistory) as SavedRun[]);
      }
    } catch {
      // Ignore invalid local browser data and keep the default workspace.
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
      localStorage.setItem(HISTORY_KEY, JSON.stringify(savedRuns));
    } catch {
      setNotice("Browser storage is unavailable. Progress may not persist.");
    }
  }, [isHydrated, progress, savedRuns]);

  const filteredQuests = useMemo(() => {
    return questData.filter(
      (quest) =>
        difficultyFilter === "All levels" ||
        quest.difficulty === difficultyFilter,
    );
  }, [difficultyFilter, questData]);

  const selectedQuest =
    filteredQuests.find((quest) => quest.id === activeQuestId) ??
    filteredQuests[0];

  const selectedChallenge = selectedQuest?.challenge;

  const visibleIssues = useMemo(() => {
    const term = issueSearch.trim().toLowerCase();

    if (!term) return issueData;

    return issueData.filter((issue) =>
      `${issue.number} ${issue.title} ${issue.label}`
        .toLowerCase()
        .includes(term),
    );
  }, [issueSearch, issueData]);

  const completedCount = questData.filter(
    (quest) => progress[quest.id] === "completed",
  ).length;

  const progressPercent = Math.round(
    (completedCount / questData.length) * 100,
  );

  function setQuestStatus(id: string, status: QuestStatus) {
    setProgress((current) => ({ ...current, [id]: status }));
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const input = repositoryUrl.trim();
    const isGitHubRepository =
      /^https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9._-]+\/?$/.test(input);

    if (!isGitHubRepository) {
      setNotice(
        "Enter a repository URL in the format https://github.com/owner/repository.",
      );
      return;
    }

    setIsGenerating(true);
    setNotice("Generating quests from repository evidence...");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repository: input }),
      });

      const data = (await response.json()) as GenerateApiResponse;

      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status}).`);
      }

      if (
        !data.repository ||
        !Array.isArray(data.quests) ||
        data.quests.length === 0
      ) {
        throw new Error("The workflow returned no quests. Try another repository.");
      }

      const mappedQuests: Quest[] = data.quests.map((generated, index) => {
        const evidence = generated.evidenceIssues?.[0];

        const issue: Issue | null = evidence
          ? {
              number: evidence.number,
              title: evidence.title,
              url: evidence.url,
              label: "Evidence issue",
            }
          : null;

        const id =
          `${data.repository.fullName}-${evidence?.number ?? index + 1}-${index + 1}`
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, "-");

        return {
          id,
          index: String(index + 1).padStart(2, "0"),
          title: generated.title,
          category: evidence ? "ISSUE INVESTIGATION" : "REPOSITORY ORIENTATION",
          difficulty: generated.difficulty,
          goal: generated.goal,
          whyItMatters: generated.whyItMatters,
          steps: generated.steps,
          successCriteria: generated.successCriteria,
          issue,
          relevantFilePaths: Array.isArray(generated.relevantFilePaths)
            ? generated.relevantFilePaths.filter(
                (path): path is string => typeof path === "string",
              )
            : [],
        };
      });

      setRepoData(data.repository);
      setRepoSummary(data.repoSummary || data.repository.description);
      setQuestData(mappedQuests);
      setIssueData(mappedQuests.flatMap((quest) => quest.issue ? [quest.issue] : []));
      setActiveQuestId(mappedQuests[0].id);
      setDifficultyFilter("All levels");
      setIssueSearch("");
      setQuizAnswers({});
      setCheckedQuests({});
      setActiveView("workspace");
      setNotice(
        `Generated ${mappedQuests.length} quests for ${data.repository.fullName}.`,
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? `Generation failed: ${error.message}`
          : "Generation failed. Check the frontend and n8n logs.",
      );
    } finally {
      setIsGenerating(false);
    }
  }
  function handleSaveRun() {
    const record: SavedRun = {
      id: `${Date.now()}`,
      repository: repoData.fullName,
      url: repositoryUrl.trim() || repoData.url,
      createdAt: new Date().toISOString(),
      questTitles: questData.map((quest) => quest.title),
    };

    setSavedRuns((current) => [record, ...current]);
    setNotice("Workspace snapshot saved in this browser.");
  }

  function handleCheckAnswer() {
    if (!selectedQuest || quizAnswers[selectedQuest.id] === undefined) {
      return;
    }

    setCheckedQuests((current) => ({
      ...current,
      [selectedQuest.id]: true,
    }));
  }

  function handleTryAgain() {
    if (!selectedQuest) return;

    setQuizAnswers((current) => {
      const next = { ...current };
      delete next[selectedQuest.id];
      return next;
    });

    setCheckedQuests((current) => ({
      ...current,
      [selectedQuest.id]: false,
    }));
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href="#home"
          onClick={(event) => {
            event.preventDefault();
            setActiveView("workspace");
          }}
        >
          <span className="brand-mark">rq.</span>
          <span className="brand-copy">
            <strong>RepoQuest</strong>
            <span>Open-source field guide</span>
          </span>
        </a>

        <div className="topbar-meta">
          <span className="demo-status">
            <span className="status-dot" />
            N8N / LIVE WORKFLOW
          </span>
          <span className="topbar-divider" />
          <span className="issue-count-top">VOL. 01 / CODE EXPLORATION</span>
        </div>
      </header>

      <div className="app-layout">
        <aside className="sidebar">
          <div className="side-heading">YOUR WORKSPACE</div>

          <nav className="side-nav" aria-label="Main navigation">
            <button
              className={`nav-item ${activeView === "workspace" ? "active" : ""}`}
              onClick={() => setActiveView("workspace")}
            >
              <span className="nav-symbol">01</span>
              <span>Questline</span>
              <span className="nav-end">{completedCount}/{questData.length}</span>
            </button>

            <button
              className={`nav-item ${activeView === "repository" ? "active" : ""}`}
              onClick={() => setActiveView("repository")}
            >
              <span className="nav-symbol">02</span>
              <span>Repository</span>
            </button>

            <button
              className={`nav-item ${activeView === "history" ? "active" : ""}`}
              onClick={() => setActiveView("history")}
            >
              <span className="nav-symbol">03</span>
              <span>Saved history</span>
              <span className="nav-end">{savedRuns.length}</span>
            </button>
          </nav>

          <div className="sidebar-bottom">
            <div className="side-heading">YOUR FIELD NOTES</div>
            <div className="progress-card">
              <div className="progress-card-head">
                <span>Quest progress</span>
                <strong>{progressPercent}%</strong>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-label="Quest completion"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p>
                {completedCount === questData.length
                  ? "All missions completed."
                  : `${questData.length - completedCount} discoveries remain.`}
              </p>
            </div>

            <div className="sidebar-note">
              <span className="note-number">NOTE 001</span>
              <p>
                Read the evidence.
                <br />
                Follow the code.
                <br />
                Test your theory.
              </p>
            </div>
          </div>

          <div className="sidebar-footer">
            <span>BUILT FOR THE CURIOUS</span>
            <span>RQ / 2026</span>
          </div>
        </aside>

        <section className="main-column" id="home">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                OPEN-SOURCE RESEARCH <span>/</span> FIELD GUIDE 001
              </div>
              <h1>
                A map through
                <br />
                unfamiliar <em>code.</em>
              </h1>
              <p className="hero-subtitle">
                Find your way into a codebase. Follow real issues, form
                hypotheses, and learn by investigating.
              </p>
            </div>
            <div className="edition-stamp" aria-label="Preview edition">
              <span>THE</span>
              <strong>RQ</strong>
              <span>EDITION</span>
              <span className="stamp-line" />
              <span>NO. 001</span>
            </div>
          </div>

          <section className="repository-form-card">
            <div className="form-card-top">
              <label htmlFor="repository-url">REPOSITORY TO EXPLORE</label>
              <span className="tiny-label">GITHUB / PUBLIC REPOS</span>
            </div>

            <form className="repo-form" onSubmit={handleGenerate}>
              <span className="input-prefix" aria-hidden="true">
                ↗
              </span>
              <input
                id="repository-url"
                value={repositoryUrl}
                onChange={(event) => setRepositoryUrl(event.target.value)}
                placeholder="https://github.com/owner/repository"
                autoComplete="url"
                spellCheck={false}
              />
              <button className="primary-button" type="submit" disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Generate questline"}
                <span aria-hidden="true">{isGenerating ? "…" : "↗"}</span>
              </button>
            </form>

            <div className="form-card-foot">
              <span>
                <span className="status-dot" /> n8n workflow ready
              </span>
              <span>LIVE GENERATION / n8n</span>
            </div>
          </section>

          {notice && (
            <div className="notice" role="status">
              <span className="notice-mark">i</span>
              <p>{notice}</p>
              <button
                type="button"
                className="notice-close"
                onClick={() => setNotice("")}
                aria-label="Dismiss message"
              >
                ×
              </button>
            </div>
          )}

          <section className="repo-overview">
            <div className="repo-identity">
              <div className="repo-monogram">{repoData.name.slice(0, 1).toUpperCase()}.</div>
              <div>
                <div className="repo-owner">{repoData.fullName}</div>
                <h2>{repoData.description}</h2>
                <p className="repo-summary">{repoSummary}</p>
                <a
                  href={repoData.url}
                  className="text-link"
                  target="_blank"
                  rel="noreferrer"
                >
                  View on GitHub <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>

            <div className="repo-stats">
              <div className="stat">
                <span>STARS</span>
                <strong>{repoData.stars.toLocaleString()}</strong>
              </div>
              <div className="stat">
                <span>OPEN ISSUES</span>
                <strong>{repoData.openIssues.toLocaleString()}</strong>
              </div>
              <div className="stat">
                <span>LANGUAGE</span>
                <strong>{repoData.language}</strong>
              </div>
              <div className="stat">
                <span>DEFAULT BRANCH</span>
                <strong>{repoData.defaultBranch}</strong>
              </div>
            </div>
          </section>

          <div className="workspace-heading">
            <div>
              <div className="eyebrow">YOUR INVESTIGATION</div>
              <h2>
                {activeView === "workspace"
                  ? "Questline"
                  : activeView === "repository"
                    ? "Repository explorer"
                    : "Saved field notes"}
              </h2>
            </div>

            {activeView === "workspace" && (
              <div className="workspace-actions">
                <label className="select-wrap">
                  <span className="sr-only">Filter quests by difficulty</span>
                  <select
                    value={difficultyFilter}
                    onChange={(event) => {
                      setDifficultyFilter(event.target.value);
                    }}
                  >
                    <option>All levels</option>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </label>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleSaveRun}
                >
                  Save snapshot <span aria-hidden="true">＋</span>
                </button>
              </div>
            )}
          </div>

          {activeView === "workspace" && (
            <div className="workbench">
              <section className="quest-list-panel">
                <div className="panel-heading">
                  <span>MISSIONS / {filteredQuests.length}</span>
                  <span className="panel-index">INDEX</span>
                </div>

                {filteredQuests.length === 0 ? (
                  <div className="empty-state">
                    <span>NO MISSIONS FOUND</span>
                    <p>Try a different difficulty filter.</p>
                  </div>
                ) : (
                  <div className="quest-list">
                    {filteredQuests.map((quest) => {
                      const active = selectedQuest?.id === quest.id;
                      const status = progress[quest.id] ?? "planned";

                      return (
                        <button
                          type="button"
                          key={quest.id}
                          className={`quest-card ${active ? "selected" : ""}`}
                          onClick={() => setActiveQuestId(quest.id)}
                          aria-pressed={active}
                        >
                          <div className="quest-card-top">
                            <span className="quest-number">
                              {quest.index}
                            </span>
                            <span className={`status-pill status-${status}`}>
                              {statusLabels[status]}
                            </span>
                          </div>

                          <div className="quest-category">{quest.category}</div>
                          <h3>{quest.title}</h3>
                          <p>{quest.goal}</p>

                          <div className="quest-card-bottom">
                            <span
                              className={`difficulty difficulty-${quest.difficulty.toLowerCase()}`}
                            >
                              {quest.difficulty}
                            </span>
                            <span className="quest-arrow" aria-hidden="true">
                              ↗
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="panel-footer">
                  <span>GENERATED FROM REPOSITORY EVIDENCE</span>
                  <span>{String(questData.length).padStart(2, "0")} MISSIONS</span>
                </div>
              </section>

              {selectedQuest ? (
                <section className="quest-detail-panel">
                  <div className="detail-topline">
                    <span>
                      QUEST / {selectedQuest.index} OF {questData.length}
                    </span>
                    <span
                      className={`difficulty difficulty-${selectedQuest.difficulty.toLowerCase()}`}
                    >
                      {selectedQuest.difficulty}
                    </span>
                  </div>

                  <div className="detail-title">
                    <div className="eyebrow">{selectedQuest.category}</div>
                    <h3>{selectedQuest.title}</h3>
                    <p>{selectedQuest.goal}</p>
                  </div>

                  <div className="detail-section">
                    <div className="section-label">
                      <span>01</span> WHY THIS MATTERS
                    </div>
                    <p className="body-copy">{selectedQuest.whyItMatters}</p>
                  </div>

                  <div className="detail-section">
                    <div className="section-label">
                      <span>02</span> THE INVESTIGATION
                    </div>
                    <ol className="steps-list">
                      {selectedQuest.steps.map((step, index) => (
                        <li key={step}>
                          <span className="step-index">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                      {selectedQuest.relevantFilePaths &&
  selectedQuest.relevantFilePaths.length > 0 && (
    <div className="detail-section">
      <div className="section-label">
        <span>03</span> SOURCE FILES TO EXPLORE
      </div>

      <p className="body-copy">
        These files were matched against the repository file index.
        Open them to inspect the actual implementation before drawing
        conclusions.
      </p>

      <div className="source-file-list">
        {selectedQuest.relevantFilePaths.map((filePath) => {
          const repositoryUrl = repoData.url.replace(/\/+$/, "");

          const encodedBranch = repoData.defaultBranch
            .split("/")
            .map(encodeURIComponent)
            .join("/");

          const encodedFilePath = filePath
            .split("/")
            .map(encodeURIComponent)
            .join("/");

          const fileUrl =
            `${repositoryUrl}/blob/${encodedBranch}/${encodedFilePath}`;

          return (
            <a
              className="source-file-link"
              href={fileUrl}
              key={filePath}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="source-file-icon" aria-hidden="true">
                ↗
              </span>

              <code>{filePath}</code>

              <span className="source-file-open">
                OPEN FILE ↗
              </span>
            </a>
          );
        })}
      </div>
    </div>
  )}
                  <div className="detail-section">
                    <div className="section-label">
<span>04</span> WHAT SUCCESS LOOKS LIKE
                    </div>
                    <ul className="criteria-list">
                      {selectedQuest.successCriteria.map((criterion) => (
                        <li key={criterion}>
                          <span aria-hidden="true">✓</span>
                          {criterion}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {selectedQuest.issue ? (
                  <a
                    className="evidence-card"
                    href={selectedQuest.issue.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="evidence-symbol">↗</div>
                    <div className="evidence-copy">
                      <span>PRIMARY SOURCE / ISSUE #{selectedQuest.issue.number}</span>
                      <strong>{selectedQuest.issue.title}</strong>
                    </div>
                    <span className="evidence-link">OPEN ISSUE ↗</span>
                  </a>
                ) : (
                  <div className="evidence-card" role="note">
                    <div className="evidence-symbol">↗</div>
                    <div className="evidence-copy">
                      <span>REPOSITORY-LEVEL QUEST</span>
                      <strong>No linked GitHub issue is available for this quest.</strong>
                    </div>
                    <span className="evidence-link">NO ISSUE LINK</span>
                  </div>
                )}

                  {selectedChallenge && (
                    <div className="detail-section challenge-section">
                    <div className="section-label">
<span>05</span> CHECK YOUR UNDERSTANDING
                    </div>

                    <div className="challenge-card">
                      <div className="challenge-heading">
                        <span>FIELD TEST / 01</span>
                        <span>KNOWLEDGE CHECK</span>
                      </div>
                      <h4>{selectedChallenge.question}</h4>

                      <div className="answer-options">
                        {selectedChallenge.options.map(
                          (option, index) => {
                            const chosen =
                              quizAnswers[selectedQuest.id] === index;
                            const checked = checkedQuests[selectedQuest.id];
                            const correct =
                              selectedChallenge.answer === index;

                            let className = "answer-option";
                            if (chosen) className += " chosen";
                            if (checked && correct) className += " answer-correct";
                            if (checked && chosen && !correct) {
                              className += " answer-wrong";
                            }

                            return (
                              <button
                                type="button"
                                className={className}
                                key={option}
                                onClick={() => {
                                  setQuizAnswers((current) => ({
                                    ...current,
                                    [selectedQuest.id]: index,
                                  }));
                                  setCheckedQuests((current) => ({
                                    ...current,
                                    [selectedQuest.id]: false,
                                  }));
                                }}
                                aria-pressed={chosen}
                              >
                                <span className="answer-letter">
                                  {String.fromCharCode(65 + index)}
                                </span>
                                <span>{option}</span>
                              </button>
                            );
                          },
                        )}
                      </div>

                      {checkedQuests[selectedQuest.id] && (
                        <div
                          className={`answer-feedback ${
                            quizAnswers[selectedQuest.id] ===
                            selectedChallenge.answer
                              ? "feedback-correct"
                              : "feedback-wrong"
                          }`}
                          role="status"
                        >
                          <strong>
                            {quizAnswers[selectedQuest.id] ===
                            selectedChallenge.answer
                              ? "Correct."
                              : "Not quite yet."}
                          </strong>
                          <p>{selectedChallenge.explanation}</p>
                        </div>
                      )}

                      <div className="challenge-actions">
                        <span>TEST YOUR UNDERSTANDING</span>
                        {checkedQuests[selectedQuest.id] ? (
                          <button
                            type="button"
                            className="text-button"
                            onClick={handleTryAgain}
                          >
                            Try again ↻
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="dark-button"
                            disabled={
                              quizAnswers[selectedQuest.id] === undefined
                            }
                            onClick={handleCheckAnswer}
                          >
                            Check answer <span aria-hidden="true">→</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  )}

                  <div className="detail-status-row">
                    <div>
                      <div className="section-label">MISSION STATUS</div>
                      <p>Track your progress as you investigate.</p>
                    </div>
                    <label className="select-wrap status-select">
                      <span className="sr-only">Update quest status</span>
                      <select
                        value={progress[selectedQuest.id] ?? "planned"}
                        onChange={(event) =>
                          setQuestStatus(
                            selectedQuest.id,
                            event.target.value as QuestStatus,
                          )
                        }
                      >
                        <option value="planned">Planned</option>
                        <option value="in-progress">In progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </label>
                  </div>
                </section>
              ) : (
                <div className="empty-state">
                  <span>NO QUEST SELECTED</span>
                  <p>Choose a quest or change the difficulty filter.</p>
                </div>
              )}
            </div>
          )}

          {activeView === "repository" && (
            <section className="repository-explorer">
              <div className="explorer-intro">
                <div className="repo-monogram large">{repoData.name.slice(0, 1).toUpperCase()}.</div>
                <div>
                  <div className="eyebrow">REPOSITORY / INDEX</div>
                  <h3>{repoData.fullName}</h3>
                  <p>{repoData.description}</p>
                  <a
                    className="text-link"
                    href={repoData.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Browse source on GitHub ↗
                  </a>
                </div>
              </div>

              <div className="topic-row">
                {repoData.topics.map((topic) => (
                  <span className="topic-tag" key={topic}>
                    {topic}
                  </span>
                ))}
              </div>

              <div className="panel-heading issue-list-heading">
                <span>QUEST EVIDENCE / LINKED ISSUES</span>
                <span>{issueData.length} RECORDS</span>
              </div>

              <label className="issue-search">
                <span aria-hidden="true">⌕</span>
                <span className="sr-only">Search retrieved issues</span>
                <input
                  value={issueSearch}
                  onChange={(event) => setIssueSearch(event.target.value)}
                  placeholder="Search by title, number or label..."
                />
              </label>

              <div className="issue-list">
                {visibleIssues.map((issue) => (
                  <a
                    className="issue-row"
                    key={issue.number}
                    href={issue.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="issue-hash">#{issue.number}</div>
                    <div className="issue-row-main">
                      <strong>{issue.title}</strong>
                      <span>
                        {issue.label} · {issue.updated ? `Updated ${issue.updated}` : 'Quest evidence'}
                      </span>
                    </div>
                    <span className="issue-comments">
                      {issue.comments === undefined ? 'COUNT N/A' : `${issue.comments} comments`}
                    </span>
                    <span className="issue-open" aria-hidden="true">
                      ↗
                    </span>
                  </a>
                ))}

                {visibleIssues.length === 0 && (
                  <div className="empty-state">
                    <span>NO MATCHES</span>
                    <p>Try another search term.</p>
                  </div>
                )}
              </div>

              <p className="data-note">
                These are the evidence issues attached to the quests generated
                for the currently selected repository.
              </p>
            </section>
          )}

          {activeView === "history" && (
            <section className="history-view">
              <div className="history-intro">
                <span className="eyebrow">PERSONAL ARCHIVE</span>
                <h3>Keep a record of what you explore.</h3>
                <p>
                  Save a workspace snapshot before moving to your next
                  investigation.
                </p>
              </div>

              {savedRuns.length === 0 ? (
                <div className="history-empty">
                  <span className="history-empty-number">— 001 —</span>
                  <h4>Your field notes begin here.</h4>
                  <p>
                    Return to Questline and select <strong>Save snapshot</strong>{" "}
                    to keep a record of this current workspace.
                  </p>
                  <button
                    type="button"
                    className="dark-button"
                    onClick={() => setActiveView("workspace")}
                  >
                    Return to questline →
                  </button>
                </div>
              ) : (
                <div className="history-list">
                  {savedRuns.map((run, index) => (
                    <article className="history-item" key={run.id}>
                      <div className="history-item-index">
                        {String(savedRuns.length - index).padStart(2, "0")}
                      </div>
                      <div className="history-item-main">
                        <span className="eyebrow">
                          SAVED {formatDate(run.createdAt)}
                        </span>
                        <h4>{run.repository}</h4>
                        <p>
                          {run.questTitles.length} quests · {completedCount}{" "}
                          completed in current progress
                        </p>
                      </div>
                      <a
                        className="text-link"
                        href={run.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View repository ↗
                      </a>
                    </article>
                  ))}
                </div>
              )}

              {savedRuns.length > 0 && (
                <button
                  type="button"
                  className="text-button clear-history"
                  onClick={() => {
                    setSavedRuns([]);
                    setNotice("Saved history cleared from this browser.");
                  }}
                >
                  Clear saved history
                </button>
              )}
            </section>
          )}

          <footer className="page-footer">
            <span>REPOQUEST / FIELD GUIDE 001</span>
            <span>N8N / LIVE WORKFLOW</span>
          </footer>
        </section>
      </div>
    </main>
  );
}