import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

// 價格格式化函式
const formatPrice = (priceStr: string) => {
  const digits = priceStr.replace(/\D/g, ''); 
  const num = parseInt(digits, 10);
  return isNaN(num) ? priceStr : num.toLocaleString();
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const { data: deal } = await supabase.from('deals').select('*').eq('slug', decodedSlug).single();
  if (!deal) return { title: '機票優惠 | 機票萬事屋' };
  return {
    title: `${deal.origin} ↔ ${deal.destination} 只要 $${formatPrice(deal.price)}`,
    openGraph: { images: [`/api/og?id=${deal.id}`] },
  };
}

export default async function DealPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const { data: deal } = await supabase.from('deals').select('*').eq('slug', decodedSlug).single();

  if (!deal) notFound();

  // --- 強力日期拆解邏輯 ---
  // 這裡會把 " 、 06/22-06/25 、 05/21-05/28" 轉成 ["06/22-06/25", "05/21-05/28"]
  const rawDates = deal.travel_dates || "";
  const allDates = rawDates
    .split(/ 、 |、|,/)                 // 支援多種分隔符號切開
    .map(d => d.trim())                // 去除空格
    .filter(d => d !== "" && d !== "、"); // 濾掉空的和純符號

  const mainDate = allDates[0] || "立即查票";
  const otherDates = allDates.slice(1);
  // -----------------------

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4 font-sans text-black">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border-[6px] border-black">
        
        {/* 1. 頂部黃色區域：主角日期在此 */}
        <div className="p-8 bg-yellow-400 border-b-[6px] border-black text-center">
          <div className="inline-block bg-black text-white px-4 py-1 rounded-md text-xs font-black mb-3 uppercase tracking-tighter">
            {deal.country_name}
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-4">
            {deal.origin} <span className="text-2xl opacity-50">↔</span> {deal.destination}
          </h1>
          
          {/* 主角日期：醒目大標籤 */}
          <div className="inline-flex items-center bg-white border-[3px] border-black px-6 py-2 rounded-full text-xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            📅 {mainDate}
          </div>
        </div>
        
        <div className="p-8 text-center bg-white">
          <div className="text-lg font-bold text-gray-800 mb-1">{deal.airline}</div>
          <div className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">含稅總價參考</div>
          
          <div className="text-7xl font-black text-red-600 mb-6 tracking-tighter">
            <span className="text-3xl mr-1">$</span>{formatPrice(deal.price)}
          </div>
          
          <div className="flex justify-center gap-2 mb-8">
            <span className={`px-4 py-1 rounded-xl font-black border-2 border-black text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${!deal.is_direct ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
              {!deal.is_direct ? '✈️ 直飛' : `🛑 轉機(${deal.transfer_airport || '未定'})`}
            </span>
            <span className={`px-4 py-1 rounded-xl font-black border-2 border-black text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${!deal.is_round_trip ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
              {!deal.is_round_trip ? '🔄 來回' : '➡️ 單程'}
            </span>
          </div>
          
          {deal.bubble_text && (
            <div className="relative mb-10 p-5 bg-gray-50 rounded-2xl border-2 border-black font-bold text-gray-700 leading-relaxed shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-lg">
               「 {deal.bubble_text} 」
            </div>
          )}

          {/* 前往訂購按鈕：上移到圖片上方 */}
          <div className="mb-10">
            <a 
              href={deal.deal_url} 
              target="_blank" 
              className="block w-full bg-[#ff4d4d] hover:bg-[#ff3333] text-white text-center py-6 rounded-[2rem] font-black text-3xl shadow-[0_10px_0_0_#b30000] active:shadow-none active:translate-y-2 border-4 border-black transition-all"
            >
              立即搶購
            </a>
            
            {/* 配角日期：其他適用日期區塊 */}
            {otherDates.length > 0 && (
              <div className="mt-8 p-5 bg-blue-50 rounded-3xl border-2 border-black">
                <p className="text-xs font-black text-blue-400 mb-3 uppercase tracking-[0.2em]">其他適用日期</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {otherDates.map((d: string, i: number) => (
                    <span key={i} className="text-base font-black text-blue-700 bg-white px-3 py-1 rounded-lg border-2 border-blue-200">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 圖片參考：放在最下方 */}
          {deal.screenshot_paths && deal.screenshot_paths.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-black text-gray-300 mb-4 tracking-widest">— 查票截圖參考 (左右滑動) —</p>
              <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory no-scrollbar">
                {deal.screenshot_paths.map((path: string, index: number) => (
                  <div key={index} className="flex-none w-[90%] snap-center">
                    <img 
                      src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${path}`}
                      alt="截圖"
                      className="w-full rounded-3xl border-[4px] border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] bg-gray-200"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 text-gray-400 font-black tracking-widest uppercase text-[10px]">
        BOARDINGWSW.COM © 2024
      </div>
    </div>
  );
}