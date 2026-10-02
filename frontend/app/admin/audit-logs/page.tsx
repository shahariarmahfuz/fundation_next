"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { Pagination } from "@/components/Pagination";
import {
  History,
  Shield,
  Filter,
  Eye,
  Loader2,
  AlertCircle,
  FileCode2,
  Clock,
  User,
  ArrowRight
} from "lucide-react";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  // Inspect Modal
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: "25",
      });
      if (moduleFilter) params.append("module", moduleFilter);
      if (actionFilter) params.append("action", actionFilter);

      const data = await api.get(`/audit-logs?${params.toString()}`);
      setLogs(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, moduleFilter, actionFilter]);

  const handleInspect = (log: any) => {
    setSelectedLog(log);
    setInspectModalOpen(true);
  };

  const getActionBadgeColor = (action: string) => {
    const a = (action || "").toUpperCase();
    if (["CREATE", "APPROVE"].includes(a)) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (["UPDATE", "DISBURSE", "REPAY"].includes(a)) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }
    if (["REVERSE", "REJECT", "DELETE"].includes(a)) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            System Audit Trail & Compliance Log
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Immutable chronicle of all state mutations, financial reversals, and administrative actions
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-1.5 border border-slate-200 text-xs font-semibold text-slate-700">
          <Shield className="h-4 w-4 text-emerald-600" />
          <span>Tamper-evident system log</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-full sm:w-56">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Module
            </label>
            <select
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">All System Modules</option>
              <option value="accounting">Accounting Engine</option>
              <option value="transactions">Financial Transactions</option>
              <option value="contributions">Contributions</option>
              <option value="members">Members</option>
              <option value="member_applications">Member Applications</option>
              <option value="expenses">Expenses</option>
              <option value="donations">Donations</option>
              <option value="qard_hasan">Qard Hasan</option>
              <option value="sadakah">Sadakah</option>
              <option value="users">User Accounts</option>
              <option value="roles">Security Roles</option>
              <option value="organization">Organization Profile</option>
            </select>
          </div>

          <div className="w-full sm:w-48">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Action
            </label>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">All Action Types</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="REVERSE">REVERSE</option>
              <option value="APPROVE">APPROVE</option>
              <option value="REJECT">REJECT</option>
              <option value="DISBURSE">DISBURSE</option>
              <option value="REPAY">REPAY</option>
            </select>
          </div>

          {(moduleFilter || actionFilter) && (
            <div className="flex items-end self-end pt-5">
              <button
                type="button"
                onClick={() => {
                  setModuleFilter("");
                  setActionFilter("");
                  setPage(1);
                }}
                className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Reset Filters
              </button>
            </div>
          )}

          <div className="ml-auto flex items-end self-end text-xs font-medium text-slate-500">
            Total Log Events: {total}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Timestamp</th>
                <th className="px-6 py-3 font-semibold">Actor</th>
                <th className="px-6 py-3 font-semibold text-center">Action</th>
                <th className="px-6 py-3 font-semibold">Module & Record</th>
                <th className="px-6 py-3 font-semibold">Audit Details</th>
                <th className="px-6 py-3 font-semibold text-center">Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" />
                    <span className="mt-2 block text-xs text-slate-500">Querying audit trail...</span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center text-rose-600">
                    {error}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    No audit records match the current filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-700">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 text-xs">
                        {log.user_email || `User #${log.user_id || "System"}`}
                      </div>
                      {log.ip_address && (
                        <div className="font-mono text-2xs text-slate-400">{log.ip_address}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className="font-semibold text-slate-800">{log.module}</span>
                      {log.record_id && (
                        <span className="font-mono text-slate-400 ml-1">#{log.record_id}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 max-w-sm truncate">
                      {log.details || "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {(log.old_values || log.new_values) ? (
                        <button
                          onClick={() => handleInspect(log)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                        >
                          <FileCode2 className="h-3 w-3 text-emerald-600" />
                          View Diff
                        </button>
                      ) : (
                        <span className="text-xs text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={25}
          onPageChange={setPage}
        />
      </div>

      {/* Inspect Log Modal */}
      <Modal
        isOpen={inspectModalOpen}
        onClose={() => setInspectModalOpen(false)}
        title={`Audit Entry #${selectedLog?.id || ""} — ${selectedLog?.action} on ${selectedLog?.module}`}
        maxWidth="xl"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block">Actor:</span>
                <span className="font-semibold text-slate-800">
                  {selectedLog.user_email || `User #${selectedLog.user_id || "System"}`}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Timestamp:</span>
                <span className="font-mono text-slate-800">{formatDateTime(selectedLog.timestamp)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Target Record ID:</span>
                <span className="font-mono text-slate-800">{selectedLog.record_id || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-400 block">IP Address:</span>
                <span className="font-mono text-slate-800">{selectedLog.ip_address || "Local"}</span>
              </div>
            </div>

            {selectedLog.details && (
              <div className="text-xs bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-emerald-900">
                <strong>Details:</strong> {selectedLog.details}
              </div>
            )}

            {/* Side-by-side or JSON Diffs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 block mb-1">
                  Previous State (Old Values)
                </span>
                <pre className="p-3 bg-rose-50/30 border border-rose-200 rounded-xl text-2xs font-mono text-rose-950 overflow-x-auto max-h-60">
                  {selectedLog.old_values
                    ? JSON.stringify(selectedLog.old_values, null, 2)
                    : "No previous state recorded (Initial creation)"}
                </pre>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                  Updated State (New Values)
                </span>
                <pre className="p-3 bg-emerald-50/30 border border-emerald-200 rounded-xl text-2xs font-mono text-emerald-950 overflow-x-auto max-h-60">
                  {selectedLog.new_values
                    ? JSON.stringify(selectedLog.new_values, null, 2)
                    : "No new state payload"}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Close Inspector
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
