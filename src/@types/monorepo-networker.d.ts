declare module "monorepo-networker" {
  export interface NetworkEvents {
    [eventName: string]: (...args: any[]) => any;
  }

  export interface NetworkMessage {
    /** UUIDv4 ID issues for this message */
    messageId: string;
    /** Name of the logical side, which created this message */
    fromSide: string;
    /** Name of the event */
    eventName: string;
    /** Arguments of the event */
    payload: any[];
  }

  export class NetworkError extends Error {
    constructor(message: NetworkMessage);
  }

  export interface NetworkChannel<T extends NetworkEvents, N extends string> {
    emitsTo<OtherN extends string>(
      side: NetworkSide<OtherN, any>,
      callback: (message: any) => void
    ): NetworkChannel<T, N>;
    receivesFrom<OtherN extends string>(
      side: NetworkSide<OtherN, any>,
      callback: (next: any) => void
    ): NetworkChannel<T, N>;
    registerMessageHandler<K extends keyof T>(
      eventName: K,
      handler: T[K]
    ): void;
    startListening(): NetworkChannel<T, N>;
    emit<
      OtherN extends string,
      OtherT extends NetworkEvents,
      K extends keyof OtherT
    >(
      side: NetworkSide<OtherN, OtherT>,
      eventName: K,
      args: Parameters<OtherT[K]>
    ): void;
    request<
      OtherN extends string,
      OtherT extends NetworkEvents,
      K extends keyof OtherT
    >(
      side: NetworkSide<OtherN, OtherT>,
      eventName: K,
      args: Parameters<OtherT[K]>
    ): Promise<ReturnType<OtherT[K]>>;
  }

  export interface NetworkSideBuilder<N extends string> {
    listens<T extends NetworkEvents>(): NetworkSide<N, T>;
  }

  export interface NetworkSide<N extends string, T extends NetworkEvents> {
    name: N;
    channelBuilder(): NetworkChannel<T, N>;
  }

  export namespace Networker {
    function getCurrentSide(): NetworkSide<any, any>;
    function initialize<N extends string, T extends NetworkEvents>(
      side: NetworkSide<N, T>,
      channel: NetworkChannel<T, any>
    ): void;
    function createSide<N extends string>(name: N): NetworkSideBuilder<N>;
  }
}
