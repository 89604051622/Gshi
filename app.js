const STORAGE_KEY = "attendance-journal-v1";

const studentForm = document.getElementById("student-form");
const studentNameInput = document.getElementById("student-name");
const studentsList = document.getElementById("students-list");

const lessonForm = document.getElementById("lesson-form");
const lessonDateInput = document.getElementById("lesson-date");
const lessonTopicInput = document.getElementById("lesson-topic");

const journal = document.getElementById("journal");
const stats = document.getElementById("stats");

const statusOptions = [
  { value: "present", label: "Присутствовал" },
  { value: "late", label: "Опоздал" },
  { value: "absent", label: "Отсутствовал" },
];

const state = loadState();

if (!state.students.length) {
  state.students = ["Иван Петров", "Анна Смирнова"];
}

if (!state.lessons.length) {
  const today = new Date().toISOString().slice(0, 10);
  state.lessons.push({ id: crypto.randomUUID(), date: today, topic: "Классный час" });
}

studentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = studentNameInput.value.trim();

  if (!name || state.students.includes(name)) {
    return;
  }

  state.students.push(name);
  studentNameInput.value = "";
  persistAndRender();
});

lessonForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const date = lessonDateInput.value;
  const topic = lessonTopicInput.value.trim();

  if (!date || !topic) {
    return;
  }

  state.lessons.push({ id: crypto.randomUUID(), date, topic });
  lessonForm.reset();
  persistAndRender();
});

function renderStudents() {
  studentsList.innerHTML = "";

  if (!state.students.length) {
    studentsList.innerHTML = '<li class="empty">Список учеников пуст.</li>';
    return;
  }

  state.students.forEach((name) => {
    const li = document.createElement("li");
    li.className = "chip";
    li.innerHTML = `
      <span>${escapeHtml(name)}</span>
      <button type="button" data-remove-student="${escapeHtml(name)}">×</button>
    `;
    studentsList.append(li);
  });
}

studentsList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-remove-student]");
  if (!button) {
    return;
  }

  const name = button.dataset.removeStudent;
  state.students = state.students.filter((student) => student !== name);

  Object.keys(state.attendance).forEach((lessonId) => {
    delete state.attendance[lessonId]?.[name];
  });

  persistAndRender();
});

function renderJournal() {
  if (!state.students.length || !state.lessons.length) {
    journal.innerHTML =
      '<p class="empty">Добавьте хотя бы одного ученика и один урок, чтобы начать отметку посещаемости.</p>';
    return;
  }

  const sortedLessons = [...state.lessons].sort((a, b) => a.date.localeCompare(b.date));

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Дата</th>
      <th>Тема</th>
      ${state.students.map((student) => `<th>${escapeHtml(student)}</th>`).join("")}
    </tr>
  `;
  table.append(thead);

  const tbody = document.createElement("tbody");

  sortedLessons.forEach((lesson) => {
    const tr = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.textContent = formatDate(lesson.date);
    tr.append(dateCell);

    const topicCell = document.createElement("td");
    topicCell.textContent = lesson.topic;
    tr.append(topicCell);

    state.students.forEach((student) => {
      const td = document.createElement("td");
      const select = document.createElement("select");
      const currentValue = state.attendance[lesson.id]?.[student] || "present";

      statusOptions.forEach((option) => {
        const item = document.createElement("option");
        item.value = option.value;
        item.textContent = option.label;
        if (option.value === currentValue) {
          item.selected = true;
        }
        select.append(item);
      });

      select.className = `status-${currentValue}`;
      select.addEventListener("change", () => {
        if (!state.attendance[lesson.id]) {
          state.attendance[lesson.id] = {};
        }
        state.attendance[lesson.id][student] = select.value;
        persistAndRender();
      });

      td.append(select);
      tr.append(td);
    });

    tbody.append(tr);
  });

  table.append(tbody);
  journal.innerHTML = "";
  journal.append(table);
}

function renderStats() {
  stats.innerHTML = "";

  if (!state.students.length) {
    stats.innerHTML = '<p class="empty">Нет учеников для статистики.</p>';
    return;
  }

  state.students.forEach((student) => {
    const metrics = { present: 0, late: 0, absent: 0 };

    state.lessons.forEach((lesson) => {
      const status = state.attendance[lesson.id]?.[student] || "present";
      metrics[status] += 1;
    });

    const card = document.createElement("article");
    card.className = "stat-card";
    card.innerHTML = `
      <h3>${escapeHtml(student)}</h3>
      <p class="status-present">Присутствовал: ${metrics.present}</p>
      <p class="status-late">Опоздал: ${metrics.late}</p>
      <p class="status-absent">Отсутствовал: ${metrics.absent}</p>
    `;

    stats.append(card);
  });
}

function persistAndRender() {
  saveState(state);
  renderStudents();
  renderJournal();
  renderStats();
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { students: [], lessons: [], attendance: {} };
    }

    const parsed = JSON.parse(raw);
    return {
      students: Array.isArray(parsed.students) ? parsed.students : [],
      lessons: Array.isArray(parsed.lessons) ? parsed.lessons : [],
      attendance: parsed.attendance && typeof parsed.attendance === "object" ? parsed.attendance : {},
    };
  } catch {
    return { students: [], lessons: [], attendance: {} };
  }
}

function saveState(payload) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

persistAndRender();
