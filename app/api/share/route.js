import { NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const payload = await request.json();
        
        if (!payload || !Array.isArray(payload)) {
            return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 });
        }

        const shareId = crypto.randomBytes(4).toString('hex');
        const blobPath = `shared/${shareId}.json`;
        
        await put(blobPath, JSON.stringify(payload), {
            access: 'public',
            contentType: 'application/json',
            token: process.env.BLOB_READ_WRITE_TOKEN
        });
        
        return NextResponse.json({ success: true, shareId });
    } catch (e) {
        console.error('Error sharing data:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID ausente' }, { status: 400 });
        }

        const searchPrefix = `shared/${id}`;
        const { blobs } = await list({ prefix: searchPrefix, limit: 1, token: process.env.BLOB_READ_WRITE_TOKEN });
        
        if (blobs.length === 0) {
            return NextResponse.json({ success: false, error: 'Compartilhamento não encontrado ou expirado' }, { status: 404 });
        }

        const res = await fetch(blobs[0].url);
        const data = await res.json();

        return NextResponse.json({ success: true, data });
    } catch (e) {
        console.warn('Share file not found or corrupted:', e);
        return NextResponse.json({ success: false, error: 'Erro ao buscar compartilhamento' }, { status: 404 });
    }
}
