// @vitest-environment nuxt
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import DataTable from '../../app/components/DataTable.vue'

describe('DataTable', () => {
  it('renders column labels as headers', async () => {
    const wrapper = await mountSuspended(DataTable, {
      props: {
        columns: [{ key: 'name', label: 'Name' }, { key: 'score', label: 'Score', align: 'right' }],
        rows: [{ name: 'Brightblade', score: 42 }],
      },
    })
    expect(wrapper.findAll('th').map(th => th.text())).toEqual(['Name', 'Score'])
  })

  it('falls back to the raw cell value when no slot is provided for a column', async () => {
    const wrapper = await mountSuspended(DataTable, {
      props: {
        columns: [{ key: 'name', label: 'Name' }],
        rows: [{ name: 'Brightblade' }],
      },
    })
    expect(wrapper.text()).toContain('Brightblade')
  })

  it('renders a scoped slot instead of the raw value when one is provided', async () => {
    const wrapper = await mountSuspended(DataTable, {
      props: {
        columns: [{ key: 'name', label: 'Name' }],
        rows: [{ name: 'Brightblade' }],
      },
      slots: {
        'cell-name': ({ row }: { row: { name: string } }) => `Sir ${row.name}`,
      },
    })
    expect(wrapper.text()).toBe('NameSir Brightblade')
  })

  it('renders no rows, without erroring, when rows is empty', async () => {
    const wrapper = await mountSuspended(DataTable, {
      props: { columns: [{ key: 'name', label: 'Name' }], rows: [] },
    })
    expect(wrapper.findAll('tbody tr')).toHaveLength(0)
  })

  it('renders an empty cell rather than the literal string "undefined" for a missing key', async () => {
    const wrapper = await mountSuspended(DataTable, {
      props: { columns: [{ key: 'spec', label: 'Spec' }], rows: [{ name: 'Brightblade' }] },
    })
    expect(wrapper.find('td').text()).toBe('')
  })

  it('right-aligns a column flagged align: "right"', async () => {
    const wrapper = await mountSuspended(DataTable, {
      props: { columns: [{ key: 'score', label: 'Score', align: 'right' }], rows: [{ score: 1 }] },
    })
    expect(wrapper.find('th').classes()).toContain('text-right')
    expect(wrapper.find('td').classes()).toContain('text-right')
  })
})
