import React, { useEffect, useState, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import ApprovalLoginPopup from '../components/confirmLogin';
import Notes from '../components/NotesForSamplingCard';
import {
      Box,
      Button,
      Text,
      Modal,
      ModalOverlay,
      ModalContent,
      ModalHeader,
      ModalFooter,
      ModalBody,
      ModalCloseButton,
      useDisclosure,
      useColorModeValue
} from "@chakra-ui/react";

export default function ApprovalsSamplingCard() {
      const [approveId, setApproveId] = useState('');
      const [approveRole, setApproveRole] = useState('');
      const [approveName, setApproveName] = useState('');
      const [name, setName] = useState('');
      const [unapprovedList, setUnapprovedList] = useState([]);
      const [approvedList, setApprovedList] = useState([]);
      const [activeTab, setActiveTab] = useState('unapproved');
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState(null);
      const [successMessage, setSuccessMessage] = useState('');
      const [showLoginPopup, setShowLoginPopup] = useState(false);
      const [showNotesPopup, setShowNotesPopup] = useState(false);
      const [selectedItem, setSelectedItem] = useState(null);
      const { isOpen, onOpen, onClose } = useDisclosure();
      const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
      const navigate = useNavigate();

      // Color mode values
      const bgMain = useColorModeValue("bg-gray-50", "bg-[#181827]");
      const bgCard = useColorModeValue("bg-white", "bg-[#23233a]");
      const textHeader = useColorModeValue("text-gray-800", "text-white");
      const textSubtle = useColorModeValue("text-gray-600", "text-gray-300");
      const borderSection = useColorModeValue("border-gray-200", "border-gray-700");
      const shadowCard = useColorModeValue("shadow", "shadow-2xl");
      const tabBgActive = useColorModeValue("border-blue-500 text-blue-600", "border-blue-400 text-blue-200");
      const tabBgInactive = useColorModeValue("border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300", "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500");
      const tabBorder = useColorModeValue("border-b border-gray-200", "border-b border-gray-700");
      const tableHeadBg = useColorModeValue("bg-gray-50", "bg-[#23233a]");
      const tableRowHover = useColorModeValue("hover:bg-gray-50", "hover:bg-gray-800/60");
      const badgeApproved = useColorModeValue("bg-green-100 text-green-800", "bg-green-900 text-green-200");
      const badgeRejected = useColorModeValue("bg-red-100 text-red-800", "bg-red-900 text-red-200");
      const badgePending = useColorModeValue("bg-yellow-100 text-yellow-800", "bg-yellow-900 text-yellow-100");
      const badgeStepInactive = useColorModeValue("bg-gray-100 text-gray-800", "bg-gray-800 text-gray-200");
      const badgeStepActive = useColorModeValue("bg-green-100 text-green-800", "bg-green-900 text-green-200");
      const badgeStepRejected = useColorModeValue("bg-red-100 text-red-800", "bg-red-900 text-red-200");
      const bgFooter = useColorModeValue("bg-white border-t border-gray-200", "bg-[#181827] border-t border-gray-800");
      const textFooter = useColorModeValue("text-gray-500", "text-gray-300");

      // Fetch user info from token
      useEffect(() => {
            const token = localStorage.getItem('token');
            if (token) {
                  try {
                        const decoded = jwtDecode(token);
                        setApproveName(decoded.nama);
                        setApproveRole(decoded.jabatan);
                        setName(decoded.nama); // Set name from token as well
                  } catch (e) {
                        console.error('Invalid token', e);
                  }
            }
      }, []); // Runs only once when the component mounts

      // Fetch unapproved list filtered by role - wrapped in useCallback
      const fetchUnapprovedList = useCallback(async () => {
            try {
                  setLoading(true);
                  setError(null);
                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

                  const res = await fetch('http://10.126.15.141:8081/cards/pending-approval-sampling-cards', {
                        signal: controller.signal
                  });

                  clearTimeout(timeoutId);

                  if (!res.ok) {
                        throw new Error(`HTTP error! Status: ${res.status}`);
                  }

                  const data = await res.json();

                  if (Array.isArray(data)) {
                        // Filter based on user role and approval status
                        const filteredData = data.filter(item => {
                              if (approveRole === 'SUPERVISOR QC' && item.qc_supervisor_approved === 0) {
                                    return true;
                              } else if (approveRole === 'MANAGER QC' && item.qc_supervisor_approved === 1 && item.qc_manager_approved === 0) {
                                    return true;
                              } else if (approveRole === 'MANAGER QA' && item.qc_supervisor_approved === 1 && item.qc_manager_approved === 1 && item.qa_manager_approved === 0) {
                                    return true;
                              }
                              return false;
                        });
                        setUnapprovedList(filteredData);
                  } else {
                        console.error("Expected array, received:", data);
                        setUnapprovedList([]);
                  }
            } catch (error) {
                  console.error('Failed to fetch unapproved list:', error);
                  if (error.name === 'AbortError') {
                        setError('Request timed out. Server may be unavailable.');
                  } else {
                        setError('Failed to load pending approvals. Please check your connection and try again.');
                  }
                  setUnapprovedList([]);
            } finally {
                  setLoading(false);
            }
      }, [approveRole]);

      const handleViewNotes = (item) => {
            setSelectedItem(item);
            onOpen();
      };

      // Fetch approved list - wrapped in useCallback
      const fetchApprovedList = useCallback(async () => {
            try {
                  setLoading(true);
                  setError(null);

                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

                  const res = await fetch(`http://10.126.15.141:8081/cards/get-approval-sampling-cards`, {
                        signal: controller.signal
                  });

                  clearTimeout(timeoutId);

                  if (!res.ok) {
                        throw new Error(`HTTP error! Status: ${res.status}`);
                  }

                  const data = await res.json();
                  if (data) {
                        // Check if data is array, if not wrap it in array
                        const dataArray = Array.isArray(data) ? data : [data];
                        setApprovedList(dataArray);
                  } else {
                        setApprovedList([]);
                  }
            } catch (error) {
                  console.error('Failed to fetch approved list:', error);
                  if (error.name === 'AbortError') {
                        setError('Request timed out. Server may be unavailable.');
                  } else {
                        setError('Failed to load approved cards. Please check your connection and try again.');
                  }
                  setApprovedList([]);
            } finally {
                  setLoading(false);
            }
      }, []);

      // Fetch unapproved and approved lists when approveRole changes
      useEffect(() => {
            if (approveRole) {
                  fetchUnapprovedList();
                  fetchApprovedList();
            }
      }, [approveRole, fetchUnapprovedList, fetchApprovedList]); // Now includes all dependencies

      const showSuccessMessage = (message) => {
            setSuccessMessage(message);
            setTimeout(() => setSuccessMessage(''), 5000);
      };

      // Prepare to start approval process (show login popup)
      const initiateApprove = () => {
            if (!approveId) {
                  setError('Please enter a Sampling Card ID');
                  return;
            }

            setActionType('approve');
            setShowLoginPopup(true);
      };

      // Prepare to start rejection process (show login popup)
      const initiateReject = () => {
            if (!approveId) {
                  setError('Please enter a Sampling Card ID');
                  return;
            }

            setActionType('reject');
            setShowLoginPopup(true);
      };

      // Handle successful login from popup
      const handleLoginSuccess = () => {
            if (actionType === 'approve') {
                  processApproval();
            } else if (actionType === 'reject') {
                  setShowNotesPopup(true);
            }
      };
      const handleNotesSuccess = (notesText) => {
            if (actionType === 'reject') {
                  processRejection(notesText);
            }
            setShowNotesPopup(false)
      }

      // Process approval after login confirmation
      const processApproval = async () => {
            try {
                  setLoading(true);
                  setError(null);

                  // Add timeout handling
                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

                  const res = await fetch('http://10.126.15.141:8081/cards/approval-sampling-cards', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                              sampling_card_id: Number(approveId),
                              name,
                              role: approveRole,
                              approval_status: 1 // Explicitly set value to 1 for approval
                        }),
                        signal: controller.signal
                  });

                  clearTimeout(timeoutId);

                  // Check if response is ok before trying to parse JSON
                  if (!res.ok) {
                        const errorText = await res.text();
                        throw new Error(errorText || `HTTP error! Status: ${res.status}`);
                  }

                  const data = await res.json();

                  // Check both success and warning as both are valid responses from your backend
                  if (data.status === 'success' || data.status === 'warning') {
                        showSuccessMessage(`${data.message} (${approveRole})`);
                        setApproveId('');

                        // Refresh both lists after successful action - with try/catch to prevent cascade failures
                        try {
                              await fetchUnapprovedList();
                        } catch (refreshError) {
                              console.error("Failed to refresh unapproved list:", refreshError);
                        }

                        try {
                              await fetchApprovedList();
                        } catch (refreshError) {
                              console.error("Failed to refresh approved list:", refreshError);
                        }
                  } else {
                        throw new Error(data.message || 'Unknown error occurred');
                  }
            } catch (error) {
                  console.error('Failed to approve:', error);
                  if (error.name === 'AbortError') {
                        setError('Request timed out. Server may be unavailable.');
                  } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                        setError('Network error: Please check your connection to the server.');
                  } else {
                        setError(`Failed to approve: ${error.message}`);
                  }
            } finally {
                  setLoading(false);
            }
      };

      // Process rejection after login confirmation
      const processRejection = async (notes) => {
            try {
                  setLoading(true);
                  setError(null);

                  // Add timeout handling
                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

                  const res = await fetch('http://10.126.15.141:8081/cards/approval-sampling-cards', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                              sampling_card_id: Number(approveId),
                              name,
                              role: approveRole,
                              approval_status: 2, // Set value to 2 for rejection
                              notes: notes
                        }),
                        signal: controller.signal
                  });

                  clearTimeout(timeoutId);

                  // Check if response is ok before trying to parse JSON
                  if (!res.ok) {
                        const errorText = await res.text();
                        throw new Error(errorText || `HTTP error! Status: ${res.status}`);
                  }

                  const data = await res.json();

                  // Check both success and warning as both are valid responses from your backend
                  if (data.status === 'success' || data.status === 'warning') {
                        showSuccessMessage(`${data.message} (${approveRole})`);
                        setApproveId('');

                        // Refresh both lists after successful action - with try/catch to prevent cascade failures
                        try {
                              await fetchUnapprovedList();
                        } catch (refreshError) {
                              console.error("Failed to refresh unapproved list:", refreshError);
                        }

                        try {
                              await fetchApprovedList();
                        } catch (refreshError) {
                              console.error("Failed to refresh approved list:", refreshError);
                        }
                  } else {
                        throw new Error(data.message || 'Unknown error occurred');
                  }
            } catch (error) {
                  console.error('Failed to reject:', error);
                  if (error.name === 'AbortError') {
                        setError('Request timed out. Server may be unavailable.');
                  } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                        setError('Network error: Please check your connection to the server.');
                  } else {
                        setError(`Failed to reject: ${error.message}`);
                  }
            } finally {
                  setLoading(false);
            }
      };

      // Get overall approval status
      const getOverallStatus = (item) => {
            if (
                  item.qc_supervisor_approved === 1 &&
                  item.qc_manager_approved === 1 &&
                  item.qa_manager_approved === 1
            ) {
                  return <span className={`px-2 py-1 rounded ${badgeApproved}`}>Fully Approved</span>;
            }
            if (item.qc_supervisor_approved === 2 ||
                  item.qc_manager_approved === 2 ||
                  item.qa_manager_approved === 2) {
                  return <span className={`px-2 py-1 rounded ${badgeRejected}`}>Reject</span>;
            } else {
                  return <span className={`px-2 py-1 rounded ${badgePending}`}>Pending</span>;
            }
      };

      // Loading spinner component
      const LoadingSpinner = () => (
            <div className="flex justify-center p-6">
                  <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
            </div>
      );


      return (
            <div className={`flex flex-col min-h-screen ${bgMain} mt-20 transition-colors duration-300`}>
                  {/* Render login popup when needed */}
                  {showLoginPopup && (
                        <ApprovalLoginPopup
                              onSuccess={handleLoginSuccess}
                              onClose={() => setShowLoginPopup(false)}
                        />
                  )}

                  {/* Render Notes when needed */}
                  {showNotesPopup && (
                        <Notes
                              onSuccess={handleNotesSuccess}
                              onClose={() => setShowNotesPopup(false)}
                        />
                  )}

                  {/* Header section */}
                  <header className={`${bgCard} ${shadowCard} border-b ${borderSection}`}>
                        <div className="px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
                              <div>
                                    <h1 className={`text-2xl font-bold ${textHeader}`}>Sampling Approval System</h1>
                                    <p className={`${textSubtle} text-sm`}>Quality control Digitalization System</p>
                              </div>
                              <div className="flex items-center gap-4">
                                    <div className="bg-blue-50 px-3 py-2 rounded-md">
                                          <p className="text-sm font-medium text-blue-800">{new Date().toLocaleDateString()}</p>
                                    </div>
                              </div>
                        </div>
                  </header>

                  <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
                        {/* Notifications */}
                        {successMessage && (
                              <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md shadow-sm transition-all">
                                    <div className="flex">
                                          <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                          </div>
                                          <div className="ml-3">
                                                <p className="text-sm text-green-700">{successMessage}</p>
                                          </div>
                                    </div>
                              </div>
                        )}

                        {error && (
                              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
                                    <div className="flex">
                                          <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                </svg>
                                          </div>
                                          <div className="ml-3">
                                                <p className="text-sm text-red-700">{error}</p>
                                          </div>
                                    </div>
                              </div>
                        )}

                        {/* Main content grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                              {/* Left sidebar - Approval process explanation */}
                              <div className="lg:col-span-1">
                                    <div className={`${bgCard} rounded-lg ${shadowCard} p-5 mb-6 border ${borderSection}`}>
                                          <h2 className={`text-lg font-medium mb-4 ${textHeader} border-b pb-2 ${borderSection}`}>Approval Process</h2>
                                          <div className="space-y-4">
                                                <div className="flex items-center">
                                                      <div className="bg-blue-100 h-8 w-8 rounded-full flex items-center justify-center text-blue-800 font-semibold mr-3">QCS</div>
                                                      <div>
                                                            <h3 className="font-medium">QC Supervisor</h3>
                                                            <p className={`text-sm ${textSubtle}`}>Review by QC Supervisor</p>
                                                      </div>
                                                </div>
                                                <div className="w-0.5 h-6 bg-gray-300 ml-4"></div>
                                                <div className="flex items-center">
                                                      <div className="bg-blue-100 h-8 w-8 rounded-full flex items-center justify-center text-blue-800 font-semibold mr-3">QCM</div>
                                                      <div>
                                                            <h3 className="font-medium">QC Manager</h3>
                                                            <p className={`text-sm ${textSubtle}`}>Approval by QC Manager</p>
                                                      </div>
                                                </div>
                                                <div className="w-0.5 h-6 bg-gray-300 ml-4"></div>
                                                <div className="flex items-center">
                                                      <div className="bg-blue-100 h-8 w-8 rounded-full flex items-center justify-center text-blue-800 font-semibold mr-3">QAM</div>
                                                      <div>
                                                            <h3 className="font-medium">QA Manager</h3>
                                                            <p className={`text-sm ${textSubtle}`}>Approval by QA Manager</p>
                                                      </div>
                                                </div>
                                          </div>
                                    </div>

                                    {["SUPERVISOR QC", "MANAGER QC", "MANAGER QA"].includes(approveRole) && (
                                          <div className={`${bgCard} rounded-lg ${shadowCard} p-5 border ${borderSection}`}>
                                                <h2 className={`text-lg font-medium mb-4 ${textHeader} border-b pb-2 ${borderSection}`}>Approve Card</h2>
                                                <div className="space-y-4">
                                                      <div>
                                                            <label className={`block text-sm font-medium mb-1 ${textHeader}`}>Sampling Card ID</label>
                                                            <input
                                                                  type="number"
                                                                  placeholder="Enter card ID"
                                                                  className={`w-full p-2 border rounded-md ${borderSection} focus:ring-blue-500 focus:border-blue-500 bg-transparent ${textHeader}`}
                                                                  value={approveId}
                                                                  onChange={(e) => setApproveId(e.target.value)}
                                                                  readOnly
                                                            />
                                                      </div>
                                                      <div>
                                                            <label className={`block text-sm font-medium mb-1 ${textHeader}`}>Approval Role</label>
                                                            <input
                                                                  type="text"
                                                                  className={`w-full p-2 border rounded-md ${borderSection} focus:ring-blue-500 focus:border-blue-500 bg-transparent ${textHeader}`}
                                                                  value={approveRole}
                                                                  readOnly
                                                            />
                                                      </div>
                                                      <div>
                                                            <label className={`block text-sm font-medium mb-1 ${textHeader}`}>Your Name</label>
                                                            <input
                                                                  type="text"
                                                                  placeholder="Enter your name"
                                                                  className={`w-full p-2 border rounded-md ${borderSection} focus:ring-blue-500 focus:border-blue-500 bg-transparent ${textHeader}`}
                                                                  value={approveName}
                                                                  onChange={(e) => setName(e.target.value)}
                                                                  readOnly
                                                            />
                                                      </div>
                                                      <div className="flex space-x-2">
                                                            <button
                                                                  onClick={initiateApprove}
                                                                  disabled={loading || !approveId}
                                                                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                  {loading ? 'Processing...' : 'Approve'}
                                                            </button>
                                                            <button
                                                                  onClick={initiateReject}
                                                                  disabled={loading || !approveId}
                                                                  className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                  {loading ? 'Processing...' : 'Reject'}
                                                            </button>
                                                      </div>
                                                </div>
                                          </div>
                                    )}
                              </div>

                              {/* Main content area */}
                              <div className="lg:col-span-3">
                                    {/* Tab navigation */}
                                    <div className={`mb-4 ${tabBorder}`}>
                                          <nav className="flex -mb-px space-x-8">
                                                {["SUPERVISOR QC", "MANAGER QC", "MANAGER QA"].includes(approveRole) && (
                                                      <button
                                                            onClick={() => setActiveTab('unapproved')}
                                                            className={`py-4 px-1 font-medium text-sm border-b-2 ${activeTab === 'unapproved'
                                                                  ? tabBgActive
                                                                  : tabBgInactive
                                                                  }`}
                                                      >
                                                            Pending Approvals
                                                      </button>
                                                )}

                                                <button
                                                      onClick={() => setActiveTab('approved')}
                                                      className={`py-4 px-1 font-medium text-sm border-b-2 ${activeTab === 'approved'
                                                            ? tabBgActive
                                                            : tabBgInactive
                                                            }`}
                                                >
                                                      Approved Cards
                                                </button>
                                          </nav>
                                    </div>

                                    {/* Tab content */}
                                    <div className={`${bgCard} ${shadowCard} rounded-lg border ${borderSection}`}>
                                          {activeTab === 'unapproved' && ["SUPERVISOR QC", "MANAGER QC", "MANAGER QA"].includes(approveRole) && (
                                                <div className="p-5">
                                                      <div className="flex justify-between items-center mb-4">
                                                            <h2 className={`text-lg font-medium ${textHeader}`}>Pending Approval Cards</h2>
                                                            <button
                                                                  onClick={fetchUnapprovedList}
                                                                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full"
                                                                  title="Refresh list"
                                                            >
                                                                  <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                  </svg>
                                                            </button>
                                                      </div>

                                                      {loading ? (
                                                            <LoadingSpinner />
                                                      ) : (
                                                            <div className="overflow-x-auto">
                                                                  <table className="min-w-full divide-y divide-gray-200">
                                                                        <thead className={tableHeadBg}>
                                                                              <tr>
                                                                                    <th className={`px-3 py-3 text-left text-xs font-medium ${textSubtle} uppercase tracking-wider`}>ID</th>
                                                                                    <th className={`px-3 py-3 text-left text-xs font-medium ${textSubtle} uppercase tracking-wider`}>Material</th>
                                                                                    <th className={`px-3 py-3 text-left text-xs font-medium ${textSubtle} uppercase tracking-wider`}>Card Number</th>
                                                                                    <th className={`px-3 py-3 text-left text-xs font-medium ${textSubtle} uppercase tracking-wider`}>Created By</th>
                                                                                    <th className={`px-3 py-3 text-left text-xs font-medium ${textSubtle} uppercase tracking-wider`}>Created At</th>
                                                                                    <th className={`px-3 py-3 text-left text-xs font-medium ${textSubtle} uppercase tracking-wider`}>Action</th>
                                                                              </tr>
                                                                        </thead>
                                                                        <tbody className={bgCard + " divide-y divide-gray-200"}>
                                                                              {unapprovedList.length === 0 ? (
                                                                                    <tr>
                                                                                          <td colSpan="6" className={`px-3 py-4 text-center ${textSubtle}`}>
                                                                                                No pending approvals for your role
                                                                                          </td>
                                                                                    </tr>
                                                                              ) : (
                                                                                    unapprovedList.map((item) => (
                                                                                          <tr key={item.sampling_card_id} className={tableRowHover}>
                                                                                                <td className={`px-3 py-4 whitespace-nowrap text-sm ${textHeader}`}>{item.sampling_card_id}</td>
                                                                                                <td className={`px-3 py-4 whitespace-nowrap text-sm ${textHeader}`}>{item.material_name}</td>
                                                                                                <td className={`px-3 py-4 whitespace-nowrap text-sm ${textHeader}`}>{item.card_number}</td>
                                                                                                <td className={`px-3 py-4 whitespace-nowrap text-sm ${textHeader}`}>{item.created_by}</td>
                                                                                                <td className={`px-3 py-4 whitespace-nowrap text-sm ${textSubtle}`}>
                                                                                                      {new Date(item.created_at).toLocaleString()}
                                                                                                </td>
                                                                                                <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                                                      <button
                                                                                                            onClick={() => {
                                                                                                                  navigate(`/KartuSampling/${item.sampling_card_id}`);
                                                                                                            }}
                                                                                                            className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md mr-5"
                                                                                                      >
                                                                                                            Review
                                                                                                      </button>
                                                                                                      <button
                                                                                                            onClick={() => {
                                                                                                                  setApproveId(item.sampling_card_id);
                                                                                                            }}
                                                                                                            className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md"
                                                                                                      >
                                                                                                            Get Approval
                                                                                                      </button>
                                                                                                </td>
                                                                                          </tr>
                                                                                    ))
                                                                              )}
                                                                        </tbody>
                                                                  </table>
                                                            </div>
                                                      )}
                                                </div>
                                          )}

                                          {/* Approved Tab */}
                                          {activeTab === 'approved' && (
                                                <div className="p-5">
                                                      <div className="flex justify-between items-center mb-4">
                                                            <h2 className={`text-lg font-medium ${textHeader}`}>Approved Cards</h2>
                                                            <button
                                                                  onClick={fetchApprovedList}
                                                                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full"
                                                                  title="Refresh list"
                                                            >
                                                                  <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                  </svg>
                                                            </button>
                                                      </div>

                                                      {loading ? (
                                                            <LoadingSpinner />
                                                      ) : (
                                                            <div className="overflow-x-auto">
                                                                  <table className="min-w-full divide-y divide-gray-200">
                                                                        <thead className={tableHeadBg}>
                                                                              <tr>
                                                                                    <th className={`px-3 py-3 text-left text-xs font-medium ${textSubtle} uppercase tracking-wider`}>Card Number</th>
                                                                                    <th className={`px-3 py-3 text-left text-xs font-medium ${textSubtle} uppercase tracking-wider`}>Status</th>
                                                                                    <th className={`px-3 py-3 text-left text-xs font-medium ${textSubtle} uppercase tracking-wider`}>Approval Flow</th>
                                                                                    <th className={`px-3 py-3 text-left text-xs font-medium ${textSubtle} uppercase tracking-wider`}>Notes</th>
                                                                              </tr>
                                                                        </thead>
                                                                        <tbody className={bgCard + " divide-y divide-gray-200"}>
                                                                              {approvedList.length === 0 ? (
                                                                                    <tr>
                                                                                          <td colSpan="6" className={`px-3 py-4 text-center ${textSubtle}`}>
                                                                                                No approved cards found
                                                                                          </td>
                                                                                    </tr>
                                                                              ) : (
                                                                                    approvedList.map((item) => (
                                                                                          <tr key={item.sampling_card_id} className={tableRowHover}>
                                                                                                <td className={`px-3 py-4 whitespace-nowrap text-sm ${textHeader}`}>
                                                                                                      {
                                                                                                            item.card_number || "Card Not Found"
                                                                                                      }
                                                                                                </td>
                                                                                                <td className="px-3 py-4 whitespace-nowrap text-sm">
                                                                                                      {getOverallStatus(item)}
                                                                                                </td>
                                                                                                <td className="px-3 py-4 whitespace-nowrap text-sm">
                                                                                                      <div className="flex items-center space-x-1">
                                                                                                            <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium ${item.qc_supervisor_approved === 1
                                                                                                                        ? badgeStepActive
                                                                                                                        : item.qc_supervisor_approved === 2
                                                                                                                              ? badgeStepRejected
                                                                                                                              : badgeStepInactive
                                                                                                                  }`}>
                                                                                                                  QCS
                                                                                                            </span>
                                                                                                            <svg className="h-4 w-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                                                  <path d="M5 12h14"></path>
                                                                                                            </svg>
                                                                                                            <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium ${item.qc_manager_approved === 1
                                                                                                                        ? badgeStepActive
                                                                                                                        : item.qc_manager_approved === 2
                                                                                                                              ? badgeStepRejected
                                                                                                                              : badgeStepInactive
                                                                                                                  }`}>
                                                                                                                  QCM
                                                                                                            </span>
                                                                                                            <svg className="h-4 w-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                                                  <path d="M5 12h14"></path>
                                                                                                            </svg>
                                                                                                            <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium ${item.qa_manager_approved === 1
                                                                                                                        ? badgeStepActive
                                                                                                                        : item.qa_manager_approved === 2
                                                                                                                              ? badgeStepRejected
                                                                                                                              : badgeStepInactive
                                                                                                                  }`}>
                                                                                                                  QAM
                                                                                                            </span>
                                                                                                      </div>
                                                                                                </td>
                                                                                                <td className="px-3 py-4 whitespace-nowrap text-sm">
                                                                                                      {(item.qc_supervisor_approved === 2 || item.qc_manager_approved === 2 || item.qa_manager_approved === 2) && item.notes && (
                                                                                                            <Button
                                                                                                                  size="sm"
                                                                                                                  colorScheme="purple"
                                                                                                                  onClick={() => handleViewNotes(item)}
                                                                                                            >
                                                                                                                  View Notes
                                                                                                            </Button>
                                                                                                      )}
                                                                                                </td>
                                                                                          </tr>
                                                                                    ))
                                                                              )}
                                                                        </tbody>
                                                                  </table>
                                                            </div>
                                                      )}
                                                </div>
                                          )}
                                    </div>
                              </div>
                        </div>
                  </main>

                  {/* Notes */}
                  <Modal isOpen={isOpen} onClose={onClose}>
                        <ModalOverlay />
                        <ModalContent>
                              <ModalHeader>Rejection Notes</ModalHeader>
                              <ModalCloseButton />
                              <ModalBody>
                                    <Text fontWeight="bold">Card Id: {selectedItem?.sampling_card_id}</Text>
                                    <Text mb={3}> Rejected Date:{" "}
                                          {selectedItem?.qc_supervisor_approved === 2
                                                ? selectedItem?.qc_supervisor_approved_date
                                                : selectedItem?.qc_manager_approved === 2
                                                      ? selectedItem?.qc_manager_approved_date
                                                      : selectedItem?.qa_manager_approved === 2
                                                            ? selectedItem?.qa_manager_approved_date
                                                            : "-"}</Text>
                                    <Text mb={2}>
                                          Rejected By:{" "}
                                          {selectedItem?.qc_supervisor_approved === 2
                                                ? selectedItem?.qc_supervisor_name
                                                : selectedItem?.qc_manager_approved === 2
                                                      ? selectedItem?.qc_manager_name
                                                      : selectedItem?.qa_manager_approved === 2
                                                            ? selectedItem?.qa_manager_name
                                                            : "-"}
                                    </Text>
                                    <Box
                                          border="1px solid"
                                          borderColor={useColorModeValue("gray.200", "gray.700")}
                                          borderRadius="md"
                                          p={4}
                                          mt={2}
                                          bg={useColorModeValue("gray.50", "gray.800")}
                                    >
                                          <Text>{selectedItem?.notes || "Tidak ada notes"}</Text>
                                    </Box>
                              </ModalBody>

                              <ModalFooter>
                                    <Button colorScheme="blue" onClick={onClose}>
                                          Tutup
                                    </Button>
                              </ModalFooter>
                        </ModalContent>
                  </Modal>

                  {/* Footer */}
                  <footer className={`h-16 ${bgFooter}`}>
                        <div className="h-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
                              <p className={`text-sm text-center ${textFooter}`}>
                                    Quality Control Digitalization System &copy; 2025
                              </p>
                        </div>
                  </footer>
            </div>
      );
}