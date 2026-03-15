import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month');
        const type = searchParams.get('type');

        if (!month || !type) {
            return NextResponse.json({ success: false, error: 'Mês ou tipo ausente' }, { status: 400 });
        }

        const filePath = join(process.cwd(), 'data', 'uploads', month, `${type}.csv`);
        
        const fileContent = await readFile(filePath, 'utf-8');
        
        return new NextResponse(fileContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
            },
        });
    } catch (e) {
        if (e.code === 'ENOENT') {
            return NextResponse.json({ success: false, error: 'Arquivo não encontrado' }, { status: 404 });
        }
        console.error('Error reading file:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
