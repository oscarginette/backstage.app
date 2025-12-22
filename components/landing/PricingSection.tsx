"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: "The Opening Act",
      description: "Perfect for artists just starting to build their list.",
      price: "Free",
      period: "forever",
      cta: "Start for Free",
      features: [
        { name: "Up to 500 contacts", included: true },
        { name: "Unlimited Smart Gates", included: true },
        { name: "Monthly Auto-Newsletter", included: true },
        { name: "Basic Audience Analytics", included: true },
        { name: "Removable Branding", included: false },
        { name: "Weekly Newsletters", included: false },
        { name: "Priority Support", included: false },
      ],
      highlight: false,
    },
    {
      name: "The Headliner",
      description: "For serious artists ready to own their audience.",
      price: isAnnual ? "$12" : "$15",
      period: "per month",
      billing: isAnnual ? "billed annually ($144)" : "billed monthly",
      cta: "Go Pro",
      features: [
        { name: "Unlimited contacts", included: true },
        { name: "Unlimited Smart Gates", included: true },
        { name: "Daily/Weekly Auto-Newsletter", included: true },
        { name: "Advanced Audience Insights", included: true },
        { name: "Remove 'Powered by Backstage'", included: true },
        { name: "Priority Support", included: true },
        { name: "Early Access to Features", included: true },
      ],
      highlight: true,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-muted/40 transition-colors duration-500">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-6xl font-serif mb-6">
            Simple pricing for <br />
            <span className="italic text-accent">independent</span> artists.
          </h2>
          <p className="text-xl text-foreground/60 mb-8">
            Start free, upgrade when you're ready to scale. No hidden fees.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center p-1 bg-white rounded-full border border-border">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                !isAnnual ? "bg-foreground text-background shadow-md" : "text-foreground/60 hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                isAnnual ? "bg-foreground text-background shadow-md" : "text-foreground/60 hover:text-foreground"
              }`}
            >
              Annual <span className="text-[10px] ml-1 opacity-80">(Save 20%)</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-8 rounded-[2rem] border transition-all duration-300 ${
                plan.highlight
                  ? "bg-white border-accent/20 shadow-[-10px_-10px_30px_4px_rgba(0,0,0,0.1),_10px_10px_30px_4px_rgba(45,78,255,0.15)] hover:shadow-2xl z-10 scale-[1.02]" // Corrected shadow for glow effect
                  : "bg-background/50 border-border hover:border-foreground/20 hover:shadow-lg"
              }`}
            >
              {plan.highlight && (
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-4">
                  <span className="bg-accent text-white px-4 py-1 rounded-full text-sm font-medium shadow-md rotate-3 inline-block">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-2xl font-serif mb-2">{plan.name}</h3>
                <p className="text-foreground/60 text-sm h-10">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold tracking-tight">{plan.price}</span>
                  <span className="text-foreground/40 font-medium">/{plan.period}</span>
                </div>
                {plan.billing && (
                  <p className="text-xs text-foreground/40 mt-2 font-medium">{plan.billing}</p>
                )}
              </div>

              <Link
                href="/dashboard"
                className={`w-full flex h-12 items-center justify-center rounded-xl text-base font-medium transition-all active:scale-95 ${
                  plan.highlight
                    ? "bg-foreground text-background hover:bg-foreground/90 shadow-lg"
                    : "bg-white border border-border hover:border-foreground text-foreground hover:bg-muted/20"
                }`}
              >
                {plan.cta}
              </Link>

              <div className="mt-8 space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground/40">Features</p>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      {feature.included ? (
                        <Check className={`w-5 h-5 flex-shrink-0 ${plan.highlight ? "text-accent" : "text-foreground"}`} />
                      ) : (
                        <X className="w-5 h-5 flex-shrink-0 text-muted-foreground/30" />
                      )}
                      <span className={feature.included ? "text-foreground/80" : "text-muted-foreground/40"}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        
        {/* FAQs tease or Trust indicators could go here */}
        <div className="mt-20 text-center">
            <p className="text-foreground/40 text-sm">
              Different needs? <a href="#" className="underline hover:text-foreground">Contact our sales team</a> for enterprise solutions.
            </p>
        </div>
      </div>
    </section>
  );
}
