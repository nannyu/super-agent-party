# 灵动岛日历面板 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 4th calendar panel to the Dynamic Island with shared todo data, persistent quick-mode task reminders with complete button, and mini month picker.

**Architecture:** All changes are in the island Vue 3 frontend app (`island-app.js`, `island.html`, `island.css`). No backend changes needed. Tasks and calendar share the same `localStorage` data store under key `island_tasks`, extended with `end_time` and `all_day` fields.

**Tech Stack:** Vue 3 (Options API, CDN global build), Font Awesome 6 icons, CSS (no preprocessor)

## Global Constraints

- Panel indices: 0=weather, 1=music, 2=tasks, 3=calendar
- `end_time` defaults to `due_time + 1 hour` when not provided
- Reminder check runs every 30 seconds via `setInterval`
- Tasks stored in `localStorage` key `island_tasks`
- The island window is 380x360px in large mode, 310x40px in quick
- No backend changes, no Electron changes

---

### Task 1: Extend task data model with end_time and all_day

**Files:**
- Modify: `static/island-app.js` (data, addTask, saveTasks, loadTasks, checkTaskReminders signatures)

**Interfaces:**
- Produces: `addTask(text, dueTime, endTime, allDay, source)` — new signature with 5 params
- Produces: Task objects now have `{ end_time: string|null, all_day: boolean }` fields

- [ ] **Step 1: Add new state fields for calendar**

In `data()` at line ~77, add after `showCompleted: false`:
```js
// Calendar state
calendarSelectedDate: new Date().toISOString().slice(0, 7) + '-' + String(new Date().getDate()).padStart(2, '0'),
showMonthPicker: false,
calendarMonthOffset: 0,
calendarNewTaskText: '',
calendarNewTaskTime: '',
calendarNewTaskAllDay: false,
```

- [ ] **Step 2: Update addTask() signature and logic**

Replace lines 692-707:
```js
addTask(text, dueTime, endTime, allDay, source) {
  if (typeof text !== 'string') text = this.newTaskText;
  const t = (text || '').trim();
  if (!t) return;
  const dTime = dueTime || null;
  const eTime = endTime || null;
  // Default end_time = due_time + 1 hour if due_time is set but end_time is not
  const endVal = eTime || (dTime ? new Date(new Date(dTime).getTime() + 3600000).toISOString() : null);
  this.tasks.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    text: t,
    done: false,
    due_time: dTime,
    end_time: endVal,
    all_day: allDay || false,
    source: source || 'user',
    notified: false,
    created_at: Date.now()
  });
  this.newTaskText = '';
  this.saveTasks();
},
```

- [ ] **Step 3: Save the app**

Verify by checking `localStorage.getItem('island_tasks')` after creating a task — should show new `end_time` and `all_day` fields.

- [ ] **Step 4: Commit**

```bash
git add static/island-app.js
git commit -m "feat: extend task data model with end_time and all_day fields"
```

---

### Task 2: Update panel navigation for 4 panels

**Files:**
- Modify: `static/island-app.js` (onPointerUp, movePanel, switchPanel, panelStyles)
- Modify: `static/island.html` (panel-indicator dots)

**Interfaces:**
- Consumes: `activePanel` can now be 0-3
- Produces: `switchPanel(0-3)`, swipe/wheel support 4 panels

- [ ] **Step 1: Update swipe logic**

In `onPointerUp()` at line ~318, change `2` to `3`:
```js
if (newPanel >= 0 && newPanel <= 3) {
```

- [ ] **Step 2: Update movePanel**

In `movePanel()` at line ~343, change `2` to `3`:
```js
if (next < 0 || next > 3) return;
```

- [ ] **Step 3: Update switchPanel**

In `switchPanel()` at line ~348, change `2` to `3`:
```js
if (idx < 0 || idx > 3) return;
```

- [ ] **Step 4: Add p3 to panelStyles computed**

In `panelStyles()` at line ~135 after the p2 block, add:
```js
p3: (() => {
  const x = (3 - this.activePanel) * 100 + dragPct;
  const dist = Math.abs(x) / 100;
  return { transform: `translateX(${x}%)`, filter: `blur(${dist * maxBlur}px)`, opacity: 1 - dist * 0.5 };
})()
```

- [ ] **Step 5: Add 4th dot to panel-indicator in HTML**

In `island.html` line ~179, after the 3rd dot, add:
```html
<div class="panel-dot" :class="{ active: activePanel === 3 }"
     @click.stop="switchPanel(3)"></div>
```

- [ ] **Step 6: Save and verify**

Open the island, click to large mode, swipe through 4 panels (the 4th will be empty until Task 3). Verify dots are 4 and all work.

- [ ] **Step 7: Commit**

```bash
git add static/island-app.js static/island.html
git commit -m "feat: extend panel navigation to support 4 panels"
```

---

### Task 3: Calendar panel HTML template (Panel 3)

**Files:**
- Modify: `static/island.html` (add calendar panel template after tasks panel)

**Interfaces:**
- Produces: Panel 3 DOM with `.calendar-panel` class, bound to Vue data/methods from Task 1

- [ ] **Step 1: Add calendar panel HTML**

After the tasks-panel div (after line ~170 `</div>` that closes `.tasks-panel`), add:

```html
<!-- 面板4: 日历 -->
<div class="panel calendar-panel" :style="panelStyles.p3">
  <!-- 周选择器 -->
  <div class="cal-week-nav">
    <button class="cal-nav-btn" @click.stop="prevWeek">
      <i class="fa-solid fa-chevron-left"></i>
    </button>
    <span class="cal-week-range">{{ weekRange }}</span>
    <button class="cal-nav-btn" @click.stop="nextWeek">
      <i class="fa-solid fa-chevron-right"></i>
    </button>
    <button class="cal-month-btn" @click.stop="toggleMonthPicker">
      <i class="fa-solid fa-calendar-days"></i>
    </button>
  </div>

  <!-- 星期标头 + 日期行 -->
  <div class="cal-week-header">
    <span class="cal-day-label" v-for="d in weekDayLabels">{{ d }}</span>
  </div>
  <div class="cal-week-days">
    <div class="cal-day-cell" v-for="(d, i) in weekDates"
         :class="{ today: d.isToday, selected: d.date === calendarSelectedDate }"
         @click.stop="selectDate(d.date)">
      <span class="cal-day-num">{{ d.day }}</span>
      <span class="cal-day-dot" v-if="d.hasTask"></span>
    </div>
  </div>

  <!-- 当日任务列表 -->
  <div class="cal-day-header">
    <i class="fa-solid fa-calendar-check"></i>
    <span>{{ selectedDateLabel }}</span>
  </div>
  <div class="cal-tasks-list" ref="calTasksList">
    <div v-if="!dayTasks.length" class="cal-tasks-empty">
      <i class="fa-regular fa-calendar"></i>
      <span>当天没有日程</span>
    </div>
    <div v-for="task in dayTasks" :key="task.id" class="cal-task-row" :class="{ done: task.done }">
      <label class="cal-task-check" @click.stop="toggleTask(task.id)">
        <i :class="task.done ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'"></i>
      </label>
      <div class="cal-task-body">
        <div class="cal-task-text">{{ task.text }}</div>
        <div class="cal-task-time" v-if="!task.all_day">
          <i class="fa-regular fa-clock"></i> {{ formatTaskTime(task.due_time) }}
        </div>
        <div class="cal-task-time" v-else>
          <i class="fa-regular fa-calendar"></i> 全天
        </div>
      </div>
      <button class="cal-task-done-btn" @click.stop="toggleTask(task.id)">
        <i :class="task.done ? 'fa-solid fa-rotate-left' : 'fa-solid fa-check'"></i>
      </button>
      <button class="cal-task-del" @click.stop="deleteTask(task.id)">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  </div>

  <!-- 添加日程 -->
  <div class="cal-add">
    <input type="text" class="cal-add-input" v-model="calendarNewTaskText"
           placeholder="新增日程..."
           @keydown.enter.stop="addCalendarTask"
           @click.stop />
    <button class="cal-add-all-day" :class="{ active: calendarNewTaskAllDay }"
            @click.stop="calendarNewTaskAllDay = !calendarNewTaskAllDay"
            title="全天">
      <i class="fa-regular fa-calendar"></i>
    </button>
    <button class="cal-add-btn" @click.stop="addCalendarTask" :disabled="!calendarNewTaskText.trim()">
      <i class="fa-solid fa-plus"></i>
    </button>
  </div>

  <!-- 月历浮层 -->
  <div class="cal-month-picker" v-if="showMonthPicker" @click.stop>
    <div class="cal-month-picker-nav">
      <button class="cal-nav-btn" @click.stop="prevMonth"><i class="fa-solid fa-chevron-left"></i></button>
      <span>{{ monthPickerLabel }}</span>
      <button class="cal-nav-btn" @click.stop="nextMonth"><i class="fa-solid fa-chevron-right"></i></button>
    </div>
    <div class="cal-month-grid-header">
      <span v-for="d in weekDayLabels">{{ d }}</span>
    </div>
    <div class="cal-month-grid">
      <div class="cal-month-cell" v-for="(cell, i) in monthCalendarDays"
           :class="{ today: cell.isToday, selected: cell.date === calendarSelectedDate, other: cell.otherMonth }"
           @click.stop="jumpToDateFromMonth(cell.date)">
        <span class="cal-month-num">{{ cell.day }}</span>
        <span class="cal-month-dot" v-if="cell.hasTask"></span>
      </div>
    </div>
    <button class="cal-month-close" @click.stop="showMonthPicker = false">
      <i class="fa-solid fa-xmark"></i>
    </button>
  </div>
</div>
```

- [ ] **Step 2: Verify HTML renders**

Reload the island, open large mode, swipe to panel 4. You should see the calendar panel structure (week nav, day cells, empty list, add input). It won't work yet — that's Task 4.

- [ ] **Step 3: Commit**

```bash
git add static/island.html
git commit -m "feat: add calendar panel HTML template (panel 3)"
```

---

### Task 4: Calendar panel Vue logic

**Files:**
- Modify: `static/island-app.js` (computed properties, methods, created hook)

**Interfaces:**
- Consumes: `calendarSelectedDate`, `calendarMonthOffset`, `showMonthPicker` from data (Task 1)
- Consumes: `tasks` array from existing state
- Produces: All calendar computed properties and methods

- [ ] **Step 1: Add calendar computed properties**

After `albumStyle` computed (after line ~149), add:

```js
// Calendar computed
weekDayLabels() {
  return ['一', '二', '三', '四', '五', '六', '日'];
},
weekRange() {
  const d = new Date(this.calendarSelectedDate + 'T00:00:00');
  const day = d.getDay() || 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return `${monday.getMonth()+1}月${monday.getDate()}日 - ${sunday.getMonth()+1}月${sunday.getDate()}日`;
},
weekDates() {
  const d = new Date(this.calendarSelectedDate + 'T00:00:00');
  const day = d.getDay() || 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + 1);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    const ds = dt.toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    days.push({
      date: ds,
      day: dt.getDate(),
      isToday: ds === today,
      hasTask: this.tasks.some(t => !t.done && t.due_time && t.due_time.slice(0, 10) === ds)
    });
  }
  return days;
},
selectedDateLabel() {
  const d = new Date(this.calendarSelectedDate + 'T00:00:00');
  return `${d.getMonth()+1}月${d.getDate()}日 周${this.weekDayLabels[d.getDay() === 0 ? 6 : d.getDay() - 1]}`;
},
dayTasks() {
  return this.tasks.filter(t => t.due_time && t.due_time.slice(0, 10) === this.calendarSelectedDate);
},
allCalendarTasks() {
  return this.tasks.filter(t => t.due_time);
},
monthPickerLabel() {
  const now = new Date();
  const m = new Date(now.getFullYear(), now.getMonth() + this.calendarMonthOffset, 1);
  return `${m.getFullYear()}年${m.getMonth()+1}月`;
},
monthCalendarDays() {
  const now = new Date();
  const m = new Date(now.getFullYear(), now.getMonth() + this.calendarMonthOffset, 1);
  const year = m.getFullYear();
  const month = m.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay() || 7;
  const today = new Date().toISOString().slice(0, 10);
  const days = [];
  for (let i = 1; i < startDow; i++) {
    const pd = new Date(year, month, 1 - (startDow - i));
    const ds = pd.toISOString().slice(0, 10);
    days.push({ date: ds, day: pd.getDate(), otherMonth: true, isToday: ds === today, hasTask: false });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const ds = new Date(year, month, d).toISOString().slice(0, 10);
    days.push({
      date: ds,
      day: d,
      otherMonth: false,
      isToday: ds === today,
      hasTask: this.tasks.some(t => !t.done && t.due_time && t.due_time.slice(0, 10) === ds)
    });
  }
  return days;
},
```

- [ ] **Step 2: Add calendar methods**

After the existing `switchPanel` method (after line ~350), add:

```js
// ===== Calendar =====
selectDate(dateStr) {
  this.calendarSelectedDate = dateStr;
},
prevWeek() {
  const d = new Date(this.calendarSelectedDate + 'T00:00:00');
  d.setDate(d.getDate() - 7);
  this.calendarSelectedDate = d.toISOString().slice(0, 10);
},
nextWeek() {
  const d = new Date(this.calendarSelectedDate + 'T00:00:00');
  d.setDate(d.getDate() + 7);
  this.calendarSelectedDate = d.toISOString().slice(0, 10);
},
toggleMonthPicker() {
  this.showMonthPicker = !this.showMonthPicker;
  this.calendarMonthOffset = 0;
},
prevMonth() {
  this.calendarMonthOffset--;
},
nextMonth() {
  this.calendarMonthOffset++;
},
jumpToDateFromMonth(dateStr) {
  this.calendarSelectedDate = dateStr;
  this.showMonthPicker = false;
  this.calendarMonthOffset = 0;
},
addCalendarTask() {
  const text = this.calendarNewTaskText.trim();
  if (!text) return;
  let dueTime;
  if (this.calendarNewTaskAllDay) {
    dueTime = this.calendarSelectedDate + 'T00:00:00';
  } else if (this.calendarNewTaskTime) {
    dueTime = this.calendarSelectedDate + 'T' + this.calendarNewTaskTime + ':00';
  } else {
    dueTime = this.calendarSelectedDate + 'T09:00:00';
  }
  this.addTask(text, dueTime, null, this.calendarNewTaskAllDay, 'user');
  this.calendarNewTaskText = '';
  this.calendarNewTaskTime = '';
  this.calendarNewTaskAllDay = false;
},
```

- [ ] **Step 3: Add time input to calendar add area**

The calendar add HTML in task 3 only has text + all-day toggle. We need a time input too. Update the calendar add HTML area to include a time selector. In the add area after `@click.stop`, add a time input:

```html
<!-- 添加日程 -->
<div class="cal-add">
  <input type="text" class="cal-add-input" v-model="calendarNewTaskText"
         placeholder="新增日程..."
         @keydown.enter.stop="addCalendarTask"
         @click.stop />
  <input type="time" class="cal-add-time" v-model="calendarNewTaskTime"
         v-if="!calendarNewTaskAllDay"
         @click.stop />
  <button class="cal-add-all-day" :class="{ active: calendarNewTaskAllDay }"
          @click.stop="calendarNewTaskAllDay = !calendarNewTaskAllDay"
          title="全天">
    <i class="fa-regular fa-calendar"></i>
  </button>
  <button class="cal-add-btn" @click.stop="addCalendarTask" :disabled="!calendarNewTaskText.trim()">
    <i class="fa-solid fa-plus"></i>
  </button>
</div>
```

- [ ] **Step 4: Initialize calendarSelectedDate to today**

In `created()` hook, update the init:
```js
created() {
  this.weatherCity = localStorage.getItem('island_weather_city') || '北京';
  this.loadTasks();
  const today = new Date();
  this.calendarSelectedDate = today.toISOString().slice(0, 7) + '-' + String(today.getDate()).padStart(2, '0');
},
```

And remove the default from `data()` (replace it with `calendarSelectedDate: ''`).

In `data()` at line ~77, change:
```js
// Calendar state
calendarSelectedDate: '',
showMonthPicker: false,
calendarMonthOffset: 0,
calendarNewTaskText: '',
calendarNewTaskTime: '',
calendarNewTaskAllDay: false,
```

- [ ] **Step 5: Verify calendar logic**

Reload island, open large mode, swipe to panel 4. Verify:
- Week nav shows correct range
- Clicking day cells switches selected date
- Left/right arrows move week
- Add a task with a time → appears in day list
- Tasks panel also shows the task (shared data)

- [ ] **Step 6: Commit**

```bash
git add static/island-app.js static/island.html
git commit -m "feat: add calendar panel Vue logic - week nav, day list, mini month picker"
```

---

### Task 5: Calendar panel CSS

**Files:**
- Modify: `static/css/island.css` (add all calendar styles)

**Interfaces:**
- Consumes: HTML class names from Task 3

- [ ] **Step 1: Add calendar panel styles**

Append to `island.css`:

```css
/* === 面板4: 日历 === */
.calendar-panel {
  gap: 4px;
  justify-content: flex-start !important;
  padding-top: 4px;
}

/* 周导航 */
.cal-week-nav {
  display: flex; align-items: center; gap: 6px;
  width: 100%; padding: 0 8px;
  margin-bottom: 2px;
}
.cal-nav-btn {
  background: none; border: none;
  color: rgba(255,255,255,0.5);
  width: 24px; height: 24px; border-radius: 6px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 10px; transition: background 0.2s, color 0.2s;
  -webkit-app-region: no-drag;
}
.cal-nav-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
.cal-week-range {
  flex: 1; text-align: center;
  font-size: 12px; font-weight: 500;
}
.cal-month-btn {
  background: none; border: none;
  color: rgba(255,255,255,0.5);
  width: 24px; height: 24px; border-radius: 6px;
  cursor: pointer; font-size: 12px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s, color 0.2s;
  -webkit-app-region: no-drag;
}
.cal-month-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }

/* 星期标头 */
.cal-week-header {
  display: flex; width: 100%; padding: 0 8px;
}
.cal-day-label {
  flex: 1; text-align: center;
  font-size: 9px; color: rgba(255,255,255,0.3);
  font-weight: 500;
}

/* 日期行 */
.cal-week-days {
  display: flex; width: 100%; padding: 2px 8px;
  margin-bottom: 4px;
}
.cal-day-cell {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; padding: 4px 0; border-radius: 8px;
  cursor: pointer; transition: background 0.2s;
  position: relative;
  -webkit-app-region: no-drag;
}
.cal-day-cell:hover { background: rgba(255,255,255,0.06); }
.cal-day-cell.selected { background: rgba(100, 150, 255, 0.25); }
.cal-day-cell.today .cal-day-num {
  color: #6fa8ff; font-weight: 700;
}
.cal-day-num {
  font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.85);
}
.cal-day-dot {
  width: 4px; height: 4px; border-radius: 50%;
  background: #6fff7b; margin-top: 3px;
}

/* 当日标题 */
.cal-day-header {
  display: flex; align-items: center; gap: 6px;
  width: 100%; padding: 0 12px 4px;
  font-size: 12px; color: rgba(255,255,255,0.55);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  margin-bottom: 4px;
}
.cal-day-header i { font-size: 11px; }

/* 当日任务列表 */
.cal-tasks-list {
  flex: 1; width: 100%;
  overflow-y: auto; overflow-x: hidden;
  padding: 2px 8px 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.2) transparent;
}
.cal-tasks-list::-webkit-scrollbar { width: 4px; }
.cal-tasks-list::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.2); border-radius: 4px;
}
.cal-tasks-empty {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 6px; height: 100%; min-height: 50px;
  color: rgba(255,255,255,0.3);
}
.cal-tasks-empty i { font-size: 20px; }
.cal-tasks-empty span { font-size: 11px; }

.cal-task-row {
  display: flex; align-items: flex-start; gap: 6px;
  padding: 6px 4px; border-radius: 6px;
  transition: background 0.2s;
  border-left: 2px solid transparent;
}
.cal-task-row:hover { background: rgba(255,255,255,0.04); }
.cal-task-row.done {
  border-left-color: rgba(120,220,130,0.5);
}
.cal-task-row.done .cal-task-text {
  text-decoration: line-through; color: rgba(255,255,255,0.4);
}

.cal-task-check {
  flex-shrink: 0; font-size: 13px;
  color: rgba(255,255,255,0.5);
  cursor: pointer; display: flex; align-items: center;
  -webkit-app-region: no-drag;
}
.cal-task-row.done .cal-task-check { color: #6fff7b; }

.cal-task-body { flex: 1; min-width: 0; }
.cal-task-text {
  font-size: 12px; font-weight: 500;
  word-break: break-word; line-height: 1.3;
}
.cal-task-time {
  font-size: 10px; color: rgba(255,255,255,0.35);
  margin-top: 2px; display: flex; align-items: center; gap: 4px;
}

.cal-task-del {
  background: none; border: none;
  color: rgba(255,255,255,0.25);
  font-size: 10px; cursor: pointer; flex-shrink: 0;
  width: 20px; height: 20px; border-radius: 5px;
  display: flex; align-items: center; justify-content: center;
  transition: color 0.2s, background 0.2s;
  -webkit-app-region: no-drag;
}
.cal-task-del:hover { color: #ff3f3f; background: rgba(255,63,63,0.12); }

.cal-task-done-btn {
  background: none; border: none;
  color: rgba(255,255,255,0.25); font-size: 10px;
  cursor: pointer; flex-shrink: 0;
  width: 20px; height: 20px; border-radius: 5px;
  display: flex; align-items: center; justify-content: center;
  transition: color 0.3s, background 0.3s;
  -webkit-app-region: no-drag;
}
.cal-task-done-btn:hover { color: #6fff7b; background: rgba(111,255,123,0.15); }
.cal-task-row.done .cal-task-done-btn:hover { color: #ffcc80; background: rgba(255,204,128,0.15); }

/* 添加日程 */
.cal-add {
  display: flex; align-items: center; gap: 4px;
  width: 100%; padding: 4px 8px 4px;
  border-top: 1px solid rgba(255,255,255,0.06);
}
.cal-add-input {
  flex: 1; background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff; font-size: 11px;
  padding: 4px 8px; border-radius: 6px;
  outline: none; font-family: inherit;
  -webkit-app-region: no-drag;
}
.cal-add-input:focus {
  border-color: rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.08);
}
.cal-add-time {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff; font-size: 10px;
  padding: 4px 4px; border-radius: 6px;
  outline: none; font-family: inherit; width: 50px;
  -webkit-app-region: no-drag;
}
.cal-add-time::-webkit-calendar-picker-indicator {
  filter: invert(1); opacity: 0.6;
}
.cal-add-all-day {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.5); font-size: 11px;
  cursor: pointer; padding: 4px 6px; border-radius: 6px;
  transition: all 0.2s;
  -webkit-app-region: no-drag;
}
.cal-add-all-day:hover { background: rgba(255,255,255,0.1); color: #fff; }
.cal-add-all-day.active {
  background: rgba(100,150,255,0.2);
  border-color: rgba(100,150,255,0.4);
  color: #6fa8ff;
}
.cal-add-btn {
  background: rgba(255,255,255,0.1); border: none;
  width: 24px; height: 24px; border-radius: 6px;
  color: #fff; font-size: 10px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.2s, background 0.2s;
  -webkit-app-region: no-drag;
}
.cal-add-btn:hover:not(:disabled) { background: rgba(255,255,255,0.18); transform: scale(1.05); }
.cal-add-btn:disabled { opacity: 0.35; cursor: default; }

/* 月历浮层 */
.cal-month-picker {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(20,20,22,0.97);
  border-radius: 30px;
  display: flex; flex-direction: column;
  padding: 10px 14px;
  z-index: 10;
}
.cal-month-picker-nav {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 8px;
}
.cal-month-picker-nav span {
  flex: 1; text-align: center;
  font-size: 13px; font-weight: 600;
}
.cal-month-grid-header {
  display: grid; grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 9px; color: rgba(255,255,255,0.3);
  margin-bottom: 4px;
}
.cal-month-grid {
  display: grid; grid-template-columns: repeat(7, 1fr);
  flex: 1;
  gap: 2px;
}
.cal-month-cell {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  border-radius: 6px; cursor: pointer;
  transition: background 0.2s; position: relative;
  -webkit-app-region: no-drag;
}
.cal-month-cell:hover { background: rgba(255,255,255,0.06); }
.cal-month-cell.selected { background: rgba(100,150,255,0.25); }
.cal-month-cell.today .cal-month-num { color: #6fa8ff; font-weight: 700; }
.cal-month-cell.otherMonth .cal-month-num {
  color: rgba(255,255,255,0.2);
}
.cal-month-num {
  font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.75);
  line-height: 1.2;
}
.cal-month-dot {
  width: 3px; height: 3px; border-radius: 50%;
  background: #6fff7b; margin-top: 2px;
}
.cal-month-close {
  position: absolute; top: 8px; right: 14px;
  background: none; border: none;
  color: rgba(255,255,255,0.4);
  font-size: 13px; cursor: pointer;
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  transition: color 0.2s, background 0.2s;
  -webkit-app-region: no-drag;
}
.cal-month-close:hover { color: #fff; background: rgba(255,255,255,0.08); }
```

- [ ] **Step 2: Verify visual**

Open island, large mode, swipe to panel 4. Verify all elements are styled correctly — week nav, day cells, task rows, add area, month picker.

- [ ] **Step 3: Commit**

```bash
git add static/css/island.css
git commit -m "feat: add calendar panel CSS styles"
```

---

### Task 6: Persistent quick-mode task reminder with complete button

**Files:**
- Modify: `static/island-app.js` (data, checkTaskReminders, new methods)
- Modify: `static/island.html` (quick/still view reminder template)
- Modify: `static/css/island.css` (reminder styles)

**Interfaces:**
- Consumes: `tasks` array with `end_time` field
- Produces: `activeReminderTask` state, `showReminderTask` computed, `completeReminderTask()` method

- [ ] **Step 1: Add reminder state to data()**

After `alertTimer: null` (line ~69), add:
```js
// Persistent task reminder state
activeReminderTask: null,
reminderTimeoutId: null,
```

- [ ] **Step 2: Add computed for reminder**

After `sortedTasks` computed (~line 119), add:
```js
showReminderInQuick() {
  return this.activeReminderTask !== null && this.mode !== 'large';
},
```

- [ ] **Step 3: Update checkTaskReminders()**

Replace lines 726-746:
```js
checkTaskReminders() {
  const now = Date.now();
  let triggered = false;
  for (const task of this.tasks) {
    if (task.done || task.notified || !task.due_time) continue;
    const due = new Date(task.due_time).getTime();
    if (isNaN(due)) continue;
    const endTime = task.end_time ? new Date(task.end_time).getTime() : due + 3600000;
    if (now < due) continue;
    if (now >= endTime) {
      task.notified = true;
      if (this.activeReminderTask && this.activeReminderTask.id === task.id) {
        this.activeReminderTask = null;
      }
      continue;
    }
    task.notified = true;
    triggered = true;
    this.activeReminderTask = task;
    if (this.mode === 'still') {
      this.setMouseIgnore(false);
    }
  }
  if (triggered) this.saveTasks();
},
```

- [ ] **Step 4: Add completeReminderTask and dismissReminderNote methods**

After `dismissAlert()` (line ~683), add:
```js
completeReminderTask() {
  if (!this.activeReminderTask) return;
  const task = this.tasks.find(t => t.id === this.activeReminderTask.id);
  if (task) { task.done = true; this.saveTasks(); }
  this.activeReminderTask = null;
  this.setMouseIgnore(true);
},
dismissReminderNote() {
  this.activeReminderTask = null;
  this.setMouseIgnore(true);
},
```

- [ ] **Step 5: Add reminder template to HTML**

In `island.html`, after the `<!-- 提醒态（最高优先级） -->` block (which starts at line ~37), replace the entire still/quick view section to include the persistent reminder. The new still/quick view section should be:

Since this is a significant change, I'll show only the diff. Before the existing `alert-content` div (line ~37), add a new block. Actually, the reminder should be rendered instead of alert-content. Let's keep both — the existing transient alert still works for AI reply notifications, and the persistent reminder shows for calendar tasks.

After the existing `alert-content` div (line ~41), add:
```html
<!-- 持久任务提醒（日历触发） -->
<div class="reminder-content" v-if="showReminderInQuick && !alertActive" @click.stop>
  <i class="fa-solid fa-clock reminder-icon"></i>
  <span class="reminder-text">{{ activeReminderTask.text }}</span>
  <button class="reminder-done-btn" @click.stop="completeReminderTask">
    <i class="fa-solid fa-check"></i> 完成
  </button>
</div>
```

And update the `still-content` and `quick-content` conditionals to also hide when the reminder is active. Change line ~44 from:
```html
<div class="still-content" v-if="mode === 'still' && !showMusicQuick && !alertActive">
```
to:
```html
<div class="still-content" v-if="mode === 'still' && !showMusicQuick && !alertActive && !showReminderInQuick">
```

Change line ~49 from:
```html
<div class="quick-content" v-if="isQuickView && !showMusicQuick && !alertActive">
```
to:
```html
<div class="quick-content" v-if="isQuickView && !showMusicQuick && !alertActive && !showReminderInQuick">
```

- [ ] **Step 6: Add reminder CSS**

Append to `island.css`:
```css
/* === 持久任务提醒（日历触发） === */
.reminder-content {
  display: flex; align-items: center; gap: 8px;
  width: 100%; height: 100%;
  padding: 0 12px;
  font-size: 12px; font-weight: 500;
  color: #fff;
  pointer-events: auto;
  -webkit-app-region: no-drag;
  animation: reminderGlow 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
@keyframes reminderGlow {
  0%, 100% { background: linear-gradient(135deg, rgba(50,40,80,0.6), rgba(30,20,40,0.6)); }
  50% { background: linear-gradient(135deg, rgba(60,50,100,0.7), rgba(40,30,60,0.7)); }
}
.reminder-icon {
  font-size: 13px; flex-shrink: 0;
  color: #b8a0ff;
  filter: drop-shadow(0 0 6px rgba(160,120,255,0.5));
}
.reminder-text {
  flex: 1; min-width: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.reminder-done-btn {
  flex-shrink: 0;
  background: rgba(111, 255, 123, 0.18);
  border: 1px solid rgba(111, 255, 123, 0.3);
  color: #6fff7b;
  font-size: 11px; font-weight: 600;
  padding: 3px 10px; border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s, transform 0.15s;
  -webkit-app-region: no-drag;
}
.reminder-done-btn:hover {
  background: rgba(111, 255, 123, 0.3);
  transform: scale(1.05);
}
.reminder-done-btn:active { transform: scale(0.95); }

#island.show-reminder {
  width: 310px !important;
  background: linear-gradient(135deg, #1a1a20, #251a35) !important;
  border: 1px solid rgba(150, 120, 255, 0.35);
}
```

- [ ] **Step 7: Add `show-reminder` class binding to island element**

In `island.html` line ~24, update the `:class` binding:
```html
:class="{ quick: isQuickView || showMusicQuick || alertActive, large: isLargeView, 'has-alert': alertActive, 'show-reminder': showReminderInQuick }"
```

- [ ] **Step 8: Clean up activeReminderTask in loaded tasks**

In `created()` or `mounted()`, add a line to clear stale reminders:
After `this.checkTaskReminders();` in `mounted()` (line ~175), it's already called. But also update the initial check to not set a persistent reminder that predates launch. Add this to `created()`:
```js
this.activeReminderTask = null;
```

- [ ] **Step 9: Verify persistent reminder**

Create a task with a due_time 1 minute in the future. Wait for it. Verify:
- Island expands to 310px wide
- Shows task text + "完成" button
- Clicking "完成" marks task done and shrinks island
- Task text in the list gets strikethrough
- If end_time passes, reminder disappears

- [ ] **Step 10: Commit**

```bash
git add static/island-app.js static/island.html static/css/island.css
git commit -m "feat: add persistent quick-mode task reminder with complete button"
```

---

### Task 7: Update MCP tools for calendar

**Files:**
- Modify: `static/island-app.js` (registerMcpTools, handleMcpCall)

**Interfaces:**
- Consumes: Existing MCP tool registration flow
- Produces: Updated `island_task_create` params, new `island_calendar_list`, `island_calendar_month` tools

- [ ] **Step 1: Update island_task_create tool definition**

In `registerMcpTools()`, change the `island_task_create` tool definition (line ~419) to:
```js
{ name: 'island_task_create', description: '在灵动岛上创建一条待办事项，可关联到日历', parameters: { type: 'object', properties: { text: { type: 'string', description: '待办内容' }, due_time: { type: 'string', description: '开始时间 ISO 格式, 可选' }, end_time: { type: 'string', description: '结束/过期时间 ISO 格式, 可选, 默认 due_time+1h' }, all_day: { type: 'boolean', description: '是否全天事件, 可选' } }, required: ['text'] } },
```

- [ ] **Step 2: Add calendar_list and calendar_month tools**

After `island_task_delete` line ~422, inside the `tools:` array, add:
```js
{ name: 'island_calendar_list', description: '列出指定日期的所有待办事项', parameters: { type: 'object', properties: { date: { type: 'string', description: '日期, YYYY-MM-DD 格式, 默认今天' } }, required: [] } },
{ name: 'island_calendar_month', description: '列出指定月份每天的任务数量', parameters: { type: 'object', properties: { year: { type: 'integer', description: '年份, 如 2025' }, month: { type: 'integer', description: '月份 1-12' } }, required: ['year', 'month'] } }
```

- [ ] **Step 3: Update handleMcpCall for island_task_create**

Replace lines 518-521 (the `island_task_create` case):
```js
case 'island_task_create':
  this.addTask(tp.text, tp.due_time, tp.end_time, tp.all_day, 'ai');
  sendResult('已创建待办: ' + tp.text);
  return;
```

- [ ] **Step 4: Add calendar tool handlers in handleMcpCall**

After the `island_task_delete` case (after line ~541), add:
```js
case 'island_calendar_list':
  const listDate = (tp && tp.date) ? tp.date : new Date().toISOString().slice(0, 10);
  const dayItems = this.tasks.filter(t => t.due_time && t.due_time.slice(0, 10) === listDate);
  if (!dayItems.length) { sendResult(`${listDate} 暂无待办事项`); return; }
  r = dayItems.map(t => (t.done ? '✅' : '⬜') + ' ' + t.text + (t.all_day ? ' (全天)' : '') + (!t.all_day && t.due_time ? ' ' + this.formatTaskTime(t.due_time) : '')).join('\n');
  sendResult(`${listDate} 的待办:\n` + r);
  return;
case 'island_calendar_month':
  const y = tp.year, m = tp.month;
  const daysInMonth = new Date(y, m, 0).getDate();
  const counts = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const n = this.tasks.filter(t => t.due_time && t.due_time.slice(0, 10) === ds).length;
    if (n > 0) counts.push(`${ds}: ${n}个待办`);
  }
  sendResult(counts.length ? `${y}年${m}月: ` + counts.join('; ') : `${y}年${m}月暂无待办`);
  return;
```

- [ ] **Step 5: Verify MCP tools**

Open island, connect to backend, use an AI agent to call:
- `island_task_create` with `due_time`, `end_time`, `all_day`
- `island_calendar_list` for today
- `island_calendar_month` for current month

Verify responses are correct.

- [ ] **Step 6: Commit**

```bash
git add static/island-app.js
git commit -m "feat: update MCP tools for calendar support"
```

---

### Task 8: Final integration and edge case cleanup

**Files:**
- Modify: `static/island-app.js`

**Interfaces:**
- All previous interfaces combined

- [ ] **Step 1: Handle exiting large mode — clear calendar temps**

In `onIslandClick()` method (line ~212), when exiting large mode, close the month picker:
After line ~216 (`this.mode = 'still';`), add:
```js
this.showMonthPicker = false;
```

- [ ] **Step 2: Sort dayTasks by time**

Update the `dayTasks` computed to sort by time:
```js
dayTasks() {
  return this.tasks
    .filter(t => t.due_time && t.due_time.slice(0, 10) === this.calendarSelectedDate)
    .sort((a, b) => {
      if (a.all_day && !b.all_day) return -1;
      if (!a.all_day && b.all_day) return 1;
      if (a.all_day && b.all_day) return 0;
      return (a.due_time || '').localeCompare(b.due_time || '');
    });
},
```

- [ ] **Step 3: Handle pointer events on calendar inputs**

Add calendar input detection to `onPointerDown()` (line ~271). Update the guard:
```js
if (e.target.closest('button') || e.target.closest('input')) return;
```
This already covers inputs. Also check that `onIslandClick` (line ~213) covers the same.

- [ ] **Step 4: Clear reminder when task is deleted from tasks panel**

In `deleteTask()` method, add cleanup for active reminder:
```js
deleteTask(id) {
  if (this.activeReminderTask && this.activeReminderTask.id === id) {
    this.dismissReminderNote();
  }
  this.tasks = this.tasks.filter(t => t.id !== id);
  this.saveTasks();
},
```

- [ ] **Step 5: Clear reminder when task is toggled done from tasks panel**

In `toggleTask()` method:
```js
toggleTask(id) {
  const task = this.tasks.find(t => t.id === id);
  if (task) {
    task.done = !task.done;
    this.saveTasks();
    if (task.done && this.activeReminderTask && this.activeReminderTask.id === id) {
      this.dismissReminderNote();
    }
  }
},
```

- [ ] **Step 6: Verify full flow end-to-end**

1. Create a task from Calendar panel with time "3 minutes from now"
2. Wait for the island to show persistent reminder
3. Click "完成" — task marked done, island shrinks
4. Create a task from Tasks panel with due_time
5. Open Calendar panel, verify it appears on the correct date
6. Open mini month picker, verify task dots appear
7. Delete task from Tasks panel while it's actively reminding — verify reminder clears

- [ ] **Step 7: Commit**

```bash
git add static/island-app.js
git commit -m "fix: edge case cleanup for calendar + reminder integration"
```
