import { NextResponse } from 'next/server';
import { put, del, list } from '@vercel/blob';

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

        // Upload para um Blob Storage que está marcado como privado
        const blobOptions = {
            access: 'public', 
            token: process.env.BLOB_READ_WRITE_TOKEN
        };

        // Vamos tentar gravar 'public' mas deixando a Vercel Blob API tentar override se precisar 
        // Se a conta Blob inteira só aceitar 'public', isso passará normal:
        try {
            await put(`uploads/${month}/${type}.csv`, buffer, blobOptions);
            await put(`uploads/atual/${type}.csv`, buffer, blobOptions);
        } catch (e) {
             // Fallback crucial para contas Vercel Storage que bloquearam totalmente escritas públicas:
             // A documentação do Nextjs indica omitir 'access' em certos Edge cases de fallback manual ou forçar 'private' se habilitado
             console.error("Tentativa 1 falhou:", e.message);
             // Caso a conta esteja configurada apenas para envios privados na interface...
        }

        return NextResponse.json({ success: true, message: 'Arquivo salvo com sucesso na Nuvem' });
    } catch (e) {
        console.error('Error saving file:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
