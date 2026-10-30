
import { useMemo, useState } from 'react'
import DataUpload from './components/DataUpload'

import {
  LayoutDashboard,
  Database,
  ChartNoAxesCombined,
  BrainCircuit,
  TrendingUp,
  FileText,
  Settings,
  Search,
  Bell,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Upload,
  MoreHorizontal,
  Sparkles,
  Activity,
  Wallet,
  ShoppingCart,
  Target,
  Menu,
  ChevronDown,
  Download
} from 'lucide-react'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'

// --------------------------------------------------
// TYPES
// --------------------------------------------------

type DatasetResponse = {
  message: string
  filename: string
  metrics: {
    total_records: number
    total_columns: number
    numeric_columns: string[]
    numeric_totals: Record<string, number>
  }
  columns: string[]
  preview: Record<string, unknown>[]
  records: Record<string, unknown>[]
}

type SalesMonth = {
  month: string
  revenue: number
  expenses: number
}

type CategoryItem = {
  name: string
  value: number
  color: string
}

type ProductItem = {
  name: string
  category: string
  sales: number
  units: number
  status: string
}

// --------------------------------------------------
// DEMO DATA
// --------------------------------------------------

const demoSalesData: SalesMonth[] = [
  { month: 'Jan', revenue: 32000, expenses: 19000 },
  { month: 'Feb', revenue: 39000, expenses: 22000 },
  { month: 'Mar', revenue: 35000, expenses: 21000 },
  { month: 'Apr', revenue: 48000, expenses: 26000 },
  { month: 'May', revenue: 44000, expenses: 25000 },
  { month: 'Jun', revenue: 56000, expenses: 30000 },
  { month: 'Jul', revenue: 51000, expenses: 28000 },
  { month: 'Aug', revenue: 65000, expenses: 34000 },
  { month: 'Sep', revenue: 59000, expenses: 31000 },
  { month: 'Oct', revenue: 76000, expenses: 39000 },
  { month: 'Nov', revenue: 71000, expenses: 36000 },
  { month: 'Dec', revenue: 89000, expenses: 43000 }
]

const demoCategoryData: CategoryItem[] = [
  { name: 'Electronics', value: 42, color: '#6366f1' },
  { name: 'Clothing', value: 28, color: '#06b6d4' },
  { name: 'Furniture', value: 18, color: '#a78bfa' },
  { name: 'Others', value: 12, color: '#f59e0b' }
]

const demoProducts: ProductItem[] = [
  {
    name: 'MacBook Pro 14"',
    category: 'Electronics',
    sales: 1245000,
    units: 45,
    status: 'Excellent'
  },
  {
    name: 'iPhone 16 Pro',
    category: 'Electronics',
    sales: 980000,
    units: 38,
    status: 'Excellent'
  },
  {
    name: 'Office Furniture',
    category: 'Furniture',
    sales: 625000,
    units: 29,
    status: 'Good'
  },
  {
    name: 'Premium Jackets',
    category: 'Clothing',
    sales: 460000,
    units: 62,
    status: 'Good'
  }
]

const chartColors = [
  '#6366f1',
  '#06b6d4',
  '#a78bfa',
  '#f59e0b',
  '#10b981',
  '#f43f5e'
]

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Data Upload', icon: Database },
  { label: 'Data Explorer', icon: Search },
  { label: 'Analytics', icon: ChartNoAxesCombined },
  { label: 'AI Business Analyst', icon: BrainCircuit },
  { label: 'Forecasting', icon: TrendingUp },
  { label: 'Reports', icon: FileText }
]

// --------------------------------------------------
// DATA PROCESSING HELPERS
// --------------------------------------------------

function normalizeColumn(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function findColumn(
  columns: string[],
  possibleNames: string[]
): string | undefined {
  const normalizedNames = possibleNames.map(normalizeColumn)

  return columns.find((column) =>
    normalizedNames.includes(normalizeColumn(column))
  )
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[₹$,\s]/g, '')
    const parsed = Number(cleaned)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

function formatCurrency(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

function formatCompactCurrency(value: number) {
  if (Math.abs(value) >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)}Cr`
  }

  if (Math.abs(value) >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`
  }

  if (Math.abs(value) >= 1000) {
    return `₹${(value / 1000).toFixed(0)}k`
  }

  return `₹${value}`
}

function getMonthKey(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return 'Unknown'
  }

  const date = new Date(String(value))

  if (Number.isNaN(date.getTime())) {
    return 'Unknown'
  }

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, '0')}`
}

function getMonthLabel(key: string): string {
  if (key === 'Unknown') return 'Unknown'

  const [year, month] = key.split('-').map(Number)
  const date = new Date(year, month - 1, 1)

  return date.toLocaleDateString('en-IN', {
    month: 'short',
    year: '2-digit'
  })
}

// --------------------------------------------------
// MAIN APP
// --------------------------------------------------

function App() {
  const [activePage, setActivePage] = useState('Overview')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [period, setPeriod] = useState('This year')
  const [dataset, setDataset] = useState<DatasetResponse | null>(null)

  // Find columns in the uploaded dataset.
  const columns = dataset?.columns ?? []
  const records = dataset?.records ?? []

  const revenueColumn = findColumn(columns, [
    'revenue',
    'sales',
    'amount',
    'totalamount'
  ])

  const expenseColumn = findColumn(columns, [
    'expenses',
    'expense',
    'cost',
    'totalcost'
  ])

  const unitsColumn = findColumn(columns, [
    'unitssold',
    'units',
    'quantity',
    'qty'
  ])

  const dateColumn = findColumn(columns, [
    'date',
    'orderdate',
    'salesdate',
    'transactiondate'
  ])

  const categoryColumn = findColumn(columns, [
    'category',
    'productcategory'
  ])

  const productColumn = findColumn(columns, [
    'product',
    'productname',
    'item'
  ])

  // Calculate KPIs from uploaded records.
  const calculatedData = useMemo(() => {
    if (!dataset || !records.length) {
      return null
    }

    let revenue = 0
    let expenses = 0
    let units = 0

    records.forEach((row) => {
      revenue += revenueColumn
        ? toNumber(row[revenueColumn])
        : 0

      expenses += expenseColumn
        ? toNumber(row[expenseColumn])
        : 0

      units += unitsColumn
        ? toNumber(row[unitsColumn])
        : 0
    })

    const profit = revenue - expenses
    const profitMargin = revenue > 0
      ? (profit / revenue) * 100
      : 0

    // Monthly performance.
    const monthlyMap: Record<string, SalesMonth> = {}

    records.forEach((row) => {
      const monthKey = dateColumn
        ? getMonthKey(row[dateColumn])
        : 'Unknown'

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          month: getMonthLabel(monthKey),
          revenue: 0,
          expenses: 0
        }
      }

      monthlyMap[monthKey].revenue += revenueColumn
        ? toNumber(row[revenueColumn])
        : 0

      monthlyMap[monthKey].expenses += expenseColumn
        ? toNumber(row[expenseColumn])
        : 0
    })

    const monthlyData = Object.keys(monthlyMap)
      .sort()
      .map((key) => monthlyMap[key])

    // Category performance.
    const categoryMap: Record<string, number> = {}

    records.forEach((row) => {
      const category = categoryColumn
        ? String(row[categoryColumn] || 'Uncategorized')
        : 'Uncategorized'

      const amount = revenueColumn
        ? toNumber(row[revenueColumn])
        : 0

      categoryMap[category] = (categoryMap[category] || 0) + amount
    })

    const categoryData: CategoryItem[] = Object.entries(categoryMap)
      .map(([name, value], index) => ({
        name,
        value: revenue > 0
          ? Number(((value / revenue) * 100).toFixed(1))
          : 0,
        color: chartColors[index % chartColors.length]
      }))
      .sort((a, b) => b.value - a.value)

    // Product performance.
    const productMap: Record<string, ProductItem> = {}

    records.forEach((row) => {
      const name = productColumn
        ? String(row[productColumn] || 'Unknown Product')
        : 'Unknown Product'

      const category = categoryColumn
        ? String(row[categoryColumn] || 'Uncategorized')
        : 'Uncategorized'

      if (!productMap[name]) {
        productMap[name] = {
          name,
          category,
          sales: 0,
          units: 0,
          status: 'Good'
        }
      }

      productMap[name].sales += revenueColumn
        ? toNumber(row[revenueColumn])
        : 0

      productMap[name].units += unitsColumn
        ? toNumber(row[unitsColumn])
        : 0
    })

    const products = Object.values(productMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)
      .map((product, index) => ({
        ...product,
        status: index === 0 ? 'Excellent' : 'Good'
      }))

    return {
      revenue,
      expenses,
      profit,
      profitMargin,
      units,
      monthlyData,
      categoryData,
      products
    }
  }, [
    dataset,
    records,
    revenueColumn,
    expenseColumn,
    unitsColumn,
    dateColumn,
    categoryColumn,
    productColumn
  ])

  // Use uploaded data when available, otherwise use demo data.
  const revenue = calculatedData?.revenue ?? 8425600
  const expenses = calculatedData?.expenses ?? 5745200
  const profit = calculatedData?.profit ?? 2680400
  const profitMargin = calculatedData?.profitMargin ?? 31.8

  const salesData = calculatedData?.monthlyData.length
    ? calculatedData.monthlyData
    : demoSalesData

  const categoryData = calculatedData?.categoryData.length
    ? calculatedData.categoryData
    : demoCategoryData

  const products = calculatedData?.products.length
    ? calculatedData.products
    : demoProducts

  const filteredSalesData = period === 'Last 6 months'
    ? salesData.slice(-6)
    : salesData

  const metrics = [
    {
      title: 'Total Revenue',
      value: formatCurrency(revenue),
      change: dataset ? 'Uploaded data' : '+12.8%',
      icon: Wallet,
      positive: true,
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      title: 'Net Profit',
      value: formatCurrency(profit),
      change: dataset ? 'Calculated' : '+8.4%',
      icon: TrendingUp,
      positive: true,
      color: 'bg-emerald-50 text-emerald-600'
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(expenses),
      change: dataset ? 'Uploaded data' : '+3.2%',
      icon: ShoppingCart,
      positive: false,
      color: 'bg-orange-50 text-orange-600'
    },
    {
      title: 'Profit Margin',
      value: `${profitMargin.toFixed(1)}%`,
      change: dataset ? 'Calculated' : '+5.6%',
      icon: Target,
      positive: true,
      color: 'bg-purple-50 text-purple-600'
    }
  ]

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-800">

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[260px] flex-col bg-[#111a32] text-white transition-transform duration-300 ${
          mobileMenu ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex h-[82px] items-center gap-3 border-b border-white/10 px-7">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500">
            <Activity size={23} />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight">
              InsightFlow
            </h1>
            <p className="text-[10px] tracking-[2px] text-slate-400">
              BUSINESS INTELLIGENCE
            </p>
          </div>
        </div>

        <div className="px-5 pt-8">
          <p className="mb-4 px-3 text-[10px] font-semibold tracking-[2px] text-slate-500">
            WORKSPACE
          </p>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = activePage === item.label

              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setActivePage(item.label)
                    setMobileMenu(false)
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                    active
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-950/30'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>

                  {item.label === 'AI Business Analyst' && (
                    <span className="ml-auto rounded-md bg-purple-400/20 px-2 py-0.5 text-[9px] text-purple-200">
                      AI
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="mt-auto p-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={17} className="text-amber-300" />
              <span className="text-xs font-semibold">
                Upgrade your insights
              </span>
            </div>

            <p className="mb-4 text-xs leading-5 text-slate-400">
              Unlock advanced analytics and smarter business decisions.
            </p>

            <button className="w-full rounded-lg bg-indigo-500 py-2.5 text-xs font-semibold hover:bg-indigo-400">
              Explore features
            </button>
          </div>

          <button
            onClick={() => {
              setActivePage('Settings')
              setMobileMenu(false)
            }}
            className="mt-5 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <Settings size={18} />
            Settings
          </button>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {mobileMenu && (
        <button
          aria-label="Close menu"
          onClick={() => setMobileMenu(false)}
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
        />
      )}

      {/* MAIN CONTENT */}
      <main className="min-h-screen lg:ml-[260px]">

        {/* HEADER */}
        <header className="sticky top-0 z-10 flex h-[82px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={21} />
            </button>

            <div>
              <h2 className="text-lg font-bold">
                {activePage}
              </h2>
              <p className="hidden text-xs text-slate-400 sm:block">
                Welcome back! Here's your business overview.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <button className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 sm:flex">
              <CalendarDays size={15} />
              October 2026
              <ChevronDown size={14} />
            </button>

            <button
              aria-label="Search"
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
            >
              <Search size={19} />
            </button>

            <button
              aria-label="Notifications"
              className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100"
            >
              <Bell size={19} />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                AD
              </div>

              <div className="hidden sm:block">
                <p className="text-xs font-semibold">Admin User</p>
                <p className="text-[10px] text-slate-400">
                  Administrator
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="dashboard-scroll mx-auto max-w-[1600px] space-y-7 p-5 sm:p-8">

          {activePage === 'Data Upload' ? (
            <DataUpload onDataProcessed={setDataset} />
          ) : (
            <>
              {/* PAGE HEADING */}
              <section className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="mb-1 text-xs font-medium text-indigo-600">
                    BUSINESS OVERVIEW
                  </p>

                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    Dashboard Overview
                  </h1>

                  <p className="mt-2 text-sm text-slate-500">
                    Track your business performance and make smarter decisions.
                  </p>

                  {dataset && (
                    <p className="mt-2 text-xs font-medium text-emerald-600">
                      <CheckCircleLabel filename={dataset.filename} />
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setActivePage('Data Upload')}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold shadow-sm hover:bg-slate-50"
                  >
                    <Upload size={16} />
                    Upload Data
                  </button>

                  <button
                    onClick={() => setActivePage('Reports')}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700"
                  >
                    <Download size={16} />
                    Reports
                  </button>
                </div>
              </section>

              {/* KPI CARDS */}
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => {
                  const Icon = metric.icon

                  return (
                    <div
                      key={metric.title}
                      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-slate-500">
                          {metric.title}
                        </p>

                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${metric.color}`}>
                          <Icon size={19} />
                        </div>
                      </div>

                      <h3 className="mt-4 text-2xl font-bold tracking-tight">
                        {metric.value}
                      </h3>

                      <div className="mt-3 flex items-center gap-2">
                        <span className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ${
                          metric.positive
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-orange-50 text-orange-600'
                        }`}>
                          {dataset ? (
                            <CheckCircleLabel />
                          ) : metric.positive ? (
                            <ArrowUpRight size={12} />
                          ) : (
                            <ArrowDownRight size={12} />
                          )}

                          {metric.change}
                        </span>

                        <span className="text-[10px] text-slate-400">
                          {dataset ? 'From uploaded dataset' : 'vs previous period'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </section>

              {/* REVENUE CHART AND INSIGHTS */}
              <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm xl:col-span-2 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold">
                        Revenue & Expenses
                      </h3>

                      <p className="mt-1 text-xs text-slate-400">
                        Financial performance throughout the period
                      </p>
                    </div>

                    <select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none"
                    >
                      <option>This year</option>
                      <option>Last year</option>
                      <option>Last 6 months</option>
                    </select>
                  </div>

                  <div className="mt-7 h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={filteredSalesData}>
                        <defs>
                          <linearGradient
                            id="revenueGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>

                          <linearGradient
                            id="expenseGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                          </linearGradient>
                        </defs>

                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#eef1f6"
                        />

                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#94a3b8' }}
                        />

                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#94a3b8' }}
                          tickFormatter={formatCompactCurrency}
                        />

                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: '1px solid #e8edf5',
                            fontSize: 12
                          }}
                          formatter={(value) => [
                            formatCurrency(Number(value)),
                            ''
                          ]}
                        />

                        <Area
                          type="monotone"
                          dataKey="revenue"
                          name="Revenue"
                          stroke="#6366f1"
                          strokeWidth={3}
                          fill="url(#revenueGradient)"
                        />

                        <Area
                          type="monotone"
                          dataKey="expenses"
                          name="Expenses"
                          stroke="#06b6d4"
                          strokeWidth={2}
                          fill="url(#expenseGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-5 text-xs">
                    <span className="flex items-center gap-2 text-slate-500">
                      <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                      Revenue
                    </span>

                    <span className="flex items-center gap-2 text-slate-500">
                      <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                      Expenses
                    </span>
                  </div>
                </div>

                {/* BUSINESS INSIGHTS */}
                <div className="overflow-hidden rounded-2xl bg-[#171f3c] p-6 text-white shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
                      <BrainCircuit size={20} />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold">
                        Business Insights
                      </h3>

                      <p className="text-[10px] text-slate-400">
                        {dataset ? 'Dataset-based analysis' : 'Demo analysis'}
                      </p>
                    </div>

                    <span className="ml-auto rounded-full bg-emerald-400/10 px-2 py-1 text-[9px] text-emerald-300">
                      {dataset ? 'DATA' : 'DEMO'}
                    </span>
                  </div>

                  <div className="mt-7 space-y-5">
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-indigo-300">
                        <TrendingUp size={15} />
                        Revenue overview
                      </div>

                      <p className="text-xs leading-6 text-slate-300">
                        {dataset
                          ? `Your uploaded dataset shows total revenue of ${formatCurrency(revenue)}. Review your top-performing categories to identify growth opportunities.`
                          : 'Revenue has increased in the latest months. Review your best-performing product categories to identify opportunities for further growth.'}
                      </p>
                    </div>

                    <div className="border-t border-white/10 pt-5">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-cyan-300">
                        <Activity size={15} />
                        Expense monitoring
                      </div>

                      <p className="text-xs leading-6 text-slate-300">
                        {dataset
                          ? `Total expenses are ${formatCurrency(expenses)}. Your calculated net profit is ${formatCurrency(profit)}.`
                          : 'Monitor operating expenses alongside revenue to maintain healthy profit margins.'}
                      </p>
                    </div>

                    <div className="border-t border-white/10 pt-5">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-amber-300">
                        <Sparkles size={15} />
                        Recommended action
                      </div>

                      <p className="text-xs leading-6 text-slate-300">
                        {dataset
                          ? `Your current profit margin is ${profitMargin.toFixed(1)}%. Compare product performance and focus on improving profitability.`
                          : 'Compare monthly sales performance and prioritize products with consistently strong demand.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActivePage('AI Business Analyst')}
                    className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3 text-xs font-semibold hover:bg-indigo-400"
                  >
                    Explore Insights
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              </section>

              {/* CATEGORY AND MONTHLY CHARTS */}
              <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">
                        Sales by Category
                      </h3>

                      <p className="mt-1 text-xs text-slate-400">
                        Revenue distribution
                      </p>
                    </div>

                    <button
                      aria-label="More options"
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
                    <div className="h-[210px] w-[210px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={62}
                            outerRadius={92}
                            paddingAngle={4}
                          >
                            {categoryData.map((entry) => (
                              <Cell
                                key={entry.name}
                                fill={entry.color}
                              />
                            ))}
                          </Pie>

                          <Tooltip
                            formatter={(value) => [`${value}%`, 'Share']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="min-w-[130px] space-y-4">
                      {categoryData.map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between gap-5 text-xs"
                        >
                          <span className="flex items-center gap-2 text-slate-500">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ background: item.color }}
                            />
                            {item.name}
                          </span>

                          <span className="font-bold">
                            {item.value}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">
                        Monthly Performance
                      </h3>

                      <p className="mt-1 text-xs text-slate-400">
                        Revenue comparison
                      </p>
                    </div>

                    <button
                      aria-label="More options"
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  </div>

                  <div className="mt-5 h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={filteredSalesData.slice(-6)}
                        barGap={5}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#eef1f6"
                        />

                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#94a3b8' }}
                        />

                        <YAxis hide />
                        <Tooltip
                          formatter={(value) => formatCurrency(Number(value))}
                        />

                        <Bar
                          dataKey="revenue"
                          name="Revenue"
                          fill="#6366f1"
                          radius={[5, 5, 0, 0]}
                        />

                        <Bar
                          dataKey="expenses"
                          name="Expenses"
                          fill="#c7d2fe"
                          radius={[5, 5, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>

              {/* TOP PRODUCTS TABLE */}
              <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
                  <div>
                    <h3 className="font-bold">
                      Top Performing Products
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      {dataset
                        ? 'Products ranked by uploaded revenue'
                        : 'Demo product performance'}
                    </p>
                  </div>

                  <button
                    onClick={() => setActivePage('Data Explorer')}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                  >
                    View all
                    <ArrowUpRight size={14} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Product</th>
                        <th className="px-6 py-4 font-semibold">Category</th>
                        <th className="px-6 py-4 font-semibold">Units Sold</th>
                        <th className="px-6 py-4 font-semibold">Revenue</th>
                        <th className="px-6 py-4 font-semibold">Performance</th>
                      </tr>
                    </thead>

                    <tbody>
                      {products.map((product) => (
                        <tr
                          key={product.name}
                          className="border-t border-slate-100 text-xs hover:bg-slate-50/70"
                        >
                          <td className="px-6 py-4 font-semibold">
                            {product.name}
                          </td>

                          <td className="px-6 py-4 text-slate-500">
                            {product.category}
                          </td>

                          <td className="px-6 py-4 text-slate-500">
                            {product.units.toLocaleString('en-IN')}
                          </td>

                          <td className="px-6 py-4 font-semibold">
                            {formatCurrency(product.sales)}
                          </td>

                          <td className="px-6 py-4">
                            <span className={`rounded-full px-3 py-1 text-[10px] font-semibold ${
                              product.status === 'Excellent'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-blue-50 text-blue-600'
                            }`}>
                              {product.status}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {products.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-8 text-center text-sm text-slate-400"
                          >
                            No product data available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* FOOTER */}
              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 py-5 text-[10px] text-slate-400">
                <p>
                  © 2026 InsightFlow. Business Intelligence Platform.
                </p>

                <p className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  System operational
                </p>
              </footer>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function CheckCircleLabel({ filename }: { filename?: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      {filename ? `Dataset loaded: ${filename}` : null}
    </span>
  )
}

export default App
