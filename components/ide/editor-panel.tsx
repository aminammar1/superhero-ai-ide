"use client";

import { Play, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CodeEditor } from "@/components/ide/code-editor";
import { runCode } from "@/services/api";
import { useAppStore } from "@/store/app-store";
import type { Language } from "@/lib/types";

const languages: Array<{ label: string; value: Language }> = [
  { label: "TypeScript", value: "typescript" },
  { label: "JavaScript", value: "javascript" },
  { label: "Python", value: "python" },
  { label: "Go", value: "go" },
  { label: "Java", value: "java" },
  { label: "C", value: "c" },
  { label: "C++", value: "cpp" }
];

export function EditorPanel() {
  const language = useAppStore((state) => state.language);
  const code = useAppStore((state) => state.code);
  const output = useAppStore((state) => state.output);
  const isRunningCode = useAppStore((state) => state.isRunningCode);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const setCode = useAppStore((state) => state.setCode);
  const setOutput = useAppStore((state) => state.setOutput);
  const setRunningCode = useAppStore((state) => state.setRunningCode);

  const handleRun = async () => {
    setRunningCode(true);
    try {
      const result = await runCode({ language, code });
      setOutput(result);
      toast.success(`Execution finished with exit code ${result.exit_code}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Code execution failed.");
    } finally {
      setRunningCode(false);
    }
  };

  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex min-h-[70vh] flex-col gap-5">
      <Card className="hero-pattern flex-1">
        <CardHeader className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <Badge variant="accent">Code Editor</Badge>
            <CardTitle className="mt-3 text-3xl">Sandbox workspace</CardTitle>
            <CardDescription>
              Monaco editor with multi-language execution routed through the FastAPI gateway.
            </CardDescription>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="min-w-[180px]">
              <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="secondary">
              <Sparkles className="h-4 w-4" />
              Voice-to-code ready
            </Button>
            <Button onClick={handleRun} disabled={isRunningCode}>
              <Play className="h-4 w-4" />
              {isRunningCode ? "Running..." : "Run sandbox"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 xl:grid-cols-[1.2fr_0.55fr]">
          <div className="overflow-hidden rounded-[22px] border border-white/10 bg-slate-950/80">
            <div className="h-[560px]">
              <CodeEditor language={language} value={code} onChange={setCode} />
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-5">
              <p className="metric-label">Execution status</p>
              <p className="mt-3 font-display text-2xl">
                {isRunningCode ? "Sandbox running" : output ? "Last run completed" : "Ready"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Use the hero agent to generate starter code, then execute it in the isolated runtime.
              </p>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-slate-950/70 p-5">
              <div className="flex items-center justify-between">
                <p className="metric-label">Console output</p>
                {output ? (
                  <Badge variant={output.exit_code === 0 ? "accent" : "default"}>
                    exit {output.exit_code}
                  </Badge>
                ) : null}
              </div>
              <Separator className="my-4" />
              <pre className="scrollbar-thin max-h-[330px] overflow-auto whitespace-pre-wrap text-sm text-slate-200">
                {output
                  ? [output.stdout, output.stderr].filter(Boolean).join("\n\n") || "Program completed with no console output."
                  : "Run your code to see stdout and stderr here."}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
}
