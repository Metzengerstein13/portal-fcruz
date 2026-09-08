import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '20mb' }));

  // API endpoints
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Centralized Shared Documents Store (Cloudinary Resources & Metadata)
  interface ServerDocumentItem {
    id: string;
    title: string;
    description: string;
    category: string;
    fileType: string;
    fileUrl: string;
    fileName: string;
    fileSize: string;
    fileSizeBytes: number;
    format: string;
    uploadedBy: string;
    uploaderName: string;
    createdAt: string;
    tags: string[];
    pinned?: boolean;
    downloadsCount?: number;
    updatedAt?: number;
    cloudinaryPublicId?: string;
  }

  const sharedDocuments: ServerDocumentItem[] = [];

  // Helper to extract Cloudinary context string: title=...|description=...|category=...
  function parseContextString(ctx: any): { title?: string; description?: string; category?: string } {
    if (!ctx) return {};
    if (ctx.custom && typeof ctx.custom === 'object') {
      return {
        title: ctx.custom.title ? String(ctx.custom.title).trim() : undefined,
        description: ctx.custom.description ? String(ctx.custom.description).trim() : undefined,
        category: ctx.custom.category ? String(ctx.custom.category).trim() : undefined,
      };
    }
    if (typeof ctx === 'object') {
      return {
        title: ctx.title ? String(ctx.title).trim() : undefined,
        description: ctx.description ? String(ctx.description).trim() : undefined,
        category: ctx.category ? String(ctx.category).trim() : undefined,
      };
    }
    if (typeof ctx === 'string') {
      const parts = ctx.split('|');
      const res: Record<string, string> = {};
      for (const p of parts) {
        const eq = p.indexOf('=');
        if (eq > -1) {
          res[p.substring(0, eq).trim()] = p.substring(eq + 1).trim();
        }
      }
      return { title: res.title, description: res.description, category: res.category };
    }
    return {};
  }

  // Centralized Documents API: GET
  app.get('/api/documents', async (_req, res) => {
    try {
      // 1. Try querying Cloudinary resource list endpoints
      const endpoints = [
        'https://res.cloudinary.com/pn5kmum3/image/list/v1_1/documents.json',
        'https://res.cloudinary.com/pn5kmum3/image/list/documents.json',
        'https://res.cloudinary.com/pn5kmum3/raw/list/documents.json'
      ];

      for (const ep of endpoints) {
        try {
          const cldRes = await fetch(ep);
          if (cldRes.ok) {
            const data = await cldRes.json();
            if (data && Array.isArray(data.resources)) {
              for (const r of data.resources) {
                const ctx = parseContextString(r.context);
                const rawPubId = r.public_id || r.id || r.asset_id;
                const pubId = String(rawPubId || `cld_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`);
                const format = (r.format || 'pdf').toLowerCase();
                const title = ctx.title || r.original_filename || pubId.split('/').pop() || 'Documento Cloudinary';
                const desc = ctx.description || '';
                const cat = ctx.category || 'Documentos Oficiales';
                const secUrl = r.secure_url || `https://res.cloudinary.com/pn5kmum3/image/upload/${r.public_id}.${format}`;

                const existingIdx = sharedDocuments.findIndex(d => d.id === pubId || d.cloudinaryPublicId === pubId);
                const docItem: ServerDocumentItem = {
                  id: pubId,
                  title: title,
                  description: desc,
                  category: cat,
                  fileType: format === 'pdf' ? 'pdf' : (['jpg', 'jpeg', 'png', 'webp'].includes(format) ? 'image' : 'doc'),
                  fileUrl: secUrl,
                  fileName: `${pubId.split('/').pop()}.${format}`,
                  fileSize: r.bytes ? `${(r.bytes / (1024 * 1024)).toFixed(1)} MB` : '1.5 MB',
                  fileSizeBytes: r.bytes || 1572864,
                  format: format,
                  uploadedBy: 'deliriumtremens365@gmail.com',
                  uploaderName: 'Ing. Carlos Mauricio López',
                  createdAt: r.created_at ? r.created_at.split('T')[0] : '2026-08-01',
                  tags: Array.isArray(r.tags) ? r.tags : ['documents', cat],
                  pinned: false,
                  downloadsCount: 0,
                  updatedAt: Date.now(),
                  cloudinaryPublicId: pubId
                };

                if (existingIdx > -1) {
                  sharedDocuments[existingIdx] = { ...sharedDocuments[existingIdx], ...docItem };
                } else {
                  sharedDocuments.push(docItem);
                }
              }
            }
          }
        } catch (e) {
          // Cloudinary endpoint may be restricted; fallback gracefully to shared server store
        }
      }

      res.json({ success: true, documents: sharedDocuments });
    } catch (err: any) {
      console.error('Error fetching shared documents:', err);
      res.json({ success: true, documents: sharedDocuments });
    }
  });

  // Centralized Documents API: POST (Register new upload from Cloudinary)
  app.post('/api/documents', (req, res) => {
    try {
      const doc = req.body;
      if (!doc || !doc.id || !doc.fileUrl) {
        return res.status(400).json({ error: 'Datos de documento inválidos' });
      }

      const existingIdx = sharedDocuments.findIndex(d => d.id === doc.id || d.cloudinaryPublicId === doc.id);
      if (existingIdx > -1) {
        sharedDocuments[existingIdx] = { ...sharedDocuments[existingIdx], ...doc, updatedAt: Date.now() };
      } else {
        sharedDocuments.unshift({ ...doc, updatedAt: Date.now() });
      }

      res.json({ success: true, document: doc, total: sharedDocuments.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Centralized Documents API: DELETE
  app.delete('/api/documents/:id', (req, res) => {
    try {
      const { id } = req.params;
      const idx = sharedDocuments.findIndex(d => d.id === id || d.cloudinaryPublicId === id);
      if (idx > -1) {
        sharedDocuments.splice(idx, 1);
      }
      res.json({ success: true, total: sharedDocuments.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Centralized Documents API: PATCH
  app.patch('/api/documents/:id', (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const idx = sharedDocuments.findIndex(d => d.id === id || d.cloudinaryPublicId === id);
      if (idx > -1) {
        sharedDocuments[idx] = { ...sharedDocuments[idx], ...updates, updatedAt: Date.now() };
        return res.json({ success: true, document: sharedDocuments[idx] });
      }
      res.status(404).json({ error: 'Documento no encontrado' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Pre-configured YouTube videos for Ferretería Cruz channel & partner hardware guides
  app.get('/api/youtube-channel', (_req, res) => {
    res.json({
      channelName: 'Ferretería Cruz - Calidad y Servicio',
      channelUrl: 'https://youtube.com',
      subscribers: '12.4K',
      videos: [
        {
          id: 'yt_1',
          youtubeId: 'q8-eI4iMUp8',
          title: 'Demostración y Guía de Uso: Rotomartillos y Taladros Inalámbricos Truper',
          description: 'Aprende a elegir el taladro y rotomartillo adecuado según el material (concreto, madera, metal) y consejos de seguridad para mantenimiento.',
          category: 'Tutoriales',
          publishedAt: '2026-07-28',
          duration: '8:45',
          views: '3.2K',
          thumbnail: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
          tags: ['Herramientas', 'Truper', 'Seguridad']
        },
        {
          id: 'yt_2',
          youtubeId: 'W4O3aBq3kE8',
          title: 'Instalación Correcta de Calentadores Solares y Sistemas Rotoplas',
          description: 'Paso a paso para la interconexión de tuberías PPR y termofusión en azoteas con productos garantizados.',
          category: 'Plomería & Agua',
          publishedAt: '2026-07-15',
          duration: '12:10',
          views: '5.8K',
          thumbnail: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
          tags: ['Rotoplas', 'Plomería', 'Sostenibilidad']
        },
        {
          id: 'yt_3',
          youtubeId: 'Yv4396P3SgY',
          title: 'Técnicas de Aplicación de Pintura e Impermeabilizantes en Superficies',
          description: 'Cómo preparar la pared, sellar grietas y aplicar selladores acrílicos para evitar filtraciones de humedad.',
          category: 'Pintura & Acabados',
          publishedAt: '2026-06-30',
          duration: '10:15',
          views: '4.1K',
          thumbnail: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
          tags: ['Pintura', 'Impermeabilización', 'Consejos']
        },
        {
          id: 'yt_4',
          youtubeId: 'J4aV0jTfXwA',
          title: 'Novedades de Catálogo 2026: Línea Industrial Dewalt y Urrea en Ferretería Cruz',
          description: 'Recorrido por la gama de esmeriladoras, lijadoras y juegos de llaves disponibles para talleres y profesionales.',
          category: 'Demostraciones',
          publishedAt: '2026-06-12',
          duration: '6:50',
          views: '2.9K',
          thumbnail: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&auto=format&fit=crop&q=80',
          tags: ['Dewalt', 'Urrea', 'Novedades']
        },
        {
          id: 'yt_5',
          youtubeId: 'R7n79O1x-18',
          title: 'Capacitación Interna: Protocolo de Atención al Cliente y Asesoría Técnica',
          description: 'Video de inducción para el equipo de mostrador y ventas sobre cómo solucionar las necesidades técnicas del cliente.',
          category: 'Capacitación Interna',
          publishedAt: '2026-05-20',
          duration: '15:30',
          views: '1.2K',
          thumbnail: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&auto=format&fit=crop&q=80',
          tags: ['Capacitación', 'Servicio', 'Ferretería Cruz']
        },
        {
          id: 'yt_6',
          youtubeId: 'L293aB4kYyM',
          title: 'Cerrajería y Sistemas de Seguridad Phillips: Instalación de Cerraduras Digitales',
          description: 'Guía técnica para instalar cerrojos electrónicos, chapa de alta seguridad e instrucciones de programación.',
          category: 'Cerrajería',
          publishedAt: '2026-05-02',
          duration: '9:20',
          views: '3.7K',
          thumbnail: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&auto=format&fit=crop&q=80',
          tags: ['Phillips', 'Cerrajería', 'Seguridad']
        }
      ]
    });
  });

  // Optional Gemini Hardware AI Assistant Proxy
  app.post('/api/ai/assistant', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: 'GEMINI_API_KEY not set',
          reply: 'El asistente de IA no está configurado actualmente en las variables de entorno. Puedes consultar los manuales y listas de precios en el panel de documentos.'
        });
      }

      const { prompt, context } = req.body;
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Eres el Asistente Virtual de Ferretería Cruz (Slogan: "Calidad y Servicio"). 
Ayuda al usuario (colaborador o cliente) con consultas técnicas sobre productos de ferretería, herramientas, materiales de construcción, equivalencias de repuestos, cálculo de material o resúmenes de documentos internos.
Responde en español de forma profesional, clara y cordial.

Contexto adicional: ${context || 'Ninguno'}

Pregunta del usuario: ${prompt}`
      });

      res.json({ reply: response.text });
    } catch (err: any) {
      console.error('Error in AI endpoint:', err);
      res.status(500).json({ error: 'Error al procesar la solicitud con Gemini', details: err.message });
    }
  });

  // Vite middleware for dev or Static files for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
