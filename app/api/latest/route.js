import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        if (!type) {
            return NextResponse.json({ success: false, error: 'Tipo ausente' }, { status: 400 });
        }

        const filePath = join(process.cwd(), 'data', 'uploads', 'atual', `${type}.csv`);
        
        const fileContent = await readFile(filePath, 'utf-8');
        
        return new NextResponse(fileContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            },
        });
    } catch (e) {
        if (e.code === 'ENOENT') {
            return NextResponse.json({ success: false, error: 'Arquivo não encontrado no servidor' }, { status: 404 });
        }
        console.error('Error reading latest file:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
