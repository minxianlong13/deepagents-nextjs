import type { Metadata } from "next";
import Link from "next/link";
import { Montserrat, Fira_Code } from "next/font/google";
import "./globals.css";

const fontSans = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const fontMono = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira-code",
});

export const metadata: Metadata = {
  title: "AOE Personal Helper",
  description:
    "Personal AI tools for research, knowledge, and career workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentYear = new Date().getFullYear();

  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <div className="mx-auto flex w-full max-w-[1440px] flex-1">
          <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-3 text-sidebar-foreground md:flex">
            <div className="mb-6 flex items-center gap-3 px-3 py-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
                A
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">AOE AI</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/40">
                  Personal helper
                </p>
              </div>
            </div>
            <nav aria-label="Primary" className="flex flex-col gap-4">
              <Link
                href="/"
                className="rounded-xl border border-sidebar-border border-l-2 border-l-sidebar-primary bg-sidebar-accent px-3 py-2.5 text-sm font-semibold tracking-tight text-sidebar-foreground transition hover:bg-sidebar-accent/80"
              >
                Home
              </Link>
              <section
                aria-labelledby="desktop-tools-heading"
                className="border-t border-sidebar-border/70 pt-4"
              >
                <h2
                  id="desktop-tools-heading"
                  className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45"
                >
                  Tool
                </h2>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/ticket-analysis"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  >
                    Ticket Analysis
                  </Link>
                  <Link
                    href="/resume"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  >
                    Resume Tailor
                  </Link>
                </div>
              </section>
              <section
                aria-labelledby="desktop-chat-heading"
                className="border-t border-sidebar-border/70 pt-4"
              >
                <h2
                  id="desktop-chat-heading"
                  className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45"
                >
                  Chat
                </h2>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/search"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  >
                    Tavily Search
                  </Link>
                  <Link
                    href="/rag"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  >
                    Local RAG
                  </Link>
                </div>
              </section>
              <section
                aria-labelledby="desktop-manage-heading"
                className="border-t border-sidebar-border/70 pt-4"
              >
                <h2
                  id="desktop-manage-heading"
                  className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45"
                >
                  Manage
                </h2>
                <Link
                  href="/manage/rag"
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  RAG Config
                </Link>
              </section>
            </nav>
            <p className="mt-auto px-3 pt-8 text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/30">
              AOE / {currentYear}
            </p>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="border-b border-sidebar-border bg-sidebar p-3 text-sidebar-foreground md:hidden">
              <nav aria-label="Primary mobile" className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/"
                    className="rounded-xl border border-sidebar-border border-l-2 border-l-sidebar-primary bg-sidebar-accent px-3 py-1.5 text-sm font-semibold text-sidebar-foreground transition hover:bg-sidebar-accent/80"
                  >
                    Home
                  </Link>
                </div>
                <section
                  aria-labelledby="mobile-tools-heading"
                  className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-2"
                >
                  <h2
                    id="mobile-tools-heading"
                    className="pt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45"
                  >
                    Tool
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/ticket-analysis"
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    >
                      Ticket Analysis
                    </Link>
                    <Link
                      href="/resume"
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    >
                      Resume Tailor
                    </Link>
                  </div>
                </section>
                <section
                  aria-labelledby="mobile-chat-heading"
                  className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-2"
                >
                  <h2
                    id="mobile-chat-heading"
                    className="pt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45"
                  >
                    Chat
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/search"
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    >
                      Tavily Search
                    </Link>
                    <Link
                      href="/rag"
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    >
                      Local RAG
                    </Link>
                  </div>
                </section>
                <section
                  aria-labelledby="mobile-manage-heading"
                  className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-2"
                >
                  <h2
                    id="mobile-manage-heading"
                    className="pt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45"
                  >
                    Manage
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/manage/rag"
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    >
                      RAG Config
                    </Link>
                  </div>
                </section>
              </nav>
            </div>
            {children}
          </div>
        </div>

        <footer className="border-t border-border bg-card">
          <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between px-4 text-xs text-muted-foreground md:px-8">
            <p>© {currentYear} AOE AI</p>
            <p>Built for clear, practical answers</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
