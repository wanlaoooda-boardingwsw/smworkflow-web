import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// 1. 初始化 R2 客戶端
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  // --- 請務必加入下面這兩行 ---
  forcePathStyle: true, 
});

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // 安全驗證
    if (data.secret_key !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: '密鑰錯誤' }, { status: 401 });
    }

    let { 
      origin, destination, country_name, price, 
      airline, deal_url, bubble_text, image // 這裡接收手機傳來的 Base64 圖片
    } = data;

    // 自動補國家
    if (!country_name) {
      const { data: mapping } = await supabase.from('airport_mapping').select('country_name').eq('city_name', destination).single();
      country_name = mapping?.country_name || '未知國家';
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const slug = `${origin}-${destination}-${timestamp}`.toLowerCase();
    let screenshot_path = null;

    // 2. 處理圖片上傳到 R2
    if (image) {
      const buffer = Buffer.from(image, 'base64');
      const fileName = `${slug}.jpg`;

      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: 'image/jpeg',
      }));
      
      screenshot_path = fileName; // 存下檔名
    }

    // 3. 存入 Supabase
    const { error } = await supabase
      .from('deals')
      .insert([{ 
        origin, destination, country_name, price, 
        airline, deal_url, slug, bubble_text,
        screenshot_path // 將 R2 的檔名存入資料庫
      }]);

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      deal_url: `https://deals.boardingwsw.com/deals/${slug}` 
    });

  } catch (error: any) {
    console.error('上傳失敗:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}