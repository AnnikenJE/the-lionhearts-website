// @vitest-environment nuxt
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import EmptyState from '../../app/components/EmptyState.vue'

describe('EmptyState', () => {
  it('renders the message', async () => {
    const wrapper = await mountSuspended(EmptyState, { props: { message: 'No raid nights logged in Nerub-ar Palace.' } })
    expect(wrapper.text()).toBe('No raid nights logged in Nerub-ar Palace.')
  })

  it('merges a passed-in class with its own', async () => {
    const wrapper = await mountSuspended(EmptyState, { props: { message: 'Nothing yet.' }, attrs: { class: 'mt-8' } })
    expect(wrapper.classes()).toContain('mt-8')
    expect(wrapper.classes()).toContain('text-fg-muted')
  })
})
