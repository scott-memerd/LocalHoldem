import React, { useState, useEffect } from 'react';
import { Users, Eye, EyeOff, Play, RotateCcw, Trophy, ChevronRight, Frown } from 'lucide-react';
import { Hand } from 'pokersolver';
import { motion, AnimatePresence } from 'motion/react';

type Suit = 's' | 'c' | 'h' | 'd';
type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';
type CardStr = `${Rank}${Suit}`;

type GamePhase = 'setup' | 'shuffling' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

interface Player {
  id: number;
  cards: CardStr[];
  handDescription?: string;
  isWinner?: boolean;
  isLoser?: boolean;
  isPeeking: boolean;
}

const SUITS: Suit[] = ['s', 'c', 'h', 'd'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

const translateHand = (desc?: string) => {
  if (!desc) return '';
  let t = desc;
  t = t.replace('High Card', '하이 카드');
  t = t.replace('Pair', '페어');
  t = t.replace('Two Pair', '투 페어');
  t = t.replace('Three of a Kind', '트리플');
  t = t.replace('Straight', '스트레이트');
  t = t.replace('Flush', '플러시');
  t = t.replace('Full House', '풀 하우스');
  t = t.replace('Four of a Kind', '포카드');
  t = t.replace('Straight Flush', '스트레이트 플러시');
  t = t.replace('Royal Flush', '로얄 플러시');
  
  t = t.replace(/Ace/g, '에이스');
  t = t.replace(/King/g, '킹');
  t = t.replace(/Queen/g, '퀸');
  t = t.replace(/Jack/g, '잭');
  t = t.replace(/Ten/g, '10');
  t = t.replace(/Nine/g, '9');
  t = t.replace(/Eight/g, '8');
  t = t.replace(/Seven/g, '7');
  t = t.replace(/Six/g, '6');
  t = t.replace(/Five/g, '5');
  t = t.replace(/Four/g, '4');
  t = t.replace(/Three/g, '3');
  t = t.replace(/Two/g, '2');
  
  t = t.replace(/'s/g, 's');
  t = t.replace(/High/g, '탑');
  return t;
};

function createDeck(): CardStr[] {
  const deck: CardStr[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(`${rank}${suit}` as CardStr);
    }
  }
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

const PlayingCard = ({ card, hidden = false }: { card?: CardStr, hidden?: boolean }) => {
  if (hidden || !card) {
    return (
      <div className="w-16 h-24 sm:w-20 sm:h-28 bg-blue-800 rounded-lg border-2 border-white shadow-lg flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent bg-[length:4px_4px]"></div>
        <div className="w-12 h-20 sm:w-16 sm:h-24 border-2 border-blue-400/50 rounded-md"></div>
      </div>
    );
  }

  const rank = card[0];
  const suit = card[1];
  
  const isRed = suit === 'h' || suit === 'd';
  const colorClass = isRed ? 'text-red-600' : 'text-slate-900';
  
  const suitSymbol = {
    s: '♠',
    c: '♣',
    h: '♥',
    d: '♦'
  }[suit];

  const displayRank = rank === 'T' ? '10' : rank;

  return (
    <div className={`w-16 h-24 sm:w-20 sm:h-28 bg-white rounded-lg border border-gray-200 shadow-lg flex flex-col justify-between p-1.5 sm:p-2 ${colorClass}`}>
      <div className="text-sm sm:text-base font-bold leading-none flex flex-col items-center w-fit">
        <span>{displayRank}</span>
        <span className="text-xs sm:text-sm">{suitSymbol}</span>
      </div>
      <div className="text-3xl sm:text-4xl self-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
        {suitSymbol}
      </div>
      <div className="text-sm sm:text-base font-bold leading-none flex flex-col items-center w-fit self-end rotate-180">
        <span>{displayRank}</span>
        <span className="text-xs sm:text-sm">{suitSymbol}</span>
      </div>
    </div>
  );
};

export default function App() {
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [numPlayers, setNumPlayers] = useState<number>(4);
  const [deck, setDeck] = useState<CardStr[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [communityCards, setCommunityCards] = useState<CardStr[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);

  const startGame = () => {
    setPhase('shuffling');
  };

  const handleShuffleAndDeal = () => {
    setIsShuffling(true);
    setTimeout(() => {
      const newDeck = createDeck();
      const newPlayers: Player[] = Array.from({ length: numPlayers }, (_, i) => ({
        id: i + 1,
        cards: [newDeck.pop()!, newDeck.pop()!],
        isPeeking: false,
      }));

      setDeck(newDeck);
      setPlayers(newPlayers);
      setCommunityCards([]);
      setIsShuffling(false);
      setPhase('preflop');
    }, 1500);
  };

  const nextPhase = () => {
    const currentDeck = [...deck];
    const currentCommunity = [...communityCards];

    if (phase === 'preflop') {
      // Burn 1, Deal 3 (Flop)
      currentDeck.pop();
      currentCommunity.push(currentDeck.pop()!, currentDeck.pop()!, currentDeck.pop()!);
      setPhase('flop');
    } else if (phase === 'flop') {
      // Burn 1, Deal 1 (Turn)
      currentDeck.pop();
      currentCommunity.push(currentDeck.pop()!);
      setPhase('turn');
    } else if (phase === 'turn') {
      // Burn 1, Deal 1 (River)
      currentDeck.pop();
      currentCommunity.push(currentDeck.pop()!);
      setPhase('river');
    } else if (phase === 'river') {
      // Showdown
      evaluateHands(currentCommunity);
      setPhase('showdown');
    }

    setDeck(currentDeck);
    setCommunityCards(currentCommunity);
  };

  const evaluateHands = (community: CardStr[]) => {
    const solvedHands = players.map(p => {
      const allCards = [...p.cards, ...community];
      const solved = Hand.solve(allCards);
      return { playerId: p.id, solved };
    });

    const hands = solvedHands.map(sh => sh.solved);
    const winners = Hand.winners(hands);
    
    let remainingHands = [...hands];
    let losers: any[] = [];
    while (remainingHands.length > 0) {
      losers = Hand.winners(remainingHands);
      remainingHands = remainingHands.filter(h => !losers.includes(h));
    }
    
    setPlayers(players.map(p => {
      const playerHand = solvedHands.find(sh => sh.playerId === p.id)?.solved;
      const isWinner = winners.includes(playerHand);
      // Only mark as loser if not everyone tied
      const isLoser = losers.includes(playerHand) && hands.length > winners.length;
      
      return {
        ...p,
        handDescription: translateHand(playerHand.descr),
        isWinner,
        isLoser,
        isPeeking: true // Force reveal all at showdown
      };
    }));
  };

  const togglePeek = (playerId: number) => {
    if (phase === 'showdown') return;
    setPlayers(players.map(p => 
      p.id === playerId ? { ...p, isPeeking: !p.isPeeking } : p
    ));
  };

  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-emerald-900 flex items-center justify-center p-4 font-sans text-slate-100">
        <div className="bg-emerald-950/80 p-8 rounded-2xl shadow-2xl border border-emerald-800 max-w-md w-full text-center backdrop-blur-sm">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-emerald-800 rounded-full flex items-center justify-center shadow-inner border-4 border-emerald-700">
              <span className="text-3xl">♠ ♣ ♥ ♦</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">로컬 홀덤</h1>
          <p className="text-emerald-400 mb-8">패스 & 플레이 포커</p>
          
          <div className="mb-8">
            <label className="block text-sm font-medium text-emerald-300 mb-3">
              플레이어 수
            </label>
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={() => setNumPlayers(Math.max(2, numPlayers - 1))}
                className="w-10 h-10 rounded-full bg-emerald-800 hover:bg-emerald-700 flex items-center justify-center transition-colors"
              >
                -
              </button>
              <span className="text-3xl font-bold w-12">{numPlayers}</span>
              <button 
                onClick={() => setNumPlayers(Math.min(99, numPlayers + 1))}
                className="w-10 h-10 rounded-full bg-emerald-800 hover:bg-emerald-700 flex items-center justify-center transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={startGame}
            className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-lg shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Play size={24} fill="currentColor" />
            게임 시작
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-900 p-4 sm:p-8 flex flex-col font-sans text-slate-100">
      {/* Header Controls */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2 bg-emerald-950/50 px-4 py-2 rounded-full border border-emerald-800">
          <Users size={18} className="text-emerald-400" />
          <span className="font-medium">{phase === 'shuffling' ? numPlayers : players.length}명</span>
        </div>
        
        <button
          onClick={() => setPhase('setup')}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 rounded-full transition-colors text-sm font-medium"
        >
          <RotateCcw size={16} />
          새 게임
        </button>
      </div>

      {phase === 'shuffling' ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-32 h-48 mb-16">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute inset-0"
                animate={
                  isShuffling
                    ? {
                        x: i % 2 === 0 ? [0, -80, 0] : [0, 80, 0],
                        y: i % 2 === 0 ? [0, -10, 0] : [0, 10, 0],
                        rotate: i % 2 === 0 ? [0, -15, 0] : [0, 15, 0],
                        zIndex: [i, 5 - i, i],
                      }
                    : { x: i * 2, y: i * -2 }
                }
                transition={{ duration: 0.4, repeat: 3, ease: "easeInOut" }}
              >
                <PlayingCard hidden />
              </motion.div>
            ))}
          </div>
          <button
            onClick={handleShuffleAndDeal}
            disabled={isShuffling}
            className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-full font-bold text-lg shadow-[0_0_40px_rgba(245,158,11,0.4)] transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
          >
            {isShuffling ? '섞는 중...' : '섞고 나누기'}
          </button>
        </div>
      ) : (
      <div className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto w-full relative">
        {/* Poker Table Area */}
        
        {/* Community Cards */}
        <div className="bg-emerald-800/40 p-6 rounded-3xl border-2 border-emerald-700/50 shadow-2xl mb-12 min-h-[160px] flex flex-col items-center justify-center w-full max-w-2xl backdrop-blur-sm">
          <div className="text-emerald-400/80 text-sm font-bold uppercase tracking-widest mb-4">
            {phase === 'preflop' ? '프리플랍' : 
             phase === 'flop' ? '플랍' : 
             phase === 'turn' ? '턴' : 
             phase === 'river' ? '리버' : '쇼다운'}
          </div>
          <div className="flex gap-2 sm:gap-4 justify-center h-24 sm:h-28">
            {/* Render 5 slots, fill with community cards or placeholders */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="relative w-16 h-24 sm:w-20 sm:h-28">
                <div className="absolute inset-0 rounded-lg border-2 border-dashed border-emerald-700/50 flex items-center justify-center bg-emerald-900/20">
                  <div className="w-8 h-8 rounded-full border border-emerald-700/30"></div>
                </div>
                <AnimatePresence>
                  {i < communityCards.length && (
                    <motion.div
                      initial={{ opacity: 0, y: -60, rotateY: 180, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, rotateY: 0, scale: 1 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 260, 
                        damping: 20, 
                        delay: phase === 'flop' ? i * 0.15 : 0 
                      }}
                      className="absolute inset-0"
                    >
                      <PlayingCard card={communityCards[i]} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        {phase !== 'showdown' && (
          <button
            onClick={nextPhase}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-24 z-10 bg-amber-500 hover:bg-amber-400 text-amber-950 px-8 py-3 rounded-full font-bold shadow-xl transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 border-2 border-amber-300"
          >
            {phase === 'preflop' ? '플랍 열기' : 
             phase === 'flop' ? '턴 열기' : 
             phase === 'turn' ? '리버 열기' : '쇼다운'}
            <ChevronRight size={20} />
          </button>
        )}

        {/* Players Ring */}
        <div className="w-full flex flex-wrap justify-center gap-6 sm:gap-8 mt-8">
          {players.map((player) => (
            <div 
              key={player.id} 
              className={`relative flex flex-col items-center p-4 rounded-2xl transition-all duration-300 ${
                player.isWinner 
                  ? 'bg-amber-500/20 border-2 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.3)]' 
                  : player.isLoser
                  ? 'bg-blue-900/40 border-2 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.2)] opacity-90'
                  : 'bg-emerald-950/60 border border-emerald-800'
              }`}
            >
              {player.isWinner && (
                <div className="absolute -top-4 bg-amber-500 text-amber-950 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                  <Trophy size={14} /> 승자
                </div>
              )}
              {player.isLoser && (
                <div className="absolute -top-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                  <Frown size={14} /> 패자
                </div>
              )}
              
              <div className="text-emerald-300 font-medium mb-3 flex items-center gap-2">
                플레이어 {player.id}
              </div>
              
              <div className="flex gap-2 mb-4">
                <motion.div
                  initial={{ opacity: 0, x: -40, y: -40, rotate: -10 }}
                  animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
                  transition={{ type: "spring", delay: player.id * 0.1 }}
                >
                  <PlayingCard card={player.cards[0]} hidden={!player.isPeeking} />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -40, y: -40, rotate: -10 }}
                  animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
                  transition={{ type: "spring", delay: player.id * 0.1 + 0.05 }}
                >
                  <PlayingCard card={player.cards[1]} hidden={!player.isPeeking} />
                </motion.div>
              </div>

              {phase !== 'showdown' ? (
                <button
                  onMouseDown={() => togglePeek(player.id)}
                  onMouseUp={() => togglePeek(player.id)}
                  onMouseLeave={() => player.isPeeking && togglePeek(player.id)}
                  onTouchStart={() => togglePeek(player.id)}
                  onTouchEnd={() => togglePeek(player.id)}
                  className="flex items-center gap-2 text-sm bg-emerald-800 hover:bg-emerald-700 px-4 py-2 rounded-full transition-colors select-none"
                >
                  {player.isPeeking ? <EyeOff size={16} /> : <Eye size={16} />}
                  {player.isPeeking ? '놓아서 숨기기' : '눌러서 확인하기'}
                </button>
              ) : (
                <div className="text-center w-full">
                  <div className={`text-sm font-bold px-3 py-1.5 rounded-lg inline-block ${
                    player.isWinner ? 'bg-amber-500 text-amber-950' : 
                    player.isLoser ? 'bg-blue-800 text-blue-100' :
                    'bg-emerald-800 text-emerald-200'
                  }`}>
                    {player.handDescription}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
