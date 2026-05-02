import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

// 1. 生成 SEO 元資料 (Metadata)
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('slug', decodedSlug)
    .single();

  if (!deal) return { title: '機票優惠已過期 | 機票萬事屋' };

  // 動態生成 OG 圖片網址 (連向我們下一階段要寫的 OG API)
  const ogImageUrl = `https://deals.boardingwsw.com/api/og?id=${deal.id}`;

  return {
    title: `${deal.origin} ↔ ${deal.destination} 只要 ${deal.price} | 機票萬事屋`,
    description: `${deal.airline} 優惠：${deal.bubble_text}`,
    openGraph: {
      images: [ogImageUrl],
    },
  };
}

// 2. 機票落地頁主體
export default async function DealPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  // 抓取機票資料
  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('slug', decodedSlug)
    .single();

  if (!deal) notFound();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 font-sans text-black">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border-[6px] border-black">
        
        {/* 頂部區域：黃色背景與標題 */}
        <div className="p-8 bg-yellow-400 border-b-[6px] border-black text-center">
          <div className="inline-block bg-black text-white px-4 py-1 rounded-md text-sm font-bold mb-3 uppercase tracking-wider">
            {deal.country_name}
          </div>
          <h1 className="text-4xl font-black tracking-tighter">
            {deal.origin} <span className="text-2xl opacity-50">↔</span> {deal.destination}
          </h1>
          <p className="text-lg font-bold mt-1 opacity-80">{deal.airline}</p>
        </div>
        
        <div className="p-8 text-center bg-white">
          
          {/* 日期區塊：將字串切開變成標籤 */}
          <div className="mb-6 flex flex-wrap justify-center gap-2">
             {deal.travel_dates?.split(' 、 ').filter((d: string) => d.trim() !== "").map((d: string, i: number) => (
               <span key={i} className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                 📅 {d.trim()}
               </span>
             ))}
          </div>

          <div className="text-sm font-bold text-gray-400 mb-1 uppercase tracking-widest">含稅總價參考</div>
          <div className="text-7xl font-black text-red-600 mb-6 tracking-tighter">
            <span className="text-3xl mr-1">$</span>{deal.price}
          </div>
          
          {/* 標籤邏輯：修正布林值反轉問題 */}
          <div className="flex justify-center gap-2 mb-8">
            <span className={`px-4 py-1 rounded-xl font-black border-2 border-black text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${!deal.is_direct ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
              {!deal.is_direct ? '✈️ 直飛' : `🛑 轉機(${deal.transfer_airport || '未定'})`}
            </span>
            <span className={`px-4 py-1 rounded-xl font-black border-2 border-black text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${!deal.is_round_trip ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
              {!deal.is_round_trip ? '🔄 來回' : '➡️ 單程'}
            </span>
          </div>
          
          {/* 對話框推薦 */}
          {deal.bubble_text && (
            <div className="relative mb-10">
               <div className="p-5 bg-gray-100 rounded-2xl border-2 border-black font-bold text-gray-700 leading-relaxed shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-lg">
                 「 {deal.bubble_text} 」
               </div>
               {/* 裝飾用小箭頭 */}
               <div className="absolute -bottom-2 right-10 w-4 h-4 bg-gray-100 border-r-2 border-b-2 border-black rotate-45"></div>
            </div>
          )}

          {/* 多圖輪播區塊 (IG Style) */}
          {deal.screenshot_paths && deal.screenshot_paths.length > 0 && (
            <div className="mt-4 mb-6">
              <p className="text-xs font-black text-gray-300 mb-4 tracking-widest">— 截圖參考 (左右滑動) —</p>
              <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory no-scrollbar">
                {deal.screenshot_paths.map((path: string, index: number) => (
                  <div key={index} className="flex-none w-[90%] snap-center">
                    <img 
                      src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${path}`}
                      alt={`機票截圖 ${index + 1}`}
                      className="w-full rounded-3xl border-[4px] border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] bg-gray-200"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 底部按鈕 */}
        <div className="p-6 bg-white border-t-2 border-gray-100">
          <a 
            href={deal.deal_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full bg-[#ff4d4d] hover:bg-[#ff3333] text-white text-center py-6 rounded-[2rem] font-black text-3xl transition-all shadow-[0_10px_0_0_#b30000] active:shadow-none active:translate-y-2 border-4 border-black"
          >
            立即搶購
          </a>
          <p className="text-center text-gray-400 text-xs mt-6 font-bold uppercase tracking-tighter">
            機票價格隨時變動，請以官網為準
          </p>
        </div>
      </div>
      
      <div className="mt-8 text-gray-400 font-black tracking-widest uppercase text-[10px]">
        BOARDINGWSW.COM AUTOMATION v2.0
      </div>
    </div>
  );
}