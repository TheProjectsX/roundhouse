// import { PrismaService } from '@/core/services/prisma/prisma.service';
// import { ConfigService } from '@nestjs/config';
// import { JwtService } from '@nestjs/jwt';
// import {
//   ConnectedSocket,
//   MessageBody,
//   OnGatewayConnection,
//   OnGatewayDisconnect,
//   OnGatewayInit,
//   SubscribeMessage,
//   WebSocketGateway,
//   WebSocketServer,
// } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';

// interface OnlineUser {
//   userId: string;
//   socketId: string;
//   lastSeen: Date;
// }

// @WebSocketGateway({
//   cors: { origin: '*', methods: ['GET', 'POST'] },
//   perMessageDeflate: false,
// })
// export class WebsocketGateway
//   implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
// {
//   @WebSocketServer()
//   server: Server;

//   private onlineUsers = new Map<string, OnlineUser>();

//   constructor(
//     private readonly prisma: PrismaService,
//     private readonly config: ConfigService,
//     private readonly jwtService: JwtService,
//   ) {}

//   afterInit() {
//     console.log('Socket.IO server initialized');
//   }

//   async handleConnection(socket: Socket) {
//     try {
//       const token =  socket.handshake.auth.token;
//       if (!token) throw new Error('No token provided');

//       const payload = await this.jwtService.verifyAsync(token.toString());
//       const userId = payload.id;

//       socket.data.userId = userId;

//       this.onlineUsers.set(userId, {
//         userId,
//         socketId: socket.id,
//         lastSeen: new Date(),
//       });

//       socket.emit('authenticated', { userId, message: 'Authenticated' });
//       console.log(`User connected: ${userId} (${socket.id})`);
//     } catch (err) {
//       console.error('Auth failed:', err.message);
//       socket.disconnect(true);
//     }
//   }

//   handleDisconnect(socket: Socket) {
//     const userId = socket.data.userId;
//     if (userId) {
//       this.onlineUsers.delete(userId);
//       console.log(`User disconnected: ${userId} (${socket.id})`);
//     }
//   }

//   @SubscribeMessage('sendMessage')
//   async handleSendMessage(
//     @MessageBody()
//     payload: { receiverId: string; message: string; images?: string[] },
//     @ConnectedSocket() socket: Socket,
//   ) {
//     const senderId = socket.data.userId;
//     if (!senderId) return;

//     const { receiverId, message, images = [] } = payload;

//     const receiverExists = await this.prisma.user.findUnique({
//       where: { id: receiverId },
//       select: { id: true, username: true, avatar: true, role: true, email: true, contactNo: true },
//     });

//     const senderExists = await this.prisma.user.findUnique({
//       where: { id: senderId },
//       select: { id: true, username: true, avatar: true, role: true, email: true, contactNo: true },
//     });

//     if (!receiverExists) {
//       socket.emit('error', { message: 'Receiver not found' });
//       return;
//     }

//     // Save the message
//     await this.prisma.chat.create({
//       data: { senderId, receiverId, message, images },
//     });

//     // Send to receiver if online
//     const receiverOnline = this.onlineUsers.get(receiverId);
//     if (receiverOnline) {
//       this.server.to(receiverOnline.socketId).emit('message', {
//         user: senderExists,
//         message,
//         images,
//       });
//     }

//     // Send confirmation to sender
//     socket.emit('message', {
//       userId: senderId,
//       message,
//       images,
//       delivered: !!receiverOnline,
//     });
//   }

//   @SubscribeMessage('typing')
//   handleTyping(
//     @MessageBody() payload: { receiverId: string },
//     @ConnectedSocket() socket: Socket,
//   ) {
//     const { receiverId } = payload;
//     const senderId = socket.data.userId;
//     if (!senderId || !receiverId) return;

//     const receiverOnline = this.onlineUsers.get(receiverId);
//     if (receiverOnline) {
//       this.server.to(receiverOnline.socketId).emit('userTyping', { userId: senderId });
//     }
//   }

//   @SubscribeMessage('stopTyping')
//   handleStopTyping(
//     @MessageBody() payload: { receiverId: string },
//     @ConnectedSocket() socket: Socket,
//   ) {
//     const { receiverId } = payload;
//     const senderId = socket.data.userId;
//     if (!senderId || !receiverId) return;

//     const receiverOnline = this.onlineUsers.get(receiverId);
//     if (receiverOnline) {
//       this.server.to(receiverOnline.socketId).emit('userStoppedTyping', { userId: senderId });
//     }
//   }

//   @SubscribeMessage('getOnlineUsers')
//   async handleGetOnlineUsers(@ConnectedSocket() socket: Socket) {
//     try {
//       const userIds = Array.from(this.onlineUsers.keys());
//       const users = await this.prisma.user.findMany({
//         where: { id: { in: userIds } },
//         select: { id: true, username: true, avatar: true },
//       });

//       socket.emit('onlineUsers', users.map((u) => ({
//         ...u,
//         lastSeen: this.onlineUsers.get(u.id)?.lastSeen,
//         isOnline: true,
//       })));
//     } catch (error) {
//       console.error('Get online users error:', error);
//       socket.emit('error', { message: 'Failed to get online users' });
//     }
//   }
// }
