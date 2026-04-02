"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Mic, Send, Volume2, WandSparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AvatarStage } from "@/components/agent/avatar-stage";
import { ChatMessageBubble } from "@/components/agent/chat-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { generateCode, requestTextToSpeech, streamChat } from "@/services/api";
import { useAppStore } from "@/store/app-store";
import { useSpeechRecognition } from "@/features/agent/use-speech-recognition";
import { heroThemeMap } from "@/themes/superheroes";

export function AgentPanel() {
  const theme = useAppStore((state) => state.theme);
  const profile = useAppStore((state) => state.profile);
  const language = useAppStore((state) => state.language);
  const code = useAppStore((state) => state.code);
  const messages = useAppStore((state) => state.messages);
  const transcript = useAppStore((state) => state.transcript);
  const isStreamingChat = useAppStore((state) => state.isStreamingChat);
  const voiceEnabled = useAppStore((state) => state.voiceEnabled);
  const isListening = useAppStore((state) => state.isListening);
  const setCode = useAppStore((state) => state.setCode);
  const pushMessage = useAppStore((state) => state.pushMessage);
  const startAssistantMessage = useAppStore((state) => state.startAssistantMessage);
  const appendAssistantChunk = useAppStore((state) => state.appendAssistantChunk);
  const setStreamingChat = useAppStore((state) => state.setStreamingChat);
  const setVoiceEnabled = useAppStore((state) => state.setVoiceEnabled);
  const setListening = useAppStore((state) => state.setListening);
  const setTranscript = useAppStore((state) => state.setTranscript);

  const [chatInput, setChatInput] = useState("");
  const [codePrompt, setCodePrompt] = useState(
    "Build me a REST API in Go with a health route and JSON response."
  );
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const hero = heroThemeMap[theme];

  const { supported, startListening, stopListening } = useSpeechRecognition({
    onResult: (value) => setTranscript(value)
  });

  useEffect(() => {
    if (messages.length > 0 || !profile?.username) {
      return;
    }

    pushMessage({
      id: crypto.randomUUID(),
      role: "assistant",
      content: `Suit linked. ${hero.name} is online and ready to help ${profile.username}.`,
      createdAt: new Date().toISOString()
    });
  }, [hero.name, messages.length, profile?.username, pushMessage]);

  const history = useMemo(
    () =>
      messages.slice(-8).map((message) => ({
        role: message.role,
        content: message.content
      })),
    [messages]
  );

  const handleToggleListening = () => {
    if (!supported) {
      toast.error("Browser speech recognition is not available in this environment.");
      return;
    }

    if (isListening) {
      stopListening();
      setListening(false);
      return;
    }

    setTranscript("");
    setListening(true);
    startListening();
  };

  const playVoice = async (text: string) => {
    if (!voiceEnabled || !text.trim()) {
      return;
    }

    try {
      const blob = await requestTextToSpeech({ text, heroTheme: theme });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();
      audio.onended = () => URL.revokeObjectURL(url);
    } catch {
      toast.message("Voice output is unavailable. The text response is still ready.");
    }
  };

  const handleSendChat = async () => {
    const prompt = chatInput.trim() || transcript.trim();
    if (!prompt) {
      return;
    }

    const assistantMessageId = crypto.randomUUID();

    pushMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
      createdAt: new Date().toISOString()
    });
    startAssistantMessage(assistantMessageId);
    setChatInput("");
    setTranscript("");
    setStreamingChat(true);

    try {
      await streamChat(
        {
          prompt,
          heroTheme: theme,
          history
        },
        (chunk) => appendAssistantChunk(assistantMessageId, chunk)
      );

      const finalMessage =
        useAppStore
          .getState()
          .messages.find((message) => message.id === assistantMessageId)?.content ?? "";
      await playVoice(finalMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI response failed.");
    } finally {
      setStreamingChat(false);
      setListening(false);
    }
  };

  const handleVoiceToCode = async () => {
    const prompt = (transcript || codePrompt).trim();
    if (!prompt) {
      return;
    }

    setIsGeneratingCode(true);
    try {
      const result = await generateCode({ prompt, language, heroTheme: theme });
      setCode(result.code || code);
      toast.success(`Inserted ${language} code into the editor.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Code generation failed.");
    } finally {
      setIsGeneratingCode(false);
      setListening(false);
    }
  };

  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex min-h-[70vh] flex-col gap-5">
      <AvatarStage />

      <Card className="flex-1">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge variant="accent">AI Agent Panel</Badge>
              <CardTitle className="mt-3 text-3xl">{hero.name} copilot</CardTitle>
              <CardDescription>
                Voice, chat, streaming code generation, and theme-specific speech playback.
              </CardDescription>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3">
              <p className="metric-label">Voice playback</p>
              <div className="mt-2 flex items-center gap-3">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <Switch checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Tabs defaultValue="chat">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="voice-code">Voice to code</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="space-y-4">
              <div className="scrollbar-thin flex max-h-[320px] flex-col gap-4 overflow-auto rounded-[24px] border border-white/10 bg-slate-950/50 p-4">
                {messages.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-white/10 bg-white/5 p-5 text-sm text-muted-foreground">
                    Start a conversation and the response will stream into this panel.
                  </div>
                ) : (
                  messages.map((message) => (
                    <ChatMessageBubble key={message.id} message={message} theme={theme} />
                  ))
                )}
              </div>

              {transcript ? (
                <div className="rounded-[20px] border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-accent">
                  Live transcript: {transcript}
                </div>
              ) : null}

              <div className="flex gap-3">
                <Input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder={`Ask ${hero.name} to build, debug, or explain`}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleSendChat();
                    }
                  }}
                />
                <Button
                  variant={isListening ? "default" : "secondary"}
                  size="icon"
                  onClick={handleToggleListening}
                >
                  <Mic className="h-4 w-4" />
                </Button>
                <Button onClick={handleSendChat} disabled={isStreamingChat}>
                  {isStreamingChat ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="voice-code" className="space-y-4">
              <Textarea
                value={codePrompt}
                onChange={(event) => setCodePrompt(event.target.value)}
                placeholder="Describe what code the hero should generate"
              />
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="metric-label">Speech capture</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Use the microphone to dictate a coding task, then generate code straight into the Monaco editor.
                </p>
                <p className="mt-3 text-sm text-foreground">
                  {transcript || "No speech captured yet."}
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={handleToggleListening}>
                  <Mic className="h-4 w-4" />
                  {isListening ? "Stop capture" : "Capture voice"}
                </Button>
                <Button onClick={handleVoiceToCode} disabled={isGeneratingCode}>
                  {isGeneratingCode ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <WandSparkles className="h-4 w-4" />
                  )}
                  Insert in editor
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.section>
  );
}
