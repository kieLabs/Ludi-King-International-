(function(){
'use strict';
const GLOBAL_BOT_NAMES = [
  "Liam Smith", "Noah Johnson", "Oliver Brown", "Elijah Jones", "James Garcia",
  "William Miller", "Benjamin Davis", "Lucas Rodriguez", "Henry Martinez", "Alexander Hernandez",
  "Mason Lopez", "Michael Gonzalez", "Ethan Wilson", "Daniel Anderson", "Jacob Thomas",
  "Logan Taylor", "Jackson Moore", "Levi Jackson", "Sebastian Martin", "Mateo Lee",
  "Jack Perez", "Owen Thompson", "Theodore White", "Aiden Harris", "Samuel Sanchez",
  "Joseph Clark", "John Ramirez", "David Lewis", "Wyatt Robinson", "Matthew Walker",
  "Luke Young", "Asher Allen", "Carter King", "Julian Wright", "Grayson Scott",
  "Leo Torres", "Jayden Nguyen", "Gabriel Hill", "Isaac Flores", "Lincoln Green",
  "Anthony Adams", "Hudson Nelson", "Dylan Baker", "Ezra Hall", "Thomas Rivera",
  "Charles Campbell", "Christopher Mitchell", "Jaxon Carter", "Maverick Roberts", "Josiah Gomez"
];
const RANDOM_BOT_MESSAGES = [
  "Nice move! 👍", "Good game everyone!", "Haha let's see what happens!", 
  "Well played!", "Careful with that token 😉", "Need a 6 badly right now!"
];
const GLOBAL_COUNTRIES = [
  {name:"United States", flag:"🇺🇸", code:"US"},
  {name:"United Kingdom", flag:"🇬🇧", code:"GB"},
  {name:"India", flag:"🇮🇳", code:"IN"},
  {name:"Canada", flag:"🇨🇦", code:"CA"},
  {name:"Australia", flag:"🇦🇺", code:"AU"},
  {name:"Germany", flag:"🇩🇪", code:"DE"},
  {name:"France", flag:"🇫🇷", code:"FR"},
  {name:"United Arab Emirates", flag:"🇦🇪", code:"AE"},
  {name:"Singapore", flag:"🇸🇬", code:"SG"},
  {name:"Japan", flag:"🇯🇵", code:"JP"}
];
const COLORS = ['blue', 'red', 'green', 'yellow'];
const COLOR_NAMES = { blue:'Blue', red:'Red', green:'Green', yellow:'Yellow' };
const COLOR_HEX = { blue:'#2998df', red:'#ed1c24', green:'#10a953', yellow:'#f0c91b' };
const TRACK = [[6,0], [6,1], [6,2], [6,3], [6,4], [6,5], [5,6], [4,6], [3,6], [2,6], [1,6], [0,6], [0,7], [0,8], [1,8], [2,8], [3,8], [4,8], [5,8], [6,9], [6,10], [6,11], [6,12], [6,13], [6,14], [7,14], [8,14], [8,13], [8,12], [8,11], [8,10], [8,9], [9,8], [10,8], [11,8], [12,8], [13,8], [14,8], [14,7], [14,6], [13,6], [12,6], [11,6], [10,6], [9,6], [8,5], [8,4], [8,3], [8,2], [8,1], [8,0], [7,0]];
const START_INDEX = { red: 1, green: 14, yellow: 27, blue: 40 };
const SAFE = [1, 9, 14, 22, 27, 35, 40, 48];
const HOME_LANES = {
  green:[ [1,7], [2,7], [3,7], [4,7], [5,7] ],
  yellow:[ [7,13], [7,12], [7,11], [7,10], [7,9] ],
  blue:[ [13,7], [12,7], [11,7], [10,7], [9,7] ],
  red:[ [7,1], [7,2], [7,3], [7,4], [7,5] ]
};
const HOME_POS = {
  red:   [{t:10.2, l:10.2}, {t:10.2, l:29.8}, {t:29.8, l:10.2}, {t:29.8, l:29.8}],
  green: [{t:10.2, l:70.2}, {t:10.2, l:89.8}, {t:29.8, l:70.2}, {t:29.8, l:89.8}],
  blue:  [{t:70.2, l:10.2}, {t:70.2, l:29.8}, {t:89.8, l:10.2}, {t:89.8, l:29.8}],
  yellow:[{t:70.2, l:70.2}, {t:70.2, l:89.8}, {t:89.8, l:70.2}, {t:89.8, l:89.8}]
};
const lastDiceMemory = { blue: 1, red: 1, green: 1, yellow: 1 };
let players = [];
let current = 0;
let dice = 1;
let rolled = false;
let rolling = false;
let moving = false;
let sixCount = 0;
let started = false;
let turnTimer = null;
let turnSerial = 0;
let userProfile = null;
let totalCoins = 10000;
let entryFee = 500;
let ranks = [];
let audioCtx = null;
let currentMode = 'local';
let roomCode = null;
let roomWaitTimer = null;
let pendingFriendRequest = null;
let friendReqTimeout = null;

window.toggleFullScreen = function() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
  }
};

function playTone(type) {
  const toggle = document.getElementById('sfxToggle');
  if (toggle && !toggle.checked) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    if (type === 'roll') {
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'step') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(560, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
      osc.start(now); osc.stop(now + 0.05);
    }
  } catch(e){}
}

function getDiceHTML(val) {
  const dVal = (val >= 1 && val <= 6) ? val : 1;
  const d = {
    1: ['center-dot'],
    2: ['top-left', 'bottom-right'],
    3: ['top-left', 'center-dot', 'bottom-right'],
    4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    5: ['top-left', 'top-right', 'center-dot', 'bottom-left', 'bottom-right'],
    6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right']
  };
  let html = '';
  if (d[dVal]) d[dVal].forEach(pos => { html += `<div class="dot ${pos}"></div>`; });
  return html;
}

window.triggerEmojiFloat = function(emoji) {
  const container = document.getElementById('flyingEmojiBox');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'floating-emoji';
  el.textContent = emoji;
  const randomX = Math.floor(Math.random() * 60) + 20;
  el.style.left = randomX + 'vw';
  el.style.bottom = '120px';
  container.appendChild(el);
  setTimeout(() => el.remove(), 2800);
};

window.checkWordCount = function(input) {
  const words = (input.value || '').trim().split(/\s+/).filter(Boolean);
  const counter = document.getElementById('wordCounter');
  if (counter) counter.textContent = `${words.length} / 50 words`;
  if (words.length > 50) {
    input.value = words.slice(0, 50).join(' ');
    if (counter) counter.textContent = '50 / 50 words (Limit Reached)';
  }
};

window.sendChatMessage = function() {
  const input = document.getElementById('chatInput');
  const text = (input.value || '').trim();
  if (!text) return;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length > 50) {
    alert('Messages cannot exceed 50 words.');
    return;
  }
  appendChat(userProfile?.name || 'Player', text);
  input.value = '';
  document.getElementById('wordCounter').textContent = '0 / 50 words';
};

function appendChat(sender, msg) {
  const box = document.getElementById('chatMessages');
  if (!box) return;
  const d = document.createElement('div');
  d.className = 'chat-msg';
  d.innerHTML = `<b>${sender.replace(/[<>&]/g,'')}:</b> ${msg.replace(/[<>&]/g,'')}`;
  box.appendChild(d);
  box.scrollTop = box.scrollHeight;
  setTimeout(() => {
    d.classList.add('fade-out');
    setTimeout(() => d.remove(), 500);
  }, 30000);
}

function getLocalFriends() {
  try {
    return JSON.parse(localStorage.getItem('ludo_my_friends')) || [];
  } catch(e) { return []; }
}

function saveLocalFriend(friend) {
  const list = getLocalFriends();
  if (!list.some(f => f.name === friend.name)) {
    list.push(friend);
    localStorage.setItem('ludo_my_friends', JSON.stringify(list));
  }
}

window.openFriendsModal = function() {
  const list = getLocalFriends();
  const box = document.getElementById('friendsListEntries');
  box.innerHTML = '';
  if (!list.length) {
    box.innerHTML = '<div style="text-align:center; color:#9ec5e8; padding:20px;">No friends added yet. Tap an opponent in-game to add them!</div>';
  } else {
    list.forEach(f => {
      const row = document.createElement('div');
      row.className = 'friend-item-row';
      row.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <span>${f.avatar || '👤'}</span>
          <b>${f.name}</b>
        </div>
        <span style="color:#39ff14; font-size:12px;">Friend</span>
      `;
      box.appendChild(row);
    });
  }
  document.getElementById('friendsModal').classList.remove('hide');
};

window.openSettingsModal = function() {
  document.getElementById('settingsModal').classList.remove('hide');
};

window.openShareModal = function() {
  if (!roomCode) {
    roomCode = Math.floor(100000 + Math.random() * 900000).toString();
    document.getElementById('shareRoomCodeDisplay').textContent = roomCode;
  }
  document.getElementById('shareModal').classList.remove('hide');
};

window.promptAddFriend = function(color) {
  const target = players.find(p => p.color === color);
  if (!target || target.name === userProfile.name) return;
  
  if (confirm(`Send friend request to ${target.name}?`)) {
    setTimeout(() => {
      receiveFriendRequest(target.name, target.avatar);
    }, 2000);
  }
};

function receiveFriendRequest(name, avatar) {
  clearTimeout(friendReqTimeout);
  pendingFriendRequest = { name, avatar };
  const popup = document.getElementById('friendReqPopup');
  const fill = document.getElementById('friendReqFill');
  document.getElementById('friendReqMsg').textContent = `${name} sent you a Friend Request!`;
  
  popup.style.display = 'flex';
  fill.style.width = '100%';
  let count = 10;
  const interval = setInterval(() => {
    count--;
    fill.style.width = (count * 10) + '%';
    if (count <= 0) {
      clearInterval(interval);
      dismissFriendRequest(false);
    }
  }, 1000);
  friendReqTimeout = setTimeout(() => {
    clearInterval(interval);
    dismissFriendRequest(false);
  }, 10000);
}

window.dismissFriendRequest = function(accepted) {
  clearTimeout(friendReqTimeout);
  const popup = document.getElementById('friendReqPopup');
  popup.style.display = 'none';
  if (accepted && pendingFriendRequest) {
    saveLocalFriend(pendingFriendRequest);
    alert(`You and ${pendingFriendRequest.name} are now Friends! Saved to your device.`);
  }
  pendingFriendRequest = null;
};

function populateLivePanel() {
  const container = document.getElementById('botListContainer');
  if (!container) return;
  container.innerHTML = '';
  const realRow = document.createElement('div');
  realRow.className = 'bot-row real-player';
  realRow.innerHTML = `
    <div style="display:flex; align-items:center; gap:8px;">
      <span>${userProfile?.avatar || '👨'}</span>
      <b>${userProfile?.name || 'You'} ${userProfile?.flag || '🇺🇸'}</b>
      <span style="font-size:10px; background:#087a38; padding:2px 6px; border-radius:4px;">YOU</span>
    </div>
    <span style="color:#ffd21f; font-weight:bold;">${totalCoins.toLocaleString()} 💰</span>
  `;
  container.appendChild(realRow);
  GLOBAL_BOT_NAMES.forEach((name, i) => {
    const row = document.createElement('div');
    row.className = 'bot-row';
    const flag = GLOBAL_COUNTRIES[i % GLOBAL_COUNTRIES.length].flag;
    const coins = 12000 + (i * 350);
    row.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span>👤</span>
        <span>${name} ${flag}</span>
      </div>
      <span style="color:#9ec5e8;">${coins.toLocaleString()} 💰</span>
    `;
    container.appendChild(row);
  });
}

window.simulateWatchAd = function() {
  const btn = document.querySelector('.ad-banner-btn');
  btn.innerText = 'Loading Ad...';
  setTimeout(() => {
    totalCoins += 10000;
    localStorage.setItem('ludoCoins', totalCoins);
    syncCoinDisplays();
    btn.innerHTML = '<span>📺 Watch Video Ad &amp; Earn +10,000 Coins 💰</span>';
    alert('You received 10,000 💰 bonus coins!');
    populateLivePanel();
  }, 1000);
};

window.openProfileModal = function() {
  document.getElementById('pName').value = userProfile.name;
  document.getElementById('pAge').value = userProfile.age;
  document.getElementById('pGender').value = userProfile.gender;
  document.getElementById('pAvatar').value = userProfile.avatar;
  const select = document.getElementById('pCountry');
  select.innerHTML = '';
  GLOBAL_COUNTRIES.forEach(c => {
    const opt = document.createElement('option');
    opt.value = `${c.code}|${c.flag}`;
    opt.textContent = `${c.flag} ${c.name}`;
    if (userProfile.flag === c.flag) opt.selected = true;
    select.appendChild(opt);
  });
  document.getElementById('profileModal').classList.remove('hide');
};

window.saveProfile = function() {
  userProfile = {
    name: (document.getElementById('pName').value || 'Player 1').trim().slice(0, 15),
    avatar: document.getElementById('pAvatar').value,
    flag: document.getElementById('pCountry').value.split('|')[1],
    age: Math.max(1, parseInt(document.getElementById('pAge').value || 21, 10)),
    gender: document.getElementById('pGender').value
  };
  localStorage.setItem('ludoProfile', JSON.stringify(userProfile));
  applyProfileUI();
  document.getElementById('profileModal').classList.add('hide');
  populateLivePanel();
};

function applyProfileUI() {
  document.getElementById('homeNameView').textContent = userProfile.name;
  document.getElementById('homeAvatarView').textContent = userProfile.avatar;
}

function syncCoinDisplays() {
  document.getElementById('homeCoinView').textContent = totalCoins.toLocaleString();
  document.getElementById('gameCoinView').textContent = totalCoins.toLocaleString();
}

window.startPlayWithFriends = function() {
  roomCode = Math.floor(100000 + Math.random() * 900000).toString();
  document.getElementById('shareRoomCodeDisplay').textContent = roomCode;
  document.getElementById('shareModal').classList.remove('hide');
  clearTimeout(roomWaitTimer);
  let secondsLeft = 60;
  roomWaitTimer = setInterval(() => {
    secondsLeft--;
    const note = document.getElementById('roomTimerNote');
    if (note) note.textContent = `Game starts automatically in ${secondsLeft}s with joined players!`;
    if (secondsLeft <= 0) {
      clearInterval(roomWaitTimer);
      startFriendRoomNow();
    }
  }, 1000);
};

window.startFriendRoomNow = function() {
  clearTimeout(roomWaitTimer);
  document.getElementById('shareModal').classList.add('hide');
  currentMode = 'friends';
  entryFee = 0;
  launchMatch(['blue', 'red', 'green', 'yellow'], true);
};

window.shareTo = function(platform) {
  const url = window.location.href.split('?')[0] + '?room=' + roomCode;
  const msg = encodeURIComponent(`Play Ludo King with me! Room Code: ${roomCode}. Join link: `);
  if (platform === 'whatsapp') window.open('https://api.whatsapp.com/send?text=' + msg + encodeURIComponent(url));
  else if (platform === 'facebook') window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url));
  else if (platform === 'telegram') window.open('https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + msg);
  else if (platform === 'instagram') navigator.clipboard.writeText(url).then(() => alert('Link copied for Instagram DM!'));
  else if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => alert('Invite Link Copied!'));
};

window.openConfigModal = function(mode) {
  currentMode = mode;
  document.getElementById('configTitle').textContent = mode === 'ai' ? 'Play vs Computer' : 'Online Match';
  document.getElementById('aiOptions').style.display = mode === 'ai' ? 'block' : 'none';
  document.getElementById('startModal').classList.remove('hide');
};

window.openLocalGameModal = function() {
  document.getElementById('localGameModal').classList.remove('hide');
};

window.startLocalGame = function() {
  const count = parseInt(document.getElementById('localPlayerCount').value, 10);
  currentMode = 'local';
  entryFee = 0;
  const order = count === 2 ? ['blue', 'green'] : (count === 3 ? ['blue', 'red', 'green'] : ['blue', 'red', 'green', 'yellow']);
  document.getElementById('localGameModal').classList.add('hide');
  launchMatch(order, false);
};

window.startGame = function() {
  const count = parseInt(document.getElementById('playerCount').value, 10);
  entryFee = parseInt(document.getElementById('entryFeeSelect').value, 10);
  if (totalCoins < entryFee) {
    alert(`Need ${entryFee} 💰 coins to enter.`);
    return;
  }
  totalCoins -= entryFee;
  localStorage.setItem('ludoCoins', totalCoins);
  syncCoinDisplays();
  const order = count === 2 ? ['blue', 'green'] : (count === 3 ? ['blue', 'red', 'green'] : ['blue', 'red', 'green', 'yellow']);
  document.getElementById('startModal').classList.add('hide');
  launchMatch(order, true);
};

function launchMatch(selectedColors, enableBots) {
  players = selectedColors.map((color, idx) => ({
    id: idx,
    color: color,
    name: idx === 0 ? userProfile.name : (enableBots ? GLOBAL_BOT_NAMES[idx] : `Player ${idx+1}`),
    avatar: idx === 0 ? userProfile.avatar : ['👦','👩','👧'][idx-1] || '👤',
    cpu: idx > 0 && enableBots,
    tokens: [0, 0, 0, 0],
    rank: 0,
    active: true
  }));
  current = 0;
  dice = 1;
  rolled = false;
  rolling = false;
  moving = false;
  sixCount = 0;
  started = true;
  ranks = [];
  turnSerial++;
  document.getElementById('homeScreen').style.display = 'none';
  document.getElementById('ludoGame').style.display = 'flex';
  COLORS.forEach(c => {
    lastDiceMemory[c] = 1;
    const dBox = document.getElementById(`dice-${c}`);
    dBox.innerHTML = getDiceHTML(1);
    document.getElementById(`val-${c}`).textContent = '';
  });
  updatePlayersHUD();
  renderTokens();
  beginTurn();
  if (enableBots) scheduleRandomBotChats();
}

function scheduleRandomBotChats() {
  const botPlayers = players.filter(p => p.cpu);
  if (!botPlayers.length) return;
  [12000, 28000, 48000].forEach(delay => {
    setTimeout(() => {
      if (!started) return;
      const bot = botPlayers[Math.floor(Math.random() * botPlayers.length)];
      const msg = RANDOM_BOT_MESSAGES[Math.floor(Math.random() * RANDOM_BOT_MESSAGES.length)];
      appendChat(bot.name, msg);
    }, delay);
  });
}

function updatePlayersHUD() {
  COLORS.forEach(c => {
    const hud = document.getElementById(`hud-${c}`);
    const p = players.find(x => x.color === c);
    hud.classList.remove('active');
    if (p && p.active) {
      hud.style.visibility = 'visible';
      hud.style.opacity = '1';
      document.getElementById(`name-${c}`).textContent = p.name;
      document.querySelector(`#av-${c} .emoji-av`).textContent = p.avatar;
      if (players[current] && players[current].color === c) hud.classList.add('active');
    } else {
      hud.style.visibility = 'hidden';
      hud.style.opacity = '0';
    }
  });
}

/* EXACT TRIANGLE INTERIOR POSITIONS FOR 57 */
function getGridPos(p, ti, tv) {
  if (tv === 0) return { top: HOME_POS[p.color][ti].t, left: HOME_POS[p.color][ti].l };
  if (tv === 57) {
    const triMap = {
      green:  { top: 44, left: 50 },  // Top Green Triangle
      red:    { top: 50, left: 44 },  // Left Red Triangle
      blue:   { top: 56, left: 50 },  // Bottom Blue Triangle
      yellow: { top: 50, left: 56 }   // Right Yellow Triangle
    };
    return triMap[p.color];
  }
  if (tv >= 1 && tv <= 51) {
    const trk = TRACK[(START_INDEX[p.color] + tv - 1) % 52];
    return { top: ((trk[0] + 0.5) / 15) * 100, left: ((trk[1] + 0.5) / 15) * 100 };
  }
  if (tv >= 52 && tv <= 56) {
    const ln = HOME_LANES[p.color][tv - 52];
    return { top: ((ln[0] + 0.5) / 15) * 100, left: ((ln[1] + 0.5) / 15) * 100 };
  }
}

function renderTokens() {
  const layer = document.getElementById('tokenLayer');
  layer.innerHTML = '';
  const posMap = {};
  players.forEach(player => {
    if (!player.active) return;
    player.tokens.forEach((val, index) => {
      const token = document.createElement('div');
      token.className = `token ${player.color}`;
      token.innerHTML = '<div class="pawn"><div class="pawnHead"></div><div class="pawnBody"></div><div class="pawnBase"></div></div>';
      const isM = (player.id === current && rolled && !moving && canMove(player, index, dice));
      if (isM) token.classList.add('movable');
      token.addEventListener('click', (e) => {
        e.stopPropagation();
        if (started && !rolling && rolled && !moving && player.id === current && canMove(player, index, dice)) {
          animateMove(player, index);
        }
      });
      const pos = getGridPos(player, index, val);
      const key = val === 0 ? `yard-${player.color}-${index}` : (val === 57 ? `triangle-${player.color}` : `${pos.top.toFixed(1)}-${pos.left.toFixed(1)}`);
      if (!posMap[key]) posMap[key] = [];
      posMap[key].push({ el: token, pos, inYard: val === 0, isTriangle: val === 57, isM });
    });
  });
  Object.values(posMap).forEach(grp => {
    const cnt = grp.length;
    grp.forEach((item, i) => {
      item.el.style.top = item.pos.top + '%';
      item.el.style.left = item.pos.left + '%';
      if (item.inYard) {
        item.el.style.transform = 'translate(-50%, -50%) scale(1.05)';
      } else if (item.isTriangle) {
        // 10% Further Reduced Triangle Token (Scale 0.63)
        const tOffsets = [{x:-4,y:-4}, {x:4,y:-4}, {x:-4,y:4}, {x:4,y:4}];
        const off = tOffsets[i % 4];
        item.el.style.transform = `translate(calc(-50% + ${off.x}px), calc(-50% + ${off.y}px)) scale(0.63)`;
      } else if (cnt > 1) {
        const offX = [-6, 6, -6, 6][i % 4];
        const offY = [-6, 6, 6, -6][i % 4];
        item.el.style.transform = `translate(calc(-50% + ${offX}px), calc(-50% + ${offY}px)) scale(0.85)`;
      } else {
        item.el.style.transform = 'translate(-50%, -50%) scale(1)';
      }
      item.el.style.zIndex = item.isM ? 100 : (item.isTriangle ? 200 + i : 40 + i);
      layer.appendChild(item.el);
    });
  });
}

function canMove(player, index, roll) {
  const pos = player.tokens[index];
  if (pos === 57) return false;
  if (pos === 0) return roll === 6;
  return pos + roll <= 57;
}

function beginTurn() {
  if (!started) return;
  clearInterval(turnTimer);
  let attempts = 0;
  while(attempts < players.length && (!players[current] || !players[current].active || players[current].rank > 0)) {
    current = (current + 1) % players.length;
    attempts++;
  }
  const p = players[current];
  if (!p || p.rank > 0) return;
  rolled = false;
  rolling = false;
  moving = false;
  turnSerial++;
  updatePlayersHUD();
  renderTokens();
  const msg = document.getElementById('turnMsg');
  msg.innerHTML = `<span style="color:${COLOR_HEX[p.color]}">${p.name}</span>&#39;s Turn`;
  COLORS.forEach(c => {
    const d = document.getElementById(`dice-${c}`);
    d.style.display = 'none';
    d.classList.remove('active', 'rolling');
  });
  const activeD = document.getElementById(`dice-${p.color}`);
  activeD.style.display = 'block';
  activeD.innerHTML = getDiceHTML(lastDiceMemory[p.color] || 1);
  activeD.classList.add('active');
  startCountdown(p);
  if (p.cpu) {
    setTimeout(() => {
      if (started && players[current].id === p.id && !rolled) rollDice(true);
    }, 700);
  }
}

function startCountdown(player) {
  let sec = 20;
  const bar = document.getElementById(`timer-${player.color}`);
  if (bar) bar.style.strokeDashoffset = 0;
  turnTimer = setInterval(() => {
    if (!started || moving || rolling) return;
    sec--;
    if (bar) bar.style.strokeDashoffset = 140 - (140 * (sec / 20));
    if (sec <= 0) {
      clearInterval(turnTimer);
      nextTurn();
    }
  }, 1000);
}

COLORS.forEach(c => {
  document.getElementById(`dice-${c}`).addEventListener('click', () => {
    const p = players[current];
    if (started && p && p.color === c && !p.cpu && !rolling && !rolled && !moving) {
      rollDice();
    }
  });
});

function rollDice(isCpu = false) {
  const p = players[current];
  if (!started || !p || rolling || rolled || moving || (p.cpu && !isCpu)) return;
  rolling = true;
  clearInterval(turnTimer);
  playTone('roll');
  const d = document.getElementById(`dice-${p.color}`);
  d.classList.remove('active');
  d.classList.add('rolling');
  let count = 0;
  const timer = setInterval(() => {
    d.innerHTML = getDiceHTML(Math.floor(Math.random() * 6) + 1);
    count++;
    if (count >= 7) {
      clearInterval(timer);
      let r = Math.floor(Math.random() * 6) + 1;
      if (sixCount >= 2 && r === 6) r = Math.floor(Math.random() * 5) + 1;
      dice = r;
      lastDiceMemory[p.color] = r;
      rolling = false;
      rolled = true;
      d.classList.remove('rolling');
      d.classList.add('active');
      d.innerHTML = getDiceHTML(dice);
      document.getElementById(`val-${p.color}`).textContent = `Roll: ${dice}`;
      if (dice === 6) triggerEmojiFloat('🔥');
      afterRoll(p);
    }
  }, 80);
}

function afterRoll(player) {
  const legal = player.tokens.map((v, i) => canMove(player, i, dice) ? i : -1).filter(i => i !== -1);
  if (!legal.length) {
    if (dice === 6) {
      sixCount++;
      if (sixCount >= 3) {
        sixCount = 0;
        setTimeout(nextTurn, 600);
      } else {
        setTimeout(beginTurn, 600);
      }
    } else {
      sixCount = 0;
      setTimeout(nextTurn, 600);
    }
    return;
  }
  if (legal.length === 1) {
    setTimeout(() => animateMove(player, legal[0]), 350);
  } else {
    renderTokens();
    if (player.cpu) {
      setTimeout(() => {
        let pick = legal[0];
        legal.forEach(i => {
          if (captureTargets(player, i).length) pick = i;
          else if (player.tokens[i] === 0 && dice === 6) pick = i;
          else if (player.tokens[i] + dice === 57) pick = i;
        });
        animateMove(player, pick);
      }, 500);
    }
  }
}

/* SLOW & NATURAL MOVEMENT SPEED (280ms PER STEP) */
function animateMove(player, index) {
  if (moving || !rolled) return;
  moving = true;
  rolled = false;
  clearInterval(turnTimer);
  const startPos = player.tokens[index];
  const roll = dice;
  if (startPos === 0) {
    player.tokens[index] = 1;
    playTone('step');
    renderTokens();
    setTimeout(() => finalizeMove(player, index, startPos, roll), 350);
    return;
  }
  let count = 0;
  const interval = setInterval(() => {
    player.tokens[index]++;
    count++;
    playTone('step');
    renderTokens();
    if (count >= roll) {
      clearInterval(interval);
      setTimeout(() => finalizeMove(player, index, startPos, roll), 300);
    }
  }, 280);
}

/* ANIMATED RETURN TO BASE ON CAPTURE (GOTH WAPAS JATE HUWE DIKHEGI) */
function sendHomeAnimated(opponent, index, callback) {
  const stepInterval = setInterval(() => {
    if (opponent.tokens[index] > 1) {
      opponent.tokens[index]--;
      renderTokens();
    } else {
      clearInterval(stepInterval);
      opponent.tokens[index] = 0;
      renderTokens();
      if (callback) callback();
    }
  }, 50);
}

function finalizeMove(player, index, startPos, roll) {
  const targets = captureTargets(player, index);
  const didCapture = targets.length > 0;
  if (didCapture) {
    triggerEmojiFloat('⚔️');
    const victim = targets[0];
    const victimPlayer = players[victim.pId];
    
    // Animate captured token running back to its yard spot
    sendHomeAnimated(victimPlayer, victim.tId, () => {
      finishMoveEvaluation(player, index, startPos, roll, true);
    });
  } else {
    finishMoveEvaluation(player, index, startPos, roll, false);
  }
}

function finishMoveEvaluation(player, index, startPos, roll, didCapture) {
  const reachedHome = startPos < 57 && player.tokens[index] === 57;
  if (reachedHome) {
    triggerEmojiFloat('🎉');
  }
  if (player.tokens.every(x => x === 57) && player.rank === 0) {
    player.rank = ranks.length + 1;
    ranks.push(player);
    const activeTotal = players.filter(p => p.active).length;
    if (ranks.length >= activeTotal - 1) {
      setTimeout(endGame, 500);
      return;
    }
  }
  moving = false;
  if (didCapture || reachedHome) {
    sixCount = 0;
    beginTurn();
    return;
  }
  if (roll === 6) {
    sixCount++;
    if (sixCount >= 3) {
      sixCount = 0;
      nextTurn();
    } else {
      beginTurn();
    }
    return;
  }
  sixCount = 0;
  nextTurn();
}

function captureTargets(player, tokenIndex) {
  const myToken = player.tokens[tokenIndex];
  if (myToken < 1 || myToken > 51) return [];
  const myAbs = (START_INDEX[player.color] + myToken - 1) % 52;
  if (SAFE.includes(myAbs)) return [];
  const list = [];
  players.forEach((opp, pId) => {
    if (opp.id === player.id || !opp.active) return;
    opp.tokens.forEach((t, tId) => {
      if (t >= 1 && t <= 51) {
        const oppAbs = (START_INDEX[opp.color] + t - 1) % 52;
        if (oppAbs === myAbs) list.push({ pId, tId });
      }
    });
  });
  return list;
}

function nextTurn() {
  if (!started) return;
  current = (current + 1) % players.length;
  beginTurn();
}

function endGame() {
  started = false;
  clearInterval(turnTimer);
  const activePlayers = players.filter(p => p.active);
  activePlayers.forEach(p => {
    if (p.rank === 0) {
      p.rank = activePlayers.length;
      ranks.push(p);
    }
  });
  const pool = entryFee * activePlayers.length;
  let html = '';
  ranks.forEach((p, i) => {
    const reward = i === 0 ? Math.floor(pool * 0.7) : (i === 1 ? Math.floor(pool * 0.3) : 0);
    html += `#${p.rank} ${p.name} — Earned ${reward.toLocaleString()} 💰<br/>`;
    if (p.id === 0 && reward > 0) {
      totalCoins += reward;
      localStorage.setItem('ludoCoins', totalCoins);
    }
  });
  document.getElementById('winnerName').textContent = `${ranks[0].name} Wins!`;
  document.getElementById('rankList').innerHTML = html;
  document.getElementById('winnerModal').classList.remove('hide');
}

window.goHome = function() {
  started = false;
  clearInterval(turnTimer);
  clearTimeout(roomWaitTimer);
  document.getElementById('ludoGame').style.display = 'none';
  document.getElementById('homeScreen').style.display = 'flex';
  document.getElementById('winnerModal').classList.add('hide');
  syncCoinDisplays();
  populateLivePanel();
};

function initBoardCells() {
  const container = document.getElementById('cells');
  container.innerHTML = '';
  const trackMap = {};
  TRACK.forEach((pos, i) => { trackMap[`${pos[0]}-${pos[1]}`] = i; });
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      const key = `${r}-${c}`;
      if (trackMap[key] !== undefined) {
        cell.classList.add('path');
        const idx = trackMap[key];
        if (idx === START_INDEX.green) cell.classList.add('greenStart');
        if (idx === START_INDEX.yellow) cell.classList.add('yellowStart');
        if (idx === START_INDEX.blue) cell.classList.add('blueStart');
        if (idx === START_INDEX.red) cell.classList.add('redStart');
        if (SAFE.includes(idx)) cell.classList.add('star');
      }
      if (HOME_LANES.green.some(p => p[0]===r && p[1]===c)) cell.classList.add('lane', 'greenLane');
      if (HOME_LANES.yellow.some(p => p[0]===r && p[1]===c)) cell.classList.add('lane', 'yellowLane');
      if (HOME_LANES.blue.some(p => p[0]===r && p[1]===c)) cell.classList.add('lane', 'blueLane');
      if (HOME_LANES.red.some(p => p[0]===r && p[1]===c)) cell.classList.add('lane', 'redLane');
      container.appendChild(cell);
    }
  }
}

function initApp() {
  const s = localStorage.getItem('ludoProfile');
  if (s) {
    try { userProfile = JSON.parse(s); } catch(e){}
  }
  if (!userProfile) {
    userProfile = { name: "Player 1", avatar: "👨", flag: "🇺🇸", gender: "Male", age: 24 };
    localStorage.setItem('ludoProfile', JSON.stringify(userProfile));
  }
  const c = localStorage.getItem('ludoCoins');
  if (c) totalCoins = parseInt(c, 10);
  else localStorage.setItem('ludoCoins', totalCoins);
  applyProfileUI();
  syncCoinDisplays();
  initBoardCells();
  populateLivePanel();
}

initApp();
})();
