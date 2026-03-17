import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        if (!type) {
            return NextResponse.json({ success: false, error: 'Tipo ausente' }, { status: 400 });
        }

        const searchPrefix = `uploads/atual/${type}`;
        const { blobs } = await list({ prefix: searchPrefix, limit: 1 });
        
        if (blobs.length === 0) {
            return NextResponse.json({ success: false, error: 'Arquivo não encontrado no servidor' }, { status: 404 });
        }

        const res = await fetch(blobs[0].url);
        const fileContent = await res.text();
        
        return new NextResponse(fileContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            },
        });
    } catch (e) {
        console.error('Error reading latest file:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
