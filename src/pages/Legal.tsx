export function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-20">
      <h1 className="text-5xl font-serif font-bold italic mb-12 underline decoration-brand-amber underline-offset-8">Privacy Architecture.</h1>
      <div className="prose prose-slate prose-brand-blue max-w-none space-y-8 text-brand-blue/80 leading-relaxed italic">
        <section className="space-y-4">
          <h2 className="text-3xl font-serif font-bold not-italic text-brand-blue">1. Data Ingestion</h2>
          <p>
            When you interact with the EntangledMinds matrix, we collect essential identifiers (Email, Name) needed to provide a personalized cognitive experience. We do not sell your neural meta-data to third-party entities.
          </p>
        </section>
        
        <section className="space-y-4">
          <h2 className="text-3xl font-serif font-bold not-italic text-brand-blue">2. Security Protocls</h2>
          <p>
            We implement state-of-the-art encryption to ensure that your saved tutorials and personal dialogues remain isolated from unauthorized access attempts.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-3xl font-serif font-bold not-italic text-brand-blue">3. Behavioral Tracking</h2>
          <p>
            We use minimum tracking cookies strictly to maintain your session across the platform's distributed nodes.
          </p>
        </section>
      </div>
    </div>
  );
}

export function Terms() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-20">
      <h1 className="text-5xl font-serif font-bold italic mb-12 underline decoration-brand-amber underline-offset-8">Code of Conduct.</h1>
      <div className="prose prose-slate prose-brand-blue max-w-none space-y-8 text-brand-blue/80 leading-relaxed italic">
        <section className="space-y-4">
          <h2 className="text-3xl font-serif font-bold not-italic text-brand-blue">1. Knowledge Integrity</h2>
          <p>
            By using EntangledMinds, you agree to approach the learning materials with intellectual honesty. Any attempt to scrape the collective for commercial re-use is strictly forbidden.
          </p>
        </section>
        
        <section className="space-y-4">
          <h2 className="text-3xl font-serif font-bold not-italic text-brand-blue">2. Community Etiquette</h2>
          <p>
            The dialogue sections are spaces for elevated cognitive exchange. Harassment, toxicity, or logical fallacies delivered with malice will result in immediate disconnection of your access.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-3xl font-serif font-bold not-italic text-brand-blue">3. Evolution of Terms</h2>
          <p>
            We reserve the right to evolve these protocols as the EntangledMinds network expands and adapts to new learning paradigms.
          </p>
        </section>
      </div>
    </div>
  );
}
