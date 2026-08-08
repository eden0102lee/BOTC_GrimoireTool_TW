/**
 * Unified battle-log text formatting (natural Chinese).
 * Player: 暱稱【號碼.角色】  or hidden: 【號碼.角色】
 */

import gameSetupTable from "../game.json";
import { alignmentLabel } from "./teamTerms";

export function baseOutsiderCountForPlayers(playerCount) {
  const n = Number(playerCount);
  if (!Number.isFinite(n) || n < 5) return null;
  const row = (gameSetupTable || []).find(
    (r) =>
      r.townsfolk + r.outsider + r.minion + r.demon === n,
  );
  return row ? row.outsider : null;
}

export function baronOutsiderBonus(players) {
  if (!players || !players.length) return 0;
  return players.filter(
    (p) =>
      p &&
      p.role &&
      String(p.role.id || "").toLowerCase() === "baron",
  ).length * 2;
}

/** Unique outsider role names currently on the grimoire (role / disguiseRole). */
export function outsiderRolesInPlayLabel(roles, players) {
  const roleById = new Map();
  (roles || []).forEach((r) => {
    if (r && r.id) roleById.set(String(r.id).toLowerCase(), r);
  });
  const ids = new Set();
  (players || []).forEach((p) => {
    if (p && p.role && p.role.id) ids.add(String(p.role.id).toLowerCase());
    if (p && p.disguiseRole && p.disguiseRole.id) {
      ids.add(String(p.disguiseRole.id).toLowerCase());
    }
  });
  const names = [];
  ids.forEach((id) => {
    const r = roleById.get(id);
    if (r && String(r.team || "").toLowerCase() === "outsider") {
      names.push(r.name || r.id);
    }
  });
  names.sort((a, b) => String(a).localeCompare(String(b), "zh"));
  if (!names.length) return "（無）";
  return names.map((n) => `[${n}]`).join(" ");
}

export function formatSeatNumber(seatIndex) {
  const n = (seatIndex != null ? seatIndex : 0) + 1;
  return String(n).padStart(2, "0");
}

export function formatPlayerLabel(player, seatIndex, options = {}) {
  const hideNickname = !!options.hideNickname;
  const seat = formatSeatNumber(seatIndex);
  const roleName =
    player && player.role && (player.role.name || player.role.id)
      ? player.role.name || player.role.id
      : "未指派";
  const core = `${seat}.${roleName}`;
  if (hideNickname) {
    return `【${core}】`;
  }
  const name =
    (player && player.name) ||
    (seatIndex != null ? `${seat}號` : "未知");
  return `${name}【${core}】`;
}

/** Extract 【NN.角色】 core from a player label. */
export function playerLabelCore(label) {
  if (!label) return "【?】";
  const match = String(label).match(/(【\d{2}\.[^】]+】)/);
  if (match) return match[1];
  return `【${label}】`;
}

export function countAlivePlayers(players) {
  return (players || []).filter((p) => p && !p.isDead).length;
}

export function voteMajorityThreshold(players) {
  const alive = countAlivePlayers(players);
  return Math.ceil(alive / 2);
}

export function voterSeatNumbers(players, voterLabels) {
  const seats = [];
  (voterLabels || []).forEach((lab) => {
    const idx = resolvePlayerIndex(players, lab);
    if (idx >= 0) seats.push(idx + 1);
  });
  return seats;
}

export function resolvePlayerIndex(players, labelOrName) {
  if (!labelOrName || !players || !players.length) return -1;
  const target = String(labelOrName).trim();
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const lab = formatPlayerLabel(p, i);
    if (lab === target || p.name === target) return i;
    const roleName =
      p.role && (p.role.name || p.role.id)
        ? p.role.name || p.role.id
        : "未指派";
    const legacy = `${p.name}[${roleName}]`;
    if (legacy === target) return i;
  }
  const seatMatch = target.match(/【(\d{1,2})\./);
  if (seatMatch) {
    const seat = parseInt(seatMatch[1], 10);
    if (seat >= 1 && seat <= players.length) return seat - 1;
  }
  return -1;
}

export function formatVoteMessage(nominatorLabel, nomineeLabel, voteCount, voterSeats) {
  const nee = playerLabelCore(nomineeLabel);
  if (!voteCount) {
    return `${nominatorLabel}提名${nee}無同意票`;
  }
  const seatList = (voterSeats || []).join(" ");
  return `${nominatorLabel}提名${nee}共${voteCount}票，同意票為[${seatList}]`;
}

export function formatVoteScaffoldLine(nomineeLabel) {
  return `${nomineeLabel}上處刑台`;
}

export function formatScaffoldEmptyMessage() {
  return "處刑台上沒有人";
}

/**
 * Resolve execution scaffold from all nominations in the voting day.
 * Leader must have strictly highest votes among nominees and meet >= ceil(alive/2).
 * Ties at the top (including meeting threshold) clear the scaffold.
 */
export function resolveDayScaffold(votes, players) {
  const threshold = voteMajorityThreshold(players);
  const list = (votes || []).filter(
    (v) => v && v.nominee && (v.voteCount || 0) > 0,
  );
  if (!list.length) {
    return { nominee: null, message: "", empty: true, hasVotes: false };
  }

  const maxCount = Math.max(...list.map((v) => v.voteCount));
  if (maxCount < threshold) {
    return {
      nominee: null,
      message: formatScaffoldEmptyMessage(),
      empty: true,
      hasVotes: true,
    };
  }

  const leaders = list.filter((v) => v.voteCount === maxCount);
  const uniqueNominees = [...new Set(leaders.map((v) => v.nominee))];
  if (uniqueNominees.length === 1) {
    const nominee = uniqueNominees[0];
    return {
      nominee,
      message: formatVoteScaffoldLine(nominee),
      empty: false,
      hasVotes: true,
    };
  }

  return {
    nominee: null,
    message: formatScaffoldEmptyMessage(),
    empty: true,
    hasVotes: true,
  };
}

/** Dead voters who still have a ghost vote (isDead && !isVoteless). */
export function eligibleDeadVotersFromLabels(players, voterLabels) {
  return (voterLabels || []).filter((label) => {
    const idx = resolvePlayerIndex(players, label);
    if (idx < 0) return false;
    const p = players[idx];
    return p && p.isDead && !p.isVoteless;
  });
}

/** Stable key for comparing scaffold states (null = no scaffold line yet). */
export function scaffoldStateKey(result) {
  if (!result || !result.hasVotes) return null;
  if (result.empty || !result.nominee) return "__empty__";
  return result.nominee;
}

/**
 * Build scaffold state changes across a voting day.
 * No entries until the first player actually stands on the scaffold.
 */
export function scaffoldEntriesFromVotes(votes, players) {
  const cumulative = [];
  let prevKey = null;
  let everOccupied = false;
  const entries = [];

  (votes || []).forEach((vote, voteIndex) => {
    cumulative.push({
      nominee: vote.nominee,
      voteCount: vote.voteCount,
    });
    const result = resolveDayScaffold(cumulative, players);
    if (!result.hasVotes) return;
    const key = scaffoldStateKey(result);

    if (!everOccupied) {
      if (result.empty || !result.nominee) return;
      everOccupied = true;
      prevKey = key;
      entries.push({ result, voteIndex });
      return;
    }

    if (key === prevKey) return;
    prevKey = key;
    entries.push({ result, voteIndex });
  });

  return entries;
}

/** Latest scaffold message for preview (respects first-occupant rule). */
export function currentScaffoldMessage(votes, players) {
  const entries = scaffoldEntriesFromVotes(votes, players);
  if (!entries.length) return "";
  return entries[entries.length - 1].result.message;
}

export function formatExecutionMessage(playerLabel, died) {
  if (died) {
    return `${playerLabel}被處決 死亡`;
  }
  return `${playerLabel}被處決 沒有死亡`;
}

export function formatNoExecutionMessage() {
  return "無人處決";
}

export function formatAlivePlayersLine(players) {
  const alive = (players || [])
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p && !p.isDead)
    .map(({ i }) => i + 1);
  return `存活玩家:${alive.join(" ")}`;
}

function labelForKey(players, formData, key) {
  const val = formData && formData[key];
  if (val == null || String(val).trim() === "") return null;
  const idx = resolvePlayerIndex(players, String(val));
  if (idx >= 0) return formatPlayerLabel(players[idx], idx);
  return String(val);
}

function effectPlayerLabel(players, playerIndex) {
  if (playerIndex >= 0 && players && players[playerIndex]) {
    return formatPlayerLabel(players[playerIndex], playerIndex);
  }
  return `座位 ${(playerIndex || 0) + 1}`;
}

/**
 * Resolve short action verb. Default is 選擇 (never 使用能力).
 * When action is still generic, upgrade from effects (preferred) or template.
 * If `effects` is passed (even []), only applied effects may upgrade the verb.
 */
export function resolveActionVerb(rule, effects) {
  let action = (rule && rule.sentence && rule.sentence.action) || "選擇";
  if (action === "使用能力") action = "選擇";

  if (action !== "選擇") return action;

  const template = (rule && rule.sentence && rule.sentence.template) || "";
  const fromApplied = effects !== undefined;
  const effectList = fromApplied ? effects || [] : (rule && rule.effects) || [];

  const reminderName = (e) =>
    e.reminderName || (e.reminder && e.reminder.name) || "";

  if (
    effectList.some(
      (e) => e.type === "addReminder" && reminderName(e) === "中毒",
    ) ||
    (!fromApplied && template.includes("中毒"))
  ) {
    return "投毒";
  }
  if (
    effectList.some((e) => e.type === "setDead" && e.value !== false) ||
    (!fromApplied && template.includes("死亡"))
  ) {
    return "殺害";
  }
  if (
    effectList.some(
      (e) => e.type === "addReminder" && reminderName(e) === "保護",
    ) ||
    (!fromApplied && template.includes("保護"))
  ) {
    return "保護";
  }
  return "選擇";
}

/**
 * Result lines from applied grimoire effects (└ …).
 * Skips redundant「死亡」reminders when setDead already covers the seat.
 */
export function formatEffectResultLines(effects, players) {
  const list = effects || [];
  const deadSeats = new Set();
  list.forEach((e) => {
    if (e.type === "setDead" && e.value !== false) {
      deadSeats.add(e.playerIndex);
    }
  });

  const lines = [];
  const seen = new Set();

  list.forEach((e) => {
    const label = effectPlayerLabel(players, e.playerIndex);
    let text = null;
    switch (e.type) {
      case "setDead":
        text = e.value === false ? `${label}復活` : `${label}死亡`;
        break;
      case "setRevive":
        text = `${label}復活`;
        break;
      case "setAbilityLost":
        text = `${label}失去能力`;
        break;
      case "addReminder": {
        const name =
          (e.reminder && e.reminder.name) || e.reminderName || "";
        if (!name) break;
        if (name === "死亡" && deadSeats.has(e.playerIndex)) break;
        text = `${label}${name}`;
        break;
      }
      case "setAlignment": {
        const align =
          alignmentLabel(e.alignment) || e.alignment || "?";
        text = `${label} 轉變為[${align}]`;
        break;
      }
      case "removeReminder": {
        const name =
          (e.reminder && e.reminder.name) || e.reminderName || "";
        if (!name) break;
        text = `${label}移除${name}`;
        break;
      }
      case "logLine": {
        const suffix = String(e.text || "").trim();
        if (!suffix) break;
        text = `${label}${suffix}`;
        break;
      }
      default:
        break;
    }
    if (text && !seen.has(text)) {
      seen.add(text);
      lines.push(`└ ${text}`);
    }
  });

  return lines;
}

function joinPlayerLabels(...labels) {
  return labels.filter(Boolean).join(" ");
}

function fixedResultLines(rule) {
  const fixed =
    (rule && rule.sentence && rule.sentence.fixedResults) || [];
  return fixed
    .filter((t) => t != null && String(t).trim() !== "")
    .map((t) => {
      const s = String(t).trim();
      return s.startsWith("└") ? s : `└ ${s}`;
    });
}

/**
 * Build concise role-action message: main line + optional └ result lines.
 * Style: short verb + targets; no「對／導致／使用能力」padding.
 */
export function buildNaturalRoleMessage(rule, { players, actorIndex, formData, effects, roleOptions }) {
  if (!rule) return "";
  const actor =
    actorIndex >= 0 && players[actorIndex]
      ? formatPlayerLabel(players[actorIndex], actorIndex)
      : rule.name || rule.id || "";
  const action = resolveActionVerb(rule, effects);
  const fd = formData || {};
  const template = (rule.sentence && rule.sentence.template) || "";
  const roleId = String(rule.id || "").toLowerCase();

  let main = "";

  // Soldier: 惡魔選擇了 {target} / └ 無效
  if (
    roleId === "soldier" ||
    (template.includes("惡魔選擇了") && fd.target)
  ) {
    const t = labelForKey(players, fd, "target") || fd.target;
    main = `惡魔選擇了${t}`;
  } else if (roleId === "mayor" && fd.scenario) {
    if (String(fd.scenario).includes("三人")) {
      const align = fd.align || "善良";
      main = `三人存活且白天無處決，${actor}帶領[${align}]陣營獲勝`;
    } else {
      main = `${actor}即將死亡`;
    }
  } else if (roleId === "saint" || template.includes("死於處決")) {
    const align = fd.align || "善良";
    main = `${actor}死於處決，[${align}]陣營落敗`;
  } else if (
    roleId === "virgin" ||
    (fd.nominator && (action === "提名" || template.includes("提名")))
  ) {
    const nom = labelForKey(players, fd, "nominator");
    main = `${nom}提名 ${actor}`;
  } else if (
    roleId === "goon" ||
    (template.includes("被 {target} 選擇") && fd.target)
  ) {
    const t = labelForKey(players, fd, "target") || fd.target;
    main = `${actor} 被 ${t} 選擇`;
  } else if (action === "成為" || template.includes("成為[")) {
    if (fd.r1) main = `${actor}成為[${fd.r1}]`;
    else main = `${actor}成為惡魔`;
  } else if (action === "是" || /是\[/.test(template)) {
    let subject = actor;
    const p1Idx =
      fd.p1 != null && String(fd.p1).trim() !== ""
        ? resolvePlayerIndex(players, fd.p1)
        : actorIndex;
    const p =
      p1Idx >= 0 && players[p1Idx] ? players[p1Idx] : null;
    if (p && fd.r1) {
      subject = formatPlayerLabel(
        { ...p, role: { ...(p.role || {}), name: fd.r1 } },
        p1Idx,
      );
    } else if (fd.p1) {
      subject = labelForKey(players, fd, "p1");
    } else if (fd.r1 && actorIndex >= 0 && players[actorIndex]) {
      const ap = players[actorIndex];
      subject = formatPlayerLabel(
        { ...ap, role: { ...(ap.role || {}), name: fd.r1 } },
        actorIndex,
      );
    }
    const roleMatch = template.match(/\[([^\]]+)\]/);
    const roleName =
      roleMatch && roleMatch[1]
        ? roleMatch[1]
        : roleId === "marionette"
          ? "提線木偶"
          : "酒鬼";
    main = `${subject}是[${roleName}]`;
  } else if (
    roleId === "godfather" &&
    (String(rule.cardLabel || rule.label || "").toLowerCase() === "firstnight" ||
      template.includes("外來者："))
  ) {
    const manual =
      fd.note && String(fd.note).trim() ? String(fd.note).trim() : "";
    const list = manual || outsiderRolesInPlayLabel(roleOptions, players);
    main = `${actor}得知 → 外來者：${list}`;
  } else if (
    roleId === "baron" ||
    template.includes("外來者人數")
  ) {
    const base = baseOutsiderCountForPlayers(players.length);
    const bonus = baronOutsiderBonus(players);
    const nPart = base != null ? String(base) : "n";
    main =
      bonus > 0
        ? `本局外來者人數為 ${nPart} +${bonus}`
        : `本局外來者人數為 ${nPart}`;
  } else if (
    action === "始終將" ||
    template.includes("始終將")
  ) {
    const p1 = labelForKey(players, fd, "p1");
    main = `${actor}始終將 ${p1 || "—"} 視為惡魔`;
  } else if (
    (action === "得知" || template.includes("死亡後")) &&
    template.includes("死亡後") &&
    fd.p1 &&
    fd.p2
  ) {
    const p1 = labelForKey(players, fd, "p1");
    const p2 = labelForKey(players, fd, "p2");
    main = `${actor}死亡後得知 ${joinPlayerLabels(p1, p2)}其中一位是惡魔`;
  } else if (
    (action === "得知" || template.includes("死亡後")) &&
    template.includes("死亡後") &&
    fd.target
  ) {
    const t = labelForKey(players, fd, "target");
    main = `${actor}死亡後得知 ${t}`;
  } else if (
    (action === "得知" || template.includes("今日處決")) &&
    template.includes("今日處決") &&
    fd.r1
  ) {
    main = `${actor}得知 今日處決 [${fd.r1}]`;
  } else if (
    fd.p1 &&
    fd.p2 &&
    fd.num != null &&
    String(fd.num).trim() !== ""
  ) {
    const p1 = labelForKey(players, fd, "p1");
    const p2 = labelForKey(players, fd, "p2");
    main = `${actor}得知 ${joinPlayerLabels(p1, p2)}中有 [${fd.num}] 位因自身能力醒來`;
  } else if (action === "得知" && fd.num != null && String(fd.num).trim() !== "") {
    main = `${actor}得知 [${fd.num}]`;
  } else if (fd.res && String(fd.res).trim() !== "") {
    const res = String(fd.res).replace(/\s*\(.*\)\s*$/, "").trim();
    if (fd.p1 && fd.p2) {
      const p1 = labelForKey(players, fd, "p1");
      const p2 = labelForKey(players, fd, "p2");
      main = `${actor}查驗 ${joinPlayerLabels(p1, p2)}得知 [${res}]`;
    } else {
      main = `${actor}得知 [${res}]`;
    }
  } else if (fd.p1 && fd.p2 && fd.r1) {
    const p1 = labelForKey(players, fd, "p1");
    const p2 = labelForKey(players, fd, "p2");
    main = `${actor}得知 ${joinPlayerLabels(p1, p2)}其中一位是 [${fd.r1}]`;
  } else if (fd.p1 && fd.p2 && fd.p3) {
    const p1 = labelForKey(players, fd, "p1");
    const p2 = labelForKey(players, fd, "p2");
    const p3 = labelForKey(players, fd, "p3");
    main = `${actor}${action} ${joinPlayerLabels(p1, p2, p3)}`;
  } else if (fd.p1 && fd.p2 && !fd.r1) {
    const p1 = labelForKey(players, fd, "p1");
    const p2 = labelForKey(players, fd, "p2");
    main = `${actor}${action} ${joinPlayerLabels(p1, p2)}`;
  } else if (fd.p1 && fd.r1 && fd.r2) {
    const p1 = labelForKey(players, fd, "p1");
    main = `${actor}${action} ${p1} [${fd.r1}] / [${fd.r2}]`;
  } else if (fd.p1 && fd.r1) {
    const p1 = labelForKey(players, fd, "p1");
    main = `${actor}${action} ${p1} [${fd.r1}]`;
  } else if (fd.target && fd.r1) {
    const t = labelForKey(players, fd, "target") || fd.target;
    main =
      action === "猜測"
        ? `${actor}${action} ${t} 是 [${fd.r1}]`
        : `${actor}${action} ${t} [${fd.r1}]`;
  } else if (fd.target) {
    const t = labelForKey(players, fd, "target") || fd.target;
    main = action ? `${actor}${action} ${t}` : `${actor}${t}`;
  } else if (fd.r1) {
    main = action ? `${actor}${action} [${fd.r1}]` : `${actor}[${fd.r1}]`;
  } else if (fd.word) {
    main = `${actor}${action} [${fd.word}]`;
  } else if (fd.note && String(fd.note).trim() !== "") {
    main = `${actor}${action} [${fd.note}]`;
  } else if (action === "查看魔典" || template.includes("查看魔典")) {
    main = `${actor}查看魔典`;
  } else {
    main = action ? `${actor}${action}` : actor;
  }

  const resultLines = [];
  if (!rule || rule.activation !== "setup") {
    resultLines.push(...formatEffectResultLines(effects, players));
  }
  resultLines.push(...fixedResultLines(rule));

  // Virgin skill-card wording: └ …被處決死亡
  if (roleId === "virgin") {
    for (let i = 0; i < resultLines.length; i++) {
      resultLines[i] = resultLines[i].replace(/^(└ .+?)死亡$/, "$1被處決死亡");
    }
  }

  if (!resultLines.length) return main;
  // Deduplicate identical └ lines
  const seen = new Set();
  const uniq = resultLines.filter((line) => {
    if (seen.has(line)) return false;
    seen.add(line);
    return true;
  });
  return [main, ...uniq].join("\n");
}

export function formatEntryForDisplay(entry, options = {}) {
  const hideNickname = !!options.hideNickname;
  if (!entry) return "";
  if (entry.message) {
    if (!hideNickname) return entry.message;
    return stripNicknamesFromMessage(entry.message);
  }
  return "";
}

/** Action words that may sit immediately before a nominee 【NN.role】 bracket. */
const ACTION_BEFORE_LABEL =
  /^(提名|查驗|得知|保護|投毒|殺害|獵殺|槍殺|成為|選擇|被處決|使用|投票|查看魔典|死亡後得知)$/;

/** Hide nickname segments in stored messages for preview/export. */
export function stripNicknamesFromMessage(text) {
  if (!text || typeof text !== "string") return text;
  return text.replace(
    /([^\s【】\[]+)【(\d{2}\.[^】]+)】/g,
    (match, prefix, core) => {
      if (ACTION_BEFORE_LABEL.test(prefix)) return match;
      return `【${core}】`;
    },
  );
}
