import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // 1. 安全驗證
    if (data.secret_key !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 接收資料並進行「去空格」處理，避免資料庫出現 EMPTY
    let origin = data.origin?.trim();
    let destination = data.destination?.trim();
    let airline = data.airline?.trim();
    let country_name = data.country_name?.trim();
    const { price, deal_url, bubble_text, travel_days, is_round_trip, is_direct, transfer_airport } = data;

    // 3. 自動補全國家邏輯 (保留這個好功能，省去手機點選時間)
    if (!country_name) {
      const { data: mapping } = await supabase
        .from('airport_mapping')
        .select('country_name')
        .eq('city_name', destination)
        .single();
      
      country_name = mapping?.country_name || '未知國家';
    }

    // 4. 存入資料庫
    const { data: insertedData, error } = await supabase
      .from('deals')
      .insert([
        { 
          origin, 
          destination, 
          country_name, 
          price, 
          airline, 
          deal_url, 
          bubble_text,
          travel_days,
          is_round_trip,
          is_direct,
          transfer_airport,
          slug: `${origin}-${destination}-${Math.floor(Date.now() / 1000)}`.toLowerCase()
        }
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, country_assigned: country_name });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}