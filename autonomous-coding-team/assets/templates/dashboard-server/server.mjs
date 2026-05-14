import { createServer } from "node:http";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { existsSync, watch } from "node:fs";
import path from "node:path";

const role = process.env.LAMBCHOP_DASHBOARD_ROLE || "project-api";
const root = process.env.LAMBCHOP_STATUS_ROOT || "/data";
const registryRoot = process.env.LAMBCHOP_REGISTRY_ROOT || "/registry";
const port = Number(process.env.PORT || (role === "hub" ? 8765 : 8766));
const projectSlug = process.env.LAMBCHOP_PROJECT_SLUG || "{PROJECT_SLUG}";
const projectName = process.env.LAMBCHOP_PROJECT_NAME || "{PROJECT_NAME}";
const projectApiUrl = process.env.LAMBCHOP_PROJECT_API_PUBLIC_URL || "http://127.0.0.1:8766";
const projectRegistrationFile = path.join(registryRoot, `${projectSlug}.json`);
const watchFiles = ["state.json", "dashboard-data.json", "backoff.json", "progress.md", "scheduled-work-plan.md"];
const liveProjectWindowMs = Number(process.env.LAMBCHOP_LIVE_PROJECT_WINDOW_MS || 20000);

const statusClients = new Set();
const registryClients = new Set();
let lastStatusBody = "";
let lastRegistryBody = "";

async function readJson(fileName) {
  try {
    return JSON.parse(await readFile(path.join(root, fileName), "utf8"));
  } catch {
    return null;
  }
}

async function readLines(fileName, tail = 40) {
  try {
    const text = await readFile(path.join(root, fileName), "utf8");
    return text.split(/\r?\n/).filter(Boolean).slice(-tail);
  } catch {
    return [];
  }
}

async function readText(fileName) {
  try {
    return await readFile(path.join(root, fileName), "utf8");
  } catch {
    return "";
  }
}

function count(items, status) {
  return items.filter((item) => item.status === status).length;
}

function isLiveProject(project) {
  const seen = Date.parse(project?.last_seen_at || project?.registry_updated_at || "");
  return Number.isFinite(seen) && Date.now() - seen < liveProjectWindowMs;
}

function progressSections(progressText) {
  const sections = [];
  const chunks = progressText.split(/\n(?=##\s+)/);
  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (trimmed.startsWith("## ")) sections.push(trimmed);
  }
  return sections;
}

function simplifyProgressLine(line) {
  return line
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .replace(/^- /, "")
    .trim();
}

function progressHighlights(lines) {
  const useful = lines
    .map(simplifyProgressLine)
    .filter((line) => /status:|run id:|next step:|next work:|blocked|validation|scheduler|trigger|done|created|paused|failed/i.test(line))
    .slice(-8);
  return useful.length ? useful : lines.map(simplifyProgressLine).filter(Boolean).slice(-5);
}

async function statusPayload() {
  const state = await readJson("state.json");
  const dashboard = await readJson("dashboard-data.json");
  const backoff = await readJson("backoff.json");
  const progressTail = await readLines("progress.md", 50);
  const progressText = await readText("progress.md");
  const planLines = await readLines("scheduled-work-plan.md", 200);
  const items = Array.isArray(state?.work_items) ? state.work_items : Array.isArray(dashboard?.work_items) ? dashboard.work_items : [];
  const proposals = Array.isArray(state?.proposal_backlog) ? state.proposal_backlog : Array.isArray(dashboard?.proposal_backlog) ? dashboard.proposal_backlog : [];
  const active = items.filter((item) => item.status === "in_progress");
  const blocked = items.filter((item) => item.status === "blocked");
  const planSeeds = planLines.filter((line) => line.trim().startsWith("- ")).slice(-8);

  return {
    generated_at: new Date().toISOString(),
    project: state?.project || dashboard?.project || {
      name: projectName,
      slug: projectSlug,
      purpose: "Autonomous coding team workflow"
    },
    summary: {
      todo: count(items, "todo"),
      in_progress: count(items, "in_progress"),
      blocked: count(items, "blocked"),
      done: count(items, "done"),
      skipped: count(items, "skipped"),
      proposals_need_review: proposals.filter((proposal) => proposal.status === "needs_user_review").length,
      active_parallel_lanes: active.length,
      next_action: state?.last_run?.next_action || dashboard?.summary?.next_action || "Waiting for the next automation update."
    },
    current_run: state?.last_run || null,
    active_lanes: active,
    blocked,
    proposal_backlog: proposals,
    latest_work_items: items.slice(-8),
    roadmap: {
      current_milestone: state?.project?.phase || dashboard?.roadmap?.current_milestone || "",
      next_backlog_seeds: planSeeds
    },
    scheduler: backoff,
    progress_tail: progressTail,
    progress_highlights: progressHighlights(progressTail),
    evidence_sources: {
      progress_file: "progress.md",
      state_file: "state.json",
      scheduled_work_plan_file: "scheduled-work-plan.md"
    },
    latest_progress_section: progressSections(progressText).at(-1) || ""
  };
}

async function workItemEvidence(key) {
  const state = await readJson("state.json");
  const dashboard = await readJson("dashboard-data.json");
  const items = Array.isArray(state?.work_items) ? state.work_items : Array.isArray(dashboard?.work_items) ? dashboard.work_items : [];
  const item = items.find((entry) => entry.key === key) || null;
  const progressText = await readText("progress.md");
  const matchingSections = progressSections(progressText).filter((section) => section.includes(key));
  return {
    key,
    item,
    source_file: "progress.md",
    sections: matchingSections.length ? matchingSections : progressSections(progressText).slice(-1),
    note: matchingSections.length ? "Matched progress entries that mention this work item." : "No exact progress entry matched this work item, so the latest run entry is shown."
  };
}

async function registrationPayload() {
  const status = await statusPayload();
  return {
    slug: status.project?.slug || projectSlug,
    name: status.project?.name || projectName,
    purpose: status.project?.purpose || "",
    api_url: projectApiUrl,
    status_endpoint: `${projectApiUrl}/api/status`,
    events_endpoint: `${projectApiUrl}/api/events`,
    last_seen_at: new Date().toISOString()
  };
}

async function registerProject() {
  await mkdir(registryRoot, { recursive: true });
  await writeFile(projectRegistrationFile, `${JSON.stringify(await registrationPayload(), null, 2)}\n`);
}

async function registeredProjects() {
  try {
    await mkdir(registryRoot, { recursive: true });
    const files = await readdir(registryRoot);
    const projects = [];
    for (const file of files.filter((entry) => entry.endsWith(".json"))) {
      try {
        const fullPath = path.join(registryRoot, file);
        const parsed = JSON.parse(await readFile(fullPath, "utf8"));
        const info = await stat(fullPath);
        projects.push({ ...parsed, registry_updated_at: info.mtime.toISOString() });
      } catch {
        // Ignore partial writes from containers that are currently registering.
      }
    }
    return projects.filter(isLiveProject).sort((a, b) => String(a.name || a.slug).localeCompare(String(b.name || b.slug)));
  } catch {
    return [];
  }
}

function send(res, status, contentType, body) {
  res.writeHead(status, {
    "content-type": contentType,
    "cache-control": "no-store",
    "access-control-allow-origin": "*"
  });
  res.end(body);
}

function sendSse(res) {
  res.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-store",
    "connection": "keep-alive",
    "access-control-allow-origin": "*",
    "x-accel-buffering": "no"
  });
  res.write(": connected\n\n");
}

function emitEvent(clients, eventName, payload) {
  const body = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    client.write(body);
  }
}

async function publishStatus(force = false) {
  if (role !== "project-api") return;
  const payload = await statusPayload();
  const body = JSON.stringify(payload);
  if (force || body !== lastStatusBody) {
    lastStatusBody = body;
    emitEvent(statusClients, "status", payload);
    await registerProject();
  }
}

async function publishRegistry(force = false) {
  if (role !== "hub") return;
  const payload = { generated_at: new Date().toISOString(), projects: await registeredProjects() };
  const body = JSON.stringify(payload);
  if (force || body !== lastRegistryBody) {
    lastRegistryBody = body;
    emitEvent(registryClients, "projects", payload);
  }
}

function watchStatusFiles() {
  for (const fileName of watchFiles) {
    const fullPath = path.join(root, fileName);
    if (existsSync(fullPath)) {
      watch(fullPath, { persistent: false }, () => {
        setTimeout(() => publishStatus(), 75);
      });
    }
  }
  setInterval(() => publishStatus(), 1000).unref();
}

function watchRegistry() {
  if (existsSync(registryRoot)) {
    watch(registryRoot, { persistent: false }, () => {
      setTimeout(() => publishRegistry(), 75);
    });
  }
  setInterval(() => publishRegistry(), 1000).unref();
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);

  if (url.pathname === "/api/status") {
    send(res, 200, "application/json; charset=utf-8", JSON.stringify(await statusPayload()));
    return;
  }

  if (url.pathname === "/api/events") {
    sendSse(res);
    statusClients.add(res);
    emitEvent(statusClients, "status", await statusPayload());
    req.on("close", () => statusClients.delete(res));
    return;
  }

  if (url.pathname === "/api/projects") {
    send(res, 200, "application/json; charset=utf-8", JSON.stringify({ generated_at: new Date().toISOString(), projects: await registeredProjects() }));
    return;
  }

  if (url.pathname.startsWith("/api/work-item/")) {
    const key = decodeURIComponent(url.pathname.replace("/api/work-item/", ""));
    send(res, 200, "application/json; charset=utf-8", JSON.stringify(await workItemEvidence(key)));
    return;
  }

  if (url.pathname === "/api/project-events") {
    sendSse(res);
    registryClients.add(res);
    emitEvent(registryClients, "projects", { generated_at: new Date().toISOString(), projects: await registeredProjects() });
    req.on("close", () => registryClients.delete(res));
    return;
  }

  if (url.pathname === "/" || url.pathname === "/dashboard.html") {
    const htmlPath = path.join(root, "dashboard.html");
    if (!existsSync(htmlPath)) {
      send(res, 404, "text/plain; charset=utf-8", "dashboard.html not found");
      return;
    }
    send(res, 200, "text/html; charset=utf-8", await readFile(htmlPath));
    return;
  }

  send(res, 404, "text/plain; charset=utf-8", "Not found");
});

server.listen(port, "0.0.0.0", async () => {
  if (role === "project-api") {
    await registerProject();
    watchStatusFiles();
    console.log(`Lambchop project API: ${projectApiUrl}/api/status`);
  } else {
    await mkdir(registryRoot, { recursive: true });
    watchRegistry();
    console.log(`Lambchop dashboard hub: http://127.0.0.1:${port}/dashboard.html`);
  }
});
