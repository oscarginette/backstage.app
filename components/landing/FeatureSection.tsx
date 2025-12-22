"use client";

import { CheckCircle2, Zap, Palette, BarChart3 } from "lucide-react";

export default function FeatureSection() {
  const features = [
    {
      title: "Smart Gate System",
      description: "Fans exchange their email for your latest track. No more manual link sending.",
      icon: <Zap className="w-5 h-5" />,
    },
    {
      title: "Auto-Newsletter",
      description: "Notify your entire community automatically whenever you drop something new.",
      icon: <Palette className="w-5 h-5" />,
    },
    {
      title: "Audience Analytics",
      description: "See who is vibing with your music the most. Real data for real artists.",
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      title: "Zero Effort Setup",
      description: "Connect your SoundCloud and Brevo in seconds. We handle the technical plumbing.",
      icon: <CheckCircle2 className="w-5 h-5" />,
    }
  ];

  return (
    <section className="py-24">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row gap-16 items-start">
          <div className="md:w-1/3 sticky top-24">
            <h2 className="text-5xl font-serif mb-6 leading-tight">
              Powerful tools, <br />
              <span className="italic text-accent underline decoration-accent/20">invisible</span> work.
            </h2>
            <p className="text-foreground/60 text-lg mb-8">
              We've built everything you need to scale your community while you stay creative.
            </p>
          </div>
          
          <div className="md:w-2/3 grid sm:grid-cols-2 gap-x-12 gap-y-16">
            {features.map((feature, index) => (
              <div key={index} className="flex flex-col gap-4">
                <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-accent bg-white shadow-sm">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-serif leading-none">{feature.title}</h3>
                <p className="text-foreground/60 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
