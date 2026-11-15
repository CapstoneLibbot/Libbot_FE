/**
 * Chuẩn hóa toàn bộ Enum dùng chung trong hệ thống Libbot
 * Đồng bộ chính xác với LiBot.Domain.Enums của Backend
 */

export type InfrastructureStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'

export type FloorStatus = InfrastructureStatus
export type AisleStatus = InfrastructureStatus
export type ShelfStatus = InfrastructureStatus
export type ShelfLevelStatus = InfrastructureStatus

export type BookItemStatus =
  | 'AVAILABLE'
  | 'MISPLACED'
  | 'MISSING'
  | 'LOST'
  | 'DAMAGED'

export type MapStatus = 'Active' | 'Archived'

export type EndpointType = 'WAYPOINT' | 'CHARGER' | 'PARK'

export type RobotStatus = 'Offline' | 'Idle' | 'Busy' | 'Maintenance' | 'Error'

export type BookReceiptStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'COMPLETED'
  | 'CANCELLED'

export type WorkflowStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE'

export type InventoryResult = 'MATCHED' | 'MISMATCHED'
