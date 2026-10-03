"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api, getStoredUser } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Pagination } from "@/components/Pagination";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  Gift,
  PlusCircle,
  FolderTree,
  User,
  HeartHandshake,
  Users,
  Search,
  Filter,
  CreditCard,
  Calendar,
  AlertCircle,
  Loader2,
  Receipt,
  Coins
} from "lucide-react";

export default function DonationsPage() {
  const [donations, setDonations] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [selectedGroup, setSelectedGroup] = useState("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const canCreate =
    user?.is_superuser ||
    user?.role?.name === "Super Admin" ||
    user?.role?.permissions?.some((p: any) => p.code === "donations.create");

  const fetchDropdowns = async () => {
    try {
      const g = await api.get("/groups");
      setGroups(g || []);
    } catch {}
  };

  const fetchDonations = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (selectedGroup) params.append("group_id", selectedGroup);
      if (sourceTypeFilter) params.append("source_type", sourceTypeFilter);
      if (search) params.append("search", search);

      const res = await api.get(`/donations?${params.toString()}`);
      setDonations(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err: any) {
      setError(err.message || "Failed to load donations list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchDonations();
  }, [page, pageSize, selectedGroup, sourceTypeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDonations();
  };

  // Calculate quick summary metrics from current items
  const totalAmountOnPage = donations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Manage Donations
            </h1>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
              {total} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Philanthropic donations received from External Donors and Foundation Members, credited directly to accounting groups
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/donors" className="btn-secondary text-xs">
            <HeartHandshake className="h-4 w-4 text-emerald-600" />
            Manage Donors
          </Link>
          {canCreate && (
            <Link href="/admin/donations/new" className="btn-primary text-xs">
              <PlusCircle className="h-4 w-4" />
              Record Donation
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 p-4 text-xs sm:text-sm text-rose-800 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by receipt #, reference, donor name, member name..."
            className="input-field pl-9 text-xs sm:text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Source Type Filter */}
          <div className="w-36">
            <CustomSelect
              value={sourceTypeFilter}
              onChange={(val) => {
                setSourceTypeFilter(String(val));
                setPage(1);
              }}
              options={[
                { value: "", label: "All Sources" },
                { value: "DONOR", label: "External Donors" },
                { value: "MEMBER", label: "Foundation Members" },
              ]}
              searchable={false}
            />
          </div>

          {/* Group Filter */}
          <div className="w-44">
            <CustomSelect
              value={selectedGroup}
              onChange={(val) => {
                setSelectedGroup(String(val));
                setPage(1);
              }}
              options={[
                { value: "", label: "All Groups" },
                ...groups.map((g) => ({
                  value: String(g.id),
                  label: g.name,
                  sublabel: g.code,
                })),
              ]}
              searchable={true}
            />
          </div>
        </div>
      </div>

      {/* Donations Table */}
      <div className="table-container">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Receipt / ID</th>
              <th>Source Type</th>
              <th>Donor / Member</th>
              <th>Credited Group</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Date</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
                  <span className="mt-2 block text-xs text-slate-400">Loading donations...</span>
                </td>
              </tr>
            ) : donations.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                  No donation records found.
                </td>
              </tr>
            ) : (
              donations.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  {/* Receipt Number */}
                  <td>
                    <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                      {d.donation_number}
                    </span>
                  </td>

                  {/* Source Type Badge */}
                  <td>
                    {d.source_type === "MEMBER" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                        <Users className="h-3 w-3" />
                        Member
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <HeartHandshake className="h-3 w-3" />
                        Donor
                      </span>
                    )}
                  </td>

                  {/* Contributor (Member or Donor) */}
                  <td>
                    {d.source_type === "MEMBER" ? (
                      d.member ? (
                        <Link
                          href={`/admin/members/${d.member.id}`}
                          className="group block text-xs"
                        >
                          <div className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                            {d.member.full_name}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {d.member.member_number}
                          </div>
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-500">Member #{d.member_id}</span>
                      )
                    ) : d.donor ? (
                      <Link
                        href={`/admin/donors/${d.donor.id}`}
                        className="group block text-xs"
                      >
                        <div className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                          {d.donor.name}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {d.donor.donor_number}
                        </div>
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-500">Anonymous / #{d.donor_id}</span>
                    )}
                  </td>

                  {/* Credited Group */}
                  <td>
                    <div className="flex items-center gap-1.5 text-xs">
                      <FolderTree className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {d.group?.name}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        ({d.group?.code})
                      </span>
                    </div>
                  </td>

                  {/* Amount */}
                  <td>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm">
                      {formatCurrency(d.amount)}
                    </span>
                  </td>

                  {/* Method */}
                  <td>
                    <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {d.payment_method?.replace("_", " ")}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="text-xs text-slate-600 dark:text-slate-400">
                    {formatDate(d.donation_date)}
                  </td>

                  {/* Reference */}
                  <td className="text-xs text-slate-500 dark:text-slate-400">
                    {d.reference || d.notes || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(ps) => {
          setPageSize(ps);
          setPage(1);
        }}
      />
    </div>
  );
}
