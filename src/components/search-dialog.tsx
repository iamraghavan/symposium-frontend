
"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { CalendarIcon, File } from "lucide-react"
import api from "@/lib/api"
import type { Event, ApiSuccessResponse } from "@/lib/types"
import { useDebounce } from "@/hooks/use-debounce"

type SearchDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [data, setData] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    async function fetchData() {
      if (debouncedQuery.length <= 1) {
        setData([])
        return
      }

      setLoading(true)
      try {
        const response = await api<ApiSuccessResponse<Event[]>>(`/events?q=${debouncedQuery}&status=published&limit=5&populate=department`)
        if (response.success && response.data) {
          setData(response.data)
        } else {
            setData([])
        }
      } catch (error) {
        console.error("Failed to fetch search results:", error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [debouncedQuery])

  const runCommand = useCallback((command: () => unknown) => {
    onOpenChange(false)
    command()
  }, [onOpenChange])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type a command or search..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {loading && <CommandEmpty>Loading...</CommandEmpty>}
        {!loading && !data.length && debouncedQuery.length > 1 && <CommandEmpty>No results found.</CommandEmpty>}

        {data.length > 0 && (
          <CommandGroup heading="Events">
            {data.map((event) => (
              <CommandItem
                key={event._id}
                value={event.name}
                onSelect={() => {
                  runCommand(() => router.push(`/events/${event._id}`))
                }}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span>{event.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
