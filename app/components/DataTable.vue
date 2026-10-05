<!-- app/components/DataTable.vue -->
<script setup lang="ts" generic="Row extends Record<string, unknown>">
interface Column {
  key: string
  label: string
  align?: 'right'
}

const { columns, rows, minWidth, rowKey } = defineProps<{
  columns: Column[]
  rows: Row[]
  /** e.g. "40rem", so columns don't crush on a narrow viewport inside the scroll container. */
  minWidth?: string
  /** Defaults to the row's index. Pass one when rows can reorder, e.g. `(row) => row.url`. */
  rowKey?: (row: Row) => string | number
}>()

const TH = 'px-4 py-3 text-left text-xs font-medium text-fg-subtle'
const TD = 'px-4 py-3 tabular-nums'

const cellValue = (row: Row, key: string) => {
  const value = row[key]
  return value == null ? '' : value
}
</script>

<template>
  <div :class="[CARD, 'overflow-x-auto']">
    <table class="w-full text-sm" :style="minWidth ? { minWidth } : undefined">
      <thead class="border-b border-line">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="[TH, col.align === 'right' ? 'text-right' : '']"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-line">
        <tr v-for="(row, index) in rows" :key="rowKey ? rowKey(row) : index">
          <td
            v-for="col in columns"
            :key="col.key"
            :class="[TD, col.align === 'right' ? 'text-right' : '']"
          >
            <slot :name="`cell-${col.key}`" :row="row">{{ cellValue(row, col.key) }}</slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
