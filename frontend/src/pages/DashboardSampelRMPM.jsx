/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { useColorMode, useColorModeValue } from "@chakra-ui/react";
import {  PieChart, Pie, Cell,  Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AlertCircle, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";

// Sample data (normally would come from an API or database)
const sampleData = {
  total: 250,
  pending: 85,
  released: 140,
  rejected: 25,
  pendingDetails: {
    sampling: 22,
    analysis: 30,
    supervisorApproval: 15,
    adminCheck: 10,
    managerRelease: 8
  }
};

// Chart Data for Pie Chart
const pieChartData = [
  { name: "Pending", value: sampleData.pending, color: "#DD6B20" },
  { name: "Released", value: sampleData.released, color: "#38A169" },
  { name: "Rejected", value: sampleData.rejected, color: "#E53E3E" }
];

export default function SampleMonitoringDashboard() {
  const [showPendingDetails, setShowPendingDetails] = useState(false);
  const { colorMode, toggleColorMode } = useColorMode();

  // Chakra UI color mode values
  const bg = useColorModeValue("bg-gray-50", "bg-gray-900");
  const boxBg = useColorModeValue("bg-white", "bg-gray-800");
  const headingColor = useColorModeValue("text-teal-600", "text-teal-400");
  const borderColor = useColorModeValue("border-gray-200", "border-gray-700");
  const textColor = useColorModeValue("text-gray-800", "text-gray-100");
  const subTextColor = useColorModeValue("text-gray-600", "text-gray-400");

  // Card variants (all now use Chakra's color mode values)
  const getPendingCardClass = () => `${boxBg} border-l-4 border-orange-500 ${textColor}`;
  const getReleasedCardClass = () => `${boxBg} border-l-4 border-green-500 ${textColor}`;
  const getRejectedCardClass = () => `${boxBg} border-l-4 border-red-500 ${textColor}`;
  const getTotalCardClass = () => `${boxBg} border-l-4 border-blue-500 ${textColor}`;

  // Custom tooltip for the PieChart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`${boxBg} p-2 border ${borderColor} rounded shadow-sm text-sm`}>
          <p className="font-medium">{payload[0].name}: {payload[0].value}</p>
          <p className={subTextColor}>
            {Math.round((payload[0].value / sampleData.total) * 100)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`min-h-screen ${bg} ${textColor} p-4 mt-20 w-full`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="flex items-center">
          <div className="text-teal-600 mr-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${headingColor}`}>Sample Monitoring Dashboard</h1>
            <p className={`mt-1 ${subTextColor}`}>Real-time sample processing status overview</p>
          </div>
        </div>
        <div className="mt-3 sm:mt-0">
        </div>
      </div>
      
      {/* Make dashboard scrollable horizontally on small screens and avoid layout cut-off */}
      <div className="w-full overflow-x-auto">
      <div className="min-w-[900px]">
        {/* Main Dashboard Cards - More compact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {/* Total Samples Card */}
          <div className={`${getTotalCardClass()} rounded-lg shadow-sm p-3 transition duration-300 hover:shadow-md`}>
            <div className="flex justify-between">
              <div>
                <p className={`text-xs font-medium ${subTextColor} uppercase`}>Total Samples</p>
                <p className="text-2xl font-bold mt-1">{sampleData.total}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-2 text-blue-600">
                <AlertCircle size={18} />
              </div>
            </div>
            <div className="mt-2">
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
          
          {/* Pending Samples Card - Interactive */}
          <div 
            className={`${getPendingCardClass()} rounded-lg shadow-sm p-3 cursor-pointer transition duration-300 hover:shadow-md`}
            onClick={() => setShowPendingDetails(!showPendingDetails)}
          >
            <div className="flex justify-between">
              <div>
                <p className={`text-xs font-medium ${subTextColor} uppercase`}>Pending Samples</p>
                <p className="text-2xl font-bold mt-1">{sampleData.pending}</p>
              </div>
              <div className="bg-orange-100 rounded-full p-2 text-orange-600">
                <Clock size={18} />
              </div>
            </div>
            <div className="mt-2 flex justify-between items-center">
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden mr-3">
                <div 
                  className="h-full bg-orange-500 rounded-full" 
                  style={{ width: `${(sampleData.pending / sampleData.total) * 100}%` }}
                ></div>
              </div>
              {showPendingDetails ? 
                <ChevronUp className="flex-shrink-0" size={14} /> : 
                <ChevronDown className="flex-shrink-0" size={14} />
              }
            </div>
          </div>
          
          {/* Released Samples Card */}
          <div className={`${getReleasedCardClass()} rounded-lg shadow-sm p-3 transition duration-300 hover:shadow-md`}>
            <div className="flex justify-between">
              <div>
                <p className={`text-xs font-medium ${subTextColor} uppercase`}>Released Samples</p>
                <p className="text-2xl font-bold mt-1">{sampleData.released}</p>
              </div>
              <div className="bg-green-100 rounded-full p-2 text-green-600">
                <CheckCircle size={18} />
              </div>
            </div>
            <div className="mt-2">
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full" 
                  style={{ width: `${(sampleData.released / sampleData.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Rejected Samples Card */}
          <div className={`${getRejectedCardClass()} rounded-lg shadow-sm p-3 transition duration-300 hover:shadow-md`}>
            <div className="flex justify-between">
              <div>
                <p className={`text-xs font-medium ${subTextColor} uppercase`}>Rejected Samples</p>
                <p className="text-2xl font-bold mt-1">{sampleData.rejected}</p>
              </div>
              <div className="bg-red-100 rounded-full p-2 text-red-600">
                <XCircle size={18} />
              </div>
            </div>
            <div className="mt-2">
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full" 
                  style={{ width: `${(sampleData.rejected / sampleData.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Pending Details Section (Expandable) - More compact */}
        {showPendingDetails && (
          <div className={`${boxBg} rounded-lg shadow-sm p-4 mb-6 border ${borderColor} transition-all duration-300`}>
            <h2 className={`text-lg font-semibold mb-3 ${headingColor}`}>
              Pending Samples Breakdown
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Pending Sampling */}
              <div className={`${boxBg} border border-orange-200 rounded-lg p-3 text-center`}>
                <div className="inline-block p-1.5 bg-orange-100 rounded-full text-orange-500 mb-1">
                  <Clock size={14} />
                </div>
                <h3 className="text-xs font-medium">Pending Sampling</h3>
                <p className="text-lg font-bold mt-1">{sampleData.pendingDetails.sampling}</p>
              </div>
              
              {/* Pending Analysis */}
              <div className={`${boxBg} border border-orange-200 rounded-lg p-3 text-center`}>
                <div className="inline-block p-1.5 bg-orange-100 rounded-full text-orange-500 mb-1">
                  <Clock size={14} />
                </div>
                <h3 className="text-xs font-medium">Pending Analysis</h3>
                <p className="text-lg font-bold mt-1">{sampleData.pendingDetails.analysis}</p>
              </div>
              
              {/* Pending Supervisor Approval */}
              <div className={`${boxBg} border border-orange-200 rounded-lg p-3 text-center`}>
                <div className="inline-block p-1.5 bg-orange-100 rounded-full text-orange-500 mb-1">
                  <Clock size={14} />
                </div>
                <h3 className="text-xs font-medium">Pending SPV Approval</h3>
                <p className="text-lg font-bold mt-1">{sampleData.pendingDetails.supervisorApproval}</p>
              </div>
              
              {/* Pending Admin Check */}
              <div className={`${boxBg} border border-orange-200 rounded-lg p-3 text-center`}>
                <div className="inline-block p-1.5 bg-orange-100 rounded-full text-orange-500 mb-1">
                  <Clock size={14} />
                </div>
                <h3 className="text-xs font-medium">Pending Admin Check</h3>
                <p className="text-lg font-bold mt-1">{sampleData.pendingDetails.adminCheck}</p>
              </div>
              
              {/* Pending Manager Release */}
              <div className={`${boxBg} border border-orange-200 rounded-lg p-3 text-center`}>
                <div className="inline-block p-1.5 bg-orange-100 rounded-full text-orange-500 mb-1">
                  <Clock size={14} />
                </div>
                <h3 className="text-xs font-medium">Pending Manager Release</h3>
                <p className="text-lg font-bold mt-1">{sampleData.pendingDetails.managerRelease}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Charts Section - Converted to two columns with Pie Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Pie Chart */}
          <div className={`${boxBg} rounded-lg shadow-sm p-4`}>
            <h2 className={`text-lg font-semibold mb-3 ${headingColor}`}>Sample Distribution</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Sample Processing Efficiency */}
          <div className={`${boxBg} rounded-lg shadow-sm p-4`}>
            <h2 className={`text-lg font-semibold mb-3 ${headingColor}`}>Sample Processing Efficiency</h2>
            <div className="mt-3">
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium">Sampling Process</span>
                  <span className="text-xs font-medium">78%</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full">
                  <div className="h-2 bg-blue-500 rounded-full" style={{ width: "78%" }}></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium">Analysis Process</span>
                  <span className="text-xs font-medium">65%</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full">
                  <div className="h-2 bg-purple-500 rounded-full" style={{ width: "65%" }}></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium">Approval Process</span>
                  <span className="text-xs font-medium">92%</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full">
                  <div className="h-2 bg-teal-500 rounded-full" style={{ width: "92%" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Additional Info Section - Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Current Status Overview */}
          <div className={`${boxBg} rounded-lg shadow-sm p-4`}>
            <h2 className={`text-lg font-semibold mb-3 ${headingColor}`}>Current Status Overview</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h4 className="text-sm font-medium">Completed</h4>
                    <span className="text-sm font-medium">{sampleData.released}</span>
                  </div>
                  <div className={`text-xs ${subTextColor}`}>Successfully processed samples</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h4 className="text-sm font-medium">In Progress</h4>
                    <span className="text-sm font-medium">{sampleData.pending}</span>
                  </div>
                  <div className={`text-xs ${subTextColor}`}>Currently being processed</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h4 className="text-sm font-medium">Rejected</h4>
                    <span className="text-sm font-medium">{sampleData.rejected}</span>
                  </div>
                  <div className={`text-xs ${subTextColor}`}>Failed quality checks</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent Activity (New Section) */}
          <div className={`${boxBg} rounded-lg shadow-sm p-4`}>
            <h2 className={`text-lg font-semibold mb-3 ${headingColor}`}>Recent Activity</h2>
            <div className="space-y-2">
              <div className="flex items-start p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="text-green-500 mr-2 mt-0.5">
                  <CheckCircle size={14} />
                </div>
                <div>
                  <p className="text-xs font-medium">Sample #1275 released</p>
                  <p className={`text-xs ${subTextColor}`}>Today, 11:30 AM</p>
                </div>
              </div>
              
              <div className="flex items-start p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="text-orange-500 mr-2 mt-0.5">
                  <Clock size={14} />
                </div>
                <div>
                  <p className="text-xs font-medium">Sample #1282 moved to analysis</p>
                  <p className={`text-xs ${subTextColor}`}>Today, 10:15 AM</p>
                </div>
              </div>
              
              <div className="flex items-start p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="text-red-500 mr-2 mt-0.5">
                  <XCircle size={14} />
                </div>
                <div>
                  <p className="text-xs font-medium">Sample #1269 rejected</p>
                  <p className={`text-xs ${subTextColor}`}>Today, 9:45 AM</p>
                </div>
              </div>
              
              <div className="flex items-start p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="text-green-500 mr-2 mt-0.5">
                  <CheckCircle size={14} />
                </div>
                <div>
                  <p className="text-xs font-medium">Sample #1268 released</p>
                  <p className={`text-xs ${subTextColor}`}>Today, 9:30 AM</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className={`text-xs ${subTextColor}`}>Sample Monitoring System © 2025 • Last Updated: May 21, 2025</p>
        </div>
      </div>
      </div>
    </div>
  );
}