import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { env } from '../../app/config/env';

export type SignalREventName =
  | 'RobotPositionUpdated'
  | 'RobotStatusChanged'
  | 'MissionStatusChanged'
  | 'MissionStepChanged'
  | 'RobotBatteryUpdated';

export type SignalREventHandler<T> = (payload: T) => void;

class SignalRClient {
  private connection: HubConnection | null = null;
  private handlers: Partial<Record<SignalREventName, Array<SignalREventHandler<unknown>>>> = {};

  public async start(): Promise<void> {
    if (this.connection) {
      return;
    }

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

    try {
      await this.connection.start();
    } catch (error) {
      console.warn('SignalR connection failed. Running in mock mode.', error);
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
