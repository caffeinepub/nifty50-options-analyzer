import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  AlertCircle,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Clock,
  LayoutDashboard,
  LineChart,
  RefreshCw,
  Settings2,
  Shield,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  Wrench,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import type { Analysis, Preferences } from "./backend";
import {
  useAddAnalysis,
  useClearHistory,
  useGetAnalysisHistory,
  useGetPreferences,
  useStorePreferences,
} from "./hooks/useQueries";
import { runFullAnalysis } from "./utils/analysis";

const AUTO_REFRESH_SECONDS = 15 * 60;

const TEAL = "#37D6C5";
const DANGER = "#EF4444";
const WARNING = "#F2C14E";

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtTime(ts: bigint): string {
  const ms = Number(ts / 1_000_000n);
  return new Date(ms).toLocaleTimeString();
}

function SRBar({
  spot,
  support,
  resistance,
}: {
  spot: number;
  support: number;
  resistance: number;
}) {
  const min = support - 200;
  const max = resistance + 200;
  const range = max - min;
  const spotPct = ((spot - min) / range) * 100;
  const supPct = ((support - min) / range) * 100;
  const resPct = ((resistance - min) / range) * 100;
  return (
    <div
      className="relative h-6 rounded-full"
      style={{ background: "oklch(var(--navy-input))" }}
    >
      <div
        className="absolute inset-y-0 rounded-full"
        style={{
          left: `${supPct}%`,
          right: `${100 - resPct}%`,
          background: "oklch(var(--teal) / 0.15)",
          borderLeft: `2px solid ${TEAL}`,
          borderRight: `2px solid ${DANGER}`,
        }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2"
        style={{
          left: `calc(${spotPct}% - 6px)`,
          background: "#fff",
          borderColor: TEAL,
          boxShadow: `0 0 8px ${TEAL}`,
        }}
      />
      <span
        className="absolute -top-5 text-xs"
        style={{ left: `${supPct}%`, color: TEAL }}
      >
        S1
      </span>
      <span
        className="absolute -top-5 text-xs"
        style={{ left: `${resPct}%`, color: DANGER }}
      >
        R1
      </span>
    </div>
  );
}

interface ExpiryCardProps {
  label: string;
  expiryDate: string;
  result: ReturnType<typeof runFullAnalysis>;
  premium: number;
  optionType: string;
  sparkData: { v: number }[];
}

function ExpiryCard({
  label,
  expiryDate,
  result,
  premium,
  optionType,
  sparkData,
}: ExpiryCardProps) {
  const isCall = optionType === "call";
  const recColor = result.recommendation.includes("BUY CALL")
    ? "text-teal-500"
    : result.recommendation.includes("BUY PUT")
      ? "text-danger"
      : result.recommendation.includes("STRADDLE")
        ? "text-warning"
        : "text-muted-foreground";

  const sparkValues = sparkData.map((d) => d.v);
  const maxV = sparkValues.length > 0 ? Math.max(...sparkValues) : 0;
  const minV = sparkValues.length > 0 ? Math.min(...sparkValues) : 0;

  const metrics: [string, string, string][] = [
    ["Delta", result.delta.toFixed(2), isCall ? TEAL : DANGER],
    ["PoP", `${result.pop}%`, TEAL],
    ["R/R", result.riskReward, WARNING],
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border p-5 flex flex-col gap-3"
      style={{
        background: "oklch(var(--navy-card))",
        borderColor: "oklch(var(--navy-border))",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={16} style={{ color: TEAL }} />
          <span
            className="font-semibold text-sm"
            style={{ color: "oklch(var(--foreground))" }}
          >
            {label}
          </span>
        </div>
        <span
          className="text-xs"
          style={{ color: "oklch(var(--muted-foreground))" }}
        >
          {expiryDate}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div
          className="rounded-lg p-3"
          style={{ background: "oklch(var(--navy-input))" }}
        >
          <div
            className="text-xs mb-1"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            🎯 Target
          </div>
          <div className="text-xl font-bold" style={{ color: TEAL }}>
            ₹{result.target}
          </div>
          <div
            className="text-xs mt-0.5"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            +{(((result.target - premium) / premium) * 100).toFixed(0)}%
          </div>
        </div>
        <div
          className="rounded-lg p-3"
          style={{ background: "oklch(var(--navy-input))" }}
        >
          <div
            className="text-xs mb-1"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            🛑 Stop-Loss
          </div>
          <div className="text-xl font-bold" style={{ color: DANGER }}>
            ₹{result.stopLoss}
          </div>
          <div
            className="text-xs mt-0.5"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            -{(((premium - result.stopLoss) / premium) * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {metrics.map(([metricLabel, val, col]) => (
          <div
            key={metricLabel}
            className="rounded-lg p-2"
            style={{ background: "oklch(var(--navy-input))" }}
          >
            <div
              className="text-xs"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              {metricLabel}
            </div>
            <div className="font-bold text-sm mt-0.5" style={{ color: col }}>
              {val}
            </div>
          </div>
        ))}
      </div>

      <div
        className="text-xs"
        style={{ color: "oklch(var(--muted-foreground))" }}
      >
        <span>
          Breakeven:{" "}
          <strong style={{ color: "oklch(var(--foreground))" }}>
            ₹{result.breakeven.toFixed(0)}
          </strong>
        </span>
        <span className="ml-3">Expected ±{result.expectedMove} pts</span>
      </div>

      {sparkData.length > 0 && (
        <div className="h-16">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={sparkData}
              margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
            >
              <defs>
                <linearGradient
                  id={`spark-${label}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={TEAL} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis domain={[minV * 0.999, maxV * 1.001]} hide />
              <Area
                type="monotone"
                dataKey="v"
                stroke={TEAL}
                strokeWidth={1.5}
                fill={`url(#spark-${label})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className={`text-xs font-semibold mt-1 ${recColor}`}>
        {result.recommendation}
      </div>
    </motion.div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_SECONDS);
  const [lastUpdated, setLastUpdated] = useState<string>("--:--:--");
  const [historyOpen, setHistoryOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Form state
  const [spot, setSpot] = useState(23114.5);
  const [vix, setVix] = useState(22.4);
  const [weeklyDate, setWeeklyDate] = useState("27 Mar 2026");
  const [monthlyDate, setMonthlyDate] = useState("30 Mar 2026");
  const [optionType, setOptionType] = useState("call");
  const [premium, setPremium] = useState(185);
  const [strike, setStrike] = useState(0);
  const [supportLevel, setSupportLevel] = useState(23000);
  const [resistanceLevel, setResistanceLevel] = useState(23500);

  // Analysis results
  const [weeklyResult, setWeeklyResult] = useState<ReturnType<
    typeof runFullAnalysis
  > | null>(null);
  const [monthlyResult, setMonthlyResult] = useState<ReturnType<
    typeof runFullAnalysis
  > | null>(null);
  const [sparkData, setSparkData] = useState<{ v: number }[]>([]);

  // Backend hooks
  const { data: prefs } = useGetPreferences();
  const { data: historyRaw, isLoading: histLoading } = useGetAnalysisHistory();
  const storePrefs = useStorePreferences();
  const addAnalysis = useAddAnalysis();
  const clearHistory = useClearHistory();

  // Populate form from saved prefs
  useEffect(() => {
    if (!prefs) return;
    if (prefs.spotPrice > 0) setSpot(prefs.spotPrice);
    if (prefs.vix > 0) setVix(prefs.vix);
    if (prefs.premium > 0) setPremium(prefs.premium);
    if (prefs.strike > 0) setStrike(prefs.strike);
    if (prefs.supportLevel > 0) setSupportLevel(prefs.supportLevel);
    if (prefs.resistanceLevel > 0) setResistanceLevel(prefs.resistanceLevel);
    if (prefs.optionType) setOptionType(prefs.optionType);
    if (prefs.expiryDates?.[0]) setWeeklyDate(prefs.expiryDates[0]);
    if (prefs.expiryDates?.[1]) setMonthlyDate(prefs.expiryDates[1]);
  }, [prefs]);

  const history: Analysis[] = historyRaw
    ? [...historyRaw]
        .sort((a, b) => Number(b.timestamp - a.timestamp))
        .slice(0, 50)
    : [];

  const runAnalysis = useCallback(() => {
    const wRes = runFullAnalysis(
      spot,
      vix,
      premium,
      optionType,
      supportLevel,
      resistanceLevel,
      strike || null,
    );
    const mRes = runFullAnalysis(
      spot,
      vix,
      premium,
      optionType,
      supportLevel,
      resistanceLevel,
      strike || null,
    );
    setWeeklyResult(wRes);
    setMonthlyResult(mRes);
    setLastUpdated(new Date().toLocaleTimeString());

    const hData = historyRaw?.slice(-12).map((h) => ({ v: h.spot })) ?? [];
    setSparkData(
      hData.length > 2
        ? hData
        : Array.from({ length: 12 }, () => ({
            v: spot + (Math.random() - 0.5) * 50,
          })),
    );

    addAnalysis.mutate({
      spot,
      vix,
      upsidePercentage: wRes.probs.upside,
      downsidePercentage: wRes.probs.downside,
      volatilePercentage: wRes.probs.volatile,
      weeklyTarget: wRes.target,
      weeklyStopLoss: wRes.stopLoss,
      monthlyTarget: mRes.target,
      monthlyStopLoss: mRes.stopLoss,
    });

    storePrefs.mutate({
      spotPrice: spot,
      vix,
      premium,
      strike,
      supportLevel,
      resistanceLevel,
      optionType,
      expiryDates: [weeklyDate, monthlyDate],
    });

    toast.success("Analysis updated", {
      description: `Spot ₹${spot.toLocaleString()} | VIX ${vix}`,
    });
  }, [
    spot,
    vix,
    premium,
    optionType,
    supportLevel,
    resistanceLevel,
    strike,
    weeklyDate,
    monthlyDate,
    historyRaw,
    addAnalysis,
    storePrefs,
  ]);

  // Initial analysis once prefs loaded
  const ranInitial = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally fire once when prefs load
  useEffect(() => {
    if (prefs && !ranInitial.current) {
      ranInitial.current = true;
      setTimeout(() => runAnalysis(), 100);
    }
    // runAnalysis intentionally excluded — only want to fire once after prefs load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs]);

  // Countdown timer
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          runAnalysis();
          return AUTO_REFRESH_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, runAnalysis]);

  const handleManualRefresh = () => {
    setCountdown(AUTO_REFRESH_SECONDS);
    runAnalysis();
  };

  const handleClearHistory = () => {
    clearHistory.mutate(undefined, {
      onSuccess: () => toast.success("History cleared"),
    });
  };

  const countdownStr = `${String(Math.floor(countdown / 60)).padStart(2, "0")}:${String(countdown % 60).padStart(2, "0")}`;

  const donut = weeklyResult
    ? [
        { name: "Upside", value: weeklyResult.probs.upside, color: TEAL },
        { name: "Downside", value: weeklyResult.probs.downside, color: DANGER },
        {
          name: "Volatile",
          value: weeklyResult.probs.volatile,
          color: WARNING,
        },
      ]
    : [];

  const navTabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "markets", label: "Markets", icon: TrendingUp },
    { id: "analysis", label: "Analysis", icon: LineChart },
    { id: "tools", label: "Tools", icon: Wrench },
    { id: "account", label: "Account", icon: User },
  ];

  const numericInputs = [
    { label: "Nifty Spot Price (₹)", val: spot, set: setSpot, step: 10 },
    { label: "VIX", val: vix, set: setVix, step: 0.1 },
    { label: "Premium (₹)", val: premium, set: setPremium, step: 5 },
    { label: "Strike (0 = ATM)", val: strike, set: setStrike, step: 50 },
  ] as const;

  return (
    <div
      className="min-h-screen"
      style={{ background: "oklch(var(--navy-deep))" }}
    >
      <Toaster theme="dark" position="top-right" />

      {/* ── Sticky Navbar ── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: "oklch(var(--sidebar))",
          borderColor: "oklch(var(--navy-border))",
        }}
      >
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: TEAL }}
            >
              <Activity size={14} color="#0B1220" />
            </div>
            <span
              className="font-display font-bold text-sm whitespace-nowrap"
              style={{ color: "oklch(var(--foreground))" }}
            >
              Nifty Options Analyzer
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                data-ocid={`nav.${tab.id}.link`}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                style={{
                  color:
                    activeTab === tab.id
                      ? TEAL
                      : "oklch(var(--muted-foreground))",
                  background:
                    activeTab === tab.id
                      ? "oklch(var(--teal) / 0.12)"
                      : "transparent",
                }}
              >
                <tab.icon size={13} />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
              style={{
                background: "oklch(var(--navy-border))",
                color: "oklch(var(--muted-foreground))",
              }}
            >
              <User size={12} />
              <span>User</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6">
        {/* ── Page Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1
              className="font-display font-bold text-2xl"
              style={{ color: "oklch(var(--foreground))" }}
            >
              Dashboard{" "}
              <span style={{ color: "oklch(var(--muted-foreground))" }}>|</span>{" "}
              <span style={{ color: TEAL }}>Nifty 50 Options Analyzer</span>
            </h1>
            <p
              className="text-xs mt-1"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              Last updated:{" "}
              <span style={{ color: "oklch(var(--foreground))" }}>
                {lastUpdated}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg border"
              style={{
                background: "oklch(var(--navy-card))",
                borderColor: "oklch(var(--navy-border))",
              }}
            >
              <span
                className="text-xs"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                Auto-Refresh
              </span>
              <Switch
                data-ocid="autorefresh.switch"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
                className="data-[state=checked]:bg-teal-500"
              />
              <span
                className="text-xs font-semibold"
                style={{
                  color: autoRefresh ? TEAL : "oklch(var(--muted-foreground))",
                }}
              >
                {autoRefresh ? "ON" : "OFF"}
              </span>
            </div>

            {autoRefresh && (
              <div
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono border"
                style={{
                  background: "oklch(var(--navy-card))",
                  borderColor: "oklch(var(--navy-border))",
                  color: TEAL,
                }}
              >
                <Clock size={12} />
                <span>{countdownStr}</span>
              </div>
            )}

            <Button
              data-ocid="analysis.refresh.button"
              size="sm"
              onClick={handleManualRefresh}
              className="gap-1.5 text-xs rounded-full px-4"
              style={{ background: TEAL, color: "#0B1220" }}
            >
              <RefreshCw size={12} />
              Refresh Now
            </Button>
          </div>
        </div>

        {/* ── Row 1: Market Inputs + Probability Donut ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Market Inputs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border p-5"
            style={{
              background: "oklch(var(--navy-card))",
              borderColor: "oklch(var(--navy-border))",
              boxShadow:
                "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Settings2 size={15} style={{ color: TEAL }} />
              <h2
                className="font-semibold text-sm"
                style={{ color: "oklch(var(--foreground))" }}
              >
                Market Inputs
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {numericInputs.map(({ label, val, set, step }) => (
                <div key={label}>
                  <Label
                    className="text-xs mb-1 block"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    {label}
                  </Label>
                  <Input
                    data-ocid={`market_inputs.${label
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, "_")}.input`}
                    type="number"
                    value={val}
                    step={step}
                    onChange={(e) =>
                      set(Number.parseFloat(e.target.value) || 0)
                    }
                    className="h-9 text-sm rounded-lg"
                    style={{
                      background: "oklch(var(--navy-input))",
                      borderColor: "oklch(var(--navy-border))",
                      color: "oklch(var(--foreground))",
                    }}
                  />
                </div>
              ))}

              <div>
                <Label
                  className="text-xs mb-1 block"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  Weekly Expiry
                </Label>
                <Input
                  data-ocid="market_inputs.weekly_expiry.input"
                  type="text"
                  value={weeklyDate}
                  onChange={(e) => setWeeklyDate(e.target.value)}
                  className="h-9 text-sm rounded-lg"
                  style={{
                    background: "oklch(var(--navy-input))",
                    borderColor: "oklch(var(--navy-border))",
                    color: "oklch(var(--foreground))",
                  }}
                />
              </div>

              <div>
                <Label
                  className="text-xs mb-1 block"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  Monthly Expiry
                </Label>
                <Input
                  data-ocid="market_inputs.monthly_expiry.input"
                  type="text"
                  value={monthlyDate}
                  onChange={(e) => setMonthlyDate(e.target.value)}
                  className="h-9 text-sm rounded-lg"
                  style={{
                    background: "oklch(var(--navy-input))",
                    borderColor: "oklch(var(--navy-border))",
                    color: "oklch(var(--foreground))",
                  }}
                />
              </div>

              <div className="col-span-2">
                <Label
                  className="text-xs mb-1 block"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  Option Type
                </Label>
                <Select value={optionType} onValueChange={setOptionType}>
                  <SelectTrigger
                    data-ocid="market_inputs.option_type.select"
                    className="h-9 text-sm rounded-lg"
                    style={{
                      background: "oklch(var(--navy-input))",
                      borderColor: "oklch(var(--navy-border))",
                      color: "oklch(var(--foreground))",
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      background: "oklch(var(--navy-card))",
                      borderColor: "oklch(var(--navy-border))",
                    }}
                  >
                    <SelectItem value="call">Call (CE)</SelectItem>
                    <SelectItem value="put">Put (PE)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              data-ocid="analysis.update_analyze.primary_button"
              onClick={handleManualRefresh}
              className="w-full mt-4 h-10 rounded-full font-semibold text-sm gap-2"
              style={{
                background: `linear-gradient(135deg, ${TEAL}, oklch(0.70 0.10 187))`,
                color: "#0B1220",
              }}
            >
              <TrendingUp size={15} />
              Update & Analyze
            </Button>
          </motion.div>

          {/* Probability Donut */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-xl border p-5 flex flex-col"
            style={{
              background: "oklch(var(--navy-card))",
              borderColor: "oklch(var(--navy-border))",
              boxShadow:
                "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Target size={15} style={{ color: TEAL }} />
              <h2
                className="font-semibold text-sm"
                style={{ color: "oklch(var(--foreground))" }}
              >
                Probability of Profit
              </h2>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
              {weeklyResult ? (
                <>
                  <div className="relative h-44 w-44">
                    <PieChart width={176} height={176}>
                      <Pie
                        data={donut}
                        cx={80}
                        cy={80}
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {donut.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={entry.color}
                            stroke="transparent"
                          />
                        ))}
                      </Pie>
                      <RechartTooltip
                        contentStyle={{
                          background: "oklch(var(--navy-card))",
                          border: "1px solid oklch(var(--navy-border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span
                        className="text-xs"
                        style={{ color: "oklch(var(--muted-foreground))" }}
                      >
                        PoP
                      </span>
                      <span
                        className="text-2xl font-bold"
                        style={{ color: TEAL }}
                      >
                        {weeklyResult.pop}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 w-full mt-4">
                    {(
                      [
                        ["Upside", weeklyResult.probs.upside, TEAL, TrendingUp],
                        [
                          "Downside",
                          weeklyResult.probs.downside,
                          DANGER,
                          TrendingDown,
                        ],
                        ["Volatile", weeklyResult.probs.volatile, WARNING, Zap],
                      ] as const
                    ).map(([name, value, color, Icon]) => (
                      <div
                        key={name}
                        className="text-center rounded-lg p-3"
                        style={{ background: "oklch(var(--navy-input))" }}
                      >
                        <Icon
                          size={14}
                          style={{ color, margin: "0 auto 4px" }}
                        />
                        <div className="text-xl font-bold" style={{ color }}>
                          {value}%
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: "oklch(var(--muted-foreground))" }}
                        >
                          {name}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    className="mt-4 w-full rounded-lg p-3 border"
                    style={{
                      background: "oklch(var(--navy-input))",
                      borderColor: "oklch(var(--navy-border))",
                    }}
                  >
                    <div
                      className="text-xs font-semibold mb-1"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    >
                      ATM Strike
                    </div>
                    <div className="text-lg font-bold" style={{ color: TEAL }}>
                      {weeklyResult.atmStrike}
                    </div>
                    <div
                      className="text-xs mt-1"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    >
                      Expected Move: ±{weeklyResult.expectedMove} pts
                    </div>
                  </div>
                </>
              ) : (
                <div
                  className="flex flex-col items-center gap-2 text-center"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  <AlertCircle size={24} />
                  <p className="text-sm">Run analysis to see probabilities</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Row 2: Weekly & Monthly Expiry ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {weeklyResult && (
            <ExpiryCard
              label="Weekly Expiry"
              expiryDate={weeklyDate}
              result={weeklyResult}
              premium={premium}
              optionType={optionType}
              sparkData={sparkData}
            />
          )}
          {monthlyResult && (
            <ExpiryCard
              label="Monthly Expiry"
              expiryDate={monthlyDate}
              result={monthlyResult}
              premium={premium}
              optionType={optionType}
              sparkData={sparkData}
            />
          )}
        </div>

        {/* ── Row 3: Support/Resistance ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border p-5 mb-5"
          style={{
            background: "oklch(var(--navy-card))",
            borderColor: "oklch(var(--navy-border))",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield size={15} style={{ color: TEAL }} />
            <h2
              className="font-semibold text-sm"
              style={{ color: "oklch(var(--foreground))" }}
            >
              Configurable Support / Resistance Levels
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div>
              <Label
                className="text-xs mb-1 block"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                S1 Support
              </Label>
              <Input
                data-ocid="sr.s1_support.input"
                type="number"
                value={supportLevel}
                step={50}
                onChange={(e) =>
                  setSupportLevel(Number.parseFloat(e.target.value) || 0)
                }
                className="h-9 text-sm rounded-lg"
                style={{
                  background: "oklch(var(--navy-input))",
                  borderColor: "oklch(var(--navy-border))",
                  color: TEAL,
                }}
              />
            </div>
            <div>
              <Label
                className="text-xs mb-1 block"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                R1 Resistance
              </Label>
              <Input
                data-ocid="sr.r1_resistance.input"
                type="number"
                value={resistanceLevel}
                step={50}
                onChange={(e) =>
                  setResistanceLevel(Number.parseFloat(e.target.value) || 0)
                }
                className="h-9 text-sm rounded-lg"
                style={{
                  background: "oklch(var(--navy-input))",
                  borderColor: "oklch(var(--navy-border))",
                  color: DANGER,
                }}
              />
            </div>
            <div>
              <Label
                className="text-xs mb-1 block"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                S2 (S1 - 100)
              </Label>
              <div
                className="h-9 flex items-center px-3 rounded-lg text-sm font-semibold"
                style={{ background: "oklch(var(--navy-input))", color: TEAL }}
              >
                {(supportLevel - 100).toLocaleString()}
              </div>
            </div>
            <div>
              <Label
                className="text-xs mb-1 block"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                R2 (R1 + 100)
              </Label>
              <div
                className="h-9 flex items-center px-3 rounded-lg text-sm font-semibold"
                style={{
                  background: "oklch(var(--navy-input))",
                  color: DANGER,
                }}
              >
                {(resistanceLevel + 100).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="pt-3">
            <div
              className="flex justify-between text-xs mb-2"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              <span>S2 {(supportLevel - 100).toLocaleString()}</span>
              <span style={{ color: "oklch(var(--foreground))" }}>
                Spot ₹{spot.toLocaleString()}
              </span>
              <span>R2 {(resistanceLevel + 100).toLocaleString()}</span>
            </div>
            <SRBar
              spot={spot}
              support={supportLevel}
              resistance={resistanceLevel}
            />
          </div>
        </motion.div>

        {/* ── Row 4: Trade History Log ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border"
          style={{
            background: "oklch(var(--navy-card))",
            borderColor: "oklch(var(--navy-border))",
          }}
        >
          <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                data-ocid="history.panel"
                className="w-full flex items-center justify-between p-5 hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-2">
                  <Activity size={15} style={{ color: TEAL }} />
                  <h2
                    className="font-semibold text-sm"
                    style={{ color: "oklch(var(--foreground))" }}
                  >
                    Live Trade History Log
                  </h2>
                  <Badge
                    variant="secondary"
                    className="text-xs"
                    style={{
                      background: "oklch(var(--teal) / 0.15)",
                      color: TEAL,
                    }}
                  >
                    {history.length} entries
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    data-ocid="history.clear.delete_button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearHistory();
                    }}
                    className="h-7 gap-1.5 text-xs rounded-lg px-2"
                    style={{ color: DANGER }}
                  >
                    <Trash2 size={12} />
                    Clear History
                  </Button>
                  {historyOpen ? (
                    <ChevronUp
                      size={16}
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    />
                  ) : (
                    <ChevronDown
                      size={16}
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    />
                  )}
                </div>
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div
                className="border-t"
                style={{ borderColor: "oklch(var(--navy-border))" }}
              >
                {histLoading ? (
                  <div
                    className="p-6 text-center text-sm"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                    data-ocid="history.loading_state"
                  >
                    Loading history...
                  </div>
                ) : history.length === 0 ? (
                  <div
                    className="p-6 text-center"
                    data-ocid="history.empty_state"
                  >
                    <Activity
                      size={24}
                      style={{
                        color: "oklch(var(--muted-foreground))",
                        margin: "0 auto 8px",
                      }}
                    />
                    <p
                      className="text-sm"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    >
                      No analysis history yet. Run your first analysis!
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-64">
                    <Table>
                      <TableHeader>
                        <TableRow
                          style={{
                            borderColor: "oklch(var(--navy-border))",
                          }}
                        >
                          {[
                            "Time",
                            "Spot",
                            "VIX",
                            "↑ Up%",
                            "↓ Down%",
                            "⚡ Vol%",
                            "W.Target",
                            "W.SL",
                            "M.Target",
                            "M.SL",
                          ].map((h) => (
                            <TableHead
                              key={h}
                              className="text-xs py-2"
                              style={{
                                color: "oklch(var(--muted-foreground))",
                                background: "oklch(var(--navy-input))",
                              }}
                            >
                              {h}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {history.map((row, i) => (
                            <motion.tr
                              key={row.timestamp.toString()}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              data-ocid={`history.item.${i + 1}`}
                              style={{
                                borderColor: "oklch(var(--navy-border))",
                              }}
                              className="text-xs"
                            >
                              <TableCell
                                className="py-2"
                                style={{
                                  color: "oklch(var(--muted-foreground))",
                                }}
                              >
                                {fmtTime(row.timestamp)}
                              </TableCell>
                              <TableCell
                                className="py-2 font-medium"
                                style={{ color: "oklch(var(--foreground))" }}
                              >
                                ₹{row.spot.toLocaleString()}
                              </TableCell>
                              <TableCell
                                className="py-2"
                                style={{ color: WARNING }}
                              >
                                {row.vix}
                              </TableCell>
                              <TableCell
                                className="py-2 font-semibold"
                                style={{ color: TEAL }}
                              >
                                {row.upsidePercentage}%
                              </TableCell>
                              <TableCell
                                className="py-2 font-semibold"
                                style={{ color: DANGER }}
                              >
                                {row.downsidePercentage}%
                              </TableCell>
                              <TableCell
                                className="py-2 font-semibold"
                                style={{ color: WARNING }}
                              >
                                {row.volatilePercentage}%
                              </TableCell>
                              <TableCell
                                className="py-2"
                                style={{ color: TEAL }}
                              >
                                ₹{row.weeklyTarget}
                              </TableCell>
                              <TableCell
                                className="py-2"
                                style={{ color: DANGER }}
                              >
                                ₹{row.weeklyStopLoss}
                              </TableCell>
                              <TableCell
                                className="py-2"
                                style={{ color: TEAL }}
                              >
                                ₹{row.monthlyTarget}
                              </TableCell>
                              <TableCell
                                className="py-2"
                                style={{ color: DANGER }}
                              >
                                ₹{row.monthlyStopLoss}
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </motion.div>
      </main>

      {/* Footer */}
      <footer
        className="text-center py-6 text-xs border-t mt-8"
        style={{
          color: "oklch(var(--muted-foreground))",
          borderColor: "oklch(var(--navy-border))",
        }}
      >
        <p>
          ⚠️ This tool is for educational purposes only. Not financial advice.
          Always use stop-losses.
        </p>
        <p className="mt-1">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: TEAL }}
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
