/**
 * File: AgentQCReport.jsx
 * Author: Naitik Maisuriya
 * Description: QC Report component for Agent Dashboard
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
  Award,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '../../lib/utils';
import { getFriendlyErrorMessage } from '../../utils/errorMessages';
import ErrorMessage from '../common/ErrorMessage';

const AgentQCReport = () => {
  const { user } = useAuth();

  // Helper function to get QC score color classes
  const getQCScoreColorClass = (score) => {
    if (score === null || score === undefined || score === '-' || isNaN(Number(score))) return 'text-slate-700';
    const numScore = Number(score);
    if (numScore >= 95) return 'text-green-800 bg-green-100 font-bold';
    if (numScore >= 80) return 'text-yellow-700 bg-yellow-100 font-bold';
    return 'text-red-700 bg-red-200 font-bold';
  };

  // Helper function to get status badge classes
  const getStatusBadgeClass = (status) => {
    if (!status) return 'bg-slate-100 text-slate-700';
    const statusLower = status.toLowerCase();
    if (statusLower === 'regular' || statusLower === 'approved') return 'bg-green-100 text-green-800';
    if (statusLower === 'rework') return 'bg-yellow-100 text-yellow-800';
    if (statusLower === 'correction') return 'bg-red-100 text-red-800';
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
  const [qcData, setQcData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch QC report data
  useEffect(() => {
    const fetchQCData = async () => {
      setLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual API endpoint when backend is ready
        const payload = {
          logged_in_user_id: user?.user_id,
          month_year: monthFilter
        };

        console.log('[AgentQCReport] Fetching QC data:', payload);

        // Placeholder API call - replace with actual endpoint
        // const response = await axios.post('/python/qc/report', payload);
        
        // Mock data for now
        const mockData = [
          {
            qc_id: 1,
            evaluation_datetime: '2024-03-01 10:30:25',
            qa_agent: 'John QA',
            project_task: 'Project Alpha / Data Entry',
            file_name: 'data_batch_001.xlsx',
            total_records: 100,
            error_count: 2,
            error_list: 'Spelling errors (2)',
            status: 'Regular',
            qc_score: 98.5
          },
          {
            qc_id: 2,
            evaluation_datetime: '2024-03-02 14:15:10',
            qa_agent: 'Jane QA',
            project_task: 'Project Beta / Data Validation',
            file_name: 'validation_002.xlsx',
            total_records: 100,
            error_count: 8,
            error_list: 'Format issues (5), Missing data (3)',
            status: 'Rework',
            qc_score: 92.0
          },
          {
            qc_id: 3,
            evaluation_datetime: '2024-03-03 09:45:00',
            qa_agent: 'Mike QA',
            project_task: 'Project Gamma / Data Processing',
            file_name: 'process_003.xlsx',
            total_records: 100,
            error_count: 24,
            error_list: 'Validation errors (15), Logic errors (9)',
            status: 'Correction',
            qc_score: 75.5
          }
        ];

        setQcData(mockData);
        
        // When API is ready, use:
        // setQcData(response.data?.data || []);

      } catch (err) {
        console.error('[AgentQCReport] Error fetching QC data:', err);
        const msg = getFriendlyErrorMessage(err);
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    if (user?.user_id) {
      fetchQCData();
    }
  }, [monthFilter, user]);

  // Export to Excel
  const handleExportExcel = () => {
    try {
      if (qcData.length === 0) {
        toast.error('No data to export');
        return;
      }

      const exportData = qcData.map(row => ({
        'Evaluation Date & Time': row.evaluation_datetime || '-',
        'QA Agent': row.qa_agent || '-',
        'Project/Task': row.project_task || '-',
        'File': row.file_name || '-',
        'Total Records': row.total_records || 0,
        'Errors': row.error_count || 0,
        'Error List': row.error_list || '-',
        'Status': row.status || '-',
        'QC Score': row.qc_score != null ? `${row.qc_score}%` : '-'
      }));

      // Calculate summary
      const avgScore = qcData.reduce((sum, r) => sum + (Number(r.qc_score) || 0), 0) / qcData.length;
      const totalErrors = qcData.reduce((sum, r) => sum + (Number(r.error_count) || 0), 0);

      exportData.push({
        'Evaluation Date & Time': 'SUMMARY',
        'QA Agent': '',
        'Project/Task': '',
        'File': '',
        'Total Records': qcData.reduce((sum, r) => sum + (Number(r.total_records) || 0), 0),
        'Errors': totalErrors,
        'Error List': '',
        'Status': '',
        'QC Score': `${avgScore.toFixed(2)}%`
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet['!cols'] = [
        { wch: 20 },  // Evaluation Date & Time
        { wch: 15 },  // QA Agent
        { wch: 30 },  // Project/Task
        { wch: 25 },  // File
        { wch: 14 },  // Total Records
        { wch: 10 },  // Errors
        { wch: 35 },  // Error List
        { wch: 12 },  // Status
        { wch: 12 }   // QC Score
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'QC Report');
      const filename = `QC_Report_${monthFilter}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success('QC report exported!');
    } catch (err) {
      const msg = getFriendlyErrorMessage(err);
      toast.error(msg);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-2 sm:px-4">
      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-md border border-blue-100 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          {/* Month Filter */}
          <div className="flex-1 sm:flex-none sm:w-64">
            <MonthPicker
              value={monthFilter}
              onChange={setMonthFilter}
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-end gap-3">
            <button
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm hover:shadow-md transition-all duration-200 group"
              onClick={() => setMonthFilter(getCurrentMonth())}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Average QC Score Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md border border-blue-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 mb-1">Average QC Score</p>
              <p className="text-3xl font-bold text-blue-900">
                {qcData.length > 0 
                  ? `${(qcData.reduce((sum, r) => sum + (Number(r.qc_score) || 0), 0) / qcData.length).toFixed(2)}%`
                  : '-'}
              </p>
            </div>
            <Award className="w-12 h-12 text-blue-600 opacity-50" />
          </div>
        </div>

        {/* Total Submissions Card */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md border border-green-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700 mb-1">Total Submissions</p>
              <p className="text-3xl font-bold text-green-900">{qcData.length}</p>
            </div>
            <FileSpreadsheet className="w-12 h-12 text-green-600 opacity-50" />
          </div>
        </div>

        {/* Total Errors Card */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-md border border-red-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-red-700 mb-1">Total Errors</p>
              <p className="text-3xl font-bold text-red-900">
                {qcData.reduce((sum, r) => sum + (Number(r.error_count) || 0), 0)}
              </p>
            </div>
            <AlertCircle className="w-12 h-12 text-red-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* QC Report Table */}
      <div className="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mb-3"></div>
            <p className="text-blue-700 font-semibold">Loading QC report...</p>
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
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Evaluation Date & Time</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">QA Agent</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Project/Task</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">File</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">Total Records</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">Errors</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Error List</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">QC Score</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-blue-50">
                {qcData.length > 0 ? (
                  qcData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 text-gray-900 font-medium whitespace-nowrap">{row.evaluation_datetime || '-'}</td>
                      <td className="px-6 py-4 text-gray-900">{row.qa_agent || '-'}</td>
                      <td className="px-6 py-4 text-gray-900">{row.project_task || '-'}</td>
                      <td className="px-6 py-4 text-gray-900 text-sm">{row.file_name || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-gray-900">
                          {row.total_records || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-red-600">
                          {row.error_count || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{row.error_list || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-lg font-semibold text-sm inline-block ${getStatusBadgeClass(row.status)}`}>
                          {row.status || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-lg inline-block ${getQCScoreColorClass(row.qc_score)}`}>
                          {row.qc_score != null ? `${Number(row.qc_score).toFixed(2)}%` : '-'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-400 text-sm">
                      <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">No QC data available</p>
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

export default AgentQCReport;
