import React from "react";
import { PracticeSession } from "../types";
import { TrendingUp, Award, BarChart2 } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

interface PracticeTrendsChartProps {
  practiceLogs: PracticeSession[];
  targetBand?: number;
}

// Beautiful Custom Dot component for the chart to differentiate points colored by tested module
const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;

  // Map module to attractive theme anchor colors
  const colorMap: Record<string, string> = {
    Listening: "#38bdf8", // sky
    Reading: "#34d399",  // emerald
    Speaking: "#f59e0b", // amber
    Writing: "#c084fc",  // purple
  };
  const activeColor = colorMap[payload.module] || "#4f46e5";

  return (
    <svg x={cx - 5} y={cy - 5} width={10} height={10} viewBox="0 0 10 10">
      <circle 
        cx={5} 
        cy={5} 
        r={4.5} 
        fill="#ffffff" 
        stroke={activeColor} 
        strokeWidth={2.5} 
        className="shadow-xs cursor-pointer" 
      />
    </svg>
  );
};

// Rich, comprehensive tooltips
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const badgeColors: Record<string, string> = {
      Listening: "bg-sky-100 text-sky-800 border-sky-200",
      Reading: "bg-emerald-100 text-emerald-850 border-emerald-200",
      Speaking: "bg-amber-100 text-amber-850 border-amber-250",
      Writing: "bg-purple-100 text-purple-800 border-purple-200",
    };
    const badgeClass = badgeColors[data.module] || "bg-indigo-100 text-indigo-800 border-indigo-200";

    return (
      <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xl max-w-[220px] text-xs space-y-1.5 animate-fadeIn">
        <div className="flex justify-between items-center gap-2">
          <span className="text-[10px] text-slate-500 font-bold">{data.date}</span>
          <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase tracking-wider ${badgeClass}`}>
            {data.module}
          </span>
        </div>
        <p className="font-extrabold text-slate-900 leading-tight truncate">{data.title}</p>
        <div className="flex justify-between items-center pt-1 border-t border-slate-100 mt-1">
          <span className="text-slate-500 font-semibold text-[10px]">IELTS band:</span>
          <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
            Band {data.band.toFixed(1)}
          </span>
        </div>
        {data.score && data.score !== "Evaluated" && (
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-semibold text-[10px]">Points:</span>
            <span className="font-bold text-slate-600">{data.score}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const PracticeTrendsChart: React.FC<PracticeTrendsChartProps> = ({ practiceLogs, targetBand }) => {
  // Process the practiceLogs to chronological order
  const sortedLogs = [...practiceLogs].reverse();

  // Create chart data points
  const data = sortedLogs.map((log, index) => {
    // Format timestamp nicely for discrete points
    let label = log.timestamp;
    if (label.includes(",")) {
      label = label.split(",")[0];
    }
    return {
      index: index + 1,
      name: `P-${index + 1}`,
      date: label,
      band: log.metrics.band,
      module: log.module,
      title: log.title,
      score: log.metrics.score || "Evaluated",
    };
  });

  // Calculate analytics
  const lowestBand = data.length > 0 ? Math.min(...data.map(d => d.band)) : 6.0;
  const highestBand = data.length > 0 ? Math.max(...data.map(d => d.band)) : 8.0;
  const averageBand = data.length > 0 
    ? Math.round((data.reduce((acc, d) => acc + d.band, 0) / data.length) * 10) / 10
    : 7.0;
  
  // Progress trend message
  let trendMessage = "Establish a baseline diagnostic scorecard.";
  if (data.length > 1) {
    const first = data[0].band;
    const last = data[data.length - 1].band;
    const diff = last - first;
    if (diff > 0) {
      trendMessage = `Estimated level increased by +${diff.toFixed(1)} band since baseline!`;
    } else if (diff === 0) {
      trendMessage = "Your band score is holding steady at a productive level.";
    } else {
      trendMessage = "Support weak modules in order to recover peak estimated level.";
    }
  } else if (data.length === 1) {
    trendMessage = "Baseline scorecard active. Practice more to analyze trends.";
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl min-h-[220px]" id="trends-empty-state">
        <BarChart2 className="w-10 h-10 text-slate-400 mb-2 animate-bounce" />
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">No Practice History</h4>
        <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
          Launch and complete structured listening or reading sessions to begin tracking your band evaluations.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full justify-between" id="practice-trends-section-wrapper">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-[#1e1548] flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-indigo-650" />
            Band Score Progress Tracker
          </h3>
          <p className="text-[11px] text-slate-500/95 font-semibold mt-0.5">{trendMessage}</p>
        </div>
        
        {/* Trend summary metrics chips */}
        <div className="flex flex-wrap gap-1.5 self-stretch sm:self-auto shrink-0 select-none font-mono">
          <div className="flex-1 sm:flex-initial px-2 py-0.5 bg-slate-50 border border-slate-200/60 rounded-xl text-center">
            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Start</span>
            <span className="text-xs font-extrabold text-slate-800">Band {data[0].band.toFixed(1)}</span>
          </div>
          <div className="flex-1 sm:flex-initial px-2 py-0.5 bg-amber-50 border border-amber-100 rounded-xl text-center">
            <span className="block text-[8px] font-bold text-amber-500 uppercase tracking-wider">Peak</span>
            <span className="text-xs font-extrabold text-amber-950">Band {highestBand.toFixed(1)}</span>
          </div>
          <div className="flex-1 sm:flex-initial px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
            <span className="block text-[8px] font-bold text-emerald-500 uppercase tracking-wider">Mean</span>
            <span className="text-xs font-extrabold text-emerald-950">Band {averageBand.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="w-full h-52 relative mt-2" id="recharts-trends-canvas">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 12, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 9, fontWeight: "bold", fill: "#64748b" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={{ stroke: "#e2e8f0" }}
            />
            <YAxis 
              domain={[4.0, 9.0]} 
              ticks={[4, 5, 6, 7, 8, 9]}
              tick={{ fontSize: 9, fontWeight: "bold", fill: "#64748b" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={{ stroke: "#e2e8f0" }}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ stroke: "#c7d2fe", strokeWidth: 1.5, strokeDasharray: "4 4" }}
            />
            {targetBand && (
              <ReferenceLine 
                y={targetBand} 
                stroke="#db2777" 
                strokeWidth={1.5}
                strokeDasharray="4 4" 
                label={{ 
                  value: `Target (Band ${targetBand.toFixed(1)})`, 
                  fill: "#db2777", 
                  position: "insideBottomRight", 
                  fontSize: 9, 
                  fontWeight: "black",
                  offset: 8,
                }} 
              />
            )}
            <Area 
              type="monotone" 
              dataKey="band" 
              stroke="#6366f1"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorBand)"
              dot={<CustomDot />}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
