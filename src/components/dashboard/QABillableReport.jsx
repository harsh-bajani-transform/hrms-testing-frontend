/**
 * File: QABillableReport.jsx
 * Description: QA Billable Report showing agent-wise QC data with filters and export
 */
import React, { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { 
  FileText, 
  Download, 
  Search, 
  Calendar, 
  Users, 
  Clock, 
  FileCheck, 
  Filter,
  Briefcase,
  Loader2,
  X
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const QABillableReport = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({
    start: format(new Date(), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  });

  // Check if user has permission to view this report
  const hasPermission = useMemo(() => {
    const allowedRoles = ["Project Manager", "Admin", "Super Admin", "QA Agent"];
    return allowedRoles.includes(user?.role);
  }, [user?.role]);

  // Fetch data from API
  const fetchReportData = async () => {
    if (!user?.user_id) {
      toast.error("User not authenticated");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/qa_agent_report/billable_report", {
        logged_in_user_id: user.user_id,
        date_from: dateRange.start,
        date_to: dateRange.end,
      });

      if (response.data?.status === 200) {
        setData(response.data.data?.records || []);
        setSummary(response.data.data?.summary || null);
        toast.success(`Loaded ${response.data.data?.records?.length || 0} records`);
      } else {
        toast.error(response.data?.message || "Failed to load report data");
        setData([]);
        setSummary(null);
      }
    } catch (error) {
      console.error("Error fetching billable report:", error);
      toast.error(error.response?.data?.message || "Failed to load report data");
      setData([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (hasPermission && user?.user_id) {
      fetchReportData();
    }
  }, [user?.user_id]);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    
    const searchLower = searchTerm.toLowerCase();
    return data.filter((record) => {
      return (
        record.agent_name?.toLowerCase().includes(searchLower) ||
        record.task_name?.toLowerCase().includes(searchLower) ||
        record.team_name?.toLowerCase().includes(searchLower) ||
        record.report_date?.includes(searchLower) ||
        String(record.qa_task_target).includes(searchLower) ||
        String(record.file_record_count).includes(searchLower) ||
        String(record.qc_generated_count).includes(searchLower) ||
        String(record.total_files).includes(searchLower) ||
        String(record.qa_billable_hours).includes(searchLower)
      );
    });
  }, [data, searchTerm]);

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      toast.error("No data to export");
      return;
    }

    // Create CSV content
    const headers = [
      "Agent Name",
      "Date",
      "Task Name",
      "Task Target",
      "Total File Record",
      "Total QC Record",
      "Total Files",
      "Billable Hours",
      "QA Name",
      "Team",
    ];

    const rows = filteredData.map((record) => [
      record.agent_name,
      record.report_date,
      record.task_name,
      record.qa_task_target,
      record.file_record_count,
      record.qc_generated_count,
      record.total_files,
      record.qa_billable_hours,
      record.qa_name,
      record.team_name,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Add summary row if available
    let finalContent = csvContent;
    if (summary) {
      finalContent += "\n\n";
      finalContent += "Summary\n";
      finalContent += `Total Billable Hours,${summary.total_billable_hours}\n`;
      finalContent += `Total Files Processed,${summary.total_files_processed}\n`;
      finalContent += `Total QC Records,${summary.total_qc_records}\n`;
      finalContent += `Total Unique Agents,${summary.total_unique_agents}\n`;
      finalContent += `Total Unique QA Agents,${summary.total_unique_qa_agents}\n`;
    }

    // Download
    const blob = new Blob([finalContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `QA_Billable_Report_${dateRange.start}_to_${dateRange.end}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Report exported successfully");
  };

  // Handle date range change
  const handleDateChange = (field, value) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm("");
  };

  // Apply date filter
  const applyDateFilter = () => {
    fetchReportData();
  };

  // Stat Card Component
  const StatCard = ({ title, value, icon: Icon, color = "blue" }) => {
    const colorClasses = {
      blue: "bg-blue-50 border-blue-200 text-blue-600",
      green: "bg-green-50 border-green-200 text-green-600",
      purple: "bg-purple-50 border-purple-200 text-purple-600",
      orange: "bg-orange-50 border-orange-200 text-orange-600",
    };

    return (
      <div
        className={`rounded-xl border-2 p-5 shadow-sm transition-all hover:shadow-md ${colorClasses[color]}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
              {title}
            </p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
          </div>
          <div className={`p-3 rounded-lg bg-white/80`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    );
  };

  if (!hasPermission) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h3>
        <p className="text-slate-500">
          You do not have permission to view this report.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                <Briefcase className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  QA Billable Report
                </h2>
                <p className="text-sm text-blue-100 mt-1 font-medium">
                  Agent-wise QC billable hours and records
                </p>
              </div>
            </div>
            <button
              onClick={handleExportExcel}
              disabled={filteredData.length === 0 || loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 rounded-xl font-semibold shadow-lg hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Date Range Filter */}
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-sm">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Date Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => handleDateChange("start", e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-slate-400 font-medium">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => handleDateChange("end", e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={applyDateFilter}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Filter className="w-4 h-4" />
                  )}
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Search Filter */}
          <div className="flex items-center gap-3 flex-1 lg:max-w-md">
            <div className="p-2.5 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg shadow-sm">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 relative">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder="Search by agent, task, date..."
                  className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
            </div>
            <span className="text-slate-600 font-semibold">Loading report data...</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
              <FileText className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No Data Found</h3>
            <p className="text-slate-500 text-sm">
              {searchTerm
                ? "No records match your search criteria"
                : "No records available for the selected date range"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Agent Name
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Task Name
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Task Target
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Total File Record
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Total QC Record
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Total Files
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Billable Hours
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((record, index) => (
                  <tr
                    key={`${record.agent_id}-${record.task_id}-${record.report_date}-${index}`}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {record.agent_name}
                          </p>
                          <p className="text-xs text-slate-500">{record.team_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">
                          {format(new Date(record.report_date), "dd MMM yyyy")}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">
                          {record.task_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-semibold">
                        {record.qa_task_target}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm font-semibold text-slate-700">
                        {record.file_record_count}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-semibold">
                        {record.qc_generated_count}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm font-semibold text-slate-700">
                        {record.total_files}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-bold text-orange-600">
                          {record.qa_billable_hours}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Billable Hours"
            value={summary.total_billable_hours}
            icon={Clock}
            color="blue"
          />
          <StatCard
            title="Total Files Processed"
            value={summary.total_files_processed}
            icon={FileText}
            color="green"
          />
          <StatCard
            title="Total QC Records"
            value={summary.total_qc_records}
            icon={FileCheck}
            color="purple"
          />
          <StatCard
            title="Total Agents"
            value={summary.total_unique_agents}
            icon={Users}
            color="orange"
          />
        </div>
      )}
    </div>
  );
};

export default QABillableReport;
