import { LaneClosureDirection, Sign, SignDisplayType, XmlData, XmlEvent } from './types'
import * as fs from 'fs'
import axios from 'axios'
import { xml2json } from 'xml-js'
import { PrismaClient } from '@prisma/client'

const gz = require('gunzip-file')
require('dotenv').config()

const prisma: PrismaClient = new PrismaClient();

/**
 * Main function, runs on execution
 */
(async () => {
  const start: number = new Date().getTime()
  const xml: string = await download()
  const json: XmlEvent[] = await extract(xml)
  const signs: Map<string, Sign> = transfer(json)
  const count = await load(signs)

  console.log(`${count} signs were loaded in ${new Date().getTime() - start}ms`)
})()

/**
 * Download the latest file from Rijkswaterstaat
 * @return string
 */
async function download (): Promise<string> {
  const urlPath: string = 'http://opendata.ndw.nu/Matrixsignaalinformatie.xml.gz'

  const { data } = await axios.get(urlPath, {
    responseType: 'arraybuffer'
  })

  return data
}

/**
 * Save the GZ, extract it, load the XML data and convert it to JSON
 * @param data
 */
async function extract (data: string): Promise<XmlEvent[]> {
  const gzPath: string = './data/matrix.xml.gz'
  const xmlPath: string = './data/matrix.xml'

  fs.writeFileSync(gzPath, data, { encoding: 'binary' })

  return new Promise((resolve) => {
    gz(gzPath, xmlPath, async () => {
      const xmlString: string = fs.readFileSync(xmlPath, 'utf-8')
      const xmlJson: string = xml2json(xmlString, { compact: true, ignoreDeclaration: true })
      const json: XmlData = JSON.parse(xmlJson)
      const signData: XmlEvent[] = json['SOAP:Envelope']['SOAP:Body']['ndw:NdwVms'].variable_message_sign_events.event
      resolve(signData)
    })
  })
}

/**
 * Transfer the XML data to a Map of signs
 * @param json
 */
function transfer (json: XmlEvent[]): Map<string, Sign> {
  const signs: Map<string, Sign> = new Map<string, Sign>()

  /**
   * Loop through all the signs
   * Check if the sign is already in the map, why?
   * Because the signs are duplicated because the lane and display are separate
   */
  for (const row of json) {
    let sign: Partial<Sign> = {}
    const existingSign = signs.get(row.sign_id.uuid._text)

    if (existingSign) sign = existingSign

    // Set the sign data, according to the sign type
    if (row.lanelocation !== undefined) {
      sign.uuid = row.sign_id.uuid._text
      sign.km = Number(row.lanelocation.km._text)
      sign.road = row.lanelocation.road._text
      sign.lane = Number(row.lanelocation.lane._text)
      sign.carriageway = row.lanelocation.carriageway._text
    } else if (row.display !== undefined) {
      if (row.display.speedlimit !== undefined) {
        sign.type = SignDisplayType.SPEED_LIMIT
        sign.speedLimit = Number(row.display.speedlimit._text)
        sign.hasRedRing = row.display.speedlimit._attributes.red_ring === 'true'
        sign.isFlashing = row.display.speedlimit._attributes.flashing === 'true'
      }
      if (row.display.lane_open !== undefined) {
        sign.type = SignDisplayType.LANE_OPEN
      }
      if (row.display.lane_closed !== undefined) {
        sign.type = SignDisplayType.LANE_CLOSED
      }
      if (row.display.lane_closed_ahead !== undefined) {
        sign.type = SignDisplayType.LANE_CLOSED_AHEAD
        sign.arrowDirection = row.display.lane_closed_ahead.hasOwnProperty('merge_left') ? LaneClosureDirection.LEFT : LaneClosureDirection.RIGHT
        sign.isFlashing = row.display.lane_closed_ahead._attributes.flashing === 'true'
      }
      if (row.display.restriction_end !== undefined) {
        sign.type = SignDisplayType.RESTRICTION_END
      }

      if (row.display.unknown !== undefined) sign.type = SignDisplayType.UNKNOWN

      if (sign.type === undefined) sign.type = SignDisplayType.BLANK
    }

    signs.set(row.sign_id.uuid._text, sign as Sign)
  }

  return signs
}

/**
 * Load the signs into the database and return the number of signs
 * @param signs
 */
async function load (signs: Map<string, Sign>): Promise<number> {
  const signArray: Sign[] = Array.from(signs.values())
  // Use transactions to prevent an empty database
  await prisma.$transaction(
    [
      prisma.sign.deleteMany(),
      prisma.sign.createMany({
        data: signArray
      })
    ]
  )

  return signArray.length

}
