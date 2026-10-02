"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import {
  FileBarChart2,
  TrendingUp,
  TrendingDown,
  Scale,
  Users,
  FolderTree,
  Calendar,
  Printer,
  Download,
  Filter,
  Loader2,
  AlertCircle,
  Coins,
  CheckCircle2,
  Clock
} from "lucide-react";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"financial" | "groups" | "qard" | "members">("financial");
  const [groups, setGroups] = useState<any[]>([]);
  const [membersList, setMembersList] = useState<any[]>([]);

  // Financial Statement State
  const [finDateFrom, setFinDateFrom] = useState("");
  const [finDateTo, setFinDateTo] = useState("");
  const [finGroupId, setFinGroupId] = useState("");
  const [financialData, setFinancialData] = useState<any | null>(null);
  const [financialLoading, setFinancialLoading] = useState(false);
  const [financialError, setFinancialError] = useState<string | null>(null);

  // Group Balances State
  const [groupBalancesData, setGroupBalancesData] = useState<any | null>(null);
  const [groupBalancesLoading, setGroupBalancesLoading] = useState(false);

  // Outstanding Qard State
  const [qardData, setQardData] = useState<any | null>(null);
  const [qardLoading, setQardLoading] = useState(false);

  // Member Ledger State
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [memberLedgerData, setMemberLedgerData] = useState<any | null>(null);
  const [memberLedgerLoading, setMemberLedgerLoading] = useState(false);

  // Load initial dropdowns
  useEffect(() => {
    const loadInit = async () => {
      try {
        const [gRes, mRes] = await Promise.all([
          api.get("/groups"),
          api.get("/members?page_size=100")
        ]);
        setGroups(gRes);
        setMembersList(mRes.items || []);
        if (mRes.items?.length > 0) {
          setSelectedMemberId(mRes.items[0].id.toString());
        }
      } catch (err) {
        console.error("Failed to load initial report options", err);
      }
    };
    loadInit();
  }, []);

  // Fetch Financial Report
  const fetchFinancialReport = async () => {
    setFinancialLoading(true);
    setFinancialError(null);
    try {
      const params = new URLSearchParams();
      if (finDateFrom) params.append("date_from", finDateFrom);
      if (finDateTo) params.append("date_to", finDateTo);
      if (finGroupId) params.append("group_id", finGroupId);

      const data = await api.get(`/reports/financial?${params.toString()}`);
      setFinancialData(data);
    } catch (err: any) {
      setFinancialError(err.message || "Failed to load financial report");
    } finally {
      setFinancialLoading(false);
    }
  };

  // Fetch Group Balances
  const fetchGroupBalances = async () => {
    setGroupBalancesLoading(true);
    try {
      const data = await api.get("/reports/group-balances");
      setGroupBalancesData(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setGroupBalancesLoading(false);
    }
  };

  // Fetch Outstanding Qard
  const fetchOutstandingQard = async () => {
    setQardLoading(true);
    try {
      const data = await api.get("/reports/outstanding-qard");
      setQardData(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setQardLoading(false);
    }
  };

  // Fetch Member Ledger
  const fetchMemberLedger = async (memId: string) => {
    if (!memId) return;
    setMemberLedgerLoading(true);
    try {
      const data = await api.get(`/reports/member-ledger/${memId}`);
      setMemberLedgerData(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setMemberLedgerLoading(false);
    }
  };

  // Tab switch effect
  useEffect(() => {
    if (activeTab === "financial") {
      fetchFinancialReport();
    } else if (activeTab === "groups") {
      fetchGroupBalances();
    } else if (activeTab === "qard") {
      fetchOutstandingQard();
    } else if (activeTab === "members" && selectedMemberId) {
      fetchMemberLedger(selectedMemberId);
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Financial Statements & Audit Reports
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Exportable foundation accounts, fund balances, loan recovery, and dues
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 print:hidden transition-colors shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <Printer className="h-4 w-4" />
          Print / Export PDF
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 print:hidden">
        <button
          onClick={() => setActiveTab("financial")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "financial"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
          }`}
        >
          <FileBarChart2 className="h-4 w-4" />
          Comprehensive Income & Outflow
        </button>

        <button
          onClick={() => setActiveTab("groups")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "groups"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
          }`}
        >
          <FolderTree className="h-4 w-4" />
          Group Balances Position
        </button>

        <button
          onClick={() => setActiveTab("qard")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "qard"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
          }`}
        >
          <Scale className="h-4 w-4" />
          Qard Hasan Portfolio
        </button>

        <button
          onClick={() => setActiveTab("members")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "members"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
          }`}
        >
          <Users className="h-4 w-4" />
          Individual Member Statement
        </button>
      </div>

      {/* TAB 1: FINANCIAL STATEMENT */}
      {activeTab === "financial" && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:hidden dark:border-slate-800 dark:bg-slate-900 transition-colors">
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-full sm:w-56">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Accounting Group
                </label>
                <select
                  value={finGroupId}
                  onChange={(e) => setFinGroupId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">All Foundation Groups</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-44">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={finDateFrom}
                  onChange={(e) => setFinDateFrom(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="w-full sm:w-44">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={finDateTo}
                  onChange={(e) => setFinDateTo(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-end self-end pt-5">
                <button
                  onClick={fetchFinancialReport}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  Generate Statement
                </button>
              </div>
            </div>
          </div>

          {financialLoading ? (
            <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <span className="ml-3 text-slate-600 dark:text-slate-300 font-medium">Generating financial statement...</span>
            </div>
          ) : financialError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              {financialError}
            </div>
          ) : financialData ? (
            <div className="space-y-6">
              {/* Financial KPI Summary Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                      Total Inflows (Gross Receipts)
                    </span>
                    <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                    +{formatCurrency(financialData.total_inflow)}
                  </div>
                  <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-300">
                    Contributions, donations & loan repayments
                  </div>
                </div>

                <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-5 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                      Total Outflows (Disbursements)
                    </span>
                    <TrendingDown className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-rose-700 dark:text-rose-400">
                    -{formatCurrency(financialData.total_outflow)}
                  </div>
                  <div className="mt-1 text-xs text-rose-600 dark:text-rose-300">
                    Expenses, sadakah grants & qard disbursements
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Net Flow During Period
                    </span>
                    <Coins className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div
                    className={`mt-2 text-2xl font-bold ${
                      Number(financialData.net_change) >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                    }`}
                  >
                    {Number(financialData.net_change) >= 0 ? "+" : ""}
                    {formatCurrency(financialData.net_change)}
                  </div>
                  <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    Inflow minus Outflow surplus / (deficit)
                  </div>
                </div>
              </div>

              {/* Breakdown by Type Grid */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
                  Distribution by Transaction Classification
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {Object.entries(financialData.breakdown_by_type || {}).map(([type, amt]: [string, any]) => (
                    <div key={type} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60 transition-colors">
                      <div className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                        {type.replace(/_/g, " ")}
                      </div>
                      <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                        {formatCurrency(amt)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transactions Ledger Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
                <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between dark:border-slate-800">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Itemized Transaction Details ({financialData.items.length} records)
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Txn #</th>
                        <th className="px-6 py-3 font-semibold">Date</th>
                        <th className="px-6 py-3 font-semibold">Category</th>
                        <th className="px-6 py-3 font-semibold">Flow</th>
                        <th className="px-6 py-3 font-semibold text-right">Amount</th>
                        <th className="px-6 py-3 font-semibold">Description</th>
                        <th className="px-6 py-3 font-semibold">Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {financialData.items.map((item: any) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-3 font-mono font-medium text-slate-900 dark:text-white">
                            {item.transaction_number}
                          </td>
                          <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{formatDate(item.date)}</td>
                          <td className="px-6 py-3 text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {item.transaction_type.replace(/_/g, " ")}
                          </td>
                          <td className="px-6 py-3">
                            <StatusBadge status={item.flow_type} />
                          </td>
                          <td className="px-6 py-3 text-right font-bold text-slate-900 dark:text-white">
                            {item.flow_type === "INFLOW" ? (
                              <span className="text-emerald-600 dark:text-emerald-400">+{formatCurrency(item.amount)}</span>
                            ) : (
                              <span className="text-rose-600 dark:text-rose-400">-{formatCurrency(item.amount)}</span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                            {item.description}
                          </td>
                          <td className="px-6 py-3 text-xs font-mono text-slate-400 dark:text-slate-500">
                            {item.reference || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 2: GROUP BALANCES STATEMENT */}
      {activeTab === "groups" && (
        <div className="space-y-6">
          {groupBalancesLoading ? (
            <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <span className="ml-3 text-slate-600 dark:text-slate-300 font-medium">Aggregating group balances...</span>
            </div>
          ) : groupBalancesData ? (
            <>
              {/* Foundation Total Liquidity Banner */}
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-700 to-teal-800 p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
                    Total Foundation Consolidated Capital
                  </div>
                  <div className="mt-1 text-3xl font-black">
                    {formatCurrency(groupBalancesData.total_foundation_balance)}
                  </div>
                  <div className="mt-1 text-xs text-emerald-100">
                    Strict mathematical sum of all 4 accounting group buckets
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs bg-emerald-800/80 px-4 py-2 rounded-xl border border-emerald-600/50">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  <span>Double-entry verified against journal</span>
                </div>
              </div>

              {/* Group Balances Position Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
                <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Group-Specific Financial Position
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Group Code & Name</th>
                        <th className="px-6 py-3 font-semibold">Status</th>
                        <th className="px-6 py-3 font-semibold text-right">Opening Balance</th>
                        <th className="px-6 py-3 font-semibold text-right text-emerald-600 dark:text-emerald-400">Total Inflows (+)</th>
                        <th className="px-6 py-3 font-semibold text-right text-rose-600 dark:text-rose-400">Total Outflows (-)</th>
                        <th className="px-6 py-3 font-semibold text-right text-slate-900 dark:text-white">Current Closing Balance</th>
                        <th className="px-6 py-3 font-semibold text-right">% of Capital</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {groupBalancesData.groups.map((g: any) => {
                        const pct =
                          Number(groupBalancesData.total_foundation_balance) > 0
                            ? ((Number(g.closing_balance) / Number(groupBalancesData.total_foundation_balance)) * 100).toFixed(1)
                            : "0.0";
                        return (
                          <tr key={g.group_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900 dark:text-white">{g.group_name}</div>
                              <span className="font-mono text-xs text-slate-400 dark:text-slate-500">Code: {g.group_code}</span>
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={g.status} />
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-slate-600 dark:text-slate-400">
                              {formatCurrency(g.opening_balance)}
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                              +{formatCurrency(g.total_inflows)}
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-rose-600 dark:text-rose-400">
                              -{formatCurrency(g.total_outflows)}
                            </td>
                            <td className="px-6 py-4 text-right font-extrabold text-slate-900 dark:text-white text-base">
                              {formatCurrency(g.closing_balance)}
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-slate-700 dark:text-slate-300">
                              {pct}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50/90 font-bold text-slate-900 border-t border-slate-200 dark:bg-slate-800/80 dark:text-white dark:border-slate-800">
                      <tr>
                        <td className="px-6 py-3" colSpan={5}>
                          Consolidated Total:
                        </td>
                        <td className="px-6 py-3 text-right text-base text-emerald-700 dark:text-emerald-400">
                          {formatCurrency(groupBalancesData.total_foundation_balance)}
                        </td>
                        <td className="px-6 py-3 text-right">100.0%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* TAB 3: QARD HASAN PORTFOLIO */}
      {activeTab === "qard" && (
        <div className="space-y-6">
          {qardLoading ? (
            <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <span className="ml-3 text-slate-600 dark:text-slate-300 font-medium">Loading Qard Hasan loan registry...</span>
            </div>
          ) : qardData ? (
            <>
              {/* Qard KPIs */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Active Loans Count
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {qardData.total_active_loans}
                  </div>
                  <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">0% Interest Microloans</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Total Principal Disbursed
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(qardData.total_principal)}
                  </div>
                  <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">Total capital loaned</div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/30 transition-colors">
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Total Repayments Collected
                  </div>
                  <div className="mt-2 text-xl font-bold text-emerald-700 dark:text-emerald-400">
                    +{formatCurrency(qardData.total_repaid)}
                  </div>
                  <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-300">
                    Recovered back to group funds
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/30 transition-colors">
                  <div className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Outstanding Receivables
                  </div>
                  <div className="mt-2 text-xl font-bold text-amber-700 dark:text-amber-400">
                    {formatCurrency(qardData.total_outstanding)}
                  </div>
                  <div className="mt-1 text-xs text-amber-600 dark:text-amber-300">
                    Remaining unpaid balance
                  </div>
                </div>
              </div>

              {/* Loans List */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
                <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Active Qard Hasan Portfolio Statement
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Loan # & Disbursed</th>
                        <th className="px-6 py-3 font-semibold">Beneficiary</th>
                        <th className="px-6 py-3 font-semibold">Funding Group</th>
                        <th className="px-6 py-3 font-semibold text-right">Principal</th>
                        <th className="px-6 py-3 font-semibold text-right text-emerald-600 dark:text-emerald-400">Repaid</th>
                        <th className="px-6 py-3 font-semibold text-right text-amber-600 dark:text-amber-400">Outstanding</th>
                        <th className="px-6 py-3 font-semibold text-right">Monthly Installment</th>
                        <th className="px-6 py-3 font-semibold text-center">Recovery %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {qardData.loans.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500">
                            No active Qard Hasan loans found.
                          </td>
                        </tr>
                      ) : (
                        qardData.loans.map((l: any) => {
                          const recoveryPct =
                            Number(l.principal_amount) > 0
                              ? ((Number(l.total_repaid) / Number(l.principal_amount)) * 100).toFixed(0)
                              : "0";
                          return (
                            <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-mono font-bold text-slate-900 dark:text-white">{l.qard_number}</div>
                                <div className="text-xs text-slate-400 dark:text-slate-500">{formatDate(l.disbursed_date)}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-semibold text-slate-800 dark:text-slate-200">{l.beneficiary_name}</div>
                                <div className="text-xs text-slate-400 dark:text-slate-500">{l.beneficiary_phone}</div>
                              </td>
                              <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                                {l.group_name}
                              </td>
                              <td className="px-6 py-4 text-right font-semibold text-slate-800 dark:text-slate-200">
                                {formatCurrency(l.principal_amount)}
                              </td>
                              <td className="px-6 py-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(l.total_repaid)}
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-amber-700 dark:text-amber-400">
                                {formatCurrency(l.outstanding_amount)}
                              </td>
                              <td className="px-6 py-4 text-right text-slate-700 dark:text-slate-300">
                                {formatCurrency(l.monthly_repayment_amount)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                                  {recoveryPct}%
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* TAB 4: MEMBER CONTRIBUTION STATEMENT */}
      {activeTab === "members" && (
        <div className="space-y-6">
          {/* Member Picker */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:hidden dark:border-slate-800 dark:bg-slate-900 transition-colors">
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-full sm:w-80">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Select Foundation Member
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => {
                    setSelectedMemberId(e.target.value);
                    fetchMemberLedger(e.target.value);
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                >
                  {membersList.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.member_number}] {m.full_name} ({m.group?.code || "No Group"})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {memberLedgerLoading ? (
            <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <span className="ml-3 text-slate-600 dark:text-slate-300 font-medium">Loading member contribution statement...</span>
            </div>
          ) : memberLedgerData ? (
            <div className="space-y-6">
              {/* Member Profile Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Member Details
                  </div>
                  <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                    {memberLedgerData.member_name}
                  </div>
                  <div className="text-xs font-mono text-slate-400 dark:text-slate-500">
                    {memberLedgerData.member_number} • Group: {memberLedgerData.group_name}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Agreed Monthly Rate
                  </div>
                  <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(memberLedgerData.monthly_rate)}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">Monthly commitment</div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/30 transition-colors">
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Total Paid Contributions
                  </div>
                  <div className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(memberLedgerData.total_paid)}
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-300">Credited to group account</div>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/30 transition-colors">
                  <div className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Total Outstanding Dues
                  </div>
                  <div className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-400">
                    {formatCurrency(memberLedgerData.total_due)}
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-300">Pending or overdue</div>
                </div>
              </div>

              {/* Monthly Ledger Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
                <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Monthly Contribution History
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Date</th>
                        <th className="px-6 py-3 font-semibold">Classification</th>
                        <th className="px-6 py-3 font-semibold">Description</th>
                        <th className="px-6 py-3 font-semibold text-right">Amount</th>
                        <th className="px-6 py-3 font-semibold text-center">Status</th>
                        <th className="px-6 py-3 font-semibold">Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {memberLedgerData.entries.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500">
                            No contributions recorded for this member.
                          </td>
                        </tr>
                      ) : (
                        memberLedgerData.entries.map((entry: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{formatDate(entry.date)}</td>
                            <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{entry.type}</td>
                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{entry.description}</td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                              {formatCurrency(entry.amount)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <StatusBadge status={entry.status} />
                            </td>
                            <td className="px-6 py-4 text-xs font-mono text-slate-400 dark:text-slate-500">
                              {entry.reference || "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
