"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, UploadCloud, FileText, Loader2, Languages, CheckCircle2, RefreshCw } from "lucide-react";
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
      const numPages = pdf.numPages;
      
      const newPages = [];
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // @ts-expect-error - missing string prop in definitions
        const pageText = textContent.items.map(item => item.str).join(" ");
        newPages.push({ pageNumber: i, text: pageText });
      }

      setPages(newPages);
    } catch (error) {
      console.error("Error extracting PDF:", error);
      alert("PDFのテキスト抽出に失敗しました。");
    } finally {
      setIsExtracting(false);
    }
  };

  const translatePage = async (pageIndex: number) => {
    setPages((prev) => {
      const copy = [...prev];
      copy[pageIndex].isTranslating = true;
      return copy;
    });

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pages[pageIndex].text, targetLanguage: 'Japanese' }),
      });
      const data = await response.json();
      
      setPages((prev) => {
        const copy = [...prev];
        copy[pageIndex].isTranslating = false;
        if (data.translatedText) {
          copy[pageIndex].translatedText = data.translatedText;
        } else {
          copy[pageIndex].translatedText = `[翻訳失敗: ${data.error || '不明なエラー'}]`;
        }
        return copy;
      });
    } catch (e) {
      console.error(e);
      setPages((prev) => {
        const copy = [...prev];
        copy[pageIndex].isTranslating = false;
        copy[pageIndex].translatedText = '[翻訳失敗]';
        return copy;
      });
    }
  };

  const handleTranslateAll = async () => {
    if (isTranslatingAll) return;
    setIsTranslatingAll(true);
    
    for (let i = 0; i < pages.length; i++) {
      if (!pages[i].translatedText) {
        await translatePage(i);
        await new Promise(resolve => setTimeout(resolve, 500));
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
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-neutral-950 to-neutral-950"></div>
      
      <header className="sticky top-0 z-50 border-b border-white/5 bg-neutral-950/50 backdrop-blur-md px-4 sm:px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-3 sm:gap-4">
          <Link href="/" className="rounded-full bg-white/5 border border-white/10 p-2 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">PDF翻訳機能</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-6 sm:gap-8">
        
        {/* Dynamic Layout: Big Upload Area OR Compact Top Bar */}
        {!file ? (
          <div className="mx-auto w-full max-w-3xl mt-4 sm:mt-12">
            <div className="rounded-[40px] border border-white/10 bg-white/5 p-8 sm:p-16 relative overflow-hidden group transition-all hover:bg-white/10 shadow-2xl shadow-black/40">
              <input 
                type="file" 
                accept="application/pdf" 
                className="absolute inset-0 opacity-0 z-10 cursor-pointer" 
                onChange={handleFileUpload}
              />
              <div className="flex flex-col items-center justify-center text-center pointer-events-none">
                <div className="mb-6 rounded-[32px] bg-indigo-500/20 p-6 sm:p-8 text-indigo-400 ring-1 ring-indigo-500/30 transition-transform group-hover:scale-110">
                  <UploadCloud className="h-12 w-12 sm:h-16 sm:w-16" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-4">PDFファイルを選択</h3>
                <p className="text-neutral-400 text-sm sm:text-base mb-6 max-w-sm">タップしてファイルを選択するか、ここにドラッグ＆ドロップしてください</p>
                <div className="px-6 py-2.5 rounded-full bg-white/10 text-white font-bold text-sm">ファイルを参照する</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-[28px] bg-white/5 border border-white/10 p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="rounded-xl bg-indigo-500/20 p-3 text-indigo-400 ring-1 ring-indigo-500/30">
                <FileText className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <p className="truncate font-bold text-base sm:text-lg">{file.name}</p>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-400 font-medium">
                  <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  {pages.length > 0 && <span>• 全 {pages.length} ページ</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
              <button 
                onClick={handleReset}
                className="flex flex-1 sm:flex-none justify-center items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 px-5 py-3 sm:py-2.5 text-sm font-bold transition-all border border-white/10 active:scale-[0.98]"
              >
                <RefreshCw className="h-4 w-4" /> 別のファイル
              </button>
              <button 
                onClick={handleTranslateAll}
                disabled={isTranslatingAll || isExtracting || pages.length === 0}
                className="flex flex-1 sm:flex-none justify-center items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 sm:py-2.5 text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
              >
                {isTranslatingAll ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> 一括翻訳中...
                  </>
                ) : isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> 解析中...
                  </>
                ) : (
                  <>
                    <Languages className="h-4 w-4" /> 全ページを一括翻訳
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Translation Results Area (Full Width) */}
        {file && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 flex flex-col h-auto min-h-[600px] shadow-2xl relative">
            <h3 className="text-base sm:text-lg font-bold mb-4 flex items-center justify-between">
              <span>ドキュメント内容</span>
              {pages.length > 0 && (
                <span className="text-xs px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/10">
                  抽出完了: {pages.length} ページ
                </span>
              )}
            </h3>
            <div className="flex-1 rounded-2xl bg-black/40 border border-white/5 p-4 sm:p-6 overflow-auto flex flex-col gap-6 font-sans">
              {isExtracting ? (
                <div className="flex flex-col items-center justify-center h-48 sm:h-full text-neutral-500 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500/50" />
                  <p className="text-sm font-medium">PDFのテキストを解析中...</p>
                </div>
              ) : pages.length > 0 ? (
                pages.map((page, index) => (
                  <div key={page.pageNumber} className="border border-white/10 rounded-2xl bg-white/5 overflow-hidden flex flex-col shadow-sm">
                    {/* Page Header */}
                    <div className="bg-white/5 border-b border-white/5 px-4 py-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-neutral-300 tracking-wider">📄 ページ {page.pageNumber}</span>
                      <button 
                        onClick={() => !page.isTranslating && !page.translatedText && translatePage(index)}
                        className="text-xs font-bold px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1.5 text-neutral-200 border border-white/5 active:scale-95"
                      >
                        {page.isTranslating ? (
                          <><Loader2 className="h-3.5 w-3.5 animate-spin"/> 翻訳処理中...</>
                        ) : page.translatedText ? (
                          <span className="text-emerald-400 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4"/> 完了</span>
                        ) : (
                          "このページを翻訳"
                        )}
                      </button>
                    </div>
                    
                    {/* Two Column Layout for Original vs Translated */}
                    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
                      <div className="p-4 sm:p-6 bg-black/30 relative group">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-[11px] text-neutral-400 font-bold bg-white/5 px-3 py-1.5 rounded-md">原文 (英語)</div>
                          <button 
                            title="英語テキストをコピー"
                            onClick={() => navigator.clipboard.writeText(page.text)}
                            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-[11px] font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md text-neutral-200 border border-white/5 active:scale-95"
                          >
                            コピー
                          </button>
                        </div>
                        <div className="text-sm sm:text-base text-neutral-300 leading-relaxed max-h-64 sm:max-h-96 overflow-auto scrollbar-thin">{page.text}</div>
                      </div>
                      <div className="p-4 sm:p-6 bg-indigo-950/20 relative group flex flex-col">
                        <div className="flex items-center justify-between mb-4 shrink-0">
                           <div className="text-[11px] text-indigo-300 font-bold bg-indigo-500/10 px-3 py-1.5 rounded-md border border-indigo-500/20">翻訳 (日本語)</div>
                           {page.translatedText && !page.isTranslating && (
                             <button 
                               title="日本語テキストをコピー"
                               onClick={() => navigator.clipboard.writeText(page.translatedText || '')}
                               className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-[11px] font-bold bg-indigo-500/20 hover:bg-indigo-500/30 px-3 py-1.5 rounded-md text-indigo-200 border border-indigo-500/20 active:scale-95"
                             >
                               コピー
                             </button>
                           )}
                        </div>
                        <div className="text-sm sm:text-base text-neutral-100 leading-relaxed max-h-64 sm:max-h-96 overflow-auto scrollbar-thin flex-1">
                          {page.isTranslating ? (
                            <div className="flex flex-col items-center gap-3 text-indigo-400/80 h-full min-h-[100px] justify-center text-xs font-medium">
                              <Loader2 className="h-6 w-6 animate-spin"/> 
                              <p>AIが翻訳を生成しています...</p>
                            </div>
                          ) : page.translatedText ? (
                            <div className="whitespace-pre-wrap">{page.translatedText}</div>
                          ) : (
                            <span className="text-neutral-500 text-xs flex h-full min-h-[100px] items-center justify-center">翻訳ボタンを押すか、一括翻訳を開始してください</span>
                          )}
                        </div>
                        
                        {page.translatedText && !page.isTranslating && !page.translatedText.startsWith("[翻訳失敗") && (
                          <div className="mt-4 pt-4 border-t border-white/5 shrink-0">
                            <AudioReader text={page.translatedText} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-full min-h-[200px] items-center justify-center text-neutral-500 text-sm font-medium">
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
