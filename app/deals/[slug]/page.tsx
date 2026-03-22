import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Image from 'next/image';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!deal) return {};

  // 這裡就是魔法：讓 FB 抓取我們之後要做的「自動生成圖片 API」
  const ogImageUrl = `https://deals.boardingwsw.com/api/og?id=${deal.id}`;

  return {
    title: `${deal.origin} ↔ ${deal.destination} | 機票萬事屋`,
    description: `${deal.airline} 優惠價 ${deal.price}！${deal.bubble_text}`,
    openGraph: {
      images: [ogImageUrl],
    },
  };
}

export default async function DealPage({ params }: { params: { slug: string } }) {
  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!deal) notFound();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      {/* 這裡模擬你下午給我的版型排版 */}
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-black">
        <div className="p-8 bg-yellow-400 border-b-4 border-black text-center">
          <h1 className="text-4xl font-black">{deal.origin} ↔ {deal.destination}</h1>
          <p className="text-xl font-bold mt-2 text-gray-800">{deal.airline}</p>
        </div>
        
        <div className="p-10 text-center">
          <div className="text-6xl font-black text-red-600 mb-4">{deal.price}</div>
          <div className="inline-block bg-green-200 px-4 py-2 rounded-full font-bold border-2 border-black">
            {deal.is_direct ? '直飛' : `轉機於 ${deal.transfer_airport}`} | {deal.is_round_trip ? '來回' : '單程'}
          </div>
          
          <div className="mt-8 p-4 bg-gray-100 rounded-xl border-2 border-dashed border-gray-400 italic text-gray-600">
            「 {deal.bubble_text} 」
          </div>
        </div>

        <div className="p-6 bg-gray-900">
          <a 
            href={deal.deal_url} 
            className="block w-full bg-blue-500 hover:bg-blue-600 text-white text-center py-4 rounded-2xl font-black text-2xl transition-all border-b-8 border-blue-800 active:border-b-0 active:mt-2"
          >
            立即搶購
          </a>
        </div>
      </div>
      
      <p className="mt-8 text-gray-400 text-sm">此優惠由 boardingwsw.com 自動生成</p>
    </div>
  );
}