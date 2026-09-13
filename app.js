const STORAGE_KEY = "work-progress-dashboard-v1";

const defaultState = () => ({
  projects: [
    {
      id: "p-website",
      name: "Website refresh",
      description: "Homepage, dashboard, and docs pages.",
    },
    {
      id: "p-api",
      name: "API hardening",
      description: "Auth, rate limits, and error reporting.",
    },
    {
      id: "p-onboarding",
      name: "Team onboarding",
      description: "Checklists and first-week tasks.",
    },
  ],
  tasks: [
    {
      id: "t1",
      title: "Design overview cards",
      projectId: "p-website",
      status: "done",
      priority: "high",
      due: isoOffset(-2),
    },
    {
      id: "t2",
      title: "Build progress bars",
      projectId: "p-website",
      status: "in-progress",
      priority: "high",
      due: isoOffset(1),
    },
    {
      id: "t3",
      title: "Add import/export",
      projectId: "p-website",
      status: "todo",
      priority: "medium",
      due: isoOffset(4),
    },
    {
      id: "t4",
      title: "Token refresh flow",
      projectId: "p-api",
      status: "blocked",
      priority: "high",
      due: isoOffset(2),
    },
    {
      id: "t5",
      title: "Rate-limit middleware",
      projectId: "p-api",
      status: "in-progress",
      priority: "medium",
      due: isoOffset(6),
    },
    {
      id: "t6",
      title: "Write setup guide",
      projectId: "p-onboarding",
      status: "todo",
      priority: "low",
      due: isoOffset(8),
    },
  ],
});

function isoOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed.projects || !parsed.tasks) return defaultState();
    return parsed;
  } catch {
    return defaultState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();
let view = "overview";
let modalMode = null;
let editingId = null;

const els = {
  title: document.getElementById("page-title"),
  subtitle: document.getElementById("page-subtitle"),
  views: {
    overview: document.getElementById("view-overview"),
    projects: document.getElementById("view-projects"),
    tasks: document.getElementById("view-tasks"),
  },
  kpiGrid: document.getElementById("kpi-grid"),
  projectProgress: document.getElementById("project-progress-list"),
  upcoming: document.getElementById("upcoming-list"),
  statusBars: document.getElementById("status-bars"),
  projectsGrid: document.getElementById("projects-grid"),
  taskRows: document.getElementById("task-rows"),
  filterProject: document.getElementById("filter-project"),
  filterStatus: document.getElementById("filter-status"),
  search: document.getElementById("search"),
  modal: document.getElementById("modal"),
  modalTitle: document.getElementById("modal-title"),
  modalFields: document.getElementById("modal-fields"),
  modalForm: document.getElementById("modal-form"),
};

const copy = {
  overview: ["Overview", "Track how work is moving across projects."],
  projects: ["Projects", "See completion for each workstream."],
  tasks: ["Tasks", "Filter, update, and close out work items."],
};

function projectById(id) {
  return state.projects.find((p) => p.id === id);
}

function tasksFor(projectId) {
  return state.tasks.filter((t) => t.projectId === projectId);
}

function progressFor(projectId) {
  const tasks = tasksFor(projectId);
  if (!tasks.length) return 0;
  const done = tasks.filter((t) => t.status === "done").length;
  return Math.round((done / tasks.length) * 100);
}

function setView(next) {
  view = next;
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
  Object.entries(els.views).forEach(([name, node]) => {
    node.classList.toggle("hidden", name !== view);
  });
  els.title.textContent = copy[view][0];
  els.subtitle.textContent = copy[view][1];
  render();
}

function render() {
  saveState(state);
  renderKpis();
  renderProjectProgress();
  renderUpcoming();
  renderStatusBars();
  renderProjects();
  renderFilters();
  renderTasks();
}

function renderKpis() {
  const total = state.tasks.length;
  const done = state.tasks.filter((t) => t.status === "done").length;
  const active = state.tasks.filter((t) => t.status === "in-progress").length;
  const blocked = state.tasks.filter((t) => t.status === "blocked").length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const cards = [
    ["Overall complete", `${percent}%`, `${done} of ${total} tasks`],
    ["In progress", String(active), "Work currently moving"],
    ["Blocked", String(blocked), "Needs attention"],
    ["Projects", String(state.projects.length), "Active workstreams"],
  ];
  els.kpiGrid.innerHTML = cards
    .map(
      ([label, value, hint]) => `
      <article class="kpi">
        <div class="label">${label}</div>
        <div class="value">${value}</div>
        <div class="hint">${hint}</div>
      </article>`
    )
    .join("");
}

function renderProjectProgress() {
  if (!state.projects.length) {
    els.projectProgress.innerHTML = `<p class="empty">No projects yet.</p>`;
    return;
  }
  els.projectProgress.innerHTML = state.projects
    .map((p) => {
      const pct = progressFor(p.id);
      const count = tasksFor(p.id).length;
      return `
        <div class="progress-row">
          <div class="progress-meta">
            <strong>${escapeHtml(p.name)}</strong>
            <span>${pct}% · ${count} tasks</span>
          </div>
          <div class="bar"><span style="width:${pct}%"></span></div>
        </div>`;
    })
    .join("");
}

function renderUpcoming() {
  const today = new Date();
  const week = new Date();
  week.setDate(today.getDate() + 7);
  const items = state.tasks
    .filter((t) => t.status !== "done" && t.due)
    .filter((t) => {
      const due = new Date(t.due);
      return due >= new Date(isoOffset(0)) && due <= week;
    })
    .sort((a, b) => a.due.localeCompare(b.due));
  if (!items.length) {
    els.upcoming.innerHTML = `<p class="empty">Nothing due in the next 7 days.</p>`;
    return;
  }
  els.upcoming.innerHTML = items
    .map((t) => {
      const project = projectById(t.projectId);
      return `
        <div class="upcoming-item">
          <div>
            <strong>${escapeHtml(t.title)}</strong>
            <div class="hint">${escapeHtml(project?.name || "No project")}</div>
          </div>
          <span class="chip ${t.status}">${t.due}</span>
        </div>`;
    })
    .join("");
}

function renderStatusBars() {
  const statuses = ["todo", "in-progress", "blocked", "done"];
  const total = state.tasks.length || 1;
  const labels = {
    todo: "To do",
    "in-progress": "In progress",
    blocked: "Blocked",
    done: "Done",
  };
  els.statusBars.innerHTML = statuses
    .map((status) => {
      const count = state.tasks.filter((t) => t.status === status).length;
      const pct = Math.round((count / total) * 100);
      return `
        <div class="status-row">
          <span>${labels[status]}</span>
          <div class="bar"><span style="width:${pct}%;background:var(--${status === "in-progress" ? "progress" : status})"></span></div>
          <span>${count}</span>
        </div>`;
    })
    .join("");
}

function renderProjects() {
  els.projectsGrid.innerHTML = state.projects
    .map((p) => {
      const pct = progressFor(p.id);
      const tasks = tasksFor(p.id);
      return `
        <article class="project-card">
          <h3>${escapeHtml(p.name)}</h3>
          <p>${escapeHtml(p.description || "")}</p>
          <div class="bar"><span style="width:${pct}%"></span></div>
          <div class="progress-meta" style="margin-top:10px">
            <span>${pct}% complete</span>
            <span>${tasks.filter((t) => t.status === "done").length}/${tasks.length} done</span>
          </div>
          <div class="row-actions" style="margin-top:12px">
            <button class="icon-btn" data-edit-project="${p.id}">Edit</button>
            <button class="icon-btn" data-delete-project="${p.id}">Delete</button>
          </div>
        </article>`;
    })
    .join("");
}

function renderFilters() {
  const current = els.filterProject.value;
  els.filterProject.innerHTML =
    `<option value="">All projects</option>` +
    state.projects
      .map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`)
      .join("");
  els.filterProject.value = current;
}

function renderTasks() {
  const q = els.search.value.trim().toLowerCase();
  const projectId = els.filterProject.value;
  const status = els.filterStatus.value;
  const rows = state.tasks.filter((t) => {
    const project = projectById(t.projectId);
    const hay = `${t.title} ${project?.name || ""}`.toLowerCase();
    if (q && !hay.includes(q)) return false;
    if (projectId && t.projectId !== projectId) return false;
    if (status && t.status !== status) return false;
    return true;
  });
  els.taskRows.innerHTML = rows
    .map((t) => {
      const project = projectById(t.projectId);
      return `
        <tr>
          <td>${escapeHtml(t.title)}</td>
          <td>${escapeHtml(project?.name || "—")}</td>
          <td><span class="chip ${t.status}">${labelStatus(t.status)}</span></td>
          <td><span class="chip ${t.priority}">${t.priority}</span></td>
          <td>${t.due || "—"}</td>
          <td>
            <div class="row-actions">
              <button class="icon-btn" data-cycle="${t.id}">Advance</button>
              <button class="icon-btn" data-edit-task="${t.id}">Edit</button>
              <button class="icon-btn" data-delete-task="${t.id}">Delete</button>
            </div>
          </td>
        </tr>`;
    })
    .join("");
}

function labelStatus(status) {
  return {
    todo: "To do",
    "in-progress": "In progress",
    blocked: "Blocked",
    done: "Done",
  }[status];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function openModal(mode, id) {
  modalMode = mode;
  editingId = id || null;
  const project = id && mode.startsWith("project") ? projectById(id) : null;
  const task = id && mode.startsWith("task") ? state.tasks.find((t) => t.id === id) : null;
  els.modalTitle.textContent =
    mode === "project"
      ? editingId
        ? "Edit project"
        : "New project"
      : editingId
        ? "Edit task"
        : "New task";

  if (mode === "project") {
    els.modalFields.innerHTML = `
      <label>Name<input name="name" required value="${escapeHtml(project?.name || "")}"></label>
      <label>Description<textarea name="description" rows="3">${escapeHtml(project?.description || "")}</textarea></label>
    `;
  } else {
    els.modalFields.innerHTML = `
      <label>Title<input name="title" required value="${escapeHtml(task?.title || "")}"></label>
      <label>Project
        <select name="projectId" required>
          ${state.projects
            .map(
              (p) =>
                `<option value="${p.id}" ${task?.projectId === p.id ? "selected" : ""}>${escapeHtml(p.name)}</option>`
            )
            .join("")}
        </select>
      </label>
      <label>Status
        <select name="status">
          ${["todo", "in-progress", "blocked", "done"]
            .map(
              (s) =>
                `<option value="${s}" ${task?.status === s ? "selected" : ""}>${labelStatus(s)}</option>`
            )
            .join("")}
        </select>
      </label>
      <label>Priority
        <select name="priority">
          ${["low", "medium", "high"]
            .map(
              (p) =>
                `<option value="${p}" ${task?.priority === p ? "selected" : ""}>${p}</option>`
            )
            .join("")}
        </select>
      </label>
      <label>Due date<input type="date" name="due" value="${task?.due || isoOffset(7)}"></label>
    `;
  }
  els.modal.showModal();
}

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => setView(btn.dataset.view));
});

document.getElementById("add-project-btn").addEventListener("click", () => openModal("project"));
document.getElementById("add-task-btn").addEventListener("click", () => {
  if (!state.projects.length) {
    openModal("project");
    return;
  }
  openModal("task");
});

document.getElementById("modal-cancel").addEventListener("click", () => els.modal.close());

els.modalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(els.modalForm);
  if (modalMode === "project") {
    const payload = {
      id: editingId || uid("p"),
      name: String(data.get("name") || "").trim(),
      description: String(data.get("description") || "").trim(),
    };
    if (editingId) {
      state.projects = state.projects.map((p) => (p.id === editingId ? payload : p));
    } else {
      state.projects.push(payload);
    }
  } else {
    const payload = {
      id: editingId || uid("t"),
      title: String(data.get("title") || "").trim(),
      projectId: String(data.get("projectId")),
      status: String(data.get("status")),
      priority: String(data.get("priority")),
      due: String(data.get("due") || ""),
    };
    if (editingId) {
      state.tasks = state.tasks.map((t) => (t.id === editingId ? payload : t));
    } else {
      state.tasks.push(payload);
    }
  }
  els.modal.close();
  render();
});

document.body.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.dataset.editProject) openModal("project", target.dataset.editProject);
  if (target.dataset.deleteProject) {
    const id = target.dataset.deleteProject;
    state.projects = state.projects.filter((p) => p.id !== id);
    state.tasks = state.tasks.filter((t) => t.projectId !== id);
    render();
  }
  if (target.dataset.editTask) openModal("task", target.dataset.editTask);
  if (target.dataset.deleteTask) {
    state.tasks = state.tasks.filter((t) => t.id !== target.dataset.deleteTask);
    render();
  }
  if (target.dataset.cycle) {
    const order = ["todo", "in-progress", "blocked", "done"];
    state.tasks = state.tasks.map((t) => {
      if (t.id !== target.dataset.cycle) return t;
      const next = order[(order.indexOf(t.status) + 1) % order.length];
      return { ...t, status: next };
    });
    render();
  }
});

els.search.addEventListener("input", renderTasks);
els.filterProject.addEventListener("change", renderTasks);
els.filterStatus.addEventListener("change", renderTasks);

document.getElementById("export-btn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "work-progress.json";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("import-input").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed.projects || !parsed.tasks) return;
  state = parsed;
  render();
  event.target.value = "";
});

render();
