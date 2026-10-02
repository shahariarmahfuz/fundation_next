"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { Pagination } from "@/components/Pagination";
import {
  Users,
  Search,
  Plus,
  Filter,
  Eye,
  Edit,
  Loader2,
  FolderTree,
  AlertCircle
} from "lucide-react";

export default function MembersListPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      const data = await api.get("/groups");
      setGroups(data);
    } catch {}
  };

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (search) params.append("search", search);
      if (selectedGroup) params.append("group_id", selectedGroup);
      if (selectedStatus) params.append("status", selectedStatus);

      const res = await api.get(`/members?${params.toString()}`);
      setMembers(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      setError(err.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [page, pageSize, selectedGroup, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMembers();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Members Directory</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Every active member belongs to a designated accounting group
          </p>
        </div>
        <Link href="/admin/members/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          Register Member
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, member number, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>

          <div>
            <select
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setPage(1);
              }}
              className="input-field"
            >
              <option value="">All Accounting Groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="input-field"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
            <button type="submit" className="btn-secondary">
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Member No.</th>
              <th>Full Name</th>
              <th>Phone</th>
              <th>Accounting Group</th>
              <th className="text-right">Monthly Due</th>
              <th className="text-right">Total Contributed</th>
              <th>Status</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-foundation-700" />
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  No members found matching your search.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.id}>
                  <td className="font-mono text-xs font-semibold text-slate-900">
                    {m.member_number}
                  </td>
                  <td className="font-semibold text-slate-900">{m.full_name}</td>
                  <td className="text-xs text-slate-600">{m.phone}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800">
                      <FolderTree className="h-3 w-3 text-foundation-700" />
                      {m.group?.name || `Group #${m.group_id}`}
                    </span>
                  </td>
                  <td className="text-right font-medium text-xs text-slate-900">
                    {formatCurrency(m.monthly_contribution_amount)}/mo
                  </td>
                  <td className="text-right font-semibold text-xs text-emerald-700">
                    {formatCurrency(m.total_contributions_paid)}
                  </td>
                  <td>
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/admin/members/${m.id}`}
                      className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-foundation-50 px-2.5 py-1 text-xs font-medium text-foundation-800 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Profile & Ledger
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(ps) => {
          setPageSize(ps);
          setPage(1);
        }}
      />
    </div>
  );
}
