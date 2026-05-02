import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const { data: deal } = await supabase.from('deals').select('*').eq('slug', decodedSlug).single();
  if (!deal) return { title: '找不到優惠' };
  return {
    title: `${deal.origin} ↔ ${deal.destination} | 機票萬事屋`,
    openGraph: { images: [`/api/og?id=${deal.id}`] },
  };
}

export default async function DealPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const { data: deal } = await supabase.from('deals').select('*').eq('slug', decodedSlug).single();

  if (!deal) notFound();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 font-sans text-black">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border-[6px] border-black">
        
        {/* 頂部：國家與地點 */}
        <div className="p-8 bg-yellow-400 border-b-[6px] border-black text-center">
          <div className="inline-block bg-black text-white px-4 py-1 rounded-md text-sm font-bold mb-3 uppercase">
            {deal.country_name}
          </div>
          <h1 className="text-4xl font-black tracking-tighter">
            {deal.origin} <span className="text-2xl">↔</span> {deal.destination}
          </h1>
          <p className="text-lg font-bold mt-1 opacity-80">{deal.airline}</p>
        </div>
        
        <div className="p-8 text-center bg-white">
          {/* 日期區塊 */}
          <div className="mb-6 flex flex-wrap justify-center gap-2">
             {deal.travel_dates?.split(',').map((d: string, i: number) => (
               <span key={i} className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                 📅 {d.trim()}
               </span>
             ))}
          </div>

          <div className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-widest">含稅總價</div>
          <div className="text-7xl font-black text-red-600 mb-6 tracking-tighter">
            <span className="text-3xl mr-1">$</span>{deal.price}
          </div>
          
          {/* 修正後的標籤邏輯 */}
          <div className="flex justify-center gap-2 mb-8">
            <span className={`px-3 py-1 rounded-lg font-bold border-2 border-black text-sm ${deal.is_direct ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
              {deal.is_direct ? '✈️ 直飛' : `🛑 轉機(${deal.transfer_airport})`}
            </span>
            <span className={`px-3 py-1 rounded-lg font-bold border-2 border-black text-sm ${deal.is_round_trip ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
              {deal.is_round_trip ? '🔄 來回' : '➡️ 單程'}
            </span>
          </div>
          
          {/* 對話框 */}
          <div className="relative mb-8 p-5 bg-gray-100 rounded-2xl border-2 border-black font-bold text-gray-700 leading-relaxed shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {deal.bubble_text}
          </div>

          {/* 多圖輪播區塊 */}
          {deal.screenshot_paths && deal.screenshot_paths.length > 0 && (
            <div className="mt-4 mb-6">
              <p className="text-xs font-black text-gray-400 mb-3 tracking-widest">— 截圖參考 (左右滑動) —</p>
              <div className="flex overflow-x-auto gap-4 pb-4 snap-x no-scrollbar">
                {deal.screenshot_paths.map((path: string, index: number) => (
                  <div key={index} className="flex-none w-[90%] snap-center">
                    <img 
                      src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${path}`}
                      alt="機票截圖"
                      className="w-full rounded-2xl border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 按鈕 */}
        <div className="p-6 bg-white border-t-2 border-gray-100">
          <a href={deal.deal_url} target="_blank" className="block w-full bg-[#ff4d4d] hover:bg-[#ff3333] text-white text-center py-5 rounded-2xl font-black text-2xl shadow-[0_8px_0_0_#b30000] active:shadow-none active:translate-y-2 border-2 border-black">
            立即搶購機票
          </a>
        </div>
      </div>
    </div>
  );
}