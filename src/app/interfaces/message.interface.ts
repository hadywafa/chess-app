export type IframeToParentMessageType = 'move' | 'checkmate' | 'requestState';
export type ParentToIframeMessageType = 'updateState' | 'reset';

export interface IframeToParentMessage {
  type: IframeToParentMessageType;
  data?: {
    fen?: string;
  };
}

export interface ParentToIframeMessage {
  type: ParentToIframeMessageType;
  data?: {
    fen?: string;
    turn?: 'white' | 'black';
  };
}
