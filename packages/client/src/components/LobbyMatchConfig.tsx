import {
  BOT_DIFFICULTY_PROFILES,
  GAME_MODE_CONFIGS,
  getGameModeConfig,
  type BotDifficulty,
  type GameMode,
} from "@upgun/shared";

export interface LobbyMatchConfigProps {
  gameMode: GameMode;
  botDifficulty: BotDifficulty;
  disabled?: boolean;
  onSelectGameMode: (mode: GameMode) => void;
  onSelectBotDifficulty: (difficulty: BotDifficulty) => void;
}

export function LobbyMatchConfig({
  gameMode,
  botDifficulty,
  disabled = false,
  onSelectGameMode,
  onSelectBotDifficulty,
}: LobbyMatchConfigProps) {
  const activeModeCfg = getGameModeConfig(gameMode);

  return (
    <div className="lobby-mode-box">
      <div className="field-group">
        <span className="field-label">Game Mode</span>
        <div className="mode-pill-grid" role="radiogroup" aria-label="Game Mode">
          {GAME_MODE_CONFIGS.map((cfg) => {
            const selected = gameMode === cfg.id;
            return (
              <button
                key={cfg.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={disabled}
                className={`mode-pill ${selected ? "mode-pill--active" : ""}`}
                onClick={() => onSelectGameMode(cfg.id)}
              >
                <span aria-hidden="true">{cfg.icon}</span>
                <span>{cfg.name}</span>
              </button>
            );
          })}
        </div>
        <p className="mode-desc">{activeModeCfg.shortDesc}</p>
      </div>

      <div className="field-group">
        <label htmlFor="lobby-bot-difficulty" className="field-label">
          Bot Difficulty
        </label>
        <select
          id="lobby-bot-difficulty"
          className="text-input mode-select"
          value={botDifficulty}
          disabled={disabled}
          onChange={(e) => onSelectBotDifficulty(e.target.value as BotDifficulty)}
        >
          {BOT_DIFFICULTY_PROFILES.map((prof) => (
            <option key={prof.id} value={prof.id}>
              {prof.name} ({prof.reactionLagMs}ms reaction • ±{prof.aimSpreadDeg}° spread)
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
