enum SignDisplayType {
  BLANK,
  UNKNOWN,
  SPEED_LIMIT,
  RESTRICTION_END,
  LANE_CLOSED,
  LANE_OPEN, // green arrow
  LANE_CLOSED_AHEAD,
}

enum LaneClosureDirection {
  LEFT,
  RIGHT,
}

interface Sign {
  uuid: string
  type: SignDisplayType,
  lane: number,
  carriageway: string,
  km: number,
  road: string,
  speedLimit?: number | null,
  isFlashing?: boolean | null,
  hasRedRing?: boolean | null,
  arrowDirection?: LaneClosureDirection | null,
}

interface XmlData {
  'SOAP:Envelope': {
    'SOAP:Body': {
      'ndw:NdwVms': {
        subscription: {
          subscriptionState: {
            _text: string
          },
          updateMethod: {
            _text: string
          }
        }
        variable_message_sign_events: {
          meta: {
            msg_id: {
              uuid: {
                _text: string
              }
            }
          },
          event: XmlEvent[]
        }
      }
    }
  }
}

interface XmlEvent {
  ts_event: {
    _text: string
  }
  ts_state: {
    _text: string
  }
  sign_id: {
    uuid: {
      _text: string
    }
  }
  lanelocation?: {
    road: {
      _text: string
    }
    carriageway: {
      _text: string
    }
    lane: {
      _text: string
    }
    km: {
      _text: string
    }
  }
  display?: {
    blank?: {
      _attributes: {
        flashing: string
      }
    }
    speedlimit?: {
      _text: string
      _attributes: {
        red_ring: string
        flashing: string
      }
    }
    lane_open?: {
      _text: string
      _attributes: {
        flashing: string
      }
    }
    lane_closed?: {
      _text: string
      _attributes: {
        flashing: string
      }
    }
    lane_closed_ahead?: {
      _text: string
      _attributes: {
        flashing: string
      }
      merge_left?
      merge_right?
    }
    restriction_end?: {
      _text: string
      _attributes: {
        flashing: string
      }
    },
    unknown?: {}
  }
}

export { SignDisplayType, LaneClosureDirection, Sign, XmlEvent, XmlData }
