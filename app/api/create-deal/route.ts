import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // 1. 安全驗證：檢查手機傳來的 secret_key 是否跟 Vercel 設定的一樣
    if (data.secret_key !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: '密鑰錯誤，拒絕存取' }, { status: 401 });
    }

    // 2. 整理資料 (對應我們之前建的 SQL 欄位)
    const { 
      origin, destination, country_name, price, 
      airline, deal_url, bubble_text, travel_days,
      is_round_trip, is_direct, transfer_airport
    } = data;

    // 3. 自動生成網址 Slug (例如: taipei-tokyo-1710768000)
    const timestamp = Math.floor(Date.now() / 1000);
    const slug = `${origin}-${destination}-${timestamp}`.toLowerCase();

    // 4. 存入 Supabase 資料庫
    const { data: insertedData, error } = await supabase
      .from('deals')
      .insert([
        { 
          origin, destination, country_name, price, 
          airline, deal_url, slug, bubble_text, travel_days,
          is_round_trip, is_direct, transfer_airport
        }
      ])
      .select();

    if (error) throw error;

    // 5. 回傳成功結果與生成的網址
    return NextResponse.json({ 
      success: true, 
      deal_url: `https://deals.boardingwsw.com/deals/${slug}`,
      slug: slug
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}