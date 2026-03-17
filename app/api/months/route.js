import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Encontra todos os blobs do Vercel começando com uploads/
        const { blobs } = await list({ prefix: 'uploads/' });
        
        const monthSet = new Set();
        
        for (const blob of blobs) {
            // O caminho será tipo: uploads/2024-03/vales.csv
            const parts = blob.pathname.split('/');
            
            if (parts.length >= 3 && parts[1] !== 'atual') {
                monthSet.add(parts[1]);
            }
        }
        
        const months = Array.from(monthSet).sort((a, b) => b.localeCompare(a)); // Ordem decrescente
            
        return NextResponse.json({ success: true, months });
    } catch (e) {
        console.error('Error listing months:', e);
        // Em caso de erro (ex: storage não configurado), retorna um array vazio para não quebrar o frontend
        return NextResponse.json({ success: true, months: [], error: e.message });
    }
}
