const Room = require('./models/Room');
const Player = require('./models/Player');
const User = require('./models/User');

const auctionRooms = {}; 
// In-memory state per room:
// {
//   playersList: [],
//   currentIndex: 0,
//   currentBid: 0,
//   highestBidder: null, // userId
//   highestBidderTeam: null, // teamId
//   timer: null,
//   timeLeft: 30,
//   timePerBid: 30,
//   bidIncrement: 1000000,
//   rtmState: {
//     active: false,
//     rtmTeamId: null,
//     rtmUserId: null,
//     highestBidderUserId: null,
//     highestBidderTeamId: null,
//     preRtmBid: 0,
//     phase: 'idle', // 'idle' | 'decision' | 'counter' | 'final-match'
//     raisedBid: 0,
//     timeLeft: 10
//   }
// }

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // join-room
    socket.on('join-room', async ({ roomId, userId }) => {
      socket.join(roomId);
      let roomInfo = await Room.findById(roomId).populate('players', 'name walletBalance');
      
      io.to(roomId).emit('room-state', {
        room: roomInfo,
        auctionState: auctionRooms[roomId] || null
      });
    });

    // select-team (Franchise Claim)
    socket.on('select-team', async ({ roomId, userId, teamId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;

        room.teamsState = room.teamsState || {};
        
        // Check if team is already claimed
        const isClaimed = Object.values(room.teamsState).some(t => t.teamId === teamId);
        if (isClaimed) {
          socket.emit('error-msg', { message: 'Franchise already claimed by another player.' });
          return;
        }

        // Initialize teamState
        const initialPurse = room.startingPurse ? room.startingPurse * 10000000 : (room.auctionType === 'mega' ? 1200000000 : 800000000);
        room.teamsState[teamId] = {
          teamId,
          userId,
          purse: initialPurse,
          rtmCards: room.auctionType === 'mega' ? 6 : 0,
          retentions: [],
          squad: []
        };

        // Mark as modified so mongoose saves the Mixed object
        room.markModified('teamsState');
        await room.save();

        const updatedRoom = await Room.findById(roomId).populate('players', 'name walletBalance');
        io.to(roomId).emit('room-state', { room: updatedRoom, auctionState: auctionRooms[roomId] || null });
      } catch (err) {
        console.error(err);
      }
    });

    // update-retentions (Choose retentions before draft)
    socket.on('update-retentions', async ({ roomId, userId, teamId, retentions }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room || !room.teamsState || !room.teamsState[teamId]) return;
        
        // Only owner of this franchise can change their retentions
        if (room.teamsState[teamId].userId !== userId) return;

        // BCCI Mega Retention Cost calculation:
        // Capped costs: [18CR, 14CR, 11CR, 18CR, 14CR]
        // Uncapped cost: 4CR
        // Max 6 retentions (up to 5 capped + 1 uncapped)
        let cappedCount = 0;
        let uncappedCount = 0;
        let totalCost = 0;

        retentions.forEach(p => {
          if (p.isCapped) {
            cappedCount++;
            // cost brackets
            if (cappedCount === 1) totalCost += 180000000;
            else if (cappedCount === 2) totalCost += 140000000;
            else if (cappedCount === 3) totalCost += 110000000;
            else if (cappedCount === 4) totalCost += 180000000;
            else if (cappedCount === 5) totalCost += 140000000;
          } else {
            uncappedCount++;
            totalCost += 40000000; // 4CR
          }
        });

        // Deduct from starting purse (120CR in Mega, 80CR in Mini)
        const startingPurse = room.auctionType === 'mega' ? 1200000000 : 800000000;
        const remainingPurse = startingPurse - totalCost;
        const totalRetentionsCount = retentions.length;
        const remainingRtm = room.auctionType === 'mega' ? (6 - totalRetentionsCount) : 0;

        room.teamsState[teamId].retentions = retentions.map(p => p.name);
        room.teamsState[teamId].squad = retentions.map(p => p.name);
        room.teamsState[teamId].purse = remainingPurse;
        room.teamsState[teamId].rtmCards = remainingRtm;

        room.markModified('teamsState');
        await room.save();

        const updatedRoom = await Room.findById(roomId).populate('players', 'name walletBalance');
        io.to(roomId).emit('room-state', { room: updatedRoom, auctionState: auctionRooms[roomId] || null });
      } catch (err) {
        console.error(err);
      }
    });

    // propose-trade (Trade window during pre-auction in Mini Mode)
    socket.on('propose-trade', async ({ roomId, fromTeamId, toTeamId, offerPlayer, requestPlayer }) => {
      try {
        // Broadcast trade offer to the target team
        io.to(roomId).emit('trade-proposal', { fromTeamId, toTeamId, offerPlayer, requestPlayer });
      } catch (err) {
        console.error(err);
      }
    });

    // accept-trade (Accept player swap in Mini Mode)
    socket.on('accept-trade', async ({ roomId, fromTeamId, toTeamId, offerPlayer, requestPlayer }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;

        // Perform squad swaps
        if (room.teamsState[fromTeamId] && room.teamsState[toTeamId]) {
          // Remove offerPlayer from fromTeam, add to toTeam
          room.teamsState[fromTeamId].squad = room.teamsState[fromTeamId].squad.filter(p => p !== offerPlayer);
          room.teamsState[toTeamId].squad.push(offerPlayer);

          // Remove requestPlayer from toTeam, add to fromTeam
          room.teamsState[toTeamId].squad = room.teamsState[toTeamId].squad.filter(p => p !== requestPlayer);
          room.teamsState[fromTeamId].squad.push(requestPlayer);

          room.markModified('teamsState');
          await room.save();

          const updatedRoom = await Room.findById(roomId).populate('players', 'name walletBalance');
          io.to(roomId).emit('room-state', { room: updatedRoom, auctionState: auctionRooms[roomId] || null });
        }
      } catch (err) {
        console.error(err);
      }
    });

    // start-auction
    socket.on('start-auction', async ({ roomId, userId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room || room.owner.toString() !== userId) return;
        
        room.status = 'active';
        room.currentRound = room.auctionType === 'mega' ? 'marquee' : 'regular';
        await room.save();

        // 1. Gather all players in the pool
        const poolSource = room.poolSource || 'default';
        let allPlayers = await Player.find({ poolSource });

        // Filter out any players that were retained
        const retainedPlayersList = [];
        Object.values(room.teamsState || {}).forEach(team => {
          if (team.retentions && team.retentions.length > 0) {
            retainedPlayersList.push(...team.retentions);
          }
        });

        const draftPool = allPlayers.filter(p => !retainedPlayersList.includes(p.name));

        // 2. Sort the draft pool according to official BCCI orders
        // Mega: Marquee Set 1 -> Marquee Set 2 -> Capped Batters -> Capped All-Rounders -> Capped WK-Batters -> Capped Bowlers -> Capped Spinners -> Uncapped
        // Mini: Category directly (No marquee)
        draftPool.sort((a, b) => {
          const order = {
            'Marquee Set 1': 1,
            'Marquee Set 2': 2,
            'Capped Batter': 3,
            'Capped All-Rounder': 4,
            'Capped WK-Batter': 5,
            'Capped Fast Bowler': 6,
            'Capped Spinner': 7,
            'Uncapped Batter': 8,
            'Uncapped All-Rounder': 9,
            'Uncapped WK-Batter': 10,
            'Uncapped Bowler': 11
          };
          return (order[a.category] || 99) - (order[b.category] || 99);
        });

        // Initialize state
        auctionRooms[roomId] = {
          playersList: draftPool,
          currentIndex: 0,
          currentBid: 0,
          highestBidder: null,
          highestBidderTeam: null,
          timer: null,
          timeLeft: room.timePerBid || 30,
          timePerBid: room.timePerBid || 30,
          rtmState: {
            active: false,
            rtmTeamId: null,
            rtmUserId: null,
            highestBidderUserId: null,
            highestBidderTeamId: null,
            preRtmBid: 0,
            phase: 'idle',
            raisedBid: 0,
            timeLeft: 10
          }
        };

        nextPlayer(roomId);
        io.to(roomId).emit('room-state', { room, auctionState: auctionRooms[roomId] });
      } catch (err) {
        console.error(err);
      }
    });

    // place-bid (BCCI increment rules)
    socket.on('place-bid', async ({ roomId, userId, teamId, amount }) => {
      const state = auctionRooms[roomId];
      if (!state || !state.playersList[state.currentIndex] || state.rtmState.active) return;
      
      const currentPlayer = state.playersList[state.currentIndex];
      
      // Calculate dynamic BCCI increment:
      // Under ₹1CR: +₹5L (500000)
      // ₹1CR to ₹2CR: +₹10L (1000000)
      // ₹2CR to ₹5CR: +₹25L (2500000)
      // Above ₹5CR: +₹50L (5000000)
      const getBcciIncrement = (currentVal) => {
        if (currentVal < 10000000) return 500000;
        if (currentVal < 20000000) return 1000000;
        if (currentVal < 50000000) return 2500000;
        return 5000000;
      };

      const increment = getBcciIncrement(state.currentBid);
      const minBid = state.currentBid === 0 ? currentPlayer.basePrice : state.currentBid + increment;

      if (amount < minBid) return; // Invalid bid value

      // Verify franchise has sufficient purse balance
      const room = await Room.findById(roomId);
      if (!room || !room.teamsState || !room.teamsState[teamId]) return;

      const teamPurse = room.teamsState[teamId].purse;
      if (teamPurse < amount) {
        socket.emit('error-msg', { message: 'Insufficient purse balance!' });
        return;
      }

      state.currentBid = amount;
      state.highestBidder = userId;
      state.highestBidderTeam = teamId;
      state.timeLeft = 10; // Reset bid timer to 10s buffer

      io.to(roomId).emit('auction-update', {
        currentPlayer,
        currentBid: state.currentBid,
        highestBidder: state.highestBidder,
        highestBidderTeam: state.highestBidderTeam,
        timeLeft: state.timeLeft,
        rtmState: state.rtmState
      });
    });

    // RTM Decisions
    socket.on('rtm-decision', async ({ roomId, teamId, useRtm }) => {
      const state = auctionRooms[roomId];
      if (!state || !state.rtmState.active || state.rtmState.phase !== 'decision') return;

      if (useRtm) {
        // Set counter-bid phase (8s counter-bid window)
        state.rtmState.phase = 'counter';
        state.rtmState.timeLeft = 8;
        io.to(roomId).emit('rtm-update', { rtmState: state.rtmState });
        startRtmTimer(roomId);
      } else {
        // Skip RTM, sell immediately
        await finalizeSale(roomId);
      }
    });

    // place-counter-bid (8s window raise)
    socket.on('place-counter-bid', async ({ roomId, teamId, amount }) => {
      const state = auctionRooms[roomId];
      if (!state || !state.rtmState.active || state.rtmState.phase !== 'counter') return;

      // Ensure only the original highest bidder can counter-bid raise
      if (teamId !== state.rtmState.highestBidderTeamId) return;

      // Verify they have purse balance
      const room = await Room.findById(roomId);
      if (!room || !room.teamsState || !room.teamsState[teamId]) return;

      if (room.teamsState[teamId].purse < amount) return;

      // Check if amount is actually higher than previous bid
      if (amount <= state.rtmState.preRtmBid) return;

      state.rtmState.raisedBid = amount;
      state.rtmState.phase = 'final-match';
      state.rtmState.timeLeft = 10; // 10s window for RTM team to match or withdraw

      io.to(roomId).emit('rtm-update', { rtmState: state.rtmState });
      startRtmTimer(roomId);
    });

    // pass-counter-bid (Highest bidder decides not to raise)
    socket.on('pass-counter-bid', async ({ roomId, teamId }) => {
      const state = auctionRooms[roomId];
      if (!state || !state.rtmState.active || state.rtmState.phase !== 'counter') return;

      // Sell player immediately to RTM team at original highest bid price
      state.rtmState.raisedBid = state.rtmState.preRtmBid;
      await matchRtm(roomId, true);
    });

    // final-match-rtm (RTM team matches the raised counter-bid)
    socket.on('final-match-rtm', async ({ roomId, teamId, match }) => {
      const state = auctionRooms[roomId];
      if (!state || !state.rtmState.active || state.rtmState.phase !== 'final-match') return;

      await matchRtm(roomId, match);
    });

    // --- Helper functions ---

    const nextPlayer = (roomId) => {
      const state = auctionRooms[roomId];
      if (!state) return;

      if (state.currentIndex >= state.playersList.length) {
        return endAuction(roomId);
      }

      const player = state.playersList[state.currentIndex];
      state.currentBid = 0;
      state.highestBidder = null;
      state.highestBidderTeam = null;
      state.timeLeft = state.timePerBid || 30;
      state.rtmState = {
        active: false,
        rtmTeamId: null,
        rtmUserId: null,
        highestBidderUserId: null,
        highestBidderTeamId: null,
        preRtmBid: 0,
        phase: 'idle',
        raisedBid: 0,
        timeLeft: 10
      };

      io.to(roomId).emit('auction-update', {
        currentPlayer: player,
        currentBid: state.currentBid,
        highestBidder: state.highestBidder,
        highestBidderTeam: state.highestBidderTeam,
        timeLeft: state.timeLeft,
        rtmState: state.rtmState
      });

      startDraftTimer(roomId);
    };

    const startDraftTimer = (roomId) => {
      const state = auctionRooms[roomId];
      if (!state) return;

      if (state.timer) clearInterval(state.timer);

      state.timer = setInterval(async () => {
        state.timeLeft -= 1;
        io.to(roomId).emit('timer-update', { timeLeft: state.timeLeft });

        if (state.timeLeft <= 0) {
          clearInterval(state.timer);
          await processBidExpiry(roomId);
        }
      }, 1000);
    };

    const processBidExpiry = async (roomId) => {
      const state = auctionRooms[roomId];
      if (!state) return;

      const player = state.playersList[state.currentIndex];

      if (state.highestBidder) {
        // Someone has the highest bid!
        // Check RTM eligibility (Mega Auction only, player has a previous team, previous team owner is in the room, has RTM cards left, and is NOT the highest bidder)
        const room = await Room.findById(roomId);
        const rtmTeamId = player.team;
        const rtmTeamData = room.teamsState ? room.teamsState[rtmTeamId] : null;

        if (
          room.auctionType === 'mega' &&
          room.rtmEnabled &&
          rtmTeamData &&
          rtmTeamData.rtmCards > 0 &&
          rtmTeamData.teamId !== state.highestBidderTeam
        ) {
          // Pause draft, trigger RTM workflow!
          state.rtmState = {
            active: true,
            rtmTeamId,
            rtmUserId: rtmTeamData.userId,
            highestBidderUserId: state.highestBidder,
            highestBidderTeamId: state.highestBidderTeam,
            preRtmBid: state.currentBid,
            phase: 'decision',
            raisedBid: 0,
            timeLeft: 10
          };

          io.to(roomId).emit('rtm-triggered', { rtmState: state.rtmState });
          startRtmTimer(roomId);
        } else {
          // No RTM, sell immediately
          await finalizeSale(roomId);
        }
      } else {
        // Unsold
        io.to(roomId).emit('player-sold', {
          player,
          buyerId: null,
          buyerTeamId: null,
          price: 0
        });

        // Advance to next player
        state.currentIndex += 1;
        setTimeout(() => nextPlayer(roomId), 4000);
      }
    };

    const startRtmTimer = (roomId) => {
      const state = auctionRooms[roomId];
      if (!state) return;

      if (state.timer) clearInterval(state.timer);

      state.timer = setInterval(async () => {
        state.rtmState.timeLeft -= 1;
        io.to(roomId).emit('rtm-update', { rtmState: state.rtmState });

        if (state.rtmState.timeLeft <= 0) {
          clearInterval(state.timer);
          
          // Time-out fallback
          if (state.rtmState.phase === 'decision') {
            // Treat as skipped RTM, sell to highest bidder
            await finalizeSale(roomId);
          } else if (state.rtmState.phase === 'counter') {
            // Highest bidder didn't raise, sell to RTM team at pre-RTM price
            state.rtmState.raisedBid = state.rtmState.preRtmBid;
            await matchRtm(roomId, true);
          } else if (state.rtmState.phase === 'final-match') {
            // RTM team didn't match, sell to highest bidder at raised price
            await matchRtm(roomId, false);
          }
        }
      }, 1000);
    };

    const matchRtm = async (roomId, isMatched) => {
      const state = auctionRooms[roomId];
      if (!state) return;

      const room = await Room.findById(roomId);
      const player = state.playersList[state.currentIndex];

      if (isMatched) {
        // RTM Team matches! They buy the player at final raised price.
        const rtmTeamId = state.rtmState.rtmTeamId;
        const finalPrice = state.rtmState.raisedBid || state.rtmState.preRtmBid;

        // Deduct purse and add player to squad in DB
        room.teamsState[rtmTeamId].purse -= finalPrice;
        room.teamsState[rtmTeamId].squad.push(player.name);
        room.teamsState[rtmTeamId].rtmCards -= 1; // Consume RTM card
        room.markModified('teamsState');
        await room.save();

        io.to(roomId).emit('player-sold', {
          player,
          buyerId: room.teamsState[rtmTeamId].userId,
          buyerTeamId: rtmTeamId,
          price: finalPrice,
          rtmUsed: true
        });
      } else {
        // RTM Team withdraws! Highest bidder buys the player at final raised price.
        const highestTeamId = state.rtmState.highestBidderTeamId;
        const finalPrice = state.rtmState.raisedBid || state.rtmState.preRtmBid;

        room.teamsState[highestTeamId].purse -= finalPrice;
        room.teamsState[highestTeamId].squad.push(player.name);
        room.markModified('teamsState');
        await room.save();

        io.to(roomId).emit('player-sold', {
          player,
          buyerId: state.rtmState.highestBidderUserId,
          buyerTeamId: highestTeamId,
          price: finalPrice,
          rtmUsed: false
        });
      }

      state.currentIndex += 1;
      setTimeout(() => nextPlayer(roomId), 4000);
    };

    const finalizeSale = async (roomId) => {
      const state = auctionRooms[roomId];
      if (!state) return;

      const room = await Room.findById(roomId);
      const player = state.playersList[state.currentIndex];
      const buyerTeamId = state.highestBidderTeam;
      const finalPrice = state.currentBid;

      // Deduct purse and add to squad
      room.teamsState[buyerTeamId].purse -= finalPrice;
      room.teamsState[buyerTeamId].squad.push(player.name);
      room.markModified('teamsState');
      await room.save();

      io.to(roomId).emit('player-sold', {
        player,
        buyerId: state.highestBidder,
        buyerTeamId,
        price: finalPrice,
        rtmUsed: false
      });

      state.currentIndex += 1;
      setTimeout(() => nextPlayer(roomId), 4000);
    };

    const endAuction = async (roomId) => {
      const room = await Room.findById(roomId);
      room.status = 'completed';
      await room.save();
      delete auctionRooms[roomId];
      io.to(roomId).emit('auction-ended', { message: 'Auction draft complete!' });
    };
  });
};
