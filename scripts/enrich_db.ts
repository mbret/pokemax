import existingDb from '../db.json'
import { Card } from '../src/types'
import cheerio from 'cheerio'
import { isEqual } from 'lodash'
import axios from 'axios'
const fs = require('fs')
const pokemon = require('pokemontcgsdk')

const jpExpansions: { [key: string]: string | undefined } = {
  'Psychic Mew V Deck': 'sd',
  'Premium Champion Pack': 'cp4',
  'Japanese expansion': undefined,
  'The Best of XY': 'xy',
  'Bandit Ring': 'xyz',
  'Miracle Crystal': 'xyz',
  'Amazing Volt Tackle': 's4',
  'Emerald Break': 'xy6',
  'Dark Rush': 'bw4',
  'Cry from the Mysterious': 'dp5',
  'Clash of the Blue Sky': '',
  'World Champions Pack': '',
  'XY Beginning Set': 'hxy',
  'Hail Blizzard': 'bw3',
  'Legendary Heartbeat': 's3a',
  'Rulers of the Heavens': '',
  'Fever-Burst Fighter': '30px',
  'SM-P Promotional cards': 'promo',
  'Tag All Stars': '',
  'XY-P Promotional cards': 'promo',
  'Great Detective Pikachu': 'smp2',
  'DPt-P Promotional cards': 'promo',
  'BW-P Promotional cards': 'promo',
  'Strength Expansion Pack Sun & Moon': 'sm1+',
  'Bonds to the End of Time': 'pt2',
  'Clash at the Summit': 'l3',
  'Rocket Gang': 'r',
}

// let existingDbTyped = (existingDb as Card[]).filter(i => i.id === 'swsh4-175')
let existingDbTyped = existingDb as Card[]

  ; (async () => {
    const CHUNK_SIZE = 1
    const MAX_ELEMENTS = existingDbTyped.length
    // const MAX_ELEMENTS = 200

    let chunkedArrays = []
    let currentIndex = 0

    while (currentIndex <= MAX_ELEMENTS) {
      const newChunk = existingDbTyped.slice(currentIndex, CHUNK_SIZE > MAX_ELEMENTS ? currentIndex + MAX_ELEMENTS : currentIndex + CHUNK_SIZE)
      chunkedArrays.push(newChunk)
      currentIndex = currentIndex + CHUNK_SIZE
    }

    console.log(chunkedArrays.reduce((acc, v) => acc + v.length, 0))
    console.log(chunkedArrays.map(v => v.length))

    const process = async (item: Card): Promise<Card> => {
      try {
        let normalizedName = `${item.name.split(' ').join('_')}_(${item.set}_${item.number})`
          .trim()
          .replace(/ /ig, '_')
          .replace(/SWSH_Black_Star_Promos_SWSH0/ig, 'SWSH_Promo_')
          .replace(/Celebi_Star/ig, 'Celebi_☆')
          .replace(/\(Base_/ig, '(Base_Set_')
          .replace(/HS—/ig, '') // HS—Undaunted -> Undaunted
        if (item.series === 'EX') {
          normalizedName = normalizedName.replace(/_\(/ig, '_(EX_')
        }
        if (item.rarity === 'Rare Holo Lv.X') {
          normalizedName = normalizedName.replace(/_\(/ig, '_LV.X_(')
        }

        const nameUri = encodeURIComponent(normalizedName)
        const uri = `http://bulbapedia.bulbagarden.net/wiki/${nameUri}`
        let response
        try {
          response = await axios.get(uri)
        } catch (e) {
          if (e?.response?.status === 404) {
            console.error(item.id, `not found for ${uri}`)
            return item
          }
          throw e
        }

        if (response.status !== 200 || !response.data) {
          console.error(normalizedName, `not found`)
          return item
        }

        const $ = cheerio.load(response.data);

        // lookup every japanese expansions and numbers
        const el = $('td > b').filter((_, element) => {
          const tdTitle = $(element).text().trim()
          if (tdTitle === 'Japanese expansion') {
            return true
          }
          return false
        })

        const jsExpansionsFound: { name: string, number: string }[] = []

        // each <b>
        $(el).each((_, element) => {
          let cardNumber = ''
          const parentTd = $(element).parent('td')
          const nextTd = $(parentTd).next('td')
          const expansionName = $(nextTd).text().trim()

          // b -> td -> tr -> tbody
          const parentTbody = $(element).parent().parent().parent()

          if (!jpExpansions[expansionName]) {
            console.log(`missing japanese expansion id for ${expansionName} cf https://bulbapedia.bulbagarden.net${$(nextTd).find('a').attr('href')}`)
          }

          // lookup the card number
          $(parentTbody).find('tr td b').each((_, el) => {
            if ($(el).text().trim() === 'Japanese card no.') {
              cardNumber = $(el).parent().next().text().trim()
            }
          })

          jsExpansionsFound.push({ name: expansionName, number: cardNumber })
        })

        return {
          ...item,
          japaneseExpansions: jsExpansionsFound.map((expansion) => {
            const [number, numberMax] = expansion.number.split('/')
            const expansionId = jpExpansions[expansion.name]

            return {
              name: expansion.name,
              id: expansionId || '',
              number,
              numberMax: numberMax || ''
            }
          })
        }
      } catch (e) {
        console.error(e)
        return item
      }
    }

    await chunkedArrays.reduce(async (promises, chunk) => {
      const prevRes = await promises

      const enrichedChunk = await Promise.all(chunk.map(async (item) => {
        const newItem = await process(item)
        if (!isEqual(newItem, item)) {
          console.log(`update found for ${item.id}`)
          console.log(newItem)
          existingDbTyped = existingDbTyped.map(card => card.id === item.id ? { ...card, ...newItem } : card)
          await fs.promises
            .writeFile(
              '../db.json',
              JSON.stringify(existingDbTyped),
              'utf-8'
            )
        }

        return newItem
      }))

      return new Promise(resolve => {
        setImmediate(() => {
          resolve([...prevRes, ...enrichedChunk])
        })
      })
    }, Promise.resolve([] as Card[]))

    // const finalDb = db.map(item => ({
    //   ...enrichedDb.find(({ id }) => id === item.id),
    //   ...item
    // }))

    // fs.promises.writeFile('db.json', JSON.stringify(finalDb), 'utf-8').then().catch(console.error)
  })()