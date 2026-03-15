import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

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

        // Upload to a dedicated data folder to avoid Next.js public caching issues
        // Root of the project / data / uploads / YYYY-MM
        const uploadDir = join(process.cwd(), 'data', 'uploads', month);
        const atualDir = join(process.cwd(), 'data', 'uploads', 'atual');
        
        await mkdir(uploadDir, { recursive: true });
        await mkdir(atualDir, { recursive: true });

        const filePath = join(uploadDir, `${type}.csv`);
        const atualFilePath = join(atualDir, `${type}.csv`);
        
        await writeFile(filePath, buffer);
        await writeFile(atualFilePath, buffer);
        
        return NextResponse.json({ success: true, message: 'Arquivo salvo com sucesso' });
    } catch (e) {
        console.error('Error saving file:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
