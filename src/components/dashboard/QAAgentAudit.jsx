/**
 * File: QAAgentAudit.jsx
 * Author: Naitik Maisuriya
 * Description: QA Agent Audit component for Admin, Super Admin, Project Manager, and Assistant Manager
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
// import axios from 'axios'; // TODO: Uncomment when API is ready
import * as XLSX from 'xlsx';
import { 
  Download, 
  FileSpreadsheet, 
  Calendar as CalendarIcon, 
  ChevronDown,
  RotateCcw,
  UserCheck,
  Award,
  Filter,
  Search
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '../../lib/utils';
import { getFriendlyErrorMessage } from '../../utils/errorMessages';
import ErrorMessage from '../common/ErrorMessage';

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
  const [monthFilter, setMonthFilter] = useState(() => getCurrentMonth());
  const [qaAgentFilter, setQaAgentFilter] = useState('');
  const [auditData, setAuditData] = useState([]);
  const [qaAgentList, setQaAgentList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch QA Agent list for dropdown (on mount)
  useEffect(() => {
    const fetchQAAgents = async () => {
      try {
        // TODO: Replace with actual API endpoint when backend is ready
        // const response = await axios.get('/api/qa-agents');
        
        // Mock data for now
        const mockQAAgents = [
          { id: 1, name: 'John QA' },
          { id: 2, name: 'Jane QA' },
          { id: 3, name: 'Mike QA' },
          { id: 4, name: 'Sarah QA' }
        ];

        setQaAgentList(mockQAAgents);
      } catch (err) {
        console.error('[QAAgentAudit] Error fetching QA agents:', err);
      }
    };

    fetchQAAgents();
  }, []);

  // Fetch audit data
  useEffect(() => {
    const fetchAuditData = async () => {
      setLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual API endpoint when backend is ready
        const payload = {
          logged_in_user_id: user?.user_id,
          month_year: monthFilter,
          qa_agent_id: qaAgentFilter || null
        };

        console.log('[QAAgentAudit] Fetching audit data:', payload);

        // Placeholder API call - replace with actual endpoint
        // const response = await axios.post('/api/qa-agent-audit', payload);
        
        // Mock data for now
        const mockData = [
          {
            audit_id: 1,
            audit_datetime: '2024-03-01 11:30:00',
            qa_agent_name: 'John QA',
            agent_name: 'Alice Agent',
            project_name: 'Project Alpha',
            task_name: 'Data Entry',
            file_name: 'batch_001.xlsx',
            total_qc_performed: 15,
            average_qc_score: 96.5,
            total_errors_found: 12,
            audit_status: 'Approved',
            comments: 'Excellent quality checking'
          },
          {
            audit_id: 2,
            audit_datetime: '2024-03-02 14:45:00',
            qa_agent_name: 'Jane QA',
            agent_name: 'Bob Agent',
            project_name: 'Project Beta',
            task_name: 'Validation',
            file_name: 'batch_002.xlsx',
            total_qc_performed: 20,
            average_qc_score: 88.0,
            total_errors_found: 38,
            audit_status: 'Pending',
            comments: 'Review needed'
          },
          {
            audit_id: 3,
            audit_datetime: '2024-03-03 09:15:00',
            qa_agent_name: 'Mike QA',
            agent_name: 'Carol Agent',
            project_name: 'Project Gamma',
            task_name: 'Processing',
            file_name: 'batch_003.xlsx',
            total_qc_performed: 18,
            average_qc_score: 92.5,
            total_errors_found: 22,
            audit_status: 'Verified',
            comments: 'Good performance'
          }
        ];

        // Filter by QA Agent if selected
        const filteredData = qaAgentFilter 
          ? mockData.filter(item => item.qa_agent_name === qaAgentFilter)
          : mockData;

        setAuditData(filteredData);
        
        // When API is ready, use:
        // setAuditData(response.data?.data || []);

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
  }, [monthFilter, qaAgentFilter, user]);

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

  // Handle reset filters
  const handleResetFilters = () => {
    setMonthFilter(getCurrentMonth());
    setQaAgentFilter('');
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-2 sm:px-4">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <UserCheck className="w-7 h-7 text-blue-600" />
          QA Agent Audit Report
        </h1>
        <p className="text-sm text-slate-600 mt-1">Monitor and review QA Agent performance and quality checking activities</p>
      </div>

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

          {/* QA Agent Filter */}
          <div className="flex-1 lg:flex-none lg:w-64">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase mb-2">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              QA Agent
            </label>
            <select
              value={qaAgentFilter}
              onChange={(e) => setQaAgentFilter(e.target.value)}
              className="w-full bg-slate-50 border-2 border-blue-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-blue-50 hover:border-blue-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            >
              <option value="">All QA Agents</option>
              {qaAgentList.map((qa) => (
                <option key={qa.id} value={qa.name}>
                  {qa.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-end gap-3 ml-auto">
            <button
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm hover:shadow-md transition-all duration-200 group"
              onClick={handleResetFilters}
              type="button"
            >
              <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
              Reset Filters
            </button>
            
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total QA Performed */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md border border-blue-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 mb-1">Total QCs</p>
              <p className="text-3xl font-bold text-blue-900">
                {auditData.reduce((sum, r) => sum + (Number(r.total_qc_performed) || 0), 0)}
              </p>
            </div>
            <Award className="w-12 h-12 text-blue-600 opacity-50" />
          </div>
        </div>

        {/* Average QC Score */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md border border-green-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700 mb-1">Avg QC Score</p>
              <p className="text-3xl font-bold text-green-900">
                {auditData.length > 0 
                  ? `${(auditData.reduce((sum, r) => sum + (Number(r.average_qc_score) || 0), 0) / auditData.length).toFixed(2)}%`
                  : '-'}
              </p>
            </div>
            <UserCheck className="w-12 h-12 text-green-600 opacity-50" />
          </div>
        </div>

        {/* Total Errors Found */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-md border border-red-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-red-700 mb-1">Total Errors</p>
              <p className="text-3xl font-bold text-red-900">
                {auditData.reduce((sum, r) => sum + (Number(r.total_errors_found) || 0), 0)}
              </p>
            </div>
            <FileSpreadsheet className="w-12 h-12 text-red-600 opacity-50" />
          </div>
        </div>

        {/* Total Audits */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md border border-purple-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-700 mb-1">Total Audits</p>
              <p className="text-3xl font-bold text-purple-900">{auditData.length}</p>
            </div>
            <Filter className="w-12 h-12 text-purple-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Audit Report Table */}
      <div className="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mb-3"></div>
            <p className="text-blue-700 font-semibold">Loading QA Agent Audit data...</p>
          </div>
        ) : error ? (
          <div className="p-6">
            <ErrorMessage message={error} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-blue-100">
              <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Audit Date & Time</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">QA Agent</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Agent Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Task</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">File</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">Total QCs</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">Avg QC Score</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">Total Errors</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Comments</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-blue-50">
                {auditData.length > 0 ? (
                  auditData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 text-gray-900 font-medium whitespace-nowrap">{row.audit_datetime || '-'}</td>
                      <td className="px-6 py-4 text-gray-900 font-semibold">{row.qa_agent_name || '-'}</td>
                      <td className="px-6 py-4 text-gray-900">{row.agent_name || '-'}</td>
                      <td className="px-6 py-4 text-gray-900">{row.project_name || '-'}</td>
                      <td className="px-6 py-4 text-gray-900">{row.task_name || '-'}</td>
                      <td className="px-6 py-4 text-gray-900 text-sm">{row.file_name || '-'}</td>
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
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-lg font-semibold text-sm inline-block ${getAuditStatusBadgeClass(row.audit_status)}`}>
                          {row.audit_status || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{row.comments || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center text-gray-400 text-sm">
                      <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">No audit data available</p>
                      <p className="text-xs mt-1">Try adjusting your filters</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default QAAgentAudit;
