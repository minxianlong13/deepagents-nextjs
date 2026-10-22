import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Database,
  FileText,
  Search,
  Settings2,
  Ticket,
  type LucideIcon,
} from "lucide-react";

type WorkflowLink = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

type WorkflowGroup = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  links: WorkflowLink[];
};

const workflowGroups: WorkflowGroup[] = [
  {
    id: "tool",
    title: "Tool",
    description: "Focused workflows for hands-on tasks.",
    icon: BriefcaseBusiness,
    links: [
      {
        title: "Ticket Analysis",
        description: "Summarize a Jira issue and identify its project.",
        href: "/ticket-analysis",
        icon: Ticket,
      },
      {
        title: "Resume Tailor",
        description: "Adapt your resume to a role.",
        href: "/resume",
        icon: FileText,
      },
    ],
  },
  {
    id: "chat",
    title: "Chat",
    description: "Ask questions and explore information.",
    icon: Search,
    links: [
      {
        title: "Tavily Search",
        description: "Research a question with web search.",
        href: "/search",
        icon: Search,
      },
      {
        title: "Local RAG",
        description: "Ask questions over your knowledge base.",
        href: "/rag",
        icon: Database,
      },
    ],
  },
  {
    id: "manage",
    title: "Manage",
    description: "Configure connected knowledge sources.",
    icon: Settings2,
    links: [
      {
        title: "RAG Config",
        description: "Choose and index knowledge-base content.",
        href: "/manage/rag",
        icon: Settings2,
      },
    ],
  },
];

export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-7.5rem)] bg-[linear-gradient(135deg,#fffaf7_0%,#f7f0e7_55%,#edf3ee_100%)] px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <header className="rise-in border-b border-black/10 pb-8 md:pb-10">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/50">
            <span
              className="size-2 rounded-full bg-emerald-700"
              aria-hidden="true"
            />
            AOE AI Workspace
          </div>
          <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-(--font-fashion-display) text-4xl leading-tight text-black md:text-5xl">
                What are you working on?
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-black/65 md:text-base">
                Choose a workflow to get started.
              </p>
            </div>
            <Link
              href="/ticket-analysis"
              className="inline-flex w-fit items-center gap-2 border-b border-emerald-800/40 pb-1 text-sm font-medium text-emerald-900 transition hover:border-emerald-900"
            >
              Start with a Jira ticket
              <ArrowUpRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </header>

        <div className="grid divide-y divide-black/10 md:grid-cols-3 md:divide-x md:divide-y-0">
          {workflowGroups.map((group, groupIndex) => {
            const GroupIcon = group.icon;
            return (
              <section
                key={group.id}
                aria-labelledby={`${group.id}-heading`}
                className={`rise-in-delayed py-7 md:px-6 md:py-8 ${
                  groupIndex === 0 ? "md:pl-0" : ""
                } ${groupIndex === workflowGroups.length - 1 ? "md:pr-0" : ""}`}
                style={{ animationDelay: `${groupIndex * 90}ms` }}
              >
                <div className="flex items-center gap-2 text-emerald-900">
                  <GroupIcon aria-hidden="true" size={17} strokeWidth={1.8} />
                  <h2
                    id={`${group.id}-heading`}
                    className="text-xs font-semibold uppercase tracking-[0.16em]"
                  >
                    {group.title}
                  </h2>
                </div>
                <p className="mt-2 min-h-10 text-sm leading-relaxed text-black/55">
                  {group.description}
                </p>

                <div className="mt-4">
                  {group.links.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="group flex items-center gap-3 border-t border-black/10 px-2 py-4 transition-colors hover:bg-white/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
                      >
                        <ItemIcon
                          aria-hidden="true"
                          className="shrink-0 text-black/55 transition-colors group-hover:text-emerald-800"
                          size={18}
                          strokeWidth={1.7}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-black">
                            {item.title}
                          </span>
                          <span className="mt-1 block text-xs leading-relaxed text-black/55">
                            {item.description}
                          </span>
                        </span>
                        <ArrowUpRight
                          aria-hidden="true"
                          className="shrink-0 text-black/35 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-800"
                          size={16}
                        />
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
