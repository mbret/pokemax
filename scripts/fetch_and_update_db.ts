import { isEqual } from 'lodash'
import { Card } from '../src/types'
// @ts-ignore
import pokemon from 'pokemontcgsdk'
import existingDb from '../db.json'
import fs from 'fs'

const existingDbTyped = existingDb as Card[]

  ; (async () => {
    try {
      const db = await new Promise<Card[]>((resolve, reject) => {
        let pok: Card[] = []

        const query = pokemon.card.all()

        query.on('data', function (card: Card) {
          pok.push(card)
        })

        query.on('end', () => {
          resolve(pok)
        })

        query.on('error', reject)
      })

      let updated = false

      const newDb = await Promise.all(db.map(async (card) => {
        const existing = existingDbTyped.find(existingCard => existingCard.id === card.id)
        const { japaneseNumber, japaneseSetNumberMax, ...restExisting } = existing || {}

        if (existing && !isEqual(restExisting, card)) {
          updated = true
          console.log(`update found for ${card.id}`)
          return { ...existing, ...card }
        }

        if (existing) return existing

        console.log(`new card found ${card.id}`)
        updated = true
        return card
      }))

      if (updated) {
        try {
          await fs.promises.writeFile('../db.json', JSON.stringify(newDb), 'utf-8').catch(console.error)
          console.log('Update finished')
        } catch (e) {
          console.error(e)
        }
      } else {
        console.log('No update found')
      }
    } catch (e) {
      console.error(e)
    }
  })()