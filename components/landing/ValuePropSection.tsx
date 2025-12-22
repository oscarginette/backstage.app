"use client";

import { Mail, Users, TrendingUp } from "lucide-react";

export default function ValuePropSection() {
  return (
    <section className="py-24 border-y border-border">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-6xl font-serif mb-6 leading-tight">
            1,000 Emails are way better <br />
            than <span className="text-accent italic">10k Followers</span>.
          </h2>
          <p className="text-xl text-foreground/60">
            Ownership is your superpower. Algorithms change, but your direct line to your fans never does.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1: Reach */}
          <div className="p-8 rounded-3xl bg-white border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-6">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-serif mb-4">Direct Reach</h3>
            <p className="text-foreground/60 leading-relaxed font-sans">
              Social platforms limit your organic reach to <span className="font-bold text-foreground">3-5%</span>. Email reaches <span className="font-bold text-foreground">99%</span> of your audience directly.
            </p>
          </div>

          {/* Card 2: Ownership */}
          <div className="p-8 rounded-3xl bg-white border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-6">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-serif mb-4">Total Ownership</h3>
            <p className="text-foreground/60 leading-relaxed">
              Rent your audience on Instagram or SoundCloud. Own it with your email list. If a platform disappears, your fans don't.
            </p>
          </div>

          {/* Card 3: Conversion */}
          <div className="p-8 rounded-3xl bg-white border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-serif mb-4">True Community</h3>
            <p className="text-foreground/60 leading-relaxed">
              A like is cheap. An email is a commitment. Build a base of supporters who actually show up to your shows and buy your merch.
            </p>
          </div>
        </div>
        
        {/* Comparison Graphic */}
        <div className="mt-16 p-8 md:p-12 rounded-[2rem] bg-foreground text-background overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-[100px]" />
          <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h4 className="text-3xl font-serif mb-4">The Math of Engagement</h4>
              <p className="text-background/60 text-lg">
                Your email list is your most valuable asset as an artist. We help you build it without you even trying.
              </p>
            </div>
            <div className="flex justify-around items-end gap-4 h-32">
              <div className="flex flex-col items-center gap-2 w-full">
                <div className="w-full bg-accent/20 h-8 rounded-t-lg transition-all hover:h-12" />
                <span className="text-xs font-medium">Social Reach</span>
              </div>
              <div className="flex flex-col items-center gap-2 w-full">
                <div className="w-full bg-accent h-32 rounded-t-lg shadow-[0_0_20px_rgba(255,85,0,0.5)]" />
                <span className="text-xs font-medium">Email Open Rate</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
