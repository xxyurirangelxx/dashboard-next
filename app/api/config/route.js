import { NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const payload = await request.json();
        const { key, data } = payload;
        
        if (!key || !data) {
            return NextResponse.json({ success: false, error: 'Parâmetros ausentes' }, { status: 400 });
        }

        // Caminhos fixos para as configurações globais
        const blobPath = `config/${key}.json`;
        
        await put(blobPath, JSON.stringify(data), {
            access: 'public',
            contentType: 'application/json',
            addRandomSuffix: false, // Queremos sobrescrever a config atual sempre
            token: process.env.BLOB_READ_WRITE_TOKEN
        });
        
        return NextResponse.json({ success: true, message: 'Configuração salva na Nuvem' });
    } catch (e) {
        console.error('Error saving config:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');

        if (!key) {
            return NextResponse.json({ success: false, error: 'Chave ausente' }, { status: 400 });
        }

        const exactPath = `config/${key}.json`;
        const { blobs } = await list({ prefix: exactPath, limit: 1, token: process.env.BLOB_READ_WRITE_TOKEN });
        
        if (blobs.length === 0) {
            return NextResponse.json({ success: false, error: 'Configuração não encontrada' }, { status: 404 });
        }

        const res = await fetch(blobs[0].url);
        const data = await res.json();

        return NextResponse.json({ success: true, data });
    } catch (e) {
        console.error('Error reading config:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
