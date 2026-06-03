import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import './App.css'

type TaskStatus = 'todo' | 'in-progress' | 'completed'
type TaskPriority = 'urgent' | 'important' | 'normal' | 'low'
type Page = 'today' | 'tasks' | 'calendar' | 'projects' | 'review' | 'settings'

interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  projectId?: string
  dueDate?: string
  estimatedMinutes?: number
  isDailyFocus: boolean
  completedAt?: string
  createdAt: string
}

interface Project {
  id: string
  name: string
  description: string
  color: string
  createdAt: string
}

interface TaskDraft {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  projectId: string
  dueDate: string
  estimatedMinutes: string
}

const STORAGE_KEY = 'focusflow-data-v1'
const today = toDateInput(new Date())
const emptyDraft: TaskDraft = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'normal',
  projectId: '',
  dueDate: today,
  estimatedMinutes: '60',
}

const priorityLabel: Record<TaskPriority, string> = {
  urgent: '紧急',
  important: '重要',
  normal: '普通',
  low: '低优先级',
}

const statusLabel: Record<TaskStatus, string> = {
  todo: '待处理',
  'in-progress': '进行中',
  completed: '已完成',
}

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10)
}

function offsetDate(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return toDateInput(date)
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createSeedData(): { tasks: Task[]; projects: Project[] } {
  const now = new Date().toISOString()
  const projects: Project[] = [
    { id: 'portfolio', name: '个人作品集网站', description: '完成设计、开发与部署，建立个人线上展示窗口。', color: '#6d5dfc', createdAt: now },
    { id: 'growth', name: '职业成长计划', description: '整理学习路径，持续积累专业能力。', color: '#f59e72', createdAt: now },
    { id: 'daily', name: '日常工作', description: '管理会议、沟通和常规事项。', color: '#58b991', createdAt: now },
  ]
  const tasks: Task[] = [
    { id: 't1', title: '完成首页视觉设计', description: '完善首页卡片布局与响应式细节。', status: 'in-progress', priority: 'important', projectId: 'portfolio', dueDate: today, estimatedMinutes: 120, isDailyFocus: true, createdAt: now },
    { id: 't2', title: '整理需求评审会议记录', description: '将结论同步到工作计划中。', status: 'todo', priority: 'normal', projectId: 'daily', dueDate: today, estimatedMinutes: 45, isDailyFocus: false, createdAt: now },
    { id: 't3', title: '编写本周工作总结', description: '归纳完成事项与下周重点。', status: 'todo', priority: 'important', projectId: 'daily', dueDate: today, estimatedMinutes: 60, isDailyFocus: true, createdAt: now },
    { id: 't4', title: '回复合作方邮件', description: '', status: 'completed', priority: 'normal', projectId: 'daily', dueDate: today, estimatedMinutes: 20, isDailyFocus: false, completedAt: now, createdAt: now },
    { id: 't5', title: '整理 TypeScript 学习笔记', description: '梳理泛型与类型收窄示例。', status: 'todo', priority: 'low', projectId: 'growth', dueDate: offsetDate(2), estimatedMinutes: 90, isDailyFocus: false, createdAt: now },
    { id: 't6', title: '确定作品集项目案例', description: '', status: 'completed', priority: 'important', projectId: 'portfolio', dueDate: offsetDate(-2), estimatedMinutes: 75, isDailyFocus: false, completedAt: now, createdAt: now },
    { id: 't7', title: '补充项目介绍文案', description: '为作品集准备三个案例简介。', status: 'todo', priority: 'urgent', projectId: 'portfolio', dueDate: offsetDate(-1), estimatedMinutes: 90, isDailyFocus: true, createdAt: now },
    { id: 't8', title: '制定六月阅读计划', description: '', status: 'todo', priority: 'normal', projectId: 'growth', dueDate: offsetDate(5), estimatedMinutes: 40, isDailyFocus: false, createdAt: now },
    { id: 't9', title: '完成简历内容更新', description: '', status: 'completed', priority: 'important', projectId: 'growth', dueDate: offsetDate(-4), estimatedMinutes: 120, isDailyFocus: false, completedAt: now, createdAt: now },
  ]
  return { tasks, projects }
}

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as { tasks: Task[]; projects: Project[] }) : createSeedData()
  } catch {
    return createSeedData()
  }
}

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    today: <><path d="M4 5.5h16" /><path d="M7 3v5M17 3v5" /><rect x="4" y="4" width="16" height="17" rx="3" /><path d="m8 14 2.5 2.5L16 11" /></>,
    tasks: <><path d="M9 6h11M9 12h11M9 18h11" /><path d="m4 6 1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" /></>,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M8 2v4M16 2v4M3 10h18" /></>,
    projects: <><path d="M3 7.5a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /></>,
    review: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.06.06-2.78 2.78-.06-.06A1.8 1.8 0 0 0 15 19.4a1.8 1.8 0 0 0-1 .6l-.08.08h-3.84L10 20a1.8 1.8 0 0 0-1-.6 1.8 1.8 0 0 0-1.98.36l-.06.06-2.78-2.78.06-.06A1.8 1.8 0 0 0 4.6 15a1.8 1.8 0 0 0-.6-1l-.08-.08v-3.84L4 10a1.8 1.8 0 0 0 .6-1 1.8 1.8 0 0 0-.36-1.98l-.06-.06 2.78-2.78.06.06A1.8 1.8 0 0 0 9 4.6a1.8 1.8 0 0 0 1-.6l.08-.08h3.84L14 4a1.8 1.8 0 0 0 1 .6 1.8 1.8 0 0 0 1.98-.36l.06-.06 2.78 2.78-.06.06A1.8 1.8 0 0 0 19.4 9c.16.37.36.7.6 1l.08.08v3.84L20 14c-.24.3-.44.63-.6 1Z" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 5 5" /></>,
    star: <path d="m12 3 2.8 5.68 6.27.91-4.54 4.42 1.07 6.24L12 17.3l-5.6 2.95 1.07-6.24-4.54-4.42 6.27-.91Z" />,
    edit: <><path d="m14 4 6 6M4 20l4.5-1 11-11a2.12 2.12 0 0 0-3-3l-11 11Z" /></>,
    trash: <><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    chevronLeft: <path d="m15 18-6-6 6-6" />,
    chevronRight: <path d="m9 18 6-6-6-6" />,
    reset: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v6h6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
  }
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function App() {
  const initial = useMemo(() => loadData(), [])
  const [tasks, setTasks] = useState<Task[]>(initial.tasks)
  const [projects, setProjects] = useState<Project[]>(initial.projects)
  const [page, setPage] = useState<Page>('today')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus | 'overdue'>('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState(today)
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string>()
  const [draft, setDraft] = useState<TaskDraft>(emptyDraft)
  const [toast, setToast] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, projects }))
  }, [tasks, projects])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  const projectMap = useMemo(() => Object.fromEntries(projects.map((project) => [project.id, project])), [projects])
  const isOverdue = (task: Task) => task.status !== 'completed' && Boolean(task.dueDate && task.dueDate < today)
  const todayTasks = tasks.filter((task) => task.dueDate === today || isOverdue(task))
  const completedToday = todayTasks.filter((task) => task.status === 'completed').length
  const completionRate = todayTasks.length ? Math.round((completedToday / todayTasks.length) * 100) : 0
  const focusTasks = tasks.filter((task) => task.isDailyFocus && task.status !== 'completed')

  function showToast(message: string) {
    setToast(message)
  }

  function openCreate(dueDate = today) {
    setEditingId(undefined)
    setDraft({ ...emptyDraft, dueDate })
    setModalOpen(true)
  }

  function openEdit(task: Task) {
    setEditingId(task.id)
    setDraft({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      projectId: task.projectId ?? '',
      dueDate: task.dueDate ?? '',
      estimatedMinutes: task.estimatedMinutes?.toString() ?? '',
    })
    setModalOpen(true)
  }

  function saveTask(event: FormEvent) {
    event.preventDefault()
    if (!draft.title.trim()) return
    if (editingId) {
      setTasks((current) => current.map((task) => task.id === editingId ? {
        ...task,
        ...draft,
        title: draft.title.trim(),
        projectId: draft.projectId || undefined,
        dueDate: draft.dueDate || undefined,
        estimatedMinutes: draft.estimatedMinutes ? Number(draft.estimatedMinutes) : undefined,
        completedAt: draft.status === 'completed' ? (task.completedAt ?? new Date().toISOString()) : undefined,
      } : task))
      showToast('任务已更新')
    } else {
      setTasks((current) => [{
        id: uid(),
        ...draft,
        title: draft.title.trim(),
        projectId: draft.projectId || undefined,
        dueDate: draft.dueDate || undefined,
        estimatedMinutes: draft.estimatedMinutes ? Number(draft.estimatedMinutes) : undefined,
        isDailyFocus: false,
        completedAt: draft.status === 'completed' ? new Date().toISOString() : undefined,
        createdAt: new Date().toISOString(),
      }, ...current])
      showToast('任务已创建')
    }
    setModalOpen(false)
  }

  function toggleComplete(task: Task) {
    setTasks((current) => current.map((item) => item.id === task.id ? {
      ...item,
      status: item.status === 'completed' ? 'todo' : 'completed',
      completedAt: item.status === 'completed' ? undefined : new Date().toISOString(),
      isDailyFocus: item.status === 'completed' ? item.isDailyFocus : false,
    } : item))
  }

  function toggleFocus(task: Task) {
    if (!task.isDailyFocus && focusTasks.length >= 3) {
      showToast('今日焦点最多设置 3 项')
      return
    }
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, isDailyFocus: !item.isDailyFocus } : item))
  }

  function deleteTask(task: Task) {
    if (!window.confirm(`确定删除“${task.title}”吗？`)) return
    setTasks((current) => current.filter((item) => item.id !== task.id))
    showToast('任务已删除')
  }

  function resetData() {
    if (!window.confirm('确定恢复演示数据吗？当前数据将被替换。')) return
    const data = createSeedData()
    setTasks(data.tasks)
    setProjects(data.projects)
    showToast('演示数据已恢复')
  }

  function clearData() {
    if (!window.confirm('确定清空全部任务和项目吗？此操作无法撤销。')) return
    setTasks([])
    setProjects([])
    showToast('全部数据已清空')
  }

  return (
    <div className="app-shell">
      <Sidebar page={page} onNavigate={setPage} />
      <main className="main-content">
        <Header page={page} search={search} onSearch={setSearch} onCreate={() => openCreate()} />
        {page === 'today' && <TodayPage tasks={tasks} projects={projectMap} focusTasks={focusTasks} completionRate={completionRate} completedToday={completedToday} onToggleComplete={toggleComplete} onToggleFocus={toggleFocus} onEdit={openEdit} onDelete={deleteTask} onCreate={openCreate} />}
        {page === 'tasks' && <TasksPage tasks={tasks} projects={projects} projectMap={projectMap} search={search} statusFilter={statusFilter} projectFilter={projectFilter} isOverdue={isOverdue} onStatusFilter={setStatusFilter} onProjectFilter={setProjectFilter} onToggleComplete={toggleComplete} onToggleFocus={toggleFocus} onEdit={openEdit} onDelete={deleteTask} />}
        {page === 'calendar' && <CalendarPage tasks={tasks} projects={projectMap} selectedDate={selectedDate} calendarDate={calendarDate} onSelectedDate={setSelectedDate} onCalendarDate={setCalendarDate} onCreate={openCreate} onToggleComplete={toggleComplete} onEdit={openEdit} />}
        {page === 'projects' && <ProjectsPage tasks={tasks} projects={projects} onEdit={openEdit} />}
        {page === 'review' && <ReviewPage tasks={tasks} projects={projects} />}
        {page === 'settings' && <SettingsPage taskCount={tasks.length} projectCount={projects.length} onReset={resetData} onClear={clearData} />}
      </main>
      <MobileNav page={page} onNavigate={setPage} />
      {modalOpen && <TaskModal draft={draft} projects={projects} editing={Boolean(editingId)} onDraft={setDraft} onClose={() => setModalOpen(false)} onSave={saveTask} />}
      {toast && <div className="toast"><Icon name="check" size={16} />{toast}</div>}
    </div>
  )
}

const navItems: { key: Page; label: string; icon: string }[] = [
  { key: 'today', label: '今日计划', icon: 'today' },
  { key: 'tasks', label: '任务清单', icon: 'tasks' },
  { key: 'calendar', label: '日历', icon: 'calendar' },
  { key: 'projects', label: '项目', icon: 'projects' },
  { key: 'review', label: '数据复盘', icon: 'review' },
  { key: 'settings', label: '设置', icon: 'settings' },
]

function Sidebar({ page, onNavigate }: { page: Page; onNavigate: (page: Page) => void }) {
  return <aside className="sidebar">
    <div className="brand"><span className="brand-mark">F</span><span>FocusFlow</span></div>
    <div className="nav-caption">工作空间</div>
    <nav>{navItems.map((item) => <button className={`nav-item ${page === item.key ? 'active' : ''}`} key={item.key} onClick={() => onNavigate(item.key)}><Icon name={item.icon} />{item.label}</button>)}</nav>
    <div className="sidebar-foot"><div className="avatar">林</div><div><strong>我的工作台</strong><small>个人离线空间</small></div></div>
  </aside>
}

function MobileNav({ page, onNavigate }: { page: Page; onNavigate: (page: Page) => void }) {
  return <nav className="mobile-nav">{navItems.map((item) => <button className={page === item.key ? 'active' : ''} key={item.key} onClick={() => onNavigate(item.key)}><Icon name={item.icon} size={19} /><span>{item.label}</span></button>)}</nav>
}

function Header({ page, search, onSearch, onCreate }: { page: Page; search: string; onSearch: (value: string) => void; onCreate: () => void }) {
  const titles: Record<Page, string> = { today: '今日计划', tasks: '任务清单', calendar: '日历', projects: '项目', review: '数据复盘', settings: '设置' }
  return <header className="topbar">
    <div><h1>{titles[page]}</h1><p>{page === 'today' ? formatFullDate(new Date()) : '安排清晰，行动从容。'}</p></div>
    <div className="topbar-actions">
      <label className="search"><Icon name="search" size={17} /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="搜索任务" /></label>
      <button className="primary-btn" onClick={onCreate}><Icon name="plus" size={17} />新建任务</button>
    </div>
  </header>
}

function TodayPage({ tasks, projects, focusTasks, completionRate, completedToday, onToggleComplete, onToggleFocus, onEdit, onDelete, onCreate }: {
  tasks: Task[]; projects: Record<string, Project>; focusTasks: Task[]; completionRate: number; completedToday: number
  onToggleComplete: (task: Task) => void; onToggleFocus: (task: Task) => void; onEdit: (task: Task) => void; onDelete: (task: Task) => void; onCreate: () => void
}) {
  const visibleTasks = tasks.filter((task) => task.dueDate === today || (task.status !== 'completed' && Boolean(task.dueDate && task.dueDate < today)))
  return <section className="page-content">
    <div className="hero-card">
      <div><span className="eyebrow">今日进度</span><h2>早上好，今天也保持专注。</h2><p>完成关键任务，让每一步都更靠近目标。</p></div>
      <div className="progress-ring" style={{ '--progress': `${completionRate * 3.6}deg` } as React.CSSProperties}><div><strong>{completionRate}%</strong><small>{completedToday}/{visibleTasks.length} 已完成</small></div></div>
    </div>
    <SectionTitle title="今日焦点" subtitle="最多选择 3 项最重要的任务" />
    <div className="focus-grid">{focusTasks.length ? focusTasks.map((task) => <FocusCard key={task.id} task={task} project={task.projectId ? projects[task.projectId] : undefined} onToggleComplete={onToggleComplete} onToggleFocus={onToggleFocus} />) : <EmptyCard text="还没有设置焦点任务，可以从今日任务中点亮星标。" />}</div>
    <div className="list-card">
      <div className="list-head"><div><h3>今日任务</h3><p>{visibleTasks.length} 项安排</p></div><button className="text-btn" onClick={onCreate}><Icon name="plus" size={15} />添加任务</button></div>
      {visibleTasks.length ? visibleTasks.map((task) => <TaskRow key={task.id} task={task} project={task.projectId ? projects[task.projectId] : undefined} onToggleComplete={onToggleComplete} onToggleFocus={onToggleFocus} onEdit={onEdit} onDelete={onDelete} />) : <EmptyState title="今天还没有任务" text="添加第一项任务，开始安排你的工作节奏。" />}
    </div>
  </section>
}

function TasksPage({ tasks, projects, projectMap, search, statusFilter, projectFilter, isOverdue, onStatusFilter, onProjectFilter, onToggleComplete, onToggleFocus, onEdit, onDelete }: {
  tasks: Task[]; projects: Project[]; projectMap: Record<string, Project>; search: string; statusFilter: 'all' | TaskStatus | 'overdue'; projectFilter: string; isOverdue: (task: Task) => boolean
  onStatusFilter: (value: 'all' | TaskStatus | 'overdue') => void; onProjectFilter: (value: string) => void; onToggleComplete: (task: Task) => void; onToggleFocus: (task: Task) => void; onEdit: (task: Task) => void; onDelete: (task: Task) => void
}) {
  const filtered = tasks.filter((task) => {
    const matchedSearch = `${task.title}${task.description}`.toLowerCase().includes(search.toLowerCase())
    const matchedStatus = statusFilter === 'all' || (statusFilter === 'overdue' ? isOverdue(task) : task.status === statusFilter)
    return matchedSearch && matchedStatus && (projectFilter === 'all' || task.projectId === projectFilter)
  })
  return <section className="page-content">
    <div className="toolbar-card">
      <div className="filter-tabs">{([['all', '全部'], ['todo', '待处理'], ['in-progress', '进行中'], ['completed', '已完成'], ['overdue', '已逾期']] as const).map(([value, label]) => <button className={statusFilter === value ? 'active' : ''} key={value} onClick={() => onStatusFilter(value)}>{label}</button>)}</div>
      <select value={projectFilter} onChange={(event) => onProjectFilter(event.target.value)}><option value="all">全部项目</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
    </div>
    <div className="list-card">
      <div className="list-head"><div><h3>任务列表</h3><p>共 {filtered.length} 项任务</p></div></div>
      {filtered.length ? filtered.map((task) => <TaskRow key={task.id} task={task} project={task.projectId ? projectMap[task.projectId] : undefined} onToggleComplete={onToggleComplete} onToggleFocus={onToggleFocus} onEdit={onEdit} onDelete={onDelete} />) : <EmptyState title="没有找到任务" text="尝试调整筛选条件或创建一项新任务。" />}
    </div>
  </section>
}

function CalendarPage({ tasks, projects, selectedDate, calendarDate, onSelectedDate, onCalendarDate, onCreate, onToggleComplete, onEdit }: {
  tasks: Task[]; projects: Record<string, Project>; selectedDate: string; calendarDate: Date; onSelectedDate: (value: string) => void; onCalendarDate: (value: Date) => void; onCreate: (date: string) => void; onToggleComplete: (task: Task) => void; onEdit: (task: Task) => void
}) {
  const year = calendarDate.getFullYear()
  const month = calendarDate.getMonth()
  const start = new Date(year, month, 1)
  const startDay = start.getDay()
  const days = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - startDay + 1
    return day > 0 && day <= days ? toDateInput(new Date(year, month, day)) : ''
  })
  const selectedTasks = tasks.filter((task) => task.dueDate === selectedDate)
  const moveMonth = (amount: number) => onCalendarDate(new Date(year, month + amount, 1))
  return <section className="page-content calendar-layout">
    <div className="calendar-card">
      <div className="calendar-head"><div><h3>{year} 年 {month + 1} 月</h3><p>点击日期查看当天安排</p></div><div><button className="icon-btn" onClick={() => moveMonth(-1)}><Icon name="chevronLeft" /></button><button className="icon-btn" onClick={() => moveMonth(1)}><Icon name="chevronRight" /></button></div></div>
      <div className="weekdays">{['日', '一', '二', '三', '四', '五', '六'].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="calendar-grid">{cells.map((date, index) => <button key={`${date}-${index}`} disabled={!date} className={`calendar-cell ${date === today ? 'today' : ''} ${date === selectedDate ? 'selected' : ''}`} onClick={() => date && onSelectedDate(date)}>
        {date && <><span>{Number(date.slice(-2))}</span><div className="task-dots">{tasks.filter((task) => task.dueDate === date).slice(0, 3).map((task) => <i key={task.id} style={{ background: task.projectId ? projects[task.projectId]?.color : '#a0a7b5' }} />)}</div></>}
      </button>)}</div>
    </div>
    <div className="day-panel">
      <div className="list-head"><div><h3>{formatShortDate(selectedDate)}</h3><p>{selectedTasks.length} 项安排</p></div><button className="icon-btn" onClick={() => onCreate(selectedDate)}><Icon name="plus" /></button></div>
      {selectedTasks.length ? selectedTasks.map((task) => <CompactTask key={task.id} task={task} project={task.projectId ? projects[task.projectId] : undefined} onToggleComplete={onToggleComplete} onEdit={onEdit} />) : <EmptyState title="这一天很轻松" text="可以添加一项任务。" />}
    </div>
  </section>
}

function ProjectsPage({ tasks, projects, onEdit }: { tasks: Task[]; projects: Project[]; onEdit: (task: Task) => void }) {
  return <section className="page-content">
    <div className="project-grid">{projects.map((project) => {
      const items = tasks.filter((task) => task.projectId === project.id)
      const completed = items.filter((task) => task.status === 'completed').length
      const progress = items.length ? Math.round(completed / items.length * 100) : 0
      return <article className="project-card" key={project.id}>
        <div className="project-top"><span className="project-icon" style={{ background: `${project.color}18`, color: project.color }}><Icon name="projects" /></span><span className="project-progress">{progress}%</span></div>
        <h3>{project.name}</h3><p>{project.description}</p>
        <div className="progress-bar"><i style={{ width: `${progress}%`, background: project.color }} /></div>
        <div className="project-meta"><span>{completed}/{items.length} 已完成</span><span>{items.filter((task) => task.status !== 'completed').length} 项待办</span></div>
        <div className="project-task-list">{items.filter((task) => task.status !== 'completed').slice(0, 2).map((task) => <button key={task.id} onClick={() => onEdit(task)}><i style={{ background: project.color }} />{task.title}</button>)}</div>
      </article>
    })}</div>
    {!projects.length && <EmptyState title="还没有项目" text="恢复演示数据后可查看项目管理示例。" />}
  </section>
}

function ReviewPage({ tasks, projects }: { tasks: Task[]; projects: Project[] }) {
  const completed = tasks.filter((task) => task.status === 'completed')
  const overdue = tasks.filter((task) => task.status !== 'completed' && Boolean(task.dueDate && task.dueDate < today))
  const rate = tasks.length ? Math.round(completed.length / tasks.length * 100) : 0
  const days = Array.from({ length: 7 }, (_, index) => offsetDate(index - 6))
  return <section className="page-content">
    <div className="stat-grid">
      <StatCard title="已完成任务" value={completed.length.toString()} hint="累计完成" tone="purple" />
      <StatCard title="整体完成率" value={`${rate}%`} hint="继续保持节奏" tone="green" />
      <StatCard title="逾期任务" value={overdue.length.toString()} hint="建议优先处理" tone="orange" />
      <StatCard title="活跃项目" value={projects.length.toString()} hint="正在推进" tone="blue" />
    </div>
    <div className="review-grid">
      <div className="chart-card"><div className="list-head"><div><h3>近 7 日完成趋势</h3><p>每日完成任务数量</p></div></div><div className="bar-chart">{days.map((day) => {
        const count = completed.filter((task) => task.completedAt?.slice(0, 10) === day).length
        return <div className="bar-item" key={day}><div><i style={{ height: `${Math.max(10, count * 34)}px` }} /></div><span>{Number(day.slice(-2))}日</span></div>
      })}</div></div>
      <div className="chart-card"><div className="list-head"><div><h3>项目任务分布</h3><p>当前项目任务数量</p></div></div><div className="distribution">{projects.map((project) => {
        const count = tasks.filter((task) => task.projectId === project.id).length
        return <div key={project.id}><span><i style={{ background: project.color }} />{project.name}</span><strong>{count}</strong><div className="progress-bar"><i style={{ width: `${tasks.length ? count / tasks.length * 100 : 0}%`, background: project.color }} /></div></div>
      })}</div></div>
    </div>
  </section>
}

function SettingsPage({ taskCount, projectCount, onReset, onClear }: { taskCount: number; projectCount: number; onReset: () => void; onClear: () => void }) {
  return <section className="page-content settings-list">
    <div className="settings-card"><div><h3>本地数据空间</h3><p>当前包含 {taskCount} 项任务和 {projectCount} 个项目。所有数据仅保存在当前浏览器的 localStorage 中。</p></div><span className="storage-badge">离线模式</span></div>
    <div className="settings-card"><div><h3>恢复演示数据</h3><p>使用预置任务和项目重新体验完整界面，当前数据会被覆盖。</p></div><button className="secondary-btn" onClick={onReset}><Icon name="reset" size={16} />恢复数据</button></div>
    <div className="settings-card danger"><div><h3>清空全部数据</h3><p>删除所有本地任务和项目，此操作无法撤销。</p></div><button className="danger-btn" onClick={onClear}><Icon name="trash" size={16} />清空数据</button></div>
  </section>
}

function TaskRow({ task, project, onToggleComplete, onToggleFocus, onEdit, onDelete }: { task: Task; project?: Project; onToggleComplete: (task: Task) => void; onToggleFocus: (task: Task) => void; onEdit: (task: Task) => void; onDelete: (task: Task) => void }) {
  const overdue = task.status !== 'completed' && Boolean(task.dueDate && task.dueDate < today)
  return <div className={`task-row ${task.status === 'completed' ? 'done' : ''}`}>
    <button className="check-btn" onClick={() => onToggleComplete(task)}>{task.status === 'completed' && <Icon name="check" size={14} />}</button>
    <div className="task-main"><strong>{task.title}</strong><div className="task-meta">{project && <span><i style={{ background: project.color }} />{project.name}</span>}{task.dueDate && <span className={overdue ? 'overdue' : ''}><Icon name="clock" size={13} />{overdue ? '已逾期 · ' : ''}{formatShortDate(task.dueDate)}</span>}</div></div>
    <span className={`priority ${task.priority}`}>{priorityLabel[task.priority]}</span>
    <button className={`row-action star ${task.isDailyFocus ? 'active' : ''}`} onClick={() => onToggleFocus(task)} title="设为今日焦点"><Icon name="star" size={16} /></button>
    <button className="row-action" onClick={() => onEdit(task)} title="编辑任务"><Icon name="edit" size={16} /></button>
    <button className="row-action" onClick={() => onDelete(task)} title="删除任务"><Icon name="trash" size={16} /></button>
  </div>
}

function CompactTask({ task, project, onToggleComplete, onEdit }: { task: Task; project?: Project; onToggleComplete: (task: Task) => void; onEdit: (task: Task) => void }) {
  return <div className={`compact-task ${task.status === 'completed' ? 'done' : ''}`}><button className="check-btn" onClick={() => onToggleComplete(task)}>{task.status === 'completed' && <Icon name="check" size={13} />}</button><button className="compact-main" onClick={() => onEdit(task)}><strong>{task.title}</strong>{project && <span><i style={{ background: project.color }} />{project.name}</span>}</button></div>
}

function FocusCard({ task, project, onToggleComplete, onToggleFocus }: { task: Task; project?: Project; onToggleComplete: (task: Task) => void; onToggleFocus: (task: Task) => void }) {
  return <article className="focus-card"><div className="focus-top"><span className={`priority ${task.priority}`}>{priorityLabel[task.priority]}</span><button className="star active" onClick={() => onToggleFocus(task)}><Icon name="star" size={17} /></button></div><h3>{task.title}</h3><div className="focus-bottom"><span>{project?.name ?? '个人任务'}</span><button onClick={() => onToggleComplete(task)}><Icon name="check" size={15} />完成</button></div></article>
}

function TaskModal({ draft, projects, editing, onDraft, onClose, onSave }: { draft: TaskDraft; projects: Project[]; editing: boolean; onDraft: (value: TaskDraft) => void; onClose: () => void; onSave: (event: FormEvent) => void }) {
  const update = (key: keyof TaskDraft, value: string) => onDraft({ ...draft, [key]: value })
  return <div className="modal-backdrop" onMouseDown={onClose}><form className="task-modal" onSubmit={onSave} onMouseDown={(event) => event.stopPropagation()}>
    <div className="modal-head"><div><h2>{editing ? '编辑任务' : '新建任务'}</h2><p>记录清晰，执行更轻松。</p></div><button type="button" className="modal-close" onClick={onClose}>×</button></div>
    <label>任务名称<input autoFocus required value={draft.title} onChange={(event) => update('title', event.target.value)} placeholder="输入任务名称" /></label>
    <label>任务描述<textarea value={draft.description} onChange={(event) => update('description', event.target.value)} placeholder="补充任务细节（可选）" /></label>
    <div className="form-grid"><label>状态<select value={draft.status} onChange={(event) => update('status', event.target.value)}>{Object.entries(statusLabel).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>优先级<select value={draft.priority} onChange={(event) => update('priority', event.target.value)}>{Object.entries(priorityLabel).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div>
    <div className="form-grid"><label>所属项目<select value={draft.projectId} onChange={(event) => update('projectId', event.target.value)}><option value="">无项目</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select></label><label>截止日期<input type="date" value={draft.dueDate} onChange={(event) => update('dueDate', event.target.value)} /></label></div>
    <label>预计耗时（分钟）<input type="number" min="0" value={draft.estimatedMinutes} onChange={(event) => update('estimatedMinutes', event.target.value)} /></label>
    <div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>取消</button><button className="primary-btn">{editing ? '保存修改' : '创建任务'}</button></div>
  </form></div>
}

function StatCard({ title, value, hint, tone }: { title: string; value: string; hint: string; tone: string }) {
  return <div className="stat-card"><span className={`stat-icon ${tone}`}><Icon name="review" /></span><div><p>{title}</p><strong>{value}</strong><small>{hint}</small></div></div>
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="section-title"><h3>{title}</h3><p>{subtitle}</p></div>
}

function EmptyCard({ text }: { text: string }) {
  return <div className="empty-card">{text}</div>
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><strong>{title}</strong><span>{text}</span></div>
}

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(date)
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(new Date(`${date}T00:00:00`))
}

export default App
