"use client";
import { useEffect } from "react";

export default function ClearPage() {
  useEffect(() => {
    // Supabase関連のlocalStorage・sessionStorageを全消去
    const keys = Object.keys(localStorage);
    keys.forEach(k => {
      if (k.includes('supabase') || k.includes('sb-')) {
        localStorage.removeItem(k);
      }
    });
    const sessionKeys = Object.keys(sessionStorage);
    sessionKeys.forEach(k => {
      if (k.includes('supabase') || k.includes('sb-')) {
        sessionStorage.removeItem(k);
      }
    });
    alert("✅ キャッシュをクリアしました！3秒後にトップページへ移動します。");
    setTimeout(() => { window.location.href = "/login"; }, 3000);
  }, []);

  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0a0a0a',color:'white',fontFamily:'sans-serif',flexDirection:'column',gap:'16px'}}>
      <div style={{fontSize:'48px'}}>🧹</div>
      <h1>キャッシュをクリア中...</h1>
      <p style={{color:'#888'}}>完了後、ログインページへ移動します</p>
    </div>
  );
}
