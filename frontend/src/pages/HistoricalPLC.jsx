import React, { useEffect, useState, useMemo } from 'react';
import PdfGenerator from '../components/TemplatePdfHistorical';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const roomOptions = [
      'Ruang_ICP',
      'Ruang_Instrument',
      'Ruang_Preparasi',
      'Ruang_Reagen_1',
      'Ruang_Reagen_2',
      'Ruang_Reagen_3',
      'Ruang_Retained',
      'Ruang_Timbang',
];

// New: Separate chart for Temperature (with red line at 25°C)
const TemperatureChart = ({ temperatureData, timestamps }) => {
      const canvasRef = React.useRef(null);

      React.useEffect(() => {
            if (!canvasRef.current || !temperatureData.length) return;

            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            // Adjust canvas size to parent container
            const resizeCanvas = () => {
                  const container = canvas.parentElement;
                  canvas.width = container.clientWidth;
                  canvas.height = container.clientHeight;
                  drawChart();
            };

            // Initial resize and event listener
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);

            function drawChart() {
                  const width = canvas.width;
                  const height = canvas.height;

                  // Clear canvas
                  ctx.clearRect(0, 0, width, height);

                  // Set background
                  ctx.fillStyle = '#fff';
                  ctx.fillRect(0, 0, width, height);

                  // Find min and max values for scaling
                  const tempMin = Math.min(...temperatureData) - 1;
                  const tempMax = Math.max(...temperatureData) + 1;

                  // Draw grid lines
                  ctx.strokeStyle = '#f0f0f0';
                  ctx.lineWidth = 1;
                  for (let i = 0; i < 5; i++) {
                        const y = 30 + (height - 70) * i / 4;
                        ctx.beginPath();
                        ctx.moveTo(50, y);
                        ctx.lineTo(width - 20, y);
                        ctx.stroke();
                  }

                  // Draw temperature data
                  ctx.strokeStyle = '#22c55e';
                  ctx.lineWidth = 2;
                  ctx.beginPath();

                  temperatureData.forEach((value, index) => {
                        const x = 50 + (width - 70) * index / (temperatureData.length - 1 || 1);
                        const y = height - 40 - (height - 70) * (value - tempMin) / (tempMax - tempMin || 1);

                        if (index === 0) {
                              ctx.moveTo(x, y);
                        } else {
                              ctx.lineTo(x, y);
                        }
                  });

                  ctx.stroke();

                  // Draw red line at 25°C
                  if (tempMax > 25 && tempMin < 25) {
                        const y25 = height - 40 - (height - 70) * (25 - tempMin) / (tempMax - tempMin || 1);
                        ctx.strokeStyle = 'red';
                        ctx.lineWidth = 1.5;
                        ctx.setLineDash([5, 5]);
                        ctx.beginPath();
                        ctx.moveTo(50, y25);
                        ctx.lineTo(width - 20, y25);
                        ctx.stroke();
                        ctx.setLineDash([]);
                        ctx.font = 'bold 11px Arial';
                        ctx.fillStyle = 'red';
                        ctx.fillText('25°C', width - 60, y25 - 5);
                  }

                  // Draw axes
                  ctx.strokeStyle = '#888';
                  ctx.lineWidth = 1;
                  ctx.beginPath();
                  ctx.moveTo(50, 30);
                  ctx.lineTo(50, height - 40);
                  ctx.lineTo(width - 20, height - 40);
                  ctx.stroke();

                  // Draw legend
                  ctx.fillStyle = '#22c55e';
                  ctx.fillRect(width - 150, 15, 15, 15);

                  ctx.fillStyle = '#333';
                  ctx.font = '12px Arial';
                  ctx.fillText('Temperature', width - 130, 25);

                  // Draw labels on x-axis (timestamps)
                  if (timestamps.length > 0) {
                        const step = Math.max(1, Math.floor(timestamps.length / 5));
                        for (let i = 0; i < timestamps.length; i += step) {
                              const x = 50 + (width - 70) * i / (timestamps.length - 1 || 1);
                              const formattedDate = new Date(timestamps[i]).toLocaleDateString();
                              ctx.fillStyle = '#666';
                              ctx.font = '10px Arial';
                              ctx.save();
                              ctx.translate(x, height - 20);
                              ctx.rotate(-Math.PI / 4);
                              ctx.fillText(formattedDate, 0, 0);
                              ctx.restore();
                        }
                  }
            }
            

            return () => {
                  window.removeEventListener('resize', resizeCanvas);
            };
      }, [temperatureData, timestamps]);

      return (
            <canvas
                  ref={canvasRef}
                  style={{
                        width: '100%',
                        height: '100%',
                        display: 'block'
                  }}
            />
      );
};

// New: Separate chart for Humidity
const HumidityChart = ({ humidityData, timestamps }) => {
      const canvasRef = React.useRef(null);

      React.useEffect(() => {
            if (!canvasRef.current || !humidityData.length) return;

            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            // Adjust canvas size to parent container
            const resizeCanvas = () => {
                  const container = canvas.parentElement;
                  canvas.width = container.clientWidth;
                  canvas.height = container.clientHeight;
                  drawChart();
            };

            // Initial resize and event listener
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);

            function drawChart() {
                  const width = canvas.width;
                  const height = canvas.height;

                  // Clear canvas
                  ctx.clearRect(0, 0, width, height);

                  // Set background
                  ctx.fillStyle = '#fff';
                  ctx.fillRect(0, 0, width, height);

                  // Find min and max values for scaling
                  const humMin = Math.min(...humidityData) - 1;
                  const humMax = Math.max(...humidityData) + 1;

                  // Draw grid lines
                  ctx.strokeStyle = '#f0f0f0';
                  ctx.lineWidth = 1;
                  for (let i = 0; i < 5; i++) {
                        const y = 30 + (height - 70) * i / 4;
                        ctx.beginPath();
                        ctx.moveTo(50, y);
                        ctx.lineTo(width - 20, y);
                        ctx.stroke();
                  }

                  // Draw humidity data
                  ctx.strokeStyle = '#a855f7';
                  ctx.lineWidth = 2;
                  ctx.beginPath();

                  humidityData.forEach((value, index) => {
                        const x = 50 + (width - 70) * index / (humidityData.length - 1 || 1);
                        const y = height - 40 - (height - 70) * (value - humMin) / (humMax - humMin || 1);

                        if (index === 0) {
                              ctx.moveTo(x, y);
                        } else {
                              ctx.lineTo(x, y);
                        }
                  });

                  ctx.stroke();

                  // Draw axes
                  ctx.strokeStyle = '#888';
                  ctx.lineWidth = 1;
                  ctx.beginPath();
                  ctx.moveTo(50, 30);
                  ctx.lineTo(50, height - 40);
                  ctx.lineTo(width - 20, height - 40);
                  ctx.stroke();

                  // Draw legend
                  ctx.fillStyle = '#a855f7';
                  ctx.fillRect(width - 150, 15, 15, 15);

                  ctx.fillStyle = '#333';
                  ctx.font = '12px Arial';
                  ctx.fillText('Humidity', width - 130, 25);

                  // Draw labels on x-axis (timestamps)
                  if (timestamps.length > 0) {
                        const step = Math.max(1, Math.floor(timestamps.length / 5));
                        for (let i = 0; i < timestamps.length; i += step) {
                              const x = 50 + (width - 70) * i / (timestamps.length - 1 || 1);
                              const formattedDate = new Date(timestamps[i]).toLocaleDateString();
                              ctx.fillStyle = '#666';
                              ctx.font = '10px Arial';
                              ctx.save();
                              ctx.translate(x, height - 20);
                              ctx.rotate(-Math.PI / 4);
                              ctx.fillText(formattedDate, 0, 0);
                              ctx.restore();
                        }
                  }
            }

            return () => {
                  window.removeEventListener('resize', resizeCanvas);
            };
      }, [humidityData, timestamps]);

      return (
            <canvas
                  ref={canvasRef}
                  style={{
                        width: '100%',
                        height: '100%',
                        display: 'block'
                  }}
            />
      );
};

export default function MonitoringPage() {
      const today = new Date();
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 7);

      const [room, setRoom] = useState('Ruang_ICP');
      const [startDate, setStartDate] = useState(lastWeek);
      const [endDate, setEndDate] = useState(today);
      const [data, setData] = useState([]);
      const [isLoading, setIsLoading] = useState(false);
      const [showFilters, setShowFilters] = useState(false);

      useEffect(() => {
            const fetchData = async () => {
                  setIsLoading(true);
                  try {
                        const startSeconds = startDate.getTime() / 1000;
                        const endSeconds = endDate.getTime() / 1000;

                        const res = await fetch(
                              `${process.env.REACT_APP_API_BASE_URL}/users/data-monitoring?room=${room}&start=${startSeconds}&end=${endSeconds}`
                        );
                        const result = await res.json();

                        if (Array.isArray(result)) {
                              setData(result);
                        } else if (Array.isArray(result.data)) {
                              setData(result.data);
                        } else {
                              console.error('Unexpected response format:', result);
                              setData([]);
                        }
                  } catch (error) {
                        console.error('Fetch error:', error);
                        setData([]);
                  } finally {
                        setIsLoading(false);
                  }
            };

            fetchData();
      }, [room, startDate, endDate]);

      // Move these calculations inside the useMemo to fix the hook warnings
      const { temperatureData, rhData, timestamps } = useMemo(() => {
            const temperatureValues = Array.isArray(data) ? data.map(d => d.data_format_0) : [];
            const rhValues = Array.isArray(data) ? data.map(d => d.data_format_1) : [];
            const timestampValues = Array.isArray(data) ? data.map(d =>
                  d.timestamp < 1e12 ? d.timestamp * 1000 : d.timestamp
            ) : [];

            return {
                  temperatureData: temperatureValues,
                  rhData: rhValues,
                  timestamps: timestampValues
            };
      }, [data]);

      const summary = useMemo(() => ({
            total: data.length,
            avgTemp: data.length ? (temperatureData.reduce((a, b) => a + b, 0) / data.length).toFixed(2) : '-',
            avgRH: data.length ? (rhData.reduce((a, b) => a + b, 0) / data.length).toFixed(2) : '-',
            minTemp: data.length ? Math.min(...temperatureData).toFixed(2) : '-',
            maxTemp: data.length ? Math.max(...temperatureData).toFixed(2) : '-',
            minRH: data.length ? Math.min(...rhData).toFixed(2) : '-',
            maxRH: data.length ? Math.max(...rhData).toFixed(2) : '-',
      }), [data, temperatureData, rhData]);

      const formatRoomName = (name) => {
            return name.replace(/_/g, ' ');
      };

      // Tambah: fungsi export ke Excel
      const handleExportExcel = () => {
            const excelData = data.map((item) => ({
                  "Tanggal & Waktu": new Date(item.timestamp < 1e12 ? item.timestamp * 1000 : item.timestamp).toLocaleString(),
                  "Temperature (°C)": (Math.round(item.data_format_0 * 10) / 10).toFixed(1),
                  "RH (%)": (Math.round(item.data_format_1 * 10) / 10).toFixed(1)
            }));

            const worksheet = XLSX.utils.json_to_sheet(excelData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Monitoring");

            const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
            const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
            saveAs(blob, `Monitoring_${room}_${startDate.toLocaleDateString()}_${endDate.toLocaleDateString()}.xlsx`);
      };

      // Simple icon components since we can't use Lucide icons
      const Icon = ({ type }) => {
            const styles = {
                  container: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                  }
            };

            switch (type) {
                  case 'filter':
                        return (
                              <div style={{ ...styles.container, background: '#f0f9ff' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                                    </svg>
                              </div>
                        );
                  case 'clock':
                        return (
                              <div style={{ ...styles.container, background: '#e6f2ff' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <circle cx="12" cy="12" r="10" />
                                          <polyline points="12 6 12 12 16 14" />
                                    </svg>
                              </div>
                        );
                  case 'temperature':
                        return (
                              <div style={{ ...styles.container, background: '#dcfce7' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
                                    </svg>
                              </div>
                        );
                  case 'humidity':
                        return (
                              <div style={{ ...styles.container, background: '#f3e8ff' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
                                          <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />
                                    </svg>
                              </div>
                        );
                  case 'calendar':
                        return (
                              <div style={{ ...styles.container, background: '#fef3c7' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                          <line x1="16" y1="2" x2="16" y2="6" />
                                          <line x1="8" y1="2" x2="8" y2="6" />
                                          <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                              </div>
                        );
                  default:
                        return null;
            }
      };

      return (
            <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50">
                  {/* Header - fixed height */}
                  <div className="w-full px-4 py-3 bg-white shadow-sm mt-20">
                        <div className="flex flex-wrap justify-between items-center gap-4">
                              <div>
                                    <h1 className="text-2xl font-bold text-gray-800">Monitoring Ruangan</h1>
                                    <p className="text-sm text-gray-500">
                                          {formatRoomName(room)} | {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                                    </p>
                              </div>
                              <div className="flex gap-3">
                                    <button
                                          onClick={() => setShowFilters(!showFilters)}
                                          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition"
                                    >
                                          <Icon type="filter" />
                                          Filters
                                    </button>

                                    {/* Export Excel button */}
                                    <button
                                          onClick={handleExportExcel}
                                          className="flex items-center gap-2 px-3 py-2 bg-green-600 rounded-lg shadow-sm text-white hover:bg-green-700 transition"
                                    >
                                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                                <path d="M9 8v8M15 8v8M7 12h10"/>
                                          </svg>
                                          Export Excel
                                    </button>

                                    {/* Component PDF Generator */}
                                    <PdfGenerator
                                          room={room}
                                          startDate={startDate}
                                          endDate={endDate}
                                          data={data}
                                          temperatureData={temperatureData}
                                          rhData={rhData}
                                          summary={summary}
                                    />
                              </div>
                        </div>
                  </div>

                  {/* Filter Bar - conditionally shown */}
                  {showFilters && (
                        <div className="w-full bg-white border-t border-b border-gray-200 shadow-sm ">
                              <div className="p-3 flex flex-wrap items-center gap-4">
                                    <div className="flex-1 min-w-[200px]">
                                          <label className="text-xs font-medium text-gray-700 block mb-1">Ruangan</label>
                                          <select
                                                value={room}
                                                onChange={(e) => setRoom(e.target.value)}
                                                className="p-2 w-full border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
                                          >
                                                {roomOptions.map((r) => (
                                                      <option key={r} value={r}>{formatRoomName(r)}</option>
                                                ))}
                                          </select>
                                    </div>

                                    <div className="flex-1 min-w-[200px]">
                                          <label className="text-xs font-medium text-gray-700 block mb-1">Tanggal Mulai</label>
                                          <input
                                                type="date"
                                                value={startDate.toISOString().split('T')[0]}
                                                onChange={(e) => setStartDate(new Date(e.target.value))}
                                                className="p-2 border border-gray-300 rounded-lg shadow-sm w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
                                          />
                                    </div>

                                    <div className="flex-1 min-w-[200px]">
                                          <label className="text-xs font-medium text-gray-700 block mb-1">Tanggal Selesai</label>
                                          <input
                                                type="date"
                                                value={endDate.toISOString().split('T')[0]}
                                                onChange={(e) => setEndDate(new Date(e.target.value))}
                                                className="p-2 border border-gray-300 rounded-lg shadow-sm w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
                                          />
                                    </div>
                              </div>
                        </div>
                  )}

                  {/* Main content area - takes remaining space */}
                  <div className="flex-1 overflow-auto">
                        {/* Loading state */}
                        {isLoading && (
                              <div className="flex justify-center items-center h-full">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                              </div>
                        )}

                        {/* Content */}
                        {!isLoading && (
                              <div className="p-4">
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                                          <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-blue-500">
                                                <div className="flex items-center">
                                                      <Icon type="clock" />
                                                      <div className="ml-3">
                                                            <p className="text-xs font-medium text-gray-500">Total Data</p>
                                                            <p className="text-xl font-bold text-gray-800">{summary.total}</p>
                                                      </div>
                                                </div>
                                          </div>

                                          <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-green-500">
                                                <div className="flex items-center">
                                                      <Icon type="temperature" />
                                                      <div className="ml-3">
                                                            <p className="text-xs font-medium text-gray-500">Rata-rata Temp.</p>
                                                            <p className="text-xl font-bold text-gray-800">{summary.avgTemp}°C</p>
                                                            <p className="text-xs text-gray-500">Min: {summary.minTemp}°C | Max: {summary.maxTemp}°C</p>
                                                      </div>
                                                </div>
                                          </div>

                                          <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-purple-500">
                                                <div className="flex items-center">
                                                      <Icon type="humidity" />
                                                      <div className="ml-3">
                                                            <p className="text-xs font-medium text-gray-500">Rata-rata RH</p>
                                                            <p className="text-xl font-bold text-gray-800">{summary.avgRH}%</p>
                                                            <p className="text-xs text-gray-500">Min: {summary.minRH}% | Max: {summary.maxRH}%</p>
                                                      </div>
                                                </div>
                                          </div>

                                          <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-amber-500">
                                                <div className="flex items-center">
                                                      <Icon type="calendar" />
                                                      <div className="ml-3">
                                                            <p className="text-xs font-medium text-gray-500">Periode</p>
                                                            <p className="text-sm font-semibold text-gray-800">
                                                                  {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                                                            </p>
                                                      </div>
                                                </div>
                                          </div>
                                    </div>

                                    {/* Charts */}
                                    <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
                                          <div className="p-3 border-b border-gray-100">
                                                <h2 className="text-lg font-semibold text-gray-800">Trend Monitoring</h2>
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
                                                <div className="h-56">
                                                      <TemperatureChart
                                                            temperatureData={temperatureData}
                                                            timestamps={timestamps}
                                                      />
                                                </div>
                                                <div className="h-56">
                                                      <HumidityChart
                                                            humidityData={rhData}
                                                            timestamps={timestamps}
                                                      />
                                                </div>
                                          </div>
                                    </div>

                                    {/* Tables */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                          {/* Temperature Data Table */}
                                          {/* Temperature Data Table */}
                                          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                                                <div className="p-3 bg-green-50 border-b border-green-100">
                                                      <h2 className="text-base font-semibold text-gray-800 flex items-center">
                                                            <Icon type="temperature" />
                                                            <span className="ml-2">Temperature Data</span>
                                                      </h2>
                                                </div>
                                                <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 450px)' }}>
                                                      <table className="w-full">
                                                            <thead className="bg-gray-50 sticky top-0">
                                                                  <tr>
                                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                                              Timestamp
                                                                        </th>
                                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                                              Temperature (°C)
                                                                        </th>
                                                                  </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                  {data.length === 0 ? (
                                                                        <tr>
                                                                              <td colSpan="2" className="px-3 py-6 text-center text-gray-500">
                                                                                    No data available for the selected period
                                                                              </td>
                                                                        </tr>
                                                                  ) : (
                                                                        data.map((d, idx) => {
                                                                              const temp = (Math.round(d.data_format_0 * 10) / 10).toFixed(1);
                                                                              const isOver25 = Number(temp) > 25;
                                                                              return (
                                                                                    <tr key={idx} className="hover:bg-gray-50">
                                                                                          <td className="px-3 py-2 text-xs text-gray-600">
                                                                                                {new Date(d.timestamp < 1e12 ? d.timestamp * 1000 : d.timestamp).toLocaleString()}
                                                                                          </td>
                                                                                          <td
                                                                                                className={`px-3 py-2 text-xs font-medium text-gray-700 ${isOver25 ? 'text-red-600 font-bold' : ''}`}
                                                                                          >
                                                                                                {temp}°C
                                                                                          </td>
                                                                                    </tr>
                                                                              );
                                                                        })
                                                                  )}
                                                            </tbody>
                                                      </table>
                                                </div>
                                          </div>

                                          {/* RH Data Table */}
                                          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                                                <div className="p-3 bg-purple-50 border-b border-purple-100">
                                                      <h2 className="text-base font-semibold text-gray-800 flex items-center">
                                                            <Icon type="humidity" />
                                                            <span className="ml-2">RH Data</span>
                                                      </h2>
                                                </div>
                                                <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 450px)' }}>
                                                      <table className="w-full">
                                                            <thead className="bg-gray-50 sticky top-0">
                                                                  <tr>
                                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                                              Timestamp
                                                                        </th>
                                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                                              RH (%)
                                                                        </th>
                                                                  </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                  {data.length === 0 ? (
                                                                        <tr>
                                                                              <td colSpan="2" className="px-3 py-6 text-center text-gray-500">
                                                                                    No data available for the selected period
                                                                              </td>
                                                                        </tr>
                                                                  ) : (
                                                                        data.map((d, idx) => (
                                                                              <tr key={idx} className="hover:bg-gray-50">
                                                                                    <td className="px-3 py-2 text-xs text-gray-600">
                                                                                          {new Date(d.timestamp < 1e12 ? d.timestamp * 1000 : d.timestamp).toLocaleString()}
                                                                                    </td>
                                                                                    <td className="px-3 py-2 text-xs font-medium text-gray-700">
                                                                                          {(Math.round(d.data_format_1 * 10) / 10).toFixed(1)}%
                                                                                    </td>
                                                                              </tr>
                                                                        ))
                                                                  )}
                                                            </tbody>
                                                      </table>
                                                </div>
                                          </div>
                                    </div>
                              </div>
                        )}
                  </div>
            </div>
      );
}