import type { Language } from "@/lib/types";

export const languageTemplates: Record<Language, string> = {
  typescript: `import express from "express";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "superhero-api" });
});

app.listen(3001, () => {
  console.log("Server ready on http://localhost:3001");
});
`,
  javascript: `const express = require("express");

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "superhero-api" });
});

app.listen(3001, () => {
  console.log("Server ready on http://localhost:3001");
});
`,
  python: `from fastapi import FastAPI

app = FastAPI()


@app.get("/health")
def health():
    return {"status": "ok", "service": "superhero-api"}
`,
  go: `package main

import (
    "encoding/json"
    "net/http"
)

func health(w http.ResponseWriter, _ *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    _ = json.NewEncoder(w).Encode(map[string]string{
        "status": "ok",
        "service": "superhero-api",
    })
}

func main() {
    http.HandleFunc("/health", health)
    _ = http.ListenAndServe(":3001", nil)
}
`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("SuperHero AI IDE sandbox ready.");
    }
}
`,
  c: `#include <stdio.h>

int main(void) {
    printf("SuperHero AI IDE sandbox ready.\\n");
    return 0;
}
`,
  cpp: `#include <iostream>

int main() {
    std::cout << "SuperHero AI IDE sandbox ready." << std::endl;
    return 0;
}
`
};
