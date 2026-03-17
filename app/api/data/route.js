import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month');
        const type = searchParams.get('type');

        if (!month || !type) {
            return NextResponse.json({ success: false, error: 'Mês ou tipo ausente' }, { status: 400 });
        }

        const exactPath = `uploads/${month}/${type}.csv`;
        const { blobs } = await list({ prefix: exactPath, limit: 1 });
        
        if (blobs.length === 0) {
            return NextResponse.json({ success: false, error: 'Arquivo não encontrado' }, { status: 404 });
        }

        const res = await fetch(blobs[0].url);
        const fileContent = await res.text();
        
        return new NextResponse(fileContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
            },
        });
    } catch (e) {
        console.error('Error reading file:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
