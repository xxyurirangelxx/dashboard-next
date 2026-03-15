import { NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const payload = await request.json();
        
        if (!payload || !Array.isArray(payload)) {
            return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 });
        }

        const shareId = crypto.randomBytes(4).toString('hex');
        const sharedDir = join(process.cwd(), 'data', 'shared');
        
        await mkdir(sharedDir, { recursive: true });

        const filePath = join(sharedDir, `${shareId}.json`);
        
        await writeFile(filePath, JSON.stringify(payload));
        
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

        const filePath = join(process.cwd(), 'data', 'shared', `${id}.json`);
        
        const fileContent = await readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent);

        return NextResponse.json({ success: true, data });
    } catch (e) {
        console.warn('Share file not found or corrupted:', e);
        return NextResponse.json({ success: false, error: 'Compartilhamento não encontrado ou expirado' }, { status: 404 });
    }
}
