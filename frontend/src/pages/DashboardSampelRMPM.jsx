/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useColorMode, useColorModeValue, Button, Spinner } from "@chakra-ui/react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
      AlertCircle, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, RefreshCcw,
      TrendingUp, TrendingDown, Activity, Zap, Target, Users, FileText,
      Play, Pause, BarChart3, PieChart as PieChartIcon, Eye
} from "lucide-react";

// Helper: convert string to number safely
const num = (val) => Number(val || 0);

// Pie chart data generators
const getPieChartData = (total, pending, released, rejected) => [
      { name: "Pending", value: num(pending), color: "#f59e0b", icon: Clock },
      { name: "Released", value: num(released), color: "#10b981", icon: CheckCircle },
      { name: "Rejected", value: num(rejected), color: "#ef4444", icon: XCircle }
];

// Months for breakdown
const months = [
      { key: "jan", label: "Jan" }, { key: "feb", label: "Feb" }, { key: "mar", label: "Mar" },
      { key: "apr", label: "Apr" }, { key: "may", label: "May" }, { key: "jun", label: "Jun" },
      { key: "jul", label: "Jul" }, { key: "aug", label: "Aug" }, { key: "sep", label: "Sep" },
      { key: "oct", label: "Oct" }, { key: "nov", label: "Nov" }, { key: "dec", label: "Dec" }
];

// Animated counter for numbers
const AnimatedCounter = ({ value, duration = 1000 }) => {
      const [count, setCount] = useState(0);

      useEffect(() => {
            let startTime;
            const animate = (timestamp) => {
                  if (!startTime) startTime = timestamp;
                  const progress = Math.min((timestamp - startTime) / duration, 1);
                  setCount(Math.floor(progress * num(value)));
                  if (progress < 1) {
                        requestAnimationFrame(animate);
                  } else {
                        setCount(num(value)); // ensure it lands on final value
                  }
            };
            requestAnimationFrame(animate);
            // eslint-disable-next-line
      }, [value, duration]);

      return <span>{count}</span>;
};

// Pulse animation
const PulseIcon = ({ children, color = "text-blue-500" }) => (
      <div className={`${color} animate-pulse`}>
            {children}
      </div>
);

// Floating card
const FloatingCard = ({ children }) => (
      <div className="transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
            {children}
      </div>
);

// Monthly breakdown modal
const BreakdownMonthlyBox = ({ data, title, color, onClose }) => {
      const getBg = (color) => {
            const map = {
                  blue: "from-blue-50 to-blue-100 border-blue-200",
                  orange: "from-orange-50 to-orange-100 border-orange-200",
                  green: "from-green-50 to-green-100 border-green-200",
                  red: "from-red-50 to-red-100 border-red-200"
            };
            return map[color] || map.blue;
      };
      const bg = getBg(color);
      return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
                  <div className={`w-full max-w-lg mx-auto rounded-xl border shadow-2xl p-6 bg-white dark:bg-gray-900 border ${bg} animate-fadeIn relative`}>
                        <button className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800" onClick={onClose}>
                              <XCircle size={20} />
                        </button>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                              <BarChart3 size={22} /> {title} (Breakdown per Bulan)
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                              {months.map(m => (
                                    <div key={m.key} className={`rounded-lg p-3 bg-gradient-to-br ${bg} shadow text-center`}>
                                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{m.label}</div>
                                          <div className="text-lg font-bold">
                                                {num(data[m.key])}
                                          </div>
                                    </div>
                              ))}
                        </div>
                  </div>
            </div>
      );
};

// Enhanced Pending Box Component
const EnhancedPendingBox = ({ label, value, icon: Icon, color }) => {
      const getColorClasses = (color) => {
            const colors = {
                  orange: "bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 text-orange-800",
                  blue: "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 text-blue-800",
                  purple: "bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 text-purple-800",
                  indigo: "bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-800",
                  green: "bg-gradient-to-r from-green-50 to-green-100 border-green-200 text-green-800"
            };
            return colors[color] || colors.blue;
      };

      const getIconColor = (color) => {
            const colors = {
                  orange: "text-orange-600",
                  blue: "text-blue-600",
                  purple: "text-purple-600",
                  indigo: "text-indigo-600",
                  green: "text-green-600"
            };
            return colors[color] || colors.blue;
      };

      return (
            <div className={`${getColorClasses(color)} rounded-lg p-4 border shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105`}>
                  <div className="flex items-center justify-between mb-2">
                        <Icon className={`${getIconColor(color)} animate-pulse`} size={18} />
                        <span className="text-lg font-bold">
                              <AnimatedCounter value={value} />
                        </span>
                  </div>
                  <p className="text-xs font-medium opacity-80">{label}</p>
            </div>
      );
};

export default function SampleMonitoringDashboard() {
      // State
      const [qcData, setQcData] = useState(null);
      const [loading, setLoading] = useState(false);
      const [autoRefresh, setAutoRefresh] = useState(false);
      const [chartView, setChartView] = useState('pie'); // 'pie' or 'bar'
      const [showPendingDetails, setShowPendingDetails] = useState(false);
      const [showPendingDetailsRM, setShowPendingDetailsRM] = useState(false);
      const [showPendingDetailsPM, setShowPendingDetailsPM] = useState(false);

      // State untuk breakdown bulanan
      const [showBreakdownAll, setShowBreakdownAll] = useState(false);
      const [showBreakdownRM, setShowBreakdownRM] = useState(false);
      const [showBreakdownPM, setShowBreakdownPM] = useState(false);

      const { colorMode } = useColorMode();

      // Chakra UI color mode values
      const bg = useColorModeValue("bg-gradient-to-br from-blue-50 via-white to-teal-50", "bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900");
      const boxBg = useColorModeValue("bg-white/80 backdrop-blur-sm", "bg-gray-800/80 backdrop-blur-sm");
      const headingColor = useColorModeValue("text-teal-700", "text-teal-300");
      const borderColor = useColorModeValue("border-gray-200/50", "border-gray-700/50");
      const textColor = useColorModeValue("text-gray-800", "text-gray-100");
      const subTextColor = useColorModeValue("text-gray-600", "text-gray-400");

      // Enhanced card variants with gradients
      const getPendingCardClass = () => `${boxBg} border border-orange-200/50 shadow-lg shadow-orange-100/50 hover:shadow-orange-200/50 ${textColor} bg-gradient-to-br from-orange-50/50 to-orange-100/30`;
      const getReleasedCardClass = () => `${boxBg} border border-green-200/50 shadow-lg shadow-green-100/50 hover:shadow-green-200/50 ${textColor} bg-gradient-to-br from-green-50/50 to-green-100/30`;
      const getRejectedCardClass = () => `${boxBg} border border-red-200/50 shadow-lg shadow-red-100/50 hover:shadow-red-200/50 ${textColor} bg-gradient-to-br from-red-50/50 to-red-100/30`;
      const getTotalCardClass = () => `${boxBg} border border-blue-200/50 shadow-lg shadow-blue-100/50 hover:shadow-blue-200/50 ${textColor} bg-gradient-to-br from-blue-50/50 to-blue-100/30`;

      // Fetch QC Data from API
      const fetchQcData = async () => {
            setLoading(true);
            try {
                  // Replace the URL below with your real API endpoint!
               const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/dashboardRMPM/dashboardRMPM-data`);
 // <-- Ganti ke endpoint backend kamu
                  if (!response.ok) throw new Error("Failed to fetch data");
                  const data = await response.json();
                  setQcData(data);
            } catch (err) {
                  // Optionally show error to user
                  setQcData(null);
            }
            setLoading(false);
      };

      // Initial load
      useEffect(() => {
            fetchQcData();
            // eslint-disable-next-line
      }, []);

      // Auto refresh effect
      useEffect(() => {
            let interval;
            if (autoRefresh) {
                  interval = setInterval(() => {
                        fetchQcData();
                  }, 30000);
            }
            return () => clearInterval(interval);
            // eslint-disable-next-line
      }, [autoRefresh]);

      // Manual refresh
      const handleRefresh = () => {
            fetchQcData();
      };

      // If data not loaded yet (on first load), show spinner
      if (!qcData) {
            return (
                  <div className="flex items-center justify-center min-h-screen">
                        <Spinner size="xl" color="teal.500" thickness="5px" />
                  </div>
            );
      }

      // Pie chart data for main, RM, and PM
      const pieMain = getPieChartData(
            qcData.total_sample_qc.jumlah_total_sampel_rmpm,
            qcData.total_sample_qc.Pending,
            qcData.total_sample_qc.released,
            qcData.total_sample_qc.reject
      );

      const pieRM = getPieChartData(
            qcData.total_sample_qc_rm.jumlah_total_sampel_rm,
            num(qcData.total_sample_qc_rm.pending_sampling_rm)
            + num(qcData.total_sample_qc_rm.pending_analisa_rm)
            + num(qcData.total_sample_qc_rm.pending_approval_spv_rm)
            + num(qcData.total_sample_qc_rm.pending_admin_rm)
            + num(qcData.total_sample_qc_rm.pending_approval_mgr_rm),
            qcData.total_sample_qc_rm.released_rm,
            qcData.total_sample_qc_rm.reject_rm
      );

      const piePM = getPieChartData(
            qcData.total_sample_qc_pm.jumlah_total_sampel_pm,
            num(qcData.total_sample_qc_pm.pending_sampling_pm)
            + num(qcData.total_sample_qc_pm.pending_analisa_pm)
            + num(qcData.total_sample_qc_pm.pending_approval_spv_pm)
            + num(qcData.total_sample_qc_pm.pending_admin_pm)
            + num(qcData.total_sample_qc_pm.pending_approval_mgr_pm),
            qcData.total_sample_qc_pm.released_pm,
            qcData.total_sample_qc_pm.reject_pm
      );

      // Bar chart data
      const barData = [
            { name: 'All Samples', pending: num(qcData.total_sample_qc.Pending), released: num(qcData.total_sample_qc.released), rejected: num(qcData.total_sample_qc.reject) },
            { name: 'RM', pending: num(qcData.total_sample_qc_rm.pending_sampling_rm) + num(qcData.total_sample_qc_rm.pending_analisa_rm) + num(qcData.total_sample_qc_rm.pending_approval_spv_rm) + num(qcData.total_sample_qc_rm.pending_admin_rm) + num(qcData.total_sample_qc_rm.pending_approval_mgr_rm), released: num(qcData.total_sample_qc_rm.released_rm), rejected: num(qcData.total_sample_qc_rm.reject_rm) },
            { name: 'PM', pending: num(qcData.total_sample_qc_pm.pending_sampling_pm) + num(qcData.total_sample_qc_pm.pending_analisa_pm) + num(qcData.total_sample_qc_pm.pending_approval_spv_pm) + num(qcData.total_sample_qc_pm.pending_admin_pm) + num(qcData.total_sample_qc_pm.pending_approval_mgr_pm), released: num(qcData.total_sample_qc_pm.released_pm), rejected: num(qcData.total_sample_qc_pm.reject_pm) }
      ];

      // Enhanced tooltip for charts
      const CustomTooltip = (total) => ({ active, payload, label }) => {
            if (active && payload && payload.length) {
                  return (
                        <div className={`${boxBg} p-3 border ${borderColor} rounded-lg shadow-xl backdrop-blur-sm`}>
                              <p className="font-semibold text-sm mb-2">{label || payload[0].name}</p>
                              {payload.map((entry, index) => (
                                    <div key={index} className="flex items-center gap-2 text-sm">
                                          <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: entry.color }}
                                          />
                                          <span className="font-medium">{entry.name}: {entry.value}</span>
                                          {total && (
                                                <span className={`${subTextColor} text-xs`}>
                                                      ({Math.round((entry.value / num(total)) * 100)}%)
                                                </span>
                                          )}
                                    </div>
                              ))}
                        </div>
                  );
            }
            return null;
      };

      // Calculate efficiency metrics
      const efficiency = {
            all: ((num(qcData.total_sample_qc.released) / num(qcData.total_sample_qc.jumlah_total_sampel_rmpm)) * 100).toFixed(1),
            rm: ((num(qcData.total_sample_qc_rm.released_rm) / num(qcData.total_sample_qc_rm.jumlah_total_sampel_rm)) * 100).toFixed(1),
            pm: ((num(qcData.total_sample_qc_pm.released_pm) / num(qcData.total_sample_qc_pm.jumlah_total_sampel_pm)) * 100).toFixed(1)
      };

      return (
            <div className={`min-h-screen ${bg} ${textColor} p-4 mt-20 w-full`}>
                  {/* Enhanced Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                        <div className="flex items-center">
                              <div className="relative">
                                    <PulseIcon color="text-teal-600">
                                          <div className="absolute inset-0 bg-teal-400 rounded-full opacity-25 animate-ping"></div>
                                          <Activity size={32} className="relative z-10" />
                                    </PulseIcon>
                              </div>
                              <div className="ml-4">
                                    <h1 className={`text-3xl font-bold ${headingColor} flex items-center gap-2`}>
                                          Sample Monitoring Dashboard
                                          <Zap size={24} className="text-yellow-500 animate-pulse" />
                                    </h1>
                                    <p className={`mt-2 ${subTextColor} flex items-center gap-2`}>
                                          <Target size={16} />
                                          Real-time sample processing status overview
                                    </p>
                              </div>
                        </div>

                        <div className="mt-4 sm:mt-0 flex gap-2">
                              <Button
                                    leftIcon={autoRefresh ? <Pause size={16} /> : <Play size={16} />}
                                    colorScheme={autoRefresh ? "orange" : "green"}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAutoRefresh(!autoRefresh)}
                                    className="animate-pulse"
                              >
                                    {autoRefresh ? "Stop Auto" : "Auto Refresh"}
                              </Button>
                              <Button
                                    leftIcon={loading ? <Spinner size="xs" /> : <RefreshCcw size={16} />}
                                    colorScheme="teal"
                                    variant="solid"
                                    size="sm"
                                    onClick={handleRefresh}
                                    isLoading={loading}
                                    loadingText="Refreshing"
                                    className="shadow-lg hover:shadow-xl transition-all duration-300"
                              >
                                    Refresh Data
                              </Button>
                        </div>
                  </div>

                  {/* Key Metrics Banner */}
                  <div className={`${boxBg} rounded-2xl shadow-xl p-6 mb-8 border ${borderColor}`}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="text-center">
                                    <div className="flex items-center justify-center mb-2">
                                          <TrendingUp className="text-green-500 mr-2" size={24} />
                                          <span className="text-sm font-medium text-green-600">Overall Released</span>
                                    </div>
                                    <div className="text-3xl font-bold text-green-600">
                                          <AnimatedCounter value={efficiency.all} />%
                                    </div>
                              </div>
                              <div className="text-center">
                                    <div className="flex items-center justify-center mb-2">
                                          <Users className="text-blue-500 mr-2" size={24} />
                                          <span className="text-sm font-medium text-blue-600">Active Samples</span>
                                    </div>
                                    <div className="text-3xl font-bold text-blue-600">
                                          <AnimatedCounter value={qcData.total_sample_qc.Pending} />
                                    </div>
                              </div>
                              <div className="text-center">
                                    <div className="flex items-center justify-center mb-2">
                                          <FileText className="text-purple-500 mr-2" size={24} />
                                          <span className="text-sm font-medium text-purple-600">Total Processed</span>
                                    </div>
                                    <div className="text-3xl font-bold text-purple-600">
                                          <AnimatedCounter value={qcData.total_sample_qc.jumlah_total_sampel_rmpm} />
                                    </div>
                              </div>
                        </div>
                  </div>

                  {/* Main Dashboard Cards */}
                  <div className="w-full overflow-x-auto">
                        <div className="min-w-[900px]">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                    {/* Total Samples Card */}
                                    <FloatingCard>
                                          <div
                                                className={`${getTotalCardClass()} rounded-xl shadow-xl p-4 transition-all duration-500 hover:scale-105 transform cursor-pointer`}
                                                onClick={() => setShowBreakdownAll(true)}
                                                title="Klik untuk breakdown per bulan"
                                          >
                                                <div className="flex justify-between items-start">
                                                      <div>
                                                            <p className={`text-xs font-bold ${subTextColor} uppercase tracking-wider`}>Total Samples (All)</p>
                                                            <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                                                                  <AnimatedCounter value={qcData.total_sample_qc.jumlah_total_sampel_rmpm} />
                                                            </p>
                                                      </div>
                                                      <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-full p-3 text-white shadow-lg">
                                                            <AlertCircle size={20} />
                                                      </div>
                                                </div>
                                                <div className="mt-4">
                                                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                                            <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                                                      </div>
                                                </div>
                                                <div className="text-xs text-center text-blue-700 mt-2 underline">Lihat breakdown per bulan</div>
                                          </div>
                                    </FloatingCard>

                                    {/* Pending Samples Card */}
                                    <FloatingCard>
                                          <div
                                                className={`${getPendingCardClass()} rounded-xl shadow-xl p-4 cursor-pointer transition-all duration-500 hover:scale-105 transform`}
                                                onClick={() => setShowPendingDetails(!showPendingDetails)}
                                          >
                                                <div className="flex justify-between items-start">
                                                      <div>
                                                            <p className={`text-xs font-bold ${subTextColor} uppercase tracking-wider`}>Pending Samples (All)</p>
                                                            <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                                                                  <AnimatedCounter value={qcData.total_sample_qc.Pending} />
                                                            </p>
                                                      </div>
                                                      <div className="bg-gradient-to-r from-orange-400 to-orange-600 rounded-full p-3 text-white shadow-lg">
                                                            <PulseIcon>
                                                                  <Clock size={20} />
                                                            </PulseIcon>
                                                      </div>
                                                </div>
                                                <div className="mt-4 flex justify-between items-center">
                                                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden mr-3">
                                                            <div
                                                                  className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-1000 ease-out"
                                                                  style={{ width: `${(num(qcData.total_sample_qc.Pending) / num(qcData.total_sample_qc.jumlah_total_sampel_rmpm)) * 100}%` }}
                                                            ></div>
                                                      </div>
                                                      <div className="transition-transform duration-300">
                                                            {showPendingDetails ?
                                                                  <ChevronUp className="flex-shrink-0" size={16} /> :
                                                                  <ChevronDown className="flex-shrink-0" size={16} />
                                                            }
                                                      </div>
                                                </div>
                                          </div>
                                    </FloatingCard>

                                    {/* Released Samples Card */}
                                    <FloatingCard>
                                          <div
                                                className={`${getReleasedCardClass()} rounded-xl shadow-xl p-4`}
                                          >
                                                <div className="flex justify-between items-start">
                                                      <div>
                                                            <p className={`text-xs font-bold ${subTextColor} uppercase tracking-wider`}>Released Samples (All)</p>
                                                            <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                                                                  <AnimatedCounter value={qcData.total_sample_qc.released} />
                                                            </p>
                                                      </div>
                                                      <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-full p-3 text-white shadow-lg">
                                                            <CheckCircle size={20} />
                                                      </div>
                                                </div>
                                                <div className="mt-4">
                                                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                                            <div
                                                                  className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-1000 ease-out"
                                                                  style={{ width: `${(num(qcData.total_sample_qc.released) / num(qcData.total_sample_qc.jumlah_total_sampel_rmpm)) * 100}%` }}
                                                            ></div>
                                                      </div>
                                                </div>
                                          </div>
                                    </FloatingCard>

                                    {/* Rejected Samples Card */}
                                    <FloatingCard>
                                          <div
                                                className={`${getRejectedCardClass()} rounded-xl shadow-xl p-4 `}
                                          >
                                                <div className="flex justify-between items-start">
                                                      <div>
                                                            <p className={`text-xs font-bold ${subTextColor} uppercase tracking-wider`}>Rejected Samples (All)</p>
                                                            <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
                                                                  <AnimatedCounter value={qcData.total_sample_qc.reject} />
                                                            </p>
                                                      </div>
                                                      <div className="bg-gradient-to-r from-red-400 to-red-600 rounded-full p-3 text-white shadow-lg">
                                                            <XCircle size={20} />
                                                      </div>
                                                </div>
                                                <div className="mt-4">
                                                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                                            <div
                                                                  className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all duration-1000 ease-out"
                                                                  style={{ width: `${(num(qcData.total_sample_qc.reject) / num(qcData.total_sample_qc.jumlah_total_sampel_rmpm)) * 100}%` }}
                                                            ></div>
                                                      </div>
                                                </div>
                                          </div>
                                    </FloatingCard>
                              </div>

                              {/* Breakdown Popups (All, RM, PM) */}
                              {showBreakdownAll && (
                                    <BreakdownMonthlyBox
                                          data={qcData.total_sample_qc}
                                          title="Total Samples (All)"
                                          color="blue"
                                          onClose={() => setShowBreakdownAll(false)}
                                    />
                              )}
                              {showBreakdownRM && (
                                    <BreakdownMonthlyBox
                                          data={qcData.total_sample_qc_rm}
                                          title="Total Samples RM"
                                          color="green"
                                          onClose={() => setShowBreakdownRM(false)}
                                    />
                              )}
                              {showBreakdownPM && (
                                    <BreakdownMonthlyBox
                                          data={qcData.total_sample_qc_pm}
                                          title="Total Samples PM"
                                          color="red"
                                          onClose={() => setShowBreakdownPM(false)}
                                    />
                              )}

                              {/* Pending Details Section (Main, Expandable) */}
                              {showPendingDetails && (
                                    <div className={`${boxBg} rounded-xl shadow-xl p-6 mb-8 border ${borderColor} transition-all duration-500`}>
                                          <h2 className={`text-xl font-bold mb-4 ${headingColor} flex items-center gap-2`}>
                                                <Eye size={20} />
                                                Pending Samples Breakdown (All)
                                          </h2>
                                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                                <EnhancedPendingBox label="Pending Sampling" value={qcData.total_sample_qc.pending_sampling} icon={Clock} color="orange" />
                                                <EnhancedPendingBox label="Pending Analysis" value={qcData.total_sample_qc.pending_analisa} icon={Activity} color="blue" />
                                                <EnhancedPendingBox label="Pending SPV Approval" value={qcData.total_sample_qc.pending_approval_spv} icon={Users} color="purple" />
                                                <EnhancedPendingBox label="Pending Admin Check" value={qcData.total_sample_qc.pending_admin} icon={FileText} color="indigo" />
                                                <EnhancedPendingBox label="Pending Manager Release" value={qcData.total_sample_qc.pending_approval_mgr} icon={Target} color="green" />
                                          </div>
                                    </div>
                              )}

                              {/* --- PEMANTAUAN SAMPLES: RM --- */}
                              <div className="mb-8">
                                    <h2 className={`text-2xl font-bold mb-4 ${headingColor} flex items-center gap-2`}>
                                          <BarChart3 size={24} />
                                          Pemantauan Sampel Raw Material (RM)
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                          <FloatingCard>
                                                <div className={`${getTotalCardClass()} rounded-xl shadow-lg p-4 transition-all duration-500 hover:scale-105 transform cursor-pointer`}
                                                      onClick={() => setShowBreakdownRM(true)}
                                                      title="Klik untuk breakdown per bulan">
                                                      <div className="flex justify-between items-start">
                                                            <div>
                                                                  <p className={`text-xs font-bold ${subTextColor} uppercase tracking-wider`}>Total RM</p>
                                                                  <p className="text-2xl font-bold mt-2">
                                                                        <AnimatedCounter value={qcData.total_sample_qc_rm.jumlah_total_sampel_rm} />
                                                                  </p>
                                                            </div>
                                                            <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-full p-2 text-white">
                                                                  <AlertCircle size={16} />
                                                            </div>
                                                      </div>
                                                      <div className="mt-2 text-xs text-green-600 font-medium">
                                                            Released: {efficiency.rm}%
                                                      </div>
                                                      <div className="text-xs text-center text-green-700 mt-2 underline">Lihat breakdown RM per bulan</div>
                                                </div>
                                          </FloatingCard>

                                          <FloatingCard>
                                                <div
                                                      className={`${getPendingCardClass()} rounded-xl shadow-lg p-4 cursor-pointer transition-all duration-300 hover:scale-105`}
                                                      onClick={() => setShowPendingDetailsRM(!showPendingDetailsRM)}
                                                >
                                                      <div className="flex justify-between items-start">
                                                            <div>
                                                                  <p className={`text-xs font-bold ${subTextColor} uppercase tracking-wider`}>Pending RM</p>
                                                                  <p className="text-2xl font-bold mt-2">
                                                                        <AnimatedCounter value={
                                                                              num(qcData.total_sample_qc_rm.pending_sampling_rm)
                                                                              + num(qcData.total_sample_qc_rm.pending_analisa_rm)
                                                                              + num(qcData.total_sample_qc_rm.pending_approval_spv_rm)
                                                                              + num(qcData.total_sample_qc_rm.pending_admin_rm)
                                                                              + num(qcData.total_sample_qc_rm.pending_approval_mgr_rm)
                                                                        } />
                                                                  </p>
                                                            </div>
                                                            <div className="bg-gradient-to-r from-orange-400 to-orange-600 rounded-full p-2 text-white">
                                                                  <PulseIcon>
                                                                        <Clock size={16} />
                                                                  </PulseIcon>
                                                            </div>
                                                      </div>
                                                      <div className="mt-2 flex justify-between items-center">
                                                            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden mr-3">
                                                                  <div
                                                                        className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-1000"
                                                                        style={{
                                                                              width: `${(
                                                                                          (num(qcData.total_sample_qc_rm.pending_sampling_rm)
                                                                                                + num(qcData.total_sample_qc_rm.pending_analisa_rm)
                                                                                                + num(qcData.total_sample_qc_rm.pending_approval_spv_rm)
                                                                                                + num(qcData.total_sample_qc_rm.pending_admin_rm)
                                                                                                + num(qcData.total_sample_qc_rm.pending_approval_mgr_rm))
                                                                                          / num(qcData.total_sample_qc_rm.jumlah_total_sampel_rm)
                                                                                    ) * 100
                                                                                    }%`
                                                                        }}
                                                                  ></div>
                                                            </div>
                                                            {showPendingDetailsRM ?
                                                                  <ChevronUp className="flex-shrink-0" size={14} /> :
                                                                  <ChevronDown className="flex-shrink-0" size={14} />
                                                            }
                                                      </div>
                                                </div>
                                          </FloatingCard>

                                          <FloatingCard>
                                                <div className={`${getReleasedCardClass()} rounded-xl shadow-lg p-4`}>
                                                      <div className="flex justify-between items-start">
                                                            <div>
                                                                  <p className={`text-xs font-bold ${subTextColor} uppercase tracking-wider`}>Released RM</p>
                                                                  <p className="text-2xl font-bold mt-2">
                                                                        <AnimatedCounter value={qcData.total_sample_qc_rm.released_rm} />
                                                                  </p>
                                                            </div>
                                                            <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-full p-2 text-white">
                                                                  <CheckCircle size={16} />
                                                            </div>
                                                      </div>
                                                </div>
                                          </FloatingCard>

                                          <FloatingCard>
                                                <div className={`${getRejectedCardClass()} rounded-xl shadow-lg p-4`}>
                                                      <div className="flex justify-between items-start">
                                                            <div>
                                                                  <p className={`text-xs font-bold ${subTextColor} uppercase tracking-wider`}>Rejected RM</p>
                                                                  <p className="text-2xl font-bold mt-2">
                                                                        <AnimatedCounter value={qcData.total_sample_qc_rm.reject_rm} />
                                                                  </p>
                                                            </div>
                                                            <div className="bg-gradient-to-r from-red-400 to-red-600 rounded-full p-2 text-white">
                                                                  <XCircle size={16} />
                                                            </div>
                                                      </div>
                                                </div>
                                          </FloatingCard>
                                    </div>

                                    {/* Pending Details Section (RM, Expandable) */}
                                    {showPendingDetailsRM && (
                                          <div className={`${boxBg} rounded-xl shadow-xl p-6 mb-4 border ${borderColor} transition-all duration-500`}>
                                                <h3 className={`text-lg font-bold mb-4 ${headingColor} flex items-center gap-2`}>
                                                      <Eye size={18} />
                                                      Pending RM Breakdown
                                                </h3>
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                                      <EnhancedPendingBox label="Pending Sampling" value={qcData.total_sample_qc_rm.pending_sampling_rm} icon={Clock} color="orange" />
                                                      <EnhancedPendingBox label="Pending Analysis" value={qcData.total_sample_qc_rm.pending_analisa_rm} icon={Activity} color="blue" />
                                                      <EnhancedPendingBox label="Pending SPV Approval" value={qcData.total_sample_qc_rm.pending_approval_spv_rm} icon={Users} color="purple" />
                                                      <EnhancedPendingBox label="Pending Admin Check" value={qcData.total_sample_qc_rm.pending_admin_rm} icon={FileText} color="indigo" />
                                                      <EnhancedPendingBox label="Pending Manager Release" value={qcData.total_sample_qc_rm.pending_approval_mgr_rm} icon={Target} color="green" />
                                                </div>
                                          </div>
                                    )}
                              </div>

                              {/* --- PEMANTAUAN SAMPLES: PM --- */}
                              <div className="mb-8">
                                    <h2 className={`text-2xl font-bold mb-4 ${headingColor} flex items-center gap-2`}>
                                          <PieChartIcon size={24} />
                                          Pemantauan Sampel Packaging Material (PM)
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                          <FloatingCard>
                                                <div className={`${getTotalCardClass()} rounded-xl shadow-lg p-4 transition-all duration-500 hover:scale-105 transform cursor-pointer`}
                                                      onClick={() => setShowBreakdownPM(true)}
                                                      title="Klik untuk breakdown per bulan">
                                                      <div className="flex justify-between items-start">
                                                            <div>
                                                                  <p className={`text-xs font-bold ${subTextColor} uppercase tracking-wider`}>Total PM</p>
                                                                  <p className="text-2xl font-bold mt-2">
                                                                        <AnimatedCounter value={qcData.total_sample_qc_pm.jumlah_total_sampel_pm} />
                                                                  </p>
                                                            </div>
                                                            <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-full p-2 text-white">
                                                                  <AlertCircle size={16} />
                                                            </div>
                                                      </div>
                                                      <div className="mt-2 text-xs text-green-600 font-medium">
                                                            Released: {efficiency.pm}%
                                                      </div>
                                                      <div className="text-xs text-center text-red-700 mt-2 underline">Lihat breakdown PM per bulan</div>
                                                </div>
                                          </FloatingCard>

                                          <FloatingCard>
                                                <div
                                                      className={`${getPendingCardClass()} rounded-xl shadow-lg p-4 cursor-pointer transition-all duration-300 hover:scale-105`}
                                                      onClick={() => setShowPendingDetailsPM(!showPendingDetailsPM)}
                                                >
                                                      <div className="flex justify-between items-start">
                                                            <div>
                                                                  <p className={`text-xs font-bold ${subTextColor} uppercase tracking-wider`}>Pending PM</p>
                                                                  <p className="text-2xl font-bold mt-2">
                                                                        <AnimatedCounter value={
                                                                              num(qcData.total_sample_qc_pm.pending_sampling_pm)
                                                                              + num(qcData.total_sample_qc_pm.pending_analisa_pm)
                                                                              + num(qcData.total_sample_qc_pm.pending_approval_spv_pm)
                                                                              + num(qcData.total_sample_qc_pm.pending_admin_pm)
                                                                              + num(qcData.total_sample_qc_pm.pending_approval_mgr_pm)
                                                                        } />
                                                                  </p>
                                                            </div>
                                                            <div className="bg-gradient-to-r from-orange-400 to-orange-600 rounded-full p-2 text-white">
                                                                  <PulseIcon>
                                                                        <Clock size={16} />
                                                                  </PulseIcon>
                                                            </div>
                                                      </div>
                                                      <div className="mt-2 flex justify-between items-center">
                                                            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden mr-3">
                                                                  <div
                                                                        className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-1000"
                                                                        style={{
                                                                              width: `${(
                                                                                          (num(qcData.total_sample_qc_pm.pending_sampling_pm)
                                                                                                + num(qcData.total_sample_qc_pm.pending_analisa_pm)
                                                                                                + num(qcData.total_sample_qc_pm.pending_approval_spv_pm)
                                                                                                + num(qcData.total_sample_qc_pm.pending_admin_pm)
                                                                                                + num(qcData.total_sample_qc_pm.pending_approval_mgr_pm))
                                                                                          / num(qcData.total_sample_qc_pm.jumlah_total_sampel_pm)
                                                                                    ) * 100
                                                                                    }%`
                                                                        }}
                                                                  ></div>
                                                            </div>
                                                            {showPendingDetailsPM ?
                                                                  <ChevronUp className="flex-shrink-0" size={14} /> :
                                                                  <ChevronDown className="flex-shrink-0" size={14} />
                                                            }
                                                      </div>
                                                </div>
                                          </FloatingCard>

                                          <FloatingCard>
                                                <div className={`${getReleasedCardClass()} rounded-xl shadow-lg p-4`}>
                                                      <div className="flex justify-between items-start">
                                                            <div>
                                                                  <p className={`text-xs font-bold ${subTextColor} uppercase tracking-wider`}>Released PM</p>
                                                                  <p className="text-2xl font-bold mt-2">
                                                                        <AnimatedCounter value={qcData.total_sample_qc_pm.released_pm} />
                                                                  </p>
                                                            </div>
                                                            <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-full p-2 text-white">
                                                                  <CheckCircle size={16} />
                                                            </div>
                                                      </div>
                                                </div>
                                          </FloatingCard>

                                          <FloatingCard>
                                                <div className={`${getRejectedCardClass()} rounded-xl shadow-lg p-4`}>
                                                      <div className="flex justify-between items-start">
                                                            <div>
                                                                  <p className={`text-xs font-bold ${subTextColor} uppercase tracking-wider`}>Rejected PM</p>
                                                                  <p className="text-2xl font-bold mt-2">
                                                                        <AnimatedCounter value={qcData.total_sample_qc_pm.reject_pm} />
                                                                  </p>
                                                            </div>
                                                            <div className="bg-gradient-to-r from-red-400 to-red-600 rounded-full p-2 text-white">
                                                                  <XCircle size={16} />
                                                            </div>
                                                      </div>
                                                </div>
                                          </FloatingCard>
                                    </div>

                                    {/* Pending Details Section (PM, Expandable) */}
                                    {showPendingDetailsPM && (
                                          <div className={`${boxBg} rounded-xl shadow-xl p-6 mb-4 border ${borderColor} transition-all duration-500`}>
                                                <h3 className={`text-lg font-bold mb-4 ${headingColor} flex items-center gap-2`}>
                                                      <Eye size={18} />
                                                      Pending PM Breakdown
                                                </h3>
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                                      <EnhancedPendingBox label="Pending Sampling" value={qcData.total_sample_qc_pm.pending_sampling_pm} icon={Clock} color="orange" />
                                                      <EnhancedPendingBox label="Pending Analysis" value={qcData.total_sample_qc_pm.pending_analisa_pm} icon={Activity} color="blue" />
                                                      <EnhancedPendingBox label="Pending SPV Approval" value={qcData.total_sample_qc_pm.pending_approval_spv_pm} icon={Users} color="purple" />
                                                      <EnhancedPendingBox label="Pending Admin Check" value={qcData.total_sample_qc_pm.pending_admin_pm} icon={FileText} color="indigo" />
                                                      <EnhancedPendingBox label="Pending Manager Release" value={qcData.total_sample_qc_pm.pending_approval_mgr_pm} icon={Target} color="green" />
                                                </div>
                                          </div>
                                    )}
                              </div>

                              {/* Chart Controls */}
                              <div className="flex justify-center mb-6">
                                    <div className={`${boxBg} rounded-full p-1 border ${borderColor} shadow-lg`}>
                                          <Button
                                                leftIcon={<PieChartIcon size={16} />}
                                                size="sm"
                                                colorScheme={chartView === 'pie' ? 'teal' : 'gray'}
                                                variant={chartView === 'pie' ? 'solid' : 'ghost'}
                                                onClick={() => setChartView('pie')}
                                                className="rounded-full"
                                          >
                                                Pie Charts
                                          </Button>
                                          <Button
                                                leftIcon={<BarChart3 size={16} />}
                                                size="sm"
                                                colorScheme={chartView === 'bar' ? 'teal' : 'gray'}
                                                variant={chartView === 'bar' ? 'solid' : 'ghost'}
                                                onClick={() => setChartView('bar')}
                                                className="rounded-full ml-1"
                                          >
                                                Bar Chart
                                          </Button>
                                    </div>
                              </div>

                              {/* Charts Section */}
                              {chartView === 'pie' ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                          {/* Main Pie Chart */}
                                          <div className={`${boxBg} rounded-xl shadow-xl p-6 border ${borderColor}`}>
                                                <h3 className={`text-lg font-bold mb-4 ${headingColor} text-center`}>All Samples Distribution</h3>
                                                <ResponsiveContainer width="100%" height={250}>
                                                      <PieChart>
                                                            <Pie
                                                                  data={pieMain}
                                                                  cx="50%"
                                                                  cy="50%"
                                                                  innerRadius={40}
                                                                  outerRadius={80}
                                                                  paddingAngle={5}
                                                                  dataKey="value"
                                                            >
                                                                  {pieMain.map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                                  ))}
                                                            </Pie>
                                                            <Tooltip content={CustomTooltip(qcData.total_sample_qc.jumlah_total_sampel_rmpm)} />
                                                            <Legend />
                                                      </PieChart>
                                                </ResponsiveContainer>
                                          </div>

                                          {/* RM Pie Chart */}
                                          <div className={`${boxBg} rounded-xl shadow-xl p-6 border ${borderColor}`}>
                                                <h3 className={`text-lg font-bold mb-4 ${headingColor} text-center`}>RM Samples Distribution</h3>
                                                <ResponsiveContainer width="100%" height={250}>
                                                      <PieChart>
                                                            <Pie
                                                                  data={pieRM}
                                                                  cx="50%"
                                                                  cy="50%"
                                                                  innerRadius={40}
                                                                  outerRadius={80}
                                                                  paddingAngle={5}
                                                                  dataKey="value"
                                                            >
                                                                  {pieRM.map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                                  ))}
                                                            </Pie>
                                                            <Tooltip content={CustomTooltip(qcData.total_sample_qc_rm.jumlah_total_sampel_rm)} />
                                                            <Legend />
                                                      </PieChart>
                                                </ResponsiveContainer>
                                          </div>

                                          {/* PM Pie Chart */}
                                          <div className={`${boxBg} rounded-xl shadow-xl p-6 border ${borderColor}`}>
                                                <h3 className={`text-lg font-bold mb-4 ${headingColor} text-center`}>PM Samples Distribution</h3>
                                                <ResponsiveContainer width="100%" height={250}>
                                                      <PieChart>
                                                            <Pie
                                                                  data={piePM}
                                                                  cx="50%"
                                                                  cy="50%"
                                                                  innerRadius={40}
                                                                  outerRadius={80}
                                                                  paddingAngle={5}
                                                                  dataKey="value"
                                                            >
                                                                  {piePM.map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                                  ))}
                                                            </Pie>
                                                            <Tooltip content={CustomTooltip(qcData.total_sample_qc_pm.jumlah_total_sampel_pm)} />
                                                            <Legend />
                                                      </PieChart>
                                                </ResponsiveContainer>
                                          </div>
                                    </div>
                              ) : (
                                    /* Bar Chart */
                                    <div className={`${boxBg} rounded-xl shadow-xl p-6 border ${borderColor}`}>
                                          <h3 className={`text-lg font-bold mb-4 ${headingColor} text-center`}>Sample Status Comparison</h3>
                                          <ResponsiveContainer width="100%" height={400}>
                                                <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                                      <XAxis dataKey="name" />
                                                      <YAxis />
                                                      <Tooltip content={CustomTooltip()} />
                                                      <Legend />
                                                      <Bar dataKey="pending" fill="#f59e0b" name="Pending" radius={[4, 4, 0, 0]} />
                                                      <Bar dataKey="released" fill="#10b981" name="Released" radius={[4, 4, 0, 0]} />
                                                      <Bar dataKey="rejected" fill="#ef4444" name="Rejected" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                          </ResponsiveContainer>
                                    </div>
                              )}
                        </div>
                  </div>

                  {/* Footer */}
                  <div className={`${boxBg} rounded-xl shadow-lg p-4 mt-8 border ${borderColor} text-center`}>
                        <p className={`text-sm ${subTextColor}`}>
                              Dashboard refreshed automatically every 30 seconds when auto-refresh is enabled
                        </p>
                        <div className="flex justify-center items-center mt-2 gap-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                              <span className="text-xs text-green-600">System Active</span>
                        </div>
                  </div>
            </div>
      );
}