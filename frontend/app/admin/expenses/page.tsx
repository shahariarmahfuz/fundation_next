"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Pagination } from "@/components/Pagination";
import { Modal } from "@/components/Modal";
import {
  Receipt,
  Plus,
  FolderTree,
  Tag,
  AlertCircle,
  Loader2
} from "lucide-react";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Expense Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    group_id: "",
    category_id: "",
    amount: "1500.00",
    expense_date: new Date().toISOString().split("T")[0],
    payment_method: "CASH",
    payee: "",
    description: "",
    reference: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Category Modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [savingCat, setSavingCat] = useState(false);

  const fetchDropdowns = async () => {
    try {
      const [g, c] = await Promise.all([
        api.get("/groups"),
        api.get("/expense-categories"),
      ]);
      setGroups(g);
      setCategories(c);
      if (g.length > 0) setFormData((prev) => ({ ...prev, group_id: String(g[0].id) }));
      if (c.length > 0) setFormData((prev) => ({ ...prev, category_id: String(c[0].id) }));
    } catch {}
  };

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (selectedGroup) params.append("group_id", selectedGroup);
      if (selectedCategory) params.append("category_id", selectedCategory);

      const res = await api.get(`/expenses?${params.toString()}`);
      setExpenses(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      setError(err.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [page, pageSize, selectedGroup, selectedCategory]);

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post("/expenses", {
        ...formData,
        group_id: parseInt(formData.group_id),
        category_id: parseInt(formData.category_id),
        amount: parseFloat(formData.amount),
      });
      setModalOpen(false);
      fetchExpenses();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to record expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCat(true);
    try {
      await api.post("/expense-categories", {
        name: newCatName,
        description: newCatDesc,
      });
      setCatModalOpen(false);
      setNewCatName("");
      setNewCatDesc("");
      fetchDropdowns();
    } catch (err: any) {
      alert(err.message || "Failed to create category");
    } finally {
      setSavingCat(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Expenses & Outflow</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Track operational and program disbursements per accounting group
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCatModalOpen(true)} className="btn-secondary">
            <Tag className="h-4 w-4" />
            Add Category
          </button>
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Record Expense
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Filter by Group</label>
            <select
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setPage(1);
              }}
              className="input-field py-1.5 text-xs"
            >
              <option value="">All Groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Filter by Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="input-field py-1.5 text-xs"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Expense No.</th>
              <th>Date</th>
              <th>Category</th>
              <th>Group Account</th>
              <th>Description</th>
              <th>Payee</th>
              <th>Method</th>
              <th className="text-right">Amount (৳)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-foundation-700" />
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  No expenses recorded.
                </td>
              </tr>
            ) : (
              expenses.map((exp) => (
                <tr key={exp.id}>
                  <td className="font-mono text-xs font-semibold text-slate-900">
                    {exp.expense_number}
                  </td>
                  <td className="text-xs text-slate-500">{formatDate(exp.expense_date)}</td>
                  <td>
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                      {exp.category?.name}
                    </span>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      <FolderTree className="h-3 w-3 text-foundation-700" />
                      {exp.group?.name}
                    </span>
                  </td>
                  <td className="text-xs text-slate-700 max-w-sm truncate" title={exp.description}>
                    {exp.description}
                  </td>
                  <td className="text-xs text-slate-600">{exp.payee || "-"}</td>
                  <td className="font-mono text-xs text-slate-500">{exp.payment_method}</td>
                  <td className="text-right font-bold text-xs text-rose-700">
                    -{formatCurrency(exp.amount)}
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

      {/* Modal: Record Expense */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Foundation Expense"
      >
        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          {submitError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {submitError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Source Accounting Group <span className="text-rose-500">*</span>
            </label>
            <select
              required
              className="input-field font-semibold"
              value={formData.group_id}
              onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} (Balance: {formatCurrency(g.current_balance)})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-400">
              Expense will reduce this group&apos;s authoritative balance.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Expense Category <span className="text-rose-500">*</span>
            </label>
            <select
              required
              className="input-field"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Expense Amount (৳ BDT) <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="number"
              step="50"
              className="input-field"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Purchased insulin and clinical supplies for hospital patient"
              className="input-field"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payee / Recipient</label>
              <input
                type="text"
                placeholder="Vendor or hospital"
                className="input-field"
                value={formData.payee}
                onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                className="input-field"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              >
                <option value="CASH">CASH</option>
                <option value="BKASH">BKASH</option>
                <option value="NAGAD">NAGAD</option>
                <option value="BANK_TRANSFER">BANK TRANSFER</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Date</label>
            <input
              required
              type="date"
              className="input-field"
              value={formData.expense_date}
              onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Post Expense
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: New Category */}
      <Modal
        isOpen={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title="Add Expense Category"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name</label>
            <input
              required
              type="text"
              placeholder="e.g. Winter Clothing Aid"
              className="input-field"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <input
              type="text"
              placeholder="Category purpose"
              className="input-field"
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
            />
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button type="button" onClick={() => setCatModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={savingCat} className="btn-primary">
              {savingCat && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Category
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
