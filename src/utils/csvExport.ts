import type { Vegobjekttype } from '../api/datakatalogClient'
import { getEgenskapstypeById, getEnumVerdiById, getVegobjekttypeById } from '../api/datakatalogClient'
import type { EgenskapVerdi, EnumEgenskap, Stedfesting, Vegobjekt } from '../api/uberiketClient'
import { formatStedfesting, getEgenskapDisplayValue } from '../api/uberiketClient'

function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function getEgenskapValue(egenskap: EgenskapVerdi, vegobjekttype: Vegobjekttype | undefined, egenskapId: number): string {
  if (egenskap.type === 'GeometriEgenskap') return ''
  const egenskapstype = vegobjekttype ? getEgenskapstypeById(vegobjekttype, egenskapId) : undefined
  if (egenskap.type === 'EnumEgenskap' && egenskapstype) {
    const enumVerdi = getEnumVerdiById(egenskapstype, (egenskap as EnumEgenskap).verdi)
    if (enumVerdi) {
      return enumVerdi.kortnavn ?? String(enumVerdi.verdi) ?? `ID: ${enumVerdi.id}`
    }
  }
  return getEgenskapDisplayValue(egenskap)
}

interface ProcessedRow {
  id: number
  versjon: number | undefined
  startdato: string
  sluttdato: string
  stedfesting: string
  egenskaper: Map<string, string>
}

function generateCsvForType(type: Vegobjekttype, objects: Vegobjekt[]): string {
  const rows: ProcessedRow[] = []
  const allEgenskapNames = new Set<string>()
  const vegobjekttype = getVegobjekttypeById(type.id)

  for (const obj of objects) {
    const egenskaper = new Map<string, string>()

    if (obj.egenskaper) {
      for (const [id, egenskap] of Object.entries(obj.egenskaper)) {
        if (egenskap.type === 'GeometriEgenskap') continue
        const egenskapstype = vegobjekttype ? getEgenskapstypeById(vegobjekttype, Number(id)) : undefined
        const name = egenskapstype?.navn ?? `Egenskap ${id}`
        const value = getEgenskapValue(egenskap, vegobjekttype, Number(id))
        if (value) {
          egenskaper.set(name, value)
          allEgenskapNames.add(name)
        }
      }
    }

    const stedfestinger = formatStedfesting(obj.stedfesting as Stedfesting | undefined)

    rows.push({
      id: obj.id,
      versjon: obj.versjon,
      startdato: obj.gyldighetsperiode?.startdato ?? '',
      sluttdato: obj.gyldighetsperiode?.sluttdato ?? '',
      stedfesting: stedfestinger.join('; '),
      egenskaper,
    })
  }

  const sortedEgenskapNames = [...allEgenskapNames].sort()
  const headers = ['ID', 'Versjon', 'Startdato', 'Sluttdato', 'Stedfesting', ...sortedEgenskapNames]

  const csvRows = [headers.map(escapeCsvValue).join(',')]

  for (const row of rows) {
    const values = [
      String(row.id),
      row.versjon != null ? String(row.versjon) : '',
      row.startdato,
      row.sluttdato,
      row.stedfesting,
      ...sortedEgenskapNames.map((name) => row.egenskaper.get(name) ?? ''),
    ]
    csvRows.push(values.map(escapeCsvValue).join(','))
  }

  return csvRows.join('\n')
}

export function downloadCsvPerType(vegobjekterByType: Map<number, Vegobjekt[]>, selectedTypes: Vegobjekttype[]): void {
  for (const type of selectedTypes) {
    const objects = vegobjekterByType.get(type.id)
    if (!objects?.length) continue

    const csv = generateCsvForType(type, objects)
    const typeName = (type.navn ?? `type_${type.id}`).replace(/[/\\?%*:|"<>]/g, '_')
    downloadCsv(csv, `${typeName}.csv`)
  }
}

export function downloadCsvAllTypes(vegobjekterByType: Map<number, Vegobjekt[]>, selectedTypes: Vegobjekttype[]): void {
  const headers = ['TypeID', 'TypeNavn', 'ID', 'Versjon', 'Startdato', 'Sluttdato', 'Stedfesting']
  const csvRows = [headers.map(escapeCsvValue).join(',')]

  for (const type of selectedTypes) {
    const objects = vegobjekterByType.get(type.id)
    if (!objects?.length) continue

    const typeName = type.navn ?? `type_${type.id}`

    for (const obj of objects) {
      const stedfestinger = formatStedfesting(obj.stedfesting as Stedfesting | undefined)
      const values = [
        String(type.id),
        typeName,
        String(obj.id),
        obj.versjon != null ? String(obj.versjon) : '',
        obj.gyldighetsperiode?.startdato ?? '',
        obj.gyldighetsperiode?.sluttdato ?? '',
        stedfestinger.join('; '),
      ]
      csvRows.push(values.map(escapeCsvValue).join(','))
    }
  }

  downloadCsv(csvRows.join('\n'), 'vegobjekter.csv')
}

function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([`\uFEFF${csvContent}`], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
