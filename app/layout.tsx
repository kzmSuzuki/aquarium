import type { Metadata } from 'next';
import { M_PLUS_Rounded_1c } from 'next/font/google';
import './globals.css';

// 子ども向けに、親しみやすい「M PLUS Rounded 1c」丸ゴシックフォントを使用します
const mplus = M_PLUS_Rounded_1c({ 
  weight: ['400', '800'],
  subsets: ['latin'],
  variable: '--font-mplus',
});

export const metadata: Metadata = {
  title: 'AR塗り絵水族館',
  description: 'みんなの描いた魚が海で泳ぐ！体験型ARアプリ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${mplus.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
