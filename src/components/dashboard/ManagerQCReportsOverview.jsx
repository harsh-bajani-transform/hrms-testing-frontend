/**
 * File: ManagerQCReportsOverview.jsx
 * Description: Manager/Admin comprehensive view of all QC activities and reports
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  Search,
  Download,
  BarChart3,
  Users,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  X,
  AlertTriangle
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const ManagerQCReportsOverview = () => {
  const { user } = useAuth();
  
  // State management
  const [qcRecords, setQcRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorModal, setErrorModal] = useState({ open: false, errors: [], title: '' });
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Fetch QC history data
  useEffect(() => {
    const fetchQCHistory = async () => {
      if (!user?.user_id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await api.post('/qc_history_user/view_qc_history_user_based', {
          logged_in_user_id: user.user_id
        });
        
        if (response.data?.status === 200) {
          const records = response.data.data?.records || [];
          setQcRecords(records);
          setFilteredRecords(records);
        } else {
          setError('Failed to fetch QC history');
        }
      } catch (err) {
        console.error('Error fetching QC history:', err);
        setError(err.response?.data?.message || 'Failed to fetch QC history');
        toast.error('Failed to load QC history');
      } finally {
        setLoading(false);
      }
    };

    fetchQCHistory();
  }, [user?.user_id]);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, agentFilter, teamFilter, dateFilter, qcRecords]);

  const applyFilters = () => {
    let filtered = [...qcRecords];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.team_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.task_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    // Agent filter
    if (agentFilter !== 'all') {
      filtered = filtered.filter(record => record.agent_id?.toString() === agentFilter);
    }

    // Team filter
    if (teamFilter !== 'all') {
      filtered = filtered.filter(record => record.team_name === teamFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(record => {
        if (!record.date_of_file_submission) return false;
        const date = new Date(record.date_of_file_submission);
        
        if (dateFilter === 'today') {
          return date.toDateString() === now.toDateString();
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return date >= weekAgo;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return date >= monthAgo;
        }
        return true;
      });
    }

    setFilteredRecords(filtered);
  };

  const getStatusBadge = (record) => {
    const status = record.status;

    if (status === 'regular') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border-2 border-green-300">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Passed
        </span>
      );
    } else if (status === 'correction') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border-2 border-yellow-300">
          <AlertCircle className="w-3.5 h-3.5" />
          Correction
        </span>
      );
    } else if (status === 'rework') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border-2 border-red-300">
          <XCircle className="w-3.5 h-3.5" />
          Rework
        </span>
      );
    }
    return null;
  };

  const getQCStatusBadge = (qcStatus) => {
    if (qcStatus === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border-2 border-blue-300">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Completed
        </span>
      );
    } else if (qcStatus === 'correction') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border-2 border-yellow-300">
          <AlertCircle className="w-3.5 h-3.5" />
          Correction
        </span>
      );
    } else if (qcStatus === 'rework') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border-2 border-red-300">
          <XCircle className="w-3.5 h-3.5" />
          Rework
        </span>
      );
    } else if (qcStatus === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border-2 border-orange-300">
          <Clock className="w-3.5 h-3.5" />
          Pending
        </span>
      );
    }
    return <span className="text-xs text-slate-400">—</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const parseErrors = (errorString) => {
    try {
      if (!errorString) return [];
      return typeof errorString === 'string' ? JSON.parse(errorString) : errorString;
    } catch {
      return [];
    }
  };

  const openErrorModal = (errors, title) => {
    setErrorModal({ open: true, errors: parseErrors(errors), title });
  };

  // Get unique agents and teams for filters
  const uniqueAgents = [...new Map(qcRecords.map(r => [r.agent_id, { id: r.agent_id, name: r.agent_name }])).values()];
  const uniqueTeams = [...new Set(qcRecords.map(r => r.team_name).filter(Boolean))];

  const handleReset = () => {
    setFilteredRecords(qcRecords);
    setSearchTerm('');
    setStatusFilter('all');
    setAgentFilter('all');
    setTeamFilter('all');
    setDateFilter('all');
    setSelectedRecord(null);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <ErrorMessage message={error} />
      </div>
    );
  }



  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8" />
              QC Reports Overview
            </h1>
            <p className="text-blue-100 mt-2">Complete view of all QC activities across the organization</p>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-white hover:bg-blue-50 text-blue-600 font-bold rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 border-2 border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search agent, team, project, task..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border-2 border-slate-300 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none font-medium"
          >
            <option value="all">All Status</option>
            <option value="regular">Passed</option>
            <option value="correction">Correction</option>
            <option value="rework">Rework</option>
          </select>

          {/* Agent Filter */}
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="px-4 py-2.5 border-2 border-slate-300  rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none font-medium"
          >
            <option value="all">All Agents</option>
            {uniqueAgents.map(agent => (
              <option key={agent.id} value={agent.id}>{agent.name}</option>
            ))}
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2.5 border-2 border-slate-300 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none font-medium"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>

        {/* Team Filter - Second Row */}
        <div className="mt-4">
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="w-full md:w-auto px-4 py-2.5 border-2 border-slate-300 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none font-medium"
          >
            <option value="all">All Teams</option>
            {uniqueTeams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
        </div>
      </div>

      {/* QC Records Table */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 overflow-hidden">
        <div className="overflow-x-auto" style={{overflowY: 'visible'}}>
          <div className="min-w-max">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase">Agent</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase">Team</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase">QA Agent</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase">Project/Task</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase">Score</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase">QC Status</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase">Status</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase">Submission Date</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase">Records</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase">File</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase">History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="px-4 py-12 text-center text-slate-500">
                      <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="font-bold">No QC records found</p>
                      <p className="text-sm">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <React.Fragment key={record.id}>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <span className="font-semibold text-slate-800 text-sm">{record.agent_name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                            <Users className="w-3 h-3" />
                            {record.team_name || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
                            <User className="w-3 h-3" />
                            {record.qa_agent_name || record.qa_user_name || record.qa_name || `QA #${record.qa_user_id}` || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm">
                            <p className="font-bold text-slate-800">{record.project_name || 'N/A'}</p>
                            <p className="text-slate-600 text-xs">{record.task_name || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg font-bold text-sm ${
                            record.qc_score === 100
                              ? 'bg-green-100 text-green-700 border-2 border-green-300'
                              : record.qc_score >= 98
                              ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                              : 'bg-red-100 text-red-700 border-2 border-red-300'
                          }`}>
                            {record.qc_score}%
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {getQCStatusBadge(record.qc_status)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {getStatusBadge(record)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(record.date_of_file_submission)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-xs">
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-medium text-slate-600">Total:</span>
                              <span className="font-bold text-slate-800">{record.file_record_count}</span>
                            </div>
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-medium text-slate-600">QC:</span>
                              <span className="font-bold text-blue-600">{record.qc_generated_count}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {record.whole_file_path ? (
                            <a
                              href={record.whole_file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
                            >
                              <Download className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {(record.qc_rework?.length > 0 || record.qc_correction?.length > 0) && (
                            <button
                              onClick={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}
                              className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                            >
                              {selectedRecord?.id === record.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          )}
                        </td>
                      </tr>
                      {selectedRecord?.id === record.id && (
                        <tr>
                          <td colSpan="11" className="p-0">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t-2 border-blue-200">
                              <div className="p-6">
                                <h4 className="text-sm font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                  <Clock className="w-5 h-5" />
                                  QC History Details
                                </h4>
                                
                                {/* Rework History */}
                                {record.qc_rework && record.qc_rework.length > 0 && (
                                  <div className="mb-6">
                                    <h5 className="text-xs font-bold text-red-700 mb-3 uppercase">Rework History</h5>
                                    <div className="bg-white rounded-lg shadow-md border-2 border-red-200 overflow-hidden">
                                      <table className="w-full text-xs">
                                        <thead className="bg-gradient-to-r from-red-600 to-red-700 text-white">
                                          <tr>
                                            <th className="px-3 py-2 text-left font-bold uppercase">Type</th>
                                            <th className="px-3 py-2 text-center font-bold uppercase">Attempt</th>
                                            <th className="px-3 py-2 text-left font-bold uppercase">Date & Time</th>
                                            <th className="px-3 py-2 text-center font-bold uppercase">Status</th>
                                            <th className="px-3 py-2 text-center font-bold uppercase">Score</th>
                                            <th className="px-3 py-2 text-center font-bold uppercase">Errors</th>
                                            <th className="px-3 py-2 text-center font-bold uppercase">File</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-red-100">
                                          {record.qc_rework.map((rework, idx) => {
                                            const errors = parseErrors(rework.rework_error_list);
                                            return (
                                              <tr key={idx} className="hover:bg-red-50 transition-colors">
                                                <td className="px-3 py-3">
                                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 font-bold text-xs">
                                                    <XCircle className="w-3 h-3" />
                                                    Rework
                                                  </span>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                  <span className="font-bold text-red-700">{rework.rework_count || idx + 1}</span>
                                                </td>
                                                <td className="px-3 py-3 text-slate-700">
                                                  {formatDate(rework.updated_at)}
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-100 text-orange-700 font-medium text-xs border border-orange-200">
                                                    {rework.rework_file_qc_status || rework.rework_status || 'Pending'}
                                                  </span>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                  {rework.rework_qc_score != null ? (
                                                    <span className="font-bold text-slate-800">{rework.rework_qc_score}%</span>
                                                  ) : (
                                                    <span className="text-slate-400">—</span>
                                                  )}
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                  {errors.length > 0 ? (
                                                    <button
                                                      onClick={() => openErrorModal(rework.rework_error_list, `Rework #${rework.rework_count || idx + 1} - Errors`)}
                                                      className="relative inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-colors"
                                                    >
                                                      View
                                                      <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-rose-700 text-white text-xs font-bold">
                                                        {errors.length}
                                                      </span>
                                                    </button>
                                                  ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-50 text-green-600 text-xs font-medium">
                                                      <CheckCircle2 className="w-3 h-3" /> None
                                                    </span>
                                                  )}
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                  {rework.rework_file_path ? (
                                                    <a
                                                      href={rework.rework_file_path}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
                                                    >
                                                      <Download className="w-3 h-3" />
                                                      Download
                                                    </a>
                                                  ) : (
                                                    <span className="text-slate-400 text-xs">—</span>
                                                  )}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}

                                {/* Correction History */}
                                {record.qc_correction && record.qc_correction.length > 0 && (
                                  <div>
                                    <h5 className="text-xs font-bold text-yellow-700 mb-3 uppercase">Correction History</h5>
                                    <div className="bg-white rounded-lg shadow-md border-2 border-yellow-200 overflow-hidden">
                                      <table className="w-full text-xs">
                                        <thead className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white">
                                          <tr>
                                            <th className="px-3 py-2 text-left font-bold uppercase">Type</th>
                                            <th className="px-3 py-2 text-center font-bold uppercase">Attempt</th>
                                            <th className="px-3 py-2 text-left font-bold uppercase">Date & Time</th>
                                            <th className="px-3 py-2 text-center font-bold uppercase">Status</th>
                                            <th className="px-3 py-2 text-center font-bold uppercase">Score</th>
                                            <th className="px-3 py-2 text-center font-bold uppercase">Errors</th>
                                            <th className="px-3 py-2 text-center font-bold uppercase">File</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-yellow-100">
                                          {record.qc_correction.map((correction, idx) => {
                                            const errors = parseErrors(correction.correction_error_list);
                                            return (
                                              <tr key={idx} className="hover:bg-yellow-50 transition-colors">
                                                <td className="px-3 py-3">
                                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-100 text-yellow-700 font-bold text-xs">
                                                    <AlertCircle className="w-3 h-3" />
                                                    Correction
                                                  </span>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                  <span className="font-bold text-yellow-700">{correction.correction_count || idx + 1}</span>
                                                </td>
                                                <td className="px-3 py-3 text-slate-700">
                                                  {formatDate(correction.updated_at)}
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-100 text-orange-700 font-medium text-xs border border-orange-200">
                                                    {correction.correction_file_qc_status || correction.correction_status || 'Pending'}
                                                  </span>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                  <span className="text-slate-400">—</span>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                  {errors.length > 0 ? (
                                                    <button
                                                      onClick={() => openErrorModal(correction.correction_error_list, `Correction #${correction.correction_count || idx + 1} - Errors`)}
                                                      className="relative inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-colors"
                                                    >
                                                      View
                                                      <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-rose-700 text-white text-xs font-bold">
                                                        {errors.length}
                                                      </span>
                                                    </button>
                                                  ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-50 text-green-600 text-xs font-medium">
                                                      <CheckCircle2 className="w-3 h-3" /> None
                                                    </span>
                                                  )}
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                  {correction.correction_file_path ? (
                                                    <a
                                                      href={correction.correction_file_path}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium transition-colors"
                                                    >
                                                      <Download className="w-3 h-3" />
                                                      Download
                                                    </a>
                                                  ) : (
                                                    <span className="text-slate-400 text-xs">—</span>
                                                  )}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {errorModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setErrorModal({ open: false, errors: [], title: '' })}></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{errorModal.title}</h3>
                  <p className="text-blue-100 text-sm">{errorModal.errors.length} error{errorModal.errors.length !== 1 ? 's' : ''} found</p>
                </div>
              </div>
              <button
                onClick={() => setErrorModal({ open: false, errors: [], title: '' })}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {errorModal.errors.map((err, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                    <span className="shrink-0 w-8 h-8 rounded-full bg-rose-400 text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-rose-400 text-white text-xs font-semibold rounded">Row {err.row}</span>
                        {err.points && <span className="px-2 py-0.5 bg-slate-500 text-white text-xs font-semibold rounded">-{err.points} pts</span>}
                      </div>
                      <p className="text-sm text-rose-700 font-medium">{err.error || `${err.category}${err.subcategory ? ` - ${err.subcategory}` : ''}`}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setErrorModal({ open: false, errors: [], title: '' })}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerQCReportsOverview;
