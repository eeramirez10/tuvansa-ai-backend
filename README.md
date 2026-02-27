# Quote Extractor Backend (MVP Fase 1)

Backend en Node + TypeScript para extraer partidas de cotizaciones desde:
- `xlsx/xls`
- `pdf` digital

Arquitectura:
- `src/domain`
- `src/infrastructure`
- `src/presentation`

## Requisitos
- Node.js 20+
- `OPENAI_API_KEY`

## Instalacion
```bash
npm install
cp .env.example .env
```

## Desarrollo
```bash
npm run dev
```

Health check:
```bash
curl http://localhost:3000/health
```

## Endpoint principal
`POST /api/extract`

Campo multipart esperado:
- `file`: archivo `xlsx/xls/pdf`

Ejemplo:
```bash
curl -X POST http://localhost:3000/api/extract \
  -F "file=@/ruta/a/cotizacion.xlsx"
```

## Respuesta
```json
{
  "file_name": "cotizacion.xlsx",
  "file_type": "xlsx",
  "items_count": 1,
  "items": [
    {
      "description_original": "VALVULA COMPUERTA 2 ACERO AL CARBON 10 PZ",
      "description_normalizada": "valvula compuerta 2 acero al carbon",
      "cantidad": 10,
      "unidad_original": "PZ",
      "unidad_normalizada": "pza",
      "idioma": "es",
      "requiere_revision": false
    }
  ]
}
```

## Estructura Presentation
- `src/presentation/quote-extraction/quote-extraction.routes.ts`
- `src/presentation/quote-extraction/quote-extraction.controller.ts`
- `src/presentation/app-routes.ts`
- `src/presentation/server.ts`
