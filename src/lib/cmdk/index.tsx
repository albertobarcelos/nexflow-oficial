import * as React from 'react'

type Children = { children?: React.ReactNode }
type DivProps = React.HTMLAttributes<HTMLDivElement>

type State = {
  search: string
  value: string
  filtered: Item[]
  items: Item[]
}

type Item = {
  id: string
  value: string
  children: React.ReactNode
  disabled: boolean
  onSelect: (value: string) => void
}

const CommandContext = React.createContext<{
  search: string
  value: string
  filtered: Item[]
  setSearch: (search: string) => void
  setValue: (value: string) => void
  registerItem: (item: Item) => () => void
}>({
  search: '',
  value: '',
  filtered: [],
  setSearch: () => {},
  setValue: () => {},
  registerItem: () => () => {},
})

export function Command({ children, ...props }: DivProps & Children) {
  const [state, setState] = React.useState<State>({
    search: '',
    value: '',
    filtered: [],
    items: [],
  })

  const registerItem = React.useCallback((item: Item) => {
    setState((prev) => ({
      ...prev,
      items: [...prev.items, item],
      filtered: [...prev.filtered, item],
    }))

    return () => {
      setState((prev) => ({
        ...prev,
        items: prev.items.filter((i) => i.id !== item.id),
        filtered: prev.filtered.filter((i) => i.id !== item.id),
      }))
    }
  }, [])

  const setSearch = React.useCallback((search: string) => {
    setState((prev) => ({
      ...prev,
      search,
      filtered: prev.items.filter((item) =>
        item.value.toLowerCase().includes(search.toLowerCase())
      ),
    }))
  }, [])

  const setValue = React.useCallback((value: string) => {
    setState((prev) => ({ ...prev, value }))
  }, [])

  return (
    <CommandContext.Provider
      value={{
        search: state.search,
        value: state.value,
        filtered: state.filtered,
        setSearch,
        setValue,
        registerItem,
      }}
    >
      <div {...props}>{children}</div>
    </CommandContext.Provider>
  )
}

export function CommandInput({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  const { setSearch } = React.useContext(CommandContext)

  return (
    <input
      {...props}
      onChange={(e) => {
        setSearch(e.target.value)
        props.onChange?.(e)
      }}
    />
  )
}

export function CommandList({ children, ...props }: DivProps & Children) {
  return <div {...props}>{children}</div>
}

export function CommandEmpty({ children, ...props }: DivProps & Children) {
  const { filtered } = React.useContext(CommandContext)
  if (filtered.length > 0) return null
  return <div {...props}>{children}</div>
}

export function CommandGroup({ children, ...props }: DivProps & Children) {
  return <div {...props}>{children}</div>
}

export function CommandItem({
  value,
  onSelect,
  disabled = false,
  children,
  ...props
}: DivProps & {
  value: string
  onSelect?: (value: string) => void
  disabled?: boolean
}) {
  const { registerItem, setValue } = React.useContext(CommandContext)
  const id = React.useId()

  React.useEffect(() => {
    return registerItem({
      id,
      value,
      disabled,
      onSelect: (value) => {
        setValue(value)
        onSelect?.(value)
      },
      children,
    })
  }, [id, value, disabled, onSelect, children, registerItem, setValue])

  const handleClick = () => {
    if (!disabled) {
      setValue(value)
      onSelect?.(value)
    }
  }

  return (
    <div
      {...props}
      onClick={handleClick}
      data-disabled={disabled}
      role="option"
      aria-disabled={disabled}
    >
      {children}
    </div>
  )
}

Command.Input = CommandInput
Command.List = CommandList
Command.Empty = CommandEmpty
Command.Group = CommandGroup
Command.Item = CommandItem
