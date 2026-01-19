# NVDB Vegobjekt Visualizer - Specification

## Overview

A static web application for visualizing road objects (vegobjekter) from the Norwegian Public Roads Administration's database (NVDB) on an interactive map of Norway. The app visualizes road segments (veglenker) and shows which road objects are located on each segment.

## Core Workflow

1. **Select Object Types** - User selects which road object types they want to find
2. **Draw Polygon** - User draws a small polygon on the map
3. **Fetch Veglenker** - App queries veglenkesekvenser within the polygon (limit 10)
4. **Fetch Vegobjekter** - For each selected type, fetch vegobjekter using stedfesting filter
5. **Visualize** - Display veglenker on map with their geometry
6. **Inspect** - Click a veglenke to see all vegobjekter located on it

## Key Concepts

### Veglenkesekvenser (Road Link Sequences)
- The road network is divided into veglenkesekvenser
- Each veglenkesekvens contains one or more veglenker (road links)
- Veglenker have geometry (WKT) that can be visualized
- Veglenker have a position range (0.0 to 1.0) along the sequence

### Stedfesting (Location Reference)
- Vegobjekter are located on the road network via stedfesting
- Stedfesting references a veglenkesekvens ID and position(s)
- For lines: startposisjon and sluttposisjon
- For points: single posisjon
- Overlap detection: check if object's position range intersects veglenke's position range

### Uberiket API
- "Uberiket" means "unenriched" - no geometry on vegobjekter
- Geometry comes from the veglenker (road network)
- Must query veglenkesekvenser separately to get geometry
- Use `stedfesting` filter to find vegobjekter on specific veglenker

## Technical Stack

### Frontend
- **Runtime**: Bun
- **Framework**: React 18+ with TypeScript
- **Build**: Bun.serve() with HTML imports
- **Map Library**: OpenLayers 9+
- **HTTP Client**: Axios
- **Styling**: Plain CSS

### API Integration
- **Datakatalog API**: `https://nvdbapiles.atlas.vegvesen.no/datakatalog/api/v1/`
  - Get all road object types (cached on load)
  
- **Uberiket API**: `https://nvdbapiles.atlas.vegvesen.no/uberiket/api/v1/`
  - Query veglenkesekvenser by polygon
  - Query vegobjekter by type and stedfesting filter

### Code Generation
- Use `@openapitools/openapi-generator-cli@7.19.0`
- Generate TypeScript-Axios clients for both APIs

## Project Structure

```
nvdb-vis-vegobjekter/
├── src/
│   ├── api/
│   │   ├── generated/         # Generated API clients
│   │   ├── datakatalogClient.ts
│   │   └── uberiketClient.ts
│   ├── components/
│   │   ├── Map/
│   │   │   └── MapView.tsx
│   │   ├── ObjectTypeSelector/
│   │   │   └── ObjectTypeSelector.tsx
│   │   └── VeglenkeDetails/
│   │       └── VeglenkePopup.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── specs/
│   ├── datakatalog.json
│   └── uberiket.json
├── package.json
├── tsconfig.json
├── server.ts
└── index.html
```

## API Endpoints Used

### Datakatalog API
| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/vegobjekttyper` | List all road object types (cached) |

### Uberiket API
| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/vegnett/veglenkesekvenser` | Query road segments by polygon |
| `GET /api/v1/vegobjekter/{typeId}` | Query road objects by stedfesting |

Query parameters:
- `polygon`: UTM33 polygon coordinates
- `stedfesting`: Filter by position on veglenkesekvens (e.g., "0-1@123456")
- `inkluder`: Include stedfesting data
- `antall`: Limit results

## User Flow

1. **Load Application**
   - Map loads centered on Norway
   - Object types load from Datakatalog API and are cached

2. **Select Object Types**
   - User searches/browses and selects types of interest
   - Must select at least one type before querying

3. **Draw Selection Polygon**
   - User clicks "Tegn område" button
   - Draws a small polygon on map (recommended: small area)
   - Polygon is converted to UTM33 coordinates

4. **Query and Display**
   - App queries veglenkesekvenser within polygon (limit 10)
   - For each selected type, queries vegobjekter with stedfesting filter
   - Veglenker rendered on map with their geometry
   - Each veglenke colored to indicate it has objects

5. **Inspect Veglenke**
   - User clicks on a veglenke
   - Popup shows list of vegobjekter grouped by type
   - Shows object ID and key properties

## Data Model

### Veglenke (from veglenkesekvens)
```typescript
interface Veglenke {
  nummer: number;
  geometri: { wkt: string; srid: string };
  // position within sequence (port-based)
  startport: number;
  sluttport: number;
}
```

### Vegobjekt stedfesting
```typescript
interface StedfestingLinje {
  id: number; // veglenkesekvens ID
  startposisjon: number;
  sluttposisjon: number;
}
```

### Overlap Check
To determine if a vegobjekt is on a specific veglenke:
1. Check if vegobjekt's stedfesting.id matches veglenkesekvens.id
2. Check if position ranges overlap

## Future Enhancements (Out of Scope)

- Support for egengeometri (object's own geometry)
- Export selected objects
- Time-based queries
- More than 10 veglenker per query
