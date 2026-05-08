/**
 * Custom input fields per story slug.
 * Stories can require extra personalization beyond the child's name
 * (e.g. home city, stuffed animal name).
 * These are defined here (not in Strapi) since they are UI/UX configuration.
 */

import type { CustomInput } from '~/types/story'

export const STORY_CUSTOM_INPUTS: Record<string, CustomInput[]> = {
  'georgian-sleep-star': [
    {
      id: 'city',
      label_es: 'Ciudad natal',
      label_en: 'Home city',
      placeholder: 'Berlin, Madrid, Tbilisi...',
      required: true,
    },
    {
      id: 'kuscheltier',
      label_es: 'Nombre del peluche favorito',
      label_en: 'Stuffed animal name',
      placeholder: 'Teddy, Conejito, Oso...',
      required: true,
    },
  ],
}
