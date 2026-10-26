import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr'
import type { HubConnection } from '@microsoft/signalr'

type SignalREventName =
  | 'RobotTelemetryUpdated'
  | 'RobotMapUpdated'

type SignalREventHandler<T> = (payload: T) => void

class SignalRClient {
  private connection: HubConnection | null = null

  private handlers: Partial<
    Record<SignalREventName, Array<SignalREventHandler<unknown>>>
  > = {}

  private runtimeSubscriptions = new Set<string>()

  async start(): Promise<void> {
    if (
      this.connection?.state === HubConnectionState.Connected ||
      this.connection?.state === HubConnectionState.Connecting ||
      this.connection?.state === HubConnectionState.Reconnecting
    ) {
      return
    }

    if (!this.connection) {
      this.connection = new HubConnectionBuilder()
        .withUrl(import.meta.env.VITE_SIGNALR_URL ?? '/robotHub')
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)
        .build()

      this.connection.on('RobotTelemetryUpdated', (payload) => {
        this.emit('RobotTelemetryUpdated', payload)
      })
      this.connection.on('RobotMapUpdated', (payload) => {
        this.emit('RobotMapUpdated', payload)
      })
      this.connection.onreconnected(() => {
        this.runtimeSubscriptions.forEach((runtimeId) => {
          void this.connection?.invoke('SubscribeRuntime', runtimeId)
        })
      })
    }

    try {
      await this.connection.start()

      for (const runtimeId of this.runtimeSubscriptions) {
        await this.connection.invoke('SubscribeRuntime', runtimeId)
      }
    } catch (error) {
      console.warn('Không thể kết nối SignalR.', error)
    }
  }

  async subscribeRuntime(runtimeId: string): Promise<void> {
    this.runtimeSubscriptions.add(runtimeId)
    await this.start()

    if (this.connection?.state === HubConnectionState.Connected) {
      await this.connection.invoke('SubscribeRuntime', runtimeId)
    }
  }

  async unsubscribeRuntime(runtimeId: string): Promise<void> {
    this.runtimeSubscriptions.delete(runtimeId)

    if (this.connection?.state === HubConnectionState.Connected) {
      await this.connection.invoke('UnsubscribeRuntime', runtimeId)
    }
  }

  subscribe<T>(
    event: SignalREventName,
    handler: SignalREventHandler<T>,
  ): () => void {
    if (!this.handlers[event]) {
      this.handlers[event] = []
    }

    const handlers = this.handlers[event] as Array<SignalREventHandler<T>>
    handlers.push(handler)

    return () => {
      const index = handlers.indexOf(handler)

      if (index >= 0) {
        handlers.splice(index, 1)
      }
    }
  }

  private emit<T>(event: SignalREventName, payload: T) {
    const callbacks = this.handlers[event] ?? []
    callbacks.forEach((callback) => callback(payload))
  }
}

export const signalRClient = new SignalRClient()
