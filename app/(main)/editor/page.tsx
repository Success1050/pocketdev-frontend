"use client";

import { motion } from "framer-motion";
import { 
  Save, FileCode2, FileJson, FileType, 
  X, Sparkles, Terminal, ChevronRight
} from "lucide-react";
import { useState } from "react";

const FILES = [
  { name: "app.tsx", icon: FileCode2, color: "#3178C6", active: true },
  { name: "index.tsx", icon: FileCode2, color: "#3178C6", active: false },
  { name: "styles.css", icon: FileType, color: "#264DE4", active: false },
  { name: "utils.ts", icon: FileCode2, color: "#3178C6", active: false },
  { name: "package.json", icon: FileJson, color: "#CB3837", active: false },
];

const CODE = `import React from 'react';
import { View, Text } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <Text>Hello PocketDev!</Text>
    </View>
  );
}`;

export default function EditorPage() {
  const [activeFile, setActiveFile] = useState("app.tsx");

  return (
    <div className="flex h-[calc(100vh-80px)] md:h-screen flex-col bg-[#0A0A0C] relative pb-20 md:pb-0">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Terminal className="h-5 w-5 text-muted hidden md:block" />
          <h1 className="text-lg font-bold text-foreground">Code Editor</h1>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 hover:bg-accent/90 transition-colors">
          <Save className="h-4 w-4 text-background" />
          <span className="text-sm font-bold text-background">Save</span>
        </button>
      </header>

      {/* File Bar */}
      <div className="flex h-12 shrink-0 border-b border-border bg-background overflow-x-auto no-scrollbar">
        {FILES.map((file) => (
          <button
            key={file.name}
            onClick={() => setActiveFile(file.name)}
            className={`group flex items-center gap-2 border-r border-border px-4 transition-colors min-w-max ${
              activeFile === file.name ? "bg-surface border-b-2 border-b-accent" : "hover:bg-surface-light"
            }`}
          >
            <file.icon className="h-4 w-4" style={{ color: file.color }} />
            <span className={`text-sm ${activeFile === file.name ? "text-foreground font-semibold" : "text-muted"}`}>
              {file.name}
            </span>
            {activeFile === file.name && (
              <X className="ml-2 h-3.5 w-3.5 text-muted hover:text-foreground" />
            )}
          </button>
        ))}
      </div>

      {/* Editor Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Line Numbers */}
        <div className="w-12 shrink-0 bg-surface-light py-4 text-right border-r border-border overflow-hidden hidden md:block">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="pr-3 text-xs font-mono text-muted/50 leading-6">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto bg-[#0A0A0C] p-4 relative">
          <pre className="font-mono text-[14px] leading-6 text-[#D4D4D4]">
            <code>
              <span className="text-[#C678DD]">import</span> <span className="text-[#E5C07B]">React</span> <span className="text-[#C678DD]">from</span> <span className="text-[#98C379]">'react'</span>;<br/>
              <span className="text-[#C678DD]">import</span> {'{ View, Text }'} <span className="text-[#C678DD]">from</span> <span className="text-[#98C379]">'react-native'</span>;<br/>
              <br/>
              <span className="text-[#C678DD]">export default function</span> <span className="text-[#61AFEF]">App</span>() {'{'}<br/>
              {'  '}<span className="text-[#C678DD]">return</span> (<br/>
              {'    '}&lt;<span className="text-[#E06C75]">View</span> <span className="text-[#D19A66]">style</span>={'{{ flex: 1 }}'}&gt;<br/>
              {'      '}&lt;<span className="text-[#E06C75]">Text</span>&gt;Hello PocketDev!&lt;/<span className="text-[#E06C75]">Text</span>&gt;<br/>
              {'    '}&lt;/<span className="text-[#E06C75]">View</span>&gt;<br/>
              {'  '});<br/>
              {'}'}
            </code>
          </pre>
          
          {/* Simulated Cursor */}
          <motion.div 
            animate={{ opacity: [1, 0, 1] }} 
            transition={{ repeat: Infinity, duration: 1 }}
            className="absolute left-[36px] top-[148px] h-5 w-[2px] bg-accent"
          />
        </div>
      </div>

      {/* AI Suggestion Bar */}
      <div className="shrink-0 border-t border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-md bg-accent-dim px-2 py-1 border border-accent/20">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span className="text-[10px] font-black tracking-wider text-accent">
                AI ASSIST
              </span>
            </div>
            <span className="text-sm text-text-dim">
              Suggested: <span className="text-muted">Add a primary button component here...</span>
            </span>
          </div>
          
          <button className="flex items-center gap-1 text-xs font-bold text-accent hover:text-accent/80 transition-colors">
            Accept <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
