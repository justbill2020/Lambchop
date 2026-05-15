import { createServer } from "node:http";
import { mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import { existsSync, watch } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const role = process.env.LAMBCHOP_DASHBOARD_ROLE || "project-api";
const root = process.env.LAMBCHOP_STATUS_ROOT || "/data";
const registryRoot = process.env.LAMBCHOP_REGISTRY_ROOT || "/registry";
const port = Number(process.env.PORT || (role === "hub" ? 8765 : 8766));
const projectSlug = process.env.LAMBCHOP_PROJECT_SLUG || "lambchop";
const projectName = process.env.LAMBCHOP_PROJECT_NAME || "Lambchop";
const projectApiUrl = process.env.LAMBCHOP_PROJECT_API_PUBLIC_URL || "http://127.0.0.1:8766";
const hostGateway = process.env.LAMBCHOP_HOST_GATEWAY || "host.docker.internal";
const projectRegistrationFile = path.join(registryRoot, `${projectSlug}.json`);
const controlRequestsFile = "dashboard-control-requests.json";
const watchFiles = ["state.json", "dashboard-data.json", "backoff.json", "progress.md", "scheduled-work-plan.md", controlRequestsFile];
const liveProjectWindowMs = Number(process.env.LAMBCHOP_LIVE_PROJECT_WINDOW_MS || 120000);

const statusClients = new Set();
const registryClients = new Set();
let lastStatusBody = "";
let lastRegistryBody = "";

async function readJson(fileName, statusRoot = root) {
  try {
    return JSON.parse(await readFile(path.join(statusRoot, fileName), "utf8"));
  } catch {
    return null;
  }
}

async function readLines(fileName, tail = 40, statusRoot = root) {
  try {
    const text = await readFile(path.join(statusRoot, fileName), "utf8");
    return text.split(/\r?\n/).filter(Boolean).slice(-tail);
  } catch {
    return [];
  }
}

async function readText(fileName, statusRoot = root) {
  try {
    return await readFile(path.join(statusRoot, fileName), "utf8");
  } catch {
    return "";
  }
}

function count(items, status) {
  return items.filter((item) => item.status === status).length;
}

function projectHealth(project, options = {}) {
  const now = Number.isFinite(options.now) ? options.now : Date.now();
  const windowMs = Number.isFinite(options.liveProjectWindowMs) ? options.liveProjectWindowMs : liveProjectWindowMs;
  const seen = Date.parse(project?.last_seen_at || project?.registry_updated_at || "");
  const age = Number.isFinite(seen) ? now - seen : null;
  return {
    health: Number.isFinite(age) && age < windowMs ? "live" : "stale",
    last_seen_age_ms: Number.isFinite(age) ? age : null
  };
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

export async function statusPayload(options = {}) {
  const statusRoot = options.root || root;
  const state = await readJson("state.json", statusRoot);
  const dashboard = await readJson("dashboard-data.json", statusRoot);
  const backoff = await readJson("backoff.json", statusRoot);
  const controlRequests = await readJson(controlRequestsFile, statusRoot);
  const progressTail = await readLines("progress.md", 50, statusRoot);
  const progressText = await readText("progress.md", statusRoot);
  const planLines = await readLines("scheduled-work-plan.md", 200, statusRoot);
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
    dashboard_control: controlRequests || { version: 1, requests: [] },
    progress_tail: progressTail,
    progress_highlights: progressHighlights(progressTail),
    evidence_sources: {
      progress_file: "progress.md",
      state_file: "state.json",
      scheduled_work_plan_file: "scheduled-work-plan.md",
      dashboard_control_file: controlRequestsFile
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

export async function registrationPayload(options = {}) {
  const status = await statusPayload({ root: options.root || root });
  const slug = options.projectSlug || status.project?.slug || projectSlug;
  const name = options.projectName || status.project?.name || projectName;
  const apiUrl = options.projectApiUrl || projectApiUrl;
  return {
    slug,
    name,
    purpose: status.project?.purpose || "",
    api_url: apiUrl,
    status_endpoint: `${apiUrl}/api/status`,
    events_endpoint: `${apiUrl}/api/events`,
    last_seen_at: new Date().toISOString()
  };
}

export async function registerProject(options = {}) {
  const targetRegistryRoot = options.registryRoot || registryRoot;
  const slug = options.projectSlug || projectSlug;
  await mkdir(targetRegistryRoot, { recursive: true });
  const targetFile = path.join(targetRegistryRoot, `${slug}.json`);
  const tempFile = path.join(targetRegistryRoot, `.${slug}.${process.pid}.${Date.now()}.tmp`);
  await writeFile(tempFile, `${JSON.stringify(await registrationPayload(options), null, 2)}\n`);
  await rename(tempFile, targetFile);
}

export async function registeredProjects(options = {}) {
  const targetRegistryRoot = options.registryRoot || registryRoot;
  try {
    await mkdir(targetRegistryRoot, { recursive: true });
    const files = await readdir(targetRegistryRoot);
    const projects = [];
    for (const file of files.filter((entry) => entry.endsWith(".json"))) {
      try {
        const fullPath = path.join(targetRegistryRoot, file);
        const parsed = JSON.parse(await readFile(fullPath, "utf8"));
        const info = await stat(fullPath);
        projects.push({ ...parsed, registry_updated_at: info.mtime.toISOString(), ...projectHealth(parsed, options) });
      } catch {
        // Ignore partial writes from containers that are currently registering.
      }
    }
    return projects.sort((a, b) => {
      if (a.health !== b.health) return a.health === "live" ? -1 : 1;
      return String(a.name || a.slug).localeCompare(String(b.name || b.slug));
    });
  } catch {
    return [];
  }
}

async function readRequestBody(req, limit = 65536) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > limit) throw new Error("Request body too large");
  }
  return body ? JSON.parse(body) : {};
}

async function postJson(url, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    const text = await response.text();
    let payload = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { raw: text };
    }
    if (!response.ok) {
      const error = new Error(payload.error || `Request failed with ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

function dashboardCommandUrls(project) {
  const apiUrl = String(project.api_url || "").replace(/\/$/, "");
  if (!apiUrl) {
    return [];
  }

  const urls = [`${apiUrl}/api/dashboard-command`];
  try {
    const parsed = new URL(apiUrl);
    if (["127.0.0.1", "localhost", "::1"].includes(parsed.hostname) && hostGateway) {
      parsed.hostname = hostGateway;
      urls.unshift(`${parsed.toString().replace(/\/$/, "")}/api/dashboard-command`);
    }
  } catch {
    return urls;
  }

  return Array.from(new Set(urls));
}

function normalizeDashboardCommand(input) {
  const action = String(input?.action || "lambchop-update").trim();
  const allowed = new Set(["lambchop-update", "dashboard-refresh"]);
  if (!allowed.has(action)) {
    const error = new Error(`Unsupported dashboard command action: ${action}`);
    error.status = 400;
    throw error;
  }
  return {
    id: `dashboard-command-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, "")}`,
    action,
    status: "queued",
    requested_by: String(input?.requested_by || "dashboard-api").slice(0, 80),
    reason: String(input?.reason || "").slice(0, 500),
    requested_at: new Date().toISOString(),
    source: "dashboard-api",
    execution: "automation"
  };
}

export async function queueDashboardCommand(input, options = {}) {
  const statusRoot = options.root || root;
  const command = normalizeDashboardCommand(input);
  const fileName = options.fileName || controlRequestsFile;
  const fullPath = path.join(statusRoot, fileName);
  let existing = { version: 1, requests: [] };
  try {
    existing = JSON.parse(await readFile(fullPath, "utf8"));
  } catch {
    // Missing file starts a new command queue.
  }
  const requests = Array.isArray(existing.requests) ? existing.requests : [];
  const next = {
    version: 1,
    updated_at: new Date().toISOString(),
    requests: [...requests, command]
  };
  const tempFile = `${fullPath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempFile, `${JSON.stringify(next, null, 2)}\n`);
  await rename(tempFile, fullPath);
  return command;
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

export function createDashboardServer() {
  return createServer(async (req, res) => {
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

  if (url.pathname.startsWith("/api/project-command/") && req.method === "POST") {
    if (role !== "hub") {
      send(res, 405, "application/json; charset=utf-8", JSON.stringify({ error: "Project command forwarding must be requested through the dashboard hub." }));
      return;
    }
    try {
      const slug = decodeURIComponent(url.pathname.replace("/api/project-command/", ""));
      const project = (await registeredProjects()).find((entry) => entry.slug === slug);
      if (!project) {
        send(res, 404, "application/json; charset=utf-8", JSON.stringify({ error: `Project not registered: ${slug}` }));
        return;
      }
      const payload = await readRequestBody(req);
      const commandUrls = dashboardCommandUrls(project);
      let lastError = null;
      let result = null;
      for (const commandUrl of commandUrls) {
        try {
          result = await postJson(commandUrl, payload);
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (!result) {
        throw lastError || new Error("Project API URL is unavailable");
      }
      send(res, 202, "application/json; charset=utf-8", JSON.stringify({ forwarded: true, project: slug, result }));
    } catch (error) {
      send(res, error.status || 502, "application/json; charset=utf-8", JSON.stringify({ error: error.message }));
    }
    return;
  }

  if (url.pathname === "/api/dashboard-command" && req.method === "POST") {
    if (role !== "project-api") {
      send(res, 405, "application/json; charset=utf-8", JSON.stringify({ error: "Dashboard commands must be queued through a project API." }));
      return;
    }
    try {
      const command = await queueDashboardCommand(await readRequestBody(req));
      await publishStatus(true);
      send(res, 202, "application/json; charset=utf-8", JSON.stringify({ queued: true, command }));
    } catch (error) {
      send(res, error.status || 500, "application/json; charset=utf-8", JSON.stringify({ error: error.message }));
    }
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
}

export async function startDashboardServer() {
  const server = createDashboardServer();
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
  return server;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  startDashboardServer();
}
