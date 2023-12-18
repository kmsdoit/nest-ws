import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody, OnGatewayInit
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway(3001, { namespace: '/chat', cors: { origin: '*' } })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // 클라이언트 연결 관리를 위한 Map
  private clients = new Map<string, Socket>();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.clients.set(client.id, client);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.clients.delete(client.id);
  }

  @SubscribeMessage('register')
  handleRegister(@MessageBody() data: { streamId: string }, @ConnectedSocket() client: Socket) {
    // 클라이언트가 특정 스트림에 등록
    const { streamId } = data;
    client.join(streamId);
    console.log(`Client ${client.id} registered for stream ${streamId}`);
  }

  @SubscribeMessage('detections')
  handleDetections(@MessageBody() data: { streamId: string, detections: any }, @ConnectedSocket() client: Socket) {
    // 특정 스트림에 대한 탐지 결과를 해당 스트림에 등록된 클라이언트에게 전송
    const { streamId, detections } = data;
    this.server.to(streamId).emit('detections', detections);
  }
}