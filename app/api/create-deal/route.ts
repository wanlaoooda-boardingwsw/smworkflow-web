import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // 1. 安全驗證：檢查密鑰
    if (data.secret_key !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: '密鑰錯誤' }, { status: 401 });
    }

    // 2. 獲取手機傳來的原始資料
    let { 
      origin, destination, country_name, price, 
      airline, deal_url, bubble_text, travel_days,
      is_round_trip, is_direct, transfer_airport
    } = data;

    // 3. 【核心進化】如果手機沒傳國家名稱，自動去 airport_mapping 查表
    if (!country_name || country_name.trim() === "") {
      const { data: mapping, error: mapError } = await supabase
        .from('airport_mapping')
        .select('country_name')
        .eq('city_name', destination)
        .single();
      
      if (mapping) {
        country_name = mapping.country_name;
      } else {
        country_name = '未知國家'; // 萬一沒查到，給個預設值
      }
    }

    // 4. 自動生成網址 Slug (例如: 台北-大阪-時間戳記)
    const timestamp = Math.floor(Date.now() / 1000);
    const slug = `${origin}-${destination}-${timestamp}`.toLowerCase();

    // 5. 存入 Supabase 的 deals 表格
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

    // 6. 回傳成功結果
    return NextResponse.json({ 
      success: true, 
      deal_url: `https://deals.boardingwsw.com/deals/${slug}`,
      slug: slug,
      country_assigned: country_name // 告訴手機最後分派了哪個國家
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}