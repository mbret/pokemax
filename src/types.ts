export type Card = {
  id: string
  name: string
  imageUrl: string
  imageUrlHiRes: string
  nationalPokedexNumber?: number
  subtype?: string
  artist?: string
  japaneseExpansions?: {
    name: string,
    id: string,
    number: string,
    numberMax: string,
  }[]
  set?: string,
  setCode?: string
  series?: string
  number?: string
  rarity?: string
}