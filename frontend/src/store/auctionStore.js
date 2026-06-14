import { create } from 'zustand';
import { io } from 'socket.io-client';

const URL = 'http://localhost:5000';
export const socket = io(URL, { autoConnect: false });

export const useAuctionStore = create((set, get) => ({
  room: null,
  auctionState: null, // { playersList, currentIndex, currentBid, highestBidder, timeLeft }
  isConnected: false,

  connectSocket: () => {
    socket.connect();
    set({ isConnected: true });
  },
  disconnectSocket: () => {
    socket.disconnect();
    set({ isConnected: false });
  },
  joinRoom: (roomId, userId) => {
    socket.emit('join-room', { roomId, userId });
  },
  setRoomState: (data) => set({ room: data.room, auctionState: data.auctionState }),
  updateAuction: (data) => set((state) => ({
    auctionState: {
      ...state.auctionState,
      currentPlayer: data.currentPlayer,
      currentBid: data.currentBid,
      highestBidder: data.highestBidder,
      timeLeft: data.timeLeft
    }
  })),
  updateTimer: (timeLeft) => set((state) => ({
    auctionState: { ...state.auctionState, timeLeft }
  })),
  placeBid: (roomId, userId, amount) => {
    socket.emit('place-bid', { roomId, userId, amount });
  },
  startAuction: (roomId, userId) => {
    socket.emit('start-auction', { roomId, userId });
  }
}));
