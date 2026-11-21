import { useEffect, useState } from "react";
import {
  getArenaMap,
  getGameModeConfig,
  getNextArenaMapId,
  MAX_COMBAT_BOTS,
} from "@upgun/shared";
import {
  sendAddBot,
  sendChatMessage,
  sendCheatCommand,
  sendPlayAgain,
  sendQuickChat,
  sendSandboxGrantCard,
  sendStartSoloPractice,
} from "../network/colyseusClient";
import { useGameStore } from "../store/gameStore";
import { useSettingsStore } from "../store/settingsStore";
import { CardDraftOverlay } from "./CardDraftOverlay";
import { commsStore, QuickChatWheel, TextChatBox, voiceChatManager } from "./comms";
import { ConnectionBadge } from "./ConnectionBadge";
import { HudCombatBar } from "./HudCombatBar";
import { HudModeBanner, HudVoiceToolbar, toggleVoiceConnection } from "./HudModeBanner";
import { LobbyOverlay } from "./LobbyOverlay";
import { KillstreakBanner, MatchVictoryOverlay } from "./match";
import { MyCardsDrawer } from "./MyCardsDrawer";
import { SandboxDrawer, useCheatCodeListener } from "./sandbox";
import { ScoreboardOverlay } from "./ScoreboardOverlay";
import { SettingsDrawer } from "./SettingsDrawer";
import { SpectatorOverlay } from "./spectator";
import { TouchControls } from "./TouchControls";

export function HudOverlay() {
  const status = useGameStore((s) => s.status);
  const isPointerLocked = useGameStore((s) => s.isPointerLocked);
  const lobbyOpen = useGameStore((s) => s.lobbyOpen);
  const settingsOpen = useGameStore((s) => s.settingsOpen);
  const cardsDrawerOpen = useGameStore((s) => s.cardsDrawerOpen);
  const sandboxOpen = useGameStore((s) => s.sandboxOpen);
  const phase = useGameStore((s) => s.phase);
  const phaseTimer = useGameStore((s) => s.phaseTimer);
  const roundNumber = useGameStore((s) => s.roundNumber);
  const winnerName = useGameStore((s) => s.winnerName);
  const matchChampionId = useGameStore((s) => s.matchChampionId);
  const mapId = useGameStore((s) => s.mapId);
  const gameMode = useGameStore((s) => s.gameMode);
  const cheatsEnabled = useGameStore((s) => s.cheatsEnabled);
  const moonGravity = useGameStore((s) => s.moonGravity);
  const bigHead = useGameStore((s) => s.bigHead);
  const godMode = useGameStore((s) => s.godMode);
  const infiniteMode = useGameStore((s) => s.infiniteMode);
  const humanCount = useGameStore((s) => s.humanCount);
  const botCount = useGameStore((s) => s.botCount);
  const hasDummy = useGameStore((s) => s.hasDummy);
  const isAlive = useGameStore((s) => s.isAlive);
  const kills = useGameStore((s) => s.kills);
  const score = useGameStore((s) => s.score);
  const ownedCards = useGameStore((s) => s.ownedCards);
  const matchStandings = useGameStore((s) => s.matchStandings);
  const hitmarkerUntil = useGameStore((s) => s.hitmarkerUntil);
  const hitmarkerKill = useGameStore((s) => s.hitmarkerKill);
  const setLobbyOpen = useGameStore((s) => s.setLobbyOpen);
  const setSettingsOpen = useGameStore((s) => s.setSettingsOpen);
  const setSandboxOpen = useGameStore((s) => s.setSandboxOpen);
  const toggleScoreboard = useGameStore((s) => s.toggleScoreboard);
  const toggleCardsDrawer = useGameStore((s) => s.toggleCardsDrawer);
  const toggleSandbox = useGameStore((s) => s.toggleSandbox);

  const showTouchControls = useSettingsStore((s) => s.showTouchControls);
  const [hitmarkerActive, setHitmarkerActive] = useState(false);

  useCheatCodeListener(cheatsEnabled && status === "connected", sendCheatCommand);

  useEffect(() => {
    const remaining = hitmarkerUntil - performance.now();
    if (remaining <= 0) {
      setHitmarkerActive(false);
      return;
    }
    setHitmarkerActive(true);
    const timer = setTimeout(() => setHitmarkerActive(false), remaining);
    return () => clearTimeout(timer);
  }, [hitmarkerUntil]);

  const inArena =
    status === "connected" &&
    !lobbyOpen &&
    !settingsOpen &&
    !sandboxOpen &&
    phase !== "drafting" &&
    phase !== "match_over";
  const isAliveInArena = inArena && isAlive;
  const modeCfg = getGameModeConfig(gameMode);
  const showPracticeButton = inArena && phase === "lobby" && humanCount === 1 && !hasDummy;
  const activeMap = getArenaMap(mapId);
  const nextMap = getArenaMap(getNextArenaMapId(mapId));
  const champion =
    matchStandings.find((p) => p.sessionId === matchChampionId) ?? matchStandings[0] ?? null;

  let phaseHeading = `LOBBY • ${activeMap.name.toUpperCase()}`;
  let phaseSubtext = "Waiting for players (2+ to start)";
  if (phase === "countdown") {
    phaseHeading = `ROUND ${roundNumber} • ${activeMap.name.toUpperCase()}`;
    phaseSubtext = `Starting in ${Math.max(1, Math.ceil(phaseTimer))}...`;
  } else if (phase === "combat") {
    phaseHeading = `ROUND ${roundNumber} • ${activeMap.name.toUpperCase()}`;
    phaseSubtext = isAlive ? "Eliminate opponents!" : "Eliminated — Spectating";
  } else if (phase === "round_over") {
    phaseHeading = "ROUND OVER";
    phaseSubtext = `${winnerName ? `Winner: ${winnerName}` : "Draw"} • Draft in ${Math.max(1, Math.ceil(phaseTimer))}s`;
  } else if (phase === "drafting") {
    phaseHeading = `ROUND ${roundNumber} — CARD DRAFT`;
    phaseSubtext = `Choose upgrade (${Math.max(0, Math.ceil(phaseTimer))}s)`;
  }

  return (
    <div className={`hud-layer ${showTouchControls ? "hud-layer--touch" : ""}`}>
      <ConnectionBadge />
      <KillstreakBanner />

      {/* Top-Right Toolbar */}
      <div className="hud-top-right">
        {status === "connected" && <HudVoiceToolbar />}
        {status === "connected" && cheatsEnabled && (
          <button
            type="button"
            className={`hud-top-btn ${sandboxOpen ? "hud-top-btn--active" : ""}`}
            aria-expanded={sandboxOpen}
            onClick={() => toggleSandbox()}
          >
            Sandbox / Cheats
          </button>
        )}
        {status === "connected" && (
          <button
            type="button"
            className={`hud-top-btn ${cardsDrawerOpen ? "hud-top-btn--active" : ""}`}
            aria-expanded={cardsDrawerOpen}
            onClick={() => toggleCardsDrawer()}
          >
            My Cards ({ownedCards.length})
          </button>
        )}
        <button
          type="button"
          className="hud-top-btn"
          onClick={() => {
            setSettingsOpen(false);
            setSandboxOpen(false);
            setLobbyOpen(true);
          }}
        >
          Menu
        </button>
        <button type="button" className="hud-top-btn" onClick={() => setSettingsOpen(true)}>
          Settings
        </button>
      </div>

      {/* Top-Center Round / Phase Banner */}
      {status === "connected" && phase !== "drafting" && phase !== "match_over" && (
        <section className="hud-top-center" aria-label="Match status">
          <div className="hud-phase-pill">
            <span className="hud-phase-title">{phaseHeading}</span>
            <span className="hud-phase-sub">{phaseSubtext}</span>
            <button type="button" className="hud-score-btn" onClick={() => toggleScoreboard()}>
              Score: {score}/{modeCfg.winScore} • Kills: {kills} {showTouchControls ? "(Tap)" : "(Tab)"}
            </button>
          </div>
          <HudModeBanner />

          {showPracticeButton && (
            <button
              type="button"
              className="hud-practice-btn"
              onClick={() => sendStartSoloPractice()}
            >
              Practice vs Smart Bot
            </button>
          )}
          {inArena && cheatsEnabled && botCount > 0 && botCount < MAX_COMBAT_BOTS && (
            <button type="button" className="hud-practice-btn" onClick={() => sendAddBot()}>
              Add Bot (+1) ({botCount}/{MAX_COMBAT_BOTS})
            </button>
          )}
        </section>
      )}

      {/* Center Crosshair */}
      {isAliveInArena && (
        <div
          aria-hidden="true"
          className={`crosshair ${hitmarkerActive ? "crosshair--hit" : ""} ${hitmarkerActive && hitmarkerKill ? "crosshair--kill" : ""}`}
        >
          <span className="crosshair-line crosshair-line--top" />
          <span className="crosshair-line crosshair-line--bottom" />
          <span className="crosshair-line crosshair-line--left" />
          <span className="crosshair-line crosshair-line--right" />
          <span className="crosshair-dot" />
        </div>
      )}

      {isAliveInArena && !isPointerLocked && !showTouchControls && (
        <div className="hud-hint">
          Click arena to aim • WASD Move • Space Jump • Shift/RMB Dash • LMB Fire • V/E/MMB Melee • G/Q Grenade • C Quick Chat • Enter Chat • Tab Scoreboard
        </div>
      )}

      {isAliveInArena && <HudCombatBar />}

      <QuickChatWheel
        enabled={inArena}
        showTouchButton={showTouchControls}
        onSelectCallout={sendQuickChat}
      />
      <TextChatBox
        enabled={status === "connected" && !lobbyOpen && !settingsOpen && !sandboxOpen}
        showTouchControls={showTouchControls}
        onSendChat={sendChatMessage}
        onToggleMic={() => void toggleVoiceConnection()}
        onToggleMute={() => voiceChatManager.setMuted(!voiceChatManager.isMuted())}
        onTogglePtt={() => voiceChatManager.setPushToTalkMode(!commsStore.getState().pttEnabled)}
      />
      <SpectatorOverlay />
      <TouchControls />
      <MyCardsDrawer />
      <SandboxDrawer
        cheatsEnabled={cheatsEnabled}
        isOpen={sandboxOpen}
        onClose={() => setSandboxOpen(false)}
        godMode={godMode}
        infiniteMode={infiniteMode}
        moonGravity={moonGravity}
        bigHead={bigHead}
        botCount={botCount}
        ownedCards={ownedCards}
        onSendCheat={sendCheatCommand}
        onGrantCard={sendSandboxGrantCard}
        onAddBot={sendAddBot}
      />
      <CardDraftOverlay />
      <MatchVictoryOverlay
        visible={status === "connected" && phase === "match_over" && !lobbyOpen}
        champion={champion}
        standings={matchStandings}
        nextMapName={nextMap.name}
        onPlayAgain={sendPlayAgain}
        onReturnLobby={() => setLobbyOpen(true)}
      />
      <ScoreboardOverlay />
      <LobbyOverlay />
      <SettingsDrawer />
    </div>
  );
}
