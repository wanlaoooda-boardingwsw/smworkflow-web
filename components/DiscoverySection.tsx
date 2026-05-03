// force update 2.2

'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// 這裡我們直接導出函數，不使用箭頭函數，這對編譯器最友善
export default function DiscoverySection({ deals, currentId }: { deals: any[], currentId: string }) {
  const [selectedCountry, setSelectedCountry] = useState('全部');

  // 如果沒有資料就回傳空白
  if (!deals || deals.length === 0) return null;

  // 1. 取得不重複的國家清單
  const countries = ['全部', ...Array.from(new Set(deals.map(d => d.country_name)))];

  // 2. 篩選邏輯
  const filteredDeals = deals.filter(deal => {
    const isNotCurrent = deal.id !== currentId;
    const matchesCountry = selectedCountry === '全部' || deal.country_name === selectedCountry;
    return isNotCurrent && matchesCountry;
  });

  const formatPrice = (p: string) => {
    const n = parseInt(p.replace(/\D/g, ''), 10);
    return isNaN(n) ? p : n.toLocaleString();
  };

  return (
    <div className="mt-12 w-full text-left border-t-2 border-gray-100 pt-8">
      <h2 className="text-xl font-black tracking-tight mb-4 px-2">🔥 兩週內熱門優惠</h2>

      {/* 國家標籤 */}
      <div className="flex overflow-x-auto gap-2 pb-4 no-scrollbar px-2">
        {countries.map(country => (
          <button
            key={country}
            onClick={() => setSelectedCountry(country)}
            className={`flex-none px-4 py-1.5 rounded-full font-bold border-2 border-black transition-all text-sm ${
              selectedCountry === country ? 'bg-black text-white' : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            {country}
          </button>
        ))}
      </div>

      {/* 卡片滑動 */}
      <div className="flex overflow-x-auto gap-4 pb-6 snap-x no-scrollbar px-2">
        {filteredDeals.length > 0 ? (
          filteredDeals.map((deal) => (
            <Link href={`/deals/${deal.slug}`} key={deal.id} className="flex-none w-48 snap-start">
              <div className="bg-white border-4 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black bg-yellow-400 px-2 py-0.5 rounded border-2 border-black uppercase">
                    {deal.country_name}
                  </span>
                  <div className="mt-3 font-black text-lg leading-tight">
                    {deal.origin} → {deal.destination}
                  </div>
                </div>
                <div className="mt-4 font-black text-red-600 text-xl">
                  ${formatPrice(deal.price)}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="py-10 text-center w-full text-gray-400 font-bold">目前沒有其他優惠</div>
        )}
      </div>
    </div>
  );
}