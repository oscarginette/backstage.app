"use client";

export default function ProblemSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container px-4 mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-serif leading-tight mb-6">
              You're a DJ, not a <br />
              <span className="italic underline decoration-accent/30 decoration-8 underline-offset-4">Marketing Manager</span>.
            </h2>
            <p className="text-lg text-foreground/70 mb-8 leading-relaxed">
              We know the struggle. You spend hours in the studio, perfecting every transition and sound. The last thing you want to do is figure out how to manage a newsletter or track who's actually listening.
            </p>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">1</div>
                <div>
                  <h4 className="font-bold mb-1">Ditch the Manual Work</h4>
                  <p className="text-foreground/60">No more manual exports or messy spreadsheets of contacts.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">2</div>
                <div>
                  <h4 className="font-bold mb-1">Focus on Content</h4>
                  <p className="text-foreground/60">Your only job is to upload your music. Growth happens in the background.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="aspect-square rounded-3xl bg-white border border-border shadow-xl overflow-hidden p-8 flex flex-col justify-center">
               <div className="space-y-4">
                  <div className="h-3 w-2/3 bg-muted rounded-full" />
                  <div className="h-3 w-5/6 bg-muted rounded-full" />
                  <div className="h-3 w-1/2 bg-muted rounded-full" />
                  <div className="h-24 w-full border-2 border-dashed border-accent/20 rounded-2xl flex items-center justify-center text-accent/40 font-serif italic text-xl">
                    Focus on the music
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full" />
                  <div className="h-3 w-4/5 bg-muted rounded-full" />
               </div>
               
               {/* Decorative Element */}
               <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent/20 rounded-full blur-2xl" />
               <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
            </div>
            
            {/* Overlay Tag */}
            <div className="absolute top-1/2 -right-8 -translate-y-1/2 rotate-3 bg-white px-6 py-4 rounded-2xl shadow-2xl border border-border">
              <p className="font-serif italic text-xl text-accent">"Too busy making hits"</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
