"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Info,
  User,
  ShoppingCart,
  Mail,
  Phone,
  FileText,
  Edit,
  Search,
  Filter,
  RefreshCw,
  ArrowLeft,
  Calendar,
  XCircle,
  Eye,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  XIcon,
  MailIcon,
  CalendarClock,
  UserCircle,
  CircleDollarSign,
  Truck,
  Hash,
  ShieldCheck,
  MessageSquare,
  Building,
  DollarSign,
  Clipboard,
  Tag,
  PercentIcon,
  Package,
  MapPin,
} from "lucide-react";
import { BASE_URL } from "../api/api";
import RouteGuard from "../components/RouteGuard";

export default function ActivityLogs() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [userLogs, setUserLogs] = useState([]); // Store user-specific logs separately
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedLog, setExpandedLog] = useState(null);
  const [searchEmail, setSearchEmail] = useState("");
  const [orderIdSearch, setOrderIdSearch] = useState("");
  const [searchType, setSearchType] = useState("email"); // "email" or "orderId"
  const [isSearching, setIsSearching] = useState(false);
  const [activityFilter, setActivityFilter] = useState("");
  const [uniqueActivities, setUniqueActivities] = useState([]);
  const [viewMode, setViewMode] = useState("card"); // "card" or "table"
  const [showFilters, setShowFilters] = useState(false);

  // Auth helper: include cookies and optional Bearer token
  const withAuth = (options = {}) => {
    const token = (typeof window !== 'undefined' && localStorage.getItem('token')) || '';
    return {
      credentials: 'include',
      headers: {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...options,
    };
  };

  useEffect(() => {
    fetchAllLogs();
  }, []);

  useEffect(() => {
    // Update unique activities based on the current view (all logs or user logs)
    if (isSearching && userLogs.length > 0) {
      const activities = [...new Set(userLogs.map((log) => log.activity))];
      setUniqueActivities(activities);
    } else if (logs.length > 0) {
      const activities = [...new Set(logs.map((log) => log.activity))];
      setUniqueActivities(activities);
    }
  }, [logs, userLogs, isSearching]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fetchAllLogs = async () => {
    setIsSearching(false);
    setActivityFilter("");
    setLoading(true);
    setError(null);

    // Backend route: GET /activity-logs (admin protected)
    const candidates = [`${BASE_URL}/activity-logs`];

    try {
      let response, data, lastErrText;

      for (const url of candidates) {
        response = await fetch(url, withAuth({ cache: "no-store" }));
        if (response.ok) {
          data = await response.json();
          setLogs(Array.isArray(data) ? data : data?.data ?? []);
          setFilteredLogs(Array.isArray(data) ? data : data?.data ?? []);
          setUserLogs([]);
          setLoading(false);
          return;
        } else {
          lastErrText = await response.text().catch(() => "");
        }
      }

      throw new Error(
        `Failed to fetch activity logs (last status: ${response?.status}). ${
          lastErrText || ""
        }`
      );
    } catch (err) {
      if (response?.status === 401) {
        setError("Unauthorized. Please log in as an admin to view activity logs.");
      } else {
        setError("Failed to load activity logs. Please try again later.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchType === "email") {
      fetchUserLogs();
    } else {
      fetchOrderLogs();
    }
  };

  const fetchUserLogs = async () => {
    if (!searchEmail.trim()) {
      setError("Please enter an email address");
      return;
    }

    setLoading(true);
    setIsSearching(true);
    setActivityFilter("");
    setError(null);

    const candidates = [
      `${BASE_URL}/activity-logs/UserEmail?email=${encodeURIComponent(searchEmail.trim())}`,
    ];

    try {
      let response, data, lastErrText;

      for (const url of candidates) {
        response = await fetch(url, withAuth({ cache: "no-store" }));
        if (response.ok) {
          data = await response.json();
          const arr = Array.isArray(data) ? data : data?.data ?? [];
          setUserLogs(arr);
          setFilteredLogs(arr);
          setLoading(false);
          return;
        } else {
          lastErrText = await response.text().catch(() => "");
        }
      }

      throw new Error(
        `Failed to fetch user activity logs (last status: ${
          response?.status
        }). ${lastErrText || ""}`
      );
    } catch (err) {
      if (response?.status === 401) {
        setError("Unauthorized. Please log in as an admin to view activity logs.");
      } else {
        setError("Failed to load user activity logs. Please try again later.");
      }
      console.error(err);
      setUserLogs([]);
      setFilteredLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderLogs = async () => {
    if (!orderIdSearch.trim()) {
      setError("Please enter an order ID");
      return;
    }

    setLoading(true);
    setIsSearching(true);
    setActivityFilter("");
    setError(null);

    // Likely server route for order id search + safe fallbacks
    const candidates = [
      `${BASE_URL}/activity-logs/OrderId?order_id=${encodeURIComponent(orderIdSearch.trim())}`,
    ];

    try {
      let response, data, lastErrText;

      for (const url of candidates) {
        response = await fetch(url, withAuth({ cache: "no-store" }));
        if (response.ok) {
          data = await response.json();
          const arr = Array.isArray(data) ? data : data?.data ?? [];
          setUserLogs(arr);
          setFilteredLogs(arr);
          setLoading(false);
          return;
        } else {
          lastErrText = await response.text().catch(() => "");
        }
      }

      throw new Error(
        `Failed to fetch order activity logs (last status: ${
          response?.status
        }). ${lastErrText || ""}`
      );
    } catch (err) {
      if (response?.status === 401) {
        setError("Unauthorized. Please log in as an admin to view activity logs.");
      } else {
        setError("Failed to load order activity logs. Please try again later.");
      }
      console.error(err);
      setUserLogs([]);
      setFilteredLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleActivityFilter = (activity) => {
    if (activityFilter === activity) {
      // If clicking the same filter, clear it
      setActivityFilter("");
      // Reset to either all logs or user-specific logs
      setFilteredLogs(isSearching ? userLogs : logs);
    } else {
      setActivityFilter(activity);
      // Apply the new filter to the correct dataset
      const baseSet = isSearching ? userLogs : logs;
      setFilteredLogs(baseSet.filter((log) => log.activity === activity));
    }
  };

  const getActivityIcon = (activity) => {
    switch (true) {
      case activity.includes("User"):
        return <User className="h-5 w-5" />;
      case activity.includes("Order"):
        return <ShoppingCart className="h-5 w-5" />;
      case activity.includes("Newsletter"):
        return <Mail className="h-5 w-5" />;
      case activity.includes("Contact"):
        return <Phone className="h-5 w-5" />;
      case activity.includes("Quote"):
        return <FileText className="h-5 w-5" />;
      case activity.includes("Update"):
        return <Edit className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getActivityColor = (activity) => {
    switch (true) {
      case activity.includes("User"):
        return "bg-gradient-to-r from-blue-500 to-blue-600";
      case activity.includes("Order"):
        return "bg-gradient-to-r from-emerald-500 to-emerald-600";
      case activity.includes("Newsletter"):
        return "bg-gradient-to-r from-violet-500 to-violet-600";
      case activity.includes("Contact"):
        return "bg-gradient-to-r from-amber-500 to-amber-600";
      case activity.includes("Quote"):
        return "bg-gradient-to-r from-indigo-500 to-indigo-600";
      case activity.includes("Update"):
        return "bg-gradient-to-r from-rose-500 to-rose-600";
      default:
        return "bg-gradient-to-r from-slate-500 to-slate-600";
    }
  };

  const getActivityBg = (activity) => {
    switch (true) {
      case activity.includes("User"):
        return "bg-blue-50 dark:bg-blue-900/20";
      case activity.includes("Order"):
        return "bg-emerald-50 dark:bg-emerald-900/20";
      case activity.includes("Newsletter"):
        return "bg-violet-50 dark:bg-violet-900/20";
      case activity.includes("Contact"):
        return "bg-amber-50 dark:bg-amber-900/20";
      case activity.includes("Quote"):
        return "bg-indigo-50 dark:bg-indigo-900/20";
      case activity.includes("Update"):
        return "bg-rose-50 dark:bg-rose-900/20";
      default:
        return "bg-slate-50 dark:bg-slate-900/20";
    }
  };

  const getActivityTextColor = (activity) => {
    switch (true) {
      case activity.includes("User"):
        return "text-blue-700 dark:text-blue-300";
      case activity.includes("Order"):
        return "text-emerald-700 dark:text-emerald-300";
      case activity.includes("Newsletter"):
        return "text-violet-700 dark:text-violet-300";
      case activity.includes("Contact"):
        return "text-amber-700 dark:text-amber-300";
      case activity.includes("Quote"):
        return "text-indigo-700 dark:text-indigo-300";
      case activity.includes("Update"):
        return "text-rose-700 dark:text-rose-300";
      default:
        return "text-slate-700 dark:text-slate-300";
    }
  };

  const navigateToAdmin = () => {
    router.push("/Admin");
  };

  const toggleLogExpansion = (logId) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

  return (
    <RouteGuard allowedRoles={["admin"]} redirectTo="/login">
      <div className="min-h-screen" style={{backgroundColor: '#000000'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={navigateToAdmin}
              className="group flex items-center text-sm font-medium text-gray-400 hover:opacity-80 mb-4 transition-colors" style={{color: '#c70007'}}
            >
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Admin Dashboard
            </button>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-extrabold" style={{color: '#c70007'}}>
                  Activity Logs
                </h1>
                <p className="mt-2 text-gray-300">
                  Monitor and track all system activities and events
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="rounded-full p-1 shadow-md flex" style={{backgroundColor: '#1c1816'}}>
                  <button
                    onClick={() => setViewMode("card")}
                    className={`px-4 py-2 rounded-full flex items-center ${
                      viewMode === "card"
                        ? "text-white shadow-sm"
                        : "text-gray-300 hover:opacity-80"
                    } transition-all duration-200`}
                    style={viewMode === "card" ? {backgroundColor: '#c70007'} : {}}
                  >
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Cards</span>
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`px-4 py-2 rounded-full flex items-center ${
                      viewMode === "table"
                        ? "text-white shadow-sm"
                        : "text-gray-300 hover:opacity-80"
                    } transition-all duration-200`}
                    style={viewMode === "table" ? {backgroundColor: '#c70007'} : {}}
                  >
                    <List className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Table</span>
                  </button>
                </div>

                <button
                  onClick={fetchAllLogs}
                  className="p-3 rounded-full shadow-md text-gray-300 hover:opacity-80 hover:shadow-lg transition-all duration-200" style={{backgroundColor: '#1c1816', '--hover-color': '#c70007'}}
                  title="Refresh Logs"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="rounded-2xl shadow-xl overflow-hidden mb-8" style={{backgroundColor: '#1c1816'}}>
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Search Section */}
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="searchType"
                        value="email"
                        checked={searchType === "email"}
                        onChange={() => setSearchType("email")}
                        className="form-radio h-4 w-4 focus:ring-2" style={{color: '#c70007', accentColor: '#c70007'}}
                      />
                      <span className="ml-2 text-gray-200">
                        Search by Email
                      </span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="searchType"
                        value="orderId"
                        checked={searchType === "orderId"}
                        onChange={() => setSearchType("orderId")}
                        className="form-radio h-4 w-4 focus:ring-2" style={{color: '#c70007', accentColor: '#c70007'}}
                      />
                      <span className="ml-2 text-gray-200">
                        Search by Order ID
                      </span>
                    </label>
                  </div>

                  <div className="relative">
                    {searchType === "email" ? (
                      <input
                        type="email"
                        placeholder="Enter user email..."
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200" style={{backgroundColor: '#1c1816', '--tw-ring-color': '#c70007'}}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder="Enter order ID..."
                        value={orderIdSearch}
                        onChange={(e) => setOrderIdSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200" style={{backgroundColor: '#1c1816', '--tw-ring-color': '#c70007'}}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      />
                    )}
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                      <Search className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSearch}
                    disabled={
                      loading ||
                      (searchType === "email"
                        ? !searchEmail.trim()
                        : !orderIdSearch.trim())
                    }
                    className={`px-6 py-3 rounded-xl flex items-center justify-center font-medium transition-all duration-200 ${
                      loading ||
                      (searchType === "email"
                        ? !searchEmail.trim()
                        : !orderIdSearch.trim())
                        ? "text-gray-500 cursor-not-allowed"
                        : "text-white shadow-md hover:shadow-lg hover:opacity-80"
                    }`}
                    style={!(loading || (searchType === "email" ? !searchEmail.trim() : !orderIdSearch.trim())) ? {backgroundColor: '#c70007'} : {backgroundColor: '#1c1816'}}
                  >
                    <Search className="h-5 w-5 mr-2" />
                    <span>Search</span>
                  </button>
                  <button
                    onClick={fetchAllLogs}
                    disabled={loading}
                    className={`px-6 py-3 rounded-xl flex items-center justify-center font-medium transition-all duration-200 ${
                      loading
                        ? "text-gray-500 cursor-not-allowed"
                        : "text-gray-200 border border-gray-500/30 hover:opacity-80 shadow-md hover:shadow-lg"
                    }`}
                    style={!loading ? {backgroundColor: '#1c1816'} : {}}
                  >
                    <span>Show All</span>
                  </button>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-3 py-3 rounded-xl flex items-center justify-center font-medium text-gray-200 border border-gray-500/30 hover:opacity-80 shadow-md hover:shadow-lg transition-all duration-200" style={{backgroundColor: '#1c1816'}}
                  >
                    <Filter className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Search Results Info */}
              {isSearching && (
                <div className="mt-4 p-4 border border-gray-500/30 rounded-xl" style={{backgroundColor: '#1c1816'}}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <CheckCircle2 className="h-5 w-5" style={{color: '#c70007'}} />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-200">
                        {searchType === "email" ? (
                          <>
                            Showing logs for email:{" "}
                            <span className="font-semibold">{searchEmail}</span>
                          </>
                        ) : (
                          <>
                            Showing logs for order ID:{" "}
                            <span className="font-semibold">
                              {orderIdSearch}
                            </span>
                          </>
                        )}
                        {activityFilter && (
                          <span>
                            {" "}
                            filtered by activity:{" "}
                            <span className="font-semibold">
                              {activityFilter}
                            </span>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Filters */}
              {showFilters && uniqueActivities.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-200">
                      Filter by activity type:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {uniqueActivities.map((activity) => (
                      <button
                        key={activity}
                        onClick={() => handleActivityFilter(activity)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                          activityFilter === activity
                            ? "text-white shadow-sm"
                            : "text-gray-200 hover:opacity-80"
                        }`}
                        style={activityFilter === activity ? {backgroundColor: '#c70007'} : {backgroundColor: '#1c1816'}}
                      >
                        {activity}
                      </button>
                    ))}
                    {activityFilter && (
                      <button
                        onClick={() => {
                          setActivityFilter("");
                          setFilteredLogs(isSearching ? userLogs : logs);
                        }}
                        className="px-3 py-1.5 rounded-full text-sm font-medium text-white hover:opacity-80 transition-all duration-200" style={{backgroundColor: '#c70007'}}
                      >
                        <div className="flex items-center">
                          <XIcon className="h-3.5 w-3.5 mr-1" />
                          Clear Filter
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 border border-red-500/30 rounded-xl text-red-300" style={{backgroundColor: '#1c1816'}}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl shadow-lg overflow-hidden animate-pulse" style={{backgroundColor: '#1c1816'}}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                        <div className="ml-4">
                          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
                          <div className="mt-2 h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    </div>
                    <div className="mt-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      <div className="mt-2 h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="border border-yellow-500/30 rounded-xl p-4 text-yellow-300" style={{backgroundColor: '#1c1816'}}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">
                    No logs found.{" "}
                    {isSearching
                      ? "Try a different search term or filter."
                      : ""}
                  </p>
                </div>
              </div>
            </div>
          ) : viewMode === "card" ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.activity_logs_id}
                  className={`rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl ${
                    expandedLog === log.activity_logs_id
                      ? "ring-2"
                      : ""
                  }`}
                  style={{
                    backgroundColor: '#1c1816',
                    ...(expandedLog === log.activity_logs_id ? {'--tw-ring-color': '#c70007'} : {})
                  }}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${getActivityColor(
                            log.activity
                          )}`}
                        >
                          {getActivityIcon(log.activity)}
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-white">
                            {log.activity}
                          </h3>
                          <div className="flex items-center text-sm text-gray-400">
                            <Clock className="h-3.5 w-3.5 mr-1.5" />
                            {formatDate(log.created_at)}
                          </div>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white" style={{backgroundColor: '#c70007'}}>
                        ID: {log.activity_logs_id}
                      </span>
                    </div>

                    {log.user_email && (
                      <div className="mt-4 flex items-center text-sm text-gray-300">
                        <User className="h-4 w-4 mr-1.5 text-gray-400" />
                        <span>{log.user_email}</span>
                      </div>
                    )}

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => toggleLogExpansion(log.activity_logs_id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          expandedLog === log.activity_logs_id
                            ? "text-white"
                            : "text-gray-200 hover:opacity-80"
                        }`}
                        style={expandedLog === log.activity_logs_id ? {backgroundColor: '#c70007'} : {backgroundColor: '#1c1816'}}
                      >
                        {expandedLog === log.activity_logs_id ? (
                          <div className="flex items-center">
                            <ChevronUp className="h-4 w-4 mr-1.5" />
                            Hide Details
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <ChevronDown className="h-4 w-4 mr-1.5" />
                            View Details
                          </div>
                        )}
                      </button>
                    </div>

                    {expandedLog === log.activity_logs_id && (
                      <div className="mt-4">
                        <div
                          className={`p-4 rounded-xl ${getActivityBg(
                            log.activity
                          )}`}
                        >
                          <ActivityDetails
                            details={log.details}
                            activity={log.activity}
                            textColor={getActivityTextColor(log.activity)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Table View
            <div className="rounded-2xl shadow-lg overflow-hidden" style={{backgroundColor: '#1c1816'}}>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-500/30">
                  <thead style={{backgroundColor: '#1c1816'}}>
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                      >
                        Activity
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                      >
                        Date & Time
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                      >
                        User
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                      >
                        ID
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                      >
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-500/30" style={{backgroundColor: '#1c1816'}}>
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.activity_logs_id}
                        className="hover:opacity-80 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getActivityColor(
                                log.activity
                              )}`}
                            >
                              {getActivityIcon(log.activity)}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-white">
                                {log.activity}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-400">
                            <Calendar className="h-3.5 w-3.5 mr-1.5" />
                            {formatDate(log.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {log.user_email ? (
                            <div className="flex items-center text-sm text-gray-400">
                              <User className="h-3.5 w-3.5 mr-1.5" />
                              {log.user_email}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">
                              -
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {log.activity_logs_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() =>
                              toggleLogExpansion(log.activity_logs_id)
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                              expandedLog === log.activity_logs_id
                                ? "text-white"
                                : "text-gray-200 hover:opacity-80"
                            }`}
                            style={expandedLog === log.activity_logs_id ? {backgroundColor: '#c70007'} : {backgroundColor: '#1c1816'}}
                          >
                            {expandedLog === log.activity_logs_id ? (
                              <div className="flex items-center">
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Hide
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                View
                              </div>
                            )}
                          </button>

                          {expandedLog === log.activity_logs_id && (
                            <div className="mt-4 p-4 rounded-xl" style={{backgroundColor: '#1c1816'}}>
                              <ActivityDetails
                                details={log.details}
                                activity={log.activity}
                                textColor={getActivityTextColor(log.activity)}
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </RouteGuard>
  );
}

function ActivityDetails({ details, activity, textColor }) {
  if (!details)
    return (
      <p className="text-gray-500 dark:text-gray-400">No details available</p>
    );

  // Helper function to get icon for each data field
  const getFieldIcon = (key) => {
    switch (key.toLowerCase()) {
      case "email":
        return <MailIcon className="h-4 w-4" />;
      case "timestamp":
        return <CalendarClock className="h-4 w-4" />;
      case "user_name":
        return <UserCircle className="h-4 w-4" />;
      case "name":
        return <UserCircle className="h-4 w-4" />;
      case "first_name":
      case "firstname":
        return <UserCircle className="h-4 w-4" />;
      case "last_name":
      case "lastname":
        return <UserCircle className="h-4 w-4" />;
      case "phone":
      case "phone_no":
      case "phoneno":
        return <Phone className="h-4 w-4" />;
      case "message":
        return <MessageSquare className="h-4 w-4" />;
      case "order_id":
        return <Hash className="h-4 w-4" />;
      case "subtotal":
        return <DollarSign className="h-4 w-4" />;
      case "total":
        return <CircleDollarSign className="h-4 w-4" />;
      case "shipping":
        return <Truck className="h-4 w-4" />;
      case "tax":
        return <PercentIcon className="h-4 w-4" />;
      case "company":
        return <Building className="h-4 w-4" />;
      case "productcode":
        return <Tag className="h-4 w-4" />;
      case "product_code":
        return <Tag className="h-4 w-4" />;
      case "quantity":
        return <Package className="h-4 w-4" />;
      case "status":
        return <ShieldCheck className="h-4 w-4" />;
      case "condition":
        return <Clipboard className="h-4 w-4" />;
      case "price":
      case "target_price":
        return <DollarSign className="h-4 w-4" />;
      case "shippingaddress":
        return <MapPin className="h-4 w-4" />;
      case "items":
        return <Package className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  // For User Login/registration
  if (
    activity.includes("User Login") ||
    activity.includes("User created") ||
    activity.includes("User Registration")
  ) {
    return (
      <div className="p-4 rounded-lg shadow-sm" style={{backgroundColor: '#1c1816'}}>
        <div className="space-y-3">
          {Object.entries(details).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center text-gray-300"
            >
              <div className={`mr-3 ${textColor}`}>{getFieldIcon(key)}</div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 capitalize">
                  {key.replace(/_/g, " ")}
                </span>
                <span className="font-medium">{value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // For complex nested objects like order details
  if (activity.includes("Order created") && details && details.orderDetails) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg shadow-sm" style={{backgroundColor: '#1c1816'}}>
            <h4
              className={`font-medium mb-3 text-sm ${textColor} flex items-center`}
            >
              <UserCircle className="h-4 w-4 mr-2" /> Customer Information
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <User className={`h-4 w-4 mr-3 ${textColor}`} />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Name
                  </span>
                  <span className="font-medium">
                    {details.firstName} {details.lastName}
                  </span>
                </div>
              </div>
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <MailIcon className={`h-4 w-4 mr-3 ${textColor}`} />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Email
                  </span>
                  <span className="font-medium">{details.email}</span>
                </div>
              </div>
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <Phone className={`h-4 w-4 mr-3 ${textColor}`} />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Phone
                  </span>
                  <span className="font-medium">{details.phoneNumber}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg shadow-sm" style={{backgroundColor: '#1c1816'}}>
            <h4
              className={`font-medium mb-3 text-sm ${textColor} flex items-center`}
            >
              <ShoppingCart className="h-4 w-4 mr-2" /> Order Summary
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <Tag className={`h-4 w-4 mr-3 ${textColor}`} />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Subtotal
                  </span>
                  <span className="font-medium">
                    ${details.orderDetails.subtotal}
                  </span>
                </div>
              </div>
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <Truck className={`h-4 w-4 mr-3 ${textColor}`} />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Shipping
                  </span>
                  <span className="font-medium">
                    ${details.orderDetails.shipping}
                  </span>
                </div>
              </div>
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <PercentIcon className={`h-4 w-4 mr-3 ${textColor}`} />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Tax
                  </span>
                  <span className="font-medium">
                    ${details.orderDetails.tax}
                  </span>
                </div>
              </div>
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <CircleDollarSign className={`h-4 w-4 mr-3 ${textColor}`} />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Total
                  </span>
                  <span className="font-bold">
                    ${details.orderDetails.total}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4
            className={`font-medium mb-3 text-sm ${textColor} flex items-center`}
          >
            <Package className="h-4 w-4 mr-2" /> Items
          </h4>
          <div className="overflow-x-auto rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Product ID
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {details.orderDetails.items &&
                  details.orderDetails.items.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {item.product_product_id}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        ${item.price}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        ${(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // For Newsletter Subscription
  if (activity.includes("Newsletter") && details) {
    return (
      <div className="p-4 rounded-lg shadow-sm" style={{backgroundColor: '#1c1816'}}>
        <div className="flex items-center text-gray-700 dark:text-gray-300">
          <MailIcon className={`h-4 w-4 mr-3 ${textColor}`} />
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Email
            </span>
            <span className="font-medium">{details.email}</span>
          </div>
        </div>
      </div>
    );
  }

  // For Contact Request
  if (activity.includes("Contact") && details) {
    return (
      <div className="p-4 rounded-lg shadow-sm" style={{backgroundColor: '#1c1816'}}>
        <div className="space-y-3">
          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <UserCircle className={`h-4 w-4 mr-3 ${textColor}`} />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Name
              </span>
              <span className="font-medium">{details.name}</span>
            </div>
          </div>
          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <MailIcon className={`h-4 w-4 mr-3 ${textColor}`} />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Email
              </span>
              <span className="font-medium">{details.email}</span>
            </div>
          </div>
          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <Phone className={`h-4 w-4 mr-3 ${textColor}`} />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Phone
              </span>
              <span className="font-medium">{details.phoneno}</span>
            </div>
          </div>
          <div className="flex text-gray-700 dark:text-gray-300">
            <MessageSquare className={`h-4 w-4 mr-3 mt-1 ${textColor}`} />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Message
              </span>
              <span className="font-medium">{details.message}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For Quote
  if (activity.includes("Quote") && details) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg shadow-sm" style={{backgroundColor: '#1c1816'}}>
          <h4
            className={`font-medium mb-3 text-sm ${textColor} flex items-center`}
          >
            <UserCircle className="h-4 w-4 mr-2" /> Contact Information
          </h4>
          <div className="space-y-3">
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <UserCircle className={`h-4 w-4 mr-3 ${textColor}`} />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Name
                </span>
                <span className="font-medium">{details.name}</span>
              </div>
            </div>
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <MailIcon className={`h-4 w-4 mr-3 ${textColor}`} />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Email
                </span>
                <span className="font-medium">{details.email}</span>
              </div>
            </div>
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <Phone className={`h-4 w-4 mr-3 ${textColor}`} />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Phone
                </span>
                <span className="font-medium">{details.phoneno}</span>
              </div>
            </div>
            <div className="flex text-gray-700 dark:text-gray-300">
              <MessageSquare className={`h-4 w-4 mr-3 mt-1 ${textColor}`} />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Message
                </span>
                <span className="font-medium">{details.message}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg shadow-sm" style={{backgroundColor: '#1c1816'}}>
          <h4
            className={`font-medium mb-3 text-sm ${textColor} flex items-center`}
          >
            <Tag className="h-4 w-4 mr-2" /> Product Details
          </h4>
          <div className="space-y-3">
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <Tag className={`h-4 w-4 mr-3 ${textColor}`} />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Product Code
                </span>
                <span className="font-medium">{details.productCode}</span>
              </div>
            </div>
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <Package className={`h-4 w-4 mr-3 ${textColor}`} />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Quantity
                </span>
                <span className="font-medium">{details.quantity}</span>
              </div>
            </div>
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <ShieldCheck className={`h-4 w-4 mr-3 ${textColor}`} />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Status
                </span>
                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs inline-block mt-1">
                  {details.status}
                </span>
              </div>
            </div>
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <Clipboard className={`h-4 w-4 mr-3 ${textColor}`} />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Condition
                </span>
                <span className="font-medium">{details.condition}</span>
              </div>
            </div>
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <DollarSign className={`h-4 w-4 mr-3 ${textColor}`} />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Target Price
                </span>
                <span className="font-medium">${details.target_price}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For Order Update
  if (activity.includes("Update") && details) {
    return (
      <div className="p-4 rounded-lg shadow-sm" style={{backgroundColor: '#1c1816'}}>
        <div className="space-y-3">
          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <Tag className={`h-4 w-4 mr-3 ${textColor}`} />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Order ID
              </span>
              <span className="font-medium">{details.order_id}</span>
            </div>
          </div>
          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <MapPin className={`h-4 w-4 mr-3 ${textColor}`} />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Shipping Address
              </span>
              <span className="font-medium">{details.shippingAddress}</span>
            </div>
          </div>
          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <Phone className={`h-4 w-4 mr-3 ${textColor}`} />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Phone
              </span>
              <span className="font-medium">{details.Phoneno}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default case - format all fields with icons
  return (
    <div className="p-4 rounded-lg shadow-sm" style={{backgroundColor: '#1c1816'}}>
      <div className="space-y-3">
        {Object.entries(details).map(([key, value]) => {
          // Skip rendering objects and arrays as field items - they'll be handled separately
          if (typeof value === "object" && value !== null) return null;

          return (
            <div
              key={key}
              className="flex items-center text-gray-300"
            >
              <div className={`mr-3 ${textColor}`}>{getFieldIcon(key)}</div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 capitalize">
                  {key.replace(/_/g, " ")}
                </span>
                <span className="font-medium">{value.toString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Handle nested objects that weren't caught by specific activity handlers */}
      {Object.entries(details).map(([key, value]) => {
        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          return (
            <div
              key={key}
              className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <h4
                className={`font-medium mb-3 text-sm ${textColor} flex items-center capitalize`}
              >
                {getFieldIcon(key)}
                <span className="ml-2">{key.replace(/_/g, " ")}</span>
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(value).map(([nestedKey, nestedValue]) => {
                  if (typeof nestedValue !== "object" || nestedValue === null) {
                    return (
                      <div
                        key={nestedKey}
                        className="flex items-center text-gray-300"
                      >
                        <div className={`mr-3 ${textColor}`}>
                          {getFieldIcon(nestedKey)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-400 capitalize">
                            {nestedKey.replace(/_/g, " ")}
                          </span>
                          <span className="font-medium">
                            {nestedValue.toString()}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
