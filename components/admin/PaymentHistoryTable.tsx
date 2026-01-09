/**
 * PaymentHistoryTable Component
 *
 * Admin component for viewing payment history with filters and pagination.
 * Displays both Stripe payments and manual payments.
 *
 * Clean Architecture: Client component with API orchestration.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, DollarSign, Calendar, Filter, Download } from 'lucide-react';
import Toast from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import { INPUT_STYLES, cn } from '@/domain/types/design-tokens';

interface PaymentHistoryEntry {
  id: string;
  customer_id: number;
  customer_email: string;
  customer_name: string | null;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: string;
  paid: boolean;
  paid_at: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  payment_notes: string | null;
  manually_created: boolean;
  created_by_admin_email: string | null;
  created_by_admin_name: string | null;
  billing_reason: string | null;
  subscription_id: string | null;
  created: string;
  description: string | null;
}

interface PaymentHistoryTableProps {
  onAddPayment?: () => void;
}

export default function PaymentHistoryTable({ onAddPayment }: PaymentHistoryTableProps) {
  const [payments, setPayments] = useState<PaymentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterManual, setFilterManual] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Fetch payment history
  const fetchPayments = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });

      if (filterMethod !== 'all') {
        params.append('payment_method', filterMethod);
      }

      if (filterManual === 'manual') {
        params.append('manually_created', 'true');
      } else if (filterManual === 'stripe') {
        params.append('manually_created', 'false');
      }

      const response = await fetch(`/api/admin/payments?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }

      const data = await response.json();

      setPayments(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setToast({ message: 'Failed to load payment history', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchPayments();
  }, [page, filterMethod, filterManual]);

  // Filter payments by search term
  const filteredPayments = useMemo(() => {
    if (!searchTerm) return payments;

    const term = searchTerm.toLowerCase();
    return payments.filter(
      (payment) =>
        payment.customer_email.toLowerCase().includes(term) ||
        payment.customer_name?.toLowerCase().includes(term) ||
        payment.payment_reference?.toLowerCase().includes(term) ||
        payment.id.toLowerCase().includes(term)
    );
  }, [payments, searchTerm]);

  // Format amount in EUR
  const formatAmount = (amountInCents: number, currency: string) => {
    const amount = amountInCents / 100;
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get payment method badge
  const getPaymentMethodBadge = (payment: PaymentHistoryEntry) => {
    if (payment.manually_created) {
      const method = payment.payment_method || 'manual';
      const colors: Record<string, string> = {
        bank_transfer: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
        paypal: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400',
        cash: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
        crypto: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400',
        other: 'bg-secondary text-foreground/60',
      };
      return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${colors[method] || colors.other}`}>
          {method.replace('_', ' ').toUpperCase()}
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400">
        STRIPE
      </span>
    );
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
      open: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
      draft: 'bg-secondary text-foreground/60',
      void: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
      uncollectible: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || colors.draft}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={true}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Payment History</h2>
          <p className="text-sm text-foreground/60 mt-1">
            Total: {total} payments
          </p>
        </div>
        {onAddPayment && (
          <Button
            onClick={onAddPayment}
            variant="primary"
            size="md"
            className="gap-2"
          >
            <DollarSign size={18} />
            Add Manual Payment
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/40" size={18} />
            <input
              type="text"
              placeholder="Search by email, name, reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(INPUT_STYLES.base, INPUT_STYLES.appearance, INPUT_STYLES.text, INPUT_STYLES.focus, INPUT_STYLES.focusColors.primary, 'pl-10')}
            />
          </div>

          {/* Payment Method Filter */}
          <div>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className={cn(INPUT_STYLES.base, INPUT_STYLES.appearance, INPUT_STYLES.text, INPUT_STYLES.focus, INPUT_STYLES.focusColors.primary)}
            >
              <option value="all">All Payment Methods</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="paypal">PayPal</option>
              <option value="cash">Cash</option>
              <option value="crypto">Crypto</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Manual/Stripe Filter */}
          <div>
            <select
              value={filterManual}
              onChange={(e) => setFilterManual(e.target.value)}
              className={cn(INPUT_STYLES.base, INPUT_STYLES.appearance, INPUT_STYLES.text, INPUT_STYLES.focus, INPUT_STYLES.focusColors.primary)}
            >
              <option value="all">All Sources</option>
              <option value="manual">Manual Only</option>
              <option value="stripe">Stripe Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/40 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/40 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/40 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/40 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/40 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/40 uppercase tracking-wider">
                  Reference
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-foreground/50">
                    Loading...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-foreground/50">
                    No payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-muted/40">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {payment.customer_name || 'N/A'}
                        </div>
                        <div className="text-sm text-foreground/50">{payment.customer_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-foreground">
                        {formatAmount(payment.amount_paid, payment.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPaymentMethodBadge(payment)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{formatDate(payment.paid_at)}</div>
                      <div className="text-xs text-foreground/50">
                        Created: {formatDate(payment.created)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground max-w-xs">
                        {payment.payment_reference || payment.id}
                      </div>
                      {payment.payment_notes && (
                        <div className="text-xs text-foreground/50 mt-1 max-w-xs truncate" title={payment.payment_notes}>
                          {payment.payment_notes}
                        </div>
                      )}
                      {payment.manually_created && payment.created_by_admin_email && (
                        <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                          by {payment.created_by_admin_email}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 py-4">
          <Button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            variant="secondary"
            size="sm"
          >
            Previous
          </Button>
          <span className="text-sm text-foreground/60">
            Page {page} of {totalPages}
          </span>
          <Button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            variant="secondary"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
