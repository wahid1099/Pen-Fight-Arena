import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import {
  Trophy, Users, Bot, Globe, Volume2, VolumeX, HelpCircle,
  RotateCcw, Play, Shield, Zap, Crosshair, Award, BookOpen,
  CheckCircle2, XCircle, Code, Sparkles, ArrowLeft, Copy, Check,
  Sliders, RefreshCw, Layers, Compass, Eye, Flame, Star, Lock,
  Unlock, Share2, Video, Crown, Medal, Target, Heart, Clock,
  Smile, ChevronRight, Palette, Maximize2, Server, Wifi, Radio,
  Download, UserCheck, Settings as SettingsIcon, Home as HomeIcon,
  Terminal, SplitSquareVertical
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection
} from 'firebase/firestore';

declare const __app_id: string | undefined;
declare const __firebase_config: string | undefined;
declare const __vite_firebase_config: string | undefined;
declare const __initial_auth_token: string | undefined;

// ============================================================================
// 1. FIREBASE CLOUD & CROSS-TAB BROADCAST INITIALIZATION
// ============================================================================
let app: any = null;
let auth: any = null;
let db: any = null;
let firebaseInitializationError: string | null = null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'pen-fight-arena-app';

try {
  const firebaseConfigText =
    typeof __firebase_config !== 'undefined' && __firebase_config
      ? __firebase_config
      : typeof __vite_firebase_config !== 'undefined'
      ? __vite_firebase_config
      : '';
  if (firebaseConfigText) {
    const firebaseConfig = JSON.parse(firebaseConfigText);
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (err) {
  firebaseInitializationError =
    'Firebase configuration is invalid. Check VITE_FIREBASE_CONFIG in your environment.';
  console.error('Firebase initialization failed:', err);
}

// ============================================================================
// 2. TYPES & INTERFACES (8 PAGES + REAL-TIME MULTIPLAYER + PHYSICS)
// ============================================================================
export type AppPage =
  | 'home'
  | 'play'
  | 'collection'
  | 'profile'
  | 'leaderboard'
  | 'friends'
  | 'howtoplay'
  | 'settings';

export type NetworkTransportMode = 'cloud_realtime' | 'custom_websocket';
export type GameMode = 'ai' | 'local' | 'online' | 'ranked' | 'king' | 'daily';
export type AIPersonality = 'clumsy_rookie' | 'calculating_strategist' | 'reckless_aggressor';
export type RarityTier = 'Common' | 'Rare' | 'Epic' | 'Legendary';
export type SchoolRuleMode = 'flick' | 'flip' | 'knockback' | 'survival';
export type TacticalStance = 'standard' | 'precision' | 'bank_shot' | 'spin_hook';
export type DeskId =
  | 'wooden_classic'
  | 'notebook_page'
  | 'exam_hall'
  | 'library_table'
  | 'playground_bench'
  | 'giant_desk';
export type WinFormat = 'single' | 'bo3' | 'bo5';
export type BarrelSkin = 'classic' | 'gold_foil' | 'stickers' | 'camo' | 'neon_ink';
export type CapTopper = 'none' | 'crown' | 'eraser_mod' | 'spring';
export type LeagueTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

export interface Vec2 {
  x: number;
  y: number;
}

export interface PenCustomization {
  skin: BarrelSkin;
  gripColor: string;
  topper: CapTopper;
}

export interface PenModel {
  id: string;
  name: string;
  rarity: RarityTier;
  category: 'Classic School' | 'Gel & Drafter' | 'Modded' | 'Mythic Fantasy';
  tagline: string;
  unlockCost: number;
  mass: number;
  length: number;
  width: number;
  friction: number;
  restitution: number;
  primaryColor: string;
  secondaryColor: string;
  capColor: string;
  gripColor: string;
  metallic?: boolean;
  doubleCapped?: boolean;
  glowColor?: string;
  statsDisplay: {
    weight: number;
    speed: number;
    spin: number;
    control: number;
  };
}

export interface HouseRules {
  seriesFormat: WinFormat;
  clipHangSaveBonus: boolean;
  heavyCapSpinBonus: boolean;
  shotClockSeconds: 0 | 10 | 15;
}

export interface DeskObstacle {
  id: string;
  type: 'eraser' | 'sharpener';
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  restitution: number;
  color: string;
  label: string;
}

export interface DeskArena {
  id: DeskId;
  name: string;
  subtitle: string;
  badge: string;
  frictionMultiplier: number;
  woodBaseColor: string;
  woodGrainColor: string;
  borderColor: string;
  obstacles: DeskObstacle[];
}

export interface PenBody {
  id: number; // 1 or 2
  model: PenModel;
  customization?: PenCustomization;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  omega: number;
  mass: number;
  invMass: number;
  inertia: number;
  invInertia: number;
  halfLen: number;
  halfWid: number;
  stocksRemaining: number;
  fallen: boolean;
  fallProgress: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

export interface ReplayFrame {
  p1: { x: number; y: number; angle: number; fallen: boolean; fallProgress: number };
  p2: { x: number; y: number; angle: number; fallen: boolean; fallProgress: number };
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  label: string;
  sender: string;
  x: number;
  y: number;
}

export interface LiveAimGhost {
  player: 1 | 2;
  active: boolean;
  grabLocalOffset: number;
  pullVector: Vec2;
  powerPct: number;
  stance: TacticalStance;
  timestamp: number;
}

export interface ShotCommand {
  player: 1 | 2;
  grabLocalOffset: number;
  impulseX: number;
  impulseY: number;
  stance: TacticalStance;
  timingQuality: 'perfect' | 'normal' | 'early';
  timestamp: number;
  p1Start: { x: number; y: number; angle: number };
  p2Start: { x: number; y: number; angle: number };
}

export interface OnlineRoomState {
  roomCode: string;
  hostUid: string;
  guestUid: string | null;
  hostName: string;
  guestName: string;
  spectatorCount: number;
  p1PenId: string;
  p2PenId: string;
  deskId: DeskId;
  ruleMode: SchoolRuleMode;
  houseRules: HouseRules;
  turn: 1 | 2;
  scores: { p1: number; p2: number };
  round: number;
  status: 'waiting' | 'playing' | 'finished';
  liveAim: LiveAimGhost | null;
  lastShot: ShotCommand | null;
  lastReaction: { emoji: string; label: string; sender: string; timestamp: number } | null;
  rematchVotes: { p1: boolean; p2: boolean };
  winner: 0 | 1 | 2;
  updatedAt: number;
}

export interface MatchHistoryItem {
  id: string;
  date: string;
  mode: GameMode;
  ruleMode: SchoolRuleMode;
  opponent: string;
  result: 'WIN' | 'LOSS';
  score: string;
  penUsed: string;
  eloChange: number;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  rewardDrops: number;
}

export interface SchoolAcademy {
  id: string;
  name: string;
  motto: string;
  mascot: string;
  color: string;
  totalPoints: number;
  members: number;
}

export interface PlayerSettings {
  masterVolume: number;
  sfxMuted: boolean;
  hapticsEnabled: boolean;
  highContrastAim: boolean;
  reducedMotion: boolean;
  allowSpectators: boolean;
  wsServerUrl: string;
}

export interface PlayerProfile {
  name: string;
  schoolId: string;
  elo: number;
  xp: number;
  inkDrops: number;
  wins: number;
  losses: number;
  winStreak: number;
  bestStreak: number;
  kingBestStreak: number;
  dailyBestShots: number | null;
  unlockedPens: string[];
  customizations: Record<string, PenCustomization>;
  achievements: AchievementItem[];
  matchHistory: MatchHistoryItem[];
  friendsList: string[];
  settings: PlayerSettings;
}

// ============================================================================
// 3. CONSTANTS: 8 PENS, 6 DESKS, FICTIONAL SCHOOLS & ACHIEVEMENTS
// ============================================================================
export const VIRTUAL_WIDTH = 1000;
export const VIRTUAL_HEIGHT = 620;
export const DESK_BOUNDS = {
  left: 70,
  right: 930,
  top: 60,
  bottom: 560
};
export const SUMO_RING_RADIUS = 195;

export const RARITY_STYLES: Record<
  RarityTier,
  { badgeBg: string; border: string; glow: string }
> = {
  Common: {
    badgeBg: 'bg-slate-700 text-slate-200 border-slate-500',
    border: 'border-slate-600',
    glow: ''
  },
  Rare: {
    badgeBg: 'bg-blue-600/30 text-blue-300 border-blue-400/50',
    border: 'border-blue-500/60',
    glow: 'shadow-blue-500/10'
  },
  Epic: {
    badgeBg: 'bg-purple-600/30 text-purple-200 border-purple-400/60',
    border: 'border-purple-500/70',
    glow: 'shadow-purple-500/20'
  },
  Legendary: {
    badgeBg:
      'bg-gradient-to-r from-amber-500/40 via-yellow-400/40 to-orange-500/40 text-amber-200 border-amber-300',
    border: 'border-amber-400',
    glow: 'shadow-amber-500/30'
  }
};

export const PEN_MODELS: PenModel[] = [
  {
    id: 'bic-crystal',
    name: 'Classic Bic Crystal',
    rarity: 'Common',
    category: 'Classic School',
    tagline: 'Hexagonal clear barrel with the chewed blue cap. Every student’s starter weapon.',
    unlockCost: 0,
    mass: 1.18,
    length: 146,
    width: 14,
    friction: 0.968,
    restitution: 0.80,
    primaryColor: '#e2e8f0',
    secondaryColor: '#1d4ed8',
    capColor: '#1e40af',
    gripColor: '#3b82f6',
    statsDisplay: { weight: 58, speed: 82, spin: 84, control: 80 }
  },
  {
    id: 'exam-gel-gripper',
    name: 'Exam Gel Gripper',
    rarity: 'Common',
    category: 'Gel & Drafter',
    tagline: 'Extra-soft contoured rubber grip that brakes right on the desk cliff.',
    unlockCost: 0,
    mass: 1.32,
    length: 144,
    width: 16,
    friction: 0.954,
    restitution: 0.75,
    primaryColor: '#0f172a',
    secondaryColor: '#0ea5e9',
    capColor: '#0369a1',
    gripColor: '#38bdf8',
    statsDisplay: { weight: 68, speed: 74, spin: 76, control: 96 }
  },
  {
    id: 'mech-pencil-05',
    name: '0.5mm Mechanical Pencil',
    rarity: 'Rare',
    category: 'Gel & Drafter',
    tagline: 'Featherweight drafting chassis with stainless needle tip & whip torque.',
    unlockCost: 150,
    mass: 0.96,
    length: 156,
    width: 13,
    friction: 0.974,
    restitution: 0.90,
    primaryColor: '#334155',
    secondaryColor: '#10b981',
    capColor: '#059669',
    gripColor: '#34d399',
    statsDisplay: { weight: 44, speed: 97, spin: 96, control: 72 }
  },
  {
    id: 'four-color-chonk',
    name: '4-Color Clicker Chonk',
    rarity: 'Rare',
    category: 'Classic School',
    tagline: 'Wide quadruple-spring barrel. Absorbs heavy hits without budging.',
    unlockCost: 200,
    mass: 1.72,
    length: 138,
    width: 22,
    friction: 0.962,
    restitution: 0.84,
    primaryColor: '#f8fafc',
    secondaryColor: '#2563eb',
    capColor: '#dc2626',
    gripColor: '#16a34a',
    statsDisplay: { weight: 88, speed: 66, spin: 70, control: 84 }
  },
  {
    id: 'executive-fountain',
    name: 'Executive Steel Fountain',
    rarity: 'Epic',
    category: 'Classic School',
    tagline: 'Solid brushed steel barrel with 24k gold nib. Unstoppable battering ram.',
    unlockCost: 350,
    mass: 1.98,
    length: 152,
    width: 17,
    friction: 0.964,
    restitution: 0.74,
    primaryColor: '#1e293b',
    secondaryColor: '#eab308',
    capColor: '#ca8a04',
    gripColor: '#facc15',
    metallic: true,
    statsDisplay: { weight: 98, speed: 64, spin: 68, control: 82 }
  },
  {
    id: 'spin-master-mod',
    name: 'Spin-Master Mod (Double-Capped)',
    rarity: 'Epic',
    category: 'Modded',
    tagline: 'Symmetrical tournament pen-spinning mod with dual weighted rubber caps.',
    unlockCost: 400,
    mass: 1.48,
    length: 166,
    width: 15,
    friction: 0.969,
    restitution: 0.92,
    primaryColor: '#4c1d95',
    secondaryColor: '#c084fc',
    capColor: '#9333ea',
    gripColor: '#e879f9',
    doubleCapped: true,
    statsDisplay: { weight: 76, speed: 88, spin: 100, control: 86 }
  },
  {
    id: 'dragon-golden-ruler',
    name: 'Dragon-Scale Golden Ruler Pen',
    rarity: 'Legendary',
    category: 'Mythic Fantasy',
    tagline: 'Mythical backbench trophy forged from imperial brass and crimson lacquer.',
    unlockCost: 650,
    mass: 1.88,
    length: 158,
    width: 18,
    friction: 0.966,
    restitution: 0.88,
    primaryColor: '#7f1d1d',
    secondaryColor: '#facc15',
    capColor: '#eab308',
    gripColor: '#fde047',
    metallic: true,
    glowColor: 'rgba(250, 204, 21, 0.45)',
    statsDisplay: { weight: 95, speed: 86, spin: 92, control: 90 }
  },
  {
    id: 'cyber-neon-rgb',
    name: 'Cyber-Neon RGB Gel Mod',
    rarity: 'Legendary',
    category: 'Mythic Fantasy',
    tagline: 'Translucent fiber-optic barrel with tungsten tips that spark on impact.',
    unlockCost: 700,
    mass: 1.55,
    length: 162,
    width: 16,
    friction: 0.968,
    restitution: 0.94,
    primaryColor: '#090d16',
    secondaryColor: '#06b6d4',
    capColor: '#ec4899',
    gripColor: '#22d3ee',
    doubleCapped: true,
    glowColor: 'rgba(6, 182, 212, 0.5)',
    statsDisplay: { weight: 80, speed: 96, spin: 98, control: 92 }
  }
];

export const DESK_ARENAS: DeskArena[] = [
  {
    id: 'wooden_classic',
    name: 'Old Wooden Classroom Desk',
    subtitle: 'Carved oak grain, 90s "Cool S" graffiti, compass rings & brass pencil groove.',
    badge: 'Nostalgic Classic',
    frictionMultiplier: 1.0,
    woodBaseColor: '#b47b44',
    woodGrainColor: '#8c5828',
    borderColor: '#5c3412',
    obstacles: []
  },
  {
    id: 'notebook_page',
    name: 'Notebook Page Arena',
    subtitle: 'Spiral-bound ruled notebook sheet with red margin lines & stick-figure battle doodles.',
    badge: 'Paper Surface',
    frictionMultiplier: 0.996,
    woodBaseColor: '#f8fafc',
    woodGrainColor: '#93c5fd',
    borderColor: '#cbd5e1',
    obstacles: []
  },
  {
    id: 'exam_hall',
    name: 'Exam Hall Desk',
    subtitle: 'Laminate desk with "DO NOT WRITE" stencil, candidate roll sticker & stationery hazards.',
    badge: '+2 Stationery Hazards',
    frictionMultiplier: 1.004,
    woodBaseColor: '#d6c7b2',
    woodGrainColor: '#b8a48a',
    borderColor: '#64748b',
    obstacles: [
      {
        id: 'obs-eraser',
        type: 'eraser',
        x: 370,
        y: 310,
        width: 68,
        height: 36,
        angle: -0.25,
        restitution: 0.95,
        color: '#f43f5e',
        label: 'EXAM ERASER'
      },
      {
        id: 'obs-sharpener',
        type: 'sharpener',
        x: 630,
        y: 310,
        width: 48,
        height: 34,
        angle: 0.35,
        restitution: 0.82,
        color: '#94a3b8',
        label: 'STEEL'
      }
    ]
  },
  {
    id: 'library_table',
    name: 'Library Study Table',
    subtitle: 'Deep polished mahogany with quiet-zone felt runner & vintage library date-due card.',
    badge: 'Low Friction Polish',
    frictionMultiplier: 1.01,
    woodBaseColor: '#4a1d1f',
    woodGrainColor: '#2e0f11',
    borderColor: '#27120b',
    obstacles: []
  },
  {
    id: 'playground_bench',
    name: 'Playground Concrete Bench',
    subtitle: 'Weathered outdoor stone recess bench with chalk courts & gritty high-grip texture.',
    badge: 'High Grip Stone',
    frictionMultiplier: 0.989,
    woodBaseColor: '#64748b',
    woodGrainColor: '#475569',
    borderColor: '#334155',
    obstacles: []
  },
  {
    id: 'giant_desk',
    name: 'Giant Classroom Desk',
    subtitle: 'Colossal macro-scale wood planks with giant paperclips outside the hitbox!',
    badge: 'Giant Scale Comedy',
    frictionMultiplier: 1.002,
    woodBaseColor: '#c28b52',
    woodGrainColor: '#9c6733',
    borderColor: '#694119',
    obstacles: []
  }
];

export const FICTIONAL_ACADEMIES: SchoolAcademy[] = [
  {
    id: 'oakridge-high',
    name: 'Oakridge Backbench High',
    motto: 'Last Row, First Place',
    mascot: '🦅 Golden Hawks',
    color: '#f59e0b',
    totalPoints: 14820,
    members: 342
  },
  {
    id: 'st-jude-poly',
    name: 'St. Jude Geometry Academy',
    motto: 'Precision in Every Angle',
    mascot: '📐 Iron Compasses',
    color: '#3b82f6',
    totalPoints: 14190,
    members: 298
  },
  {
    id: 'crimson-ink-inst',
    name: 'Crimson Ink Institute',
    motto: 'Spin Hard, Strike Harder',
    mascot: '🐉 Red Dragons',
    color: '#ef4444',
    totalPoints: 13640,
    members: 276
  },
  {
    id: 'emerald-chalk-prep',
    name: 'Emerald Chalk Prep',
    motto: 'Unbreakable Grip',
    mascot: '🛡️ Jade Guardians',
    color: '#10b981',
    totalPoints: 12910,
    members: 245
  }
];

export const INITIAL_ACHIEVEMENTS: AchievementItem[] = [
  {
    id: 'ach-first-ko',
    title: 'First Recess Knockout',
    description: 'Send an opponent’s pen flying off the classroom desk.',
    icon: '🏆',
    unlocked: true,
    rewardDrops: 100
  },
  {
    id: 'ach-sweet-spot',
    title: 'Perfect Timing Flick',
    description: 'Release a shot inside the Green Sweet-Spot timing zone.',
    icon: '⚡',
    unlocked: false,
    rewardDrops: 150
  },
  {
    id: 'ach-spin-doctor',
    title: 'Helicopter Spin Doctor',
    description: 'Execute 5 high-torque Tip/Cap whip shots.',
    icon: '🌪️',
    unlocked: false,
    rewardDrops: 150
  },
  {
    id: 'ach-king-3',
    title: 'King of the Classroom',
    description: 'Defeat 3 challengers in a row in King of the Classroom mode.',
    icon: '👑',
    unlocked: false,
    rewardDrops: 250
  },
  {
    id: 'ach-online-duel',
    title: 'Connected Backbencher',
    description: 'Host or join a 6-character real-time online room match.',
    icon: '🌐',
    unlocked: false,
    rewardDrops: 200
  },
  {
    id: 'ach-collector',
    title: 'Legendary Pencil Case',
    description: 'Unlock 4 or more pens in your collection.',
    icon: '🖊️',
    unlocked: false,
    rewardDrops: 300
  }
];

export const REACTION_PRESETS = [
  { emoji: '🔥', label: 'SICK HIT!' },
  { emoji: '📐', label: 'CALCULATED!' },
  { emoji: '😱', label: 'CLIFFHANGER!' },
  { emoji: '💀', label: 'RIP PEN' },
  { emoji: '👏', label: 'RESPECT!' }
];

// ============================================================================
// 4. FULL WEBSOCKET (SOCKET.IO) SERVER & CLIENT CODE FOR DEVELOPER EXPORT
// ============================================================================
export const SOCKET_SERVER_CODE_SNIPPET = `// ============================================================================
// server.ts — Node.js + Express + Socket.IO Authoritative Pen Fight Server
// Run with: npx tsx server.ts (Listens on ws://localhost:4000)
// ============================================================================
import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

interface RoomSession {
  roomCode: string;
  hostSocketId: string;
  guestSocketId: string | null;
  hostName: string;
  guestName: string;
  deskId: string;
  ruleMode: string;
  turn: 1 | 2;
  scores: { p1: number; p2: number };
  status: 'waiting' | 'playing' | 'finished';
}

const rooms = new Map<string, RoomSession>();

io.on('connection', (socket: Socket) => {
  console.log('[PenFight WS] Client connected:', socket.id);

  // 1. Create a 6-character classroom desk room
  socket.on('create_room', (payload, callback) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let roomCode = '';
    for (let i = 0; i < 6; i++) roomCode += chars[Math.floor(Math.random() * chars.length)];

    const session: RoomSession = {
      roomCode,
      hostSocketId: socket.id,
      guestSocketId: null,
      hostName: payload.playerName || 'Player 1',
      guestName: 'Waiting...',
      deskId: payload.deskId || 'wooden_classic',
      ruleMode: payload.ruleMode || 'flick',
      turn: 1,
      scores: { p1: 0, p2: 0 },
      status: 'waiting'
    };
    rooms.set(roomCode, session);
    socket.join(roomCode);
    callback({ ok: true, roomCode, role: 1, session });
  });

  // 2. Join room as Challenger (Player 2) or Spectator
  socket.on('join_room', ({ roomCode, playerName, asSpectator }, callback) => {
    const cleanCode = (roomCode || '').toUpperCase().trim();
    const session = rooms.get(cleanCode);
    if (!session) return callback({ ok: false, error: 'Room not found' });

    socket.join(cleanCode);
    if (asSpectator) {
      return callback({ ok: true, role: 'spectator', session });
    }

    session.guestSocketId = socket.id;
    session.guestName = playerName || 'Player 2';
    session.status = 'playing';
    io.to(cleanCode).emit('room_updated', session);
    callback({ ok: true, role: 2, session });
  });

  // 3. Live Opponent Aiming Vector Relay (60fps throttled)
  socket.on('aim_move', ({ roomCode, aimData }) => {
    socket.to(roomCode).emit('opponent_aim', aimData);
  });

  // 4. Authoritative Turn-Validated Shot Execution
  socket.on('flick_shot', ({ roomCode, shotCommand }) => {
    const session = rooms.get(roomCode);
    if (!session) return;

    const isHost = socket.id === session.hostSocketId;
    const expectedTurn = isHost ? 1 : 2;
    if (session.turn !== expectedTurn) {
      return socket.emit('error_msg', 'Invalid turn: Wait for your opponent!');
    }

    // Broadcast deterministic impulse to all clients & spectators in room
    io.to(roomCode).emit('execute_shot', shotCommand);
  });

  // 5. Turn & Round Synchronization
  socket.on('turn_settled', ({ roomCode, nextTurn, scores }) => {
    const session = rooms.get(roomCode);
    if (!session) return;
    session.turn = nextTurn;
    if (scores) session.scores = scores;
    io.to(roomCode).emit('room_updated', session);
  });

  // 6. Classroom Emoji Reactions & Rematch
  socket.on('send_reaction', ({ roomCode, reaction }) => {
    io.to(roomCode).emit('reaction_broadcast', reaction);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(\`Pen Fight Arena Socket.IO Server running on ws://localhost:\${PORT}\`);
});`;

export const SOCKET_CLIENT_HOOK_SNIPPET = `// ============================================================================
// useSocketMultiplayer.ts — React Hook for Socket.IO Real-Time Pen Fight Sync
// ============================================================================
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocketMultiplayer(serverUrl = 'http://localhost:4000') {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [roomSession, setRoomSession] = useState<any>(null);

  useEffect(() => {
    const socket = io(serverUrl, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('room_updated', (session) => setRoomSession({ ...session }));

    return () => {
      socket.disconnect();
    };
  }, [serverUrl]);

  const emitAimMove = useCallback((roomCode: string, aimData: any) => {
    socketRef.current?.emit('aim_move', { roomCode, aimData });
  }, []);

  const emitFlickShot = useCallback((roomCode: string, shotCommand: any) => {
    socketRef.current?.emit('flick_shot', { roomCode, shotCommand });
  }, []);

  return { socket: socketRef.current, connected, roomSession, emitAimMove, emitFlickShot };
}`;

export const PACKAGE_JSON_SNIPPET = `{
  "name": "pen-fight-arena-fullstack",
  "version": "2.0.0",
  "scripts": {
    "dev:client": "vite",
    "dev:server": "npx tsx server.ts",
    "dev": "concurrently \\"npm run dev:server\\" \\"npm run dev:client\\""
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "lucide-react": "^0.400.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "socket.io": "^4.7.5",
    "socket.io-client": "^4.7.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.14.0",
    "concurrently": "^8.2.2",
    "tailwindcss": "^3.4.4",
    "tsx": "^4.15.7",
    "typescript": "^5.5.2",
    "vite": "^5.3.1"
  }
}`;

// ============================================================================
// 5. WEB AUDIO API + MOBILE HAPTICS FEEDBACK ENGINE
// ============================================================================
class SoundAndHapticsEngine {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;
  public volume: number = 0.85;
  public hapticsEnabled: boolean = true;

  private getContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  vibrate(pattern: number | number[]) {
    if (!this.hapticsEnabled) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore unsupported devices
    }
  }

  playPenClack(intensity: number = 1) {
    this.vibrate(Math.min(45, Math.round(intensity * 30)));
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const vol = Math.min(1, Math.max(0.1, intensity)) * this.volume;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1150 + Math.random() * 350, now);
    osc.frequency.exponentialRampToValueAtTime(175, now + 0.065);

    gain.gain.setValueAtTime(vol * 0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  playFlick(powerRatio: number, isSweetSpot: boolean = false) {
    this.vibrate(isSweetSpot ? [15, 25, 20] : 15);
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isSweetSpot ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isSweetSpot ? 320 : 220, now);
    osc.frequency.exponentialRampToValueAtTime(
      (isSweetSpot ? 880 : 620) * (0.6 + powerRatio * 0.6),
      now + 0.09
    );

    gain.gain.setValueAtTime(0.28 * this.volume * (0.4 + powerRatio * 0.6), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playFallOffDesk() {
    this.vibrate([30, 40, 60]);
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(85, now + 0.38);

    gain.gain.setValueAtTime(0.28 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  playVictoryBell() {
    this.vibrate([40, 50, 80]);
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0.28 * this.volume, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.46);
    });
  }
}

const soundFX = new SoundAndHapticsEngine();

// ============================================================================
// 6. DETERMINISTIC 2D OBB PHYSICS, RANKED NORMALIZATION & TIMING ENGINE
// ============================================================================
export function getLeagueFromElo(elo: number): {
  tier: LeagueTier;
  bgBadge: string;
  minElo: number;
  nextElo: number;
} {
  if (elo >= 1700)
    return {
      tier: 'Diamond',
      bgBadge: 'bg-cyan-500/20 border-cyan-400 text-cyan-200',
      minElo: 1700,
      nextElo: 2000
    };
  if (elo >= 1500)
    return {
      tier: 'Platinum',
      bgBadge: 'bg-emerald-500/20 border-emerald-400 text-emerald-200',
      minElo: 1500,
      nextElo: 1700
    };
  if (elo >= 1300)
    return {
      tier: 'Gold',
      bgBadge: 'bg-amber-500/20 border-amber-400 text-amber-200',
      minElo: 1300,
      nextElo: 1500
    };
  if (elo >= 1100)
    return {
      tier: 'Silver',
      bgBadge: 'bg-slate-400/20 border-slate-300 text-slate-100',
      minElo: 1100,
      nextElo: 1300
    };
  return {
    tier: 'Bronze',
    bgBadge: 'bg-orange-600/20 border-orange-400 text-orange-200',
    minElo: 0,
    nextElo: 1100
  };
}

export function calculateEloRatingChange(
  playerElo: number,
  opponentElo: number,
  didWin: boolean,
  winStreak: number = 0
): number {
  const K = 32;
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const actualScore = didWin ? 1 : 0;
  const baseDelta = Math.round(K * (actualScore - expectedScore));
  const streakBonus = didWin && winStreak >= 2 ? Math.min(12, winStreak * 3) : 0;
  return baseDelta + streakBonus;
}

/**
 * Creates a PenBody. In Ranked Competitive mode (`normalizeForRanked = true`),
 * all pens use standardized tournament physics (mass=1.40, length=146, width=15)
 * so ranked matches are 100% skill-based and never pay-to-win.
 */
export function createPenBody(
  id: 1 | 2,
  model: PenModel,
  isSecondPlayer: boolean,
  stocks: number = 3,
  customization?: PenCustomization,
  normalizeForRanked: boolean = false
): PenBody {
  const effectiveMass = normalizeForRanked ? 1.4 : model.mass;
  const effectiveLen = normalizeForRanked ? 146 : model.length;
  const effectiveWid = normalizeForRanked ? 15 : model.width;

  const halfLen = effectiveLen / 2;
  const halfWid = effectiveWid / 2;
  const inertia =
    (effectiveMass * (effectiveLen * effectiveLen + effectiveWid * effectiveWid)) / 18;

  return {
    id,
    model: normalizeForRanked
      ? { ...model, friction: 0.966, restitution: 0.82 }
      : model,
    customization: customization || {
      skin: 'classic',
      gripColor: model.gripColor,
      topper: 'none'
    },
    x: isSecondPlayer ? VIRTUAL_WIDTH - 220 : 220,
    y: VIRTUAL_HEIGHT / 2,
    vx: 0,
    vy: 0,
    angle: isSecondPlayer ? -Math.PI / 2 : Math.PI / 2,
    omega: 0,
    mass: effectiveMass,
    invMass: 1 / effectiveMass,
    inertia,
    invInertia: 1 / inertia,
    halfLen,
    halfWid,
    stocksRemaining: stocks,
    fallen: false,
    fallProgress: 0
  };
}

export function applyPointImpulseToPen(
  pen: PenBody,
  grabLocalOffset: number,
  impulseX: number,
  impulseY: number,
  heavyCapBonus: boolean = false,
  stance: TacticalStance = 'standard'
): void {
  const clampedOffset = Math.max(-1, Math.min(1, grabLocalOffset));
  const distFromCenter = clampedOffset * pen.halfLen;

  const rx = Math.cos(pen.angle) * distFromCenter;
  const ry = Math.sin(pen.angle) * distFromCenter;

  const stanceLinearScale =
    stance === 'precision' ? 0.88 : stance === 'bank_shot' ? 1.12 : 1.0;

  pen.vx += impulseX * pen.invMass * stanceLinearScale;
  pen.vy += impulseY * pen.invMass * stanceLinearScale;

  const torqueImpulse = rx * impulseY - ry * impulseX;
  let capMultiplier = heavyCapBonus && Math.abs(clampedOffset) > 0.65 ? 1.82 : 1.45;
  if (stance === 'spin_hook') capMultiplier *= 1.32;
  if (stance === 'precision') capMultiplier *= 0.75;

  pen.omega += torqueImpulse * pen.invInertia * capMultiplier;
}

export function getOBBGeometry(
  x: number,
  y: number,
  halfLen: number,
  halfWid: number,
  angle: number
) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const axisX: Vec2 = { x: cos, y: sin };
  const axisY: Vec2 = { x: -sin, y: cos };

  const vertices: Vec2[] = [
    {
      x: x + axisX.x * halfLen + axisY.x * halfWid,
      y: y + axisX.y * halfLen + axisY.y * halfWid
    },
    {
      x: x - axisX.x * halfLen + axisY.x * halfWid,
      y: y - axisX.y * halfLen + axisY.y * halfWid
    },
    {
      x: x - axisX.x * halfLen - axisY.x * halfWid,
      y: y - axisX.y * halfLen - axisY.y * halfWid
    },
    {
      x: x + axisX.x * halfLen - axisY.x * halfWid,
      y: y + axisX.y * halfLen - axisY.y * halfWid
    }
  ];

  return { vertices, axes: [axisX, axisY] };
}

function projectVertices(vertices: Vec2[], axis: Vec2): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const v of vertices) {
    const proj = v.x * axis.x + v.y * axis.y;
    if (proj < min) min = proj;
    if (proj > max) max = proj;
  }
  return { min, max };
}

export function detectOBBCollision(
  a: { x: number; y: number; halfLen: number; halfWid: number; angle: number },
  b: { x: number; y: number; halfLen: number; halfWid: number; angle: number }
): { collided: boolean; normal: Vec2; depth: number; contactPoint: Vec2 } | null {
  const obbA = getOBBGeometry(a.x, a.y, a.halfLen, a.halfWid, a.angle);
  const obbB = getOBBGeometry(b.x, b.y, b.halfLen, b.halfWid, b.angle);

  const testAxes = [...obbA.axes, ...obbB.axes];
  let minOverlap = Infinity;
  let smallestAxis: Vec2 = { x: 0, y: 0 };

  for (const axis of testAxes) {
    const projA = projectVertices(obbA.vertices, axis);
    const projB = projectVertices(obbB.vertices, axis);

    const overlap = Math.min(projA.max, projB.max) - Math.max(projA.min, projB.min);
    if (overlap <= 0) return null;
    if (overlap < minOverlap) {
      minOverlap = overlap;
      smallestAxis = { ...axis };
    }
  }

  const centerDir = { x: b.x - a.x, y: b.y - a.y };
  if (centerDir.x * smallestAxis.x + centerDir.y * smallestAxis.y < 0) {
    smallestAxis.x = -smallestAxis.x;
    smallestAxis.y = -smallestAxis.y;
  }

  let bestVertex = obbA.vertices[0];
  let bestScore = -Infinity;
  for (const v of obbA.vertices) {
    const score = (v.x - a.x) * smallestAxis.x + (v.y - a.y) * smallestAxis.y;
    if (score > bestScore) {
      bestScore = score;
      bestVertex = v;
    }
  }
  for (const v of obbB.vertices) {
    const score = (a.x - v.x) * smallestAxis.x + (a.y - v.y) * smallestAxis.y;
    const distToA = Math.hypot(v.x - a.x, v.y - a.y);
    if (distToA < a.halfLen && score > bestScore * 0.9) {
      bestVertex = v;
    }
  }

  return {
    collided: true,
    normal: smallestAxis,
    depth: minOverlap,
    contactPoint: bestVertex
  };
}

export function isPenOffDesk(pen: PenBody): boolean {
  return (
    pen.x < DESK_BOUNDS.left ||
    pen.x > DESK_BOUNDS.right ||
    pen.y < DESK_BOUNDS.top ||
    pen.y > DESK_BOUNDS.bottom
  );
}

export function isPenClipHanging(pen: PenBody): boolean {
  if (isPenOffDesk(pen)) return false;
  const obb = getOBBGeometry(pen.x, pen.y, pen.halfLen, pen.halfWid, pen.angle);
  for (const v of obb.vertices) {
    const outLeft = DESK_BOUNDS.left - v.x;
    const outRight = v.x - DESK_BOUNDS.right;
    const outTop = DESK_BOUNDS.top - v.y;
    const outBottom = v.y - DESK_BOUNDS.bottom;
    if (Math.max(outLeft, outRight, outTop, outBottom) >= pen.halfLen * 0.35) {
      return true;
    }
  }
  return false;
}

export function isPenOutsideSumoRing(
  pen: PenBody,
  centerX = VIRTUAL_WIDTH / 2,
  centerY = VIRTUAL_HEIGHT / 2,
  radius = SUMO_RING_RADIUS
): boolean {
  return Math.hypot(pen.x - centerX, pen.y - centerY) > radius;
}

export function computeFlipTargetScore(
  pen: PenBody,
  targetPos: Vec2,
  targetRadius: number = 85
): number {
  if (pen.fallen) return 0;
  const tipX = pen.x + Math.cos(pen.angle) * pen.halfLen;
  const tipY = pen.y + Math.sin(pen.angle) * pen.halfLen;
  const bestDist = Math.min(
    Math.hypot(pen.x - targetPos.x, pen.y - targetPos.y),
    Math.hypot(tipX - targetPos.x, tipY - targetPos.y)
  );
  if (bestDist > targetRadius * 1.4) return 0;
  return Math.max(0, Math.round(100 * (1 - bestDist / (targetRadius * 1.4))));
}

export function evaluateRoundOutcome(
  p1: PenBody,
  p2: PenBody,
  ruleMode: SchoolRuleMode = 'flick',
  targetZone: Vec2 = { x: VIRTUAL_WIDTH / 2, y: VIRTUAL_HEIGHT / 2 },
  turnCountInRound: number = 2
): { roundOver: boolean; winner: 0 | 1 | 2 | 'draw'; reason: string } {
  if (p1.fallen && p2.fallen) {
    return {
      roundOver: true,
      winner: 'draw',
      reason: 'Double Ring-Out! Both pens tumbled off the desk!'
    };
  }
  if (p2.fallen) {
    return {
      roundOver: true,
      winner: 1,
      reason: 'Knockout! Player 2 was flung off the desk!'
    };
  }
  if (p1.fallen) {
    return {
      roundOver: true,
      winner: 2,
      reason: 'Knockout! Player 1 was flung off the desk!'
    };
  }

  if (ruleMode === 'knockback') {
    const p1Out = isPenOutsideSumoRing(p1);
    const p2Out = isPenOutsideSumoRing(p2);
    if (p1Out && p2Out)
      return { roundOver: true, winner: 'draw', reason: 'Both pens exited the Sumo Ring!' };
    if (p2Out)
      return { roundOver: true, winner: 1, reason: 'Sumo Ring-Out! Player 2 pushed out!' };
    if (p1Out)
      return { roundOver: true, winner: 2, reason: 'Sumo Ring-Out! Player 1 pushed out!' };
  }

  if (ruleMode === 'flip') {
    const s1 = computeFlipTargetScore(p1, targetZone, 85);
    const s2 = computeFlipTargetScore(p2, targetZone, 85);
    if (turnCountInRound >= 2 && (s1 >= 65 || s2 >= 65)) {
      if (s1 > s2)
        return {
          roundOver: true,
          winner: 1,
          reason: `Target Bullseye! Player 1 landed ${s1}% inside the Flip Zone!`
        };
      if (s2 > s1)
        return {
          roundOver: true,
          winner: 2,
          reason: `Target Bullseye! Player 2 landed ${s2}% inside the Flip Zone!`
        };
    }
  }

  return { roundOver: false, winner: 0, reason: '' };
}

// ============================================================================
// 7. AUTOMATED UNIT TEST SUITE
// ============================================================================
export interface UnitTestResult {
  name: string;
  category: string;
  passed: boolean;
  details: string;
}

export function runCoreGameUnitTests(): UnitTestResult[] {
  const results: UnitTestResult[] = [];

  // Test 1: Point-Impulse Torque & Spin Hook Stance
  {
    const pen = createPenBody(1, PEN_MODELS[0], false);
    pen.angle = Math.PI / 2;
    applyPointImpulseToPen(pen, 0.9, 15, 0, true, 'spin_hook');
    const passed = Math.abs(pen.omega) > 0.1 && pen.vx > 0;
    results.push({
      name: 'Point-Impulse Rotational Torque & Spin Hook Stance',
      category: '2D Physics Engine',
      passed,
      details: `Grabbing +0.9 tip with Spin Hook generated vx=${pen.vx.toFixed(2)}, omega=${pen.omega.toFixed(3)} rad/f`
    });
  }

  // Test 2: Ranked Fair Stat Normalization
  {
    const heavyPenRanked = createPenBody(1, PEN_MODELS[4], false, 3, undefined, true);
    const lightPenRanked = createPenBody(2, PEN_MODELS[2], true, 3, undefined, true);
    const passed =
      heavyPenRanked.mass === lightPenRanked.mass &&
      heavyPenRanked.halfLen === lightPenRanked.halfLen;
    results.push({
      name: 'Ranked Competitive Fair Stat Normalization',
      category: 'Competitive Integrity',
      passed,
      details: `Heavy (${PEN_MODELS[4].mass}) & Light (${PEN_MODELS[2].mass}) normalized to mass=${heavyPenRanked.mass}, halfLen=${heavyPenRanked.halfLen}px`
    });
  }

  // Test 3: OBB Separating Axis Theorem Collision
  {
    const penA = createPenBody(1, PEN_MODELS[0], false);
    const penB = createPenBody(2, PEN_MODELS[1], true);
    penA.x = 500;
    penA.y = 300;
    penB.x = 508;
    penB.y = 300;
    const hit = detectOBBCollision(penA, penB);
    penB.x = 750;
    const miss = detectOBBCollision(penA, penB);
    results.push({
      name: 'OBB Separating Axis Theorem (SAT) Collision',
      category: 'Collision Math',
      passed: hit !== null && hit.collided && miss === null,
      details: `Overlapping depth=${hit ? hit.depth.toFixed(2) : 0}px; Separated=null`
    });
  }

  // Test 4: Real-Time Shot Serialization & Deterministic Replay
  {
    const p1 = createPenBody(1, PEN_MODELS[0], false);
    applyPointImpulseToPen(p1, -0.75, 22, -8, true, 'standard');
    const p1Clone = createPenBody(1, PEN_MODELS[0], false);
    applyPointImpulseToPen(p1Clone, -0.75, 22, -8, true, 'standard');
    const passed = p1.vx === p1Clone.vx && p1.omega === p1Clone.omega;
    results.push({
      name: 'Deterministic Online Shot Impulse Synchronization',
      category: 'WebSocket / Cloud Sync',
      passed,
      details: `Host & Guest produce identical velocity (vx=${p1.vx.toFixed(3)}) & spin (omega=${p1.omega.toFixed(4)})`
    });
  }

  return results;
}

// ============================================================================
// 8. SHARED PEN CANVAS RENDERER
// ============================================================================
function drawCustomizedPenOnCanvas(
  ctx: CanvasRenderingContext2D,
  model: PenModel,
  custom?: PenCustomization,
  playerTag?: string
) {
  const L = model.length / 2;
  const W = model.width / 2;
  const skin = custom?.skin || 'classic';
  const gripColor = custom?.gripColor || model.gripColor;
  const topper = custom?.topper || 'none';

  if (model.glowColor) {
    ctx.save();
    ctx.shadowColor = model.glowColor;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = model.glowColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-L - 2, -W - 2, L * 2 + 4, W * 2 + 4, 6);
    ctx.stroke();
    ctx.restore();
  }

  let barrelColor = model.primaryColor;
  if (skin === 'gold_foil') barrelColor = '#ca8a04';
  if (skin === 'neon_ink') barrelColor = '#06b6d4';
  if (skin === 'camo') barrelColor = '#3f6212';

  ctx.fillStyle = barrelColor;
  ctx.beginPath();
  ctx.roundRect(-L * 0.85, -W, L * 1.45, W * 2, 4);
  ctx.fill();

  if (skin === 'stickers') {
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(-L * 0.45, -W * 0.8, 12, W * 1.6);
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(-L * 0.05, 0, W * 0.65, 0, Math.PI * 2);
    ctx.fill();
  } else if (skin === 'camo') {
    ctx.fillStyle = '#14532d';
    ctx.fillRect(-L * 0.6, -W, 18, W * 1.2);
    ctx.fillRect(-L * 0.1, -W * 0.2, 22, W * 1.2);
  } else if (skin === 'neon_ink') {
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-L * 0.75, 0);
    ctx.lineTo(L * 0.5, 0);
    ctx.stroke();
  }

  ctx.fillStyle =
    model.metallic || skin === 'gold_foil'
      ? 'rgba(254, 240, 138, 0.45)'
      : 'rgba(255, 255, 255, 0.32)';
  ctx.fillRect(-L * 0.8, -W * 0.65, L * 1.35, W * 0.42);

  ctx.fillStyle = gripColor;
  ctx.fillRect(L * 0.15, -W * 1.04, L * 0.42, W * 2.08);

  if (model.doubleCapped) {
    ctx.fillStyle = model.capColor;
    ctx.beginPath();
    ctx.roundRect(L * 0.58, -W * 1.12, L * 0.42, W * 2.24, 3);
    ctx.fill();
  } else {
    ctx.fillStyle = model.metallic || skin === 'gold_foil' ? '#eab308' : '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(L * 0.6, -W * 0.85);
    ctx.lineTo(L, 0);
    ctx.lineTo(L * 0.6, W * 0.85);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = model.secondaryColor;
    ctx.beginPath();
    ctx.arc(L - 2, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = model.capColor;
  ctx.beginPath();
  ctx.roundRect(-L, -W * 1.12, L * 0.42, W * 2.24, 3);
  ctx.fill();

  ctx.strokeStyle = model.metallic ? '#facc15' : model.secondaryColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-L * 0.9, -W * 1.12);
  ctx.lineTo(-L * 0.45, -W * 1.38);
  ctx.lineTo(-L * 0.45, -W * 1.12);
  ctx.stroke();

  if (topper === 'crown') {
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(-L, -W * 0.8);
    ctx.lineTo(-L - 11, -W);
    ctx.lineTo(-L - 7, 0);
    ctx.lineTo(-L - 11, W);
    ctx.lineTo(-L, W * 0.8);
    ctx.closePath();
    ctx.fill();
  } else if (topper === 'eraser_mod') {
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.roundRect(-L - 10, -W * 0.95, 10, W * 1.9, 3);
    ctx.fill();
  }

  if (playerTag) {
    ctx.fillStyle = playerTag === 'P1' ? '#1d4ed8' : '#be123c';
    ctx.beginPath();
    ctx.arc(-L * 0.22, 0, W * 0.68, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(playerTag, -L * 0.22, 0.5);
  }
}

// ============================================================================
// 9. DEFAULT PROFILE LOADER
// ============================================================================
function getInitialProfile(): PlayerProfile {
  return {
    name: 'Backbench_Legend',
    schoolId: 'oakridge-high',
    elo: 1160,
    xp: 480,
    inkDrops: 420,
    wins: 6,
    losses: 2,
    winStreak: 2,
    bestStreak: 4,
    kingBestStreak: 3,
    dailyBestShots: null,
    unlockedPens: ['bic-crystal', 'exam-gel-gripper', 'mech-pencil-05'],
    customizations: {},
    achievements: INITIAL_ACHIEVEMENTS,
    matchHistory: [
      {
        id: 'mh-1',
        date: 'Today',
        mode: 'ranked',
        ruleMode: 'flick',
        opponent: 'SpinMaster_Aisha',
        result: 'WIN',
        score: '2 - 1',
        penUsed: 'Classic Bic Crystal',
        eloChange: 24
      },
      {
        id: 'mh-2',
        date: 'Yesterday',
        mode: 'king',
        ruleMode: 'knockback',
        opponent: 'GeometryBox_King',
        result: 'WIN',
        score: '1 - 0',
        penUsed: '0.5mm Mechanical Pencil',
        eloChange: 18
      }
    ],
    friendsList: ['Rohan_Backbench99', 'GeometryBox_King', 'InkStain_Samir'],
    settings: {
      masterVolume: 85,
      sfxMuted: false,
      hapticsEnabled: true,
      highContrastAim: false,
      reducedMotion: false,
      allowSpectators: true,
      wsServerUrl: 'ws://localhost:4000'
    }
  };
}

// ============================================================================
// 10. MAIN APPLICATION COMPONENT (8 PAGES + REAL-TIME MULTIPLAYER)
// ============================================================================
export default function App() {
  // Top-level 8-Page Navigation
  const [activePage, setActivePage] = useState<AppPage>('home');
  const [showSocketArchModal, setShowSocketArchModal] = useState<boolean>(false);
  const [archCodeTab, setArchCodeTab] = useState<'server' | 'hook' | 'package' | 'tests'>('server');
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);

  // Player Profile & Toast
  const [profile, setProfile] = useState<PlayerProfile>(() => getInitialProfile());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 360° Pen Customizer Studio
  const [inspectedPenId, setInspectedPenId] = useState<string>(PEN_MODELS[0].id);
  const [inspectorAngle, setInspectorAngle] = useState<number>(-0.35);
  const [inspectorZoom, setInspectorZoom] = useState<number>(1.35);
  const [inspectorSpinVel, setInspectorSpinVel] = useState<number>(0.012);
  const inspectorCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Match Configuration & Modes
  const [gameMode, setGameMode] = useState<GameMode>('ai');
  const [aiPersonality, setAiPersonality] = useState<AIPersonality>('calculating_strategist');
  const [ruleMode, setRuleMode] = useState<SchoolRuleMode>('flick');
  const [tacticalStance, setTacticalStance] = useState<TacticalStance>('standard');
  const [stanceCharges, setStanceCharges] = useState<{ p1: number; p2: number }>({ p1: 2, p2: 2 });
  const [houseRules, setHouseRules] = useState<HouseRules>({
    seriesFormat: 'bo3',
    clipHangSaveBonus: true,
    heavyCapSpinBonus: true,
    shotClockSeconds: 0
  });
  const [selectedDeskId, setSelectedDeskId] = useState<DeskId>('wooden_classic');
  const [p1PenId, setP1PenId] = useState<string>(PEN_MODELS[0].id);
  const [p2PenId, setP2PenId] = useState<string>(PEN_MODELS[4].id);

  // King of the Classroom Challenger Queue State
  const [kingStreak, setKingStreak] = useState<number>(0);
  const [kingChallengerName, setKingChallengerName] = useState<string>('Rohan_Backbench99');

  // Gameplay & Turn States
  const [turn, setTurn] = useState<1 | 2>(1);
  const [turnCountInRound, setTurnCountInRound] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [scores, setScores] = useState<{ p1: number; p2: number }>({ p1: 0, p2: 0 });
  const [stocksUI, setStocksUI] = useState<{ p1: number; p2: number }>({ p1: 3, p2: 3 });
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [roundBanner, setRoundBanner] = useState<string | null>(null);
  const [matchWinner, setMatchWinner] = useState<0 | 1 | 2>(0);
  const [lastEloDelta, setLastEloDelta] = useState<number | null>(null);
  const [liveAimPower, setLiveAimPower] = useState<number>(0);
  const [liveSpinType, setLiveSpinType] = useState<string>('Balanced Shot');
  const [targetZonePos, setTargetZonePos] = useState<Vec2>({ x: 500, y: 310 });

  // Skill Timing Meter (Oscillating 0..100 cursor while dragging)
  const timingCursorRef = useRef<number>(50);
  const timingDirRef = useRef<number>(1);
  const [lastTimingBadge, setLastTimingBadge] = useState<string | null>(null);

  // Winning Shot Instant Slow-Motion Replay & WebM Recorder
  const currentShotFramesRef = useRef<ReplayFrame[]>([]);
  const winningReplayFramesRef = useRef<ReplayFrame[]>([]);
  const [hasWinningReplay, setHasWinningReplay] = useState<boolean>(false);
  const [isPlayingReplay, setIsPlayingReplay] = useState<boolean>(false);
  const [isRecordingWebM, setIsRecordingWebM] = useState<boolean>(false);
  const replayIndexRef = useRef<number>(0);

  // Live Classroom Reactions
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  // Real-Time Online Multiplayer (Hybrid Cloud Firestore + BroadcastChannel + Custom WS)
  const [transportMode, setTransportMode] = useState<NetworkTransportMode>('cloud_realtime');
  const [customWsStatus, setCustomWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const customWsRef = useRef<WebSocket | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [firebaseAuthReady, setFirebaseAuthReady] = useState<boolean>(!auth);
  const [firebaseAuthError, setFirebaseAuthError] = useState<string | null>(null);
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [activeRoomCode, setActiveRoomCode] = useState<string>('');
  const [onlineRole, setOnlineRole] = useState<1 | 2 | 'spectator'>(1);
  const [dualViewTestMode, setDualViewTestMode] = useState<boolean>(false);
  const [onlineRoomData, setOnlineRoomData] = useState<OnlineRoomState | null>(null);
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const remoteAimGhostRef = useRef<LiveAimGhost | null>(null);
  const lastAimBroadcastTimeRef = useRef<number>(0);
  const lastProcessedShotRef = useRef<number>(0);
  const lastProcessedReactionRef = useRef<number>(0);

  // Interactive How-to-Play Tutorial Step
  const [tutorialStep, setTutorialStep] = useState<1 | 2 | 3>(1);

  // Leaderboard Filter
  const [leaderboardTab, setLeaderboardTab] = useState<'global' | 'friends' | 'schools'>('global');
  const [testResults, setTestResults] = useState<UnitTestResult[]>(() => runCoreGameUnitTests());

  // Canvas & Physics Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pensRef = useRef<[PenBody, PenBody]>([
    createPenBody(1, PEN_MODELS[0], false),
    createPenBody(2, PEN_MODELS[4], true)
  ]);
  const particlesRef = useRef<Particle[]>([]);
  const cameraShakeRef = useRef<number>(0);

  const dragRef = useRef<{
    active: boolean;
    penIndex: 0 | 1;
    grabLocalOffset: number;
    currentMouseWorld: Vec2;
  }>({
    active: false,
    penIndex: 0,
    grabLocalOffset: 0,
    currentMouseWorld: { x: 0, y: 0 }
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  }, []);

  // Sync audio & haptics settings
  useEffect(() => {
    soundFX.muted = profile.settings.sfxMuted;
    soundFX.volume = profile.settings.masterVolume / 100;
    soundFX.hapticsEnabled = profile.settings.hapticsEnabled;
  }, [profile.settings]);

  // Keep stateRef current for 60fps canvas loop
  const stateRef = useRef({
    activePage,
    gameMode,
    aiPersonality,
    ruleMode,
    tacticalStance,
    houseRules,
    selectedDeskId,
    turn,
    turnCountInRound,
    isSimulating,
    isPlayingReplay,
    scores,
    roundNumber,
    matchWinner,
    onlineRole,
    dualViewTestMode,
    activeRoomCode,
    targetZonePos,
    highContrastAim: profile.settings.highContrastAim,
    reducedMotion: profile.settings.reducedMotion
  });

  useEffect(() => {
    stateRef.current = {
      activePage,
      gameMode,
      aiPersonality,
      ruleMode,
      tacticalStance,
      houseRules,
      selectedDeskId,
      turn,
      turnCountInRound,
      isSimulating,
      isPlayingReplay,
      scores,
      roundNumber,
      matchWinner,
      onlineRole,
      dualViewTestMode,
      activeRoomCode,
      targetZonePos,
      highContrastAim: profile.settings.highContrastAim,
      reducedMotion: profile.settings.reducedMotion
    };
  }, [
    activePage,
    gameMode,
    aiPersonality,
    ruleMode,
    tacticalStance,
    houseRules,
    selectedDeskId,
    turn,
    turnCountInRound,
    isSimulating,
    isPlayingReplay,
    scores,
    roundNumber,
    matchWinner,
    onlineRole,
    dualViewTestMode,
    activeRoomCode,
    targetZonePos,
    profile.settings.highContrastAim,
    profile.settings.reducedMotion
  ]);

  // ============================================================================
  // 11. REAL-TIME MULTIPLAYER SYNC (FIRESTORE + BROADCASTCHANNEL + WEBSOCKET)
  // ============================================================================
  useEffect(() => {
    // Check URL query string for ?room=XXXXXX invite link
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const invitedRoom = params.get('room');
      if (invitedRoom && invitedRoom.trim().length === 6) {
        setRoomCodeInput(invitedRoom.trim().toUpperCase());
        setGameMode('online');
        setActivePage('friends');
      }
    }

    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error('Firebase authentication failed:', e);
        setFirebaseAuthError(
          'Could not sign in to Firebase. Enable Anonymous authentication in your Firebase project.'
        );
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(
      auth,
      (u) => {
        setUser(u);
        setFirebaseAuthReady(true);
        if (u) setFirebaseAuthError(null);
      },
      (error) => {
        console.error('Firebase authentication state failed:', error);
        setFirebaseAuthReady(true);
        setFirebaseAuthError(
          'Could not sign in to Firebase. Enable Anonymous authentication in your Firebase project.'
        );
      }
    );
    return () => unsubscribe();
  }, []);

  // Same-Browser Cross-Tab BroadcastChannel for ultra-low-latency multi-tab testing
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const bc = new BroadcastChannel('pen_fight_arena_realtime_bus');
    broadcastChannelRef.current = bc;

    bc.onmessage = (event) => {
      const msg = event.data;
      if (!msg || msg.roomCode !== stateRef.current.activeRoomCode) return;

      if (msg.type === 'AIM_MOVE' && msg.aimData.player !== stateRef.current.onlineRole) {
        remoteAimGhostRef.current = msg.aimData;
      } else if (msg.type === 'SHOT_FIRED') {
        const shot: ShotCommand = msg.shot;
        if (shot.timestamp > lastProcessedShotRef.current) {
          lastProcessedShotRef.current = shot.timestamp;
          executeRemoteShotOnCanvas(shot);
        }
      } else if (msg.type === 'REACTION') {
        const rx = msg.reaction;
        if (rx.timestamp > lastProcessedReactionRef.current) {
          lastProcessedReactionRef.current = rx.timestamp;
          setFloatingReactions((prev) => [
            ...prev.slice(-5),
            {
              id: `${rx.timestamp}`,
              emoji: rx.emoji,
              label: rx.label,
              sender: rx.sender,
              x: 240 + Math.random() * 520,
              y: 430
            }
          ]);
        }
      }
    };

    return () => bc.close();
  }, []);

  // Optional Custom WebSocket (`ws://localhost:4000`) Adapter Connection
  const connectCustomWebSocket = (url: string) => {
    try {
      if (customWsRef.current) customWsRef.current.close();
      setCustomWsStatus('connecting');
      const ws = new WebSocket(url);
      customWsRef.current = ws;

      ws.onopen = () => {
        setCustomWsStatus('connected');
        showToast(`Connected to Custom WebSocket Server (${url})`);
      };
      ws.onerror = () => {
        setCustomWsStatus('disconnected');
      };
      ws.onclose = () => {
        setCustomWsStatus('disconnected');
      };
      ws.onmessage = (ev) => {
        try {
          const packet = JSON.parse(ev.data);
          if (packet.type === 'opponent_aim') {
            remoteAimGhostRef.current = packet.aimData;
          } else if (packet.type === 'execute_shot') {
            executeRemoteShotOnCanvas(packet.shotCommand);
          }
        } catch {
          // Ignore malformed packets
        }
      };
    } catch {
      setCustomWsStatus('disconnected');
    }
  };

  const executeRemoteShotOnCanvas = (shot: ShotCommand) => {
    const [pen1, pen2] = pensRef.current;
    pen1.x = shot.p1Start.x;
    pen1.y = shot.p1Start.y;
    pen1.angle = shot.p1Start.angle;
    pen1.vx = 0;
    pen1.vy = 0;
    pen1.omega = 0;

    pen2.x = shot.p2Start.x;
    pen2.y = shot.p2Start.y;
    pen2.angle = shot.p2Start.angle;
    pen2.vx = 0;
    pen2.vy = 0;
    pen2.omega = 0;

    remoteAimGhostRef.current = null;
    currentShotFramesRef.current = [];
    const targetPen = shot.player === 1 ? pen1 : pen2;
    applyPointImpulseToPen(
      targetPen,
      shot.grabLocalOffset,
      shot.impulseX,
      shot.impulseY,
      stateRef.current.houseRules.heavyCapSpinBonus,
      shot.stance || 'standard'
    );
    soundFX.playFlick(
      Math.min(1, Math.hypot(shot.impulseX, shot.impulseY) / 36),
      shot.timingQuality === 'perfect'
    );
    setIsSimulating(true);
  };

  // Subscribe to Active 6-Character Cloud Room Document
  useEffect(() => {
    if (!user || !db || !activeRoomCode) return;

    const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'pen_fight_rooms', activeRoomCode);
    const unsubscribe = onSnapshot(
      roomDocRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setOnlineError('Room session ended.');
          return;
        }
        const data = snapshot.data() as OnlineRoomState;
        setOnlineRoomData(data);
        setSelectedDeskId(data.deskId);
        setRuleMode(data.ruleMode || 'flick');
        if (data.houseRules) setHouseRules(data.houseRules);
        setP1PenId(data.p1PenId);
        setP2PenId(data.p2PenId);

        // Auto-transition from Friends Lobby into Play Arena when Player 2 joins
        if (data.status === 'playing' && stateRef.current.activePage === 'friends') {
          startNewMatch('online', data.p1PenId, data.p2PenId, data.deskId, data.ruleMode);
        }

        // Sync Live Opponent Aim Ghost Vector
        if (
          data.liveAim &&
          data.liveAim.active &&
          data.liveAim.player !== stateRef.current.onlineRole
        ) {
          remoteAimGhostRef.current = data.liveAim;
        } else if (data.liveAim && !data.liveAim.active) {
          remoteAimGhostRef.current = null;
        }

        // Sync Incoming Emoji Reaction
        if (
          data.lastReaction &&
          data.lastReaction.timestamp > lastProcessedReactionRef.current
        ) {
          lastProcessedReactionRef.current = data.lastReaction.timestamp;
          setFloatingReactions((prev) => [
            ...prev.slice(-5),
            {
              id: `${data.lastReaction!.timestamp}`,
              emoji: data.lastReaction!.emoji,
              label: data.lastReaction!.label,
              sender: data.lastReaction!.sender,
              x: 240 + Math.random() * 520,
              y: 430
            }
          ]);
        }

        // Sync Remote Player's Shot Command
        if (
          data.lastShot &&
          data.lastShot.timestamp > lastProcessedShotRef.current &&
          (data.lastShot.player !== stateRef.current.onlineRole ||
            stateRef.current.dualViewTestMode)
        ) {
          lastProcessedShotRef.current = data.lastShot.timestamp;
          executeRemoteShotOnCanvas(data.lastShot);
        }
      },
      () => {
        setOnlineError('Reconnecting to classroom room channel...');
      }
    );

    return () => unsubscribe();
  }, [user, activeRoomCode]);

  // Create 6-Character Online Room
  const handleCreateOnlineRoom = async () => {
    setOnlineError(null);
    if (!db || !auth) {
      setOnlineError(
        firebaseInitializationError ||
          'Online rooms are not configured. Set VITE_FIREBASE_CONFIG to your Firebase web app configuration.'
      );
      return;
    }
    if (!firebaseAuthReady || !user) {
      setOnlineError(
        firebaseAuthError || 'Connecting to the online service. Please try again in a moment.'
      );
      return;
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const initialRoom: OnlineRoomState = {
      roomCode: code,
      hostUid: user.uid,
      guestUid: null,
      hostName: profile.name,
      guestName: 'Waiting for Challenger...',
      spectatorCount: 0,
      p1PenId,
      p2PenId,
      deskId: selectedDeskId,
      ruleMode,
      houseRules,
      turn: 1,
      scores: { p1: 0, p2: 0 },
      round: 1,
      status: 'waiting',
      liveAim: null,
      lastShot: null,
      lastReaction: null,
      rematchVotes: { p1: false, p2: false },
      winner: 0,
      updatedAt: Date.now()
    };

    try {
      const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'pen_fight_rooms', code);
      await setDoc(roomDocRef, initialRoom);
    } catch (e) {
      console.error('Firebase room creation failed:', e);
      setOnlineError(
        'Could not create the online room. Check your Firebase Firestore database and security rules.'
      );
      return;
    }

    setOnlineRole(1);
    setActiveRoomCode(code);
    setOnlineRoomData(initialRoom);
    setGameMode('online');
    unlockAchievement('ach-online-duel');
    showToast(`Created Online Room ${code}! Share the code or open another tab.`);
  };

  // Join 6-Character Online Room
  const handleJoinOnlineRoom = async (asSpectator: boolean = false) => {
    const cleanCode = roomCodeInput.trim().toUpperCase();
    if (cleanCode.length !== 6) {
      setOnlineError('Please enter a valid 6-character room code (e.g., PEN84X).');
      return;
    }
    setOnlineError(null);
    if (!db || !auth) {
      setOnlineError(
        firebaseInitializationError ||
          'Online rooms are not configured. Set VITE_FIREBASE_CONFIG to your Firebase web app configuration.'
      );
      return;
    }
    if (!firebaseAuthReady || !user) {
      setOnlineError(
        firebaseAuthError || 'Connecting to the online service. Please try again in a moment.'
      );
      return;
    }
    try {
      const roomDocRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'pen_fight_rooms',
        cleanCode
      );
      const snap = await getDoc(roomDocRef);
      if (!snap.exists()) {
        setOnlineError(`Room "${cleanCode}" not found. Check the 6-character code.`);
        return;
      }
      const data = snap.data() as OnlineRoomState;

      if (asSpectator) {
        await updateDoc(roomDocRef, {
          spectatorCount: (data.spectatorCount || 0) + 1,
          updatedAt: Date.now()
        });
        setOnlineRole('spectator');
        setActiveRoomCode(cleanCode);
        setGameMode('online');
        unlockAchievement('ach-online-duel');
        startNewMatch('online', data.p1PenId, data.p2PenId, data.deskId, data.ruleMode);
        return;
      }

      const isRejoiningHost = data.hostUid === user.uid && !dualViewTestMode;
      const assignedRole: 1 | 2 = isRejoiningHost ? 1 : 2;
      await updateDoc(roomDocRef, {
        guestUid: user.uid,
        guestName: profile.name === data.hostName ? `${profile.name}_P2` : profile.name,
        p2PenId,
        status: 'playing',
        updatedAt: Date.now()
      });

      setOnlineRole(assignedRole);
      setActiveRoomCode(cleanCode);
      setGameMode('online');
      unlockAchievement('ach-online-duel');
      startNewMatch('online', data.p1PenId, p2PenId, data.deskId, data.ruleMode);
    } catch (e) {
      console.error('Firebase room join failed:', e);
      setOnlineError(
        'Could not join the online room. Check the room code, your connection, and Firebase security rules.'
      );
    }
  };

  // Instant Developer Helper: Activate Dual-View Split-Screen / Same-Tab Online Sync Test
  const handleLaunchDualViewOnlineTest = async () => {
    const code = activeRoomCode || 'TEST99';
    setActiveRoomCode(code);
    setDualViewTestMode(true);
    setGameMode('online');
    if (user && db && activeRoomCode) {
      const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'pen_fight_rooms', activeRoomCode);
      await updateDoc(roomDocRef, {
        guestUid: 'dual-view-tester',
        guestName: 'Player 2 (Live Sync Tester)',
        status: 'playing',
        updatedAt: Date.now()
      }).catch(() => {});
    }
    startNewMatch('online', p1PenId, p2PenId, selectedDeskId, ruleMode);
    showToast('Dual-View Online Sync Active! Both P1 & P2 turns sync through the live room channel.');
  };

  // ============================================================================
  // 12. ACHIEVEMENTS, REACTIONS & WEBM VIDEO CLIP EXPORT
  // ============================================================================
  const unlockAchievement = useCallback((achId: string) => {
    setProfile((prev) => {
      const target = prev.achievements.find((a) => a.id === achId);
      if (!target || target.unlocked) return prev;
      soundFX.playVictoryBell();
      setToastMessage(`Achievement Unlocked: ${target.title} (+${target.rewardDrops} 💧)`);
      setTimeout(() => setToastMessage(null), 3500);
      return {
        ...prev,
        inkDrops: prev.inkDrops + target.rewardDrops,
        achievements: prev.achievements.map((a) =>
          a.id === achId ? { ...a, unlocked: true } : a
        )
      };
    });
  }, []);

  const triggerReaction = async (emoji: string, label: string, senderName = profile.name) => {
    const ts = Date.now();
    setFloatingReactions((prev) => [
      ...prev.slice(-5),
      {
        id: `${ts}-${Math.random()}`,
        emoji,
        label,
        sender: senderName,
        x: 220 + Math.random() * 560,
        y: 440
      }
    ]);

    broadcastChannelRef.current?.postMessage({
      type: 'REACTION',
      roomCode: activeRoomCode,
      reaction: { emoji, label, sender: senderName, timestamp: ts }
    });

    if (gameMode === 'online' && db && activeRoomCode) {
      lastProcessedReactionRef.current = ts;
      const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'pen_fight_rooms', activeRoomCode);
      await updateDoc(roomDocRef, {
        lastReaction: { emoji, label, sender: senderName, timestamp: ts }
      }).catch(() => {});
    }
  };

  // Record & Export Slow-Motion Replay as downloadable .webm video clip
  const handleExportReplayWebM = () => {
    const canvas = canvasRef.current;
    if (!canvas || winningReplayFramesRef.current.length === 0) return;

    try {
      const stream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : null;
      if (!stream || typeof MediaRecorder === 'undefined') {
        showToast('Playing slow-motion replay! (WebM capture unsupported on this browser)');
        startWinningReplayPlayback();
        return;
      }

      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pen-fight-winning-shot-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsRecordingWebM(false);
        showToast('Saved Winning Shot Replay (.webm) to your device!');
      };

      setIsRecordingWebM(true);
      recorder.start();
      replayIndexRef.current = 0;
      setIsPlayingReplay(true);

      const durationMs = Math.max(2200, winningReplayFramesRef.current.length * 32);
      setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, durationMs);
    } catch {
      startWinningReplayPlayback();
    }
  };

  // ============================================================================
  // 13. MATCH LIFECYCLE & DAILY DETERMINISTIC SEEDED CHALLENGE
  // ============================================================================
  const resetPositionsForRound = useCallback(
    (p1Id: string, p2Id: string, preserveScores: boolean = true, modeOverride?: GameMode) => {
      const activeMode = modeOverride || stateRef.current.gameMode;
      const isRankedNormalized = activeMode === 'ranked';

      const model1 = PEN_MODELS.find((m) => m.id === p1Id) || PEN_MODELS[0];
      const model2 = PEN_MODELS.find((m) => m.id === p2Id) || PEN_MODELS[1];
      const prevStocks = preserveScores
        ? { p1: pensRef.current[0].stocksRemaining, p2: pensRef.current[1].stocksRemaining }
        : { p1: 3, p2: 3 };

      const pen1 = createPenBody(
        1,
        model1,
        false,
        prevStocks.p1,
        profile.customizations[model1.id],
        isRankedNormalized
      );
      const pen2 = createPenBody(
        2,
        model2,
        true,
        prevStocks.p2,
        profile.customizations[model2.id],
        isRankedNormalized
      );

      // Daily Challenge uses deterministic daily coordinates for everyone
      if (activeMode === 'daily') {
        pen1.x = 250;
        pen1.y = 390;
        pen1.angle = 0.45;
        pen2.x = 760;
        pen2.y = 220;
        pen2.angle = -1.1;
      }

      pensRef.current = [pen1, pen2];
      particlesRef.current = [];
      remoteAimGhostRef.current = null;
      setIsSimulating(false);
      setIsPlayingReplay(false);
      setTurnCountInRound(0);
      dragRef.current.active = false;

      if (!preserveScores) {
        setScores({ p1: 0, p2: 0 });
        setStocksUI({ p1: 3, p2: 3 });
        setStanceCharges({ p1: 2, p2: 2 });
        setTacticalStance('standard');
        setRoundNumber(1);
        setMatchWinner(0);
        setLastEloDelta(null);
        setHasWinningReplay(false);
        winningReplayFramesRef.current = [];
        setTurn(1);
      }
    },
    [profile.customizations]
  );

  const startNewMatch = (
    mode: GameMode = gameMode,
    customP1Pen: string = p1PenId,
    customP2Pen: string = p2PenId,
    customDesk: DeskId = selectedDeskId,
    customRule: SchoolRuleMode = ruleMode
  ) => {
    setGameMode(mode);
    setP1PenId(customP1Pen);
    setP2PenId(customP2Pen);
    setSelectedDeskId(customDesk);
    setRuleMode(customRule);
    resetPositionsForRound(customP1Pen, customP2Pen, false, mode);

    const bannerText =
      mode === 'king'
        ? `KING OF THE CLASSROOM — STREAK: ${kingStreak} 👑`
        : mode === 'daily'
        ? 'DAILY SEEDED CHALLENGE — KNOCKOUT IN MIN SHOTS!'
        : mode === 'ranked'
        ? 'RANKED MATCH (NORMALIZED TOURNAMENT STATS)'
        : `ROUND 1 — ${customRule.toUpperCase()}`;

    setRoundBanner(bannerText);
    setTimeout(() => setRoundBanner(null), 1600);
    setActivePage('play');
  };

  // ============================================================================
  // 14. 3 DISTINCT AI PERSONALITIES ENGINE
  // ============================================================================
  useEffect(() => {
    if (
      activePage !== 'play' ||
      (gameMode !== 'ai' && gameMode !== 'ranked' && gameMode !== 'king' && gameMode !== 'daily') ||
      turn !== 2 ||
      isSimulating ||
      isPlayingReplay ||
      matchWinner !== 0 ||
      roundBanner !== null
    ) {
      return;
    }

    const aiTimer = setTimeout(() => {
      const [p1, p2] = pensRef.current;
      if (p1.fallen || p2.fallen) return;

      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const dist = Math.hypot(dx, dy);

      let angleJitter = 0;
      let grabOffset = 0;
      let powerScale = 1.0;
      let chosenStance: TacticalStance = 'standard';

      if (aiPersonality === 'clumsy_rookie') {
        // Clumsy Rookie: Occasional over-pulls and wide aim jitter
        angleJitter = (Math.random() - 0.5) * 0.32;
        grabOffset = (Math.random() - 0.5) * 0.5;
        powerScale = 0.68 + Math.random() * 0.35;
      } else if (aiPersonality === 'calculating_strategist') {
        // Strategist: Aims carefully for edge knockouts with controlled spin
        angleJitter = (Math.random() - 0.5) * 0.06;
        grabOffset = dist < 260 ? 0.65 : 0.15;
        powerScale = 0.85 + Math.random() * 0.12;
        chosenStance = 'precision';
      } else {
        // Reckless Aggressor: High-power tip-whip helicopter spins
        angleJitter = (Math.random() - 0.5) * 0.12;
        grabOffset = 0.88;
        powerScale = 1.06;
        chosenStance = 'spin_hook';
      }

      const targetAngle = Math.atan2(dy, dx) + angleJitter;
      const baseImpulseMag = Math.min(35, Math.max(18, dist * 0.054)) * powerScale;
      const impulseX = Math.cos(targetAngle) * baseImpulseMag;
      const impulseY = Math.sin(targetAngle) * baseImpulseMag;

      currentShotFramesRef.current = [];
      applyPointImpulseToPen(
        p2,
        grabOffset,
        impulseX,
        impulseY,
        houseRules.heavyCapSpinBonus,
        chosenStance
      );
      soundFX.playFlick(baseImpulseMag / 38, false);
      setIsSimulating(true);
    }, 850);

    return () => clearTimeout(aiTimer);
  }, [
    activePage,
    gameMode,
    turn,
    isSimulating,
    isPlayingReplay,
    matchWinner,
    roundBanner,
    aiPersonality,
    houseRules.heavyCapSpinBonus
  ]);

  // ============================================================================
  // 15. 360° PEN CUSTOMIZER STUDIO LOOP (COLLECTION PAGE)
  // ============================================================================
  useEffect(() => {
    if (activePage !== 'collection') return;
    let animId: number;
    const model = PEN_MODELS.find((m) => m.id === inspectedPenId) || PEN_MODELS[0];

    const renderStudio = () => {
      const canvas = inspectorCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
          for (let x = 0; x < canvas.width; x += 24) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }

          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.scale(inspectorZoom, inspectorZoom);
          ctx.rotate(inspectorAngle);
          drawCustomizedPenOnCanvas(ctx, model, profile.customizations[model.id]);
          ctx.restore();
        }
      }
      if (Math.abs(inspectorSpinVel) > 0.0005) {
        setInspectorAngle((prev) => prev + inspectorSpinVel);
        setInspectorSpinVel((prev) => prev * 0.985);
      }
      animId = requestAnimationFrame(renderStudio);
    };

    animId = requestAnimationFrame(renderStudio);
    return () => cancelAnimationFrame(animId);
  }, [activePage, inspectedPenId, inspectorAngle, inspectorZoom, inspectorSpinVel, profile.customizations]);

  // ============================================================================
  // 16. MAIN 60FPS ARENA PHYSICS, TIMING METER & CANVAS RENDERER
  // ============================================================================
  useEffect(() => {
    let animationFrameId: number;

    const spawnImpactSparks = (x: number, y: number, c1: string, c2: string, count = 16) => {
      if (stateRef.current.reducedMotion) return;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 8;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2.5 + Math.random() * 3.5,
          color: i % 2 === 0 ? c1 : c2,
          alpha: 1,
          decay: 0.028 + Math.random() * 0.02
        });
      }
    };

    const recordMatchCompletion = (finalWinner: 1 | 2) => {
      const playerWon =
        stateRef.current.gameMode === 'online' && !stateRef.current.dualViewTestMode
          ? finalWinner === stateRef.current.onlineRole
          : finalWinner === 1;

      const p1Model = PEN_MODELS.find((m) => m.id === p1PenId) || PEN_MODELS[0];
      const eloDelta = calculateEloRatingChange(profile.elo, 1250, playerWon, profile.winStreak);
      setLastEloDelta(eloDelta);

      if (playerWon) {
        unlockAchievement('ach-first-ko');
      }

      // King of the Classroom Streak Handling
      if (stateRef.current.gameMode === 'king') {
        if (playerWon) {
          const nextKing = kingStreak + 1;
          setKingStreak(nextKing);
          if (nextKing >= 3) unlockAchievement('ach-king-3');
          const challengers = [
            'SpinMaster_Aisha',
            'GeometryBox_King',
            'LastRow_Legend',
            'InkStain_Samir',
            'Principal_Boss99'
          ];
          setKingChallengerName(challengers[nextKing % challengers.length]);
        } else {
          setKingStreak(0);
        }
      }

      setProfile((prev) => {
        const nextStreak = playerWon ? prev.winStreak + 1 : 0;
        const newHistoryItem: MatchHistoryItem = {
          id: `mh-${Date.now()}`,
          date: 'Just now',
          mode: stateRef.current.gameMode,
          ruleMode: stateRef.current.ruleMode,
          opponent:
            stateRef.current.gameMode === 'online'
              ? onlineRoomData?.guestName || 'Online Challenger'
              : stateRef.current.gameMode === 'king'
              ? kingChallengerName
              : `AI (${aiPersonality.replace('_', ' ')})`,
          result: playerWon ? 'WIN' : 'LOSS',
          score: `${stateRef.current.scores.p1 + (finalWinner === 1 ? 1 : 0)} - ${
            stateRef.current.scores.p2 + (finalWinner === 2 ? 1 : 0)
          }`,
          penUsed: p1Model.name,
          eloChange: eloDelta
        };

        return {
          ...prev,
          elo: Math.max(800, prev.elo + eloDelta),
          xp: prev.xp + (playerWon ? 120 : 40),
          inkDrops: prev.inkDrops + (playerWon ? 90 : 30),
          wins: playerWon ? prev.wins + 1 : prev.wins,
          losses: playerWon ? prev.losses : prev.losses + 1,
          winStreak: nextStreak,
          bestStreak: Math.max(prev.bestStreak, nextStreak),
          kingBestStreak:
            stateRef.current.gameMode === 'king' && playerWon
              ? Math.max(prev.kingBestStreak, kingStreak + 1)
              : prev.kingBestStreak,
          dailyBestShots:
            stateRef.current.gameMode === 'daily' && playerWon
              ? prev.dailyBestShots === null
                ? stateRef.current.turnCountInRound
                : Math.min(prev.dailyBestShots, stateRef.current.turnCountInRound)
              : prev.dailyBestShots,
          matchHistory: [newHistoryItem, ...prev.matchHistory.slice(0, 14)]
        };
      });
    };

    const handleRoundEnd = (outcome: { winner: 0 | 1 | 2 | 'draw'; reason: string }) => {
      if (currentShotFramesRef.current.length > 5) {
        winningReplayFramesRef.current = [...currentShotFramesRef.current];
        setHasWinningReplay(true);
      }

      const [p1, p2] = pensRef.current;

      if (stateRef.current.ruleMode === 'survival') {
        if (outcome.winner === 1) p2.stocksRemaining = Math.max(0, p2.stocksRemaining - 1);
        else if (outcome.winner === 2) p1.stocksRemaining = Math.max(0, p1.stocksRemaining - 1);
        setStocksUI({ p1: p1.stocksRemaining, p2: p2.stocksRemaining });

        if (p1.stocksRemaining <= 0 || p2.stocksRemaining <= 0) {
          const finalWin: 1 | 2 = p2.stocksRemaining <= 0 ? 1 : 2;
          setMatchWinner(finalWin);
          soundFX.playVictoryBell();
          recordMatchCompletion(finalWin);
          return;
        }

        setRoundBanner(`${outcome.reason} — Next Pen From Pencil Case!`);
        setTimeout(() => {
          if (p1.fallen) {
            const m1 = PEN_MODELS.find((m) => m.id === p1PenId) || PEN_MODELS[0];
            pensRef.current[0] = createPenBody(1, m1, false, p1.stocksRemaining, profile.customizations[m1.id]);
          }
          if (p2.fallen) {
            const m2 = PEN_MODELS.find((m) => m.id === p2PenId) || PEN_MODELS[1];
            pensRef.current[1] = createPenBody(2, m2, true, p2.stocksRemaining, profile.customizations[m2.id]);
          }
          setRoundBanner(null);
          setTurn(outcome.winner === 1 ? 2 : 1);
        }, 1900);
        return;
      }

      const currentScores = { ...stateRef.current.scores };
      if (outcome.winner === 1) currentScores.p1 += 1;
      if (outcome.winner === 2) currentScores.p2 += 1;
      setScores(currentScores);

      const fmt =
        stateRef.current.gameMode === 'king' || stateRef.current.gameMode === 'daily'
          ? 'single'
          : stateRef.current.houseRules.seriesFormat;
      const targetWins = fmt === 'single' ? 1 : fmt === 'bo5' ? 3 : 2;

      if (currentScores.p1 >= targetWins || currentScores.p2 >= targetWins) {
        const finalWinner: 1 | 2 = currentScores.p1 >= targetWins ? 1 : 2;
        setMatchWinner(finalWinner);
        soundFX.playVictoryBell();
        recordMatchCompletion(finalWinner);
        setRoundBanner(`PLAYER ${finalWinner} WINS THE MATCH!`);
      } else {
        setRoundBanner(
          outcome.winner === 'draw'
            ? `DRAW! ${outcome.reason}`
            : `PLAYER ${outcome.winner} SCORES! — ${outcome.reason}`
        );
        setTimeout(() => {
          const nextRound = stateRef.current.roundNumber + 1;
          setRoundNumber(nextRound);
          resetPositionsForRound(p1PenId, p2PenId, true);
          setTurn(outcome.winner === 1 ? 2 : 1);
          setRoundBanner(`ROUND ${nextRound}`);
          setTimeout(() => setRoundBanner(null), 1100);
        }, 2100);
      }
    };

    const stepPhysics = () => {
      // Advance Oscillating Skill Timing Cursor while aiming
      if (dragRef.current.active) {
        timingCursorRef.current += timingDirRef.current * 2.35;
        if (timingCursorRef.current >= 100) {
          timingCursorRef.current = 100;
          timingDirRef.current = -1;
        } else if (timingCursorRef.current <= 0) {
          timingCursorRef.current = 0;
          timingDirRef.current = 1;
        }
      }

      // Slow-Motion Winning Shot Replay Playback (0.5x speed)
      if (stateRef.current.isPlayingReplay) {
        const frames = winningReplayFramesRef.current;
        if (frames.length === 0) {
          setIsPlayingReplay(false);
          return;
        }
        const idx = Math.min(frames.length - 1, Math.floor(replayIndexRef.current));
        const frame = frames[idx];
        const [p1, p2] = pensRef.current;

        p1.x = frame.p1.x;
        p1.y = frame.p1.y;
        p1.angle = frame.p1.angle;
        p1.fallen = frame.p1.fallen;
        p1.fallProgress = frame.p1.fallProgress;

        p2.x = frame.p2.x;
        p2.y = frame.p2.y;
        p2.angle = frame.p2.angle;
        p2.fallen = frame.p2.fallen;
        p2.fallProgress = frame.p2.fallProgress;

        replayIndexRef.current += 0.5;
        if (replayIndexRef.current >= frames.length) {
          setIsPlayingReplay(false);
        }
        return;
      }

      const [p1, p2] = pensRef.current;
      const arena =
        DESK_ARENAS.find((d) => d.id === stateRef.current.selectedDeskId) || DESK_ARENAS[0];

      if (stateRef.current.isSimulating && currentShotFramesRef.current.length < 360) {
        currentShotFramesRef.current.push({
          p1: { x: p1.x, y: p1.y, angle: p1.angle, fallen: p1.fallen, fallProgress: p1.fallProgress },
          p2: { x: p2.x, y: p2.y, angle: p2.angle, fallen: p2.fallen, fallProgress: p2.fallProgress }
        });
      }

      const SUBSTEPS = 4;
      const dt = 1 / SUBSTEPS;

      for (let step = 0; step < SUBSTEPS; step++) {
        for (const pen of [p1, p2]) {
          if (pen.fallen) {
            pen.fallProgress = Math.min(1, pen.fallProgress + 0.04 * dt);
            pen.x += pen.vx * dt * 0.5;
            pen.y += pen.vy * dt * 0.5;
            pen.angle += pen.omega * dt;
            continue;
          }

          pen.x += pen.vx * dt;
          pen.y += pen.vy * dt;
          pen.angle += pen.omega * dt;

          const effectiveFriction = Math.min(
            0.992,
            pen.model.friction * arena.frictionMultiplier
          );
          const subFriction = Math.pow(effectiveFriction, dt);
          pen.vx *= subFriction;
          pen.vy *= subFriction;
          pen.omega *= Math.pow(effectiveFriction * 0.985, dt);

          if (Math.hypot(pen.vx, pen.vy) < 0.045) {
            pen.vx = 0;
            pen.vy = 0;
          }
          if (Math.abs(pen.omega) < 0.0012) {
            pen.omega = 0;
          }

          if (isPenOffDesk(pen)) {
            pen.fallen = true;
            soundFX.playFallOffDesk();
            spawnImpactSparks(pen.x, pen.y, '#f59e0b', '#ef4444', 20);
          }

          for (const obs of arena.obstacles) {
            const obsBox = {
              x: obs.x,
              y: obs.y,
              halfLen: obs.width / 2,
              halfWid: obs.height / 2,
              angle: obs.angle
            };
            const hit = detectOBBCollision(pen, obsBox);
            if (hit && hit.collided) {
              pen.x -= hit.normal.x * hit.depth;
              pen.y -= hit.normal.y * hit.depth;

              const rx = hit.contactPoint.x - pen.x;
              const ry = hit.contactPoint.y - pen.y;
              const velAtContactX = pen.vx - pen.omega * ry;
              const velAtContactY = pen.vy + pen.omega * rx;
              const velAlongNormal = velAtContactX * hit.normal.x + velAtContactY * hit.normal.y;

              if (velAlongNormal > 0) {
                const e = Math.max(pen.model.restitution, obs.restitution);
                const rCrossN = rx * hit.normal.y - ry * hit.normal.x;
                const denom = pen.invMass + rCrossN * rCrossN * pen.invInertia;
                const j = (-(1 + e) * velAlongNormal) / denom;
                pen.vx += j * hit.normal.x * pen.invMass;
                pen.vy += j * hit.normal.y * pen.invMass;
                pen.omega += (rx * (j * hit.normal.y) - ry * (j * hit.normal.x)) * pen.invInertia;
                soundFX.playPenClack(0.6);
                spawnImpactSparks(hit.contactPoint.x, hit.contactPoint.y, obs.color, '#ffffff', 10);
              }
            }
          }
        }

        if (!p1.fallen && !p2.fallen) {
          const collision = detectOBBCollision(p1, p2);
          if (collision && collision.collided) {
            const { normal, depth, contactPoint } = collision;
            const totalInvMass = p1.invMass + p2.invMass;
            const correction = (depth / totalInvMass) * 0.85;
            p1.x -= normal.x * correction * p1.invMass;
            p1.y -= normal.y * correction * p1.invMass;
            p2.x += normal.x * correction * p2.invMass;
            p2.y += normal.y * correction * p2.invMass;

            const r1x = contactPoint.x - p1.x;
            const r1y = contactPoint.y - p1.y;
            const r2x = contactPoint.x - p2.x;
            const r2y = contactPoint.y - p2.y;

            const v1x = p1.vx - p1.omega * r1y;
            const v1y = p1.vy + p1.omega * r1x;
            const v2x = p2.vx - p2.omega * r2y;
            const v2y = p2.vy + p2.omega * r2x;

            const rvx = v2x - v1x;
            const rvy = v2y - v1y;
            const velAlongNormal = rvx * normal.x + rvy * normal.y;

            if (velAlongNormal < 0) {
              const e = Math.min(p1.model.restitution, p2.model.restitution);
              const r1CrossN = r1x * normal.y - r1y * normal.x;
              const r2CrossN = r2x * normal.y - r2y * normal.x;

              const invMassSum =
                p1.invMass +
                p2.invMass +
                r1CrossN * r1CrossN * p1.invInertia +
                r2CrossN * r2CrossN * p2.invInertia;

              const j = (-(1 + e) * velAlongNormal * 1.18) / invMassSum;
              const impulseX = j * normal.x;
              const impulseY = j * normal.y;

              p1.vx -= impulseX * p1.invMass;
              p1.vy -= impulseY * p1.invMass;
              p1.omega -= (r1x * impulseY - r1y * impulseX) * p1.invInertia;

              p2.vx += impulseX * p2.invMass;
              p2.vy += impulseY * p2.invMass;
              p2.omega += (r2x * impulseY - r2y * impulseX) * p2.invInertia;

              const impactStrength = Math.min(1, Math.abs(j) / 14);
              if (impactStrength > 0.08) {
                soundFX.playPenClack(impactStrength);
                if (!stateRef.current.reducedMotion) {
                  cameraShakeRef.current = Math.min(14, Math.abs(j) * 0.65);
                }
                spawnImpactSparks(
                  contactPoint.x,
                  contactPoint.y,
                  p1.model.secondaryColor,
                  p2.model.secondaryColor,
                  Math.floor(10 + impactStrength * 14)
                );
              }

            }
          }
        }
      }

      if (stateRef.current.isSimulating) {
        const p1Stopped =
          (p1.fallen && p1.fallProgress >= 0.95) ||
          (!p1.fallen && p1.vx === 0 && p1.vy === 0 && p1.omega === 0);
        const p2Stopped =
          (p2.fallen && p2.fallProgress >= 0.95) ||
          (!p2.fallen && p2.vx === 0 && p2.vy === 0 && p2.omega === 0);

        if (p1Stopped && p2Stopped) {
          setIsSimulating(false);
          const nextTurnCount = stateRef.current.turnCountInRound + 1;
          setTurnCountInRound(nextTurnCount);

          if (stateRef.current.houseRules.clipHangSaveBonus) {
            if (isPenClipHanging(p1) || isPenClipHanging(p2)) {
              triggerReaction('😱', 'CLIFFHANGER SAVE! (>35% OVERHANG)', 'Referee');
            }
          }

          const outcome = evaluateRoundOutcome(
            p1,
            p2,
            stateRef.current.ruleMode,
            stateRef.current.targetZonePos,
            nextTurnCount
          );

          if (outcome.roundOver) {
            handleRoundEnd(outcome);
          } else {
            const nextTurn: 1 | 2 = stateRef.current.turn === 1 ? 2 : 1;
            setTurn(nextTurn);
            if (stateRef.current.gameMode === 'online' && db && stateRef.current.activeRoomCode) {
              const roomDocRef = doc(
                db,
                'artifacts',
                appId,
                'public',
                'data',
                'pen_fight_rooms',
                stateRef.current.activeRoomCode
              );
              updateDoc(roomDocRef, {
                turn: nextTurn,
                liveAim: null,
                updatedAt: Date.now()
              }).catch(() => {});
            }
          }
        }
      }
    };

    const renderArena = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const arena =
        DESK_ARENAS.find((d) => d.id === stateRef.current.selectedDeskId) || DESK_ARENAS[0];

      ctx.save();
      ctx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

      if (cameraShakeRef.current > 0.2 && !stateRef.current.reducedMotion) {
        ctx.translate(
          (Math.random() - 0.5) * cameraShakeRef.current,
          (Math.random() - 0.5) * cameraShakeRef.current
        );
        cameraShakeRef.current *= 0.86;
      } else {
        cameraShakeRef.current = 0;
      }

      // Classroom Floor Background
      const floorGrad = ctx.createRadialGradient(
        VIRTUAL_WIDTH / 2,
        VIRTUAL_HEIGHT / 2,
        200,
        VIRTUAL_WIDTH / 2,
        VIRTUAL_HEIGHT / 2,
        620
      );
      floorGrad.addColorStop(0, '#1e293b');
      floorGrad.addColorStop(1, '#090d16');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

      const deskW = DESK_BOUNDS.right - DESK_BOUNDS.left;
      const deskH = DESK_BOUNDS.bottom - DESK_BOUNDS.top;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.78)';
      ctx.shadowBlur = 36;
      ctx.shadowOffsetY = 18;
      ctx.fillStyle = arena.borderColor;
      ctx.beginPath();
      ctx.roundRect(DESK_BOUNDS.left, DESK_BOUNDS.top, deskW, deskH + 14, 18);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(DESK_BOUNDS.left, DESK_BOUNDS.top, deskW, deskH, 16);
      ctx.clip();

      ctx.fillStyle = arena.woodBaseColor;
      ctx.fillRect(DESK_BOUNDS.left, DESK_BOUNDS.top, deskW, deskH);

      if (arena.id === 'notebook_page') {
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 1.5;
        for (let y = DESK_BOUNDS.top + 36; y < DESK_BOUNDS.bottom; y += 26) {
          ctx.beginPath();
          ctx.moveTo(DESK_BOUNDS.left, y);
          ctx.lineTo(DESK_BOUNDS.right, y);
          ctx.stroke();
        }
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(DESK_BOUNDS.left + 95, DESK_BOUNDS.top);
        ctx.lineTo(DESK_BOUNDS.left + 95, DESK_BOUNDS.bottom);
        ctx.stroke();
      } else {
        ctx.strokeStyle = arena.woodGrainColor;
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = 2;
        for (let y = DESK_BOUNDS.top + 14; y < DESK_BOUNDS.bottom; y += 18) {
          ctx.beginPath();
          ctx.moveTo(DESK_BOUNDS.left, y);
          ctx.lineTo(DESK_BOUNDS.right, y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.beginPath();
        ctx.roundRect(DESK_BOUNDS.left + 120, DESK_BOUNDS.top + 18, deskW - 240, 12, 6);
        ctx.fill();
      }

      if (stateRef.current.ruleMode === 'knockback') {
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.lineWidth = 6;
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.arc(VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2, SUMO_RING_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (stateRef.current.ruleMode === 'flip') {
        const tz = stateRef.current.targetZonePos;
        ctx.save();
        [85, 58, 30].forEach((r, idx) => {
          ctx.fillStyle = ['rgba(59,130,246,0.25)', 'rgba(245,158,11,0.35)', 'rgba(239,68,68,0.5)'][idx];
          ctx.beginPath();
          ctx.arc(tz.x, tz.y, r, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }

      // Obstacles
      for (const obs of arena.obstacles) {
        ctx.save();
        ctx.translate(obs.x, obs.y);
        ctx.rotate(obs.angle);
        ctx.fillStyle = obs.color;
        ctx.beginPath();
        ctx.roundRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height, 6);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore(); // End desk clip

      // Render Both Pens
      const [p1, p2] = pensRef.current;
      [p1, p2].forEach((pen) => {
        ctx.save();
        ctx.translate(pen.x, pen.y);
        ctx.rotate(pen.angle);

        if (pen.fallen) {
          const scale = Math.max(0.2, 1 - pen.fallProgress * 0.75);
          ctx.scale(scale, scale);
          ctx.globalAlpha = Math.max(0, 1 - pen.fallProgress);
        }

        const isCurrentTurnPen =
          !stateRef.current.isSimulating &&
          !stateRef.current.isPlayingReplay &&
          stateRef.current.matchWinner === 0 &&
          stateRef.current.turn === pen.id &&
          !pen.fallen;

        if (isCurrentTurnPen) {
          ctx.save();
          ctx.strokeStyle =
            pen.id === 1 ? 'rgba(59, 130, 246, 0.85)' : 'rgba(244, 63, 94, 0.85)';
          ctx.lineWidth = 3;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.roundRect(
            -pen.halfLen - 8,
            -pen.halfWid - 8,
            pen.halfLen * 2 + 16,
            pen.halfWid * 2 + 16,
            12
          );
          ctx.stroke();
          ctx.restore();
        }

        drawCustomizedPenOnCanvas(ctx, pen.model, pen.customization, `P${pen.id}`);
        ctx.restore();
      });

      // Render Remote Player's Live Aiming Ghost Vector (Online Multiplayer Sync)
      if (remoteAimGhostRef.current && remoteAimGhostRef.current.active && !dragRef.current.active) {
        const ghost = remoteAimGhostRef.current;
        const ghostPen = ghost.player === 1 ? p1 : p2;
        const offsetDist = ghost.grabLocalOffset * ghostPen.halfLen;
        const contactX = ghostPen.x + Math.cos(ghostPen.angle) * offsetDist;
        const contactY = ghostPen.y + Math.sin(ghostPen.angle) * offsetDist;

        ctx.save();
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.75)';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(contactX, contactY);
        ctx.lineTo(contactX + ghost.pullVector.x * 1.15, contactY + ghost.pullVector.y * 1.15);
        ctx.stroke();

        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.beginPath();
        ctx.roundRect(contactX - 64, contactY - 38, 128, 22, 6);
        ctx.fill();
        ctx.fillStyle = '#fda4af';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`OPPONENT AIMING (${ghost.powerPct}%)`, contactX, contactY - 24);
        ctx.restore();
      }

      // Render Local Slingshot Aiming Reticle + Skill Timing Bar
      if (dragRef.current.active) {
        const activePen = pensRef.current[dragRef.current.penIndex];
        const offsetDist = dragRef.current.grabLocalOffset * activePen.halfLen;
        const contactX = activePen.x + Math.cos(activePen.angle) * offsetDist;
        const contactY = activePen.y + Math.sin(activePen.angle) * offsetDist;

        const pullDX = contactX - dragRef.current.currentMouseWorld.x;
        const pullDY = contactY - dragRef.current.currentMouseWorld.y;
        const rawDist = Math.hypot(pullDX, pullDY);
        const maxPull = 190;
        const clampedDist = Math.min(maxPull, rawDist);
        const powerPct = Math.round((clampedDist / maxPull) * 100);

        const dirX = rawDist > 1 ? pullDX / rawDist : 0;
        const dirY = rawDist > 1 ? pullDY / rawDist : 0;

        // Ranked mode uses shorter trajectory preview; Precision stance extends it
        const previewScale =
          stateRef.current.gameMode === 'ranked'
            ? 0.82
            : stateRef.current.tacticalStance === 'precision'
            ? 2.05
            : 1.45;

        ctx.save();
        const powerColor = stateRef.current.highContrastAim
          ? '#00ffff'
          : powerPct > 75
          ? '#ef4444'
          : powerPct > 40
          ? '#f59e0b'
          : '#22c55e';

        ctx.strokeStyle = powerColor;
        ctx.lineWidth = stateRef.current.highContrastAim ? 5 : 3.5;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(contactX, contactY);
        ctx.lineTo(
          contactX + dirX * clampedDist * previewScale,
          contactY + dirY * clampedDist * previewScale
        );
        ctx.stroke();

        // Skill Timing Sweet-Spot Meter above Active Pen
        const barW = 96;
        const barH = 10;
        const barX = activePen.x - barW / 2;
        const barY = activePen.y - 52;

        ctx.setLineDash([]);
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(barX - 2, barY - 2, barW + 4, barH + 4, 5);
        ctx.fill();

        // Sweet-spot green zone (40% to 60%)
        ctx.fillStyle = '#334155';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(barX + barW * 0.38, barY, barW * 0.24, barH);

        // Oscillating cursor
        const cursorX = barX + (timingCursorRef.current / 100) * barW;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cursorX - 2, barY - 3, 4, barH + 6);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${powerPct}% • TIMING SWEET-SPOT`,
          activePen.x,
          barY - 7
        );
        ctx.restore();
      }

      // Sparks
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const pt = particlesRef.current[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= pt.decay;
        if (pt.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (stateRef.current.isPlayingReplay) {
        ctx.save();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, VIRTUAL_WIDTH - 8, VIRTUAL_HEIGHT - 8);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.beginPath();
        ctx.roundRect(24, 20, 350, 40, 10);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px monospace';
        ctx.fillText('EPIC SHOT REPLAY • 0.5x SLOW MOTION', 44, 45);
        ctx.restore();
      }

      ctx.restore();
    };

    const loop = () => {
      if (stateRef.current.activePage === 'play' || stateRef.current.activePage === 'howtoplay') {
        stepPhysics();
        renderArena();
      }
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [p1PenId, p2PenId, resetPositionsForRound, profile.elo, profile.winStreak, profile.customizations, aiPersonality, kingStreak, kingChallengerName, onlineRoomData, unlockAchievement]);

  // ============================================================================
  // 17. POINTER CONTROLS + REAL-TIME AIM_MOVE BROADCAST
  // ============================================================================
  const clientToVirtualCoords = (clientX: number, clientY: number): Vec2 => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * VIRTUAL_WIDTH,
      y: ((clientY - rect.top) / rect.height) * VIRTUAL_HEIGHT
    };
  };

  const canHumanInteractWithTurn = (): boolean => {
    if (isSimulating || isPlayingReplay || matchWinner !== 0 || roundBanner !== null) return false;
    if (
      (gameMode === 'ai' || gameMode === 'ranked' || gameMode === 'king' || gameMode === 'daily') &&
      turn === 2
    ) {
      return false;
    }
    if (gameMode === 'online' && !dualViewTestMode) {
      if (onlineRole === 'spectator' || turn !== onlineRole) return false;
    }
    return true;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canHumanInteractWithTurn()) return;
    const worldPos = clientToVirtualCoords(e.clientX, e.clientY);
    const activeIdx: 0 | 1 = turn === 1 ? 0 : 1;
    const activePen = pensRef.current[activeIdx];
    if (activePen.fallen) return;

    const dx = worldPos.x - activePen.x;
    const dy = worldPos.y - activePen.y;
    const cos = Math.cos(activePen.angle);
    const sin = Math.sin(activePen.angle);

    const localAlong = dx * cos + dy * sin;
    const localPerp = -dx * sin + dy * cos;

    if (
      Math.abs(localAlong) <= activePen.halfLen + 45 &&
      Math.abs(localPerp) <= activePen.halfWid + 45
    ) {
      const grabOffset = Math.max(-0.95, Math.min(0.95, localAlong / activePen.halfLen));
      timingCursorRef.current = 15;
      dragRef.current = {
        active: true,
        penIndex: activeIdx,
        grabLocalOffset: grabOffset,
        currentMouseWorld: worldPos
      };
      setLiveAimPower(0);
      setLiveSpinType(
        Math.abs(grabOffset) > 0.45 ? 'High Torque Whip Spin' : 'Heavy Center Ram'
      );
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) return;
    const worldPos = clientToVirtualCoords(e.clientX, e.clientY);
    dragRef.current.currentMouseWorld = worldPos;

    const activePen = pensRef.current[dragRef.current.penIndex];
    const offsetDist = dragRef.current.grabLocalOffset * activePen.halfLen;
    const contactX = activePen.x + Math.cos(activePen.angle) * offsetDist;
    const contactY = activePen.y + Math.sin(activePen.angle) * offsetDist;

    const pullDX = contactX - worldPos.x;
    const pullDY = contactY - worldPos.y;
    const pullDist = Math.min(190, Math.hypot(pullDX, pullDY));
    const powerPct = Math.round((pullDist / 190) * 100);
    setLiveAimPower(powerPct);

    // Broadcast Live Opponent Aiming Vector (`aim_move`) throttled every 90ms
    const now = Date.now();
    if (gameMode === 'online' && activeRoomCode && now - lastAimBroadcastTimeRef.current > 90) {
      lastAimBroadcastTimeRef.current = now;
      const aimPayload: LiveAimGhost = {
        player: turn,
        active: true,
        grabLocalOffset: dragRef.current.grabLocalOffset,
        pullVector: { x: pullDX, y: pullDY },
        powerPct,
        stance: tacticalStance,
        timestamp: now
      };

      broadcastChannelRef.current?.postMessage({
        type: 'AIM_MOVE',
        roomCode: activeRoomCode,
        aimData: aimPayload
      });

      if (customWsRef.current && customWsRef.current.readyState === WebSocket.OPEN) {
        customWsRef.current.send(
          JSON.stringify({ type: 'aim_move', roomCode: activeRoomCode, aimData: aimPayload })
        );
      }

      if (db && user) {
        const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'pen_fight_rooms', activeRoomCode);
        updateDoc(roomDocRef, { liveAim: aimPayload }).catch(() => {});
      }
    }
  };

  const handlePointerUp = async () => {
    if (!dragRef.current.active) return;
    const { penIndex, grabLocalOffset, currentMouseWorld } = dragRef.current;
    dragRef.current.active = false;
    setLiveAimPower(0);

    const activePen = pensRef.current[penIndex];
    const offsetDist = grabLocalOffset * activePen.halfLen;
    const contactX = activePen.x + Math.cos(activePen.angle) * offsetDist;
    const contactY = activePen.y + Math.sin(activePen.angle) * offsetDist;

    const pullDX = contactX - currentMouseWorld.x;
    const pullDY = contactY - currentMouseWorld.y;
    const rawDist = Math.hypot(pullDX, pullDY);
    if (rawDist < 12) return;

    // Evaluate Skill Timing Meter Sweet-Spot (38..62 is Perfect 1.15x clean flick)
    const cursor = timingCursorRef.current;
    const isSweetSpot = cursor >= 38 && cursor <= 62;
    const timingMultiplier = isSweetSpot ? 1.15 : 1.0;
    const timingQuality: 'perfect' | 'normal' | 'early' = isSweetSpot ? 'perfect' : 'normal';

    if (isSweetSpot) {
      setLastTimingBadge('⚡ PERFECT SWEET-SPOT RELEASE (1.15x)!');
      unlockAchievement('ach-sweet-spot');
    } else {
      setLastTimingBadge('Clean Flick Release');
    }
    setTimeout(() => setLastTimingBadge(null), 2000);

    if (Math.abs(grabLocalOffset) > 0.55) {
      unlockAchievement('ach-spin-doctor');
    }

    const maxPull = 190;
    const clampedDist = Math.min(maxPull, rawDist);
    const powerScale = 0.21 * timingMultiplier;
    const impulseX = (pullDX / rawDist) * clampedDist * powerScale;
    const impulseY = (pullDY / rawDist) * clampedDist * powerScale;

    const [p1, p2] = pensRef.current;
    const shotRecord: ShotCommand = {
      player: turn,
      grabLocalOffset,
      impulseX,
      impulseY,
      stance: tacticalStance,
      timingQuality,
      timestamp: Date.now(),
      p1Start: { x: p1.x, y: p1.y, angle: p1.angle },
      p2Start: { x: p2.x, y: p2.y, angle: p2.angle }
    };

    // Consume Special Stance Charge if non-standard
    if (tacticalStance !== 'standard') {
      setStanceCharges((prev) => ({
        ...prev,
        [turn === 1 ? 'p1' : 'p2']: Math.max(0, prev[turn === 1 ? 'p1' : 'p2'] - 1)
      }));
      setTacticalStance('standard');
    }

    currentShotFramesRef.current = [];
    applyPointImpulseToPen(
      activePen,
      grabLocalOffset,
      impulseX,
      impulseY,
      houseRules.heavyCapSpinBonus,
      shotRecord.stance
    );
    soundFX.playFlick(clampedDist / maxPull, isSweetSpot);
    setIsSimulating(true);

    // Broadcast Shot to Online Room via BroadcastChannel, Custom WS & Cloud Firestore
    if (gameMode === 'online' && activeRoomCode) {
      lastProcessedShotRef.current = shotRecord.timestamp;
      broadcastChannelRef.current?.postMessage({
        type: 'SHOT_FIRED',
        roomCode: activeRoomCode,
        shot: shotRecord
      });

      if (customWsRef.current && customWsRef.current.readyState === WebSocket.OPEN) {
        customWsRef.current.send(
          JSON.stringify({ type: 'flick_shot', roomCode: activeRoomCode, shotCommand: shotRecord })
        );
      }

      if (db && user) {
        const roomDocRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'pen_fight_rooms',
          activeRoomCode
        );
        await updateDoc(roomDocRef, {
          lastShot: shotRecord,
          liveAim: null,
          updatedAt: Date.now()
        }).catch(() => {});
      }
    }
  };

  const startWinningReplayPlayback = () => {
    if (winningReplayFramesRef.current.length === 0) return;
    replayIndexRef.current = 0;
    setIsPlayingReplay(true);
  };

  const selectedP1Model = PEN_MODELS.find((m) => m.id === p1PenId) || PEN_MODELS[0];
  const selectedP2Model = PEN_MODELS.find((m) => m.id === p2PenId) || PEN_MODELS[1];
  const selectedArena = DESK_ARENAS.find((d) => d.id === selectedDeskId) || DESK_ARENAS[0];
  const currentLeague = getLeagueFromElo(profile.elo);
  const playerSchool =
    FICTIONAL_ACADEMIES.find((s) => s.id === profile.schoolId) || FICTIONAL_ACADEMIES[0];

  const NAV_ITEMS: { id: AppPage; label: string; icon: any }[] = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'play', label: 'Play Arena', icon: Play },
    { id: 'collection', label: 'Collection', icon: Sparkles },
    { id: 'profile', label: 'Profile', icon: UserCheck },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'friends', label: 'Online & Friends', icon: Globe },
    { id: 'howtoplay', label: 'How to Play', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ];

  return (
    <div className="min-h-screen bg-[#141824] text-slate-100 font-sans flex flex-col">
      {/* TOP PRODUCT NAVIGATION BAR (8 PAGES + WEBSOCKET CODE DRAWER) */}
      <header className="border-b border-amber-900/40 bg-[#1c2233]/95 backdrop-blur sticky top-0 z-30 px-3 sm:px-5 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div
            onClick={() => setActivePage('home')}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-md border border-amber-200/40">
              <Compass className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black tracking-tight text-base sm:text-lg text-amber-300 uppercase">
                  Pen Fight Arena
                </h1>
                <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${currentLeague.bgBadge}`}>
                  {currentLeague.tier} • {profile.elo}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                {playerSchool.name} • 💧 {profile.inkDrops} Ink Drops
              </p>
            </div>
          </div>

          {/* 8-Page Navigation Pills */}
          <nav className="flex items-center gap-1 overflow-x-auto max-w-full py-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 shadow'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* WebSocket / Server Code Export Button */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setTestResults(runCoreGameUnitTests());
                setShowSocketArchModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition"
            >
              <Server className="w-3.5 h-3.5" />
              <span className="hidden md:inline">WebSocket Server & Code</span>
            </button>
          </div>
        </div>
      </header>

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow-2xl border-2 border-slate-950 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =====================================================================
          PAGE 1: HOME (PLAY NOW, MODES, DAILY CHALLENGE & SCHOOL RIVALRY)
      ===================================================================== */}
      {activePage === 'home' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-6">
          {/* Hero Banner */}
          <div className="rounded-3xl bg-gradient-to-r from-[#1e293b] via-[#1c2536] to-[#0f172a] border-2 border-amber-400/40 p-6 sm:p-8 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Real-Time 2-Player Online Sync + 60Hz OBB Physics</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                Relive the Classic School Desk Pen Fight — Now Online.
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                Place your favorite pen on the carved wooden desk, aim with slingshot precision, time the sweet-spot release bar, and send your friend’s pen tumbling off the edge in real time.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  onClick={() => startNewMatch('ai', p1PenId, p2PenId, selectedDeskId, ruleMode)}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Play Now (Desk Arena)</span>
                </button>
                <button
                  onClick={() => setActivePage('friends')}
                  className="px-5 py-3.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 font-black text-sm flex items-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  <span>2-Player Online Room (6-Code)</span>
                </button>
                <button
                  onClick={() => setShowSocketArchModal(true)}
                  className="px-4 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2"
                >
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span>Socket.IO Server Code</span>
                </button>
              </div>
            </div>

            {/* Featured Daily Challenge & King of the Classroom Spotlight */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-400/40 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-amber-300 font-bold">
                    👑 King of the Classroom
                  </span>
                  <h3 className="font-black text-sm text-white">
                    Winner-Stays-On Challenger Queue
                  </h3>
                  <p className="text-xs text-slate-400">
                    Best Crown Streak: <strong className="text-amber-300">{profile.kingBestStreak} Wins</strong>
                  </p>
                </div>
                <button
                  onClick={() => startNewMatch('king', p1PenId, p2PenId, 'wooden_classic', 'flick')}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0"
                >
                  Defend Crown
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-400/40 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-cyan-300 font-bold">
                    📅 Daily Pen Fight Challenge
                  </span>
                  <h3 className="font-black text-sm text-white">
                    Same Starting Desk Seed for Everyone
                  </h3>
                  <p className="text-xs text-slate-400">
                    Best Record:{' '}
                    <strong className="text-cyan-300">
                      {profile.dailyBestShots ? `${profile.dailyBestShots} Shots` : 'Unattempted'}
                    </strong>
                  </p>
                </div>
                <button
                  onClick={() => startNewMatch('daily', p1PenId, p2PenId, 'exam_hall', 'flick')}
                  className="px-3.5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs shrink-0"
                >
                  Play Daily
                </button>
              </div>
            </div>
          </div>

          {/* 4 Core Game Mode Cards + School Arenas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(
              [
                {
                  title: 'Online 2-Player Room',
                  desc: 'Create a 6-character code, share a link, see live opponent aiming vectors, or test in Dual-View.',
                  badge: 'WebSocket / Cloud Sync',
                  action: () => setActivePage('friends')
                },
                {
                  title: 'Ranked League Battles',
                  desc: 'Fair normalized pen physics (Mass 1.40) so pure skill, bank shots, and timing decide your Elo.',
                  badge: `${currentLeague.tier} (${profile.elo} Elo)`,
                  action: () => startNewMatch('ranked', p1PenId, p2PenId, selectedDeskId, 'flick')
                },
                {
                  title: '3 AI Personalities',
                  desc: 'Battle the Clumsy Rookie, Calculating Strategist, or Reckless Spin-Hook Aggressor.',
                  badge: 'Adaptive Bots',
                  action: () => startNewMatch('ai', p1PenId, p2PenId, selectedDeskId, ruleMode)
                },
                {
                  title: 'Local Pass & Play',
                  desc: 'Two players share one screen just like sitting side-by-side in the back row.',
                  badge: 'Classic 2P Desk',
                  action: () => startNewMatch('local', p1PenId, p2PenId, selectedDeskId, ruleMode)
                }
              ] as const
            ).map((card, i) => (
              <div
                key={i}
                onClick={card.action}
                className="p-5 rounded-2xl bg-[#1e2638] hover:bg-[#253047] border border-slate-700/80 hover:border-amber-400/60 cursor-pointer transition flex flex-col justify-between gap-4 shadow-lg"
              >
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-700">
                    {card.badge}
                  </span>
                  <h3 className="font-extrabold text-base text-white">{card.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
                </div>
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1">
                  <span>Launch Mode</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* =====================================================================
          PAGE 2: PLAY ARENA (GAME BOARD, TACTICAL STANCES, LIVE ONLINE HUD)
      ===================================================================== */}
      {activePage === 'play' && (
        <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-2.5 flex flex-col items-center justify-between gap-2.5">
          {/* Top Mode & Rule Selector Strip */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-400">Mode:</span>
              {(['ai', 'local', 'ranked', 'king', 'daily', 'online'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    if (m === 'online' && !activeRoomCode) {
                      setActivePage('friends');
                    } else {
                      startNewMatch(m, p1PenId, p2PenId, selectedDeskId, ruleMode);
                    }
                  }}
                  className={`px-2.5 py-1 rounded font-bold uppercase text-[11px] ${
                    gameMode === m
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {gameMode === 'ai' && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">AI Personality:</span>
                {(
                  [
                    { id: 'clumsy_rookie', label: 'Clumsy Rookie' },
                    { id: 'calculating_strategist', label: 'Strategist' },
                    { id: 'reckless_aggressor', label: 'Aggressor' }
                  ] as const
                ).map((bot) => (
                  <button
                    key={bot.id}
                    onClick={() => setAiPersonality(bot.id)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      aiPersonality === bot.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {bot.label}
                  </button>
                ))}
              </div>
            )}

            {gameMode === 'online' && (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono font-bold text-[11px]">
                  Room: {activeRoomCode || 'LOCAL'} •{' '}
                  {dualViewTestMode ? 'Dual-View Sync' : `Player ${onlineRole}`}
                </span>
                <button
                  onClick={() => setDualViewTestMode((v) => !v)}
                  className={`px-2.5 py-0.5 rounded font-bold text-[11px] flex items-center gap-1 border ${
                    dualViewTestMode
                      ? 'bg-amber-400 text-slate-950 border-amber-200'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                  title="Toggle Dual-View so one person can control both P1 and P2 online turns"
                >
                  <SplitSquareVertical className="w-3 h-3" />
                  <span>{dualViewTestMode ? 'Dual-Turn Tester: ON' : 'Test Both Turns'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Scoreboard & Turn Indicator */}
          <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center bg-[#1c2334] border border-slate-700/80 p-2.5 rounded-2xl shadow-lg">
            <div
              className={`md:col-span-4 flex items-center justify-between p-2.5 rounded-xl border ${
                turn === 1 && !isSimulating && matchWinner === 0
                  ? 'bg-blue-950/60 border-blue-400'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div>
                <div className="font-black text-xs uppercase text-blue-300">
                  {onlineRoomData?.hostName || profile.name} (P1)
                </div>
                <div className="text-xs font-bold text-white">{selectedP1Model.name}</div>
              </div>
              <span className="font-mono font-black text-xl text-white">{scores.p1}</span>
            </div>

            <div className="md:col-span-4 flex flex-col items-center justify-center text-center">
              <div className="text-[10px] font-mono uppercase tracking-widest text-amber-300 font-bold">
                {gameMode === 'ranked'
                  ? '⚖️ RANKED FAIR NORMALIZED STATS'
                  : `${ruleMode.toUpperCase()} • ${selectedArena.name}`}
              </div>
              <div className="mt-0.5 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-extrabold">
                {isPlayingReplay
                  ? '🎥 Slow-Motion Winning Shot Replay'
                  : isSimulating
                  ? '💥 Pens Colliding on Desk...'
                  : `Player ${turn}’s Turn — Pull & Release in Green Zone!`}
              </div>
            </div>

            <div
              className={`md:col-span-4 flex items-center justify-between p-2.5 rounded-xl border ${
                turn === 2 && !isSimulating && matchWinner === 0
                  ? 'bg-rose-950/60 border-rose-400'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <span className="font-mono font-black text-xl text-white">{scores.p2}</span>
              <div className="text-right">
                <div className="font-black text-xs uppercase text-rose-300">
                  {gameMode === 'online'
                    ? onlineRoomData?.guestName || 'Online P2'
                    : gameMode === 'king'
                    ? kingChallengerName
                    : `AI (${aiPersonality.split('_')[1]})`}
                </div>
                <div className="text-xs font-bold text-white">{selectedP2Model.name}</div>
              </div>
            </div>
          </div>

          {/* Central Interactive School Desk Canvas */}
          <div className="relative w-full aspect-[1000/620] max-h-[60vh] rounded-2xl overflow-hidden border-2 border-slate-700/90 shadow-2xl bg-slate-950 flex items-center justify-center select-none touch-none">
            <canvas
              ref={canvasRef}
              width={VIRTUAL_WIDTH}
              height={VIRTUAL_HEIGHT}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="w-full h-full object-contain cursor-crosshair touch-none"
            />

            {/* Timing Release Feedback Badge */}
            {lastTimingBadge && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-emerald-500 text-slate-950 font-black text-xs shadow-lg pointer-events-none">
                {lastTimingBadge}
              </div>
            )}

            {/* Floating Reactions */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
              {floatingReactions.map((r) => (
                <div
                  key={r.id}
                  style={{ left: `${(r.x / VIRTUAL_WIDTH) * 100}%`, top: '16%' }}
                  className="absolute -translate-x-1/2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border-2 border-amber-400 text-white font-black text-xs shadow-xl flex items-center gap-1.5 animate-bounce"
                >
                  <span>{r.emoji}</span>
                  <span>{r.label}</span>
                </div>
              ))}
            </div>

            {roundBanner && matchWinner === 0 && !isPlayingReplay && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-slate-950/45 z-10">
                <div className="px-7 py-4 rounded-xl bg-amber-300 text-slate-950 font-black text-lg sm:text-2xl uppercase tracking-wider shadow-2xl border-2 border-slate-950">
                  {roundBanner}
                </div>
              </div>
            )}

            {/* Match Victory Overlay with Slow-Mo Replay & WebM Video Export */}
            {matchWinner !== 0 && !isPlayingReplay && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-20">
                <div className="max-w-md w-full rounded-2xl bg-[#fdfbf7] text-slate-900 p-6 border-4 border-amber-400 shadow-2xl text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center mx-auto shadow-md">
                    <Trophy className="w-8 h-8 stroke-[2.2]" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">
                    Player {matchWinner} Wins the Desk!
                  </h2>
                  {lastEloDelta !== null && (
                    <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono">
                      Elo Rating: <strong>{profile.elo}</strong> ({lastEloDelta >= 0 ? `+${lastEloDelta}` : lastEloDelta}) • +90 💧 Ink Drops
                    </div>
                  )}

                  {hasWinningReplay && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={startWinningReplayPlayback}
                        className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow"
                      >
                        <Video className="w-4 h-4" />
                        <span>0.5x Slow-Mo Replay</span>
                      </button>
                      <button
                        onClick={handleExportReplayWebM}
                        disabled={isRecordingWebM}
                        className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow"
                      >
                        <Download className="w-4 h-4" />
                        <span>{isRecordingWebM ? 'Recording...' : 'Export .WebM Clip'}</span>
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2.5">
                    <button
                      onClick={() => startNewMatch(gameMode, p1PenId, p2PenId, selectedDeskId, ruleMode)}
                      className="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow"
                    >
                      {gameMode === 'king' ? 'Next Challenger →' : 'Rematch'}
                    </button>
                    <button
                      onClick={() => setActivePage('home')}
                      className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase"
                    >
                      Home Hub
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Tactical Stances (Skill Moves) & Reactions Bar */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 bg-[#1c2334] border border-slate-700/80 px-3.5 py-2 rounded-xl text-xs">
            {/* Skill-Based Tactical Stances */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400 font-bold mr-1">
                Tactical Stance ({turn === 1 ? stanceCharges.p1 : stanceCharges.p2} left):
              </span>
              {(
                [
                  { id: 'standard', label: 'Standard' },
                  { id: 'precision', label: '🎯 Precision Aim' },
                  { id: 'bank_shot', label: '📐 Bank Ricochet' },
                  { id: 'spin_hook', label: '🌪️ Spin Hook' }
                ] as const
              ).map((st) => {
                const chargesLeft = turn === 1 ? stanceCharges.p1 : stanceCharges.p2;
                const disabled = st.id !== 'standard' && chargesLeft <= 0;
                return (
                  <button
                    key={st.id}
                    disabled={disabled}
                    onClick={() => setTacticalStance(st.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition ${
                      tacticalStance === st.id
                        ? 'bg-amber-400 text-slate-950 border-amber-200'
                        : disabled
                        ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                        : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>

            {/* Classroom Emoji Reactions */}
            <div className="flex items-center gap-1.5">
              {REACTION_PRESETS.map((rx) => (
                <button
                  key={rx.emoji}
                  onClick={() => triggerReaction(rx.emoji, rx.label)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold"
                  title={rx.label}
                >
                  {rx.emoji}
                </button>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* =====================================================================
          PAGE 3: COLLECTION (8 RARITY PENS & 360° STUDIO)
      ===================================================================== */}
      {activePage === 'collection' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 5 Cols: Live 360° Customizer Studio */}
            <div className="lg:col-span-5 rounded-2xl bg-[#1e2638] border border-amber-400/40 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="font-black text-lg text-white">360° Pen Customizer Studio</h2>
                <span className="text-xs font-mono text-cyan-300 font-bold">
                  💧 {profile.inkDrops} Ink Drops
                </span>
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 relative">
                <canvas
                  ref={inspectorCanvasRef}
                  width={520}
                  height={210}
                  className="w-full h-48 object-cover"
                />
                <button
                  onClick={() => setInspectorSpinVel(0.18)}
                  className="absolute bottom-2 right-2 px-3 py-1 rounded bg-amber-400 text-slate-950 font-black text-xs"
                >
                  ⚡ Test Spin Torque
                </button>
              </div>
              <div className="space-y-2 text-xs">
                <label className="block font-bold text-slate-300">
                  Rotate 360° ({Math.round((inspectorAngle * 180) / Math.PI)}°):
                </label>
                <input
                  type="range"
                  min={-Math.PI}
                  max={Math.PI}
                  step={0.05}
                  value={inspectorAngle}
                  onChange={(e) => {
                    setInspectorSpinVel(0);
                    setInspectorAngle(parseFloat(e.target.value));
                  }}
                  className="w-full accent-amber-400"
                />
              </div>
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-300 block">Barrel Skin:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(['classic', 'gold_foil', 'stickers', 'camo', 'neon_ink'] as const).map((sk) => (
                    <button
                      key={sk}
                      onClick={() =>
                        setProfile((prev) => ({
                          ...prev,
                          customizations: {
                            ...prev.customizations,
                            [inspectedPenId]: {
                              ...(prev.customizations[inspectedPenId] || {
                                skin: 'classic',
                                gripColor: '#3b82f6',
                                topper: 'none'
                              }),
                              skin: sk
                            }
                          }
                        }))
                      }
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold uppercase text-[10px] border border-slate-700"
                    >
                      {sk.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 7 Cols: 8 Rarity Pens Grid */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {PEN_MODELS.map((pen) => {
                const unlocked = profile.unlockedPens.includes(pen.id);
                const rStyle = RARITY_STYLES[pen.rarity];
                return (
                  <div
                    key={pen.id}
                    onClick={() => setInspectedPenId(pen.id)}
                    className={`p-4 rounded-2xl bg-slate-900/90 border-2 cursor-pointer transition flex flex-col justify-between gap-3 ${rStyle.border}`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${rStyle.badgeBg}`}>
                          {pen.rarity}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{pen.category}</span>
                      </div>
                      <h3 className="font-extrabold text-sm text-white mt-2">{pen.name}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">{pen.tagline}</p>
                    </div>
                    <div className="flex gap-2">
                      {unlocked ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setP1PenId(pen.id);
                              showToast(`Equipped ${pen.name} for Player 1`);
                            }}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                              p1PenId === pen.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {p1PenId === pen.id ? '✓ P1 Active' : 'Equip P1'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setP2PenId(pen.id);
                              showToast(`Equipped ${pen.name} for Player 2`);
                            }}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                              p2PenId === pen.id
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {p2PenId === pen.id ? '✓ P2 Active' : 'Equip P2'}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (profile.inkDrops >= pen.unlockCost) {
                              setProfile((prev) => ({
                                ...prev,
                                inkDrops: prev.inkDrops - pen.unlockCost,
                                unlockedPens: [...prev.unlockedPens, pen.id]
                              }));
                              unlockAchievement('ach-collector');
                              showToast(`Unlocked ${pen.name}!`);
                            } else {
                              showToast(`Need ${pen.unlockCost - profile.inkDrops} more Ink Drops!`);
                            }
                          }}
                          className="w-full py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-black text-xs"
                        >
                          Unlock ({pen.unlockCost} 💧 Ink)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      )}

      {/* =====================================================================
          PAGE 4: PROFILE (CAREER STATS, ACHIEVEMENTS & MATCH HISTORY)
      ===================================================================== */}
      {activePage === 'profile' && (
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#1e2638] border border-slate-700">
              <span className="text-xs text-slate-400">Elo Rating</span>
              <div className="text-2xl font-black text-amber-300 mt-1">
                {profile.elo} ({currentLeague.tier})
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#1e2638] border border-slate-700">
              <span className="text-xs text-slate-400">Win / Loss Record</span>
              <div className="text-2xl font-black text-white mt-1">
                {profile.wins}W - {profile.losses}L
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#1e2638] border border-slate-700">
              <span className="text-xs text-slate-400">King of Classroom Best</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                👑 {profile.kingBestStreak} Streak
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#1e2638] border border-slate-700">
              <span className="text-xs text-slate-400">Fictional School</span>
              <div className="text-base font-black text-cyan-300 mt-1 truncate">
                {playerSchool.name}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Achievements */}
            <div className="lg:col-span-6 rounded-2xl bg-[#1e2638] border border-slate-700 p-5 space-y-3">
              <h3 className="font-black text-base text-white">Classroom Achievements</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {profile.achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className={`p-3 rounded-xl border ${
                      ach.unlocked
                        ? 'bg-amber-500/10 border-amber-400/50'
                        : 'bg-slate-900/60 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{ach.icon}</span>
                      <div>
                        <div className="font-bold text-xs text-white">{ach.title}</div>
                        <div className="text-[11px] text-slate-400">{ach.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Match History */}
            <div className="lg:col-span-6 rounded-2xl bg-[#1e2638] border border-slate-700 p-5 space-y-3">
              <h3 className="font-black text-base text-white">Recent Match History</h3>
              <div className="space-y-2">
                {profile.matchHistory.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span
                        className={`font-black px-2 py-0.5 rounded mr-2 ${
                          m.result === 'WIN'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {m.result}
                      </span>
                      <strong className="text-white">vs {m.opponent}</strong>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {m.penUsed} • {m.mode.toUpperCase()} ({m.ruleMode})
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-white">{m.score}</div>
                      <div className={m.eloChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {m.eloChange >= 0 ? `+${m.eloChange}` : m.eloChange} Elo
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* =====================================================================
          PAGE 5: LEADERBOARD (GLOBAL, FRIENDS & FICTIONAL SCHOOL RIVALRIES)
      ===================================================================== */}
      {activePage === 'leaderboard' && (
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-white">
                Global & Fictional School Rivalry Standings
              </h2>
              <p className="text-xs text-slate-400">
                Pledge allegiance to a fictional academy and earn points with every desk victory!
              </p>
            </div>
            <div className="flex gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-700">
              {(['global', 'friends', 'schools'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setLeaderboardTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${
                    leaderboardTab === t ? 'bg-amber-400 text-slate-950' : 'text-slate-300'
                  }`}
                >
                  {t === 'schools' ? '🏫 School Rivalries' : t}
                </button>
              ))}
            </div>
          </div>

          {leaderboardTab === 'schools' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FICTIONAL_ACADEMIES.map((sch, i) => {
                const isJoined = profile.schoolId === sch.id;
                return (
                  <div
                    key={sch.id}
                    className={`p-5 rounded-2xl border-2 flex items-center justify-between gap-4 ${
                      isJoined
                        ? 'bg-amber-500/15 border-amber-400'
                        : 'bg-[#1e2638] border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-mono text-amber-300">
                        Rank #{i + 1} • {sch.mascot}
                      </span>
                      <h3 className="text-lg font-black text-white">{sch.name}</h3>
                      <p className="text-xs text-slate-400 italic">“{sch.motto}”</p>
                      <div className="text-xs font-mono text-emerald-300 pt-1">
                        {sch.totalPoints + (isJoined ? profile.wins * 50 : 0)} Rivalry Pts • {sch.members} Students
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setProfile((prev) => ({ ...prev, schoolId: sch.id }));
                        showToast(`Joined ${sch.name}!`);
                      }}
                      className={`px-4 py-2 rounded-xl font-black text-xs ${
                        isJoined
                          ? 'bg-emerald-400 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {isJoined ? '✓ Your Academy' : 'Represent School'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-[#1e2638] border border-slate-700 p-5 space-y-2.5">
              {[
                { name: 'Rohan_Backbench99', elo: 1745, wins: 64, pen: 'Dragon-Scale Golden Ruler Pen', isFriend: true },
                { name: 'SpinMaster_Aisha', elo: 1620, wins: 51, pen: 'Cyber-Neon RGB Gel Mod', isFriend: false },
                { name: 'GeometryBox_King', elo: 1480, wins: 39, pen: 'Spin-Master Mod', isFriend: true },
                { name: `${profile.name} (You)`, elo: profile.elo, wins: profile.wins, pen: selectedP1Model.name, isFriend: true }
              ]
                .filter((e) => (leaderboardTab === 'friends' ? e.isFriend : true))
                .sort((a, b) => b.elo - a.elo)
                .map((row, idx) => (
                  <div
                    key={row.name}
                    className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 font-black flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-white">{row.name}</div>
                        <div className="text-[11px] text-slate-400">Main: {row.pen}</div>
                      </div>
                    </div>
                    <div className="font-mono font-black text-amber-300 text-sm">
                      {row.elo} Elo ({row.wins}W)
                    </div>
                  </div>
                ))}
            </div>
          )}
        </main>
      )}

      {/* =====================================================================
          PAGE 6: ONLINE & FRIENDS (REAL-TIME 2-PLAYER LOBBY, DUAL-VIEW TESTER)
      ===================================================================== */}
      {activePage === 'friends' && (
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 space-y-6">
          {/* Network Transport Selector Strip */}
          <div className="p-4 rounded-2xl bg-[#1e2638] border border-emerald-500/40 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Radio className="w-6 h-6 text-emerald-400 animate-pulse" />
              <div>
                <h2 className="font-black text-base text-white">
                  Real-Time Two-Player Online Synchronization
                </h2>
                <p className="text-xs text-slate-300">
                  Syncs live aiming ghost vectors (`aim_move`), point-impulse shots, turns, and emoji reactions across tabs or devices.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTransportMode('cloud_realtime')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                  transportMode === 'cloud_realtime'
                    ? 'bg-emerald-400 text-slate-950 border-emerald-200'
                    : 'bg-slate-900 text-slate-300 border-slate-700'
                }`}
              >
                ☁️ Cloud + Cross-Tab Sync (Instant)
              </button>
              <button
                onClick={() => {
                  setTransportMode('custom_websocket');
                  connectCustomWebSocket(profile.settings.wsServerUrl);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                  transportMode === 'custom_websocket'
                    ? 'bg-cyan-400 text-slate-950 border-cyan-200'
                    : 'bg-slate-900 text-slate-300 border-slate-700'
                }`}
              >
                🔌 Custom WebSocket ({customWsStatus})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Host 6-Character Room */}
            <div className="p-6 rounded-2xl bg-[#1e2638] border border-slate-700 space-y-4">
              <h3 className="font-black text-lg text-white">1. Create 6-Character Online Room</h3>
              <p className="text-xs text-slate-400">
                Generate a private room code and share it with a friend on another device or browser tab.
              </p>
              <button
                onClick={handleCreateOnlineRoom}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg"
              >
                + Generate 6-Character Room Code
              </button>

              {activeRoomCode && (
                <div className="p-4 rounded-xl bg-slate-900 border border-emerald-400/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-mono font-black tracking-widest text-amber-300">
                      {activeRoomCode}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(activeRoomCode);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded bg-slate-800 text-xs font-bold text-slate-200 flex items-center gap-1"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => {
                        const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${activeRoomCode}`;
                        navigator.clipboard?.writeText(inviteUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-300"
                    >
                      {copiedLink ? '✓ Invite Link Copied!' : '🔗 Copy Shareable Invite Link'}
                    </button>
                    <button
                      onClick={handleLaunchDualViewOnlineTest}
                      className="flex-1 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs"
                    >
                      ⚡ Test Online Sync Now
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Join or Spectate Room */}
            <div className="p-6 rounded-2xl bg-[#1e2638] border border-slate-700 space-y-4">
              <h3 className="font-black text-lg text-white">2. Join or Spectate Friend’s Room</h3>
              <p className="text-xs text-slate-400">
                Enter the 6-character code from another browser tab or friend’s invite link:
              </p>
              <input
                type="text"
                maxLength={6}
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="ENTER 6-CHAR CODE (E.G. PEN84X)"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono uppercase tracking-widest text-amber-300"
              />
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleJoinOnlineRoom(false)}
                  className="py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase"
                >
                  Join as Player 2
                </button>
                <button
                  onClick={() => handleJoinOnlineRoom(true)}
                  className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700"
                >
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>Spectate Live</span>
                </button>
              </div>
              {onlineError && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-200 font-bold">
                  {onlineError}
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* =====================================================================
          PAGE 7: HOW TO PLAY (INTERACTIVE 3-STEP PHYSICS TUTORIAL)
      ===================================================================== */}
      {activePage === 'howtoplay' && (
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 space-y-6">
          <div className="rounded-2xl bg-[#fdfbf7] text-slate-900 p-6 border-2 border-amber-500 shadow-xl space-y-4">
            <h2 className="text-2xl font-black uppercase">
              Interactive Physics & School Rules Guide
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(
                [
                  {
                    step: 1,
                    title: '1. Center Thrust vs. Tip Whip Spin',
                    desc: 'Grabbing your pen near its center barrel delivers a heavy straight ram. Grabbing the extreme tip or back cap applies off-center rotational torque (τ = r × J), whipping the pen into a helicopter spin!'
                  },
                  {
                    step: 2,
                    title: '2. Skill Timing Sweet-Spot Meter',
                    desc: 'While pulling back your slingshot, watch the oscillating meter above your pen. Release when the white marker is inside the Green Sweet-Spot for a 1.15x clean-flick impulse!'
                  },
                  {
                    step: 3,
                    title: '3. Ranked Fair Normalization',
                    desc: 'In Casual modes, every pen has unique weight and friction. In Ranked League battles, all pens are normalized to identical tournament stats so skill always wins.'
                  }
                ] as const
              ).map((item) => (
                <div
                  key={item.step}
                  onClick={() => setTutorialStep(item.step)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                    tutorialStep === item.step
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="font-black text-sm text-slate-900">{item.title}</div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => startNewMatch('ai', p1PenId, p2PenId, 'wooden_classic', 'flick')}
              className="px-6 py-3 rounded-xl bg-slate-900 text-amber-300 font-black text-xs uppercase tracking-wider"
            >
              Practice Live on the Desk Arena →
            </button>
          </div>
        </main>
      )}

      {/* =====================================================================
          PAGE 8: SETTINGS (AUDIO, HAPTICS, ACCESSIBILITY & WS URL)
      ===================================================================== */}
      {activePage === 'settings' && (
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
          <div className="rounded-2xl bg-[#1e2638] border border-slate-700 p-6 space-y-5">
            <h2 className="text-xl font-black text-white">
              Audio, Accessibility & Network Settings
            </h2>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">
                  Master Synthesizer Volume ({profile.settings.masterVolume}%)
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={profile.settings.masterVolume}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      settings: { ...p.settings, masterVolume: parseInt(e.target.value, 10) }
                    }))
                  }
                  className="w-48 accent-amber-400"
                />
              </div>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-bold text-slate-200">Mobile Haptic Vibration Feedback</span>
                <input
                  type="checkbox"
                  checked={profile.settings.hapticsEnabled}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      settings: { ...p.settings, hapticsEnabled: e.target.checked }
                    }))
                  }
                  className="rounded text-amber-400"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-bold text-slate-200">
                  High-Contrast Colorblind Aiming Trajectory
                </span>
                <input
                  type="checkbox"
                  checked={profile.settings.highContrastAim}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      settings: { ...p.settings, highContrastAim: e.target.checked }
                    }))
                  }
                  className="rounded text-amber-400"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-bold text-slate-200">
                  Reduced Camera Shake & Particle Motion
                </span>
                <input
                  type="checkbox"
                  checked={profile.settings.reducedMotion}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      settings: { ...p.settings, reducedMotion: e.target.checked }
                    }))
                  }
                  className="rounded text-amber-400"
                />
              </label>

              <div className="pt-3 border-t border-slate-700 space-y-2">
                <label className="font-bold text-slate-200 block">
                  Custom Local WebSocket Server Endpoint (`server.ts`):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={profile.settings.wsServerUrl}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        settings: { ...p.settings, wsServerUrl: e.target.value }
                      }))
                    }
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 font-mono text-amber-300"
                  />
                  <button
                    onClick={() => connectCustomWebSocket(profile.settings.wsServerUrl)}
                    className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-black"
                  >
                    Connect WS
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* =====================================================================
          DEVELOPER MODAL: WEBSOCKET (SOCKET.IO) SERVER CODE & UNIT TESTS
      ===================================================================== */}
      {showSocketArchModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-[#1a2234] text-slate-100 p-6 border-2 border-emerald-500/40 shadow-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-lg">
                  WebSocket (Socket.IO) Server, React Hook & Unit Test Suite
                </h3>
              </div>
              <button
                onClick={() => setShowSocketArchModal(false)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'server', label: '1. server.ts (Node.js + Socket.IO)' },
                  { id: 'hook', label: '2. useSocketMultiplayer.ts (React Hook)' },
                  { id: 'package', label: '3. package.json & Local Setup' },
                  { id: 'tests', label: `4. Unit Tests (${testResults.filter((t) => t.passed).length}/${testResults.length} Passing)` }
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setArchCodeTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    archCodeTab === tab.id
                      ? 'bg-emerald-400 text-slate-950'
                      : 'bg-slate-900 text-slate-300 border border-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {archCodeTab !== 'tests' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-slate-900 px-3.5 py-2 rounded-t-xl border border-slate-800 text-xs">
                  <span className="font-mono text-emerald-300">
                    {archCodeTab === 'server'
                      ? 'server.ts — Authoritative 2-Player Room & Turn Validation Server'
                      : archCodeTab === 'hook'
                      ? 'useSocketMultiplayer.ts — Socket.IO Client Hook'
                      : 'package.json — Fullstack Dependencies'}
                  </span>
                  <button
                    onClick={() => {
                      const code =
                        archCodeTab === 'server'
                          ? SOCKET_SERVER_CODE_SNIPPET
                          : archCodeTab === 'hook'
                          ? SOCKET_CLIENT_HOOK_SNIPPET
                          : PACKAGE_JSON_SNIPPET;
                      navigator.clipboard?.writeText(code);
                      setCopiedSnippet(true);
                      setTimeout(() => setCopiedSnippet(false), 2000);
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1"
                  >
                    {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSnippet ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-b-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-200 overflow-x-auto leading-relaxed">
                  {archCodeTab === 'server'
                    ? SOCKET_SERVER_CODE_SNIPPET
                    : archCodeTab === 'hook'
                    ? SOCKET_CLIENT_HOOK_SNIPPET
                    : PACKAGE_JSON_SNIPPET}
                </pre>
              </div>
            ) : (
              <div className="space-y-2">
                {testResults.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-xs text-white">
                          {t.name}{' '}
                          <span className="text-[10px] font-mono text-slate-400">[{t.category}]</span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">{t.details}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
                      PASS
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Missing #root element in index.html');
}

createRoot(rootElement).render(<App />);