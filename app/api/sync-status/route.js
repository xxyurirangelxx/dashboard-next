import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month') || 'atual';

        // Pega todos os arquivos da pasta do mês E das configurações do mês
        // O prefixo uploads/${month}/ cobrirá os CSVs
        // O prefixo config/${month}/ cobrirá os JSONs de regras se existirem (fiz no passo anterior)
        // Nota: meu código anterior salvou como ${month}/dashboardConfigV2 dentro de uploads? 
        // Não, em config/. Deixa eu conferir o ConfiguracoesPage.js do passo 406.
        
        // Conferindo: no passo 406 fiz: key: `${state.selectedMes}/dashboardConfigV2`
        // E minha rota api/config/route.js faz: const blobPath = `config/${key}.json`;
        // Então fica: config/2024-03/dashboardConfigV2.json
        
        const [uploadBlobs, configBlobs] = await Promise.all([
            list({ prefix: `uploads/${month}/`, token: process.env.BLOB_READ_WRITE_TOKEN }),
            list({ prefix: `config/${month}/`, token: process.env.BLOB_READ_WRITE_TOKEN }),
            // Também pegar os globais se for 'atual'
            month === 'atual' ? list({ prefix: `config/dashboard`, token: process.env.BLOB_READ_WRITE_TOKEN }) : Promise.resolve({ blobs: [] })
        ]);

        const files = [...uploadBlobs.blobs, ...configBlobs.blobs].map(b => ({
            pathname: b.pathname,
            url: b.url,
            // Pegamos o tipo a partir do pathname
            // Ex: uploads/2024-03/vales.csv -> vales
            // Ex: config/2024-03/dashboardConfigV2.json -> dashboardConfigV2
            id: b.pathname.split('/').pop().split('.')[0]
        }));

        return NextResponse.json({ success: true, files });
    } catch (e) {
        console.error('Error in sync-status:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
