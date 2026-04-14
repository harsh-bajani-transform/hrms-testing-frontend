/**
 * File: SuperAdminApproval.jsx
 * Author: Naitik Maisuriya
 * Description: Super Admin Roster Approval Dashboard
 */

import React, { useState, useEffect } from "react";
import {
  Shield,
  Check,
  XCircle,
  Calendar,
  Users,
  Clock,
  Eye,
  Download,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  FileText,
  Mail,
  Square,
  CheckSquare
} from "lucide-react";
import { toast } from "react-hot-toast";
import { format, subMonths, addMonths } from "date-fns";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const SuperAdminApproval = () => {
  const { user } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [approvedRosters, setApprovedRosters] = useState([]);
  const [rejectedRosters, setRejectedRosters] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending'); // 'pending', 'approved', 'rejected', 'all'
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [bulkSelectionMode, setBulkSelectionMode] = useState(false);

  // Dummy data
  const dummyPendingApprovals = [
    {
      id: 1,
      employee_name: "John Smith",
      team: "Development Team",
      month: "April 2026",
      submitted_by: "Assistant Manager - Sarah Wilson",
      submitted_date: "2026-04-10",
      changes_count: 5,
      status: "pending",
      roster_data: {
        monday: { status: 'present_office', hours: 8 },
        tuesday: { status: 'present_wfh', hours: 8 },
        wednesday: { status: 'present_office', hours: 8 },
        thursday: { status: 'present_office', hours: 8 },
        friday: { status: 'present_office', hours: 8 },
        saturday: { status: 'week_off', hours: 0 },
        sunday: { status: 'week_off', hours: 0 },
      },
      notes: "Updated WFH days for better team collaboration"
    },
    {
      id: 2,
      employee_name: "Sarah Johnson",
      team: "Development Team",
      month: "April 2026",
      submitted_by: "Assistant Manager - Sarah Wilson",
      submitted_date: "2026-04-10",
      changes_count: 3,
      status: "pending",
      roster_data: {
        monday: { status: 'present_wfh', hours: 8 },
        tuesday: { status: 'present_wfh', hours: 8 },
        wednesday: { status: 'leave_planned', hours: 0 },
        thursday: { status: 'present_wfh', hours: 8 },
        friday: { status: 'present_wfh', hours: 8 },
        saturday: { status: 'week_off', hours: 0 },
        sunday: { status: 'week_off', hours: 0 },
      },
      notes: "Planned leave on Wednesday for personal appointment"
    },
    {
      id: 3,
      employee_name: "Mike Wilson",
      team: "QA Team",
      month: "April 2026",
      submitted_by: "Assistant Manager - Sarah Wilson",
      submitted_date: "2026-04-09",
      changes_count: 2,
      status: "pending",
      roster_data: {
        monday: { status: 'present_office', hours: 8 },
        tuesday: { status: 'half_day_first', hours: 4 },
        wednesday: { status: 'present_office', hours: 8 },
        thursday: { status: 'present_office', hours: 8 },
        friday: { status: 'present_office', hours: 8 },
        saturday: { status: 'week_off', hours: 0 },
        sunday: { status: 'week_off', hours: 0 },
      },
      notes: "Half day on Tuesday for medical appointment"
    },
    {
      id: 4,
      employee_name: "Emily Davis",
      team: "Operations Team",
      month: "April 2026",
      submitted_by: "Assistant Manager - Sarah Wilson",
      submitted_date: "2026-04-09",
      changes_count: 8,
      status: "pending",
      roster_data: {
        monday: { status: 'present_office', hours: 8 },
        tuesday: { status: 'present_office', hours: 8 },
        wednesday: { status: 'holiday', hours: 0 },
        thursday: { status: 'present_office', hours: 8 },
        friday: { status: 'present_office', hours: 8 },
        saturday: { status: 'week_off', hours: 0 },
        sunday: { status: 'week_off', hours: 0 },
      },
      notes: "Updated schedule for project deadline requirements"
    },
  ];

  const dummyApprovedRosters = [
    {
      id: 101,
      employee_name: "Robert Brown",
      team: "Development Team",
      month: "April 2026",
      submitted_by: "Assistant Manager - Sarah Wilson",
      submitted_date: "2026-04-08",
      approved_date: "2026-04-08",
      approved_by: "Super Admin - John Doe",
      changes_count: 4,
      status: "approved"
    },
    {
      id: 102,
      employee_name: "Lisa Anderson",
      team: "QA Team",
      month: "April 2026",
      submitted_by: "Assistant Manager - Sarah Wilson",
      submitted_date: "2026-04-07",
      approved_date: "2026-04-07",
      approved_by: "Super Admin - John Doe",
      changes_count: 2,
      status: "approved"
    },
  ];

  const dummyRejectedRosters = [
    {
      id: 201,
      employee_name: "David Martinez",
      team: "Operations Team",
      month: "April 2026",
      submitted_by: "Assistant Manager - Sarah Wilson",
      submitted_date: "2026-04-06",
      rejected_date: "2026-04-06",
      rejected_by: "Super Admin - John Doe",
      changes_count: 6,
      status: "rejected",
      rejection_reason: "Insufficient coverage for critical operations"
    },
  ];

  // Filter data based on status and search
  const getFilteredData = () => {
    let data = [];
    
    switch (filterStatus) {
      case 'pending':
        data = pendingApprovals;
        break;
      case 'approved':
        data = approvedRosters;
        break;
      case 'rejected':
        data = rejectedRosters;
        break;
      default:
        data = pendingApprovals;
    }

    if (searchTerm) {
      data = data.filter(item => 
        item.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.submitted_by.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return data;
  };

  // Approval actions
  const handleApprove = async (id) => {
    try {
      setLoading(true);
      console.log('Calling Roster Approve API for draft_id:', id);
      
      // Call real API
      const response = await api.post('/roster/approve', { draft_id: id });
      
      if (response.data && response.data.status === 200) {
        // Move from pending to approved
        const approval = pendingApprovals.find(item => item.id === id);
        if (approval) {
          setPendingApprovals(prev => prev.filter(item => item.id !== id));
          setApprovedRosters(prev => [{
            ...approval,
            approved_date: format(new Date(), 'yyyy-MM-dd'),
            approved_by: user?.user_name || 'Super Admin'
          }, ...prev]);
        }
        
        toast.success(response.data.message || 'Roster approved successfully!');
        setShowDetailsModal(false);
      } else {
        toast.error(response.data?.message || 'Failed to approve roster');
      }
    } catch (error) {
      console.error('Error approving roster:', error);
      toast.error(error.response?.data?.message || 'Failed to approve roster');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id, reason = '') => {
    try {
      setLoading(true);
      console.log('Calling Roster Reject API for draft_id:', id);
      
      // Call real API
      const response = await api.post('/roster/reject', { draft_id: id });
      
      if (response.data && response.data.status === 200) {
        // Move from pending to rejected
        const approval = pendingApprovals.find(item => item.id === id);
        if (approval) {
          setPendingApprovals(prev => prev.filter(item => item.id !== id));
          setRejectedRosters(prev => [{
            ...approval,
            rejected_date: format(new Date(), 'yyyy-MM-dd'),
            rejected_by: user?.user_name || 'Super Admin',
            rejection_reason: reason || 'Rejected by admin'
          }, ...prev]);
        }
        
        toast.success(response.data.message || 'Roster rejected successfully!');
        setShowDetailsModal(false);
      } else {
        toast.error(response.data?.message || 'Failed to reject roster');
      }
    } catch (error) {
      console.error('Error rejecting roster:', error);
      toast.error(error.response?.data?.message || 'Failed to reject roster');
    } finally {
      setLoading(false);
    }
  };

  // View details
  const handleViewDetails = (approval) => {
    setSelectedApproval(approval);
    setShowDetailsModal(true);
  };

  // Bulk selection handlers
  const handleToggleSelection = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredData.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredData.filter(item => item.status === 'pending').map(item => item.id));
    }
  };

  // Bulk approval/rejection
  const handleBulkApprove = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please select items to approve');
      return;
    }

    try {
      setLoading(true);
      
      // Call roster/approve API for each selected draft
      const approvePromises = selectedItems.map(draftId => 
        api.post('/roster/approve', { draft_id: draftId })
      );
      
      console.log('Calling roster/approve API for draft IDs:', selectedItems);
      const results = await Promise.allSettled(approvePromises);
      
      // Check results
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.data?.status === 200);
      const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.data?.status !== 200));
      
      // Move successful items from pending to approved
      const approvedIds = successful.map((_, index) => selectedItems[index]);
      const approvedItems = pendingApprovals.filter(item => approvedIds.includes(item.id));
      
      if (approvedItems.length > 0) {
        setPendingApprovals(prev => prev.filter(item => !approvedIds.includes(item.id)));
        setApprovedRosters(prev => [
          ...approvedItems.map(item => ({
            ...item,
            approved_date: format(new Date(), 'yyyy-MM-dd'),
            approved_by: user?.user_name || 'Super Admin'
          })),
          ...prev
        ]);
      }
      
      setSelectedItems([]);
      setBulkSelectionMode(false);
      
      if (failed.length === 0) {
        toast.success(`${approvedItems.length} drafts approved successfully!`);
      } else if (approvedItems.length > 0) {
        toast.success(`${approvedItems.length} approved, ${failed.length} failed`);
      } else {
        toast.error('Failed to approve drafts');
      }
    } catch (error) {
      console.error('Error in bulk approve:', error);
      toast.error('Failed to approve drafts');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please select items to reject');
      return;
    }

    const reason = prompt('Please provide rejection reason for all selected items:');
    if (!reason) return;

    try {
      setLoading(true);
      
      // Call roster/reject API for each selected draft
      const rejectPromises = selectedItems.map(draftId => 
        api.post('/roster/reject', { draft_id: draftId })
      );
      
      console.log('Calling roster/reject API for draft IDs:', selectedItems);
      const results = await Promise.allSettled(rejectPromises);
      
      // Check results
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.data?.status === 200);
      const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.data?.status !== 200));
      
      // Move successful items from pending to rejected
      const rejectedIds = successful.map((_, index) => selectedItems[index]);
      const rejectedItems = pendingApprovals.filter(item => rejectedIds.includes(item.id));
      
      if (rejectedItems.length > 0) {
        setPendingApprovals(prev => prev.filter(item => !rejectedIds.includes(item.id)));
        setRejectedRosters(prev => [
          ...rejectedItems.map(item => ({
            ...item,
            rejected_date: format(new Date(), 'yyyy-MM-dd'),
            rejected_by: user?.user_name || 'Super Admin',
            rejection_reason: reason
          })),
          ...prev
        ]);
      }
      
      setSelectedItems([]);
      setBulkSelectionMode(false);
      
      if (failed.length === 0) {
        toast.success(`${rejectedItems.length} drafts rejected successfully!`);
      } else if (rejectedItems.length > 0) {
        toast.success(`${rejectedItems.length} rejected, ${failed.length} failed`);
      } else {
        toast.error('Failed to reject drafts');
      }
    } catch (error) {
      console.error('Error in bulk reject:', error);
      toast.error('Failed to reject drafts');
    } finally {
      setLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchPendingDrafts();
    fetchApprovedRosters();
    fetchRejectedRosters();
  }, []);

  // Refresh data when month changes
  useEffect(() => {
    fetchPendingDrafts();
    fetchApprovedRosters();
    fetchRejectedRosters();
  }, [selectedMonth]);

  const fetchPendingDrafts = async () => {
    try {
      setLoading(true);
      const userId = user?.user_id || user?.id || 93;
      console.log('Calling roster/get_pending_drafts API...', { logged_in_user_id: userId });

      const response = await api.post('/roster/get_pending_drafts', {
        logged_in_user_id: userId
      });

      console.log('API Response:', response.data);

      if (response.data && response.data.success) {
        // Convert API response to internal format
        const convertedPending = response.data.pending_requests.map(request => ({
          id: request.draft_id,
          employee_name: request.user_name,
          employee_id: request.user_id,
          team_name: request.team?.team_name || 'No Team',
          team_id: request.team?.team_id,
          date: request.date,
          change_type: request.request?.leave === "yes" ? "Leave" : "Work",
          change_details: request.request?.leave_type || "Status Change",
          requested_by: request.requested_by,
          requested_date: request.requested_at,
          status: 'pending',
          is_planned: request.request?.is_planned === "yes"
        }));

        setPendingApprovals(convertedPending);
      } else {
        toast.error('Failed to load pending drafts');
      }
    } catch (error) {
      console.error('Error fetching pending drafts:', error);
      toast.error('Failed to load pending drafts');
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedRosters = async () => {
    try {
      setLoading(true);
      const userId = user?.user_id || user?.id || 93;
      const monthYear = format(selectedMonth, 'MMMyyyy').toUpperCase();
      console.log('Calling roster/get_leave_history API for approved...', { logged_in_user_id: userId, status: 'approved', month_year: monthYear });

      const response = await api.post('/roster/get_leave_history', {
        logged_in_user_id: userId,
        status: 'approved',
        month_year: monthYear
      });

      console.log('Approved API Response:', response.data);

      if (response.data && response.data.success) {
        // Convert API response to internal format
        const convertedApproved = response.data.data.map(item => ({
          id: item.draft_id,
          employee_name: item.user_name,
          employee_id: item.user_id,
          team_name: item.team?.team_name || 'No Team',
          team_id: item.team?.team_id,
          date: item.date,
          change_type: item.leave_type || "Status Change",
          change_details: item.changes?.to?.day_type || "Status Change",
          requested_by: item.requested_by,
          requested_date: item.requested_at,
          status: 'approved',
          is_planned: item.is_planned === "yes"
        }));

        setApprovedRosters(convertedApproved);
      } else {
        toast.error('Failed to load approved rosters');
      }
    } catch (error) {
      console.error('Error fetching approved rosters:', error);
      toast.error('Failed to load approved rosters');
    } finally {
      setLoading(false);
    }
  };

  const fetchRejectedRosters = async () => {
    try {
      setLoading(true);
      const userId = user?.user_id || user?.id || 93;
      const monthYear = format(selectedMonth, 'MMMyyyy').toUpperCase();
      console.log('Calling roster/get_leave_history API for rejected...', { logged_in_user_id: userId, status: 'rejected', month_year: monthYear });

      const response = await api.post('/roster/get_leave_history', {
        logged_in_user_id: userId,
        status: 'rejected',
        month_year: monthYear
      });

      console.log('Rejected API Response:', response.data);

      if (response.data && response.data.success) {
        // Convert API response to internal format
        const convertedRejected = response.data.data.map(item => ({
          id: item.draft_id,
          employee_name: item.user_name,
          employee_id: item.user_id,
          team_name: item.team?.team_name || 'No Team',
          team_id: item.team?.team_id,
          date: item.date,
          change_type: item.leave_type || "Status Change",
          change_details: item.changes?.to?.day_type || "Status Change",
          requested_by: item.requested_by,
          requested_date: item.requested_at,
          status: 'rejected',
          is_planned: item.is_planned === "yes"
        }));

        setRejectedRosters(convertedRejected);
      } else {
        toast.error('Failed to load rejected rosters');
      }
    } catch (error) {
      console.error('Error fetching rejected rosters:', error);
      toast.error('Failed to load rejected rosters');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = getFilteredData();
  const stats = {
    pending: pendingApprovals.length,
    approved: approvedRosters.length,
    rejected: rejectedRosters.length,
    total: pendingApprovals.length + approvedRosters.length + rejectedRosters.length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 p-6 mb-6 border border-blue-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Super Admin - Roster Approvals</h1>
                <p className="text-slate-500">Review and approve roster submissions from assistant managers</p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
                <div className="text-xs text-slate-500">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                <div className="text-xs text-slate-500">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                <div className="text-xs text-slate-500">Rejected</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Month Navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="text-center min-w-[150px]">
                <h3 className="text-lg font-semibold text-slate-800">
                  {format(selectedMonth, 'MMMM yyyy')}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
              {['pending', 'approved', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilterStatus(status);
                    if (status === 'pending') {
                      fetchPendingDrafts();
                    } else if (status === 'approved') {
                      fetchApprovedRosters();
                    } else if (status === 'rejected') {
                      fetchRejectedRosters();
                    }
                  }}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    filterStatus === status
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  <span className="ml-1 px-1.5 py-0.5 bg-slate-200 rounded-full text-xs">
                    {stats[status]}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, team, or submitter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none w-64"
              />
            </div>
          </div>

          {/* Bulk Selection Controls */}
          {filterStatus === 'pending' && (
            <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setBulkSelectionMode(!bulkSelectionMode)}
                  className={`px-3 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    bulkSelectionMode 
                      ? 'bg-blue-500 text-white shadow-lg' 
                      : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {bulkSelectionMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  {bulkSelectionMode ? 'Bulk Selection ON' : 'Bulk Selection'}
                </button>
                
                {bulkSelectionMode && (
                  <>
                    <button
                      onClick={handleSelectAll}
                      className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-sm"
                    >
                      {selectedItems.length === filteredData.filter(item => item.status === 'pending').length ? 'Deselect All' : 'Select All'}
                    </button>
                    <span className="text-sm text-blue-700 font-medium">
                      {selectedItems.length} of {filteredData.filter(item => item.status === 'pending').length} selected
                    </span>
                  </>
                )}
              </div>

              {selectedItems.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulkApprove}
                    disabled={loading}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    Approve Selected ({selectedItems.length})
                  </button>
                  <button
                    onClick={handleBulkReject}
                    disabled={loading}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Selected ({selectedItems.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Roster List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {filteredData.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-slate-500 font-medium text-lg">No {filterStatus} found</p>
              <p className="text-slate-400 text-sm">
                {filterStatus === 'pending' && 'All roster submissions have been reviewed'}
                {filterStatus === 'approved' && 'No rosters have been approved yet'}
                {filterStatus === 'rejected' && 'No rosters have been rejected yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredData.map((item) => (
                <div key={item.id} className={`p-6 hover:bg-slate-50 transition-colors ${
                  selectedItems.includes(item.id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}>
                  <div className="flex items-center justify-between">
                    {/* Checkbox for bulk selection */}
                    {bulkSelectionMode && item.status === 'pending' && (
                      <div className="mr-4">
                        <button
                          onClick={() => handleToggleSelection(item.id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            selectedItems.includes(item.id)
                              ? 'bg-blue-500 border-blue-500'
                              : 'bg-white border-slate-300 hover:border-blue-400'
                          }`}
                        >
                          {selectedItems.includes(item.id) && (
                            <CheckSquare className="w-3 h-3 text-white" />
                          )}
                        </button>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h4 className="font-semibold text-slate-800 text-lg">{item.employee_name}</h4>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                          {item.team_name}
                        </span>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                          item.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          item.status === 'approved' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                          {item.change_type}: {item.change_details}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Date: {item.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>Requested by: {item.requested_by}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Requested: {new Date(item.requested_date).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {item.status === 'approved' && (
                        <div className="mt-2 text-sm text-green-600">
                          ✓ Approved by {item.approved_by} on {item.approved_date}
                        </div>
                      )}

                      {item.status === 'rejected' && item.rejection_reason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          <strong>Rejection Reason:</strong> {item.rejection_reason}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 ml-6">
                      <button
                        onClick={() => handleViewDetails(item)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      
                      {item.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(item.id)}
                            disabled={loading}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(item.id)}
                            disabled={loading}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedApproval && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-800">Roster Details - {selectedApproval.employee_name}</h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <XCircle className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-3">Submission Info</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Employee:</strong> {selectedApproval.employee_name}</div>
                      <div><strong>Team:</strong> {selectedApproval.team_name}</div>
                      <div><strong>Date:</strong> {selectedApproval.date}</div>
                      <div><strong>Requested by:</strong> {selectedApproval.requested_by}</div>
                      <div><strong>Requested date:</strong> {new Date(selectedApproval.requested_date).toLocaleString()}</div>
                      <div><strong>Change Type:</strong> {selectedApproval.change_type}</div>
                      <div><strong>Change Details:</strong> {selectedApproval.change_details}</div>
                      <div><strong>Planned:</strong> {selectedApproval.is_planned ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-3">Request Details</h4>
                    <div className="space-y-3">
                      <div className={`p-3 rounded-lg ${
                        selectedApproval.is_planned ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
                      }`}>
                        <div className="text-sm font-medium mb-1">
                          {selectedApproval.is_planned ? 'Planned Request' : 'Unplanned Request'}
                        </div>
                        <div className="text-xs text-slate-600">
                          This request was submitted as {selectedApproval.is_planned ? 'planned' : 'unplanned'} leave/change
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="text-sm font-medium mb-1">Request Information</div>
                        <div className="text-xs text-slate-600">
                          Type: {selectedApproval.change_type}<br/>
                          Details: {selectedApproval.change_details}<br/>
                          Date: {selectedApproval.date}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                
                {selectedApproval.status === 'pending' && (
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Please provide rejection reason:');
                        if (reason) {
                          handleReject(selectedApproval.id, reason);
                        }
                      }}
                      disabled={loading}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(selectedApproval.id)}
                      disabled={loading}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminApproval;
