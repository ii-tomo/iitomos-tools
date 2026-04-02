"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  UploadCloud,
  FileText,
  Loader2,
  Languages,
  CheckCircle2,
  RefreshCw,
  Copy,
} from "lucide-react";
import { AudioReader } from "@/components/AudioReader";

interface PageData {
  pageNumber: number;
  text: string;
  translatedText?: string;
  isTranslating?: boolean;
}

export default function PdfTranslator() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageData[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsExtracting(true);
    setPages([]);

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await uploadedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const newPages: PageData[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // @ts-expect-error missing string prop in definitions
        const pageText = textContent.items.map((item) => item.str).join(" ");
        newPages.push({ pageNumber: i, text: pageText });
      }

      setPages(newPages);
    } catch (error) {
      console.error("Error extracting PDF:", error);
      alert("PDF のテキスト抽出に失敗しました。");
    } finally {
      setIsExtracting(false);
    }
  };

  const translatePage = async (pageIndex: number): Promise<boolean> => {
    setPages((prev) => {
      const copy = [...prev];
      copy[pageIndex].isTranslating = true;
      return copy;
    });

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pages[pageIndex].text, targetLanguage: "Japanese" }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402 || data.code === "INSUFFICIENT_CREDITS") {
          window.dispatchEvent(new CustomEvent("show_insufficient_modal"));
          setPages((prev) => {
            const copy = [...prev];
            copy[pageIndex].isTranslating = false;
            return copy;
          });
          return false;
        }
      }

      setPages((prev) => {
        const copy = [...prev];
        copy[pageIndex].isTranslating = false;
        if (data.translatedText) {
          copy[pageIndex].translatedText = data.translatedText;
        } else {
          copy[pageIndex].translatedText = `[翻訳失敗: ${data.error || "不明なエラー"}]`;
        }
        return copy;
      });

      if (data.creditsRemaining !== undefined) {
        window.dispatchEvent(
          new CustomEvent("credits_updated", { detail: { credits: data.creditsRemaining } }),
        );
      }

      return true;
    } catch (error) {
      console.error(error);
      setPages((prev) => {
        const copy = [...prev];
        copy[pageIndex].isTranslating = false;
        copy[pageIndex].translatedText = "[翻訳失敗]";
        return copy;
      });
      return false;
    }
  };

  const handleTranslateAll = async () => {
    if (isTranslatingAll) return;
    setIsTranslatingAll(true);

    for (let i = 0; i < pages.length; i++) {
      if (!pages[i].translatedText) {
        const success = await translatePage(i);
        if (!success) break;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    setIsTranslatingAll(false);
  };

  const handleReset = () => {
    setFile(null);
    setPages([]);
    setIsExtracting(false);
    setIsTranslatingAll(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-indigo-500/30">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-neutral-950 to-neutral-950" />

      <header className="sticky top-0 z-50 border-b border-white/5 bg-neutral-950/50 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center gap-3 sm:gap-4">
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/5 p-2 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">PDF翻訳ツール</h1>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 px-4 py-3 text-sm leading-relaxed text-amber-100/90">
          注意: 作業中にブラウザの戻るボタンやリロードを行うと、読み込み済みのファイルと翻訳途中の内容は消えます。必要な内容はコピーしてから移動してください。
        </div>

        {!file ? (
          <div className="mx-auto mt-4 w-full max-w-3xl sm:mt-12">
            <div className="group relative overflow-hidden rounded-[40px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 transition-all hover:bg-white/10 sm:p-16">
              <input
                type="file"
                accept="application/pdf"
                className="absolute inset-0 z-10 cursor-pointer opacity-0"
                onChange={handleFileUpload}
              />
              <div className="pointer-events-none flex flex-col items-center justify-center text-center">
                <div className="mb-6 rounded-[32px] bg-indigo-500/20 p-6 text-indigo-400 ring-1 ring-indigo-500/30 transition-transform group-hover:scale-110 sm:p-8">
                  <UploadCloud className="h-12 w-12 sm:h-16 sm:w-16" />
                </div>
                <h3 className="mb-4 text-2xl font-bold sm:text-3xl">PDFファイルを選択</h3>
                <p className="mb-6 max-w-sm text-sm text-neutral-400 sm:text-base">
                  ドラッグまたはクリックで PDF を読み込みます。読み込んだ後にページごとの翻訳ができます。
                </p>
                <div className="rounded-full bg-white/10 px-6 py-2.5 text-sm font-bold text-white">
                  ファイルを選択する
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-sm sm:p-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex w-full min-w-0 items-start gap-4">
              <div className="rounded-xl bg-indigo-500/20 p-3 text-indigo-400 ring-1 ring-indigo-500/30">
                <FileText className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="break-all text-base font-bold leading-relaxed sm:text-lg lg:break-words">{file.name}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-neutral-400 sm:text-sm">
                  <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  {pages.length > 0 && <span>・ 全 {pages.length} ページ</span>}
                </div>
              </div>
            </div>

            <div className="w-full shrink-0 border-t border-white/5 pt-4 lg:w-auto lg:border-t-0 lg:pt-0">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleReset}
                  className="flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-neutral-300 transition-all hover:bg-white/10 active:scale-[0.98] sm:flex-none sm:py-2.5"
                >
                  <RefreshCw className="h-4 w-4" />
                  別のファイル
                </button>
                <button
                  onClick={handleTranslateAll}
                  disabled={isTranslatingAll || isExtracting || pages.length === 0}
                  className="flex min-w-[180px] flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 hover:bg-indigo-500 sm:flex-none sm:py-2.5"
                >
                  {isTranslatingAll ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      一括翻訳中...
                    </>
                  ) : isExtracting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      抽出中...
                    </>
                  ) : (
                    <>
                      <Languages className="h-4 w-4" />
                      全ページを一括翻訳
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {file && (
          <div className="relative flex min-h-[600px] flex-col rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold sm:text-lg">ドキュメント内容</h3>
              {pages.length > 0 && (
                <span className="rounded-lg border border-indigo-500/10 bg-indigo-500/20 px-2 py-1 text-xs font-medium text-indigo-300">
                  抽出済み {pages.length} ページ
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-white/5 bg-black/40 p-4 font-sans sm:p-6">
              <div className="rounded-2xl border border-amber-500/10 bg-amber-500/5 px-4 py-3 text-xs leading-relaxed text-amber-100/90">
                AI翻訳は 1 回ごとに 1 クレジット、AI音声は 1 回の生成ごとに 1 クレジットを消費します。
                ブラウザ読み上げはクレジットを消費しません。
              </div>

              {isExtracting ? (
                <div className="flex h-48 flex-col items-center justify-center gap-3 text-neutral-500 sm:h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500/50" />
                  <p className="text-sm font-medium">PDF のテキストを抽出中...</p>
                </div>
              ) : pages.length > 0 ? (
                pages.map((page, index) => (
                  <div
                    key={page.pageNumber}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-3">
                      <span className="text-sm font-bold tracking-wider text-neutral-300">
                        ページ {page.pageNumber}
                      </span>
                      <button
                        onClick={() => !page.isTranslating && !page.translatedText && translatePage(index)}
                        className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/10 px-4 py-2 text-xs font-bold text-neutral-200 transition-colors hover:bg-white/20 active:scale-95"
                      >
                        {page.isTranslating ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            翻訳中...
                          </>
                        ) : page.translatedText ? (
                          <span className="flex items-center gap-1.5 text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                            翻訳済み
                          </span>
                        ) : (
                          "このページを翻訳"
                        )}
                      </button>
                    </div>

                    <div className="grid divide-y divide-white/5 md:grid-cols-2 md:divide-x md:divide-y-0">
                      <div className="group relative bg-black/30 p-4 sm:p-6">
                        <div className="mb-4 flex items-center justify-between">
                          <div className="rounded-md bg-white/5 px-3 py-1.5 text-[11px] font-bold text-neutral-400">
                            原文
                          </div>
                          <button
                            title="原文テキストをコピー"
                            onClick={() => navigator.clipboard.writeText(page.text)}
                            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-neutral-200 transition-colors hover:bg-white/20 active:scale-95"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            コピー
                          </button>
                        </div>
                        <div className="max-h-64 overflow-auto text-sm leading-relaxed text-neutral-300 sm:max-h-96 sm:text-base">
                          {page.text}
                        </div>
                      </div>

                      <div className="group relative flex flex-col bg-indigo-950/20 p-4 sm:p-6">
                        <div className="mb-4 flex shrink-0 items-center justify-between">
                          <div className="rounded-md border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-[11px] font-bold text-indigo-300">
                            翻訳文
                          </div>
                          {page.translatedText && !page.isTranslating && (
                            <button
                              title="翻訳テキストをコピー"
                              onClick={() => navigator.clipboard.writeText(page.translatedText || "")}
                              className="inline-flex items-center gap-1 rounded-md border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-[11px] font-bold text-indigo-200 transition-colors hover:bg-indigo-500/20 active:scale-95"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              コピー
                            </button>
                          )}
                        </div>

                        <div className="max-h-64 flex-1 overflow-auto text-sm leading-relaxed text-neutral-100 sm:max-h-96 sm:text-base">
                          {page.isTranslating ? (
                            <div className="flex h-full min-h-[100px] flex-col items-center justify-center gap-3 text-xs font-medium text-indigo-400/80">
                              <Loader2 className="h-6 w-6 animate-spin" />
                              <p>AI が翻訳を生成しています...</p>
                            </div>
                          ) : page.translatedText ? (
                            <div className="whitespace-pre-wrap">{page.translatedText}</div>
                          ) : (
                            <span className="flex h-full min-h-[100px] items-center justify-center text-xs text-neutral-500">
                              翻訳ボタンを押すか、一括翻訳を実行してください
                            </span>
                          )}
                        </div>

                        {page.translatedText &&
                          !page.isTranslating &&
                          !page.translatedText.startsWith("[翻訳失敗") && (
                            <div className="mt-4 shrink-0 border-t border-white/5 pt-4">
                              <AudioReader text={page.translatedText} />
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex min-h-[200px] h-full items-center justify-center text-sm font-medium text-neutral-500">
                  ここに抽出されたテキストと翻訳結果が表示されます
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
