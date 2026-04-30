import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
});

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // 驗證密鑰
    if (data.secret_key !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: '密鑰錯誤' }, { status: 401 });
    }

    // 【精確對應你的字典欄位】
    let { 
      origin, destination, price, airline, deal_url, bubble_text, 
      is_round_trip, is_direct, transfer_airport, 
      travel_dates, images 
    } = data;

    // 自動補國家 (維持邏輯)
    const { data: mapping } = await supabase
      .from('airport_mapping')
      .select('country_name')
      .eq('city_name', destination)
      .single();
    let country_name = mapping?.country_name || '未知國家';

    const timestamp = Math.floor(Date.now() / 1000);
    const slug = `${origin}-${destination}-${timestamp}`.toLowerCase();
    
    // 處理多圖上傳到 R2
    let screenshot_paths: string[] = [];
    if (images && Array.isArray(images)) {
      for (let i = 0; i < images.length; i++) {
        const base64Data = images[i].replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `${slug}-${i}.jpg`;

        await s3Client.send(new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: fileName,
          Body: buffer,
          ContentType: 'image/jpeg',
        }));
        screenshot_paths.push(fileName);
      }
    }

    // 存入 Supabase (包含所有欄位)
    const { error } = await supabase.from('deals').insert([{ 
      origin, destination, country_name, price, airline, deal_url, bubble_text, 
      is_round_trip, is_direct, transfer_airport,
      travel_dates,
      screenshot_paths,
      slug
    }]);

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      deal_url: `https://deals.boardingwsw.com/deals/${slug}` 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}