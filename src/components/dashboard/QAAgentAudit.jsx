/**
 * File: QAAgentAudit.jsx
 * Author: Naitik Maisuriya
 * Description: QA Agent Audit component for Admin, Super Admin, Project Manager, and Assistant Manager
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import nodeApi from '../../services/nodeApi';
import * as XLSX from 'xlsx';
import { 
  Download, 
  FileSpreadsheet, 
  Calendar as CalendarIcon, 
  ChevronDown,
  ChevronUp,
  UserCheck,
  Award,
  Search,
  Users,
  FileText,
  FileCheck,
  Plus,
  X,
  User
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '../../lib/utils';
import { getFriendlyErrorMessage } from '../../utils/errorMessages';
import ErrorMessage from '../common/ErrorMessage';
import { DateRangePicker } from '../common/CustomCalendar';
import MultiSelectWithCheckbox from '../common/MultiSelectWithCheckbox';

const QAAgentAudit = () => {
  const { user } = useAuth();

  // Helper function to get QC score color classes
  const getQCScoreColorClass = (score) => {
    if (score === null || score === undefined || score === '-' || isNaN(Number(score))) return 'text-slate-700';
    const numScore = Number(score);
    if (numScore >= 95) return 'text-green-800 bg-green-100 font-bold';
    if (numScore >= 80) return 'text-yellow-700 bg-yellow-100 font-bold';
    return 'text-red-700 bg-red-200 font-bold';
  };

  // Helper function to get audit status badge classes
  const getAuditStatusBadgeClass = (status) => {
    if (!status) return 'bg-slate-100 text-slate-700';
    const statusLower = status.toLowerCase();
    if (statusLower === 'approved' || statusLower === 'verified') return 'bg-green-100 text-green-800';
    if (statusLower === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (statusLower === 'rejected') return 'bg-red-100 text-red-800';
    return 'bg-slate-100 text-slate-700';
  };

  // Helper function to format date and time
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString || dateTimeString === '-') return { date: '-', time: '-' };
    
    try {
      const date = new Date(dateTimeString);
      
      // Format date as "6/Mar/2026"
      const day = date.getDate();
      const month = date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;
      
      // Format time as "12:13 AM"
      const formattedTime = date.toLocaleString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
      
      return { date: formattedDate, time: formattedTime };
    } catch (_error) {
      return { date: '-', time: '-' };
    }
  };

  // Helper function to handle file download
  const handleFileDownload = (fileName, fileUrl) => {
    if (!fileName || !fileUrl) {
      toast.error('File not available for download');
      return;
    }
    
    try {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.target = '_blank'; // Open in new tab if direct download fails
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Downloading ${fileName}...`);
    } catch (error) {
      console.error('[QAAgentAudit] File download error:', error);
      toast.error('Failed to download file');
    }
  };

  // Simple MonthPicker component
  const MonthPicker = ({ value, onChange }) => {
    const [showPicker, setShowPicker] = useState(false);
    const [viewYear, setViewYear] = useState(() => {
      if (value) {
        return parseInt(value.split('-')[0]);
      }
      return new Date().getFullYear();
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const handleMonthSelect = (monthIndex) => {
      const monthStr = String(monthIndex + 1).padStart(2, '0');
      const dateStr = `${viewYear}-${monthStr}`;
      onChange(dateStr);
      setShowPicker(false);
    };

    const selectedMonth = value ? parseInt(value.split('-')[1]) - 1 : -1;
    const selectedYear = value ? parseInt(value.split('-')[0]) : -1;

    const displayValue = value ? (() => {
      const [year, month] = value.split('-');
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    })() : 'Select Month';

    return (
      <div>
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase mb-2">
          <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
          Month
        </label>
        <Popover open={showPicker} onOpenChange={setShowPicker}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="w-full bg-slate-50 border-2 border-blue-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-blue-50 hover:border-blue-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-left flex items-center justify-between"
            >
              <span>{displayValue}</span>
              <ChevronDown className="w-4 h-4 text-blue-600" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] border-2 border-blue-200 bg-white p-4" align="start">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setViewYear(y => y - 1)}
                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="font-bold text-sm text-slate-800">{viewYear}</span>
              <button
                type="button"
                onClick={() => setViewYear(y => y + 1)}
                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {monthNames.map((month, index) => {
                const isSelected = selectedYear === viewYear && selectedMonth === index;
                return (
                  <button
                    key={month}
                    type="button"
                    onClick={() => handleMonthSelect(index)}
                    className={cn(
                      "text-sm p-2.5 rounded-lg transition-colors font-medium",
                      isSelected
                        ? "bg-blue-600 text-white font-bold"
                        : "text-slate-700 hover:bg-blue-100"
                    )}
                  >
                    {month}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  // Helper function to get current month
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  // State management
  const [activeTab, setActiveTab] = useState('audit_form'); // 'audit_form' or 'audit_report'
  const [monthFilter, setMonthFilter] = useState(() => getCurrentMonth());
  const [auditData, setAuditData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedAgents, setExpandedAgents] = useState({}); // Track which QA agents are expanded
  const [searchQuery, setSearchQuery] = useState(''); // Search within QA agents
  
  // Individual agent filters - stores filters per agent
  const [agentFilters, setAgentFilters] = useState({}); // { qaAgentName: { agents: [], startDate: '', endDate: '' } }
  
  // Modal state for QC Score input
  const [showQCScoreModal, setShowQCScoreModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [qcScoreInput, setQcScoreInput] = useState('');
  const [qcCheckedFile, setQcCheckedFile] = useState(null);
  const [errorNotes, setErrorNotes] = useState('');

  // Group audit data by QA Agent
  const groupedByQAAgent = React.useMemo(() => {
    const grouped = {};
    
    // Filter by month if monthFilter is set
    let filteredData = auditData;
    if (monthFilter) {
      const [year, month] = monthFilter.split('-');
      filteredData = auditData.filter(record => {
        if (!record.audit_datetime) return false;
        const recordDate = new Date(record.audit_datetime);
        const recordYear = recordDate.getFullYear();
        const recordMonth = recordDate.getMonth() + 1; // 0-indexed
        return recordYear === parseInt(year) && recordMonth === parseInt(month);
      });
    }
    
    filteredData.forEach(record => {
      const qaName = record.qa_agent_name || 'Unknown QA Agent';
      if (!grouped[qaName]) {
        grouped[qaName] = {
          qaAgentName: qaName,
          qaAgentId: record.qa_agent_id || qaName,
          records: [],
          totalQCs: 0,
          totalErrors: 0,
          avgScore: 0
        };
      }
      grouped[qaName].records.push(record);
      grouped[qaName].totalQCs += Number(record.total_qc_performed) || 0;
      grouped[qaName].totalErrors += Number(record.total_errors_found) || 0;
    });
    
    // Calculate average scores
    Object.keys(grouped).forEach(qaName => {
      const records = grouped[qaName].records;
      if (records.length > 0) {
        const totalScore = records.reduce((sum, r) => sum + (Number(r.average_qc_score) || 0), 0);
        grouped[qaName].avgScore = (totalScore / records.length).toFixed(2);
      }
    });
    
    return Object.values(grouped);
  }, [auditData, monthFilter]);

  // Filter grouped data by search query
  const filteredQAAgents = React.useMemo(() => {
    if (!searchQuery.trim()) return groupedByQAAgent;
    
    const query = searchQuery.toLowerCase();
    return groupedByQAAgent.filter(qa =>
      qa.qaAgentName.toLowerCase().includes(query) ||
      qa.records.some(r =>
        (r.agent_name || '').toLowerCase().includes(query) ||
        (r.project_name || '').toLowerCase().includes(query) ||
        (r.task_name || '').toLowerCase().includes(query)
      )
    );
  }, [groupedByQAAgent, searchQuery]);

  // Toggle QA Agent section
  const toggleAgent = (qaName) => {
    setExpandedAgents(prev => ({
      ...prev,
      [qaName]: !prev[qaName]
    }));
  };

  // Expand all or collapse all
  const expandAll = () => {
    const allExpanded = {};
    filteredQAAgents.forEach(qa => {
      allExpanded[qa.qa_name] = true;
    });
    setExpandedAgents(allExpanded);
  };

  const collapseAll = () => {
    setExpandedAgents({});
  };

  // Get filters for a specific agent
  const getAgentFilter = (qaAgentName) => {
    return agentFilters[qaAgentName] || { agents: [], startDate: '', endDate: '' };
  };

  // Update filters for a specific agent
  const updateAgentFilter = (qaAgentName, filterType, value) => {
    setAgentFilters(prev => ({
      ...prev,
      [qaAgentName]: {
        ...getAgentFilter(qaAgentName),
        [filterType]: value
      }
    }));
  };

  // Clear filters for a specific agent
  const clearAgentFilters = (qaAgentName) => {
    setAgentFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[qaAgentName];
      return newFilters;
    });
  };

  // Filter records for a specific QA agent based on individual filters
  const getFilteredRecords = (records, qaAgentName) => {
    const filter = getAgentFilter(qaAgentName);
    
    let filtered = [...records];
    
    // Filter by agents (agent_name)
    if (filter.agents && filter.agents.length > 0) {
      filtered = filtered.filter(record => 
        filter.agents.includes(record.agent_name)
      );
    }
    
    // Filter by date range
    if (filter.startDate || filter.endDate) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.timestamp || record.audit_datetime);
        const start = filter.startDate ? new Date(filter.startDate) : null;
        const end = filter.endDate ? new Date(filter.endDate) : null;
        
        if (start && recordDate < start) return false;
        if (end && recordDate > end) return false;
        return true;
      });
    }
    
    return filtered;
  };

  // Get unique agent names from records for a specific QA agent
  const getUniqueAgents = (records) => {
    const agents = [...new Set(records.map(r => r.agent_name).filter(Boolean))];
    return agents.map(agent => ({ value: agent, label: agent }));
  };

  // Handle QC Score Modal
  const handleOpenQCScoreModal = (qaAgentName) => {
    setSelectedAgent(qaAgentName);
    setQcScoreInput('');
    setQcCheckedFile(null);
    setErrorNotes('');
    setShowQCScoreModal(true);
  };

  const handleCloseQCScoreModal = () => {
    setShowQCScoreModal(false);
    setSelectedAgent(null);
    setQcScoreInput('');
    setQcCheckedFile(null);
    setErrorNotes('');
  };

  const handleSubmitQCScore = () => {
    if (!qcScoreInput || isNaN(Number(qcScoreInput))) {
      toast.error('Please enter a valid QC Score');
      return;
    }

    const score = Number(qcScoreInput);
    if (score < 0 || score > 100) {
      toast.error('QC Score must be between 0 and 100');
      return;
    }

    // TODO: Submit QC Score to API
    // The data would include: score, qcCheckedFile, errorNotes, selectedAgent
    toast.success(`QC Score ${score}% submitted for ${selectedAgent}`);
    handleCloseQCScoreModal();
  };

  // Get current date and time for modal display
  const getCurrentDateTime = () => {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString('en-US', { month: 'short' });
    const year = now.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;
    
    const formattedTime = now.toLocaleString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
    
    return { date: formattedDate, time: formattedTime };
  };

  // Fetch audit data
  useEffect(() => {
    const fetchAuditData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('[QAAgentAudit] Fetching audit data for user:', user?.user_id);

        // Call the API endpoint
        const response = await nodeApi.get('/qc-records/list', {
          params: {
            logged_in_user_id: user?.user_id
          }
        });

        console.log('[QAAgentAudit] API Response:', response.data);

        // Map API response to expected structure
        const apiData = response.data?.data || [];
        const mappedData = apiData.map(record => ({
          audit_id: record.id,
          audit_datetime: record.timestamp || record.date_of_file_submission,
          qa_agent_name: record.qa_name,
          qa_agent_id: record.qc_user_id,
          agent_name: record.agent_name,
          project_name: record.project_name,
          task_name: record.task_name,
          file_name: record['10%_file_path'] ? record['10%_file_path'].split('/').pop() : (record.file_path ? record.file_path.split('/').pop() : 'N/A'),
          file_url: record['10%_file_path'] || record.file_path || '', // URL for downloading
          total_qc_performed: record['10%_data_generated_count'] || record.file_record_count || 0,
          average_qc_score: record.qc_score || 0,
          total_errors_found: record.error_score || 0,
          audit_status: record.status || 'Pending',
          comments: '', // Not in API response, can be added later
          file_record_count: record.file_record_count || 0,
          // Store original file paths for download functionality
          file_path: record.file_path,
          qc_file_path: record['10%_file_path'],
          error_list: record.error_list,
          tracker_id: record.tracker_id,
          project_id: record.project_id,
          task_id: record.task_id
        }));

        setAuditData(mappedData);
        console.log('[QAAgentAudit] Mapped data:', mappedData);

      } catch (err) {
        console.error('[QAAgentAudit] Error fetching audit data:', err);
        const msg = getFriendlyErrorMessage(err);
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    if (user?.user_id) {
      fetchAuditData();
    }
  }, [user]);

  // Export to Excel
  const handleExportExcel = () => {
    try {
      if (auditData.length === 0) {
        toast.error('No data to export');
        return;
      }

      const exportData = auditData.map(row => ({
        'Audit Date & Time': row.audit_datetime || '-',
        'QA Agent': row.qa_agent_name || '-',
        'Agent Name': row.agent_name || '-',
        'Project': row.project_name || '-',
        'Task': row.task_name || '-',
        'File': row.file_name || '-',
        'Total QCs': row.total_qc_performed || 0,
        'Avg QC Score': row.average_qc_score != null ? `${row.average_qc_score}%` : '-',
        'Total Errors': row.total_errors_found || 0,
        'Status': row.audit_status || '-',
        'Comments': row.comments || '-'
      }));

      // Calculate summary
      const avgScore = auditData.reduce((sum, r) => sum + (Number(r.average_qc_score) || 0), 0) / auditData.length;
      const totalQCs = auditData.reduce((sum, r) => sum + (Number(r.total_qc_performed) || 0), 0);
      const totalErrors = auditData.reduce((sum, r) => sum + (Number(r.total_errors_found) || 0), 0);

      exportData.push({
        'Audit Date & Time': 'SUMMARY',
        'QA Agent': '',
        'Agent Name': '',
        'Project': '',
        'Task': '',
        'File': '',
        'Total QCs': totalQCs,
        'Avg QC Score': `${avgScore.toFixed(2)}%`,
        'Total Errors': totalErrors,
        'Status': '',
        'Comments': ''
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet['!cols'] = [
        { wch: 20 },  // Audit Date & Time
        { wch: 15 },  // QA Agent
        { wch: 15 },  // Agent Name
        { wch: 20 },  // Project
        { wch: 18 },  // Task
        { wch: 25 },  // File
        { wch: 12 },  // Total QCs
        { wch: 14 },  // Avg QC Score
        { wch: 14 },  // Total Errors
        { wch: 12 },  // Status
        { wch: 30 }   // Comments
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'QA Agent Audit');
      const filename = `QA_Agent_Audit_${monthFilter}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success('QA Agent Audit report exported!');
    } catch (err) {
      const msg = getFriendlyErrorMessage(err);
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight cursor-default">QA Agent Audit</h2>
              <p className="text-slate-600 text-sm font-medium mt-1 cursor-default">Monitor and review QA Agent performance and quality checking activities</p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('audit_form')}
              className={`flex-1 px-6 py-4 text-sm font-bold transition-all relative ${
                activeTab === 'audit_form'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                <span>QA Agent Audit Form</span>
              </div>
              {activeTab === 'audit_form' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('audit_report')}
              className={`flex-1 px-6 py-4 text-sm font-bold transition-all relative ${
                activeTab === 'audit_report'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileCheck className="w-4 h-4" />
                <span>QA Agent Audit Report</span>
              </div>
              {activeTab === 'audit_report' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'audit_form' && (
          <>
      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-md border border-blue-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          {/* Month Filter */}
          <div className="flex-1 lg:flex-none lg:w-64">
            <MonthPicker
              value={monthFilter}
              onChange={setMonthFilter}
            />
          </div>

          {/* Search Input */}
          <div className="flex-1 lg:flex-none lg:w-80">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase mb-2">
              <Search className="w-3.5 h-3.5 text-blue-600" />
              Search QA Agents
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by QA agent name..."
              className="w-full bg-slate-50 border-2 border-blue-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-blue-50 hover:border-blue-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Grouped QA Agent Audit Report */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl shadow-md border border-blue-100 py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mb-3"></div>
            <p className="text-blue-700 font-semibold">Loading QA Agent Audit data...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-md border border-blue-100 p-6">
            <ErrorMessage message={error} />
          </div>
        ) : filteredQAAgents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-blue-100 p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-400 font-medium text-lg">No QA agents found</p>
            <p className="text-gray-400 text-sm mt-2">
              {searchQuery ? 'Try adjusting your search query' : 'No audit data available for this period'}
            </p>
          </div>
        ) : (
          filteredQAAgents.map(({ qaAgentName, records }) => {
            const isExpanded = expandedAgents[qaAgentName];
            const filteredRecords = getFilteredRecords(records, qaAgentName);
            const agentFilter = getAgentFilter(qaAgentName);
            const uniqueAgents = getUniqueAgents(records);
            
            // Calculate statistics for this QA agent
            const totalRecords = records.length;
            const totalQCs = records.reduce((sum, r) => sum + (Number(r.total_qc_performed) || Number(r['10%_qc_file_records']) || Number(r['10%_data_generated_count']) || 0), 0);
            const avgScore = records.length > 0
              ? (records.reduce((sum, r) => sum + (Number(r.qc_score) || Number(r.average_qc_score) || 0), 0) / records.length)
              : 0;
            const totalErrors = records.reduce((sum, r) => sum + (Number(r.error_score) || Number(r.total_errors_found) || 0), 0);

            return (
              <div key={qaAgentName} className="bg-white rounded-xl shadow-lg border-2 border-blue-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                {/* QA Agent Header Card */}
                <div 
                  className="bg-gradient-to-br from-blue-50 via-white to-blue-50 border-b-2 border-blue-200 p-6"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Avatar with clean design */}
                      <div className="relative flex-shrink-0">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl shadow-md border-2 border-blue-200">
                          {qaAgentName ? qaAgentName.charAt(0).toUpperCase() : '?'}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                            {qaAgentName}
                          </h3>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-full shadow-md">
                            <FileCheck className="w-3.5 h-3.5" />
                            {totalRecords} {totalRecords === 1 ? 'Record' : 'Records'}
                          </span>
                        </div>
                        
                        {/* Statistics Row */}
                        <div className="flex items-center gap-6 mt-3">
                          {/* Total QCs */}
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Award className="w-4 h-4 text-blue-700" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 font-semibold uppercase">Total QC Records</p>
                              <p className="text-lg font-bold text-blue-700">{totalQCs}</p>
                            </div>
                          </div>
                          
                          {/* Average Score */}
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${
                              avgScore >= 95 ? 'bg-green-100' : avgScore >= 80 ? 'bg-yellow-100' : 'bg-red-100'
                            }`}>
                              <UserCheck className={`w-4 h-4 ${
                                avgScore >= 95 ? 'text-green-700' : avgScore >= 80 ? 'text-yellow-700' : 'text-red-700'
                              }`} />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 font-semibold uppercase">Avg Score</p>
                              <p className={`text-lg font-bold ${
                                avgScore >= 95 ? 'text-green-700' : avgScore >= 80 ? 'text-yellow-700' : 'text-red-700'
                              }`}>
                                {avgScore.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                          
                          {/* Total Errors */}
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-red-100 rounded-lg">
                              <FileSpreadsheet className="w-4 h-4 text-red-700" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 font-semibold uppercase">Errors</p>
                              <p className="text-lg font-bold text-red-700">{totalErrors}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Add QC Score Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenQCScoreModal(qaAgentName);
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white rounded-lg font-bold text-sm shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                      >
                        <Plus className="w-4 h-4" />
                        Add Score
                      </button>
                      <button
                        className="p-3 rounded-xl bg-blue-100 hover:bg-blue-200 transition-all duration-150 shadow-md hover:shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAgent(qaAgentName);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-blue-700" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-blue-700" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Individual Agent Filters */}
                  {isExpanded && (
                    <div className="mt-6 pt-5 border-t-2 border-blue-100">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Agent Name Filter */}
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase mb-2">
                            <User className="w-3.5 h-3.5 text-blue-600" />
                            Filter by Agent Name
                          </label>
                          <MultiSelectWithCheckbox
                            value={agentFilter.agents}
                            onChange={(value) => updateAgentFilter(qaAgentName, 'agents', value)}
                            options={uniqueAgents}
                            icon={User}
                            placeholder="All Agents"
                            showSelectAll={true}
                          />
                        </div>

                        {/* Date Range Filter */}
                        <div className="lg:col-span-2">
                          <DateRangePicker
                            startDate={agentFilter.startDate}
                            endDate={agentFilter.endDate}
                            onStartDateChange={(date) => updateAgentFilter(qaAgentName, 'startDate', date)}
                            onEndDateChange={(date) => updateAgentFilter(qaAgentName, 'endDate', date)}
                            onClear={() => clearAgentFilters(qaAgentName)}
                            label=""
                            description=""
                            showClearButton={true}
                            noWrapper={true}
                            fieldWidth="200px"
                          />
                        </div>
                      </div>
                      
                      {/* Filter Summary */}
                      {(agentFilter.agents.length > 0 || agentFilter.startDate || agentFilter.endDate) && (
                        <div className="mt-4 flex items-center gap-2 text-xs">
                          <span className="font-bold text-slate-700">Active Filters:</span>
                          {agentFilter.agents.length > 0 && (
                            <span className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold shadow-sm">
                              Agents: {agentFilter.agents.length}
                            </span>
                          )}
                          {(agentFilter.startDate || agentFilter.endDate) && (
                            <span className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold shadow-sm">
                              Date Range Applied
                            </span>
                          )}
                          <span className="font-bold text-slate-700 ml-2">
                            Showing <span className="text-blue-700">{filteredRecords.length}</span> of <span className="text-slate-500">{records.length}</span> records
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Collapsible Audit Records Table */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-blue-100">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Agent Name</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Project Name</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Task Name</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">QC File</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">File Record Count</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">10% QC Record Count</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">Error Score</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">Error List</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">QC Score</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Date and Time</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-blue-50">
                        {filteredRecords.length === 0 ? (
                          <tr>
                            <td colSpan="11" className="px-6 py-12 text-center">
                              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                              <p className="text-gray-400 font-medium">No records found</p>
                              <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                            </td>
                          </tr>
                        ) : (
                          filteredRecords.map((row, idx) => (
                          <tr key={idx} className="hover:bg-blue-50/50 transition-colors duration-150">
                            <td className="px-6 py-4 text-gray-900 font-medium">{row.agent_name || '-'}</td>
                            <td className="px-6 py-4 text-gray-900">{row.project_name || '-'}</td>
                            <td className="px-6 py-4 text-gray-900">{row.task_name || '-'}</td>
                            <td className="px-6 py-4 text-center">
                              {row.file_name && row.file_name !== '-' ? (
                                <a
                                  href={row.file_url || '#'}
                                  download={row.file_name}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-bold transition-colors group/link"
                                >
                                  <Download className="w-4 h-4 group-hover/link:animate-bounce" aria-hidden="true" />
                                  Download
                                </a>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-semibold text-slate-700">
                                {row.file_record_count || 0}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-semibold text-blue-600">
                                {row['10%_qc_file_records'] || row['10%_data_generated_count'] || 0}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-semibold text-red-600">
                                {row.error_score || row.total_errors_found || 0}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-100 border border-slate-200 hover:border-blue-300 rounded-lg text-slate-700 hover:text-blue-700 text-xs font-bold transition-all"
                              >
                                <FileSpreadsheet className="w-3 h-3" />
                                View
                              </button>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-3 py-1 rounded-lg font-semibold text-sm inline-block ${getAuditStatusBadgeClass(row.status || row.audit_status)}`}>
                                {row.status || row.audit_status || '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-3 py-1 rounded-lg inline-block ${getQCScoreColorClass(row.qc_score || row.average_qc_score)}`}>
                                {row.qc_score != null ? `${Number(row.qc_score).toFixed(2)}%` : (row.average_qc_score != null ? `${Number(row.average_qc_score).toFixed(2)}%` : '-')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-900 font-medium whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold">{formatDateTime(row.timestamp || row.audit_datetime).date}</span>
                                <span className="text-xs text-gray-600">{formatDateTime(row.timestamp || row.audit_datetime).time}</span>
                              </div>
                            </td>
                          </tr>
                        )))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
          </>
        )}

        {activeTab === 'audit_report' && (
          <>
      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-md border border-blue-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          {/* Month Filter */}
          <div className="flex-1 lg:flex-none lg:w-64">
            <MonthPicker
              value={monthFilter}
              onChange={setMonthFilter}
            />
          </div>

          {/* Search Input */}
          <div className="flex-1 lg:flex-none lg:w-80">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase mb-2">
              <Search className="w-3.5 h-3.5 text-blue-600" />
              Search QA Agents
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by QA agent name..."
              className="w-full bg-slate-50 border-2 border-blue-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-blue-50 hover:border-blue-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
          
          {/* Export Button */}
          <div className="flex items-end ml-auto">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Grouped QA Agent Audit Report */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl shadow-md border border-blue-100 py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mb-3"></div>
            <p className="text-blue-700 font-semibold">Loading QA Agent Audit data...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-md border border-blue-100 p-6">
            <ErrorMessage message={error} />
          </div>
        ) : filteredQAAgents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-blue-100 p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-400 font-medium text-lg">No QA agents found</p>
            <p className="text-gray-400 text-sm mt-2">
              {searchQuery ? 'Try adjusting your search query' : 'No audit data available for this period'}
            </p>
          </div>
        ) : (
          filteredQAAgents.map(({ qaAgentName, records }) => {
            const isExpanded = expandedAgents[qaAgentName];
            const filteredRecords = getFilteredRecords(records, qaAgentName);
            const agentFilter = getAgentFilter(qaAgentName);
            const uniqueAgents = getUniqueAgents(records);
            
            // Calculate statistics for this QA agent
            const totalRecords = records.length;
            const totalQCs = records.reduce((sum, r) => sum + (Number(r.total_qc_performed) || Number(r['10%_qc_file_records']) || Number(r['10%_data_generated_count']) || 0), 0);
            const avgScore = records.length > 0
              ? (records.reduce((sum, r) => sum + (Number(r.qc_score) || Number(r.average_qc_score) || 0), 0) / records.length)
              : 0;
            const totalErrors = records.reduce((sum, r) => sum + (Number(r.error_score) || Number(r.total_errors_found) || 0), 0);

            return (
              <div key={qaAgentName} className="bg-white rounded-xl shadow-lg border-2 border-blue-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                {/* QA Agent Header Card */}
                <div 
                  className="bg-gradient-to-br from-blue-50 via-white to-blue-50 border-b-2 border-blue-200 p-6"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Avatar with clean design */}
                      <div className="relative flex-shrink-0">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl shadow-md border-2 border-blue-200">
                          {qaAgentName ? qaAgentName.charAt(0).toUpperCase() : '?'}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                            {qaAgentName}
                          </h3>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-full shadow-md">
                            <FileCheck className="w-3.5 h-3.5" />
                            {totalRecords} {totalRecords === 1 ? 'Record' : 'Records'}
                          </span>
                        </div>
                        
                        {/* Statistics Row */}
                        <div className="flex items-center gap-6 mt-3">
                          {/* Total QCs */}
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Award className="w-4 h-4 text-blue-700" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 font-semibold uppercase">Total QC Records</p>
                              <p className="text-lg font-bold text-blue-700">{totalQCs}</p>
                            </div>
                          </div>
                          
                          {/* Average Score */}
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${
                              avgScore >= 95 ? 'bg-green-100' : avgScore >= 80 ? 'bg-yellow-100' : 'bg-red-100'
                            }`}>
                              <UserCheck className={`w-4 h-4 ${
                                avgScore >= 95 ? 'text-green-700' : avgScore >= 80 ? 'text-yellow-700' : 'text-red-700'
                              }`} />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 font-semibold uppercase">Avg Score</p>
                              <p className={`text-lg font-bold ${
                                avgScore >= 95 ? 'text-green-700' : avgScore >= 80 ? 'text-yellow-700' : 'text-red-700'
                              }`}>
                                {avgScore.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                          
                          {/* Total Errors */}
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-red-100 rounded-lg">
                              <FileSpreadsheet className="w-4 h-4 text-red-700" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 font-semibold uppercase">Errors</p>
                              <p className="text-lg font-bold text-red-700">{totalErrors}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Expand/Collapse Button */}
                      <button
                        className="p-3 rounded-xl bg-blue-100 hover:bg-blue-200 transition-all duration-150 shadow-md hover:shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAgent(qaAgentName);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-blue-700" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-blue-700" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Individual Agent Filters */}
                  {isExpanded && (
                    <div className="mt-6 pt-5 border-t-2 border-blue-100">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Agent Name Filter */}
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase mb-2">
                            <User className="w-3.5 h-3.5 text-blue-600" />
                            Filter by Agent Name
                          </label>
                          <MultiSelectWithCheckbox
                            value={agentFilter.agents}
                            onChange={(value) => updateAgentFilter(qaAgentName, 'agents', value)}
                            options={uniqueAgents}
                            icon={User}
                            placeholder="All Agents"
                            showSelectAll={true}
                          />
                        </div>

                        {/* Date Range Filter */}
                        <div className="lg:col-span-2">
                          <DateRangePicker
                            startDate={agentFilter.startDate}
                            endDate={agentFilter.endDate}
                            onStartDateChange={(date) => updateAgentFilter(qaAgentName, 'startDate', date)}
                            onEndDateChange={(date) => updateAgentFilter(qaAgentName, 'endDate', date)}
                            onClear={() => clearAgentFilters(qaAgentName)}
                            label=""
                            description=""
                            showClearButton={true}
                            noWrapper={true}
                            fieldWidth="200px"
                          />
                        </div>
                      </div>
                      
                      {/* Filter Summary */}
                      {(agentFilter.agents.length > 0 || agentFilter.startDate || agentFilter.endDate) && (
                        <div className="mt-4 flex items-center gap-2 text-xs">
                          <span className="font-bold text-slate-700">Active Filters:</span>
                          {agentFilter.agents.length > 0 && (
                            <span className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold shadow-sm">
                              Agents: {agentFilter.agents.length}
                            </span>
                          )}
                          {(agentFilter.startDate || agentFilter.endDate) && (
                            <span className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold shadow-sm">
                              Date Range Applied
                            </span>
                          )}
                          <span className="font-bold text-slate-700 ml-2">
                            Showing <span className="text-blue-700">{filteredRecords.length}</span> of <span className="text-slate-500">{records.length}</span> records
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Collapsible Audit Records Table */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-blue-100">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Audit Date & Time</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Agent Name</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Project</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Task</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">Total QCs</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">Avg QC Score</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">Total Errors</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">QC Checked File</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Error Notes</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Comments</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-blue-50">
                        {filteredRecords.length === 0 ? (
                          <tr>
                            <td colSpan="11" className="px-6 py-12 text-center">
                              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                              <p className="text-gray-400 font-medium">No records found</p>
                              <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                            </td>
                          </tr>
                        ) : (
                          filteredRecords.map((row, idx) => (
                          <tr key={idx} className="hover:bg-blue-50/50 transition-colors duration-150">
                            <td className="px-6 py-4 text-gray-900 font-medium whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold">{formatDateTime(row.timestamp || row.audit_datetime).date}</span>
                                <span className="text-xs text-gray-600">{formatDateTime(row.timestamp || row.audit_datetime).time}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-900">{row.agent_name || '-'}</td>
                            <td className="px-6 py-4 text-gray-900">{row.project_name || '-'}</td>
                            <td className="px-6 py-4 text-gray-900">{row.task_name || '-'}</td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-semibold text-blue-600">
                                {row.total_qc_performed || 0}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-3 py-1 rounded-lg inline-block ${getQCScoreColorClass(row.average_qc_score)}`}>
                                {row.average_qc_score != null ? `${Number(row.average_qc_score).toFixed(2)}%` : '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-semibold text-red-600">
                                {row.total_errors_found || 0}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-900 text-sm">{row.qc_checked_file || '-'}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-3 py-1 rounded-lg font-semibold text-sm inline-block ${getAuditStatusBadgeClass(row.audit_status)}`}>
                                {row.audit_status || '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-600 text-sm">{row.notes || '-'}</td>
                            <td className="px-6 py-4 text-gray-600 text-sm">{row.comments || '-'}</td>
                          </tr>
                        )))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
          </>
        )}
      </div>

      {/* QC Score Modal */}
      {showQCScoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-blue-50/30 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border-2 border-blue-300 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">Add QC Score</h2>
                  <p className="text-blue-100 text-sm mt-1">
                    Enter QC Score for {selectedAgent}
                  </p>
                  {/* Current Date and Time */}
                  <div className="mt-3 flex items-center gap-4 text-blue-100 text-xs">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span className="font-semibold">{getCurrentDateTime().date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                        <path strokeWidth="2" strokeLinecap="round" d="M12 6v6l4 2"/>
                      </svg>
                      <span className="font-semibold">{getCurrentDateTime().time}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCloseQCScoreModal}
                  className="p-2 hover:bg-blue-500 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* QC Score */}
              <div className="mb-5">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase mb-2">
                  <Award className="w-4 h-4 text-blue-600" />
                  QC Score (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={qcScoreInput}
                  onChange={(e) => setQcScoreInput(e.target.value)}
                  placeholder="Enter QC Score (0-100)"
                  className="w-full bg-slate-50 border-2 border-blue-200 rounded-lg px-4 py-3 text-lg font-medium text-slate-800 hover:bg-blue-50 hover:border-blue-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Score must be between 0 and 100
                </p>
              </div>

              {/* QC Checked File */}
              <div className="mb-5">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase mb-2">
                  <FileCheck className="w-4 h-4 text-blue-600" />
                  QC Checked File
                </label>
                <input
                  type="file"
                  onChange={(e) => setQcCheckedFile(e.target.files[0] || null)}
                  accept=".xlsx,.xls,.csv,.pdf,.doc,.docx"
                  className="w-full bg-slate-50 border-2 border-blue-200 rounded-lg px-4 py-3 text-base font-medium text-slate-800 hover:bg-blue-50 hover:border-blue-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
                />
                {qcCheckedFile && (
                  <p className="text-xs text-slate-600 mt-2 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-green-600" />
                    <span className="font-medium">{qcCheckedFile.name}</span>
                    <span className="text-slate-400">({(qcCheckedFile.size / 1024).toFixed(2)} KB)</span>
                  </p>
                )}
              </div>

              {/* Error Notes */}
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase mb-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Error Notes
                </label>
                <textarea
                  value={errorNotes}
                  onChange={(e) => setErrorNotes(e.target.value)}
                  placeholder="Enter Error Notes (Optional)"
                  rows="3"
                  className="w-full bg-slate-50 border-2 border-blue-200 rounded-lg px-4 py-3 text-base font-medium text-slate-800 hover:bg-blue-50 hover:border-blue-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCloseQCScoreModal}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-all border-2 border-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitQCScore}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                  Submit Score
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QAAgentAudit;
