import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const data = await request.formData();
        const file = data.get('file');
        const type = data.get('type');
        const month = data.get('month');

        if (!file || !type || !month) {
            return NextResponse.json({ success: false, error: 'Parâmetros ausentes' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Vercel Blob
        await put(`uploads/${month}/${type}.csv`, buffer, {
            access: 'public',
            addRandomSuffix: false, // Mantém o nome exato para podermos buscar depois
        });

        await put(`uploads/atual/${type}.csv`, buffer, {
            access: 'public',
            addRandomSuffix: false,
        });

        return NextResponse.json({ success: true, message: 'Arquivo salvo com sucesso na Nuvem' });
    } catch (e) {
        console.error('Error saving file:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
