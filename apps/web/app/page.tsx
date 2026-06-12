import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <main className="relative min-h-[calc(100vh-7.5rem)] overflow-hidden bg-[radial-gradient(circle_at_top_left,#ffe4db_0,#f9f2eb_38%,#f6efe7_64%,#efe5dc_100%)] p-4 md:p-8">
      <div className="fashion-orb -top-28 -left-16 h-72 w-72 bg-[#ff9f85]/30" />
      <div className="fashion-orb -right-20 top-24 h-80 w-80 bg-[#d09cff]/18" />

      <div className="relative mx-auto flex w-full max-w-4xl items-center justify-center">
        <Card className="w-full border-black/10 bg-white/76 rise-in">
          <CardHeader>
            <Badge variant="accent" className="w-fit">
              Home
            </Badge>
            <CardTitle className="pt-3 text-4xl leading-tight md:text-5xl font-(--font-fashion-display)">
              DeepAgents
            </CardTitle>
            <CardDescription className="text-base leading-relaxed text-black/75">
              Start with the DeepAgents Search experience to ask questions and
              get web-grounded answers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/search" className={cn(buttonVariants({ size: "lg" }))}>
              Open DeepAgents Search
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
