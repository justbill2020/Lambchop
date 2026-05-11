import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.env.LAMBCHOP_STATUS_ROOT || "/data";
const port = Number(process.env.PORT || 8765);

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

function count(items, status) {
  return items.filter((item) => item.status === status).length;
}

async function statusPayload() {
  const state = await readJson("state.json");
  const dashboard = await readJson("dashboard-data.json");
  const backoff = await readJson("backoff.json");
  const progressTail = await readLines("progress.md", 50);
  const planLines = await readLines("scheduled-work-plan.md", 200);
  const items = Array.isArray(state?.work_items) ? state.work_items : Array.isArray(dashboard?.work_items) ? dashboard.work_items : [];
  const active = items.filter((item) => item.status === "in_progress");
  const blocked = items.filter((item) => item.status === "blocked");
  const planSeeds = planLines.filter((line) => line.trim().startsWith("- ")).slice(-8);

  return {
    generated_at: new Date().toISOString(),
    project: state?.project || dashboard?.project || {
      name: "Lambchop project",
      purpose: "Autonomous coding team workflow"
    },
    summary: {
      todo: count(items, "todo"),
      in_progress: count(items, "in_progress"),
      blocked: count(items, "blocked"),
      done: count(items, "done"),
      skipped: count(items, "skipped"),
      active_parallel_lanes: active.length,
      next_action: state?.last_run?.next_action || dashboard?.summary?.next_action || "Waiting for the next automation update."
    },
    current_run: state?.last_run || null,
    active_lanes: active,
    blocked,
    latest_work_items: items.slice(-8),
    roadmap: {
      current_milestone: state?.project?.phase || dashboard?.roadmap?.current_milestone || "",
      next_backlog_seeds: planSeeds
    },
    scheduler: backoff,
    progress_tail: progressTail
  };
}

function send(res, status, contentType, body) {
  res.writeHead(status, {
    "content-type": contentType,
    "cache-control": "no-store",
    "access-control-allow-origin": "*"
  });
  res.end(body);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);

  if (url.pathname === "/api/status") {
    send(res, 200, "application/json; charset=utf-8", JSON.stringify(await statusPayload()));
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

server.listen(port, "0.0.0.0", () => {
  console.log(`Lambchop live status dashboard: http://127.0.0.1:${port}/dashboard.html`);
});
