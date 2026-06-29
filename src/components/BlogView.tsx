import React, { useState } from 'react'

export interface BlogPost {
  id: string
  title: string
  category: 'ai' | 'funding' | 'strategy'
  date: string
  readTime: string
  excerpt: string
  content: string[]
}

const mockPosts: BlogPost[] = [
  {
    id: 'ai-underwriting',
    title: "AI Agent Adoption: Resolving Friction in Underwriting Operations",
    category: 'ai',
    date: "June 25, 2026",
    readTime: "4 min read",
    excerpt: "Richard McKellar discusses how context-aware AI agents streamline alternative finance and credit risk assessment, removing workflow bottlenecks.",
    content: [
      "As alternative finance and Merchant Cash Advance (MCA) platforms scale, operational friction remains one of the largest obstacles to maintaining volume. Traditional underwriting workflows are often bogged down by manual document review, mismatched bank statements, and delayed credit reports.",
      "By adopting custom context-aware AI agent architectures, funders can automate the ingestion and analysis of unstructured financial data. These agents extract key metrics, flag risk indicators, and cross-reference records in seconds, enabling underwriters to make faster, more informed decisions.",
      "Adopting AI workflows does not mean replacing human judgment; rather, it empowers team members by automating the repetitive triage phase. Establishing structured data pipelines with Slack or CRM hooks ensures that clean, validated files are delivered to decision-makers immediately, driving high-velocity growth."
    ]
  },
  {
    id: 'start-direct-funding',
    title: "Starting and Scaling as a Direct Funding Company",
    category: 'funding',
    date: "June 20, 2026",
    readTime: "5 min read",
    excerpt: "Key strategies for transitioning from an MCA brokerage model to direct lending operations, establishing syndication, and securing warehouse capital.",
    content: [
      "Transitioning from a brokerage structure to direct lending is a major milestone for alternative finance companies. While brokerages benefit from low overhead, direct funding offers superior margins, complete control over credit criteria, and long-term asset value.",
      "The path to starting a direct funding company begins with establishing robust syndication and capital networks. Developing structured risk models and underwriting frameworks is essential for attracting syndication partners and mitigating early portfolio loss.",
      "Additionally, leveraging technology to automate deal routing and ISO triage allows scaling funders to compete with larger players. A firm foundation in CRM workflows, automated risk grading, and clean ledger integration ensures capital is deployed efficiently and safely."
    ]
  },
  {
    id: 'workflow-audits',
    title: "Workflow Audits: Mapping Automated Lead Triage Pipelines",
    category: 'ai',
    date: "June 15, 2026",
    readTime: "6 min read",
    excerpt: "An in-depth look at implementing Slack, Feishu, and WeCom integrations to handle real-time lead routing and CRM setup.",
    content: [
      "In many organizations, lead response times are hindered by fragmented channels and manual distribution. A lead that sits for hours is highly likely to convert elsewhere, making real-time triage a critical business competency.",
      "Conducting an operational workflow audit helps identify where pipeline latency occurs. By integrating tools like Slack, Feishu, or WeCom directly with your CRM, incoming leads can be automatically analyzed, graded, and routed to the correct sales representative instantly.",
      "Automating this triage phase ensures that high-intent inquiries are prioritized and contacted within minutes. Deployed correctly, these automated integrations reduce operational overhead, eliminate routing errors, and maximize sales pipeline conversion rates."
    ]
  },
  {
    id: 'crm-setup-buildout',
    title: "CRM Setup and Buildout: CRM Scaling for MCA Operations",
    category: 'funding',
    date: "June 10, 2026",
    readTime: "5 min read",
    excerpt: "Optimizing Salesforce and custom CRM pipelines to scale ISO network distribution and automated deal routing.",
    content: [
      "A high-performing MCA brokerage or funding operation requires more than just capital; it requires a centralized system of record. Outgrown spreadsheets and fragmented tools lead to pipeline leakages, double-submitted deals, and frustrated ISO partners.",
      "An effective CRM setup and buildout structures lead and account records to reflect the realities of alternative finance. This includes tracking syndicate shares, renewal eligibility, commission payouts, and underwriting states on a single screen.",
      "Once the CRM architecture is optimized, automating deal flow—from application submission to contract generation—becomes straightforward. Empowering reps with clean pipelines and automated reminders ensures maximum contact frequency and consistent follow-up."
    ]
  }
]

interface BlogViewProps {
  initialCategory?: 'all' | 'ai' | 'funding'
  onBackToHome: () => void
}

export const BlogView: React.FC<BlogViewProps> = ({ initialCategory = 'all', onBackToHome }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'ai' | 'funding'>(initialCategory)
  const [activePostId, setActivePostId] = useState<string | null>(null)

  const filteredPosts = mockPosts.filter(
    (post) => selectedCategory === 'all' || post.category === selectedCategory
  )

  const activePost = mockPosts.find((post) => post.id === activePostId)

  return (
    <div className="w-full flex flex-col gap-8 animate-fade-in">
      {/* Blog Nav Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
        <button 
          onClick={onBackToHome}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>

        <span className="font-mono text-xs text-on-surface-subtle uppercase tracking-wider">
          Insights Journal
        </span>
      </div>

      {activePost ? (
        /* Blog Article Reader View */
        <article className="flex flex-col gap-6 max-w-3xl mx-auto w-full py-4 animate-fade-in-up">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                activePost.category === 'ai' 
                  ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' 
                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
              }`}>
                {activePost.category === 'ai' ? 'AI Insights' : 'Merchant Funding'}
              </span>
              <span className="text-xs text-on-surface-subtle font-mono">{activePost.date}</span>
            </div>
            <h1 className="font-display font-extrabold text-[28px] sm:text-[36px] leading-tight text-on-surface text-glow-primary">
              {activePost.title}
            </h1>
            <p className="text-xs font-mono text-on-surface-subtle mt-0.5">{activePost.readTime}</p>
          </div>

          <div className="rule my-1" />

          <div className="flex flex-col gap-4 text-sm sm:text-base text-on-surface-muted leading-relaxed">
            {activePost.content.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <div className="rule mt-6" />

          <button 
            onClick={() => setActivePostId(null)}
            className="self-start mt-4 flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Articles
          </button>
        </article>
      ) : (
        /* Blog Directory Listing View */
        <div className="flex flex-col gap-6">
          <div className="text-center sm:text-left">
            <h2 className="font-display font-extrabold text-[28px] sm:text-[34px] leading-tight text-on-surface">
              Advisory Publications
            </h2>
            <p className="text-sm text-on-surface-muted mt-2 max-w-xl">
              Thought leadership and technical guides exploring machine learning adoption, CRM architecture buildout, and Merchant Cash Advance scaling.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-2">
            {[
              { id: 'all', label: 'All Publications' },
              { id: 'ai', label: 'AI Insights' },
              { id: 'funding', label: 'Merchant Funding' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id as any)}
                className={`py-2 px-4 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                    : 'bg-black/25 border-white/5 text-on-surface-muted hover:border-white/10 hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Grid list of articles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {filteredPosts.map((post) => (
              <div 
                key={post.id} 
                className="glass-card rounded-2xl p-5 flex flex-col justify-between border-[var(--color-border)] hover:border-indigo-500/20 hover:scale-[1.005] duration-300"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                      post.category === 'ai' 
                        ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' 
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    }`}>
                      {post.category === 'ai' ? 'AI Insights' : 'Merchant Funding'}
                    </span>
                    <span className="text-[10px] text-on-surface-subtle font-mono">{post.date}</span>
                  </div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-on-surface leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-on-surface-muted leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-5 pt-3 border-t border-[var(--color-border)]">
                  <span className="text-[10px] font-mono text-on-surface-subtle">{post.readTime}</span>
                  <button 
                    onClick={() => setActivePostId(post.id)}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    Read Article
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
