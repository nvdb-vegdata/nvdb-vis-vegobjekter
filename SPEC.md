# NVDB Vegobjekt Visualizer - Specification

## Overview

A static web application for visualizing road objects (vegobjekter) from the Norwegian Public Roads Administration's database (NVDB) on an interactive map of Norway. The app visualizes road segments (veglenker) and shows which road objects are located on each segment.

## Core Workflow

1. **Select Object Types** - User selects which road object types they want to find
2. **Draw Polygon** - User draws a small polygon on the map
3. **Fetch Veglenker** - App queries veglenkesekvenser within the polygon (limit 10)
4. **Visualize Veglenker** - Display veglenker on map (only those with geometry overlapping polygon)
5. **Fetch Vegobjekter** - For each selected type, fetch vegobjekter using stedfesting filter
6. **Inspect** - View detailed vegobjekt information in a collapsible list

## Key Concepts

### Veglenkesekvenser (Road Link Sequences)
- The road network is divided into veglenkesekvenser
- Each veglenkesekvens contains one or more veglenker (road links)
- Veglenker have geometry (WKT) that can be visualized
- Veglenker have a position range (0.0 to 1.0) along the sequence

### Stedfesting (Location Reference)
- Vegobjekter are located on the road network via stedfesting
- Stedfesting references a veglenkesekvens ID and position(s)
- For lines: startposisjon and sluttposisjon (format: "0.2-0.8@1234")
- For points: single posisjon (format: "0.5@1234")
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
- **Projections**: proj4 for UTM33 support
- **HTTP Client**: Axios
- **Data Fetching**: TanStack Query (React Query)
- **Geometry Manipulation**: Turf.js (@turf/along, @turf/length, @turf/helpers)
- **Styling**: Plain CSS

### API Integration
- **Datakatalog API**: `https://nvdbapiles.atlas.vegvesen.no/datakatalog/api/v1/`
  - Get all road object types with full details (`inkluder=alle`) - cached on load
  - Includes egenskapstyper and tillatte_verdier for enum resolution
  - Synchronous lookup via `getVegobjekttypeById()` after initial load
  
- **Uberiket API**: `https://nvdbapiles.atlas.vegvesen.no/uberiket/api/v1/`
  - Query veglenkesekvenser by polygon
  - Query vegobjekter by type and stedfesting filter

### Code Generation
- Use `@openapitools/openapi-generator-cli@7.14.0`
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
│   │   └── VegobjektList/
│   │       └── VegobjektList.tsx
│   ├── utils/
│   │   └── geometryUtils.ts   # Turf.js-based line slicing for stedfesting
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
| `GET /api/v1/vegobjekttyper?inkluder=alle` | List all road object types with full details (egenskapstyper, tillatte_verdier) |

### Uberiket API
| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/vegnett/veglenkesekvenser` | Query road segments by polygon |
| `GET /api/v1/vegobjekter/{typeId}` | Query road objects by stedfesting |

Query parameters:
- `polygon`: UTM33 polygon coordinates
- `stedfesting`: Filter by position on veglenkesekvens (e.g., "0.4-0.6@123456")
- `inkluder`: Include stedfesting, egenskaper, gyldighetsperiode, barn
- `antall`: Limit results

### Veglenke Position Calculation

Each veglenke has a position range within its veglenkesekvens:
- Veglenkesekvens has `porter` array with `{nummer, posisjon}` entries
- Veglenke has `startport` and `sluttport` (port numbers)
- Position range is calculated by looking up the port positions: find porter where `nummer` matches `startport`/`sluttport`, then use their `posisjon` values

When querying vegobjekter, only the veglenker that geometrically overlap with the drawn polygon are included. The stedfesting filter uses the exact position ranges of these overlapping veglenker (e.g., `0.2-0.4@123,0.6-0.8@456`).

## User Flow

1. **Load Application**
   - Map loads centered on Norway
   - Full datakatalog loads with `inkluder=alle` (shows "Laster datakatalog..." indicator)
   - All vegobjekttyper with egenskapstyper and tillatte_verdier are cached for synchronous lookup

2. **Select Object Types**
   - User searches/browses and selects types of interest
   - Must select at least one type before querying

3. **Draw Selection Polygon**
   - User clicks "Tegn område" button
   - Draws a small polygon on map (recommended: small area)
   - Polygon is converted to UTM33 coordinates

4. **Query and Display**
   - App queries veglenkesekvenser within polygon (limit 10)
   - Veglenker with geometry overlapping polygon are rendered on map
   - For each selected type, queries vegobjekter with stedfesting filter

5. **Inspect Vegobjekter**
   - Click on a veglenke to see related vegobjekter
   - Sidebar shows collapsible list of vegobjekter grouped by type
   - Hovering over a vegobjekt in the list highlights its stedfestinger on the map
   - Each vegobjekt displays:
     - ID
     - Gyldighetsperiode (validity period)
     - Stedfestinger (format: "0.2-0.8@1234")
     - Barn (child object references)
     - Egenskaper (properties with names mapped from datakatalog)
   - Enum values are resolved to their display names

## URL Synchronization

The application synchronizes state with the URL for shareable links:
- **Map view**: Center coordinates and zoom level
- **Polygon**: Drawn selection polygon coordinates
- **Selected types**: List of selected vegobjekttype IDs

## Data Model

### Veglenke (from veglenkesekvens)
```typescript
interface Veglenke {
  nummer: number;
  geometri: { wkt: string; srid: string };
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

### Vegobjekt Display Data
```typescript
interface VegobjektDisplay {
  id: number;
  typeId: number;
  typeName: string;
  gyldighetsperiode?: {
    startdato: string;
    sluttdato?: string;
  };
  stedfestinger: string[]; // formatted as "0.2-0.8@1234"
  barn: { typeId: number; typeName: string; ids: number[] }[];
  egenskaper: { name: string; value: string }[];
}
```

### Egenskap Mapping
- Full datakatalog is fetched once on load with `inkluder=alle`
- Vegobjekttype lookup is synchronous via cached Map (`getVegobjekttypeById()`)
- Map egenskap ID to name using `egenskapstyper[].id` -> `egenskapstyper[].navn`
- For enum types, map value ID to display value using `tillatte_verdier[].id` -> `tillatte_verdier[].kortnavn`

## Overlap Check
To determine if a vegobjekt is on a specific veglenke:
1. Check if vegobjekt's stedfesting.id matches veglenkesekvens.id
2. Check if position ranges overlap

## Future Enhancements (Out of Scope)

- Export selected objects
- Time-based queries
- More than 10 veglenker per query

## Geometri-egenskaper (Egengeometri)

Some vegobjekter have geometry properties (geometri-egenskaper) that represent the object's own geometry, independent of the road network. These are visualized separately from the stedfesting-based highlighting.

### Data Structure
```typescript
interface GeometriEgenskap {
  type: 'GeometriEgenskap';
  verdi: {
    wkt: string;      // WKT geometry (POINT, LINESTRING, POLYGON, etc.)
    srid: number;     // Coordinate reference system (e.g., 5973 = UTM33)
    lengde?: number;  // Length in meters (for lines)
  };
}
```

### Visualization
- Geometri-egenskaper are rendered on the map with a distinct style (purple)
- Point geometries are shown as circles
- Line geometries are shown as dashed lines  
- Polygon geometries are shown with semi-transparent fill
- Hovering over a vegobjekt highlights both its stedfesting AND its geometri-egenskaper
