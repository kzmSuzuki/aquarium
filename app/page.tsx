import Link from 'next/link';

export default function Home() {
  // SSRエラー防止のため一時固定配列。コンポーネント化でランダム配置も可能ですがまずは静的配置
  const bubbles = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    left: `${(i * 37) % 100}%`,
    size: `${(i * 13) % 40 + 10}px`,
    duration: `${(i * 3) % 5 + 4}s`,
    delay: `${(i * 2) % 5}s`,
  }));

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* 背景の泡アニメーション群 */}
      <div className="absolute inset-0 z-0">
        {bubbles.map((b) => (
          <div 
            key={b.id} 
            className="bubble" 
            style={{ 
              left: b.left, 
              width: b.size, 
              height: b.size, 
              animationDuration: b.duration,
              animationDelay: b.delay
            }} 
          />
        ))}
      </div>

      <div className="z-10 flex flex-col items-center w-full max-w-4xl px-4">
        {/* タイトルエリア */}
        <div className="glass-card rounded-3xl p-8 md:p-12 text-center w-full mb-12 transform hover:scale-105 transition-transform duration-500">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-4 title-glow text-white tracking-widest leading-tight">
            AR塗り絵水族館
          </h1>
          <p className="text-lg md:text-2xl text-cyan-100 font-bold bg-black/20 inline-block px-6 py-2 rounded-full">
            キミのぬった魚が、目の前の海で泳ぎだす！
          </p>
        </div>

        {/* ボタンエリア */}
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-3xl px-4">
          <Link 
            href="/capture" 
            className="flex-1 group relative flex flex-col items-center justify-center bg-gradient-to-b from-yellow-300 to-orange-500 p-10 rounded-[40px] shadow-[0_10px_25px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_40px_rgba(255,165,0,0.6)] transform transition-all duration-300 hover:-translate-y-3 border-4 border-yellow-200/50"
          >
            <div className="text-7xl mb-4 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 drop-shadow-md">
              🖍️
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-orange-950 mb-2">さつえいする</h2>
            <p className="text-orange-900 font-bold bg-white/30 px-4 py-1 rounded-full">ぬりえをカメラでとろう！</p>
          </Link>

          <Link 
            href="/viewer" 
            className="flex-1 group relative flex flex-col items-center justify-center bg-gradient-to-b from-emerald-300 to-teal-500 p-10 rounded-[40px] shadow-[0_10px_25px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_40px_rgba(0,255,127,0.6)] transform transition-all duration-300 hover:-translate-y-3 border-4 border-emerald-200/50"
          >
            <div className="text-7xl mb-4 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-300 drop-shadow-md">
              🐠
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-teal-950 mb-2">かんしょうする</h2>
            <p className="text-teal-900 font-bold bg-white/30 px-4 py-1 rounded-full">みんなの魚をみてみよう！</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
