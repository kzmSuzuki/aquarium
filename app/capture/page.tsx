"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CapturePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // 現場の照明に合わせた黒の判定閾値（0〜255）
  const [threshold, setThreshold] = useState(100);
  const [showSettings, setShowSettings] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera access denied or failed", err);
        alert("カメラへのアクセスを確認できませんでした。設定からカメラを許可してください。");
      }
    };
    startCamera();

    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsProcessing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // 黒背景の透過処理（閾値スライダーの値を適用）
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] < threshold && data[i + 1] < threshold && data[i + 2] < threshold) {
        data[i + 3] = 0; // 透明にする
      }
    }

    ctx.putImageData(imageData, 0, 0);
    setPreviewImage(canvas.toDataURL("image/png"));
    setIsProcessing(false);
  };

  const handleRetake = () => {
    setPreviewImage(null);
    setUploadSuccess(false);
  };

  const handleSave = async () => {
    if (!previewImage) return;
    setIsUploading(true);
    try {
      const res = await fetch("/api/fish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64Image: previewImage,
          templateId: "template_01",
          eventId: "event_spring2026",
        }),
      });

      if (!res.ok) throw new Error("Failed to save image");
      setUploadSuccess(true);
    } catch (err) {
      console.error(err);
      alert("保存に失敗しました。もう一度お試しください。");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />

      {uploadSuccess ? (
        <div className="z-20 flex flex-col items-center justify-center p-8 bg-cyan-900/90 rounded-[40px] border-4 border-cyan-400 mx-4 shadow-2xl glass-card">
          <div className="text-7xl mb-4 animate-bounce">🌟</div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-8 text-center leading-relaxed">
            うみがめさんが、<br/>さかなを海へはこんだよ！
          </h2>
          <div className="flex flex-col md:flex-row gap-4 w-full justify-center">
            <button onClick={handleRetake} className="px-8 py-4 bg-yellow-400 text-yellow-950 text-xl font-bold rounded-full shadow-[0_5px_15px_rgba(255,200,0,0.5)] hover:bg-yellow-300">
              もう１かい とる
            </button>
            <Link href="/viewer" className="px-8 py-4 flex items-center justify-center bg-teal-400 text-teal-950 text-xl font-bold rounded-full shadow-[0_5px_15px_rgba(0,200,150,0.5)] hover:bg-teal-300">
              すいぞくかんへ！
            </Link>
          </div>
        </div>
      ) : previewImage ? (
        <div className="z-10 w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-900 to-black">
          <h2 className="text-3xl text-white font-bold mb-6 drop-shadow-lg text-center leading-relaxed">きれいに<br/>ぬれたかな？</h2>
          <div className="relative w-full max-w-sm aspect-[4/3] bg-white rounded-3xl border-4 border-cyan-400 mb-10 overflow-hidden shadow-2xl" 
               style={{ backgroundImage: "repeating-linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0)", backgroundSize: "20px 20px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewImage} alt="Extracted fish" className="absolute inset-0 w-full h-full object-contain p-4 drop-shadow-xl" />
          </div>
          <div className="flex gap-4 md:gap-8">
            <button onClick={handleRetake} disabled={isUploading} className="px-6 py-4 bg-gray-600 text-white font-bold text-xl rounded-full shadow-lg hover:bg-gray-500 disabled:opacity-50">
              やりなおす
            </button>
            <button onClick={handleSave} disabled={isUploading} className="flex items-center px-8 py-4 bg-orange-500 text-white font-bold text-xl rounded-full shadow-[0_5px_20px_rgba(255,165,0,0.6)] hover:bg-orange-400 disabled:opacity-50">
              {isUploading ? "おくっています..." : "これでOK！"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <Link href="/" className="absolute top-6 left-6 z-20 px-6 py-3 bg-black/50 text-white font-bold rounded-full backdrop-blur-md shadow-lg border border-white/20">
            ← ホームへもどる
          </Link>

          {/* 環境光 調整ツール（スタッフ用ボタン） */}
          <div className="absolute top-6 right-6 z-20">
            <button onClick={() => setShowSettings(!showSettings)} className="w-12 h-12 bg-black/50 text-white text-2xl rounded-full backdrop-blur-md flex items-center justify-center border border-white/20">
              ⚙️
            </button>
            {showSettings && (
              <div className="absolute top-14 right-0 mt-2 bg-black/80 backdrop-blur-md border border-gray-600 p-4 rounded-xl shadow-xl w-64">
                <p className="text-white text-sm font-bold mb-2">背景の切り抜き感度（照明調整）</p>
                <input 
                  type="range" 
                  min="10" max="200" 
                  value={threshold} 
                  onChange={(e) => setThreshold(Number(e.target.value))} 
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-gray-400 text-xs mt-1">
                  <span>暗い（シビア）</span>
                  <span>明るい</span>
                </div>
              </div>
            )}
          </div>

          <video ref={videoRef} autoPlay playsInline muted className="absolute w-full h-full object-cover z-0" />
          
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
            <div className="w-3/4 max-w-md aspect-[4/3] border-4 border-dashed border-yellow-400 rounded-2xl relative bg-transparent">
              <span className="absolute -top-12 left-0 right-0 text-center text-yellow-400 text-xl font-bold drop-shadow-lg bg-black/50 py-1 rounded-full w-[240px] mx-auto">
                わくのなかにいれてね
              </span>
            </div>
          </div>
          
          <div className="absolute bottom-12 z-20">
            <button onClick={handleCapture} disabled={isProcessing} className="w-28 h-28 bg-white/30 border-4 border-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.5)] backdrop-blur-sm active:scale-95">
              <div className="w-20 h-20 bg-red-500 rounded-full shadow-inner shadow-red-800 border-2 border-red-400" />
            </button>
          </div>
        </>
      )}
    </main>
  );
}
