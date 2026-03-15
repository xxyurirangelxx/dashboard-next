import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const uploadDir = join(process.cwd(), 'data', 'uploads');
        const dirents = await readdir(uploadDir, { withFileTypes: true });
        
        const months = dirents
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name)
            .sort((a, b) => b.localeCompare(a)); // Descending sort (newest first)
            
        return NextResponse.json({ success: true, months });
    } catch (e) {
        if (e.code === 'ENOENT') {
            // Se o diretório não existir ainda, apenas retorne vazio
            return NextResponse.json({ success: true, months: [] });
        }
        console.error('Error listing months:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
