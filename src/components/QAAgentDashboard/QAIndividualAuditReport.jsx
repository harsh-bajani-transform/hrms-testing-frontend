/**
 * File: QAIndividualAuditReport.jsx
 * Author: Naitik Maisuriya
 * Description: Individual QA Agent Audit Report showing only the logged-in QA agent's audit entries
 */
import React, { useState, useEffect } from 'react';
import { 
  FileCheck,
  Download,
  Search,
  Users,
  Award,
  FileText,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import ErrorMessage from '../common/ErrorMessage';
import { DateRangePicker } from '../common/CustomCalendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const QAIndividualAuditReport = () => {
  const { user } = useAuth();

  // Helper function to get QC score color classes
  const getQCScoreColorClass = (score) => {
    if (score === null || score === undefined || score === '-' || isNaN(Number(score))) return 'text-slate-600 bg-slate-100';
    const numScore = Number(score);
    if (numScore >= 95) return 'text-green-700 bg-green-200 font-bold';
    if (numScore >= 80) return 'text-yellow-700 bg-yellow-200 font-bold';
    return 'text-red-700 bg-red-200 font-bold';
  };

  // Helper function to get audit status badge classes
  const getAuditStatusBadgeClass = (status) => {
    if (!status) return 'bg-slate-100 text-slate-700';
    const statusLower = status.toLowerCase();
    if (statusLower === 'approved' || statusLower === 'verified') return 'bg-green-100 text-green-700 font-bold';
    if (statusLower === 'pending') return 'bg-yellow-100 text-yellow-700 font-bold';
    if (statusLower === 'rejected') return 'bg-red-100 text-red-700 font-bold';
    return 'bg-slate-100 text-slate-700';
  };

  // Helper function to format date and time
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString || dateTimeString === '-') return { date: '-', time: '-' };
    
    try {
      const date = new Date(dateTimeString);
      const day = date.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;
      
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const formattedTime = `${hours}:${minutes} ${ampm}`;
      
      return { date: formattedDate, time: formattedTime };
    } catch (_error) {
      return { date: dateTimeString, time: '' };
    }
  };

  // Helper function to handle file download
  const handleFileDownload = (fileName, _fileUrl) => {
    if (!fileName) {
      toast.error('No file available for download');
      return;
    }
    
    // TODO: Replace with actual file download logic when API is ready
    toast.success(`Downloading ${fileName}...`);
  };

  // Helper function to get current month in MonthYearPicker format
  const getCurrentMonth = () => {
    const now = new Date();
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${monthNames[now.getMonth()]}${now.getFullYear()}`;
  };

  // State management
  const [monthFilter, setMonthFilter] = useState(() => getCurrentMonth());
  const [auditData, setAuditData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  // Get unique agent names from records
  const uniqueAgents = React.useMemo(() => {
    const agents = new Set();
    auditData.forEach(record => {
      if (record.agent_name) agents.add(record.agent_name);
    });
    return Array.from(agents);
  }, [auditData]);

  // Filter records based on filters
  const filteredRecords = React.useMemo(() => {
    let filtered = auditData;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(record =>
        (record.agent_name || '').toLowerCase().includes(query) ||
        (record.project_name || '').toLowerCase().includes(query) ||
        (record.task_name || '').toLowerCase().includes(query)
      );
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date_time);
        return recordDate >= new Date(startDate);
      });
    }

    if (endDate) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date_time);
        return recordDate <= new Date(endDate);
      });
    }

    return filtered;
  }, [auditData, searchQuery, startDate, endDate]);

  // Clear all filters including month
  const resetAllFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setMonthFilter(getCurrentMonth());
  };

  // Handle month selection
  const handleMonthSelect = (month, year) => {
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthYear = `${monthNames[month]}${year}`;
    setMonthFilter(monthYear);
    setShowMonthPicker(false);
  };

  // Fetch audit data
  useEffect(() => {
    const fetchAuditData = async () => {
      try {
        setLoading(true);
        setError(null);

        // TODO: Replace with actual API call to fetch individual QA agent audit data
        // The API should filter by logged-in user (QA agent)
        
        // Mock data for now
        const mockData = [
          {
            audit_id: 1,
            agent_name: 'John Doe',
            project_name: 'Project Alpha',
            task_name: 'Data Entry',
            date_time: '2026-03-08T10:30:00',
            total_qcs: 10,
            avg_qc_score: 95,
            total_errors: 2,
            file_name: 'report_2026_03_08.xlsx',
            file_url: '#',
            error_notes: 'Minor formatting issues',
            status: 'Approved',
            comments: 'Good work overall'
          },
          {
            audit_id: 2,
            agent_name: 'Jane Smith',
            project_name: 'Project Beta',
            task_name: 'Quality Check',
            date_time: '2026-03-07T14:15:00',
            total_qcs: 15,
            avg_qc_score: 88,
            total_errors: 5,
            file_name: 'qc_report_2026_03_07.xlsx',
            file_url: '#',
            error_notes: 'Some data validation errors',
            status: 'Pending',
            comments: 'Needs review'
          },
          {
            audit_id: 3,
            agent_name: 'John Doe',
            project_name: 'Project Gamma',
            task_name: 'Audit Review',
            date_time: '2026-03-06T09:00:00',
            total_qcs: 8,
            avg_qc_score: 78,
            total_errors: 12,
            file_name: 'audit_2026_03_06.xlsx',
            file_url: '#',
            error_notes: 'Multiple errors found',
            status: 'Rejected',
            comments: 'Requires improvement'
          }
        ];

        setAuditData(mockData);
        toast.success('Audit data loaded successfully');
      } catch (err) {
        console.error('[QAIndividualAuditReport] Error fetching audit data:', err);
        setError('Failed to load audit data. Please try again.');
        toast.error('Failed to load audit data');
      } finally {
        setLoading(false);
      }
    };

    fetchAuditData();
  }, [monthFilter, user]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <FileCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight cursor-default">My Audit Report</h2>
            <p className="text-slate-600 text-sm font-medium mt-1 cursor-default">View your individual audit entries and performance</p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-md border-2 border-blue-100 p-6">
        {/* All Filters in One Row */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 mb-4">
          {/* Month Filter */}
          <div className="lg:max-w-[220px]">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase mb-2">
              Month Filter
            </label>
            <Popover open={showMonthPicker} onOpenChange={setShowMonthPicker}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "w-full bg-slate-50 border-2 border-blue-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:border-blue-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-left flex items-center justify-between"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-blue-600" />
                    {monthFilter || 'Select Month/Year'}
                  </span>
                  <ChevronRight className={cn("w-4 h-4 transition-transform", showMonthPicker && "rotate-90")} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[340px] border-2 border-blue-200 bg-white" align="start">
                {/* Year Navigation */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-blue-100 gap-2">
                  <button
                    type="button"
                    onClick={() => setCalendarYear(calendarYear - 1)}
                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                    title="Previous Year"
                  >
                    <ChevronLeft className="w-5 h-5 text-blue-600" />
                  </button>
                  
                  <select
                    value={calendarYear}
                    onChange={(e) => setCalendarYear(parseInt(e.target.value))}
                    className="flex-1 px-3 py-1.5 text-base font-bold text-slate-800 bg-slate-50 border-2 border-blue-200 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer text-center"
                  >
                    {Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i).map((y) => (
                      <option key={y} value={y} disabled={y > new Date().getFullYear()}>
                        {y}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    type="button"
                    onClick={() => setCalendarYear(calendarYear + 1)}
                    disabled={calendarYear >= new Date().getFullYear()}
                    className={cn(
                      "p-2 rounded-lg transition-colors shrink-0",
                      calendarYear >= new Date().getFullYear()
                        ? "opacity-50 cursor-not-allowed bg-slate-100"
                        : "hover:bg-blue-50"
                    )}
                    title={calendarYear >= new Date().getFullYear() ? "Cannot select future dates" : "Next Year"}
                  >
                    <ChevronRight className="w-5 h-5 text-blue-600" />
                  </button>
                </div>

                {/* Months Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map((month, index) => {
                    const monthYear = `${month}${calendarYear}`;
                    const isSelected = monthFilter === monthYear;
                    const now = new Date();
                    const currentMonthYear = `${['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][now.getMonth()]}${now.getFullYear()}`;
                    const isCurrentMonth = monthYear === currentMonthYear;
                    const isFutureMonth = calendarYear > now.getFullYear() || (calendarYear === now.getFullYear() && index > now.getMonth());
                    
                    return (
                      <button
                        key={month}
                        type="button"
                        onClick={() => !isFutureMonth && handleMonthSelect(index, calendarYear)}
                        disabled={isFutureMonth}
                        className={cn(
                          "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                          isFutureMonth
                            ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                            : isSelected 
                              ? 'bg-blue-600 text-white shadow-md' 
                              : isCurrentMonth
                                ? 'bg-blue-100 text-blue-700 border-2 border-blue-300 hover:bg-blue-200'
                                : 'bg-blue-50 text-slate-700 hover:bg-blue-100 border-2 border-blue-200'
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

          {/* Search Filter */}
          <div className="lg:col-span-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase mb-2">
              <Search className="w-3.5 h-3.5 text-blue-600" />
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by agent, project, or task..."
              className="w-full bg-slate-50 border-2 border-blue-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-blue-50 hover:border-blue-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>

          {/* Date Range Filter */}
          <div className="lg:col-span-2">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              showClearButton={false}
              noWrapper={true}
              fieldWidth={null}
            />
          </div>

          {/* Reset Filter Button */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase mb-2 opacity-0">
              Action
            </label>
            <button
              type="button"
              onClick={resetAllFilters}
              className="w-full h-[42px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg px-4 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
            >
              <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mb-3"></div>
            <p className="text-blue-700 font-semibold">Loading audit data...</p>
          </div>
        ) : error ? (
          <div className="p-6">
            <ErrorMessage message={error} />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <FileCheck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-400 font-medium text-lg">No audit records found</p>
            <p className="text-gray-400 text-sm mt-2">
              {searchQuery || startDate || endDate
                ? 'Try adjusting your filters'
                : 'No audit data available for this period'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Audit Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Agent Name</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Task</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Total QCs</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Avg QC Score</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Total Errors</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">QC Checked File</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Error Notes</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRecords.map((record, index) => {
                  const { date, time } = formatDateTime(record.date_time);
                  return (
                    <tr key={record.audit_id || index} className="hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800">{date}</span>
                          <span className="text-xs text-slate-600">{time}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-blue-700">{record.agent_name || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-slate-700">{record.project_name || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-slate-700">{record.task_name || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-slate-800">{record.total_qcs || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${getQCScoreColorClass(record.avg_qc_score)}`}>
                          {record.avg_qc_score !== null && record.avg_qc_score !== undefined ? `${record.avg_qc_score}%` : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-red-700">{record.total_errors || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        {record.file_name ? (
                          <button
                            onClick={() => handleFileDownload(record.file_name, record.file_url)}
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-semibold transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold uppercase ${getAuditStatusBadgeClass(record.status)}`}>
                          {record.status || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-600">{record.error_notes || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-600">{record.comments || '-'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {!loading && !error && filteredRecords.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-blue-100 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase">Total Records</p>
                  <p className="text-2xl font-bold text-slate-800">{filteredRecords.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase">Average Score</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {(filteredRecords.reduce((sum, r) => sum + (r.avg_qc_score || 0), 0) / filteredRecords.length).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase">Pending</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {filteredRecords.filter(r => r.status?.toLowerCase() === 'pending').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase">Agents</p>
                  <p className="text-2xl font-bold text-slate-800">{uniqueAgents.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QAIndividualAuditReport;
