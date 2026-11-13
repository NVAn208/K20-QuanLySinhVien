(function () {
  "use strict";

  const STORAGE_KEY = "eduboard.students.v1";
  const demoStudents = [
    { id: "SV2024001", name: "Nguyễn Minh Anh", className: "CNTT K20A", email: "minhanh.nguyen@edu.vn", scores: [9, 8.5, 9.2] },
    { id: "SV2024002", name: "Trần Quốc Bảo", className: "CNTT K20A", email: "quocbao.tran@edu.vn", scores: [7.5, 8, 7.8] },
    { id: "SV2024003", name: "Lê Hoàng Phúc", className: "QTKD K20B", email: "hoangphuc.le@edu.vn", scores: [6.5, 7, 6.8] },
    { id: "SV2024004", name: "Phạm Thùy Linh", className: "CNTT K20B", email: "thuylinh.pham@edu.vn", scores: [9.5, 9, 9.8] },
    { id: "SV2024005", name: "Võ Đức Thành", className: "KTPM K21A", email: "ducthanh.vo@edu.vn", scores: [5, 5.5, 4.5] },
    { id: "SV2024006", name: "Đặng Ngọc Hà", className: "QTKD K20B", email: "ngocha.dang@edu.vn", scores: [8, 7.5, 8.3] }
  ];

  const avatarColors = [
    ["#eaf3ff", "#5683c5"],
    ["#f2edff", "#8067c3"],
    ["#fff1e9", "#c77a4b"],
    ["#e8f7f1", "#429b7b"],
    ["#fff0f2", "#c26c7d"],
    ["#fff7e7", "#ad8840"]
  ];

  const elements = {
    tableBody: document.getElementById("student-table-body"),
    emptyState: document.getElementById("empty-state"),
    emptyTitle: document.getElementById("empty-title"),
    emptyDescription: document.getElementById("empty-description"),
    search: document.getElementById("search-input"),
    sort: document.getElementById("sort-select"),
    modal: document.getElementById("student-modal"),
    form: document.getElementById("student-form"),
    id: document.getElementById("student-id"),
    name: document.getElementById("student-name"),
    className: document.getElementById("student-class"),
    email: document.getElementById("student-email"),
    scores: document.getElementById("student-scores"),
    toastRegion: document.getElementById("toast-region")
  };

  let students = loadStudents();
  let editingId = null;
  let previousFocus = null;

  function loadStudents() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === null) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demoStudents));
        return demoStudents.map((student) => ({ ...student, scores: student.scores.slice() }));
      }

      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) {
        throw new Error("Dữ liệu sinh viên đã lưu không đúng định dạng.");
      }
      return parsed.filter(isValidStoredStudent);
    } catch (error) {
      window.setTimeout(() => showToast("Không thể đọc dữ liệu đã lưu. Vui lòng kiểm tra cài đặt trình duyệt.", true), 0);
      return [];
    }
  }

  function isValidStoredStudent(student) {
    return student &&
      typeof student.id === "string" &&
      typeof student.name === "string" &&
      typeof student.className === "string" &&
      typeof student.email === "string" &&
      Array.isArray(student.scores) &&
      student.scores.length > 0 &&
      student.scores.every((score) => Number.isFinite(score) && score >= 0 && score <= 10);
  }

  function saveStudents() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
      render();
      return true;
    } catch (error) {
      showToast("Không thể lưu dữ liệu. Hãy kiểm tra dung lượng lưu trữ của trình duyệt.", true);
      return false;
    }
  }

  function average(student) {
    return student.scores.reduce((total, score) => total + score, 0) / student.scores.length;
  }

  function gradeFor(score) {
    if (score >= 8.5) return { label: "Xuất sắc", className: "grade-excellent" };
    if (score >= 7) return { label: "Khá", className: "grade-good" };
    if (score >= 5) return { label: "Trung bình", className: "grade-average" };
    return { label: "Yếu", className: "grade-weak" };
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function getVisibleStudents() {
    const query = normalizeText(elements.search.value.trim());
    const filtered = students.filter((student) => {
      if (!query) return true;
      return [student.id, student.name, student.className, student.email]
        .some((value) => normalizeText(value).includes(query));
    });

    const comparators = {
      "name-asc": (a, b) => a.name.localeCompare(b.name, "vi"),
      "name-desc": (a, b) => b.name.localeCompare(a.name, "vi"),
      "average-desc": (a, b) => average(b) - average(a),
      "average-asc": (a, b) => average(a) - average(b),
      "id-asc": (a, b) => a.id.localeCompare(b.id, "vi", { numeric: true, sensitivity: "base" })
    };
    return filtered.sort(comparators[elements.sort.value] || comparators["name-asc"]);
  }

  function normalizeText(value) {
    return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("vi");
  }

  function render() {
    const visibleStudents = getVisibleStudents();
    elements.tableBody.innerHTML = visibleStudents.map((student) => {
      const score = average(student);
      const grade = gradeFor(score);
      const initials = student.name.trim().split(/\s+/).slice(-2).map((part) => part.charAt(0)).join("").toLocaleUpperCase("vi");
      const colorIndex = Array.from(student.id).reduce((sum, character) => sum + character.charCodeAt(0), 0) % avatarColors.length;
      const colors = avatarColors[colorIndex];
      const email = student.email ? `<small>${escapeHtml(student.email)}</small>` : "<small>Chưa cập nhật email</small>";

      return `<tr>
        <td><div class="student-cell"><span class="student-avatar" style="background:${colors[0]};color:${colors[1]}">${escapeHtml(initials)}</span><span class="student-meta"><strong>${escapeHtml(student.name)}</strong>${email}</span></div></td>
        <td><span class="student-id">${escapeHtml(student.id)}</span></td>
        <td><span class="class-chip">${escapeHtml(student.className)}</span></td>
        <td><div class="score-cell">${score.toFixed(2)}<span class="score-track"><span style="width:${Math.min(score * 10, 100)}%"></span></span></div></td>
        <td><span class="grade-badge ${grade.className}">${grade.label}</span></td>
        <td class="actions-cell">
          <button class="row-action edit" type="button" data-action="edit" data-id="${escapeHtml(student.id)}" aria-label="Sửa ${escapeHtml(student.name)}" title="Sửa thông tin"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg></button>
          <button class="row-action delete" type="button" data-action="delete" data-id="${escapeHtml(student.id)}" aria-label="Xóa ${escapeHtml(student.name)}" title="Xóa sinh viên"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 7h15M9 7V4.5h6V7m-8.5 0 1 13h9l1-13M10 10.5v6M14 10.5v6"/></svg></button>
        </td>
      </tr>`;
    }).join("");

    elements.tableBody.hidden = visibleStudents.length === 0;
    elements.emptyState.hidden = visibleStudents.length !== 0;
    elements.emptyTitle.textContent = students.length === 0 ? "Chưa có sinh viên nào" : "Không tìm thấy sinh viên";
    elements.emptyDescription.textContent = students.length === 0
      ? "Thêm sinh viên mới để bắt đầu quản lý danh sách."
      : "Thử thay đổi từ khóa tìm kiếm để xem kết quả khác.";
    document.getElementById("empty-add-button").hidden = students.length !== 0;

    const countText = `${visibleStudents.length} sinh viên`;
    document.getElementById("result-count").textContent = countText;
    document.getElementById("nav-count").textContent = String(students.length);
    document.getElementById("table-summary").textContent = `Hiển thị ${visibleStudents.length} / ${students.length} sinh viên`;

    const mean = students.length
      ? students.reduce((total, student) => total + average(student), 0) / students.length
      : 0;
    document.getElementById("stat-total").textContent = String(students.length);
    document.getElementById("stat-average").textContent = mean.toFixed(2);
    document.getElementById("stat-good").textContent = String(students.filter((student) => average(student) >= 7).length);
    document.getElementById("stat-support").textContent = String(students.filter((student) => average(student) < 5).length);
  }

  function showToast(message, isError) {
    if (!elements.toastRegion) return;
    const toast = document.createElement("div");
    toast.className = `toast${isError ? " error" : ""}`;
    toast.textContent = message;
    elements.toastRegion.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3500);
  }

  function openModal(student) {
    editingId = student ? student.id : null;
    previousFocus = document.activeElement;
    elements.form.reset();
    clearErrors();
    document.getElementById("modal-title").textContent = student ? "Chỉnh sửa sinh viên" : "Thêm sinh viên";
    document.getElementById("save-student-button").innerHTML = student
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>Cập nhật'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>Lưu sinh viên';

    if (student) {
      elements.id.value = student.id;
      elements.name.value = student.name;
      elements.className.value = student.className;
      elements.email.value = student.email;
      elements.scores.value = student.scores.join(", ");
    }

    elements.modal.hidden = false;
    document.body.style.overflow = "hidden";
    elements.id.focus();
  }

  function closeModal() {
    elements.modal.hidden = true;
    document.body.style.overflow = "";
    if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
  }

  function clearErrors() {
    document.querySelectorAll(".field-error").forEach((field) => { field.textContent = ""; });
  }

  function setError(fieldName, message) {
    document.getElementById(`${fieldName}-error`).textContent = message;
  }

  function parseScores(value) {
    const values = value.split(",").map((part) => part.trim());
    if (!values.length || values.some((part) => part === "")) return null;
    const scores = values.map(Number);
    if (scores.some((score) => !Number.isFinite(score) || score < 0 || score > 10)) return null;
    return scores;
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    clearErrors();
    const id = elements.id.value.trim();
    const name = elements.name.value.trim().replace(/\s+/g, " ");
    const className = elements.className.value.trim();
    const email = elements.email.value.trim();
    const scores = parseScores(elements.scores.value);
    let valid = true;

    if (!id) {
      setError("id", "Vui lòng nhập mã sinh viên.");
      valid = false;
    } else if (students.some((student) => student.id.toLocaleLowerCase("vi") === id.toLocaleLowerCase("vi") && student.id !== editingId)) {
      setError("id", "Mã sinh viên này đã tồn tại.");
      valid = false;
    }
    if (!name) {
      setError("name", "Vui lòng nhập họ và tên.");
      valid = false;
    }
    if (!className) {
      setError("class", "Vui lòng nhập lớp.");
      valid = false;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("email", "Email chưa đúng định dạng.");
      valid = false;
    }
    if (!scores) {
      setError("scores", "Nhập một hoặc nhiều điểm từ 0 đến 10, cách nhau bằng dấu phẩy.");
      valid = false;
    }
    if (!valid) return;

    const student = { id, name, className, email, scores };
    if (editingId) {
      students = students.map((item) => item.id === editingId ? student : item);
    } else {
      students.push(student);
    }

    if (saveStudents()) {
      closeModal();
      showToast(editingId ? "Đã cập nhật thông tin sinh viên." : "Đã thêm sinh viên mới.");
    }
  }

  function deleteStudent(id) {
    const student = students.find((item) => item.id === id);
    if (!student || !window.confirm(`Bạn có chắc muốn xóa sinh viên "${student.name}" (${student.id})?`)) return;
    students = students.filter((item) => item.id !== id);
    if (saveStudents()) showToast("Đã xóa sinh viên khỏi danh sách.");
  }

  function csvEscape(value) {
    const text = String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function exportCsv() {
    const header = ["Mã sinh viên", "Họ và tên", "Lớp", "Email", "Điểm các môn", "Điểm trung bình", "Xếp loại"];
    const rows = students.map((student) => [
      student.id,
      student.name,
      student.className,
      student.email,
      student.scores.join(", "),
      average(student).toFixed(2),
      gradeFor(average(student)).label
    ]);
    const content = "\uFEFF" + [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `danh-sach-sinh-vien-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast(`Đã xuất ${students.length} sinh viên ra tệp CSV.`);
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let value = "";
    let quoted = false;
    const source = text.replace(/^\uFEFF/, "");

    for (let index = 0; index < source.length; index += 1) {
      const character = source[index];
      if (quoted) {
        if (character === '"' && source[index + 1] === '"') {
          value += '"';
          index += 1;
        } else if (character === '"') {
          quoted = false;
        } else {
          value += character;
        }
      } else if (character === '"' && value === "") {
        quoted = true;
      } else if (character === ",") {
        row.push(value);
        value = "";
      } else if (character === "\n" || character === "\r") {
        if (character === "\r" && source[index + 1] === "\n") index += 1;
        row.push(value);
        if (row.some((cell) => cell.trim() !== "")) rows.push(row);
        row = [];
        value = "";
      } else {
        value += character;
      }
    }

    if (quoted) throw new Error("Tệp CSV có dấu ngoặc kép chưa được đóng.");
    if (value !== "" || row.length) {
      row.push(value);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
    }
    return rows;
  }

  function headerIndex(headers, candidates) {
    return headers.findIndex((header) => candidates.includes(normalizeText(header.trim())));
  }

  async function importCsv(file) {
    try {
      const rows = parseCsv(await file.text());
      if (!rows.length) throw new Error("Tệp CSV không có dữ liệu.");

      const headers = rows[0].map(normalizeText);
      const indexes = {
        id: headerIndex(headers, ["ma sinh vien", "masinhvien", "id", "student id"]),
        name: headerIndex(headers, ["ho va ten", "hoten", "name", "ho ten"]),
        className: headerIndex(headers, ["lop", "class", "classname"]),
        email: headerIndex(headers, ["email"]),
        scores: headerIndex(headers, ["diem cac mon", "diem", "scores", "score"])
      };
      const hasHeader = indexes.id >= 0 && indexes.name >= 0 && indexes.className >= 0 && indexes.scores >= 0;
      if (!hasHeader) {
        throw new Error("Không nhận diện được tiêu đề cột. Cần có: Mã sinh viên, Họ và tên, Lớp, Điểm các môn.");
      }

      const incoming = [];
      let invalidRows = 0;
      rows.slice(1).forEach((row) => {
        const id = (row[indexes.id] || "").trim();
        const name = (row[indexes.name] || "").trim().replace(/\s+/g, " ");
        const className = (row[indexes.className] || "").trim();
        const email = indexes.email >= 0 ? (row[indexes.email] || "").trim() : "";
        const scores = parseScores(row[indexes.scores] || "");
        if (!id || !name || !className || !scores || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
          invalidRows += 1;
          return;
        }
        incoming.push({ id, name, className, email, scores });
      });

      if (!incoming.length) {
        throw new Error("Không có dòng dữ liệu hợp lệ. Hãy kiểm tra mã, tên, lớp và điểm trong tệp.");
      }

      const merged = new Map(students.map((student) => [student.id.toLocaleLowerCase("vi"), student]));
      incoming.forEach((student) => merged.set(student.id.toLocaleLowerCase("vi"), student));
      const previousStudents = students;
      students = Array.from(merged.values());
      if (!saveStudents()) {
        students = previousStudents;
        render();
        return;
      }
      showToast(`Đã nhập ${incoming.length} sinh viên${invalidRows ? `, bỏ qua ${invalidRows} dòng không hợp lệ` : ""}.`);
    } catch (error) {
      showToast(error.message || "Không thể đọc tệp CSV.", true);
    }
  }

  document.getElementById("add-student-button").addEventListener("click", () => openModal());
  document.getElementById("empty-add-button").addEventListener("click", () => openModal());
  document.getElementById("close-modal-button").addEventListener("click", closeModal);
  document.getElementById("cancel-modal-button").addEventListener("click", closeModal);
  elements.modal.addEventListener("click", (event) => {
    if (event.target === elements.modal) closeModal();
  });
  elements.form.addEventListener("submit", handleFormSubmit);
  elements.search.addEventListener("input", render);
  elements.sort.addEventListener("change", render);
  elements.tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const student = students.find((item) => item.id === button.dataset.id);
    if (!student) return;
    if (button.dataset.action === "edit") openModal(student);
    if (button.dataset.action === "delete") deleteStudent(student.id);
  });
  document.getElementById("export-button").addEventListener("click", exportCsv);
  document.getElementById("import-button").addEventListener("click", () => document.getElementById("import-file").click());
  document.getElementById("import-file").addEventListener("change", (event) => {
    const [file] = event.target.files;
    if (file) importCsv(file);
    event.target.value = "";
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.modal.hidden) closeModal();
    if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase("vi") === "k") {
      event.preventDefault();
      elements.search.focus();
    }
  });

  document.getElementById("today-label").textContent = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date());
  render();
}());
