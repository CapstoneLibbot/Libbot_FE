import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { env } from '../../app/config/env';

export type SignalREventName =
  | 'RobotPositionUpdated'
  | 'RobotStatusChanged'
  | 'MissionStatusChanged'
  | 'MissionStepChanged'
  | 'RobotBatteryUpdated'
  | 'RobotTelemetryUpdated'
  | 'NavigationStatusChanged'
  | 'PlannedPathUpdated'
  | 'RuntimeConnectionChanged'
  | 'RobotMapUpdated';

export type SignalREventHandler<T> = (payload: T) => void;

class SignalRClient {
  private connection: HubConnection | null = null;
  private handlers: Partial<Record<SignalREventName, Array<SignalREventHandler<unknown>>>> = {};
  private runtimeSubscriptions = new Set<string>();

  public async start(): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected
      || this.connection?.state === HubConnectionState.Connecting
      || this.connection?.state === HubConnectionState.Reconnecting) {
      return;
    }

    if (!this.connection) {
      this.connection = new HubConnectionBuilder()
        .withUrl(env.signalRUrl)
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)
        .build();

      this.connection.on('RobotPositionUpdated', (payload) => this.emit('RobotPositionUpdated', payload));
      this.connection.on('RobotStatusChanged', (payload) => this.emit('RobotStatusChanged', payload));
      this.connection.on('MissionStatusChanged', (payload) => this.emit('MissionStatusChanged', payload));
      this.connection.on('MissionStepChanged', (payload) => this.emit('MissionStepChanged', payload));
      this.connection.on('RobotBatteryUpdated', (payload) => this.emit('RobotBatteryUpdated', payload));
      this.connection.on('RobotTelemetryUpdated', (payload) => this.emit('RobotTelemetryUpdated', payload));
      this.connection.on('NavigationStatusChanged', (payload) => this.emit('NavigationStatusChanged', payload));
      this.connection.on('PlannedPathUpdated', (payload) => this.emit('PlannedPathUpdated', payload));
      this.connection.on('RuntimeConnectionChanged', (payload) => this.emit('RuntimeConnectionChanged', payload));
      this.connection.on('RobotMapUpdated', (payload) => this.emit('RobotMapUpdated', payload));
      this.connection.onreconnected(() => {
        this.runtimeSubscriptions.forEach((runtimeId) => {
          void this.connection?.invoke('SubscribeRuntime', runtimeId);
        });
      });
    }

    try {
      await this.connection.start();
      for (const runtimeId of this.runtimeSubscriptions) {
        await this.connection.invoke('SubscribeRuntime', runtimeId);
      }
    } catch (error) {
      console.warn('SignalR connection failed. Running in mock mode.', error);
    }
  }

  public async subscribeRuntime(runtimeId: string): Promise<void> {
    this.runtimeSubscriptions.add(runtimeId);
    await this.start();
    if (this.connection?.state === 'Connected') {
      await this.connection.invoke('SubscribeRuntime', runtimeId);
    }
  }

  public async unsubscribeRuntime(runtimeId: string): Promise<void> {
    this.runtimeSubscriptions.delete(runtimeId);
    if (this.connection?.state === 'Connected') {
      await this.connection.invoke('UnsubscribeRuntime', runtimeId);
    }
  }

  public async stop(): Promise<void> {
    if (!this.connection) {
      return;
    }

    await this.connection.stop();
    this.connection = null;
  }

  public subscribe<T>(event: SignalREventName, handler: SignalREventHandler<T>): () => void {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }

    const handlers = this.handlers[event] as Array<SignalREventHandler<T>>;
    handlers.push(handler);

    return () => {
      const index = handlers.indexOf(handler);
      if (index >= 0) {
        handlers.splice(index, 1);
      }
    };
  }

  private emit<T>(event: SignalREventName, payload: T): void {
    const callbacks = this.handlers[event] ?? [];
    callbacks.forEach((callback) => callback(payload));
  }
}

export const signalRClient = new SignalRClient();
