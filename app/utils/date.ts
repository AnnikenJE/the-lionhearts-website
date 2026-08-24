/** Post dates are authored as ISO strings and always shown in en-GB long form. */
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
