"use client";

import {
  BarChart3,
  Users,
  Mail,
  Music,
  Settings,
  Plus,
  ArrowUpRight,
  CheckCircle2
} from "lucide-react";
import { useTranslations } from '@/lib/i18n/context';
import { AnimatedStat } from './AnimatedStat';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ProductShowcase() {
  const t = useTranslations('hero'); // Reuse hero strings if needed or just hardcode for the mockup

  return (
    <section className="py-24 bg-muted/30 dark:bg-background overflow-hidden transition-colors duration-500">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-6xl font-serif mb-6 text-foreground">
             Your command center <br />
            <span className="italic text-accent">for growth.</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Manage your fanbase, downloads, and newsletters from one beautiful dashboard.
          </p>
        </div>

        {/* Browser Window mockup */}
        <div className="relative max-w-7xl mx-auto">
           {/* Glow layout */}
          <div className="absolute -inset-4 bg-gradient-to-tr from-accent/10 to-purple-500/10 dark:from-accent/20 dark:to-purple-500/20 rounded-[2.5rem] blur-3xl -z-10" />

          <Card variant="default" padding="sm" className="rounded-[20px] shadow-2xl overflow-hidden ring-1 ring-border mx-4 md:mx-0">
            {/* Window Controls */}
            <div className="h-10 bg-muted/50 dark:bg-card/50 border-b border-border flex items-center px-4 justify-between backdrop-blur-sm">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-black/10 dark:border-white/10" />
                <div className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-black/10 dark:border-white/10" />
                <div className="w-3 h-3 rounded-full bg-[#28C840] border border-black/10 dark:border-white/10" />
              </div>
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-card rounded-md text-[10px] text-muted-foreground font-medium border border-border shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                backstage.app/dashboard
              </div>
              <div className="w-16" />
            </div>

            {/* App Interface */}
            <div className="min-h-[500px] bg-background p-6 font-sans transition-colors duration-500">
              
              {/* App Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-serif text-foreground mb-1">The Backstage</h1>
                  <p className="text-sm text-muted-foreground font-light">The Artist's Command Center</p>
                </div>
                <div className="text-right">
                   <div className="text-sm font-medium text-foreground">contact@alexmusic.com</div>
                   <div className="text-[10px] text-muted-foreground tracking-wider uppercase mb-2">ARTIST</div>
                   <Button variant="secondary" size="xs" className="rounded-full gap-2">
                      <Settings className="w-3 h-3" />
                      SETTINGS
                   </Button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="bg-card p-1.5 rounded-2xl border border-border shadow-sm inline-flex mb-6 w-full md:w-auto overflow-x-auto">
                  <div className="flex items-center gap-1">
                    <Button variant="primary" size="xs" className="rounded-xl gap-2 shadow-md">
                       <BarChart3 className="w-3.5 h-3.5" />
                       Overview
                    </Button>
                    <Button variant="ghost" size="xs" className="rounded-xl gap-2 text-muted-foreground hover:text-foreground">
                       <Music className="w-3.5 h-3.5" />
                       Download Gates
                    </Button>
                    <Button variant="ghost" size="xs" className="rounded-xl gap-2 text-muted-foreground hover:text-foreground">
                       <Mail className="w-3.5 h-3.5" />
                       Emails & Newsletters
                    </Button>
                    <Button variant="ghost" size="xs" className="rounded-xl gap-2 text-muted-foreground hover:text-foreground">
                       <Users className="w-3.5 h-3.5" />
                       Audience
                    </Button>
                  </div>
              </div>

              {/* Main Content Area */}
              <div className="space-y-6">

                 {/* Stats Row */}
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { label: "AUDIENCE", value: "2,840", icon: <Users className="w-4 h-4 text-blue-500" /> },
                      { label: "DOWNLOADS", value: "15.2k", icon: <CheckCircle2 className="w-4 h-4 text-accent" /> },
                      { label: "ENGAGEMENT", value: "1,204", icon: <BarChart3 className="w-4 h-4 text-purple-500" /> },
                      { label: "CONVERSION", value: "33.2%", icon: <ArrowUpRight className="w-4 h-4 text-green-500" /> },
                    ].map((stat, i) => (
                      <AnimatedStat
                        key={i}
                        label={stat.label}
                        value={stat.value}
                        icon={stat.icon}
                      />
                    ))}
                 </div>

                 {/* Active Gates Section */}
                 <div>
                    <div className="flex justify-between items-center mb-4">
                       <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-accent/10 dark:bg-accent/20 rounded-lg text-accent transition-colors"><Music className="w-3.5 h-3.5" /></span>
                          <h3 className="text-lg font-serif text-foreground">Active Gates</h3>
                       </div>
                       <Button variant="primary" size="xs" className="rounded-lg gap-1.5">
                          <Plus className="w-3 h-3" />
                          Create New
                       </Button>
                    </div>

                    <Card variant="default" padding="sm" className="shadow-sm">
                       {/* List Item 1 */}
                       <div className="group flex items-center gap-3 p-3 hover:bg-muted/20 rounded-xl transition-colors cursor-default">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg shadow-inner flex items-center justify-center text-white font-bold text-xs flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                             <h4 className="font-bold text-sm text-foreground truncate">Midnight City - Extended Mix</h4>
                             <p className="text-xs text-muted-foreground">Tech House • Released 2 days ago</p>
                          </div>

                          <div className="hidden md:flex items-center gap-6 mr-4">
                             <div className="text-right">
                                <div className="font-bold text-sm text-foreground">1,204</div>
                                <div className="text-[10px] text-muted-foreground uppercase">Downloads</div>
                             </div>
                             <div className="text-right">
                                <div className="font-bold text-sm text-foreground">85%</div>
                                <div className="text-[10px] text-muted-foreground uppercase">Conversion</div>
                             </div>
                          </div>
                          <div className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer flex-shrink-0 transition-colors">
                             <ArrowUpRight className="w-3.5 h-3.5" />
                          </div>
                       </div>
                    </Card>
                 </div>

                 {/* Two Columns: Campaign History & Growth Engine */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Growth Engine Banner */}
                    <Card variant="default" padding="md" className="shadow-sm flex flex-col justify-center items-start">
                       <div className="mb-3">
                          <h3 className="text-xl font-serif mb-1.5 text-foreground">Growth Engine</h3>
                          <p className="text-sm text-muted-foreground">Create high-converting download gates to grow your audience automatically.</p>
                       </div>
                       <Button variant="primary" size="sm" className="rounded-lg shadow-lg">
                          Start New Campaign
                       </Button>
                    </Card>

                    {/* Empty State / History */}
                    <Card variant="default" padding="md" className="shadow-sm flex flex-col items-center justify-center text-center">
                       <div className="w-10 h-10 bg-muted/30 dark:bg-muted/50 rounded-xl flex items-center justify-center mb-3 text-muted-foreground transition-colors">
                          <Mail className="w-5 h-5" />
                       </div>
                       <h4 className="font-serif text-base mb-1 text-foreground">Campaign History</h4>
                       <p className="text-xs text-muted-foreground">Your sent newsletters will appear here</p>
                    </Card>
                 </div>

              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
