import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

// 1. 生成 Metadata (SEO 用)
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  // 【關鍵：Next.js 15 必須 await params】
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('slug', decodedSlug)
    .single();

  if (!deal) return { title: '找不到優惠' };

  return {
    title: `${deal.origin} 飛 ${deal.destination} 只要 ${deal.price} | 機票萬事屋`,
    description: deal.bubble_text,
    openGraph: {
      images: [`/api/og?id=${deal.id}`],
    },
  };
}

// 2. 頁面主體
export default async function DealPage({ params }: { params: Promise<{ slug: string }> }) {
  // 【關鍵：Next.js 15 必須 await params】
  const { slug } = await params;
  
  // 處理中文網址編碼問題
  const decodedSlug = decodeURIComponent(slug);

  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('slug', decodedSlug)
    .single();

  // 如果資料庫找不到，就顯示 404
  if (!deal) notFound();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border-[6px] border-black">
        {/* 頂部區域 */}
        <div className="p-8 bg-yellow-400 border-b-[6px] border-black text-center">
          <div className="inline-block bg-black text-white px-4 py-1 rounded-md text-sm font-bold mb-3">
            {deal.country_name}
          </div>
          <h1 className="text-4xl font-black tracking-tighter">
            {deal.origin} <span className="text-2xl">↔</span> {deal.destination}
          </h1>
          <p className="text-lg font-bold mt-1 opacity-80">{deal.airline}</p>
        </div>
        
        {/* 價格區域 */}
        <div className="p-10 text-center bg-white">
          <div className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-widest">來回含稅價</div>
          <div className="text-7xl font-black text-red-600 mb-6 tracking-tighter">
            <span className="text-3xl mr-1">$</span>{deal.price}
          </div>
          
          <div className="flex justify-center gap-2 mb-8">
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg font-bold border-2 border-green-700 text-sm">
              {deal.is_direct ? '✈️ 直飛' : '🛑 轉機'}
            </span>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-bold border-2 border-blue-700 text-sm">
              {deal.is_round_trip ? '🔄 來回' : '➡️ 單程'}
            </span>
          </div>
          
          {/* 對話框 */}
          <div className="relative mt-4">
             <div className="p-5 bg-gray-100 rounded-2xl border-2 border-black font-bold text-gray-700 leading-relaxed shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
               {deal.bubble_text || "這個價格真的香，手刀衝！"}
             </div>
          </div>
        </div>

        {/* 底部按鈕 */}
        <div className="p-6 bg-white border-t-2 border-gray-100">
          <a 
            href={deal.deal_url} 
            target="_blank"
            className="block w-full bg-[#ff4d4d] hover:bg-[#ff3333] text-white text-center py-5 rounded-2xl font-black text-2xl transition-all shadow-[0_8px_0_0_#b30000] active:shadow-none active:translate-y-2 border-2 border-black"
          >
            立即搶購機票
          </a>
        </div>
      </div>
      
      <div className="mt-8 text-gray-400 font-bold tracking-widest uppercase text-xs">
        boardingwsw.com © 2024
      </div>
    </div>
  );
}