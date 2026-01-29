import { useSetAtom } from 'jotai'
import { useEffect, useRef, useState } from 'react'
import type { Vegobjekttype } from '../../api/datakatalogClient'
import type { Vegobjekt } from '../../api/uberiketClient'
import { focusedVegobjektAtom } from '../../state/atoms'
import { getVegobjekttypeForType, processVegobjekt } from '../../utils/vegobjektProcessing'
import VegobjektItem from './VegobjektItem'

export default function TypeGroup({
  type,
  objects,
  focusedVegobjektId,
  focusedVegobjektToken,
}: {
  type: Vegobjekttype
  objects: Vegobjekt[]
  focusedVegobjektId?: number
  focusedVegobjektToken?: number
}) {
  const [expanded, setExpanded] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  const [highlightedId, setHighlightedId] = useState<number | null>(null)
  const focusedItemRef = useRef<HTMLLIElement | null>(null)
  const setFocusedVegobjekt = useSetAtom(focusedVegobjektAtom)

  const vegobjekttype = getVegobjekttypeForType(type.id)

  useEffect(() => {
    if (focusedVegobjektId !== undefined && focusedVegobjektToken !== undefined) {
      setExpanded(true)

      setExpandedItems((prev) => {
        const next = new Set(prev)
        next.add(focusedVegobjektId)
        return next
      })
      setHighlightedId(focusedVegobjektId)

      setTimeout(() => {
        focusedItemRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
        setFocusedVegobjekt(null)
      }, 100)
    }
  }, [focusedVegobjektId, focusedVegobjektToken, setFocusedVegobjekt])

  useEffect(() => {
    if (highlightedId === null) return

    const currentId = highlightedId
    const timer = setTimeout(() => {
      setHighlightedId((prev) => (prev === currentId ? null : prev))
    }, 1500)

    return () => clearTimeout(timer)
  }, [highlightedId])

  const processedObjects = objects.map((obj) => ({
    vegobjekt: obj,
    details: processVegobjekt(obj, type.id, vegobjekttype),
  }))

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="vegobjekt-type-group">
      <button type="button" className="vegobjekt-type-header" onClick={() => setExpanded(!expanded)}>
        <span className="vegobjekt-expand">{expanded ? '-' : '+'}</span>
        <span className="vegobjekt-type-name">{type.navn}</span>
        <span className="vegobjekt-type-count">({objects.length})</span>
      </button>

      {expanded && (
        <ul className="vegobjekt-type-content">
          {processedObjects.map(({ vegobjekt, details }) => (
            <VegobjektItem
              key={details.id}
              details={details}
              vegobjekt={vegobjekt}
              isExpanded={expandedItems.has(details.id)}
              isHighlighted={highlightedId === details.id}
              onToggle={() => toggleItem(details.id)}
              itemRef={focusedVegobjektId === details.id ? focusedItemRef : undefined}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
