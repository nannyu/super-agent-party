// SAP Dynamic Island - Vue 3 Application Logic
const MY_EXT_ID = 'dynamic_island';

const I18N = {
  'zh-CN': {
    weatherLoading: '加载中...',
    weatherUnknown: '未知',
    weatherCityNotFound: '未找到城市',
    weatherFetchError: '获取失败',
    weatherCodes: {
      0: '晴', 1: '多云', 2: '少云', 3: '晴间多云',
      45: '雾', 48: '雾凇',
      51: '毛毛雨', 53: '小雨', 55: '中雨',
      61: '小雨', 63: '中雨', 65: '大雨',
      71: '小雪', 73: '中雪', 75: '大雪',
      95: '雷暴', 96: '雷暴伴冰雹', 99: '强雷暴伴冰雹'
    },
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    musicNotPlaying: '未在播放',
    tasksHeader: '待办事项',
    tasksShowCompleted: '查看已完成',
    tasksHideCompleted: '隐藏已完成',
    tasksNewPlaceholder: '新增待办...',
    tasksEmpty: '暂无待办事项',
    taskRestore: '恢复',
    taskComplete: '标记完成',
    calendarEmpty: '当天没有日程',
    calendarAllDay: '全天',
    calendarNewPlaceholder: '新增日程...',
    calendarAllDayTitle: '全天',
    pomoReadyFocus: '准备专注',
    pomoReadyBreak: '准备休息',
    pomoFocus: '专注',
    pomoBreak: '休息',
    pomoMin: '分',
    pomoStart: '开始专注',
    pomoPause: '暂停',
    pomoResume: '继续',
    pomoStop: '结束',
    pomoFocusing: '专注中',
    pomoBreaking: '休息中',
    pomoToday: '个',
    pomoTodayMin: '分钟',
    taskCenter: '任务中心',
    taskCenterActive: '个进行中',
    taskCenterEmpty: '暂无子智能体任务',
    taskCenterCompleted: '已完成',
    clipboardHeader: '剪切板',
    clipboardRefresh: '读取剪切板',
    clipboardClear: '清空',
    clipboardSearch: '搜索...',
    clipboardNoMatch: '无匹配结果',
    clipboardEmpty: '剪切板为空，复制内容后自动记录',
    clipboardOpenBrowser: '浏览器打开',
    clipboardOpen: '打开',
    clipboardCompose: '写邮件',
    clipboardPin: '固定',
    clipboardDelete: '删除',
    clipboardImagePlaceholder: '[剪贴板图片]',
    navWeather: '天气',
    navMusic: '音乐',
    navTasks: '任务',
    navCalendar: '日历',
    navPomodoro: '番茄',
    navTaskCenter: '任务中心',
    navClipboard: '剪切板',
    navTranslate: '翻译',
    translateHeader: '翻译',
    translateSourcePlaceholder: '请输入要翻译的文本...',
    translateTargetLang: '目标语言',
    translateSystemLang: '跟随系统',
    translateBtn: '翻译',
    translateResultPlaceholder: '翻译结果将显示在这里',
    translateCopy: '复制',
    translateClear: '清空',
    minimalMode: '极简模式',
    minimalModeClose: '关闭极简模式',
    reminderHint: '点击展开灵动岛查看详情',
    timeJustNow: '刚刚',
    timeMinutesAgo: '分钟前',
    timeHoursAgo: '小时前',
    mcpPlaying: '已播放',
    mcpPaused: '已暂停',
    mcpNext: '已切下一首',
    mcpPrev: '已切上一首',
    mcpMusicInfoNone: '未检测到播放信息',
    mcpWeatherCitySet: '天气城市已设置为',
    mcpTaskCreated: '已创建待办: ',
    mcpTaskNone: '暂无待办事项',
    mcpTaskNotFound: '未找到匹配的待办: ',
    mcpTaskDone: '已完成',
    mcpTaskRestored: '已恢复',
    mcpTaskDeleted: '已删除: ',
    mcpCalendarEmpty: '暂无待办事项',
    mcpCalendarAllDay: ' (全天)',
    mcpCalendarItems: '个待办',
    mcpCalendarYear: '年',
    mcpCalendarMonth: '月',
    mcpCalendarMonthEmpty: '暂无待办',
    mcpPomoStarted: '分钟, 休息',
    mcpPomoStartedPrefix: '番茄钟已启动: 专注',
    mcpPomoStartedSuffix: '分钟',
    mcpPomoNoRunning: '没有正在运行的番茄钟',
    mcpPomoPaused: '番茄钟已暂停',
    mcpPomoResumed: '番茄钟已恢复',
    mcpPomoStopped: '番茄钟已停止',
    mcpPomoNotRunning: '番茄钟未运行。今日已完成',
    mcpPomoPausedStatus: '⏸ 已暂停',
    mcpPomoRunningStatus: '▶ 运行中',
    mcpPomoRemaining: '剩余',
    mcpPomoSession: ' | 专注',
    mcpPomoBreakSession: '分钟 休息',
    mcpPomoToday: '今日: ',
    mcpPomoCount: '个番茄, 共',
    mcpPomoFocusMin: '分钟专注',
    mcpClipboardEmpty: '剪切板历史为空',
    mcpClipboardReading: '正在读取剪切板...',
    mcpClipboardWriteNoText: '请提供要写入的文本',
    mcpClipboardWritten: '已写入剪切板: ',
    mcpClipboardCleared: '剪切板历史已清空',
    mcpUnknownTool: '未知工具: ',
    mcpWeatherDirect: '实时天气:\n温度: ',
    mcpWeatherCondition: '\n天气状况: ',
    mcpWeatherWind: '\n风速: ',
    mcpWeatherUnit: ' km/h',
    mcpWeatherError: '查询天气时出错: ',
    mcpForecastHeader: '的',
    mcpForecastSuffix: '天天气预报:',
    mcpForecastDay: '白天',
    mcpForecastNight: '夜间',
    mcpForecastError: '查询预报时出错: ',
    alertOpenWeb: '打开网页',
    alertCompose: '撰写邮件',
    navHeatmap: '热力图',
    heatmapHeader: '智能体活跃度',
    heatmapEmpty: '暂无活动记录\n聊天、完成任务都会点亮热力图',
    todayCount: '今日 {0}',
    agentDone: '活干完啦，快来看看吧！',
  },
  'en-US': {
    weatherLoading: 'Loading...',
    weatherUnknown: 'Unknown',
    weatherCityNotFound: 'City not found',
    weatherFetchError: 'Failed to fetch',
    weatherCodes: {
      0: 'Clear', 1: 'Cloudy', 2: 'Partly Cloudy', 3: 'Mostly Cloudy',
      45: 'Fog', 48: 'Rime Fog',
      51: 'Drizzle', 53: 'Light Rain', 55: 'Moderate Rain',
      61: 'Light Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
      71: 'Light Snow', 73: 'Moderate Snow', 75: 'Heavy Snow',
      95: 'Thunderstorm', 96: 'Thunderstorm with Hail', 99: 'Severe Thunderstorm'
    },
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    musicNotPlaying: 'Not Playing',
    tasksHeader: 'Tasks',
    tasksShowCompleted: 'Show Completed',
    tasksHideCompleted: 'Hide Completed',
    tasksNewPlaceholder: 'New task...',
    tasksEmpty: 'No tasks',
    taskRestore: 'Restore',
    taskComplete: 'Complete',
    calendarEmpty: 'No events today',
    calendarAllDay: 'All Day',
    calendarNewPlaceholder: 'New event...',
    calendarAllDayTitle: 'All Day',
    pomoReadyFocus: 'Ready to Focus',
    pomoReadyBreak: 'Ready for Break',
    pomoFocus: 'Focus',
    pomoBreak: 'Break',
    pomoMin: 'min',
    pomoStart: 'Start Focus',
    pomoPause: 'Pause',
    pomoResume: 'Resume',
    pomoStop: 'Stop',
    pomoFocusing: 'Focusing',
    pomoBreaking: 'On Break',
    pomoToday: '',
    pomoTodayMin: ' min',
    taskCenter: 'Task Center',
    taskCenterActive: ' active',
    taskCenterEmpty: 'No sub-agent tasks',
    taskCenterCompleted: 'Completed',
    clipboardHeader: 'Clipboard',
    clipboardRefresh: 'Read Clipboard',
    clipboardClear: 'Clear',
    clipboardSearch: 'Search...',
    clipboardNoMatch: 'No matches',
    clipboardEmpty: 'Clipboard is empty. Copied content will appear here.',
    clipboardOpenBrowser: 'Open in Browser',
    clipboardOpen: 'Open',
    clipboardCompose: 'Compose Email',
    clipboardPin: 'Pin',
    clipboardDelete: 'Delete',
    clipboardImagePlaceholder: '[Clipboard Image]',
    navWeather: 'Weather',
    navMusic: 'Music',
    navTasks: 'Tasks',
    navCalendar: 'Calendar',
    navPomodoro: 'Pomodoro',
    navTaskCenter: 'Task Center',
    navClipboard: 'Clipboard',
    navTranslate: 'Translate',
    translateHeader: 'Translate',
    translateSourcePlaceholder: 'Enter text to translate...',
    translateTargetLang: 'Target Language',
    translateSystemLang: 'System Default',
    translateBtn: 'Translate',
    translateResultPlaceholder: 'Translation result will appear here',
    translateCopy: 'Copy',
    translateClear: 'Clear',
    minimalMode: 'Minimal Mode',
    minimalModeClose: 'Close Minimal Mode',
    reminderHint: 'Click to expand Dynamic Island',
    timeJustNow: 'just now',
    timeMinutesAgo: 'm ago',
    timeHoursAgo: 'h ago',
    mcpPlaying: 'Playing',
    mcpPaused: 'Paused',
    mcpNext: 'Next track',
    mcpPrev: 'Previous track',
    mcpMusicInfoNone: 'No playback detected',
    mcpWeatherCitySet: 'Weather city set to: ',
    mcpTaskCreated: 'Task created: ',
    mcpTaskNone: 'No tasks',
    mcpTaskNotFound: 'No matching task: ',
    mcpTaskDone: 'Completed',
    mcpTaskRestored: 'Restored',
    mcpTaskDeleted: 'Deleted: ',
    mcpCalendarEmpty: 'No tasks',
    mcpCalendarAllDay: ' (All Day)',
    mcpCalendarItems: ' tasks',
    mcpCalendarYear: '',
    mcpCalendarMonth: '',
    mcpCalendarMonthEmpty: 'No tasks',
    mcpPomoStarted: 'min focus, ',
    mcpPomoStartedPrefix: 'Pomodoro started: ',
    mcpPomoStartedSuffix: 'min break',
    mcpPomoNoRunning: 'No pomodoro running',
    mcpPomoPaused: 'Pomodoro paused',
    mcpPomoResumed: 'Pomodoro resumed',
    mcpPomoStopped: 'Pomodoro stopped',
    mcpPomoNotRunning: 'No pomodoro running. Today: ',
    mcpPomoPausedStatus: '⏸ Paused',
    mcpPomoRunningStatus: '▶ Running',
    mcpPomoRemaining: 'remaining',
    mcpPomoSession: ' | Focus ',
    mcpPomoBreakSession: 'min  Break ',
    mcpPomoToday: 'Today: ',
    mcpPomoCount: ' pomodoros, ',
    mcpPomoFocusMin: 'min focused',
    mcpClipboardEmpty: 'Clipboard history is empty',
    mcpClipboardReading: 'Reading clipboard...',
    mcpClipboardWriteNoText: 'Please provide text to write',
    mcpClipboardWritten: 'Written to clipboard: ',
    mcpClipboardCleared: 'Clipboard history cleared',
    mcpUnknownTool: 'Unknown tool: ',
    mcpWeatherDirect: 'Current weather:\nTemperature: ',
    mcpWeatherCondition: '\nCondition: ',
    mcpWeatherWind: '\nWind speed: ',
    mcpWeatherUnit: ' km/h',
    mcpWeatherError: 'Weather query error: ',
    mcpForecastHeader: '',
    mcpForecastSuffix: '-day forecast:',
    mcpForecastDay: 'Day',
    mcpForecastNight: 'Night',
    mcpForecastError: 'Forecast query error: ',
    alertOpenWeb: 'Open',
    alertCompose: 'Compose',
    navHeatmap: 'Heatmap',
    heatmapHeader: 'Agent Activity',
    heatmapEmpty: 'No activity yet\nChat, task completions, and more will light up the heatmap',
    todayCount: '{0} today',
    agentDone: 'Task done! Come check it out!',
  }
};

const WEATHER_ICONS = {
  0: 'fa-sun', 1: 'fa-cloud-sun', 2: 'fa-cloud-sun', 3: 'fa-cloud-sun',
  45: 'fa-smog', 48: 'fa-smog',
  51: 'fa-cloud-rain', 53: 'fa-cloud-rain', 55: 'fa-cloud-rain',
  61: 'fa-cloud-rain', 63: 'fa-cloud-rain', 65: 'fa-cloud-showers-heavy',
  71: 'fa-snowflake', 73: 'fa-snowflake', 75: 'fa-snowflake',
  95: 'fa-bolt', 96: 'fa-bolt', 99: 'fa-bolt'
};

const NIGHT_WEATHER_ICONS = {
  0: 'fa-moon', 1: 'fa-cloud-moon', 2: 'fa-cloud-moon', 3: 'fa-cloud-moon'
};

function fmtLocalDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function todayLocalStr() {
  return fmtLocalDate(new Date());
}

function createIslandApp() {
  return Vue.createApp({
    data() {
      return {
        islandLang: 'zh-CN',
        mode: 'still',           // still | quick | large
        activePanel: 0,          // 0=weather, 1=music, 2=tasks, 3=calendar, 4=pomodoro, 5=taskcenter, 6=clipboard, 7=translate, 8=heatmap
        themeMode: 'dark',
        isHovered: false,
        // Music state
        isPlaying: false,
        hasMusic: false,
        currentTrack: '',
        currentArtist: '',
        currentSourceApp: '',
        lastPlayAction: 0,
        musicMissCount: 0,
        volume: 50,
        marqueeAnim: null,

        // Album 3D tilt
        albumRotation: { x: 0, y: 0 },
        albumHovered: false,

        // Weather state
        weatherTemp: null,
        weatherCode: null,
        weatherCity: '北京',
        weatherLoading: false,
        weatherError: null,
        editingCity: false,
        editCityText: '',
        ipLat: null,
        ipLon: null,

        // Time
        currentTime: '',
        currentDate: '',

        // WebSocket
        ws: null,
        reconnectTimer: null,
        musicPollTimer: null,
        weatherTimer: null,

        // Alert state (for task due / AI reply notifications)
        alertActive: false,
        alertText: '',
        alertIcon: 'fa-bell',
        alertDismissible: true,
        alertActionLabel: '',
        alertActionHandler: null,
        alertTimer: null,
        // Persistent task reminder state
        activeReminderTask: null,

        // Tasks state
        tasks: [],
        newTaskText: '',
        showCompleted: false,
        // Calendar state
        calendarSelectedDate: '',
        showMonthPicker: false,
        calendarMonthOffset: 0,
        calendarNewTaskText: '',
        calendarNewTaskHour: '09',
        calendarNewTaskMinute: '00',
        calendarNewTaskAllDay: false,
        // Pomodoro state
        pomodoro: {
          running: false,
          paused: false,
          phase: 'focus',
          focusMinutes: 25,
          breakMinutes: 5,
          remainingSeconds: 1500,
          totalSeconds: 1500,
          taskName: '',
          sessions: []
        },
        pomodoroTimer: null,
        // Task Center state
        centerTasks: [],
        centerTasksLoading: false,
        // Clipboard state
        clipboardHistory: [],
        clipboardSearch: '',
        clipboardPinned: [],
        clipboardTimeout: null,
        // Translate state
        sourceText: '',
        translatedText: '',
        isTranslating: false,
        targetLang: 'system',
        targetLangActual: 'zh-CN',
        translateAbortController: null,
        // Minimal mode state
        isMinimalMode: false,
        // Heatmap state
        heatmapData: {},
        swipeStartX: 0,
        swipeStartY: 0,
        swipeMoved: false,
        dragOffset: 0,
        isDragging: false,
        suppressClick: false
      };
    },

    computed: {
      isNightTime() {
        const h = new Date().getHours();
        return h >= 18 || h < 6;
      },
      weatherDesc() {
        if (this.weatherCode === null) return this.t('weatherLoading');
        const wc = I18N[this.islandLang].weatherCodes[this.weatherCode];
        return wc || this.t('weatherUnknown');
      },
      weatherIcon() {
        if (this.isNightTime && NIGHT_WEATHER_ICONS[this.weatherCode]) {
          return NIGHT_WEATHER_ICONS[this.weatherCode];
        }
        return WEATHER_ICONS[this.weatherCode] || 'fa-cloud';
      },
      isQuickView() {
        return this.mode === 'quick';
      },
      isLargeView() {
        return this.mode === 'large';
      },
      showMusicQuick() {
        return this.hasMusic && this.isPlaying && this.mode === 'still';
      },
      showTimeStill() {
        return !this.hasMusic || !this.isPlaying;
      },
      playIcon() {
        return this.isPlaying ? 'fa-pause' : 'fa-play';
      },
      pendingTaskCount() {
        return this.tasks.filter(t => !t.done).length;
      },
      completedCount() {
        return this.tasks.filter(t => t.done).length;
      },
      sortedTasks() {
        const active = this.tasks.filter(t => !t.done);
        const completed = this.tasks.filter(t => t.done);
        return this.showCompleted ? [...active, ...completed] : active;
      },
      // Reactive panel transforms — triggers Vue re-render on dragOffset change
      panelStyles() {
        const dragPct = this.isDragging ? (this.dragOffset / (this._panelWidth || 420) * 100) : 0;
        const maxBlur = 10;
        return {
          p0: (() => {
            const x = (0 - this.activePanel) * 100 + dragPct;
            const dist = Math.abs(x) / 100;
            return { transform: `translateX(${x}%)`, filter: `blur(${dist * maxBlur}px)`, opacity: 1 - dist * 0.5 };
          })(),
          p1: (() => {
            const x = (1 - this.activePanel) * 100 + dragPct;
            const dist = Math.abs(x) / 100;
            return { transform: `translateX(${x}%)`, filter: `blur(${dist * maxBlur}px)`, opacity: 1 - dist * 0.5 };
          })(),
          p2: (() => {
            const x = (2 - this.activePanel) * 100 + dragPct;
            const dist = Math.abs(x) / 100;
            return { transform: `translateX(${x}%)`, filter: `blur(${dist * maxBlur}px)`, opacity: 1 - dist * 0.5 };
          })(),
          p3: (() => {
            const x = (3 - this.activePanel) * 100 + dragPct;
            const dist = Math.abs(x) / 100;
            return { transform: `translateX(${x}%)`, filter: `blur(${dist * maxBlur}px)`, opacity: 1 - dist * 0.5 };
          })(),
          p4: (() => {
            const x = (4 - this.activePanel) * 100 + dragPct;
            const dist = Math.abs(x) / 100;
            return { transform: `translateX(${x}%)`, filter: `blur(${dist * maxBlur}px)`, opacity: 1 - dist * 0.5 };
          })(),
          p5: (() => {
            const x = (5 - this.activePanel) * 100 + dragPct;
            const dist = Math.abs(x) / 100;
            return { transform: `translateX(${x}%)`, filter: `blur(${dist * maxBlur}px)`, opacity: 1 - dist * 0.5 };
          })(),
          p6: (() => {
            const x = (6 - this.activePanel) * 100 + dragPct;
            const dist = Math.abs(x) / 100;
            return { transform: `translateX(${x}%)`, filter: `blur(${dist * maxBlur}px)`, opacity: 1 - dist * 0.5 };
          })(),
          p7: (() => {
            const x = (7 - this.activePanel) * 100 + dragPct;
            const dist = Math.abs(x) / 100;
            return { transform: `translateX(${x}%)`, filter: `blur(${dist * maxBlur}px)`, opacity: 1 - dist * 0.5 };
          })(),
          p8: (() => {
            const x = (8 - this.activePanel) * 100 + dragPct;
            const dist = Math.abs(x) / 100;
            return { transform: `translateX(${x}%)`, filter: `blur(${dist * maxBlur}px)`, opacity: 1 - dist * 0.5 };
          })()
        };
      },
      heatmapGrid() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weeks = 15;
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - weeks * 7 + 1);
        startDate.setDate(startDate.getDate() - startDate.getDay());
        const grid = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const ds = fmtLocalDate(d);
          const col = Math.floor((d.getTime() - startDate.getTime()) / (7 * 86400000));
          const row = d.getDay();
          if (!grid[col]) grid[col] = [];
          grid[col][row] = { date: ds, count: this.heatmapData[ds] || 0, future: d > today };
        }
        const months = [];
        let lastMonth = -1;
        const monthNames = this.islandLang === 'en-US'
          ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
          : ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
        for (let col = 0; col < grid.length; col++) {
          const midDate = new Date(startDate);
          midDate.setDate(midDate.getDate() + col * 7 + 3);
          const m = midDate.getMonth();
          if (m !== lastMonth) {
            months.push({ col, label: monthNames[m] });
            lastMonth = m;
          }
        }
        const dayLabels = this.islandLang === 'en-US'
          ? ['','Mon','','Wed','','Fri','']
          : ['','一','','三','','五',''];
        return { grid, months, dayLabels };
      },
      heatmapTodayCount() {
        return this.heatmapData[todayLocalStr()] || 0;
      },
      albumStyle() {
        return {
          transform: `rotateX(${this.albumRotation.x}deg) rotateY(${this.albumRotation.y}deg) scale(${this.albumHovered ? 1.25 : 1})`,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.3s ease-out',
          filter: this.albumHovered ? 'brightness(1.1)' : 'none'
        };
      },
      // Calendar computed
      weekDayLabels() {
        return this.islandLang === 'en-US' ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] : ['一','二','三','四','五','六','日'];
      },
      weekRange() {
        const d = new Date(this.calendarSelectedDate + 'T00:00:00');
        const day = d.getDay() || 7;
        const monday = new Date(d);
        monday.setDate(d.getDate() - day + 1);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        if (this.islandLang === 'en-US') {
          const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          return `${months[monday.getMonth()]} ${monday.getDate()} - ${months[sunday.getMonth()]} ${sunday.getDate()}`;
        }
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
          const ds = fmtLocalDate(dt);
          const today = todayLocalStr();
          const pomo = this.pomodoroByDate[ds];
          days.push({
            date: ds,
            day: dt.getDate(),
            isToday: ds === today,
            hasTask: this.tasks.some(t => !t.done && t.due_time && t.due_time.slice(0, 10) === ds),
            hasPomo: !!pomo,
            pomoCount: pomo ? pomo.count : 0,
            pomoMinutes: pomo ? pomo.minutes : 0
          });
        }
        return days;
      },
      selectedDateLabel() {
        const d = new Date(this.calendarSelectedDate + 'T00:00:00');
        const wdIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
        if (this.islandLang === 'en-US') {
          const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          return `${months[d.getMonth()]} ${d.getDate()} ${this.weekDayLabels[wdIdx]}`;
        }
        return `${d.getMonth()+1}月${d.getDate()}日 周${this.weekDayLabels[wdIdx]}`;
      },
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
      showReminderInQuick() {
        return this.activeReminderTask !== null && this.mode !== 'large';
      },
      // Pomodoro computed
      pomodoroRunning() {
        return this.pomodoro.running && !this.pomodoro.paused;
      },
      pomodoroProgress() {
        if (this.pomodoro.totalSeconds <= 0) return 0;
        return 1 - this.pomodoro.remainingSeconds / this.pomodoro.totalSeconds;
      },
      pomodoroDisplayTime() {
        const s = this.pomodoro.remainingSeconds;
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
      },
      pomodoroPhaseLabel() {
        return this.pomodoro.phase === 'focus' ? this.t('pomoFocusing') : this.t('pomoBreaking');
      },
      pomodoroTodayCount() {
        const today = todayLocalStr();
        return this.pomodoro.sessions.filter(s => s.date === today && s.completed).length;
      },
      pomodoroTodayMinutes() {
        const today = todayLocalStr();
        return this.pomodoro.sessions.filter(s => s.date === today && s.completed).reduce((sum, s) => sum + s.focusMin, 0);
      },
      pomodoroByDate() {
        const map = {};
        for (const s of this.pomodoro.sessions) {
          if (!s.completed) continue;
          if (!map[s.date]) map[s.date] = { count: 0, minutes: 0 };
          map[s.date].count++;
          map[s.date].minutes += s.focusMin;
        }
        return map;
      },
      selectedDatePomo() {
        return this.pomodoroByDate[this.calendarSelectedDate] || null;
      },
      showPomodoroInQuick() {
        return this.pomodoro.running && this.mode !== 'large';
      },
      // Task Center computed
      activeCenterTasks() {
        return this.centerTasks.filter(t => t.status === 'running' || t.status === 'pending');
      },
      completedCenterTasks() {
        return this.centerTasks.filter(t => t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled');
      },
      statusBadge() {
        return (status) => {
          const map = { running: '⏳', pending: '🕐', completed: '✅', failed: '❌', cancelled: '🚫' };
          return (map[status] || '❓') + ' ';
        };
      },
      // Clipboard computed
      filteredClipboardHistory() {
        const all = [...this.clipboardPinned.map(id => this.clipboardHistory.find(h => h.id === id)).filter(Boolean), ...this.clipboardHistory.filter(h => !this.clipboardPinned.includes(h.id))];
        if (!this.clipboardSearch) return all;
        const q = this.clipboardSearch.toLowerCase();
        return all.filter(h => h.text.toLowerCase().includes(q));
      },
      pomodoroRingDash() {
        const r = 45, circ = 2 * Math.PI * r;
        return {
          circumference: circ,
          offset: circ * (1 - this.pomodoroProgress)
        };
      },
      monthPickerLabel() {
        const now = new Date();
        const m = new Date(now.getFullYear(), now.getMonth() + this.calendarMonthOffset, 1);
        if (this.islandLang === 'en-US') {
          const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          return `${months[m.getMonth()]} ${m.getFullYear()}`;
        }
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
        const today = todayLocalStr();
        const days = [];
        for (let i = 1; i < startDow; i++) {
          const pd = new Date(year, month, 1 - (startDow - i));
          const ds = fmtLocalDate(pd);
          days.push({ date: ds, day: pd.getDate(), otherMonth: true, isToday: ds === today, hasTask: false, hasPomo: false });
        }
        for (let d = 1; d <= lastDay.getDate(); d++) {
          const ds = fmtLocalDate(new Date(year, month, d));
          const pomo = this.pomodoroByDate[ds];
          days.push({
            date: ds, day: d, otherMonth: false, isToday: ds === today,
            hasTask: this.tasks.some(t => !t.done && t.due_time && t.due_time.slice(0, 10) === ds),
            hasPomo: !!pomo
          });
        }
        return days;
      },
    },

    created() {
      const savedTheme = localStorage.getItem('island_theme');
      if (savedTheme) { this.themeMode = savedTheme; document.documentElement.setAttribute('data-theme', savedTheme); }
      this.weatherCity = localStorage.getItem('island_weather_city') || '北京';
      this.loadTasks();
      try { this.pomodoro.sessions = JSON.parse(localStorage.getItem('island_pomodoro') || '[]'); } catch (e) { this.pomodoro.sessions = []; }
      try { this.clipboardHistory = JSON.parse(localStorage.getItem('island_clipboard') || '[]'); } catch (e) { this.clipboardHistory = []; }
      this.clipboardHistory = this.clipboardHistory.filter(h => h && typeof h.text === 'string');
      this.clipboardHistory.forEach(h => { if (!h.type) h.type = this.detectContentType(h.text || ''); });
      try { this.clipboardPinned = JSON.parse(localStorage.getItem('island_clipboard_pinned') || '[]'); } catch (e) { this.clipboardPinned = []; }
      this.targetLangActual = navigator.language || navigator.userLanguage || 'zh-CN';
      const today = new Date();
      this.calendarSelectedDate = fmtLocalDate(today);
      this.activeReminderTask = null;
    },

    async mounted() {
      await this.fetchLanguage();
      this.connectWS();
      this.updateTime();
      this.timeTimer = setInterval(this.updateTime, 30000);

      // Mouse leave on whole container for focus-out collapse
      const container = this.$el;
      container.addEventListener('mouseleave', this.onContainerLeave);

      // Document-level: clicks outside the island collapse large mode
      document.addEventListener('mousedown', this.onDocMouseDown);

      // Start weather polling
      await this.loadHeatmap();
      await this.tryFetchIpCity();
      this.fetchWeather();
      this.weatherTimer = setInterval(this.fetchWeather, 600000);

      // Start task reminder checker
      this.taskReminderTimer = setInterval(this.checkTaskReminders, 30000);
      this.checkTaskReminders();
      this.taskCenterTimer = setInterval(this.requestTasks, 10000);
      this._pollClipboard();
      this.readCurrentClipboard();

      // Minimal window state
      if (window.electronAPI && window.electronAPI.getMinimalWindowState) {
        window.electronAPI.getMinimalWindowState().then(state => {
          this.isMinimalMode = !!state;
        });
      }
      if (window.electronAPI && window.electronAPI.onMinimalWindowClosed) {
        window.electronAPI.onMinimalWindowClosed(() => {
          this.isMinimalMode = false;
        });
      }
      if (window.electronAPI && window.electronAPI.onLanguageChanged) {
        window.electronAPI.onLanguageChanged(() => {
          this.fetchLanguage();
        });
      }
    },

    beforeUnmount() {
      document.removeEventListener('mousedown', this.onDocMouseDown);
      this.stopMusicPoll();
      this.stopMarquee();
      this.unregisterMcpTools();
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      if (this.timeTimer) clearInterval(this.timeTimer);
      if (this.weatherTimer) clearInterval(this.weatherTimer);
      if (this.taskReminderTimer) clearInterval(this.taskReminderTimer);
      if (this.taskCenterTimer) clearInterval(this.taskCenterTimer);
      if (this.clipboardTimeout) clearTimeout(this.clipboardTimeout);
      this._stopPomodoroTick();
    },

    methods: {
      t(key, arg) {
        const lang = I18N[this.islandLang] || I18N['zh-CN'];
        const str = lang[key] || I18N['zh-CN'][key] || key;
        return arg != null ? str.replace('{0}', arg) : str;
      },
      async fetchLanguage() {
        try {
          const res = await fetch('/cur_language');
          const data = await res.json();
          if (I18N[data.language]) this.islandLang = data.language;
        } catch (e) {
          const navLang = (navigator.language || navigator.userLanguage || '').startsWith('zh') ? 'zh-CN' : 'en-US';
          this.islandLang = navLang;
        }
        document.title = this.islandLang === 'zh-CN' ? '灵动岛' : 'Dynamic Island';
        this.updateTime();
      },

      // ===== Time =====
      updateTime() {
        const n = new Date();
        this.currentTime = n.getHours() + ':' + String(n.getMinutes()).padStart(2, '0');
        const wd = I18N[this.islandLang].weekdays;
        if (this.islandLang === 'en-US') {
          const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          this.currentDate = `${wd[n.getDay()]} ${months[n.getMonth()]} ${n.getDate()}`;
        } else {
          this.currentDate = `${n.getMonth() + 1}月${n.getDate()}日 周${wd[n.getDay()]}`;
        }
      },
      toggleTheme() {
        this.themeMode = this.themeMode === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', this.themeMode);
        localStorage.setItem('island_theme', this.themeMode);
      },
      toggleMinimalMode() {
        if (!window.electronAPI) return;
        if (!this.isMinimalMode) {
          window.electronAPI.openMinimalWindow();
          this.isMinimalMode = true;
        } else {
          window.electronAPI.closeMinimalWindow();
          this.isMinimalMode = false;
        }
      },

      // ===== Mouse Events =====
      onIslandEnter() {
        this.isHovered = true;
        this.setMouseIgnore(false);
        if (this.mode === 'large') return;
        if (this.activeReminderTask || this.pomodoro.running) return;
        this.mode = 'quick';
      },

      onIslandLeave() {
        this.isHovered = false;
        if (this.mode === 'large') return;
        if (this.activeReminderTask || this.pomodoro.running) return;
        this.mode = 'still';
        this.setMouseIgnore(true);
      },

      onIslandClick(e) {
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return;
        if (this.suppressClick) { this.suppressClick = false; return; }
        if (this.mode !== 'large') {
          this.mode = 'large';
          if (this.activeReminderTask) {
            this.activePanel = 3;
          } else if (this.pomodoro.running) {
            this.activePanel = 4;
          }
          this.setMouseIgnore(false);
        }
      },

      onDocMouseDown(e) {
        if (this.mode === 'large') {
          const island = this.$refs.island;
          if (!island || !island.contains(e.target)) {
            this.mode = 'still';
            this.showMonthPicker = false;
            this.setMouseIgnore(true);
          }
        }
      },

      onShieldMouseDown(e) {
        if (this.mode === 'large') {
          this.mode = 'still';
          this.showMonthPicker = false;
          this.setMouseIgnore(true);
        }
      },

      onContainerLeave() {
        if (this.mode !== 'large' && this.isHovered) {
          this.mode = 'still';
          this.isHovered = false;
        }
      },

      onContainerMouseDown(e) {
        if (this.mode === 'large' && e.target === e.currentTarget) {
          this.mode = 'still';
          this.showMonthPicker = false;
          this.setMouseIgnore(true);
        }
      },

      // ===== Album 3D Tilt =====
      onAlbumMouseMove(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;
        const maxDistance = Math.sqrt(rect.width * rect.width + rect.height * rect.height) / 2;
        this.albumRotation.x = (deltaY / maxDistance) * 35;
        this.albumRotation.y = (deltaX / maxDistance) * -35;
      },
      onAlbumMouseLeave() {
        this.albumRotation = { x: 0, y: 0 };
        this.albumHovered = false;
      },

      setMouseIgnore(ignore) {
        if (window.electronAPI && window.electronAPI.setIgnoreMouseEvents) {
          window.electronAPI.setIgnoreMouseEvents(ignore, { forward: true });
        }
      },

      // ===== Swipe =====
      onPointerDown(e) {
        if (this.mode !== 'large') return;
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea') || e.target.closest('select') || e.target.closest('.cal-day-cell') || e.target.closest('.cal-month-cell') || e.target.closest('.cal-add-all-day') || e.target.closest('.pomo-quick')) return;
        this.swipeStartX = e.clientX;
        this.swipeStartY = e.clientY;
        this.swipeMoved = false;
        this.dragOffset = 0;
        this.isDragging = true;
        this.suppressClick = false;
        this._panelWidth = this.$refs.island ? this.$refs.island.offsetWidth : 420;
        // Remove transition on all panels during drag for instant response
        const wrapper = this.$refs.panelsWrapper;
        if (wrapper) {
          wrapper.querySelectorAll('.panel').forEach(p => { p.style.transition = 'none'; });
        }
        const captureEl = this.$refs.island || e.target;
        if (captureEl.setPointerCapture) {
          captureEl.setPointerCapture(e.pointerId);
        }
      },

      onPointerMove(e) {
        if (this.mode !== 'large') return;
        if (!this.isDragging) return;
        const dx = e.clientX - this.swipeStartX;
        const dy = e.clientY - this.swipeStartY;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          this.swipeMoved = true;
        }
        this.dragOffset = dx;
      },

      onPointerUp(e) {
        if (!this.isDragging) return;
        this.isDragging = false;
        if (e.target.releasePointerCapture && e.pointerId != null) {
          e.target.releasePointerCapture(e.pointerId);
        }
        const dx = e.clientX - this.swipeStartX;
        const wrapper = this.$refs.panelsWrapper;
        if (wrapper) {
          wrapper.querySelectorAll('.panel').forEach(p => { p.style.transition = ''; });
        }
        if (this.swipeMoved && Math.abs(dx) > Math.abs(e.clientY - this.swipeStartY)) {
          if (Math.abs(dx) >= 40) {
            const dir = dx < 0 ? 1 : -1;
            const newPanel = this.activePanel + dir;
            if (newPanel >= 0 && newPanel <= 8) {
              this.activePanel = newPanel;
            }
            this.suppressClick = true;
          }
        }
        this.dragOffset = 0;
        this.swipeStartX = 0;
        this.swipeStartY = 0;
      },

      movePanel(dir) {
        const next = this.activePanel + dir;
        if (next < 0 || next > 8) return;
        this.activePanel = next;
      },

      switchPanel(idx) {
        if (idx < 0 || idx > 8) return;
        this.activePanel = idx;
      },

      // ===== Calendar =====
      selectDate(dateStr) {
        this.calendarSelectedDate = dateStr;
      },
      prevWeek() {
        const d = new Date(this.calendarSelectedDate + 'T00:00:00');
        d.setDate(d.getDate() - 7);
        this.calendarSelectedDate = fmtLocalDate(d);
      },
      nextWeek() {
        const d = new Date(this.calendarSelectedDate + 'T00:00:00');
        d.setDate(d.getDate() + 7);
        this.calendarSelectedDate = fmtLocalDate(d);
      },
      toggleMonthPicker() {
        this.showMonthPicker = !this.showMonthPicker;
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
        } else {
          dueTime = this.calendarSelectedDate + 'T' + this.calendarNewTaskHour + ':' + this.calendarNewTaskMinute + ':00';
        }
        this.addTask(text, dueTime, null, this.calendarNewTaskAllDay, 'user');
        this.calendarNewTaskText = '';
        this.calendarNewTaskHour = '09';
        this.calendarNewTaskMinute = '00';
        this.calendarNewTaskAllDay = false;
      },

      // ===== Pomodoro =====
      pomodoroStart() {
        if (this.pomodoro.running) return;
        this.pomodoro.running = true;
        this.pomodoro.paused = false;
        this.pomodoro.phase = 'focus';
        this.pomodoro.totalSeconds = this.pomodoro.focusMinutes * 60;
        this.pomodoro.remainingSeconds = this.pomodoro.totalSeconds;
        this._startPomodoroTick();
      },
      pomodoroPause() {
        if (!this.pomodoro.running) return;
        this.pomodoro.paused = !this.pomodoro.paused;
        if (this.pomodoro.paused) {
          this._stopPomodoroTick();
        } else {
          this._startPomodoroTick();
        }
      },
      pomodoroStop() {
        this._stopPomodoroTick();
        const completed = this.pomodoro.remainingSeconds <= 0;
        if (completed) {
          this.incrementHeatmap();
          this.pomodoro.sessions.push({
            date: todayLocalStr(),
            focusMin: this.pomodoro.focusMinutes,
            breakMin: this.pomodoro.breakMinutes,
            completed: true,
            taskName: this.pomodoro.taskName,
            time: new Date().toISOString()
          });
          if (this.pomodoro.sessions.length > 100) this.pomodoro.sessions = this.pomodoro.sessions.slice(-100);
          localStorage.setItem('island_pomodoro', JSON.stringify(this.pomodoro.sessions));
        }
        this.pomodoro.running = false;
        this.pomodoro.paused = false;
        this.pomodoro.phase = 'focus';
        this.pomodoro.remainingSeconds = this.pomodoro.focusMinutes * 60;
        this.pomodoro.taskName = '';
        this.setMouseIgnore(true);
      },
      pomodoroReset() {
        this.pomodoro.running = false;
        this.pomodoro.paused = false;
        this.pomodoro.phase = 'focus';
        this.pomodoro.remainingSeconds = this.pomodoro.focusMinutes * 60;
        this.pomodoro.totalSeconds = this.pomodoro.focusMinutes * 60;
        this.pomodoro.taskName = '';
        this._stopPomodoroTick();
        this.setMouseIgnore(true);
      },
      _startPomodoroTick() {
        this._stopPomodoroTick();
        this.pomodoroTimer = setInterval(() => {
          if (this.pomodoro.paused) return;
          this.pomodoro.remainingSeconds--;
          if (this.pomodoro.remainingSeconds <= 0) {
            if (this.pomodoro.phase === 'focus') {
              this.pomodoro.phase = 'break';
              this.pomodoro.totalSeconds = this.pomodoro.breakMinutes * 60;
              this.pomodoro.remainingSeconds = this.pomodoro.totalSeconds;
            } else {
              this.pomodoroStop();
            }
          }
        }, 1000);
        if (this.mode === 'still') {
          this.setMouseIgnore(false);
        }
      },
      _stopPomodoroTick() {
        if (this.pomodoroTimer) { clearInterval(this.pomodoroTimer); this.pomodoroTimer = null; }
      },

      // ===== Weather =====
      async tryFetchIpCity() {
        try {
          const res = await fetch('/api/ip-city');
          const data = await res.json();
          if (data.city) {
            this.weatherCity = data.city;
            if (data.lat != null && data.lon != null) {
              this.ipLat = data.lat;
              this.ipLon = data.lon;
            }
            localStorage.setItem('island_weather_city', data.city);
          }
        } catch (e) {
          console.error('[IP City] fetch failed:', e);
        }
      },
      async fetchWeather() {
        if (this.weatherLoading) return;
        this.weatherLoading = true;
        this.weatherError = null;
        try {
          let latitude, longitude;
          if (this.ipLat != null && this.ipLon != null) {
            latitude = this.ipLat;
            longitude = this.ipLon;
          } else {
            const city = this.weatherCity || '北京';
            const isChinese = /[\u4e00-\u9fff]/.test(city);
            const lang = isChinese ? 'zh' : 'en';
            const geoRes = await fetch(`/api/geocode?city=${encodeURIComponent(city)}&lang=${lang}`);
            const geoData = await geoRes.json();
            if (!geoData.results || !geoData.results.length) {
              this.weatherError = this.t('weatherCityNotFound');
              this.weatherLoading = false;
              return;
            }
            latitude = geoData.results[0].latitude;
            longitude = geoData.results[0].longitude;
          }
          const wRes = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
          const wData = await wRes.json();
          if (wData.current_weather) {
            this.weatherTemp = Math.round(wData.current_weather.temperature);
            this.weatherCode = wData.current_weather.weathercode;
          }
        } catch (err) {
          console.error('[Weather] fetch failed:', err);
          this.weatherError = this.t('weatherFetchError');
        }
        this.weatherLoading = false;
      },
      startEditCity() {
        this.editCityText = this.weatherCity;
        this.editingCity = true;
        this.$nextTick(() => {
          const el = this.$refs.cityInput;
          if (el) { el.focus(); el.select(); }
        });
      },
      saveEditCity() {
        const v = (this.editCityText || '').trim();
        if (v && v !== this.weatherCity) {
          this.weatherCity = v;
          this.ipLat = null;
          this.ipLon = null;
          localStorage.setItem('island_weather_city', v);
          this.fetchWeather();
        }
        this.editingCity = false;
      },

      // ===== WebSocket =====
      connectWS() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
        const wsUrl = (location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + location.host + '/ws';
        this.ws = new WebSocket(wsUrl);
        this.ws.onopen = () => {
          this.registerMcpTools();
          if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
          this.requestMusicState();
          this.requestTasks();
          this.startMusicPoll();
        };
        this.ws.onmessage = (e) => {
          try {
            const d = JSON.parse(e.data);
            if (d.type === 'call_mcp_tool') this.handleMcpCall(d.data);
            if (d.type === 'island_music_state') this.handleMusicState(d.data);
            if (d.type === 'island_ai_reply_done') { this.loadHeatmap(); this.showAlert({ icon: 'fa-comment-dots', text: d.data?.text || 'AI 已回复', dismissible: true, duration: 5000 }); }
            if (d.type === 'island_notification') this.showAlert({ icon: d.data?.icon || 'fa-bell', text: d.data?.text || '', dismissible: true, duration: 5000 });
            if (d.type === 'island_task_progress') this.handleTaskProgress(d.data);
            if (d.type === 'island_task_list') this.centerTasks = d.data || [];
            if (d.type === 'task_notification') this.handleTaskNotification(d.data);
            if (d.type === 'island_clipboard_text') {
              const ct = (d.data || '').trim();
              if (ct) this.addClipboardItem(ct, 'system');
            }
          } catch (err) {}
        };
        this.ws.onclose = () => {
          this.ws = null;
          this.stopMusicPoll();
          if (!this.reconnectTimer) this.reconnectTimer = setTimeout(() => this.connectWS(), 5000);
        };
      },

      registerMcpTools() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        this.ws.send(JSON.stringify({ type: 'register_node_extension_mcp', data: { ext_id: MY_EXT_ID, tools: [
          { name: 'island_music_play',  description: '播放/恢复当前音乐', parameters: { type: 'object', properties: {}, required: [] } },
          { name: 'island_music_pause', description: '暂停音乐', parameters: { type: 'object', properties: {}, required: [] } },
          { name: 'island_music_next',  description: '下一首', parameters: { type: 'object', properties: {}, required: [] } },
          { name: 'island_music_prev',  description: '上一首', parameters: { type: 'object', properties: {}, required: [] } },
          { name: 'island_music_get_info', description: '获取当前播放信息', parameters: { type: 'object', properties: {}, required: [] } },
          { name: 'island_music_set_volume', description: '设置音量 0-100', parameters: { type: 'object', properties: { level: { type: 'integer', description: '0-100' } }, required: ['level'] } },
          { name: 'island_weather_get_current', description: '查询指定城市或当前配置城市的实时天气', parameters: { type: 'object', properties: { city: { type: 'string', description: '城市名称' } }, required: [] } },
          { name: 'island_weather_get_forecast', description: '查询指定城市未来几天天气预报', parameters: { type: 'object', properties: { city: { type: 'string', description: '城市名称' }, days: { type: 'integer', description: '预报天数, 默认3' } }, required: [] } },
          { name: 'island_weather_set_city', description: '设置灵动岛天气显示的城市', parameters: { type: 'object', properties: { city: { type: 'string', description: '城市名称' } }, required: ['city'] } },
          { name: 'island_get_time', description: '获取当前日期和时间信息', parameters: { type: 'object', properties: {}, required: [] } },
          { name: 'island_task_create', description: '在灵动岛上创建一条待办事项，可关联到日历', parameters: { type: 'object', properties: { text: { type: 'string', description: '待办内容' }, due_time: { type: 'string', description: '开始时间 ISO 格式, 可选' }, end_time: { type: 'string', description: '结束/过期时间 ISO 格式, 可选, 默认 due_time+1h' }, all_day: { type: 'boolean', description: '是否全天事件, 可选' } }, required: ['text'] } },
          { name: 'island_task_list', description: '列出灵动岛上所有待办事项', parameters: { type: 'object', properties: {}, required: [] } },
          { name: 'island_task_complete', description: '按文本匹配并标记完成灵动岛上的一条待办事项', parameters: { type: 'object', properties: { text: { type: 'string', description: '待办内容关键词（模糊匹配）' } }, required: ['text'] } },
          { name: 'island_task_delete', description: '按文本匹配并删除灵动岛上的一条待办事项', parameters: { type: 'object', properties: { text: { type: 'string', description: '待办内容关键词（模糊匹配）' } }, required: ['text'] } },
          { name: 'island_calendar_list', description: '列出指定日期的所有待办事项', parameters: { type: 'object', properties: { date: { type: 'string', description: '日期, YYYY-MM-DD 格式, 默认今天' } }, required: [] } },
          { name: 'island_calendar_month', description: '列出指定月份每天的任务数量', parameters: { type: 'object', properties: { year: { type: 'integer', description: '年份, 如 2025' }, month: { type: 'integer', description: '月份 1-12' } }, required: ['year', 'month'] } },
          { name: 'island_pomodoro_start', description: '启动番茄钟进行专注计时', parameters: { type: 'object', properties: { focus_minutes: { type: 'integer', description: '专注时长(分钟), 默认25' }, break_minutes: { type: 'integer', description: '休息时长(分钟), 默认5' }, task_name: { type: 'string', description: '任务名称, 可选' } }, required: [] } },
          { name: 'island_pomodoro_pause', description: '暂停/恢复当前番茄钟', parameters: { type: 'object', properties: {}, required: [] } },
          { name: 'island_pomodoro_stop', description: '停止当前番茄钟', parameters: { type: 'object', properties: {}, required: [] } },
          { name: 'island_pomodoro_status', description: '查询当前番茄钟状态', parameters: { type: 'object', properties: {}, required: [] } },
          { name: 'island_pomodoro_history', description: '查询今日番茄钟统计', parameters: { type: 'object', properties: {}, required: [] } },
          { name: 'island_clipboard_list', description: '列出剪切板历史记录', parameters: { type: 'object', properties: { query: { type: 'string', description: '搜索关键词, 可选' } }, required: [] } },
          { name: 'island_clipboard_get', description: '读取系统剪切板当前内容', parameters: { type: 'object', properties: {}, required: [] } },
          { name: 'island_clipboard_write', description: '写入文本到系统剪切板', parameters: { type: 'object', properties: { text: { type: 'string', description: '要写入的文本内容' } }, required: ['text'] } },
          { name: 'island_clipboard_clear', description: '清空剪切板历史', parameters: { type: 'object', properties: {}, required: [] } },
          { name: 'island_translate', description: '翻译文本到指定语言', parameters: { type: 'object', properties: { text: { type: 'string', description: '要翻译的文本' }, target_lang: { type: 'string', description: '目标语言, 如 简体中文、English、日本語 等, 默认跟随系统' } }, required: ['text'] } }
        ] } }));
      },

      unregisterMcpTools() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'unregister_node_extension_mcp', data: { ext_id: MY_EXT_ID } }));
        }
      },

      requestMusicState() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        this.ws.send(JSON.stringify({ type: 'island_poll_music', data: {} }));
      },

      // ===== Task Center =====
      requestTasks() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        this.centerTasksLoading = true;
        this.ws.send(JSON.stringify({ type: 'island_request_tasks', data: {} }));
      },
      handleTaskProgress(data) {
        const idx = this.centerTasks.findIndex(t => t.task_id === data.task_id);
        if (idx >= 0) {
          Object.assign(this.centerTasks[idx], data);
        } else {
          data.description = data.title || '';
          data.created_at = new Date().toISOString();
          this.centerTasks.unshift(data);
        }
      },
      handleTaskNotification(data) {
        this.requestTasks();
        this.loadHeatmap();
        this.showAlert({ icon: 'fa-circle-check', text: this.t('agentDone'), dismissible: true, duration: 5000 });
      },

      // ===== Clipboard =====
      requestClipboard() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        this.ws.send(JSON.stringify({ type: 'island_request_clipboard', data: {} }));
      },
      async readCurrentClipboard() {
        if (window.electronAPI && window.electronAPI.clipboardReadFilePaths) {
          try {
            const filePaths = await window.electronAPI.clipboardReadFilePaths();
            if (filePaths && filePaths.length > 0) {
              for (const fp of filePaths) this.addClipboardItem(fp, 'system');
              return;
            }
          } catch (e) {}
        }
        if (window.electronAPI && window.electronAPI.clipboardRead) {
          try {
            const text = await window.electronAPI.clipboardRead();
            if (text) { this.addClipboardItem(text, 'system'); return; }
          } catch (e) {}
        }
        if (window.electronAPI && window.electronAPI.clipboardReadImage) {
          try {
            const img = await window.electronAPI.clipboardReadImage();
            if (img) { this.addClipboardItem(this.t('clipboardImagePlaceholder'), 'system'); return; }
          } catch (e) {}
        }
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.requestClipboard();
        }
      },
      writeClipboardViaWS(text) {
        if (window.electronAPI && window.electronAPI.clipboardWrite) {
          window.electronAPI.clipboardWrite(text);
        }
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'island_write_clipboard', data: { text: text } }));
        }
      },
      addClipboardItem(text, source) {
        if (!text) return;
        const prev = this.clipboardHistory;
        const latest = prev[0];
        if (latest && latest.text === text) {
          latest.time = Date.now();
          if (!latest.source) latest.source = source || 'manual';
          if (!latest.type) latest.type = this.detectContentType(text);
          this.clipboardHistory = [...prev];
          this.saveClipboard();
          return;
        }
        this.clipboardHistory = [{
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
          text: text,
          time: Date.now(),
          source: source || 'manual',
          type: this.detectContentType(text)
        }, ...prev].slice(0, 100);
        this.saveClipboard();
        if (source === 'system') this._addAlertForItem(this.clipboardHistory[0]);
      },
      saveClipboard() {
        localStorage.setItem('island_clipboard', JSON.stringify(this.clipboardHistory));
      },
      _addAlertForItem(item) {
        const actions = {
          url: { icon: 'fa-globe', label: this.t('alertOpenWeb'), handler: () => this.openUrl(item.text) },
          email: { icon: 'fa-envelope', label: this.t('alertCompose'), handler: () => this.openUrl('mailto:' + item.text) },
        };
        const a = actions[item.type];
        if (!a) return;
        this.showAlert({
          icon: a.icon,
          text: item.text.substring(0, 60) + (item.text.length > 60 ? '...' : ''),
          actionLabel: a.label,
          actionHandler: a.handler,
          duration: 6000,
        });
      },
      copyToClipboard(text) {
        this.writeClipboardViaWS(text);
        this.addClipboardItem(text, 'manual');
      },
      openUrl(url) {
        let finalUrl = url;
        if (!/^https?:\/\/|mailto:|tel:|file:\/\//i.test(url)) {
          finalUrl = 'file://' + (url.startsWith('/') ? '' : '/') + url;
        }
        if (window.electronAPI && window.electronAPI.openExternal) {
          window.electronAPI.openExternal(finalUrl);
        } else {
          window.open(finalUrl, '_blank');
        }
      },
      togglePinClipboard(id) {
        const idx = this.clipboardPinned.indexOf(id);
        if (idx >= 0) {
          this.clipboardPinned.splice(idx, 1);
        } else {
          this.clipboardPinned.unshift(id);
        }
        localStorage.setItem('island_clipboard_pinned', JSON.stringify(this.clipboardPinned));
      },
      isClipboardPinned(id) {
        return this.clipboardPinned.includes(id);
      },
      deleteClipboardItem(id) {
        this.clipboardHistory = this.clipboardHistory.filter(h => h.id !== id);
        this.clipboardPinned = this.clipboardPinned.filter(pid => pid !== id);
        localStorage.setItem('island_clipboard', JSON.stringify(this.clipboardHistory));
        localStorage.setItem('island_clipboard_pinned', JSON.stringify(this.clipboardPinned));
        if (this.clipboardHistory.length === 0) this.writeClipboardViaWS('');
      },
      clearClipboardHistory() {
        this.clipboardHistory = [];
        this.clipboardPinned = [];
        this.clipboardSearch = '';
        localStorage.setItem('island_clipboard', '[]');
        localStorage.setItem('island_clipboard_pinned', '[]');
        this.writeClipboardViaWS('');
      },
      formatClipboardTime(ts) {
        const diff = Date.now() - ts;
        if (diff < 60000) return this.t('timeJustNow');
        if (diff < 3600000) return Math.floor(diff / 60000) + this.t('timeMinutesAgo');
        if (diff < 86400000) return Math.floor(diff / 3600000) + this.t('timeHoursAgo');
        const d = new Date(ts);
        return (d.getMonth()+1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
      },
      typeIcon(type) {
        const icons = { url: 'fa-globe', email: 'fa-envelope', phone: 'fa-phone', image: 'fa-image', audio: 'fa-headphones', video: 'fa-video', file: 'fa-file-lines', json: 'fa-code', text: 'fa-align-left' };
        return 'fa-solid ' + (icons[type] || 'fa-align-left');
      },
      canOpenPath(item) {
        if (item.type === 'url' || item.type === 'email') return true;
        const t = item.text.trim();
        return /^(https?:\/\/|file:\/\/|\/|[A-Za-z]:[\\/])/.test(t);
      },
      detectContentType(text) {
        if (!text) return 'text';
        const t = text.trim();
        if (/\.(mp3|wav|ogg|flac|aac|m4a|wma)$/i.test(t)) return 'audio';
        if (/\.(mp4|webm|mov|avi|mkv|wmv|flv)$/i.test(t)) return 'video';
        if (/\.(png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff)$/i.test(t)) return 'image';
        if (!/^https?:\/\//i.test(t) && /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i.test(t)) return 'file';
        if (/^https?:\/\/[^\s]+$/i.test(t)) return 'url';
        if (/^[\w.-]+@[\w.-]+\.\w+$/.test(t)) return 'email';
        if (/^(\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{4,6})$/.test(t)) return 'phone';
        if (/^[\[\{]/.test(t) && /[\]\}]$/.test(t)) return 'json';
        return 'text';
      },
      _pollClipboard() {
        this.clipboardTimeout = setTimeout(async () => {
          await this.readCurrentClipboard();
          this._pollClipboard();
        }, 3000);
      },

      startMusicPoll() { this.stopMusicPoll(); this.musicPollTimer = setInterval(() => this.requestMusicState(), 2000); },
      stopMusicPoll() { if (this.musicPollTimer) { clearInterval(this.musicPollTimer); this.musicPollTimer = null; } },

      handleMusicState(data) {
        if (data.track) {
          this.musicMissCount = 0;
          const t = data.track.replace(/^["\s]+|["\s]+$/g, '');
          const a = (data.artist || '').replace(/^["\s]+|["\s]+$/g, '');
          if (!this.hasMusic || t !== this.currentTrack || a !== this.currentArtist) {
            this.currentTrack = t;
            this.currentArtist = a;
          }
          this.currentSourceApp = data.sourceAppId || '';
          this.hasMusic = true;
          if (Date.now() - this.lastPlayAction > 2000) {
            this.isPlaying = data.isPlaying === true;
          }
          if (this.showMusicQuick) this.startMarquee();
        } else {
          this.musicMissCount++;
          if (this.musicMissCount >= 3) {
            if (this.hasMusic) {
              this.hasMusic = false;
              this.currentTrack = '';
              this.currentArtist = '';
              this.currentSourceApp = '';
              this.isPlaying = false;
              this.stopMarquee();
            }
            this.musicMissCount = 0;
          }
        }
      },

      handleMcpCall(data) {
        const tn = data.tool_name, tp = data.tool_params, cid = data.call_id;
        let r = '';
        const sendResult = (result) => {
          if (cid && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'mcp_tool_result', data: { call_id: cid, result } }));
          }
        };

        switch (tn) {
          case 'island_music_play': this.sendMusicControl('play'); this.lastPlayAction = Date.now(); this.isPlaying = true; sendResult(this.t('mcpPlaying')); break;
          case 'island_music_pause': this.sendMusicControl('pause'); this.lastPlayAction = Date.now(); this.isPlaying = false; sendResult(this.t('mcpPaused')); break;
          case 'island_music_next': this.sendMusicControl('next'); sendResult(this.t('mcpNext')); setTimeout(() => this.requestMusicState(), 400); setTimeout(() => this.requestMusicState(), 1200); break;
          case 'island_music_prev': this.sendMusicControl('prev'); sendResult(this.t('mcpPrev')); setTimeout(() => this.requestMusicState(), 400); setTimeout(() => this.requestMusicState(), 1200); break;
          case 'island_music_get_info': r = this.currentTrack ? (this.currentTrack + (this.currentArtist ? ' - ' + this.currentArtist : '')) : this.t('mcpMusicInfoNone'); sendResult(r); break;
          case 'island_music_set_volume':
            const l = (tp && tp.level != null) ? Math.max(0, Math.min(100, parseInt(tp.level))) : 50;
            this.volume = l;
            this.sendMusicControl('volume', l);
            sendResult(`音量: ${l}%`);
            break;

          case 'island_weather_get_current':
            const wCity = tp && tp.city ? tp.city : this.weatherCity;
            this.fetchWeatherDirect(wCity, false).then(sendResult);
            return;

          case 'island_weather_get_forecast':
            const fCity = tp && tp.city ? tp.city : this.weatherCity;
            const days = tp && tp.days ? parseInt(tp.days) : 3;
            this.fetchForecast(fCity, Math.min(Math.max(days, 1), 7)).then(sendResult);
            return;

          case 'island_weather_set_city':
            const newCity = tp.city;
            this.weatherCity = newCity;
            localStorage.setItem('island_weather_city', newCity);
            this.fetchWeather();
            sendResult(this.t('mcpWeatherCitySet') + ' ' + newCity);
            return;

          case 'island_get_time':
            const now = new Date();
            const t = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')} 星期${I18N[this.islandLang].weekdays[now.getDay()]}`;
            sendResult(t);
            return;

          case 'island_task_create':
            this.addTask(tp.text, tp.due_time, tp.end_time, tp.all_day, 'ai');
            sendResult(this.t('mcpTaskCreated') + tp.text);
            return;
          case 'island_task_list':
            if (!this.tasks.length) { sendResult(this.t('mcpTaskNone')); return; }
            r = this.tasks.map(t => (t.done ? '✅' : '⬜') + ' ' + t.text + (t.due_time ? ' (到期: ' + this.formatTaskTime(t.due_time) + ')' : '')).join('\n');
            sendResult(r);
            return;
          case 'island_task_complete':
            const ctask = this.tasks.find(t => t.text.includes(tp.text));
            if (!ctask) { sendResult(this.t('mcpTaskNotFound') + tp.text); return; }
            ctask.done = !ctask.done;
            this.saveTasks();
            if (ctask.done) this.incrementHeatmap();
            sendResult((ctask.done ? this.t('mcpTaskDone') : this.t('mcpTaskRestored')) + ': ' + ctask.text);
            return;
          case 'island_task_delete':
            const didx = this.tasks.findIndex(t => t.text.includes(tp.text));
            if (didx === -1) { sendResult(this.t('mcpTaskNotFound') + tp.text); return; }
            const dtxt = this.tasks[didx].text;
            this.tasks.splice(didx, 1);
            this.saveTasks();
            sendResult(this.t('mcpTaskDeleted') + dtxt);
            return;
          case 'island_calendar_list':
            const listDate = (tp && tp.date) ? tp.date : todayLocalStr();
            const dayItems = this.tasks.filter(t => t.due_time && t.due_time.slice(0, 10) === listDate);
            if (!dayItems.length) { sendResult(`${listDate} 暂无待办事项`); return; }
            r = dayItems.map(t => (t.done ? '✅' : '⬜') + ' ' + t.text + (t.all_day ? this.t('mcpCalendarAllDay') : '') + (!t.all_day && t.due_time ? ' ' + this.formatTaskTime(t.due_time) : '')).join('\n');
            sendResult(`${listDate} 的待办:\n` + r);
            return;
          case 'island_calendar_month':
            const y = tp.year, m = tp.month;
            const daysInMonth = new Date(y, m, 0).getDate();
            const counts = [];
            for (let d = 1; d <= daysInMonth; d++) {
              const ds = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
              const n = this.tasks.filter(t => t.due_time && t.due_time.slice(0, 10) === ds).length;
              if (n > 0) counts.push(`${ds}: ${n}${this.t('mcpCalendarItems')}`);
            }
            sendResult(counts.length ? `${y}${this.t('mcpCalendarYear')}${m}${this.t('mcpCalendarMonth')}: ` + counts.join('; ') : `${y}${this.t('mcpCalendarYear')}${m}${this.t('mcpCalendarMonth')}${this.t('mcpCalendarMonthEmpty')}`);
            return;

          case 'island_pomodoro_start':
            if (tp.focus_minutes) this.pomodoro.focusMinutes = Math.max(1, Math.min(120, parseInt(tp.focus_minutes)));
            if (tp.break_minutes) this.pomodoro.breakMinutes = Math.max(1, Math.min(30, parseInt(tp.break_minutes)));
            this.pomodoro.taskName = tp.task_name || '';
            this.pomodoroStart();
            sendResult(this.t('mcpPomoStartedPrefix') + this.pomodoro.focusMinutes + this.t('mcpPomoStarted') + this.pomodoro.breakMinutes + this.t('mcpPomoStartedSuffix') + (this.pomodoro.taskName ? ', 任务: ' + this.pomodoro.taskName : ''));
            return;
          case 'island_pomodoro_pause':
            if (!this.pomodoro.running) { sendResult(this.t('mcpPomoNoRunning')); return; }
            this.pomodoroPause();
            sendResult(this.pomodoro.paused ? this.t('mcpPomoPaused') : this.t('mcpPomoResumed'));
            return;
          case 'island_pomodoro_stop':
            if (!this.pomodoro.running) { sendResult(this.t('mcpPomoNoRunning')); return; }
            this.pomodoroStop();
            sendResult(this.t('mcpPomoStopped'));
            return;
          case 'island_pomodoro_status':
            if (!this.pomodoro.running) { sendResult(this.t('mcpPomoNotRunning') + this.pomodoroTodayCount + this.t('mcpPomoCount') + this.pomodoroTodayMinutes + this.t('mcpPomoFocusMin')); return; }
            sendResult((this.pomodoro.paused ? this.t('mcpPomoPausedStatus') : this.t('mcpPomoRunningStatus')) + ' | ' + this.pomodoroPhaseLabel + ' | ' + this.t('mcpPomoRemaining') + ' ' + this.pomodoroDisplayTime + this.t('mcpPomoSession') + this.pomodoro.focusMinutes + this.t('mcpPomoBreakSession') + this.pomodoro.breakMinutes + this.t('mcpPomoStartedSuffix') + (this.pomodoro.taskName ? ' | 任务: ' + this.pomodoro.taskName : ''));
            return;
          case 'island_pomodoro_history':
            sendResult(this.t('mcpPomoToday') + this.pomodoroTodayCount + this.t('mcpPomoCount') + this.pomodoroTodayMinutes + this.t('mcpPomoFocusMin'));
            return;

          case 'island_clipboard_list':
            const q = (tp && tp.query) || '';
            const items = q ? this.clipboardHistory.filter(h => h.text.toLowerCase().includes(q.toLowerCase())) : this.clipboardHistory;
            if (!items.length) { sendResult(this.t('mcpClipboardEmpty')); return; }
            r = items.slice(0, 10).map(h => `[${this.detectContentType(h.text)}] ${h.text.substring(0, 100)} (${this.formatClipboardTime(h.time)})`).join('\n');
            sendResult('剪切板历史:\n' + r);
            return;
          case 'island_clipboard_get':
            this.requestClipboard();
            sendResult(this.t('mcpClipboardReading'));
            return;
          case 'island_clipboard_write':
            const wtext = tp.text;
            if (!wtext) { sendResult(this.t('mcpClipboardWriteNoText')); return; }
            this.writeClipboardViaWS(wtext);
            this.addClipboardItem(wtext, 'ai');
            sendResult(this.t('mcpClipboardWritten') + wtext.substring(0, 80));
            return;
          case 'island_clipboard_clear':
            this.clearClipboardHistory();
            sendResult(this.t('mcpClipboardCleared'));
            return;

          case 'island_translate':
            const ttext = tp.text;
            const tlang = (tp && tp.target_lang) ? tp.target_lang : this.targetLangActual;
            this.mcpTranslate(ttext, tlang).then(sendResult);
            return;

          default: sendResult(this.t('mcpUnknownTool') + tn);
        }
      },

      async fetchWeatherDirect(city, forecast) {
        try {
          const isChinese = /[\u4e00-\u9fff]/.test(city);
          const lang = isChinese ? 'zh' : 'en';
          const geoRes = await fetch(`/api/geocode?city=${encodeURIComponent(city)}&lang=${lang}`);
          const geoData = await geoRes.json();
          if (!geoData.results || !geoData.results.length) return `${this.t('mcpTaskNotFound').replace(/: $/, '')} "${city}"`;
          const { latitude, longitude } = geoData.results[0];
          const wRes = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
          const wData = await wRes.json();
          const cw = wData.current_weather;
          return `${city}实时天气:\n温度: ${cw.temperature}°C\n天气状况: ${I18N[this.islandLang].weatherCodes[cw.weathercode] || this.t('weatherUnknown')}\n风速: ${cw.windspeed} km/h`;
        } catch (err) {
          return `${this.t('mcpWeatherError')}${err.message}`;
        }
      },

      async fetchForecast(city, days) {
        try {
          const isChinese = /[\u4e00-\u9fff]/.test(city);
          const lang = isChinese ? 'zh' : 'en';
          const geoRes = await fetch(`/api/geocode?city=${encodeURIComponent(city)}&lang=${lang}`);
          const geoData = await geoRes.json();
          if (!geoData.results || !geoData.results.length) return `${this.t('mcpTaskNotFound').replace(/: $/, '')} "${city}"`;
          const { latitude, longitude } = geoData.results[0];
          const wRes = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&forecast_days=${days}`);
          const wData = await wRes.json();
          const daily = wData.daily;
          let lines = [`${city}${this.t('mcpForecastHeader')}${days}${this.t('mcpForecastSuffix')}`];
          for (let i = 0; i < daily.time.length; i++) {
            const wc = I18N[this.islandLang].weatherCodes[daily.weathercode[i]] || this.t('weatherUnknown');
            lines.push(`- ${daily.time[i]}: ${this.t('mcpForecastDay')}${daily.temperature_2m_max[i]}°C/${wc}, ${this.t('mcpForecastNight')}${daily.temperature_2m_min[i]}°C/${wc}`);
          }
          return lines.join('\n');
        } catch (err) {
          return `${this.t('mcpForecastError')}${err.message}`;
        }
      },

      async mcpTranslate(text, targetLang) {
        try {
          const res = await fetch('/simple_chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [
                { role: 'system', content: `你是一位专业翻译，请将用户提供的任何内容严格翻译为${targetLang}，保持原有格式（如Markdown、换行等），不要添加任何额外内容。只需返回翻译结果。` },
                { role: 'user', content: `请翻译以下内容到${targetLang}：\n\n${text}` }
              ],
              stream: false,
              temperature: 0.1
            })
          });
          if (!res.ok) throw new Error('Network error');
          const data = await res.json();
          return data.choices?.[0]?.message?.content || '翻译失败';
        } catch (err) {
          return `翻译出错: ${err.message}`;
        }
      },

      // ===== Music Control =====
      sendMusicControl(action, value) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        this.ws.send(JSON.stringify({ type: 'island_music_control', data: { action, level: value } }));
      },

      togglePlay() {
        if (this.isPlaying) {
          this.sendMusicControl('pause');
          this.isPlaying = false;
        } else {
          this.sendMusicControl('play');
          this.isPlaying = true;
        }
        this.lastPlayAction = Date.now();
      },

      skipTrack(dir) {
        this.sendMusicControl(dir > 0 ? 'next' : 'prev');
        setTimeout(() => this.requestMusicState(), 400);
        setTimeout(() => this.requestMusicState(), 1200);
      },

      // ===== Marquee =====
      // 用单段文字 + 复制的方式做无缝循环。关键点：
      //   1. 两个 item 之间的间距应该等于容器宽度 (boxWidth)，这样一次只看到一段歌词，
      //      第二段从右边出来时第一段已经从左边消失，避免视觉重叠。
      //   2. 动画位移 = itemWidth + spacing，end-start 完全等于循环周期，无缝衔接。
      //   3. 每秒检测一次动画是否还在跑 (playState === 'running')，跑马灯卡住就重启。
      startMarquee() {
        const text = this.currentTrack + (this.currentArtist ? '  \u2022  ' + this.currentArtist : '');
        const changed = this._marqueeText !== text;
        this._marqueeText = text;
        if (!changed && this.marqueeAnim && this.marqueeAnim.playState === 'running') return;
        this.stopMarquee();
        if (!text) return;
        // 等待 DOM 渲染完成 (v-if 切换 / 文本变化)
        this.$nextTick(() => this._buildMarquee());
      },

      _buildMarquee() {
        const track = this.$refs.marqueeTrack;
        if (!track) return;
        const items = track.querySelectorAll('.marquee-item');
        if (items.length < 2) return;
        const a = items[0];
        const b = items[1];
        const box = track.parentElement;
        if (!box) return;
        const itemWidth = a.offsetWidth;
        const boxWidth = box.offsetWidth;
        if (!itemWidth || !boxWidth) return;
        // 间距略小于容器宽度，保证一次只显示一段但留出微小余量
        const spacing = Math.max(boxWidth - 8, itemWidth);
        // 通过 margin 而非 CSS gap 控制间距，避免和 JS 计算冲突
        a.style.marginRight = spacing + 'px';
        b.style.marginRight = spacing + 'px';
        const itemStep = itemWidth + spacing;
        // 速度：每秒约 35 像素
        const dur = Math.max(8000, (itemStep / 35) * 1000);
        this.marqueeAnim = track.animate(
          [
            { transform: 'translateX(0)' },
            { transform: `translateX(-${itemStep}px)` }
          ],
          { duration: dur, iterations: Infinity, easing: 'linear' }
        );
        // 兜底：检测卡死 (浏览器在最小化/切换 tab 时会暂停动画，恢复后可能不自动 play)
        if (this.marqueeTimer) clearInterval(this.marqueeTimer);
        this.marqueeTimer = setInterval(() => {
          if (!this.isPlaying || this.mode === 'large') return;
          if (!this.marqueeAnim) {
            this._buildMarquee();
          } else if (this.marqueeAnim.playState !== 'running') {
            this.marqueeAnim.play();
          }
        }, 1000);
      },

      stopMarquee() {
        if (this.marqueeAnim) { this.marqueeAnim.cancel(); this.marqueeAnim = null; }
        if (this.marqueeTimer) { clearInterval(this.marqueeTimer); this.marqueeTimer = null; }
      },

      closeWindow() {
        if (window.electronAPI && window.electronAPI.closeIslandWindow) {
          window.electronAPI.closeIslandWindow();
        }
      },

      // ===== Alert =====
      showAlert({ icon = 'fa-bell', text = '', dismissible = true, duration = 5000, actionLabel = '', actionHandler = null }) {
        this.alertIcon = icon;
        this.alertText = text;
        this.alertDismissible = dismissible;
        this.alertActionLabel = actionLabel;
        this.alertActionHandler = actionHandler;
        this.alertActive = true;
        if (this.alertTimer) clearTimeout(this.alertTimer);
        if (duration > 0) this.alertTimer = setTimeout(() => this.dismissAlert(), duration);
      },
      dismissAlert() {
        this.alertActive = false;
        this.alertActionLabel = '';
        this.alertActionHandler = null;
        if (this.alertTimer) { clearTimeout(this.alertTimer); this.alertTimer = null; }
      },
      heatmapColor(count) {
        const level = count <= 0 ? 0 : Math.min(4, Math.ceil(count / 5));
        return `var(--heatmap-${level})`;
      },
      incrementHeatmap() {
        const today = todayLocalStr();
        this.heatmapData[today] = (this.heatmapData[today] || 0) + 1;
        fetch('/api/heatmap/increment', { method: 'POST' }).catch(() => {});
      },
      async loadHeatmap() {
        try {
          const res = await fetch('/api/heatmap');
          const data = await res.json();
          if (data && typeof data === 'object') this.heatmapData = data;
        } catch (e) {
          console.error('[Heatmap] load failed:', e);
        }
      },
      completeReminderTask() {
        if (!this.activeReminderTask) return;
        const task = this.tasks.find(t => t.id === this.activeReminderTask.id);
        if (task) { task.done = true; this.saveTasks(); this.incrementHeatmap(); }
        this.activeReminderTask = null;
        this.setMouseIgnore(true);
      },
      dismissReminderNote() {
        this.activeReminderTask = null;
        this.setMouseIgnore(true);
      },

      // ===== Tasks =====
      loadTasks() {
        try { this.tasks = JSON.parse(localStorage.getItem('island_tasks') || '[]'); } catch (e) { this.tasks = []; }
      },
      saveTasks() {
        localStorage.setItem('island_tasks', JSON.stringify(this.tasks));
      },
      addTask(text, dueTime, endTime, allDay, source) {
        if (typeof text !== 'string') text = this.newTaskText;
        const t = (text || '').trim();
        if (!t) return;
        const dTime = dueTime || null;
        const eTime = endTime || null;
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
      toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
          task.done = !task.done;
          this.saveTasks();
          if (task.done) this.incrementHeatmap();
          if (task.done && this.activeReminderTask && this.activeReminderTask.id === id) {
            this.dismissReminderNote();
          }
        }
      },
      deleteTask(id) {
        if (this.activeReminderTask && this.activeReminderTask.id === id) {
          this.dismissReminderNote();
        }
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
      },
      formatTaskTime(isoStr) {
        if (!isoStr) return '';
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) {
          const m = /(\d{1,2}):(\d{2})/.exec(isoStr);
          if (m) return m[1] + ':' + m[2];
          return isoStr;
        }
        return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
      },
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
      // ===== Translate =====
      async handleTranslate() {
        if (!this.sourceText.trim() || this.isTranslating) return;
        this.isTranslating = true;
        this.translatedText = '...';

        const controller = new AbortController();
        this.translateAbortController = controller;

        const lang = this.targetLangActual;

        try {
          const res = await fetch('/simple_chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [
                {
                  role: 'system',
                  content: `你是一位专业翻译，请将用户提供的任何内容严格翻译为${lang}，保持原有格式（如Markdown、换行等），不要添加任何额外内容。只需返回翻译结果。如果被翻译的文字与目标语言一致，则返回原文即可。`
                },
                {
                  role: 'user',
                  content: `请翻译以下内容到${lang}：\n\n${this.sourceText}`
                }
              ],
              stream: true,
              temperature: 0.1
            }),
            signal: controller.signal
          });

          if (!res.ok) throw new Error('Network error');

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let result = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();
            for (const line of lines) {
              if (!line) continue;
              try {
                const chunk = JSON.parse(line);
                const delta = chunk.choices?.[0]?.delta?.content ?? '';
                if (delta) {
                  result += delta;
                  this.translatedText = result;
                }
              } catch {}
            }
          }
        } catch (e) {
          if (e.name !== 'AbortError') {
            this.translatedText = 'Translation error: ' + e.message;
          }
        } finally {
          this.isTranslating = false;
          this.translateAbortController = null;
        }
      },
      abortTranslate() {
        if (this.translateAbortController) {
          this.translateAbortController.abort();
        }
        this.isTranslating = false;
      },
      clearTranslate() {
        this.sourceText = '';
        this.translatedText = '';
      },
      copyTranslated() {
        if (!this.translatedText) return;
        this.writeClipboardViaWS(this.translatedText);
        this.addClipboardItem(this.translatedText, 'manual');
      },
      changeTranslateLang() {
        if (this.targetLang === 'system') {
          this.targetLangActual = navigator.language || navigator.userLanguage || 'zh-CN';
        } else {
          this.targetLangActual = this.targetLang;
        }
      }
    },

    watch: {
      showMusicQuick(val) {
        if (!val) {
          this.stopMarquee();
        } else if (this.isPlaying) {
          this.$nextTick(() => this.startMarquee());
        }
      },
      isPlaying(val) {
        if (val && this.showMusicQuick) {
          this.startMarquee();
        } else {
          this.stopMarquee();
        }
      },
      mode(val, oldVal) {
        if (val === 'large') {
          this.stopMarquee();
        } else {
          if (oldVal === 'large') {
            // Only full restart when exiting large mode
            this.stopMarquee();
            if (this.showMusicQuick) {
              this.$nextTick(() => this.startMarquee());
            }
          } else if (!this.marqueeAnim && this.showMusicQuick) {
            this.startMarquee();
          }
        }
      }
    }
  });
}
