'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface ActivateSubscriptionModalProps {
  userCount: number;
  onClose: () => void;
  onConfirm: (plan: string, billingCycle: 'monthly' | 'annual', durationMonths: number) => void;
  loading: boolean;
}

type PlanType = 'free' | 'pro' | 'business' | 'unlimited';
type BillingCycle = 'monthly' | 'annual';

const PLAN_INFO = {
  free: {
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    contacts: 100,
    emails: 500,
  },
  pro: {
    name: 'Pro',
    monthlyPrice: 9.99,
    annualPrice: 99.99,
    contacts: 1000,
    emails: 5000,
  },
  business: {
    name: 'Business',
    monthlyPrice: 29.99,
    annualPrice: 299.99,
    contacts: 5000,
    emails: 25000,
  },
  unlimited: {
    name: 'Unlimited',
    monthlyPrice: 49.99,
    annualPrice: 499.99,
    contacts: 10000,
    emails: 'Unlimited',
  },
};

export default function ActivateSubscriptionModal({
  userCount,
  onClose,
  onConfirm,
  loading,
}: ActivateSubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('pro');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [durationMonths, setDurationMonths] = useState(1);

  const handleBillingCycleChange = (cycle: BillingCycle) => {
    setBillingCycle(cycle);
    setDurationMonths(cycle === 'annual' ? 12 : 1);
  };

  const handleConfirm = () => {
    onConfirm(selectedPlan, billingCycle, durationMonths);
  };

  const planInfo = PLAN_INFO[selectedPlan];
  const price = billingCycle === 'monthly' ? planInfo.monthlyPrice : planInfo.annualPrice;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="5xl"
      className="rounded-2xl"
      customHeader={
        <div className="px-8 py-5 border-b border-border bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Activate Subscription</h2>
              <p className="text-sm text-foreground/60 mt-0.5">
                Activating for {userCount} user{userCount > 1 ? 's' : ''}
              </p>
            </div>
            <Button
              onClick={onClose}
              disabled={loading}
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      }
    >
      <div className="p-8">
        <div className="grid grid-cols-[1fr,340px] gap-8">
          {/* Left Column - Plan Selection & Options */}
          <div className="space-y-6">
            {/* Plan Selection */}
            <div>
              <label className="block text-sm font-bold text-foreground mb-3">
                Subscription Plan
              </label>
              <div className="grid grid-cols-4 gap-3">
                {(Object.keys(PLAN_INFO) as PlanType[]).map((plan) => {
                  const info = PLAN_INFO[plan];
                  const isSelected = selectedPlan === plan;
                  return (
                    <button
                      key={plan}
                      onClick={() => setSelectedPlan(plan)}
                      disabled={loading}
                      className={`
                        relative p-4 rounded-xl border-2 transition-all text-left hover:scale-105
                        ${isSelected
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border hover:border-primary/30'
                        }
                      `}
                    >
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                      <div className="font-bold text-foreground text-xs uppercase tracking-wider mb-2">
                        {info.name}
                      </div>
                      <div className="text-[10px] text-foreground/50 leading-tight">
                        {info.contacts.toLocaleString()} contacts
                      </div>
                      <div className="text-[10px] text-foreground/50 leading-tight">
                        {typeof info.emails === 'number' ? `${info.emails.toLocaleString()} emails` : info.emails}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Billing Cycle & Duration */}
            <div className="grid grid-cols-2 gap-6">
              {/* Billing Cycle */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-3">
                  Billing Cycle
                </label>
                <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl">
                  <button
                    onClick={() => handleBillingCycleChange('monthly')}
                    disabled={loading}
                    className={`
                      flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all
                      ${billingCycle === 'monthly'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-foreground/50 hover:text-foreground'
                      }
                    `}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => handleBillingCycleChange('annual')}
                    disabled={loading}
                    className={`
                      flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all
                      ${billingCycle === 'annual'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-foreground/50 hover:text-foreground'
                      }
                    `}
                  >
                    Annual
                    <div className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-0.5">Save 17%</div>
                  </button>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-3">
                  Duration
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={billingCycle === 'annual' ? 5 : 24}
                    value={billingCycle === 'annual' ? durationMonths / 12 : durationMonths}
                    onChange={(e) => {
                      const value = Math.max(1, parseInt(e.target.value) || 1);
                      setDurationMonths(billingCycle === 'annual' ? value * 12 : value);
                    }}
                    disabled={loading}
                    className="w-full px-4 py-2.5 border-2 border-border rounded-xl focus:border-primary focus:outline-none transition-colors font-semibold text-foreground bg-background"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-foreground/40 font-medium pointer-events-none">
                    {billingCycle === 'annual' ? 'years' : 'months'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Price Summary */}
          <div className="bg-gradient-to-br from-muted/50 to-muted rounded-xl p-5 border border-border h-fit sticky top-0">
            <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider">
              Summary
            </h3>

            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground/60">Plan Price</span>
                <span className="font-bold text-sm text-foreground">
                  €{price.toFixed(2)}<span className="text-[10px] text-foreground/50 font-normal">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground/60">Duration</span>
                <span className="font-bold text-sm text-foreground">
                  {billingCycle === 'annual'
                    ? `${durationMonths / 12} year${durationMonths / 12 > 1 ? 's' : ''}`
                    : `${durationMonths} month${durationMonths > 1 ? 's' : ''}`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground/60">Users</span>
                <span className="font-bold text-sm text-foreground">{userCount}</span>
              </div>
            </div>

            <div className="h-px bg-border my-3"></div>

            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-foreground">Total</span>
              <span className="text-xl font-bold text-primary">
                €{(price * (billingCycle === 'annual' ? durationMonths / 12 : durationMonths) * userCount).toFixed(2)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleConfirm}
                disabled={loading}
                loading={loading}
                variant="primary"
                size="md"
                className="w-full gap-2 shadow-lg shadow-primary/20"
              >
                {loading ? (
                  'Activating...'
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirm Activation
                  </>
                )}
              </Button>
              <Button
                onClick={onClose}
                disabled={loading}
                variant="ghost"
                size="md"
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
