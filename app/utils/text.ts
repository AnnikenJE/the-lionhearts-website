/**
 * English plurals are irregular often enough that the plural form is passed in rather
 * than guessed by appending an s: "boss" would otherwise read as "bosss".
 */
export const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
  `${count} ${count === 1 ? singular : pluralForm}`
