export type MapArea = {
  id: number
  endpoint_id: number
  code: string
  name: string
  description: string | null
}

export type Floor = {
  id: number
  code: string
  name: string
  description: string | null
  status: string
}

export type MapAisle = {
  id: number
  endpointA_id: number
  endpointB_id: number
  floor_id: number
  code: string
  name: string
  description: string | null
  status: string
}

export type MapShelf = {
  id: number
  endpoint_id: number
  aisle_id: number
  name: string
  code: string
  description: string | null
  status: string
}

export type EndpointLinkedObject = {
  kind: 'AREA' | 'AISLE' | 'SHELF'
  id: number
  name: string
} | null

export type EndpointGroup = {
  id: number
  name: string
  description: string | null
}

export type EndpointGroupMember = {
  id: number
  endpoint_group_id: number
  endpoint_id: number
}
