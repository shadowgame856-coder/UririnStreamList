// 小彩蛋：給好奇的抹布靈
//	電腦：打開開發者工具（F12）的 Console，輸入 uririn.help()
//	手機：2 秒內連點網站標題 5 次，會跳出仿終端機的小視窗
//	隱藏頁面：搜尋框輸入「希翁」或「chion」、在頁面上直接打 chion、或在 Console／小視窗輸入 chion 或 希翁，會在新分頁打開 chion.html
// 由 index.html 在主程式之後引入，會用到主程式的 SONGS、STREAMS、LANGUAGES 等資料
(function(){
	const GREETING = [
		'被你發現了！這裡是給好奇抹布靈的小角落 👀',
		'輸入 uririn.help() 看看可以做什麼吧',
	];

	// 駭客小遊戲：hack 找到機密檔案 → unlock 密碼打開
	const HACK_PASSWORD = '1220';
	const HACK_HINT = '她的初配信日期（4 位數字）';
	const HACK_HINT_STRONG = '月份＋日期，例如 3 月 5 日就是 0305';
	const HACK_SECRET = [
		'🎉 恭喜你成功駭入機密檔案！',
		'',
		'檔案內容：',
		'「其實這裡沒有什麼秘密，',
		'  真正的秘密是——能找到這裡的你，一定也是很喜歡幽李鈴吧 💜」',
	];

	// 手機隱藏入口：在 TAP_WINDOW 毫秒內連點標題 TAP_COUNT 次
	const TAP_COUNT = 5;
	const TAP_WINDOW = 2000;

	// 隱藏頁面：輸入暗號後，在新分頁打開另一個頁面（英文不分大小寫）
	const SECRET_WORDS = ['希翁', 'chion'];
	const SECRET_TYPING = 'chion';			// 直接在頁面上打字的暗號（網頁收不到沒有輸入框時的中文，只能用英文）
	const SECRET_LABEL = '希翁';
	const SECRET_PAGE = 'chion.html';

	// ================= 輸出：Console 或小視窗 =================
	// 指令都透過 out 輸出，同一套內容可以印在 Console，也可以顯示在小視窗
	// 文字樣式 kind：title、gold、rose、muted、hacker、warn、secret
	const CONSOLE_STYLES = {
		title: 'color:#e3b158;font-weight:700;font-size:14px;',
		gold: 'color:#e3b158;font-weight:700;',
		rose: 'color:#d97a93;font-weight:700;',
		muted: 'color:#948fa8;',
		hacker: 'color:#4ade80;font-family:monospace;font-size:12px;',
		warn: 'color:#f87171;font-family:monospace;font-size:12px;font-weight:700;',
		secret: 'color:#e3b158;font-weight:700;font-size:14px;line-height:1.6;',
	};

	const consoleOut = {
		via: 'console',
		line(text, kind){ console.log(`%c${text}`, CONSOLE_STYLES[kind] || ''); },
		// 一行裡有多種顏色：segments = [[文字, 樣式], …]
		parts(segments){ console.log(segments.map(s => `%c${s[0]}`).join(''), ...segments.map(s => CONSOLE_STYLES[s[1]] || '')); },
		table(rows){ console.table(rows); },
		// 指令清單：[[指令, 說明], …]，一行一個，不用表格（Chrome 的表格下面會多一個 Object）
		list(items){ for(const [cmd, desc] of items) this.parts([[cmd, 'gold'], [`　${desc}`, 'muted']]); },
		// 解鎖後的獎勵：Console 沒辦法放按鈕，先提示、等 3 秒讓人看完秘密訊息再播放
		async reward(play){
			this.line('作為獎勵，3 秒後隨機送你一首歌 🎁', 'rose');
			await wait(3000);
			play();
		},
	};

	const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
	let hacking = false;		// 動畫跑到一半時，不要重複開始
	let hackFoundFile = false;	// 先 hack 找到機密檔案，unlock 才有東西可以開（Console 跟小視窗共用）
	let unlockAttempts = 0;

	// 記錄有多少人找到彩蛋、用了哪些指令，via 是從 Console 還是小視窗玩的
	function track(command, out){
		const via = typeof out === 'string' ? out : out.via;
		if(typeof gtag === 'function') gtag('event', 'easter_egg', { command, via });
	}

	// ================= 資料 =================
	// 資料還沒載入完成時提醒一下
	function ready(out){
		if(typeof LANGUAGES === 'undefined' || LANGUAGES.length === 0){
			out.line('資料還在載入中，稍等一下再試試看～', 'muted');
			return false;
		}
		return true;
	}

	// 所有可以公開的演出紀錄（排除會限場次，跟網站畫面的規則一樣）
	function publicRecords(){
		const list = [];
		for(const lang of LANGUAGES){
			for(const song of SONGS[lang]){
				if(isRestrictedStream(STREAMS[song.streamId])) continue;
				list.push({ ...song, lang });
			}
		}
		return list;
	}

	// 依歌曲分組（同一首唱多次合在一起）
	function groupBySong(records){
		const map = new Map();
		for(const s of records){
			const key = s.catalogId || `${s.lang}::${s.name}`;
			if(!map.has(key)) map.set(key, []);
			map.get(key).push(s);
		}
		return [...map.values()];
	}

	// ================= 指令 =================
	const actions = {
		help(out){
			track('help', out);
			const c = (name, args = '') => out.via === 'console' ? `uririn.${name}(${args})` : `${name}${args ? ' ' + args.replace(/'/g, '') : ''}`;
			out.line('👻 可以輸入的指令', 'title');
			out.list([
				[c('random'), '隨機播放一首歌'],
				[c('stats'), '看看總共唱過多少歌'],
				[c('mostSung'), '唱最多次的前 10 首'],
				[c('today'), '歷史上的今天'],
				[c('search', "'關鍵字'"), '找找看有沒有唱過某首歌'],
				[c('hack'), '？？？（勇者限定）'],
			]);
		},

		random(out){
			if(!ready(out)) return null;
			track('random', out);
			const playable = publicRecords().filter(s => isPlayableUrl(resolveSongVideoUrl(s)));
			if(playable.length === 0){ out.line('目前沒有可以播放的歌曲', 'muted'); return null; }
			const song = playable[Math.floor(Math.random() * playable.length)];
			playSong(song.lang, song.id);
			out.parts([['🎲 隨機播放：', 'gold'], [song.name, 'rose'], [`（${song.lang}）`, 'muted']]);
			return song;
		},

		stats(out){
			if(!ready(out)) return;
			track('stats', out);
			const records = publicRecords();
			const songs = groupBySong(records);
			const streamCount = Object.values(STREAMS).filter(s => !isRestrictedStream(s)).length;
			out.line('📊 統計', 'title');
			out.parts([
				['唱過 ', 'muted'], [String(songs.length), 'rose'], [' 首不同的歌，總共演出 ', 'muted'],
				[String(records.length), 'rose'], [' 次，橫跨 ', 'muted'], [String(streamCount), 'rose'], [' 場直播', 'muted'],
			]);
			const rows = [];
			for(const lang of LANGUAGES){
				const langRecords = records.filter(s => s.lang === lang);
				if(langRecords.length === 0) continue;
				rows.push({ '語言': lang, '歌曲數': groupBySong(langRecords).length, '演出次數': langRecords.length });
			}
			out.table(rows);
		},

		mostSung(out, count = 10){
			if(!ready(out)) return;
			track('mostSung', out);
			count = Math.max(1, Math.min(50, parseInt(count, 10) || 10));
			const ranking = groupBySong(publicRecords())
				.sort((a, b) => b.length - a.length)
				.slice(0, count)
				.map((group, i) => ({ '名次': i + 1, '歌名': group[0].name, '語言': group[0].lang, '唱過次數': group.length }));
			out.line(`🏆 唱最多次的前 ${ranking.length} 首`, 'title');
			out.table(ranking);
		},

		today(out){
			if(!ready(out)) return;
			track('today', out);
			const now = new Date();
			const monthDay = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
			const hits = Object.values(STREAMS)
				.filter(s => !isRestrictedStream(s) && s.date && s.date.slice(5) === monthDay)
				.sort((a, b) => b.date.localeCompare(a.date));
			out.line(`📅 歷史上的今天（${now.getMonth() + 1} 月 ${now.getDate()} 日）`, 'title');
			if(hits.length === 0){
				out.line('這一天還沒有直播紀錄，換個日子再來看看吧', 'muted');
				return;
			}
			out.table(hits.map(s => ({ '日期': s.date, '直播標題': s.title })));
		},

		search(out, keyword){
			if(!ready(out)) return;
			track('search', out);
			if(!keyword){
				out.line(out.via === 'console' ? "要給我關鍵字喔，例如 uririn.search('藍')" : '要給我關鍵字喔，例如 search 藍', 'muted');
				return;
			}
			const q = String(keyword).toLowerCase();
			const matched = groupBySong(publicRecords().filter(s => s.name.toLowerCase().includes(q) || (s.artist || '').toLowerCase().includes(q)));
			out.line(`🔍 「${keyword}」找到 ${matched.length} 首`, 'title');
			if(matched.length === 0){
				out.line('好像還沒唱過，也許可以去聊天室許願看看？', 'muted');
				return;
			}
			out.table(matched.map(group => ({ '歌名': group[0].name, '語言': group[0].lang, '原唱': group[0].artist, '唱過次數': group.length })));
		},

		// 假的「入侵」動畫：全部只是印文字，不會真的連線或存取任何東西
		async hack(out){
			if(hacking) return;
			hacking = true;
			track('hack', out);
			const steps = [
				['hacker', '> 初始化駭客模式…'],
				['hacker', '> 連線到 uririn-secret-server.ghost ……'],
				['hacker', '> 連線成功，正在掃描檔案系統'],
				['hacker', '  [██░░░░░░░░] 20%'],
				['hacker', '  [█████░░░░░] 50%'],
				['warn', '! 警告：偵測到鬼魂防火牆 👻'],
				['hacker', '> 嘗試繞過防火牆……'],
				['hacker', '> 用歌回清單當作金鑰暴力破解中……'],
				['hacker', '  [████████░░] 80%'],
				['hacker', '  [██████████] 100%'],
				['hacker', '> 防火牆已繞過'],
				['hacker', '> 發現檔案：/secret/uririn_機密.txt 🔒'],
			];
			try{
				for(const [kind, text] of steps){
					out.line(text, kind);
					await wait(600 + Math.random() * 500); // 每行間隔約 0.6～1.1 秒，整段約 10 秒
				}
				hackFoundFile = true;
				out.line('檔案被加密了，需要密碼才能打開', 'warn');
				out.line(`提示：${HACK_HINT}`, 'hacker');
				out.line(out.via === 'console' ? "輸入 uririn.unlock('密碼') 試試看" : '輸入 unlock 密碼 試試看，例如 unlock 0000', 'hacker');
			}finally{
				hacking = false;
			}
		},

		async unlock(out, password){
			if(!hackFoundFile){
				out.line(out.via === 'console' ? '你還沒找到機密檔案喔，先試試 uririn.hack()' : '你還沒找到機密檔案喔，先試試 hack', 'muted');
				return;
			}
			if(password === undefined || password === ''){
				out.line(out.via === 'console' ? "要輸入密碼喔，例如 uririn.unlock('0000')" : '要輸入密碼喔，例如 unlock 0000', 'hacker');
				return;
			}
			if(String(password).trim() !== HACK_PASSWORD){
				unlockAttempts++;
				track('unlock_fail', out);
				out.line('✖ 密碼錯誤，鬼魂防火牆還在運作中 👻', 'warn');
				out.line(`提示：${unlockAttempts >= 3 ? HACK_HINT_STRONG : HACK_HINT}`, 'hacker');
				return;
			}
			track('unlock_success', out);
			out.line('> 密碼正確，解密中……', 'hacker');
			await wait(1500);
			out.line(HACK_SECRET.join('\n'), 'secret');
			await wait(800);
			await out.reward(() => actions.random(out));
		},
	};

	// ================= 隱藏頁面 =================
	// 畫面上方的提示訊息，幾秒後自動消失；有 link 時變成可以點的連結
	let toastTimer = null;
	function showToast(text, link){
		ensureEggStyles();
		let toast = document.getElementById('ee-toast');
		if(!toast){
			toast = document.createElement('div');
			toast.id = 'ee-toast';
			toast.setAttribute('role', 'status');
			document.body.appendChild(toast);
		}
		toast.innerHTML = '';
		if(link){
			const a = document.createElement('a');
			a.href = link;
			a.target = '_blank';
			a.rel = 'noopener';
			a.textContent = text;
			toast.appendChild(a);
		}else{
			toast.textContent = text;
		}
		toast.classList.toggle('has-link', !!link);
		toast.classList.remove('show');
		void toast.offsetWidth;
		toast.classList.add('show');
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => toast.classList.remove('show'), link ? 8000 : 3200);
	}

	// 在新分頁打開隱藏頁面；被瀏覽器擋下時，改在畫面上方顯示可以點的連結。回傳 true 表示有成功打開
	function openSecretPage(via){
		track('open_secret_page', via);
		const win = window.open(SECRET_PAGE, '_blank');
		if(win){
			try{ win.opener = null; }catch(e){}
			return true;
		}
		showToast(`🔓 發現隱藏頁面，點這裡打開：${SECRET_LABEL}`, SECRET_PAGE);
		return false;
	}

	// Console／小視窗輸入暗號：打開隱藏頁面，回傳要顯示的訊息
	actions.secret = function(out){
		return openSecretPage(out.via)
			? `🔓 已在新分頁打開隱藏頁面：${SECRET_LABEL}`
			: '新分頁被瀏覽器擋住了，請點畫面上方的連結';
	};

	// Console 用的指令：uririn.help()、uririn.search('藍')…
	window.uririn = {
		help: () => { actions.help(consoleOut); },
		random: () => { actions.random(consoleOut); },
		stats: () => { actions.stats(consoleOut); },
		mostSung: (count) => { actions.mostSung(consoleOut, count); },
		today: () => { actions.today(consoleOut); },
		search: (keyword) => { actions.search(consoleOut, keyword); },
		hack: () => actions.hack(consoleOut),
		unlock: (password) => actions.unlock(consoleOut, password),
	};

	// Console 直接輸入 chion 或 希翁（不用 uririn. 也不用括號）：
	// 用「讀取這個名稱時執行」的方式做，按 Enter 才會執行；Chrome 打字時的即時預覽不會執行開新分頁這類動作
	for(const word of SECRET_WORDS){
		Object.defineProperty(window, word, {
			get: () => actions.secret(consoleOut),
			configurable: true,
		});
	}

	// 打開 Console 時看到的歡迎訊息
	console.log('%c👻 幽李鈴 Uririn', 'color:#e3b158;font-weight:700;font-size:24px;padding:4px 0;');
	console.log(`%c${GREETING.join('\n')}`, 'color:#948fa8;font-size:13px;');

	// ================= 手機隱藏入口：仿終端機的小視窗 =================
	const TERMINAL_CSS = `
		#uririn-terminal{
			position:fixed; inset:0; z-index:200;
			display:flex; align-items:center; justify-content:center;
			padding:16px; background:rgba(15,13,26,.72);
		}
		#uririn-terminal .ut-window{
			width:100%; max-width:640px; height:min(78vh, 640px);
			display:flex; flex-direction:column;
			background:#0f0d1a; border:1px solid #e3b158; border-radius:12px;
			box-shadow:0 20px 60px rgba(0,0,0,.6);
			font-family:'JetBrains Mono', Consolas, 'Noto Sans TC', monospace; color:#ece8ff;
			overflow:hidden;
		}
		#uririn-terminal .ut-head{
			display:flex; align-items:center; justify-content:space-between;
			padding:10px 12px 10px 16px; border-bottom:1px solid #3a3358;
			color:#948fa8; font-size:.85rem;
		}
		#uririn-terminal .ut-close{
			width:40px; height:40px; border:1px solid #3a3358; border-radius:8px;
			background:transparent; color:#948fa8; font-size:1rem; cursor:pointer;
		}
		#uririn-terminal .ut-output{
			flex:1; overflow-y:auto; padding:14px 16px;
			font-size:.86rem; line-height:1.65; white-space:pre-wrap; word-break:break-word;
		}
		#uririn-terminal .ut-line{ margin:0; }
		#uririn-terminal .k-title{ color:#e3b158; font-weight:700; margin-top:6px; }
		#uririn-terminal .k-gold{ color:#e3b158; font-weight:700; }
		#uririn-terminal .k-rose{ color:#d97a93; font-weight:700; }
		#uririn-terminal .k-muted{ color:#948fa8; }
		#uririn-terminal .k-hacker{ color:#4ade80; }
		#uririn-terminal .k-warn{ color:#f87171; font-weight:700; }
		#uririn-terminal .k-secret{ color:#e3b158; font-weight:700; }
		#uririn-terminal .k-echo{ color:#ece8ff; margin-top:10px; }
		#uririn-terminal .ut-table{ border-collapse:collapse; margin:6px 0; font-size:.8rem; }
		#uririn-terminal .ut-table th, #uririn-terminal .ut-table td{
			border:1px solid #3a3358; padding:4px 8px; text-align:left; white-space:nowrap;
		}
		#uririn-terminal .ut-table th{ color:#948fa8; font-weight:400; }
		#uririn-terminal .ut-table-wrap{ overflow-x:auto; }
		#uririn-terminal .ut-list{ display:grid; grid-template-columns:auto 1fr; column-gap:14px; row-gap:2px; }
		#uririn-terminal .ut-quick{
			display:flex; gap:8px; overflow-x:auto; padding:10px 12px;
			border-top:1px solid #3a3358; scrollbar-width:none;
		}
		#uririn-terminal .ut-quick::-webkit-scrollbar{ display:none; }
		#uririn-terminal .ut-quick button{
			flex:none; min-height:40px; padding:6px 14px;
			border:1px solid #3a3358; border-radius:999px; background:#17142a;
			color:#ece8ff; font-family:inherit; font-size:.82rem; cursor:pointer;
		}
		#uririn-terminal .ut-form{
			display:flex; align-items:center; gap:8px; padding:10px 12px 12px;
			border-top:1px solid #3a3358; color:#e3b158; font-size:.82rem;
		}
		#uririn-terminal .ut-input{
			flex:1; min-width:0; min-height:40px; padding:6px 10px;
			background:#17142a; border:1px solid #3a3358; border-radius:8px;
			color:#ece8ff; font-family:inherit; font-size:16px; /* 16px：iPhone 點輸入框時才不會自動放大畫面 */
		}
		#uririn-terminal .ut-reward{
			display:block; margin:10px 0 4px; min-height:44px; padding:8px 16px;
			border:1px solid #e3b158; border-radius:8px; background:#e3b158;
			color:#22190a; font-family:inherit; font-size:.86rem; font-weight:700; cursor:pointer;
		}
		#uririn-terminal .ut-reward:disabled{ opacity:.5; cursor:default; }
		#uririn-terminal button:focus-visible, #uririn-terminal .ut-input:focus{ outline:2px solid #e3b158; outline-offset:1px; }
		@media (hover:hover){
			#uririn-terminal .ut-quick button:hover, #uririn-terminal .ut-close:hover{ border-color:#e3b158; color:#e3b158; }
		}
	`;

	const EXTRA_CSS = `
		#ee-toast{
			position:fixed; top:16px; left:50%; z-index:300;
			transform:translate(-50%, -20px); opacity:0; pointer-events:none;
			padding:10px 18px; border:1px solid #e3b158; border-radius:999px;
			background:#17142a; color:#e3b158; font-size:.95rem; font-weight:700;
			box-shadow:0 10px 30px rgba(0,0,0,.5);
			transition:opacity .3s, transform .3s;
		}
		#ee-toast.show{ opacity:1; transform:translate(-50%, 0); }
		#ee-toast.has-link{ pointer-events:auto; }
		#ee-toast a{ color:inherit; }
	`;

	const PROMPT = '抹布靈@uririn:~$';
	let terminalEl = null;
	let outputEl = null;
	let inputEl = null;
	let previousBodyOverflow = '';

	// 小視窗的輸出：把文字、表格畫在小視窗裡
	const terminalOut = {
		via: 'terminal',
		// 解鎖後的獎勵：放一個按鈕，看完秘密訊息、自己點了才播放歌曲並關閉小視窗
		reward(play){
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'ut-reward';
			btn.textContent = '🎁 領取獎勵：隨機播放一首歌';
			btn.addEventListener('click', () => {
				btn.disabled = true;
				if(play()) closeAfterPlay();
			});
			this.add(btn);
		},
		add(node){
			outputEl.appendChild(node);
			outputEl.scrollTop = outputEl.scrollHeight;
		},
		line(text, kind){
			const p = document.createElement('p');
			p.className = `ut-line k-${kind || 'plain'}`;
			p.textContent = text;
			this.add(p);
		},
		parts(segments){
			const p = document.createElement('p');
			p.className = 'ut-line';
			for(const [text, kind] of segments){
				const span = document.createElement('span');
				span.className = `k-${kind}`;
				span.textContent = text;
				p.appendChild(span);
			}
			this.add(p);
		},
		table(rows){
			if(!rows.length) return;
			const wrap = document.createElement('div');
			wrap.className = 'ut-table-wrap';
			const table = document.createElement('table');
			table.className = 'ut-table';
			const keys = Object.keys(rows[0]);
			const head = table.createTHead().insertRow();
			for(const k of keys){ const th = document.createElement('th'); th.textContent = k; head.appendChild(th); }
			const body = table.createTBody();
			for(const row of rows){
				const tr = body.insertRow();
				for(const k of keys) tr.insertCell().textContent = row[k] ?? '';
			}
			wrap.appendChild(table);
			this.add(wrap);
		},
		list(items){
			const div = document.createElement('div');
			div.className = 'ut-list';
			for(const [cmd, desc] of items){
				const a = document.createElement('span'); a.className = 'k-gold'; a.textContent = cmd;
				const b = document.createElement('span'); b.className = 'k-muted'; b.textContent = desc;
				div.append(a, b);
			}
			this.add(div);
		},
	};

	// 彩蛋用到的樣式（小視窗、提示訊息、隱藏頁籤的動畫），第一次用到時才載入
	function ensureEggStyles(){
		if(document.getElementById('uririn-terminal-style')) return;
		const style = document.createElement('style');
		style.id = 'uririn-terminal-style';
		style.textContent = TERMINAL_CSS + EXTRA_CSS;
		document.head.appendChild(style);
	}

	function buildTerminal(){
		ensureEggStyles();
		terminalEl = document.createElement('div');
		terminalEl.id = 'uririn-terminal';
		terminalEl.innerHTML = `
			<div class="ut-window" role="dialog" aria-modal="true" aria-label="小彩蛋終端機">
				<div class="ut-head">
					<span>👻 uririn-terminal</span>
					<button type="button" class="ut-close" aria-label="關閉">✕</button>
				</div>
				<div class="ut-output" aria-live="polite"></div>
				<div class="ut-quick">
					<button type="button" data-cmd="help">指令說明</button>
					<button type="button" data-cmd="random">🎲 隨機播放</button>
					<button type="button" data-cmd="stats">📊 統計</button>
					<button type="button" data-cmd="mostSung">🏆 唱最多次</button>
					<button type="button" data-cmd="today">📅 歷史上的今天</button>
					<button type="button" data-fill="search ">🔍 搜尋</button>
					<button type="button" data-cmd="hack">？？？</button>
				</div>
				<form class="ut-form">
					<label for="uririn-terminal-input">${PROMPT}</label>
					<input id="uririn-terminal-input" class="ut-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="send" placeholder="輸入指令，例如 help">
				</form>
			</div>`;
		outputEl = terminalEl.querySelector('.ut-output');
		inputEl = terminalEl.querySelector('.ut-input');

		terminalEl.querySelector('.ut-close').addEventListener('click', closeTerminal);
		terminalEl.addEventListener('click', (e) => { if(e.target === terminalEl) closeTerminal(); }); // 點視窗外面關閉
		terminalEl.querySelector('.ut-form').addEventListener('submit', (e) => {
			e.preventDefault();
			const text = inputEl.value;
			inputEl.value = '';
			runCommand(text);
		});
		terminalEl.querySelector('.ut-quick').addEventListener('click', (e) => {
			const btn = e.target.closest('button');
			if(!btn) return;
			if(btn.dataset.fill){ // 搜尋要輸入關鍵字：先把指令填進輸入框
				inputEl.value = btn.dataset.fill;
				inputEl.focus();
				return;
			}
			runCommand(btn.dataset.cmd);
		});

		terminalOut.line('👻 幽李鈴 Uririn', 'title');
		terminalOut.line('被你發現了！這裡是給好奇抹布靈的小角落 👀', 'muted');
		terminalOut.line('點下面的按鈕，或輸入 help 看看可以做什麼', 'muted');
	}

	function openTerminal(){
		if(!terminalEl) buildTerminal();
		if(terminalEl.isConnected) return;
		document.body.appendChild(terminalEl);
		previousBodyOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden'; // 小視窗開著時，後面的網頁不要跟著捲動
		track('open_terminal', terminalOut);
		// 有滑鼠的裝置直接把游標放進輸入框；手機不自動聚焦，避免鍵盤一打開就擋住畫面
		if(window.matchMedia('(hover:hover)').matches) inputEl.focus();
	}

	function closeTerminal(){
		if(!terminalEl || !terminalEl.isConnected) return;
		terminalEl.remove();
		document.body.style.overflow = previousBodyOverflow;
	}

	// 解析輸入的指令：可以打 random、uririn.random()、search 藍、search('藍')、unlock 1220
	async function runCommand(raw){
		const text = String(raw || '').trim();
		if(!text) return;
		terminalOut.line(`${PROMPT} ${text}`, 'echo');
		if(SECRET_WORDS.includes(text.replace(/^uririn\./i, '').replace(/\(\)$/, '').toLowerCase())){
			terminalOut.line(actions.secret(terminalOut), 'gold');
			return;
		}
		const m = text.replace(/^uririn\./i, '').match(/^([a-zA-Z]+)\s*(?:\(([^)]*)\))?\s*(.*)$/);
		const name = m ? m[1].toLowerCase() : '';
		const arg = m ? (m[2] !== undefined ? m[2] : m[3]).trim().replace(/^['"]|['"]$/g, '') : '';
		switch(name){
			case 'help': actions.help(terminalOut); break;
			case 'random':
				if(actions.random(terminalOut)) closeAfterPlay();
				break;
			case 'stats': actions.stats(terminalOut); break;
			case 'mostsung': actions.mostSung(terminalOut, arg || 10); break;
			case 'today': actions.today(terminalOut); break;
			case 'search': actions.search(terminalOut, arg); break;
			case 'hack': await actions.hack(terminalOut); break;
			case 'unlock': await actions.unlock(terminalOut, arg); break;
			case 'clear': outputEl.innerHTML = ''; break;
			case 'exit': closeTerminal(); break;
			default:
				terminalOut.line(`找不到指令「${text}」，輸入 help 看看有哪些指令`, 'muted');
		}
	}

	// 播放歌曲後關掉小視窗，才看得到播放器
	function closeAfterPlay(){
		terminalOut.line('播放器開始播放，終端機即將關閉…', 'muted');
		setTimeout(closeTerminal, 2000);
	}

	// 連點標題 TAP_COUNT 次打開小視窗
	const siteTitle = document.querySelector('h1');
	if(siteTitle){
		let taps = [];
		siteTitle.addEventListener('click', () => {
			const now = Date.now();
			taps = taps.filter(t => now - t < TAP_WINDOW);
			taps.push(now);
			if(taps.length >= TAP_COUNT){
				taps = [];
				openTerminal();
			}
		});
	}

	// Esc 關閉小視窗（只關小視窗，不要連後面的播放器一起關掉）
	window.addEventListener('keydown', (e) => {
		if(e.key === 'Escape' && terminalEl && terminalEl.isConnected){
			e.stopImmediatePropagation();
			closeTerminal();
		}
	}, true);

	// ================= 隱藏頁面的觸發 =================
	// 搜尋框輸入暗號：從「沒有暗號」變成「有暗號」的那一刻才打開，繼續打字不會一直重複開
	const hadSecretWord = new WeakMap();
	function onSecretSearch(e){
		const value = e.target.value.trim().toLowerCase();
		const hasWord = SECRET_WORDS.some(word => value.includes(word));
		const had = hadSecretWord.get(e.target) || false;
		hadSecretWord.set(e.target, hasWord);
		if(hasWord && !had && openSecretPage('search')) showToast(`🔓 發現隱藏頁面：${SECRET_LABEL}`);
	}
	for(const id of ['searchInput', 'streamSearchInput']){
		const input = document.getElementById(id);
		if(input) input.addEventListener('input', onSecretSearch);
	}

	// 直接在頁面上打字（不在輸入框裡時）
	let typed = '';
	window.addEventListener('keydown', (e) => {
		if(e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
		const target = e.target;
		if(target.closest && target.closest('input, textarea, select, [contenteditable="true"]')) return;
		typed = (typed + e.key.toLowerCase()).slice(-SECRET_TYPING.length);
		if(typed === SECRET_TYPING){
			typed = '';
			if(openSecretPage('keyboard')) showToast(`🔓 發現隱藏頁面：${SECRET_LABEL}`);
		}
	});
})();
