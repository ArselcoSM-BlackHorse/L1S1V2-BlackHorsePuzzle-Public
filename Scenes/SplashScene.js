//window.BACKEND_URL = '${window.BACKEND_URL}';//menggunakan configURL.js

if (!window.getLevel01SceneSafe) {
  window.getLevel01SceneSafe = function(activeOnly = false) {
    try {
      const manager = window.game?.scene;
      const scene = manager?.keys?.Level01Scene;
      if (!scene || !scene.sys || scene.sys.isDestroyed) return null;
      if (activeOnly && !scene.scene?.isActive?.()) return null;
      return scene;
    } catch (err) {
      console.warn('getLevel01SceneSafe failed:', err);
      return null;
    }
  };
}

window.payments = window.payments || {};
if (!window.payments.verifyPaypal) {
  window.payments.verifyPaypal = async function(email) {
    const base = (window.BACKEND_URL || '').trim().replace(/\/+$/,'');
    const { data } = await axios.post(`${base}/api/paypal/verify-paypal`, { email }, { timeout: 20000 });
    return data; // { verified, status, transactionId, amount, completedAt|date|timestamp }
  };
}

// ✅ SAFE EMERGENCY SAVE ON BEFOREUNLOAD (DI LUAR CLASS)
// ✅ Global beforeunload: last-chance save, hanya pasang sekali
if (!window.__bh_beforeUnloadBound) {
  window.__bh_beforeUnloadBound = true;

  window.addEventListener('beforeunload', () => {
    const email = localStorage.getItem('email');
    if (!email) return;

    try {
      const ud = JSON.parse(localStorage.getItem(`gameData-${email}`) || '{}');
      const gp = ud.gameProgress || {};

      const base = (window.BACKEND_URL || '').trim().replace(/\/+$/, '');
      const url = `${base}/api/users/${encodeURIComponent(email)}/update-progress`;

      const payload = {
        email,
        level01Score: gp.level01Score || 0,
        level01HighScore: gp.level01HighScore || 0,
        totalPlays: gp.totalPlays || 0,
        round: gp.round || 1,
        starBronzeAlpha: gp.starBronzeAlpha || 0,
        starSilverBlackHorseAlpha: gp.starSilverBlackHorseAlpha || 0,
        starAwarded: gp.starAwarded || false,
        level01Completed: gp.level01Completed || false,
        bestTime: gp.bestTime || 0,
        averageTime: gp.averageTime || 0,
        completionRate: gp.completionRate || 0,
        perfectGames: gp.perfectGames || false,
        totalAttempts: gp.totalAttempts || 0,
        completionTime: gp.completionTime || 0,
        isPerfectGame: gp.isPerfectGame || false,
        saveSource: 'beforeunload'
      };

      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } catch (e) {
      // swallow
    }
  });
}

// Di SplashScene (tambahkan di file SplashScene.js)
const APP_VERSION = 'BHP.Lv-1.1.1';
const RELEASE_HISTORY = [
  { ver: 'BHP.Lv-1.1.1', date: '2025-11-11', notes: [
    '- Launch Black Horse Puzzle on November 11, 2025',
    '- Reward Claim Hat and Special Score for Round 3 Winners',
  ]},
  { ver: 'BHP.Lv-1.1.2', date: 'TBA', notes: [
    '- Next version updates coming soon!',
    '- Priority for Round 3 to exercise your concentration.',
  ]},
];
function showChangelog(scene) {
  const overlay = scene.add.rectangle(960, 640, 1920, 1280, 0x000000, 0.6).setDepth(9000).setInteractive();
  const panel = scene.add.rectangle(960, 640, 700, 300, 0x964906, 0.95).setDepth(9001).setStrokeStyle(4, 0x00eaff);
  const title = scene.add.text(960, 530, 'Release Notes', {
    font: 'bold 26px Segoe UI', fill: '#fff'
  }).setOrigin(0.5).setDepth(9002);
  const lines = RELEASE_HISTORY.map(r => {
    const notes = r.notes.map(n => `  • ${n}`).join('\n');
    return `${r.ver} (${r.date})\n${notes}`;
  }).join('\n\n');
  const body = scene.add.text(960, 660, lines, {
    font: '20px Segoe UI', fill: '#fff', align: 'left', wordWrap: { width: 980 }
  }).setOrigin(0.5).setDepth(9002);
  const close = scene.add.text(1285, 511, '✕', {
    font: 'bold 26px Segoe UI', fill: '#fff', backgroundColor: '#e00', padding: { left: 12, right: 12, top: 6, bottom: 6 }
  }).setOrigin(0.5).setDepth(9002).setInteractive({ useHandCursor: true });
  const destroyAll = () => { overlay.destroy(); panel.destroy(); title.destroy(); body.destroy(); close.destroy(); };
  overlay.on('pointerdown', destroyAll);
  close.on('pointerdown', destroyAll);
}

class SplashScene extends Phaser.Scene {
  constructor() {
    super("SplashScene");
    this.loginInProgress = false;
    this.paymentCheckInterval = null;
    this.autoSaveInterval = null;
    this._isShuttingDown = false;
    this._isTransitioning = false;
    this.SCORE_DIGITS = 6; // ✅ 6 digit score display
   }

   // ✅ helper format score (selalu 6 digit)
   formatScore(v) {
     return String(Number(v) || 0).padStart(this.SCORE_DIGITS, '0');
   }

  isSceneUsable() {
    return !!(this.sys && !this.sys.isDestroyed && !this._isShuttingDown);
  }

  preload() {
    // ✅ PRELOAD LOGIC
    document.getElementById('loader').style.display = 'flex';
    
    this.load.image("coverBlank", "./Puzzle-Assets/Splash/Cover Blank.webp");
    this.load.image("text1", "./Puzzle-Assets/UI/Text Level 01.webp");
    this.load.image("text1glow", "./Puzzle-Assets/UI/Sp Text Level 01 Glow.webp");
    this.load.image("btnBlue", "./Puzzle-Assets/UI/Sp Button Blue Level 01.webp");
    this.load.audio("cinematic", "./Puzzle-Assets/Sfx/scenes/splash01_music_cinematic.mp3");
    
    this.load.spritesheet("blackHorse", "./Puzzle-Assets/Splash/BlackHorseRun.webp", {
      frameWidth: 750, frameHeight: 750
    });
    this.load.image("dust", "./Puzzle-Assets/Splash/Grain Dust.webp");
    
    this.load.on('complete', () => {
      document.getElementById('loader').style.display = 'none';
      
      if (!localStorage.getItem("email")) {
        document.getElementById("loginBox").style.display = "block";
        document.getElementById("logoutBtn").style.display = "none";
      } else {
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("logoutBtn").style.display = "inline-block";
      }
    });
  }

  // ========== CREATE METHOD (UTAMA) ==========
  create() {
    console.log('🎬 Creating cinematic splash scene...');
    this._isShuttingDown = false;
    this._isTransitioning = false;
    this.events.once('shutdown', this.shutdown, this);
    
    const email = localStorage.getItem("email");
    // --- Tambahan: Sembunyikan loginBox jika sudah login, sebelum loader selesai ---
    //if (localStorage.getItem("email")) {
    const loginBox = document.getElementById("loginBox");
    const logoutBtn = document.getElementById("logoutBtn");
    if (!email) {
      if (loginBox) loginBox.style.display = "block";
      if (logoutBtn) logoutBtn.style.display = "none";
    } else {
      if (loginBox) loginBox.style.display = "none";
      if (logoutBtn) logoutBtn.style.display = "inline-block";
    }
    
    // ✅ CHECK GAME OVER STATUS DARI SERVER
    //window.checkGameOverStatusFromServer();
    
    // ✅ BACKEND-CONNECTED USER DATA INITIALIZATION + AUTO-SAVE
    if (email) {
      this.initUserData(email).then(initResult => {
        if (!this.isSceneUsable()) return;
        if (initResult && initResult.success) {
          console.log(`✅ User data initialization completed:`, initResult);
          
          // ✅ DATA SUDAH PASTI DARI BACKEND, AMAN UNTUK INISIALISASI
          this.level01Score = this.level01Score || window.level01Score || 0;
          this.starBronzeAlpha = this.starBronzeAlpha || window.starBronzeAlpha || 0;

          // ✅ SET REGISTRY
          this.registry.set('level01Score', this.level01Score);
          this.registry.set('starBronzeAlpha', this.starBronzeAlpha);
          
          console.log(`🔄 Score safely initialized: ${this.level01Score}`);

          // ✅ SETUP AUTO-SAVE SETELAH INITIALIZATION BERHASIL
          this.setupAutoSave(email);

          // Handle user status setelah initialization
          if (initResult.userStatus.lossUser && initResult.userStatus.isGameOver) {
            this.showGameOverReturnMessage();
            this.blur10PuzzleButton();
            this.lockAllGameplayButtons();
          } else if (initResult.userStatus.newUser || initResult.userStatus.winUser) {
            this.unblur10PuzzleButton();
            this.unlockAllGameplayButtons();
          }
        }
      }).catch(error => {
        if (!this.isSceneUsable()) return;
        console.error('❌ User data initialization failed:', error);
        
        // ✅ FALLBACK AUTO-SAVE MESKI INIT GAGAL
        this.setupAutoSave(email);
      });
    }

    // ✅ SETUP EMAIL LOGIN HANDLERS
    this.setupEmailHandlers();
    
    // ✅ UI SETUP
    this.setupUI();
    
    // ✅ ESSENTIAL SPLASH DISPLAY
    this.backgroundCover = this.add.image(960, 640, "coverBlank").setDepth(0);
    this.sound.play("cinematic");

    // ✅ ESSENTIAL HORSE ANIMATION
    if (!this.anims.exists("run")) { 
      this.anims.create({
        key: "run",
        frames: this.anims.generateFrameNumbers("blackHorse", { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1
      });
    }

    this.blackHorse = this.add.sprite(550, 850, "blackHorse").setScale(1.3).setDepth(5);
    this.blackHorse.play("run");

    // ✅ BLACK HORSE DUST EFFECT
    const blackHorseDust = this.add.particles(0, 0, "dust", {
      x: { min: 10, max: 700 },
      y: { min: 920, max: 1250 },
      speed: { min: 30, max: 50 },
      lifespan: 1000,
      quantity: 1,
      alpha: { start: 0.1, end: 0 },
      scale: { start: 0.2, end: 1.5 },
      angle: { min: -45, max: -135 },
      blendMode: "ADD",
      tint: 0xD2B48C
    }).setDepth(0);

    // ✅ LEVEL 01 BUTTON SETUP
    this.setupLevel01Button();

    // ✅ LAZY LOAD BACKGROUND ASSETS
    this.time.delayedCall(2000, () => {
      if (!this.isSceneUsable()) return;
      console.log('🎨 Background loading splash decorations...');
      this.lazyLoadBackgroundAssets();
    });

    // ✅ BACKGROUND MUSIC DELAYED
    this.time.delayedCall(3000, () => {
      if (!this.isSceneUsable()) return;
      if (this.backgroundMusicLoaded) {
        this.sound.play("music", { loop: true });
      }
    });
  } // ← BATAS AKHIR CREATE()

  // ========== UI SETUP METHODS ==========
  setupUI() {
    this.syncAuthUI();
    this.bindSplashLogoutButton();
  }

  syncAuthUI(forceLoggedIn = !!localStorage.getItem("email")) {
    const loginBox = document.getElementById("loginBox");
    const logoutBtn = document.getElementById("logoutBtn");
    const verificationBox = document.getElementById("verificationBox");

    if (typeof window.setLoginBoxVisibility === 'function') {
      window.setLoginBoxVisibility(!forceLoggedIn);
    } else if (loginBox) {
      loginBox.classList.toggle('hidden', forceLoggedIn);
      loginBox.style.display = forceLoggedIn ? "none" : "block";
    }
    if (verificationBox && !forceLoggedIn) verificationBox.style.display = "none";

    if (logoutBtn) {
      logoutBtn.style.display = forceLoggedIn ? "inline-block" : "none";
      logoutBtn.style.zIndex = "100001";
      logoutBtn.style.pointerEvents = "auto";
    }
  }

  animateDomButtonPress(buttonElement) {
    if (!buttonElement) return;

    buttonElement.animate([
      { transform: 'translateY(0px) scale(1)', filter: 'brightness(1)' },
      { transform: 'translateY(2px) scale(0.96)', filter: 'brightness(1.15)' },
      { transform: 'translateY(0px) scale(1)', filter: 'brightness(1)' }
    ], {
      duration: 180,
      easing: 'ease-out'
    });
  }

  bindSplashLogoutButton() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (!logoutBtn) return;

    logoutBtn.onclick = async (event) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      this.animateDomButtonPress(logoutBtn);

      if (!this.isSceneUsable() || this._isTransitioning) return;

      this._isTransitioning = true;
      localStorage.removeItem("email");
      localStorage.removeItem("user_logged_in");

      const emailInput = document.getElementById("emailInput");
      const verificationCodeInput = document.getElementById("verificationCodeInput");
      if (emailInput) emailInput.value = "";
      if (verificationCodeInput) verificationCodeInput.value = "";

      this.syncAuthUI(false);

      if (window.showSuccessNotification) {
        window.showSuccessNotification('👋 Logout successful - Welcome back!');
      }

      this._isTransitioning = false;
    };
  }

  setupLevel01Button() {
    const level1 = this.add.image(233, 269, "text1").setScale(0.6).setInteractive();
    const level1Glow = this.add.image(233, 280, "text1glow").setScale(0.6).setVisible(false);
    const btnBlue = this.add.image(233, 280, "btnBlue").setScale(0.8).setVisible(false);
    
    level1Glow.setDepth(22);
    btnBlue.setDepth(21);
    level1.setDepth(23);

    // ================= CONFIG MUDAH DISENTUH =================
    const BOX_CFG = {
      offsetBelow: 110, // turunkan baris kotak
      gap: 18,          // jarak antar 2 kotak (ubah kecil/besar)
      pad: 14,          // padding kiri/kanan dalam kotak
      boxH: 44,         // tinggi kotak
      shiftX: 16,      // geser seluruh baris (negatif = kiri)
      leftFont:  'bold 20px Arial',
      rightFont: 'bold 19px Arial',
      scanWidth: 60,   // panjang garis scan
      scanSpan: 68      // setengah jarak kiri-kanan dari pusat (scanStart = -span, scanEnd = +span)
    };
    // ==========================================================

    // Helper ukur teks
    const measure = (str, font) => {
      const t = this.add.text(0,0,str,{ font, fill:'#fff'}).setVisible(false);
      const w = t.width; t.destroy(); return w;
    };

    const leftLabel  = APP_VERSION;
    const rightLabel = 'View Release Notes';

    const minLeft  = Math.ceil(measure(leftLabel,  BOX_CFG.leftFont)  + BOX_CFG.pad*2);
    const minRight = Math.ceil(measure(rightLabel, BOX_CFG.rightFont) + BOX_CFG.pad*2);

    const entranceWidth = level1.displayWidth;
    let gap = BOX_CFG.gap;
    let totalTarget = entranceWidth;

    // Jika total minimum + gap melebihi lebar kartu → kurangi gap dulu, lalu jika masih melebihi izinkan melebar (center)
    const needMin = minLeft + minRight + gap;
    if (needMin > totalTarget) {
      // coba tekan gap
      const minGapPossible = 8;
      const over = needMin - totalTarget;
      const newGap = Math.max(minGapPossible, gap - over);
      gap = newGap;
    }
    if (minLeft + minRight + gap > totalTarget) {
      totalTarget = minLeft + minRight + gap; // melebar sedikit melampaui kartu, tetap center visual
    }

    // Distribusi sisa ruang proporsional agar tetap rapi
    const extra = totalTarget - (minLeft + minRight + gap);
    let widthLeft  = minLeft  + Math.round(extra * (minLeft /(minLeft + minRight)));
    let widthRight = totalTarget - gap - widthLeft;
    // Safety: pastikan kanan muat teks
    if (widthRight < minRight) { widthRight = minRight; widthLeft = totalTarget - gap - widthRight; }

    // Posisi kiri (align ke kiri kartu jika totalTarget == entranceWidth, kalau melebar → center)
    const baseLeft = (totalTarget === entranceWidth)
      ? (level1.x - entranceWidth/2)
      : (level1.x - totalTarget/2);
    const rowLeft = baseLeft + BOX_CFG.shiftX;
    const rowY    = level1.y + level1.displayHeight/2 + BOX_CFG.offsetBelow;
    const GreenDark = 0x035154;

    // Kotak kiri
    const leftBox = this.add.rectangle(rowLeft, rowY, widthLeft, BOX_CFG.boxH, GreenDark, 0.98)
      .setOrigin(0,0.5).setStrokeStyle(2,0xffffff).setDepth(100);
    this.add.rectangle(rowLeft - 1, rowY, 3, BOX_CFG.boxH, 0xffffff, 1)
      .setOrigin(0, 0.5).setDepth(102);  
    const leftText = this.add.text(rowLeft + widthLeft/2, rowY, leftLabel, {
      font: BOX_CFG.leftFont, fill:'#ffffff'
    }).setOrigin(0.5).setDepth(101);

    // Kotak kanan
    const rightX = rowLeft + widthLeft + gap;
    const rightBox = this.add.rectangle(rightX, rowY, widthRight, BOX_CFG.boxH, GreenDark, 0.98)
      .setOrigin(0,0.5).setStrokeStyle(2,0xffffff).setDepth(100)
      .setInteractive({ useHandCursor:true });
    const rightText = this.add.text(rightX + widthRight/2, rowY, rightLabel, {
      font: BOX_CFG.rightFont, fill:'#ffffff'
    }).setOrigin(0.5).setDepth(101).setInteractive({ useHandCursor:true });

    // Animasi pulse & light sweep
    this.tweens.add({
      targets: rightBox,
      alpha: { from: 0.98, to: 0.55 },
      duration: 850, yoyo:true, repeat:-1, ease:'Sine.easeInOut'
    });
    const sweep = this.add.rectangle(rightX + 10, rowY, 32, BOX_CFG.boxH - 10, 0xffffff, 0.18)
      .setOrigin(0,0.5).setDepth(102);
    this.tweens.add({
      targets: sweep,
      x: rightX + widthRight - 42,
      duration: 1300, yoyo:true, repeat:-1, ease:'Sine.easeInOut'
    });

    const openRelease = () => showChangelog(this);
    rightBox.on('pointerdown', openRelease);
    rightText.on('pointerdown', openRelease);
    
// ========== CINEMATIC BUTTON SETUP ==========
// Lebar tombol: 90% layar atau max 700px
const screenW = this.sys.game.config.width;
const btnWidth = Math.min(screenW * 0.9, 700);
const btnHeight = 90; // Lebih tinggi dari kotak lain
const btnX = screenW / 2 - btnWidth / 2;
const btnY = rowY - 100; // Geser ke atas, sesuaikan angka sampai pas di atas kepala kuda
//const btnY = rowY + BOX_CFG.boxH + 60; // Lebih turun

// Tombol kotak besar dengan efek glow cyan
const cinematicBox = this.add.rectangle(
  btnX, btnY,
  btnWidth, btnHeight,
  0xffffff, 0.10 // transparan putih
)
.setOrigin(0, 0.5)
.setStrokeStyle(4, 0x00eaff, 1)
.setDepth(100)
.setInteractive({ useHandCursor: true });

// Efek glow luar (layer di bawah)
const glow = this.add.rectangle(
  btnX + btnWidth/2, btnY,
  btnWidth + 32, btnHeight + 24,
  0x00eaff, 0.18
).setOrigin(0.5).setDepth(99);
this.tweens.add({
  targets: glow,
  alpha: { from: 0.18, to: 0.38 },
  duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
});

// Teks besar di tengah tombol
const cinematicText = this.add.text(
  btnX + btnWidth / 2, btnY,
  'Play Cinematic Black Horse',
  {
    font: 'bold 3rem Arial',
    fill: '#fff',
    align: 'center',
    stroke: '#00eaff',
    strokeThickness: 4,
    shadow: { color: '#00eaff', blur: 16, fill: true }
  }
).setOrigin(0.5).setDepth(101).setInteractive({ useHandCursor: true });

// Efek animasi sweep putih
const sweep2 = this.add.rectangle(btnX + 20, btnY, 36, btnHeight - 18, 0xffffff, 0.22)
  .setOrigin(0, 0.5).setDepth(102);
this.tweens.add({
  targets: sweep2,
  x: btnX + btnWidth - 56,
  duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
});

// Animasi pulse pada tombol
this.tweens.add({
  targets: cinematicBox,
  alpha: { from: 0.98, to: 0.55 },
  duration: 850, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
});

// Event klik tombol
cinematicBox.on('pointerdown', () => {
  const email = localStorage.getItem("email");
  if (!email) {
    document.getElementById("loginBox").style.display = "block";
    alert("Please Login with your email!");
    return;
  }
  this.scene.start('CinematicScene');
});
cinematicText.on('pointerdown', () => {
  const email = localStorage.getItem("email");
  if (!email) {
    document.getElementById("loginBox").style.display = "block";
    alert("Please Login with your email!");
    return;
  }
  this.scene.start('CinematicScene');
});



    // BATAS CINEMATIC BUTTON SETUP ==========

    // Garis cahaya "ENTER HERE" (dibatasi dekat teks)
    const scanBaseY = level1.y - level1.displayHeight/2 + Math.round(level1.displayHeight*0.28) + 6;
    const scanStart = level1.x - BOX_CFG.scanSpan;
    const scanEnd   = level1.x + BOX_CFG.scanSpan;
    const enterScan = this.add.rectangle(scanStart, scanBaseY, BOX_CFG.scanWidth, 3, 0xffffff, 0.85)
      .setOrigin(0,0.5).setDepth(50).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: enterScan,
      x: scanEnd - BOX_CFG.scanWidth,
      duration: 950,
      yoyo:true,
      repeat:-1,
      ease:'Sine.easeInOut'
    });

    // LEVEL 01 CLICK HANDLER (tetap)
    level1.on("pointerdown", async () => {
      level1Glow.setVisible(true);
      btnBlue.setVisible(true);
      const email = localStorage.getItem("email");
      if (!email) {
        document.getElementById("loginBox").style.display = "block";
        alert("Please Login with your email!");
        return;
      }
      this.saveRoundStarToCache?.();
      await this.handleLevel01Click(email, level1Glow, btnBlue);
    });
  }
    

  async handleLevel01Click(email, level1Glow, btnBlue) {
    const safeSetVisible = (gameObject, visible) => {
      if (!gameObject || !gameObject.scene || !gameObject.scene.sys || gameObject.scene.sys.isDestroyed || gameObject.active === false) {
        return;
      }
      gameObject.setVisible(visible);
    };

    const safeDisableInteractive = (gameObject) => {
      if (!gameObject || !gameObject.scene || !gameObject.scene.sys || gameObject.scene.sys.isDestroyed || gameObject.input == null) {
        return;
      }
      gameObject.disableInteractive();
    };

    try {
      if (!this.isSceneUsable() || this._isTransitioning) return;

      safeDisableInteractive(level1Glow);
      safeDisableInteractive(btnBlue);

      const localUserData = JSON.parse(localStorage.getItem(`gameData-${email}`) || '{}');
      const localProgress = localUserData.gameProgress || {};
      const resolvedScore = this.registry.get('level01Score') ?? this.level01Score ?? localProgress.level01Score ?? 0;
      const resolvedRound = this.registry.get('round') ?? this.round ?? localProgress.round ?? 1;
      const resolvedStarAlpha = this.registry.get('starBronzeAlpha') ?? this.starBronzeAlpha ?? localProgress.starBronzeAlpha ?? 0;
      const resolvedSilverStarAlpha = this.registry.get('starSilverBlackHorseAlpha') ?? this.starSilverAlpha ?? localProgress.starSilverBlackHorseAlpha ?? 0;
      const resolvedStarAwarded = this.registry.get('starAwarded') ?? this.starAwarded ?? localProgress.starAwarded ?? false;
      const resolvedSelectedSeries =
        (Number(localProgress.selectedSeries) === 1 || Number(localProgress.selectedSeries) === 2)
          ? Number(localProgress.selectedSeries)
          : null;
      const resolvedSeries2ScorePeak = Number(localProgress.series2ScorePeak) || 0;
      const resolvedSeries2PenaltyFloor = Number(localProgress.series2PenaltyFloor) || 0;
      const resolvedSeries2PenaltyLastScore = Number(localProgress.series2PenaltyLastScore) || 0;
      const resolvedSeries2PenaltyConsecutiveDrop = Number(localProgress.series2PenaltyConsecutiveDrop) || 0;
      const resolvedSeries2PenaltyTotalAccumulatedDrop = Number(localProgress.series2PenaltyTotalAccumulatedDrop) || 0;
      const resolvedSeries2PenaltyStage = String(localProgress.series2PenaltyStage || 'normal');
      const resolvedSeries2PenaltyRecoveryStage = String(localProgress.series2PenaltyRecoveryStage || 'none');
      const resolvedSeries2Blocked = localProgress.series2Blocked === true;
      const resolvedSeries2BlockCount = Number(localProgress.series2BlockCount) || 0;
      const resolvedSeries2BlockedNeedCandy = Number(localProgress.series2BlockedNeedCandy) || 0;
      const resolvedSeries2bhimbieUnlocked = localProgress.series2bhimbieUnlocked === true;

      // ✅ AUTO PAYMENT CHECK
      console.log('🔍 Auto checking payment status for:', email);
      const paymentData = await window.checkPaymentStatusFromBackend(email);
      if (!this.isSceneUsable()) return;
      
      if (paymentData && paymentData.isPaid === true) {
        console.log('✅ Payment detected! Auto-unlocking game...');

        // ✅ TAMBAHKAN UNLOCK LOGIC YANG LEBIH LENGKAP
        this.unblur10PuzzleButton();
        this.unlockGameAfterPurchase();
        this.unlockAllGameplayButtons();
        
        // Clear game over state
        localStorage.removeItem(`gameOver_${email}`);
        
        // Update user data
        let userData = JSON.parse(localStorage.getItem(`gameData-${email}`)) || {};
        userData.isGameOver = false;
        userData.isPaid = true;
        localStorage.setItem(`gameData-${email}`, JSON.stringify(userData));
        
        // Hide glow effect
        safeSetVisible(level1Glow, false);
        safeSetVisible(btnBlue, false);

        const transitionData = {
          isGameOver: false,
          isPaid: true,
          preserveScore: true,
          level01Score: resolvedScore,
          starBronzeAlpha: resolvedStarAlpha,
          starSilverBlackHorseAlpha: resolvedSilverStarAlpha,
          starAwarded: resolvedStarAwarded,
          round: resolvedRound,
          selectedSeries: resolvedSelectedSeries,
          series2ScorePeak: resolvedSeries2ScorePeak,
          series2PenaltyFloor: resolvedSeries2PenaltyFloor,
          series2PenaltyLastScore: resolvedSeries2PenaltyLastScore,
          series2PenaltyConsecutiveDrop: resolvedSeries2PenaltyConsecutiveDrop,
          series2PenaltyTotalAccumulatedDrop: resolvedSeries2PenaltyTotalAccumulatedDrop,
          series2PenaltyStage: resolvedSeries2PenaltyStage,
          series2PenaltyRecoveryStage: resolvedSeries2PenaltyRecoveryStage,
          series2Blocked: resolvedSeries2Blocked,
          series2BlockCount: resolvedSeries2BlockCount,
          series2BlockedNeedCandy: resolvedSeries2BlockedNeedCandy,
          series2bhimbieUnlocked: resolvedSeries2bhimbieUnlocked,
          returnFromSplashScene: true
        };
        
        console.log('🎮 Payment verified - proceeding to Level01Scene');
        this._isTransitioning = true;
        this.scene.start("Level01Scene", transitionData);
        return;
       }

      console.log('❌ No payment detected - using local preserved transition state');

      const transitionData = {
        preserveScore: true,
        level01Score: resolvedScore,
        round: resolvedRound,
        starBronzeAlpha: resolvedStarAlpha,
        starSilverBlackHorseAlpha: resolvedSilverStarAlpha,
        starAwarded: resolvedStarAwarded,
        selectedSeries: resolvedSelectedSeries,
        series2ScorePeak: resolvedSeries2ScorePeak,
        series2PenaltyFloor: resolvedSeries2PenaltyFloor,
        series2PenaltyLastScore: resolvedSeries2PenaltyLastScore,
        series2PenaltyConsecutiveDrop: resolvedSeries2PenaltyConsecutiveDrop,
        series2PenaltyTotalAccumulatedDrop: resolvedSeries2PenaltyTotalAccumulatedDrop,
        series2PenaltyStage: resolvedSeries2PenaltyStage,
        series2PenaltyRecoveryStage: resolvedSeries2PenaltyRecoveryStage,
        series2Blocked: resolvedSeries2Blocked,
        series2BlockCount: resolvedSeries2BlockCount,
        series2BlockedNeedCandy: resolvedSeries2BlockedNeedCandy,
        series2bhimbieUnlocked: resolvedSeries2bhimbieUnlocked,
        isGameOver: !!(localUserData.lossUser || localUserData.isGameOver),
        returnFromSplashScene: true
      };

      safeSetVisible(level1Glow, false);
      safeSetVisible(btnBlue, false);
      console.log('🎮 Proceeding to Level01Scene with preserved state only:', transitionData);
      this._isTransitioning = true;
      this.scene.start("Level01Scene", transitionData);

    } catch (error) {
      this._isTransitioning = false;
      if (this.isSceneUsable()) {
        safeSetVisible(level1Glow, false);
        safeSetVisible(btnBlue, false);
      }
      alert("Failed to check user status: " + error.message);
    }
  }

// ✅ ENHANCED LOGIN BUTTON WITH level01Score MANAGEMENT: WITH LAZY LOAD 
  // ✅ ENHANCED LOGIN HANDLER: ------ Mulai login handler ---------------
  setupEmailHandlers() {
    console.log('🔄 setupEmailHandlers called');
    // ✅ LOGIN HANDLER
    document.getElementById("loginBtn").onclick = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const loginBtn = document.getElementById('loginBtn');
      this.animateDomButtonPress(loginBtn);
      
      const inputEmail = document.getElementById('emailInput').value.trim();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!inputEmail) {
        alert("Please enter your email address!");
        loginInProgress = false;
        return;
      }
      if (!emailPattern.test(inputEmail)) {
        alert("Please enter a valid email address!");
        loginInProgress = false;
        return;
      }
      if (this.loginInProgress) return;
      this.loginInProgress = true;
      const originalText = loginBtn.textContent;
      loginBtn.disabled = true;
      loginBtn.textContent = 'Please Wait...';
      loginBtn.style.opacity = '0.6';
      try {
        // Proses register ke backend
        console.log('Step 1: Registering user...');
        const registered = await this.registerUser(inputEmail);
        console.log('Step 2: Registered?', registered);
        if (!registered) {
          alert('Failed to register email. Please try again.');
          return;
        }
        //localStorage.setItem("email", inputEmail);
        console.log('📧 Attempting login with email:', inputEmail);
    
        console.log('Step 3: Sending verification email...');
        // Selalu cek ke backend, kirim kode verifikasi ke email
        await this.resendVerificationEmail(inputEmail);
        console.log('Step 4: Showing verification box...');
        // Tampilkan verificationBox, sembunyikan login dan logoutBtn
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("logoutBtn").style.display = "none";
         // Tampilkan verificationBox
        document.getElementById("verificationBox").style.zIndex = "1000"; 
        document.getElementById("verificationBox").style.display = "block";
        document.getElementById("verificationCodeInput").style.display = "inline-block";
        document.getElementById("verifyBtn").style.display = "inline-block";
        console.log('✅ Verification box displayed');
        } catch (error) {
        if (error.response && error.response.data) {
        const errorData = error.response.data;
        }    
        console.error('❌ Login error:', error);
        alert('Login Error: ' + error.message);
        } finally {
        setTimeout(() => {
          loginBtn.disabled = false;
          loginBtn.textContent = originalText;
          loginBtn.style.opacity = '1';
          this.loginInProgress = false;
        }, 800);
      }
    };
    // ✅ VERIFY HANDLER
    document.getElementById("verifyBtn").onclick = async () => {
      this.animateDomButtonPress(document.getElementById("verifyBtn"));
      const email = document.getElementById('emailInput').value.trim();
      const raw = document.getElementById('verificationCodeInput').value || '';
      const code = raw.toUpperCase().replace(/[^A-Z0-9]/g, ''); // normalisasi OTP  
      //const code = document.getElementById('verificationCodeInput').value.trim();
      try {
        const response = await axios.post(
          `${window.BACKEND_URL}/api/users/verify-email`,
          { email, verificationCode: code },
          { timeout: 30000 }
        );
        const data = response.data;
    console.log('✅ Email verification response:', data);
    if (data.user && data.user.emailVerified === true) {
        //if (response.data.user && response.data.user.emailVerified === true) {
        //alert('Email verified successfully! Welcome to Black Horse Puzzle!');
          document.getElementById("verificationCodeInput").value = "";
          localStorage.setItem("email", email);
          localStorage.setItem("user_logged_in", "true"); // ← Tambahkan baris ini
          document.getElementById("verificationBox").style.display = "none";
          this.syncAuthUI(true);
          document.getElementById("verificationCodeInput").value = "";
          if (window.game && window.game.scene) {
            window.game.scene.start("SplashScene");
          }
          if (window.showSuccessNotification) {
          showSuccessNotification('✅ Email Verified - Welcome!');
        }
        } else {
          alert('Verification failed: ' + (response.data.message || 'Please check your code.'));
        }
      } catch (error) {
        alert('Verification failed: ' + error.message);
      }
    };
    //  EMAIL VERIFICATION FUNCTIONS:
  function verifyEmailFormat(email) {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  }
  // EMERGENCY FIX - PASTE SEKARANG:
  console.log('🚨 FIXING DUPLICATE FUNCTION - ADDING REAL BACKEND VERIFICATION');
  console.log('Username yang dikirim:', this.username);

async function checkEmailVerifiedFromBackend(email) {
  try {
    const response = await axios.post(
      `${window.BACKEND_URL}/api/users/check-email`,
      { email: email},
      { timeout: 30000 }
    );
    return response.data && response.data.emailVerified === true;
  } catch (error) {
    return false;
  }
}
    // ✅ RESEND HANDLER
    document.getElementById("resendVerificationBtn").onclick = async () => {
      this.animateDomButtonPress(document.getElementById("resendVerificationBtn"));
      const email = document.getElementById('emailInput').value.trim();
      if (!email) {
        alert('Please enter your email address!');
        return;
      }
      await this.resendVerificationEmail(email);
    };
  }
  //  Create missing window.gameUtils
gameUtils = {
    validateEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
};
    // ✅ ENHANCED EMAIL RESEND VERIFICATION CODE
async resendVerificationEmail(email) {
  try {
    const response = await axios.post(
      `${window.BACKEND_URL}/api/users/resend-verification`,
      { email },
      { timeout: 30000 }
    );
    const data = response.data;
    if (data.success) {
      alert('Verification code has been sent to your email. Please check your inbox or spam and move it to inbox for first time before resend code.');
      console.log('✅ Resend verification success:', email);
      return true;
    } else {
      alert('Failed to resend verification code. Please try again later.');
      console.warn('❌ Resend verification failed:', data.message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('❌ Error resend verification:', error.message);
    alert('An error occurred while resending the code. Please try again later.');
    return false;
  }
};
//  Create proper showMessage function
showMessage = function(message, color = '#ff6b6b') {
    alert(message);
    console.log('📢 Message:', message);
};   

// Redefine verifyEmailWithBackend with actual backend connection
//async function verifyEmailWithBackend(email) {
async verifyEmailWithBackend(email) {
  try {
    console.log('📧 Verifying email with backend:', email);
    // Step 1: Local format validation first
    //const isValid = verifyEmailFormat(email);
    const isValidFormat = verifyEmailFormat(email);
    if (!isValidFormat) {
      console.log('❌ Invalid email format');
      return false;
    }   
 
    // Step 2: Backend verification
    console.log('🔗 Attempting backend connection...');
    const result = await registerUser(email);
    if (result) {
      return true;
    }
     // Fallback jika backend gagal
    return false;
    } catch (error) {
    // Enhanced error handling with fallback
    if (error.name === 'AbortError') {
      console.log('⏰ Backend timeout - using fallback validation');
    } else if (error.message.includes('Failed to Axios request')) {
      console.log('🌐 Network error - using fallback validation');
    } else if (error.message.includes('CORS')) {
      console.log('🔒 CORS error - using fallback validation');
    }
    // FALLBACK: If backend fails but email format is valid, allow login
    const isValidFormat = verifyEmailFormat(email);
    if (isValidFormat) {
      console.log('✅ Using fallback validation - email format valid');
      return true;
    }
    return false;
  }
};

  // ========== LAZY LOAD METHODS ==========
  lazyLoadBackgroundAssets() {
    this.load.image("cover", "./Puzzle-Assets/Splash/Cover Black Horse and His Herd R300.webp");
    this.load.audio("music", "./Puzzle-Assets/Sfx/scenes/splash02_music_cowboy_western_background.mp3");
    this.load.audio("herdGallop", "./Puzzle-Assets/Sfx/sound/herd_gallop.mp3");
    this.load.image("flower", "./Puzzle-Assets/Splash/Flower orange red.webp");
    this.load.image("flowerR", "./Puzzle-Assets/Splash/Red Cactus Flower.webp");
    this.load.image("grass", "./Puzzle-Assets/Splash/Cutting Grass.webp");
    this.load.image("grass02", "./Puzzle-Assets/Splash/Grass02.webp");
    this.load.image("btnRed", "./Puzzle-Assets/UI/Sp Button Red Level 02.webp");
    
    this.load.spritesheet("brownHorse01", "./Puzzle-Assets/Splash/BrownHorseRun01.webp", {
      frameWidth: 750, frameHeight: 750
    });
    this.load.spritesheet("brownHorse02", "./Puzzle-Assets/Splash/BrownHorseRun02.webp", {
      frameWidth: 750, frameHeight: 750
    });
    this.load.spritesheet("brownHorse03", "./Puzzle-Assets/Splash/BrownHorseRun03.webp", {
      frameWidth: 750, frameHeight: 750
    });
    this.load.spritesheet("ladyhorse", "./Puzzle-Assets/Splash/LadyHorseRun.webp", {
      frameWidth: 750, frameHeight: 750
    });

    this.load.once('complete', () => {
      if (!this.isSceneUsable()) return;
      console.log('✅ Background assets loaded!');
      this.backgroundMusicLoaded = true;
      this.createBackgroundElements();
    });

    this.load.start();
  }

  lazyLoadLevel01Assets(callback) {
    this.load.once('complete', () => {
      if (!this.isSceneUsable()) return;
      console.log('✅ Level01 assets loaded!');
      if (typeof callback === 'function') callback();
    }); 
    
    this.load.start();
  }

  createBackgroundElements() {
    if (!this.isSceneUsable()) return;
    const herdCover = this.add.image(960, 640, "cover").setScale(1).setDepth(0);
    herdCover.setAlpha(0);
    
    this.tweens.add({
      targets: herdCover,
      alpha: 1,
      duration: 2000,
      ease: 'Power2'
    });
    
    // ✅ PARTICLES DUST EFFECT
    const particles = this.add.particles(0, 0, "dust", {
      x: { min: 10, max: 1900 },
      y: { min: 800, max: 1250 },
      speed: { min: 5, max: 70 },
      lifespan: 5000,
      quantity: 2,
      alpha: { start: 0.2, end: 0 },
      scale: { start: 0.1, end: 1 },
      angle: { min: -50, max: -100 },
      blendMode: "ADD"
    });

    // ✅ GRASS & FLOWER ANIMATIONS
    this.createGrassAnimations();
    this.createFlowerAnimations();
    this.createHorseAnimations();

    if (this.backgroundCover) {
      this.backgroundCover.setVisible(false);
    }
  }

  createGrassAnimations() {
    const grassPositions = [
      { x: 200, y: 1100, scale: 1.0, type: "grass" },//grass1
      { x: 400, y: 1280, scale: 0.6, type: "grass02" },//grass2
      { x: 500, y: 1290, scale: 0.8, type: "grass" },//grass3
      { x: 800, y: 1230, scale: 0.7, type: "grass02" },//grass4
      { x: 1000, y: 1215, scale: 0.9, type: "grass" },//grass5
      { x: 1200, y: 1225, scale: 0.65, type: "grass02" },//grass6
      { x: 1400, y: 1205, scale: 0.85, type: "grass" },//grass7
      { x: 1600, y: 1235, scale: 0.75, type: "grass02" },//grass8
      { x: 1800, y: 1250, scale: 1.05, type: "grass" }//grass9
    ];

    grassPositions.forEach((grass, index) => {
      const grassSprite = this.add.image(grass.x, grass.y, grass.type)
        .setScale(grass.scale)
        .setDepth(10);
      
      this.tweens.add({
        targets: grassSprite,
        rotation: (index % 2 === 0) ? 0.1 : -0.1,
        duration: 2000 + (index * 100),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    });
  }

  createFlowerAnimations() {
    const flowerPositions = [
      { x: 150, y: 1280, scale: 0.6, type: "flower" },//flower1
      { x: 700, y: 1280, scale: 0.5, type: "flowerR" },//flower2
      { x: 1000, y: 1340, scale: 0.5, type: "flower" },//flower3
      { x: 1500, y: 1220, scale: 0.5, type: "flowerR" },//flower4
      { x: 1760, y: 1365, scale: 0.55, type: "flower" }//flower5
    ];

    flowerPositions.forEach((flower, index) => {
      const flowerSprite = this.add.image(flower.x, flower.y, flower.type)
        .setScale(flower.scale)
        .setDepth(11);
      
      flowerSprite.setOrigin(0.5, 1);
      
      this.tweens.add({
        targets: flowerSprite,
        rotation: 0.1 + (index * 0.02),
        duration: 3000 + (index * 200),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    });
  }

  createHorseAnimations() {
    // ✅ BROWN HORSES ANIMATIONS
    const horseTypes = ["brownHorse01", "brownHorse02", "brownHorse03", "ladyhorse"];
    const horsePositions = [
      { x: 980, y: 890, scale: 0.8 },//brownHorse01
      { x: 1230, y: 840, scale: 0.75 },//brownHorse02
      { x: 1450, y: 830, scale: 0.7 },//brownHorse03
      { x: 1750, y: 830, scale: 0.7 } //ladyhorse
    ];

    horseTypes.forEach((horseType, index) => {
      const animKey = horseType === "ladyhorse" ? "runLady" : `run${horseType.slice(-2)}`;
      
      if (!this.anims.exists(animKey)) {
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers(horseType, { start: 0, end: 2 }),
          frameRate: 4,
          repeat: -1
        });
      }
      
      const horse = this.add.sprite(
        horsePositions[index].x, 
        horsePositions[index].y, 
        horseType
      ).setScale(horsePositions[index].scale);
      
      horse.play(animKey);
    });
       if (this.backgroundCover) {
  this.backgroundCover.setVisible(false);
  console.log('✅ Solo cover hidden');
} else {
  console.log('⚠️ backgroundCover not found');
}
 console.log('✅ herd cover displayed, solo background hidden');
    // ✅ Background cover already handled above
 console.log('✅ All background elements created successfully');
}

  // ========== GAME LOGIC METHODS ==========
  setupBoard(data) {
    if (this.playBtn) {
      this.playBtn.setAlpha(0.5);
      this.playBtn.disableInteractive();
      this.playBtn.setVisible(true);
    }

    if (data && data.unlocked) {
      if (this.playBtn) {
        this.playBtn.setAlpha(1);
        this.playBtn.setInteractive({ useHandCursor: true });
        this.playBtn.setVisible(true);
      }
    }
    console.log('setupBoard dipanggil dengan:', data);
  }

  lockAllGameplayButtons() {
    if (this.playBtn) {
      this.playBtn.disableInteractive();
      this.playBtn.setAlpha(0.5);
    }
    if (this.lv01Puzzle10Btn) {
      this.lv01Puzzle10Btn.disableInteractive();
      this.lv01Puzzle10Btn.setAlpha(0.5);
    }
    console.log('✅ Semua tombol gameplay dikunci');
  }

  unlockAllGameplayButtons() {
    if (this.playBtn) {
      this.playBtn.setInteractive();
      this.playBtn.setAlpha(1);
    }
    if (this.lv01Puzzle10Btn) {
      this.lv01Puzzle10Btn.setInteractive();
      this.lv01Puzzle10Btn.setAlpha(1);
    }
    console.log('✅ Semua tombol gameplay dibuka');
  }

  unlockGameAfterPurchase() {
    if (this.level1) {
      this.level1.setInteractive();
      this.level1.setAlpha(1);
    }
    if (this.playBtn) {
      this.playBtn.setInteractive();
      this.playBtn.setAlpha(1);
    }
    this.unblur10PuzzleButton && this.unblur10PuzzleButton();
    console.log('✅ Game unlocked after purchase');
  }

  showGameOverReturnMessage() {
    // alert("Game Over! Unlock with Black Horse's favorite menu");
  }

  blur10PuzzleButton() {
    if (this.lv01Puzzle10Btn) {
      this.lv01Puzzle10Btn.disableInteractive();
      this.lv01Puzzle10Btn.setAlpha(0.5);
    }
    if (this.playBtn) {
      this.playBtn.disableInteractive();
      this.playBtn.setAlpha(0.5);
    }
  }

  unblur10PuzzleButton() {
    if (this.lv01Puzzle10Btn) {
      this.lv01Puzzle10Btn.setInteractive();
      this.lv01Puzzle10Btn.setAlpha(1);
    }
    console.log('✅ Tombol 10 Puzzle di-unblur');
  }

  // ========== BACKEND FUNCTIONS (PINDAH KE BAWAH) ==========
  // ✅ TAMBAHKAN SEMUA BACKEND FUNCTIONS LAINNYA DI SINI
  async saveScorePersistent() {
    const email = localStorage.getItem('email');
  if (!email) {
    console.warn('❌ Email tidak ditemukan untuk saveScorePersistent');
    return;
  }

  let userData = JSON.parse(localStorage.getItem(`gameData-${email}`)) || {};
  userData.gameProgress = userData.gameProgress || {};

  try {
    // 1. Update window global
    window.level01Score = this.level01Score;
    window.starBronzeAlpha = this.starBronzeAlpha;
    window.starSilverAlpha = this.starSilverAlpha || 0;
    window.starAwarded = this.starAwarded;
    window.round = this.round;
    window.starBronzeBlackHorse = this.starBronzeBlackHorse;

    // 2. Simpan ke backend dulu
    const safeProgress = userData.gameProgress || {};
    await window.updateUserProgress(email, {
      level01Completed: true,
      level01Score: this.level01Score,
      level01HighScore: Math.max(this.level01Score, safeProgress.level01HighScore || 0),
      totalPlays: (safeProgress.totalPlays || 0) + 1,
      round: this.round,
      starBronzeAlpha: this.starBronzeAlpha, 
      starSilverBlackHorseAlpha: this.starSilverAlpha || safeProgress.starSilverBlackHorseAlpha || 0,
      starAwarded: this.starAwarded,
      starBronzeBlackHorseAlpha: this.starBronzeBlackHorseAlpha,
      completionTime: this.timeElapsed,
      isPerfectGame: false,
      perfectGames: false,
      totalAttempts: (safeProgress.totalAttempts || 0) + 1,
      bestTime: this.timeElapsed,
      completionRate: 100 // Asumsi 100% jika selesai 
    });
    console.log(`💾 Score saved to BACKEND: ${this.level01Score}`);

    // 3. Simpan ke localStorage sebagai cadangan
    userData.gameProgress.level01Completed = true;
    userData.gameProgress.level01Score = this.level01Score;
    userData.gameProgress.level01HighScore = Math.max(this.level01Score, userData.gameProgress.level01HighScore || 0);
    userData.gameProgress.totalPlays = (userData.gameProgress.totalPlays || 0) + 1;
    userData.gameProgress.round = this.round;
    userData.gameProgress.starBronzeAlpha = this.starBronzeAlpha;
    userData.gameProgress.starSilverBlackHorseAlpha = this.starSilverAlpha || userData.gameProgress.starSilverBlackHorseAlpha || 0;
    userData.gameProgress.starAwarded = this.starAwarded;
    userData.gameProgress.bestTime = this.timeElapsed;
    userData.gameProgress.isPerfectGame = false;
    userData.gameProgress.perfectGames = false;
    userData.gameProgress.totalAttempts = (userData.gameProgress.totalAttempts || 0) + 1;
    userData.gameProgress.completionTime = this.timeElapsed;
    userData.gameProgress.completionRate = 100; // Asumsi 100% jika selesai
    userData.gameProgress.lastSaved = new Date().toISOString();
    window.level01Score = this.level01Score;
    window.starBronzeAlpha = this.starBronzeAlpha;
    localStorage.setItem(`gameData-${email}`, JSON.stringify(userData));
    console.log(`💾 Score backup to localStorage: ${this.level01Score}`);

    } catch (error) {
    console.warn('❌ Backend save failed, using localStorage only:', error);

    // 3. Fallback ke localStorage jika backend gagal
    userData.gameProgress.level01Completed = true;
    userData.gameProgress.level01Score = this.level01Score;
    userData.gameProgress.level01HighScore = Math.max(this.level01Score, userData.gameProgress.level01HighScore || 0);
    userData.gameProgress.totalPlays = (userData.gameProgress.totalPlays || 0) + 1;
    userData.gameProgress.round = this.round;
    userData.gameProgress.starBronzeAlpha = this.starBronzeAlpha;
    userData.gameProgress.starSilverBlackHorseAlpha = this.starSilverAlpha || userData.gameProgress.starSilverBlackHorseAlpha || 0;
    userData.gameProgress.starAwarded = this.starAwarded;
    userData.gameProgress.bestTime = this.timeElapsed;
    userData.gameProgress.isPerfectGame = false;    
    userData.gameProgress.perfectGames = false;
    userData.gameProgress.totalAttempts = (userData.gameProgress.totalAttempts || 0) + 1;
    userData.gameProgress.completionTime = this.timeElapsed;
    userData.gameProgress.completionRate = 100; // Asumsi 100% jika selesai
    userData.gameProgress.lastSaved = new Date().toISOString();
    window.level01Score = this.level01Score;
    window.starBronzeAlpha = this.starBronzeAlpha;
    localStorage.setItem(`gameData-${email}`, JSON.stringify(userData));
    console.log(`💾 Score saved to localStorage (fallback): ${this.level01Score}`);
   }

  // Update score text di UI
  if (this.scoreText) { 
  //this.scoreText.setText(this.level01Score.toString().padStart(6, '0'));
  this.scoreText.setText(this.formatScore(this.level01Score));
}
}

  // 4. GET SCORE PERSISTENT (BACKEND + localStorage) >>> tidak ada di userRoutes.js  
  async getScorePersistent() {
   const email = localStorage.getItem('email');
  if (!email) return 0;

  try {
    // 1. Ambil dari backend dulu
    const progressRes = await window.getUserProgress(email);
    if (progressRes && progressRes.progress && typeof progressRes.progress.level01Score === 'number') {
      console.log(`📥 Score loaded from BACKEND: ${progressRes.progress.level01Score}`);
      console.log(`👤 User status from BACKEND: newUser=${progressRes.newUser}, winUser=${progressRes.winUser}, lossUser=${progressRes.lossUser}`);

      // Update localStorage sebagai cadangan dengan SEMUA data termasuk user status
      let userData = JSON.parse(localStorage.getItem(`gameData-${email}`)) || {};
      userData.gameProgress = userData.gameProgress || {};
      userData.gameProgress.level01Score = progressRes.progress.level01Score;
      userData.gameProgress.level01HighScore = progressRes.progress.level01HighScore || 0;
      userData.gameProgress.totalPlays = progressRes.progress.totalPlays || 0;
      userData.gameProgress.round = progressRes.progress.round || 1;
      userData.gameProgress.starBronzeAlpha = progressRes.progress.starBronzeAlpha || 0;
      userData.gameProgress.starSilverBlackHorseAlpha = progressRes.progress.starSilverBlackHorseAlpha || userData.gameProgress.starSilverBlackHorseAlpha || 0;
      userData.gameProgress.starAwarded = progressRes.progress.starAwarded || false;
      userData.gameProgress.level01Completed = progressRes.progress.level01Completed || false;
      userData.gameProgress.bestTime = progressRes.progress.bestTime || 0;
      userData.gameProgress.averageTime = progressRes.progress.averageTime || 0;
      userData.gameProgress.isPerfectGame = progressRes.progress.isPerfectGame || false;
      userData.gameProgress.perfectGames = progressRes.progress.perfectGames || false;    
      userData.gameProgress.totalAttempts = progressRes.progress.totalAttempts || 0;
      userData.gameProgress.completionTime = progressRes.progress.completionTime || 0;
      userData.gameProgress.completionRate = progressRes.progress.completionRate || 0;
      userData.gameProgress.lastSaved = new Date().toISOString();
   
      
      // ✅ TAMBAH USER STATUS KE LOCALSTORAGE
      userData.newUser = progressRes.newUser || false;
      userData.winUser = progressRes.winUser || false;
      userData.lossUser = progressRes.lossUser || false;
      userData.userStatusLastUpdated = new Date().toISOString();
      
      localStorage.setItem(`gameData-${email}`, JSON.stringify(userData));
      console.log(`💾 User data synced to localStorage with user status`);

      return progressRes.progress.level01Score;
    }
  } catch (error) {
    console.warn('❌ Backend get failed, using localStorage:', error);
  }

  // 2. Fallback ke localStorage jika backend gagal
  let userData = JSON.parse(localStorage.getItem(`gameData-${email}`)) || {};
  
  // ✅ KONSISTEN DENGAN BACKEND: GUNAKAN STRUKTUR progress YANG SAMA
  const progress = {
    level01Score: userData.gameProgress?.level01Score ?? 0,
    starBronzeAlpha: userData.gameProgress?.starBronzeAlpha ?? 0,
    starSilverBlackHorseAlpha: userData.gameProgress?.starSilverBlackHorseAlpha ?? 0,
    starAwarded: userData.gameProgress?.starAwarded ?? false,
    level01Completed: userData.gameProgress?.level01Completed ?? false,
    level01HighScore: userData.gameProgress?.level01HighScore ?? 0,
    totalPlays: userData.gameProgress?.totalPlays ?? 0,
    round: userData.gameProgress?.round ?? 1,
    starBronzeAlpha: userData.gameProgress?.starBronzeAlpha ?? 0,
    starAwarded: userData.gameProgress?.starAwarded ?? false,
    bestTime: userData.gameProgress?.bestTime ?? 0,
    averageTime: userData.gameProgress?.averageTime ?? 0,
    completionRate: userData.gameProgress?.completionRate ?? 0,
    perfectGames: userData.gameProgress?.perfectGames ?? false,
    totalAttempts: userData.gameProgress?.totalAttempts ?? 0,
    completionTime: userData.gameProgress?.completionTime ?? 0,
    isPerfectGame: userData.gameProgress?.isPerfectGame ?? false
  };
  
  // ✅ KALKULASI USER STATUS MENGGUNAKAN progress (PERSIS SAMA SEPERTI BACKEND)
  const userStatusFromProgress = {
    newUser: !progress || progress.totalPlays === 0,
    winUser: progress && progress.totalPlays >= 1 && (progress.level01Score || 0) > 0,
    lossUser: progress && progress.totalPlays >= 3 && (progress.level01Score || 0) === 0
  };
  
  // ✅ SELALU UPDATE USER STATUS (KONSISTEN DENGAN BACKEND APPROACH)
  userData.newUser = userStatusFromProgress.newUser;
  userData.winUser = userStatusFromProgress.winUser;
  userData.lossUser = userStatusFromProgress.lossUser;
  userData.userStatusCalculatedLocally = true;
  userData.userStatusLastUpdated = new Date().toISOString();
  localStorage.setItem(`gameData-${email}`, JSON.stringify(userData));
  
  console.log(`📥 Score loaded from localStorage (fallback): ${progress.level01Score}`);
  console.log(`👤 User status from localStorage: newUser=${userData.newUser}, winUser=${userData.winUser}, lossUser=${userData.lossUser}`);
  return progress.level01Score; 
  }

 

   
  // ========== INITIALIZE USER DATA ==========
  async initUserData(email, userData = null) {
    try {
      console.log(`🔄 Initializing user data for: ${email}`);

      const progressRes = await window.getUserProgress(email);
      
      if (progressRes && progressRes.success && progressRes.progress) {
        const progress = progressRes.progress;
        const userDataLocal = JSON.parse(localStorage.getItem(`gameData-${email}`)) || {};
        const localProgress = userDataLocal.gameProgress || {};

        const parseSavedTime = (value) => {
          const timestamp = Date.parse(value || 0);
          return Number.isFinite(timestamp) ? timestamp : 0;
        };
        const readNumber = (source, key) => {
          const value = Number(source?.[key]);
          return Number.isFinite(value) ? value : null;
        };
        const readBoolean = (source, key) => {
          return typeof source?.[key] === 'boolean' ? source[key] : null;
        };

        const backendSavedAt = parseSavedTime(progress.lastSaved);
        const localSavedAt = parseSavedTime(localProgress.lastSaved);
        const latestProgress = localSavedAt > backendSavedAt ? localProgress : progress;
        const fallbackProgress = localSavedAt > backendSavedAt ? progress : localProgress;

        const pickLatestNumber = (key, fallbackValue = 0) => {
          const latestValue = readNumber(latestProgress, key);
          if (latestValue !== null) return latestValue;

          const fallbackValueFromOther = readNumber(fallbackProgress, key);
          if (fallbackValueFromOther !== null) return fallbackValueFromOther;

          const ownValue = Number(fallbackValue);
          return Number.isFinite(ownValue) ? ownValue : 0;
        };

        const pickLatestBoolean = (key, fallbackValue = false) => {
          const latestValue = readBoolean(latestProgress, key);
          if (latestValue !== null) return latestValue;

          const fallbackValueFromOther = readBoolean(fallbackProgress, key);
          if (fallbackValueFromOther !== null) return fallbackValueFromOther;

          return fallbackValue === true;
        };

        this.level01Score = pickLatestNumber('level01Score', this.level01Score ?? window.level01Score ?? 0);
        this.starBronzeAlpha = pickLatestNumber('starBronzeAlpha', this.starBronzeAlpha ?? window.starBronzeAlpha ?? 0);
        this.starSilverAlpha = pickLatestNumber('starSilverBlackHorseAlpha', this.starSilverAlpha ?? window.starSilverAlpha ?? 0);
        this.starAwarded = pickLatestBoolean('starAwarded', this.starAwarded === true || window.starAwarded === true);
        this.level01HighScore = Math.max(
          readNumber(progress, 'level01HighScore') ?? 0,
          readNumber(localProgress, 'level01HighScore') ?? 0,
          this.level01Score
        );
        this.totalPlays = Math.max(
          readNumber(progress, 'totalPlays') ?? 0,
          readNumber(localProgress, 'totalPlays') ?? 0,
          Number(this.totalPlays) || 0
        );
        this.level01Completed = pickLatestBoolean('level01Completed', this.level01Completed === true);
        this.round = Math.max(1, pickLatestNumber('round', this.round ?? window.round ?? 1));
        this.bestTime = pickLatestNumber('bestTime', this.bestTime ?? 0);
        this.averageTime = pickLatestNumber('averageTime', this.averageTime ?? 0);
        this.completionRate = pickLatestNumber('completionRate', this.completionRate ?? 0);
        this.perfectGames = pickLatestBoolean('perfectGames', this.perfectGames === true);
        this.totalAttempts = pickLatestNumber('totalAttempts', this.totalAttempts ?? 0);
        this.completionTime = pickLatestNumber('completionTime', this.completionTime ?? 0);
        this.isPerfectGame = pickLatestBoolean('isPerfectGame', this.isPerfectGame === true);
        
        // ✅ 11.3. UPDATE USER STATUS DARI BACKEND RESPONSE
        this.newUser = progressRes.newUser || false;
        this.winUser = progressRes.winUser || false;
        this.lossUser = progressRes.lossUser || false;
        this.isGameOver = progressRes.isGameOver || false;
        
        // ✅ 11.4. UPDATE WINDOW GLOBAL VARIABLES
        window.level01Score = this.level01Score;
        window.starBronzeAlpha = this.starBronzeAlpha;
        window.starSilverAlpha = this.starSilverAlpha || 0;

        // ✅ 11.5. UPDATE UI JIKA SUDAH ADA
        if (this.scoreText) {
          //this.scoreText.setText(this.level01Score.toString().padStart(6, '0'));
          this.scoreText.setText(this.formatScore(this.level01Score));
        }
        if (this.starBronzeBlackHorse && this.starBronzeAlpha > 0) {
          this.starBronzeBlackHorse.setAlpha(this.starBronzeAlpha);
        }
        
        // ✅ 11.6. SYNC KE LOCALSTORAGE SEBAGAI BACKUP
        const resolvedProgress = {
          ...progress,
          ...localProgress,
          level01Score: this.level01Score,
          starBronzeAlpha: this.starBronzeAlpha,
          starSilverBlackHorseAlpha: this.starSilverAlpha || 0,
          starAwarded: this.starAwarded,
          level01HighScore: this.level01HighScore,
          totalPlays: this.totalPlays,
          level01Completed: this.level01Completed,
          round: this.round,
          bestTime: this.bestTime,
          averageTime: this.averageTime,
          completionRate: this.completionRate,
          perfectGames: this.perfectGames,
          totalAttempts: this.totalAttempts,
          completionTime: this.completionTime,
          isPerfectGame: this.isPerfectGame,
          lastSaved: latestProgress.lastSaved || fallbackProgress.lastSaved || progress.lastSaved || localProgress.lastSaved || null
        };

        const userData = {
          ...userDataLocal,
          gameProgress: resolvedProgress,
          newUser: progressRes.newUser,
          winUser: progressRes.winUser,
          lossUser: progressRes.lossUser,
          isGameOver: progressRes.isGameOver,
          lastSyncFromBackend: new Date().toISOString(),
          backendSyncSuccess: true
        };
        localStorage.setItem(`gameData-${email}`, JSON.stringify(userData));
        
        console.log(`✅ User data initialized from backend:`, {
          level01Score: this.level01Score,
          totalPlays: this.totalPlays,
          round: this.round,
          starBronzeAlpha: this.starBronzeAlpha,
          starAwarded: this.starAwarded,
          newUser: this.newUser,
          winUser: this.winUser,
          lossUser: this.lossUser,
          isGameOver: this.isGameOver
        });
        
        return {
          success: true,
          source: 'backend',
          progress: resolvedProgress,
          userStatus: {
            newUser: this.newUser,
            winUser: this.winUser,
            lossUser: this.lossUser,
            isGameOver: this.isGameOver
          }
        };
        
      } else {
        console.warn('❌ Backend response invalid, using fallback initialization');
        throw new Error('Backend response invalid');
      }
      
    } catch (error) {
      console.warn('❌ Backend initialization failed, using localStorage fallback:', error);
      
      // ✅ 11.7. FALLBACK KE LOCALSTORAGE + DEFAULT VALUES
      let userData = JSON.parse(localStorage.getItem(`gameData-${email}`)) || {};
      
      if (userData.gameProgress) {
        // Update dari localStorage yang ada
        this.level01Score = userData.gameProgress.level01Score || 0;
        this.starBronzeAlpha = userData.gameProgress.starBronzeAlpha || 0;
        this.starSilverAlpha = userData.gameProgress.starSilverBlackHorseAlpha || 0;
        this.starAwarded = userData.gameProgress.starAwarded || false;
        this.starBronzeBlackHorseAlpha = userData.gameProgress.starBronzeBlackHorseAlpha || 0;
        this.round = userData.gameProgress.round || 1;
        this.level01HighScore = userData.gameProgress.level01HighScore || 0;
        this.totalPlays = userData.gameProgress.totalPlays || 0;
        
        // Kalkulasi user status dari localStorage (konsisten dengan backend)
        this.newUser = !userData.gameProgress || userData.gameProgress.totalPlays === 0;
        this.winUser = userData.gameProgress && userData.gameProgress.totalPlays >= 1 && (userData.gameProgress.level01Score || 0) > 0;
        this.lossUser = userData.gameProgress && userData.gameProgress.totalPlays >= 3 && (userData.gameProgress.level01Score || 0) === 0;
        this.isGameOver = this.lossUser;
        
        console.log(`📥 User data loaded from localStorage fallback:`, {
          level01Score: this.level01Score,
          totalPlays: this.totalPlays,
          round: this.round,
          starBronzeAlpha: this.starBronzeAlpha,
          starAwarded: this.starAwarded,
          starBronzeBlackHorseAlpha: this.starBronzeBlackHorseAlpha,
          newUser: this.newUser,
          winUser: this.winUser,
          lossUser: this.lossUser
        });
        
      } else {
        // ✅ 11.8. DEFAULT INITIALIZATION UNTUK USER BARU
        this.level01Score = 0;
        this.starBronzeAlpha = 0;
        this.starAwarded = false;
        this.starBronzeBlackHorseAlpha = 0;
        this.level01HighScore = 0;
        this.totalPlays = 0;
        this.round = 1;
        this.bestTime = 0;
        this.averageTime = 0;
        this.completionRate = 0;
        this.perfectGames = false;
        this.totalAttempts = 0;
        this.completionTime = 0;
        this.isPerfectGame = false;
        this.level01Completed = false;
        
        // User status untuk user baru
        this.newUser = true;
        this.winUser = false;
        this.lossUser = false;
        this.isGameOver = false;
        
        // ✅ 11.9. SAVE DEFAULT DATA KE LOCALSTORAGE DAN BACKEND
        userData = {
          gameProgress: {
            level01Completed: false,
            level01Score: 0,
            level01HighScore: 0,
            totalPlays: 0,
            round: 1,
            bestTime: 0,
            averageTime: 0,
            completionRate: 0,
            perfectGames: false,
            totalAttempts: 0,
            completionTime: 0,
            isPerfectGame: false,
            starBronzeAlpha: 0,
            starAwarded: false,
            starBronzeBlackHorseAlpha: 0
          },
          newUser: true,
          winUser: false,
          lossUser: false,
          isGameOver: false,
          initializedFromDefault: true,
          lastSyncFromBackend: new Date().toISOString()
        };
        localStorage.setItem(`gameData-${email}`, JSON.stringify(userData));
        
        // ✅ 11.10. SYNC DEFAULT DATA KE BACKEND
        try {
          await window.updateUserProgress(email, userData.gameProgress);
          console.log(`✅ Default user data synced to backend for new user: ${email}`);
        } catch (syncError) {
          console.warn('❌ Failed to sync default data to backend:', syncError);
        }
        
        console.log(`🆕 New user initialized with default data: ${email}`);
      }
      
      return {
        success: true,
        source: 'fallback',
        progress: userData.gameProgress,
        userStatus: {
          newUser: this.newUser,
          winUser: this.winUser,
          lossUser: this.lossUser,
          isGameOver: this.isGameOver
        }
      };
    }
  }

  // ✅12. AUTO-SAVE METHOD
  setupAutoSave(email) {
    // Clear existing interval jika ada
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    // Auto-save setiap 5 detik
    this.autoSaveInterval = setInterval(async () => {
      if (!this.isSceneUsable()) {
        clearInterval(this.autoSaveInterval);
        this.autoSaveInterval = null;
        return;
      }
      if (!this._progressDirty) return; // Tidak ada perubahan, skip auto-save
      try {
        // ✅ AMBIL DATA DARI LOCALSTORAGE (KONSISTEN DENGAN initUserData)
        const userData = JSON.parse(localStorage.getItem(`gameData-${email}`)) || {};
        const gameProgress = userData.gameProgress || {};
        
        // ✅ VALIDASI DATA SEBELUM KIRIM
        if (gameProgress.level01Score > 0 || gameProgress.totalPlays > 0 || gameProgress.level01Completed) {
        
         // ✅ GUNAKAN updateUserProgress (SUDAH ADA DI CLASS)   
          await window.updateUserProgress(email, {
            level01Score: gameProgress.level01Score || 0,
            starBronzeAlpha: gameProgress.starBronzeAlpha || 0,
            starAwarded: gameProgress.starAwarded || false, 
            starBronzeBlackHorseAlpha: gameProgress.starBronzeBlackHorseAlpha || 0,
            totalPlays: gameProgress.totalPlays || 0,
            round: gameProgress.round || 1,
            level01HighScore: gameProgress.level01HighScore || 0,
            level01Completed: gameProgress.level01Completed || false,
            bestTime: gameProgress.bestTime || 0,
            averageTime: gameProgress.averageTime || 0,
            completionRate: gameProgress.completionRate || 0,
            perfectGames: gameProgress.perfectGames || false,
            totalAttempts: gameProgress.totalAttempts || 0,
            completionTime: gameProgress.completionTime || 0,
            isPerfectGame: gameProgress.isPerfectGame || false
          });
          
          console.log('💾 Auto-save completed:', gameProgress.level01Score);
        } else {
          console.log('⚠️ Auto-save skipped - no meaningful data to save');
        }
      } catch (error) {
        console.warn('❌ Auto-save failed:', error);
      }
      this._progressDirty = false; // Reset setelah berhasil save
    }, 5000); // 5 detik
    
    console.log('🔄 Auto-save setup completed for:', email);
    // Setelah berhasil save:
    this._progressDirty = false;
  }

  // ========== PAYMENT FUNCTIONS ==========
  
  // ✅ TAMBAHKAN SEMUA PAYMENT FUNCTIONS LAINNYA
  async createPayPalOrder(email, amount, message = 'Black Horse Puzzle Support') {
   try {
    const totalAmount = parseFloat(amount);
    const response = await axios.post(
      `${window.BACKEND_URL}/api/paypal/create-order`,
      {
        email,
        amount,
        message
      },
      { timeout: 200000 }
    );
    const data = response.data;
    if (data.success && data.paypalOrderId && data.approvalUrl) {
      // Simpan orderId untuk proses selanjutnya
      localStorage.setItem(`paypalOrderId_${email}`, data.paypalOrderId);
      // Redirect user ke PayPal approval
      window.open(data.approvalUrl, '_blank');
      return data.paypalOrderId;
    } else {
      alert('❌ Failed to create PayPal order: ' + (data.error || 'Unknown error'));
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating PayPal order:', error.message);
    alert('❌ Error creating PayPal order: ' + error.message);
    return null;
  }
  }

  // ✅ CAPTURE PEMBAYARAN SETELAH USER APPROVE DI PAYPAL
  async capturePayPalOrder(paypalOrderId, email) {
  try {
    const response = await axios.post(
      `${window.BACKEND_URL}/api/paypal/capture-order/${paypalOrderId}`,
      { email },
      { timeout: 200000 }
    );
    const data = response.data;
    if (data.success && data.paypalOrderId === paypalOrderId) {
      // Tandai payment verified di localStorage
      localStorage.setItem(`paymentVerified_${email}`, 'true');
      localStorage.removeItem(`gameOver_${email}`);
      //localStorage.setItem(`score_${email}`, "0");
      // Unlock fitur game jika scene aktif
      if (window.Level01Scene && typeof window.Level01Scene.prototype.unlockGameAfterPurchase === 'function') {
        //const scene = window.game && window.game.scene && window.game.scene.getScene(`${window.BACKEND_URL}/Scenes/Level01Scene.js`);
        const scene = window.getLevel01SceneSafe?.();
        if (scene && typeof scene.unlockGameAfterPurchase === 'function') {
          scene.unlockGameAfterPurchase();
        }
      }
      window.location.href = "/index.html";
      return true;
    } else {
      alert('❌ Payment not verified yet.');
      window.location.href = "/payment-error.html";
      return false;
    }
  } catch (error) {
    console.error('❌ Error capturing PayPal order:', error.message);
    alert('❌ Failed to capture PayPal payment: ' + error.message);
    window.location.href = "/payment-error.html";
    return false;
  } 
  }

  // ✅ PAYPAL TOKEN VERIFICATION FUNCTION:
  async verifyPayPalToken(token, payerID, email) {
  try {
    console.log('🅿️ Verifying PayPal token:', token);

    // Axios tidak mendukung AbortController langsung, jadi timeout pakai config
    const response = await axios.post(
      `${window.BACKEND_URL}/api/paypal/verify-paypal-token`,
      { token, payerID, email },
      { timeout: 200000 } // timeout dalam ms
    );

    const data = response.data;
    console.log('🅿️ PayPal token verification result:', data);

    return data.verified && data.status === 'APPROVED';

  } catch (error) {
    console.warn('⚠️ PayPal token verification failed:', error.message);
    
    // ✅ FALLBACK - ASSUME VALID IF TOKEN AND PAYER ID EXIST:
    if (token && payerID && token.length > 10 && payerID.length > 10) {
      console.log('🅿️ Using fallback verification - token and PayerID look valid');
      return true;
    }
    
    return false;
  }  
  }

  // ✅ PAYPAL VERIFICATION FUNCTIONS: Verify Order PayPal
  async verifyPayPalOrder(email) { //url sudah di letakan diatas dibawah BACKEND_URL
  try {
    const data = await window.payments.verifyPaypal(email);
    const statusOk = String(data.status || '').toLowerCase() === 'completed';
    return data.verified && statusOk;
  } catch (error) {
    console.warn('⚠️ PayPal payment verification failed:', error.message);
    return false;
  }
}

  // Fungsi monitoring status pembayaran secara berkala
  async startPaymentMonitoring(email) {
  // Monitor payment status every minute
  if (this.paymentCheckInterval) {
    clearInterval(this.paymentCheckInterval);
  }

  this.paymentCheckInterval = setInterval(async () => {
    if (!this.isSceneUsable()) {
      clearInterval(this.paymentCheckInterval);
      this.paymentCheckInterval = null;
      return;
    }
    try {
      await window.checkPaymentStatus?.(email);
      const paymentData = await window.checkPaymentStatusFromBackend(email);
      window.updateGamePaymentStatus(paymentData.isPaid, paymentData.method);
    } catch (monitoringError) {
      console.error('❌ Payment monitoring error:', monitoringError);
      // ✅ SHOW ERROR NOTIFICATION: ----muncul error di F12
      if (window.showErrorNotification) {
        showErrorNotification('❌ Payment monitor error: ' + monitoringError.message);
      }
    }
  }, 3000); // Check every minute
  console.log('🔄 Payment monitoring started for:', email);
}

  // ========== EMAIL FUNCTIONS ==========
  // Register user (di index.html)  
  async registerUser(email) {
    try {
      const response = await axios.post(
        `${window.BACKEND_URL}/api/users/register`,
        { email: email.toLowerCase().trim() },
        { timeout: 30000 }
      );
      const data = response.data;
      console.log('✅ Backend email verification successful:', data.message);
      return true;
    } catch (error) {
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        console.log('⚠️ Backend responded with error:', errorData.message);

        if (error.response.status === 409 && errorData.message.includes('already exists')) {
          console.log('✅ Email already registered - allowing login');
          return true;
        }

        throw new Error(`Backend error: ${errorData.message}`);
      }
      console.error('❌ Backend verification failed:', error.message);
      return false;
    }
  }


  // ✅ CLEANUP AUTO-SAVE SAAT SCENE DESTROY
  destroy() {
    this.shutdown();
    if (this.events) this.events.off('shutdown', this.shutdown, this);
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log('🛑 Auto-save interval cleared');
    }
    
    if (this.paymentCheckInterval) {
      clearInterval(this.paymentCheckInterval);
      this.paymentCheckInterval = null;
      console.log('🛑 Payment check interval cleared');
    }
     super.destroy();
  }

  shutdown() {
    if (this._isShuttingDown) return;
    this._isShuttingDown = true;
    this._isTransitioning = false;

    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }

    if (this.paymentCheckInterval) {
      clearInterval(this.paymentCheckInterval);
      this.paymentCheckInterval = null;
    }

    this.tweens?.killAll?.();
    this.sound.stopAll();
    this.time.removeAllEvents();
    this.input?.removeAllListeners?.();
  }

} // ← END OF CLASS

// SYNC PROGRESS DARI BACKEND (POST) >>> tidak ada di userRoutes.js
  window.syncProgressFromBackend = async (email) => {
  try {
      console.log('🔄 Syncing progress from backend for:', email);
      // ✅ STEP 1: Ambil data dari localStorage sebagai fallback
      const localData = JSON.parse(localStorage.getItem(`gameData-${email}`))?.gameProgress || {};
      const localProgress = localData.gameProgress || {};
      console.log('📱 Local data:', localProgress);
      // ✅ STEP 2: Kirim request ke backend dengan data lokal sebagai konteks
    const response = await axios.post(
      `${window.BACKEND_URL}/api/users/${encodeURIComponent(email)}/progress`,
      { 
        email, 
        level: 'Level01Scene',
        // Kirim data lokal untuk perbandingan
        localProgress: localProgress
      },
      { timeout: 200000 }
  );
  
     // ✅ STEP 3: Ambil data dari backend (PRIORITAS UTAMA)
    const backendData = response.data;
    const progress = backendData.progress || {};
    
    console.log('🌐 Backend data:', progress);
    // ✅ STEP 4: Hitung user classification berdasarkan data backend
    const newUser = !progress || (progress.totalPlays || 0) === 0;
    const winUser = progress && (progress.totalPlays || 0) >= 1 && (progress.level01Score || 0) > 0;
    const lossUser = progress && (progress.totalPlays || 0) >= 3 && (progress.level01Score || 0) === 0;
    
    console.log(`👤 Backend user classification: newUser=${newUser}, winUser=${winUser}, lossUser=${lossUser}`);
    
    // ✅ STEP 5: UPDATE localStorage dengan direct variables
// ✅ STEP 5: UPDATE localStorage dengan direct variables
const level01Score = progress.level01Score || 0;
const level01HighScore = progress.level01HighScore || 0;
const totalPlays = progress.totalPlays || 0;
const round = progress.round || 1;
const level01Completed = progress.level01Completed || false;
const bestTime = progress.bestTime || 0;
const averageTime = progress.averageTime || 0;
const completionRate = progress.completionRate || 0;
const perfectGames = progress.perfectGames || false;
const totalAttempts = progress.totalAttempts || 0;
const starBronzeAlpha = progress.starBronzeAlpha || 0;
const starAwarded = progress.starAwarded || false;
const starBronzeBlackHorseAlpha = progress.starBronzeBlackHorseAlpha || 0;
const gameOvers = backendData.gameOvers || 0;
const lastPlayedDate = backendData.lastPlayedDate || null;
const updatedUserData = {
  gameProgress: {
    level01Score,        
    level01HighScore,
    totalPlays,
    round,
    level01Completed,
    bestTime,
    averageTime,
    completionRate,
    perfectGames,
    totalAttempts,
    starBronzeAlpha,
    starAwarded,
    starBronzeBlackHorseAlpha
  },
  newUser,
  winUser,
  lossUser,
  lastSyncTime: new Date().toISOString(),
  syncedFromBackend: true
};
    // Update gameData - Simpan data pengguna yang diperbarui ke localStorage
    localStorage.setItem(`gameData-${email}`, JSON.stringify(updatedUserData));
    // Update score
    localStorage.setItem(`score_${email}`, (level01Score || 0).toString());
   
    // Update game history
    localStorage.setItem(`gameHistory_${email}`, JSON.stringify({
      hasPlayedBefore: (totalPlays || 0) > 0,
      round: round,
      starBronzeAlpha: starBronzeAlpha,
      starAwarded: starAwarded,
      starBronzeBlackHorseAlpha: starBronzeBlackHorseAlpha,
      bestTime: bestTime,
      levelCompleted: level01Completed,
      totalGamesPlayed: totalPlays || 0,
      highestScore: level01HighScore || 0,
      gameOvers: gameOvers || 0,
      lastPlayedDate: lastPlayedDate,
      favoriteGiven: false,
      newUser,
      winUser,
      lossUser
    }));
    
     // ✅ STEP 6: UPDATE global variables
    window.level01Score = level01Score || 0;
    window.playerScore = level01Score || 0;
    window.starBronzeBlackHorseAlpha = starBronzeBlackHorseAlpha || 0;
    window.starBronzeAlpha = starBronzeAlpha || 0;
    window.starAwarded = starAwarded || false;
    window.round = round || 1;
    window.totalPlays = totalPlays || 0;
    window.level01Completed = level01Completed || false;
    // ✅ STEP 7: UPDATE UI jika scene sudah aktif
    if (window.Phaser && window.game && window.game.scene) {
      const level01 = window.getLevel01SceneSafe?.(true);
      if (level01) {
        // Update score di scene
        if (level01.level01Score !== undefined) {
          level01.level01Score = level01Score || 0;
        }
        // Update scoreText
        if (level01.scoreText && typeof level01.scoreText.setText === 'function') {
          level01.scoreText.setText((level01Score || 0).toString().padStart(6, '0'));
        }
        console.log('🎮 Scene updated with backend data');
      }
    }
    console.log('✅ Synced progress from backend - Final data:', updatedUserData);
    console.log('✅ User status:', { newUser, winUser, lossUser });
    
    return {
      progress,
      newUser,
      winUser,
      lossUser,
      success: true
    };
    
  } catch (err) {
    console.error('❌ Failed to sync progress from backend:', err);
    
    // ✅ FALLBACK: Jika backend gagal, gunakan data lokal
    const localData = JSON.parse(localStorage.getItem(`gameData-${email}`)) || {};
    const localProgress = localData.gameProgress || {};
    
    console.log('🔄 Using local fallback data:', localProgress);
    
    return {
      progress: localProgress,
      newUser: localData.newUser || false,
      winUser: localData.winUser || false,  
      lossUser: localData.lossUser || false,
      success: false,
      error: err.message
    };
  }  
  }
 
// 5) GET USER STATUS (DATA-ONLY) — TIDAK MENYENTUH UI
window.getUserStatus = async function(email, level = 'Level01Scene') {
  try {
    const { data } = await axios.post(
      `${(window.BACKEND_URL || '').trim().replace(/\/+$/,'')}/api/users/status`,
      { email: String(email || '').toLowerCase().trim(), level },
      { timeout: 200000 }
    );

    console.log('👤 User status from backend:', data);

    // sinkron minimal ke localStorage (opsional)
    try {
      const snap = JSON.parse(localStorage.getItem(`gameData-${email}`) || '{}');
      snap.newUser = !!data.newUser;
      snap.winUser = !!data.winUser;
      snap.lossUser = !!data.lossUser;
      snap.isGameOver = !!data.isGameOver;
      if (data.progress) snap.gameProgress = data.progress;
      localStorage.setItem(`gameData-${email}`, JSON.stringify(snap));
    } catch {}

    return data; // ← hanya return data
  } catch (err) {
    console.error('❌ getUserStatus failed:', err);
    return null;
  }
};

// Gabungkan status + atur UI pada Scene yang aktif
window.checkUserStatusAndGameOver = async function(email) {
  const userStatus = await window.getUserStatus(email, 'Level01Scene');
  if (!userStatus) return null;
  
  // Dapatkan scene, jangan pakai "this" di window function
  const scene = window.getLevel01SceneSafe?.();
  if (!scene) return userStatus;

  // fresh-local guard (≤15s)
    let freshLocal = false;
    try {
      const snap = JSON.parse(localStorage.getItem(`gameData-${email}`) || '{}');
      const ts = Date.parse(snap?.gameProgress?.lastSaved || 0);
      freshLocal = ts && (Date.now() - ts) <= 15000;
    } catch {}

    const gp = userStatus.progress || {};

    // ✅ merge defensif utk progress
    if (!freshLocal) {
      if (typeof gp.level01Score === 'number') scene.level01Score = gp.level01Score;
      if (typeof gp.round === 'number')        scene.round = gp.round;
      if (typeof gp.starBronzeAlpha === 'number') scene.starBronzeAlpha = gp.starBronzeAlpha;
      if (typeof gp.starAwarded === 'boolean') scene.starAwarded = gp.starAwarded;
    }

  // UI + cache
  scene.scoreText?.setText(String(scene.level01Score || 0).padStart(6,'0'));
  scene.registry.set('level01Score', scene.level01Score || 0);
  scene.registry.set('round', scene.round || 1);
  scene.registry.set('starBronzeAlpha', scene.starBronzeAlpha || 0);
  scene.registry.set('starAwarded', scene.starAwarded === true);
  scene.refreshStarVisibility?.();  
  scene.saveRoundStarToCache?.();

  const isGameOver = !!userStatus.isGameOver;
  const lossUser = !!userStatus.lossUser;
  const hasScore   = (scene.level01Score || 0) > 0;
  const now        = Date.now();
  const lastWinLs  = Number(localStorage.getItem(`lastWinAt_${email}`) || 0);
  const justWon    = (scene.justWonAt && now - scene.justWonAt < 12000) || (lastWinLs && now - lastWinLs < 12000);

  if (isGameOver && lossUser && !hasScore && !justWon) {
    scene.isGameOver = true;
    scene.showGameOverReturnMessage?.();
    scene.blur10PuzzleButton?.();
    scene.lockAllGameplayButtons?.();
  } else {
    // newUser atau winUser atau tidak game over → buka kunci
    scene.isGameOver = false;
    scene.unblur10PuzzleButton?.();
    scene.unlockAllGameplayButtons?.();
  }
  return userStatus;
 };
    
  // 6. FUNGSI SET GAME OVER (async)
  window.setGameOver = async (email, isGameOver = true) => {
  try {
    console.log('🎯 Setting game over status:', { email, isGameOver });

    // ✅ KIRIM KE BACKEND - BIARKAN BACKEND HITUNG USER STATUS
    const response = await axios.post(
      `${window.BACKEND_URL}/api/users/set-gameover`,
      { email, isGameOver },
      { timeout: 200000 }
    );

    // ✅ UPDATE LOCALSTORAGE DENGAN STATUS DARI BACKEND RESPONSE
    if (response.data.success) {
      const userData = JSON.parse(localStorage.getItem(`gameData-${email}`)) || {};
      
      // Update user status dari backend response
      userData.newUser = response.data.newUser ?? false;
      userData.winUser = response.data.winUser ?? false;
      userData.lossUser = response.data.lossUser ?? false;
      userData.isGameOver = response.data.isGameOver ?? isGameOver;
      userData.lockLevel = response.data.lockLevel ?? false;
      userData.lastGameOverSet = new Date().toISOString();
      
      // Update game progress data
      userData.gameProgress = userData.gameProgress || {};
      userData.gameProgress.level01Score = response.data.level01Score ?? 0;
      userData.gameProgress.totalPlays = response.data.totalPlays ?? 0;
      
      localStorage.setItem(`gameData-${email}`, JSON.stringify(userData));

      console.log('✅ Game over status set successfully from backend response');
      console.log(`👤 User status: newUser=${userData.newUser}, winUser=${userData.winUser}, lossUser=${userData.lossUser}`);
    }
    return {
      success: response.data.success ?? true,
      isGameOver: response.data.isGameOver ?? isGameOver,
      newUser: response.data.newUser ?? false,
      winUser: response.data.winUser ?? false,
      lossUser: response.data.lossUser ?? false,
      lockLevel: response.data.lockLevel ?? false
    };
  } catch (err) {
    console.error('❌ Set game over error:', err);

    // ✅ FALLBACK: TETAP UPDATE LOCALSTORAGE MESKI BACKEND GAGAL
    try {
      const userData = JSON.parse(localStorage.getItem(`gameData-${email}`)) || {};
      const localProgress = userData.gameProgress || {};
      
      // Hitung status user dari data lokal (konsisten dengan backend logic)
      const fallbackUserStatus = {
        newUser: !localProgress || (localProgress.totalPlays || 0) === 0,
        winUser: localProgress && (localProgress.totalPlays || 0) >= 1 && (localProgress.level01Score || 0) > 0,
        lossUser: localProgress && (localProgress.totalPlays || 0) >= 3 && (localProgress.level01Score || 0) === 0
      };

      userData.newUser = fallbackUserStatus.newUser;
      userData.winUser = fallbackUserStatus.winUser;
      userData.lossUser = fallbackUserStatus.lossUser;
      userData.isGameOver = isGameOver;
      userData.fallbackUpdate = true;
      userData.lastGameOverSet = new Date().toISOString();
      localStorage.setItem(`gameData-${email}`, JSON.stringify(userData));

      console.log('💾 Fallback: Game over status saved locally');
      console.log(`👤 Fallback user status: newUser=${fallbackUserStatus.newUser}, winUser=${fallbackUserStatus.winUser}, lossUser=${fallbackUserStatus.lossUser}`);
      
      return {
        success: false,
        isGameOver: isGameOver,
        newUser: fallbackUserStatus.newUser,
        winUser: fallbackUserStatus.winUser,
        lossUser: fallbackUserStatus.lossUser,
        lockLevel: fallbackUserStatus.lossUser,
        fallback: true
      };
    } catch (fallbackErr) {
      console.error('❌ Fallback also failed:', fallbackErr);
      return {
        success: false,
        isGameOver: isGameOver,
        newUser: false,
        winUser: false,
        lossUser: true,
        lockLevel: true,
        error: fallbackErr.message
      };
    }
  } 
  }

  // 7. Cek game-over langsung ke backend dan update UI lewat scene (bukan this)
window.checkGameOverStatusFromServer = async function() {
  const email = localStorage.getItem('email');
  if (!email) return null;

  try {
    const { data } = await axios.post(
      `${(window.BACKEND_URL || '').trim().replace(/\/+$/,'')}/api/users/gameover`,
      { email, level: 'Level01Scene' },
      { timeout: 200000 }
    );

    console.log('🎮 GameOver status from backend:', data);

    const scene = window.getLevel01SceneSafe?.();
    if (!scene) return data;

    let freshLocal = false;
    try {
      const snap = JSON.parse(localStorage.getItem(`gameData-${email}`) || '{}');
      const ts = Date.parse(snap?.gameProgress?.lastSaved || 0);
      freshLocal = ts && (Date.now() - ts) <= 15000;
    } catch {}

    // Sinkron properti dari backend
    scene.isGameOver = !!data.isGameOver;
    if (!freshLocal) {
      scene.level01Score = data.level01Score ?? scene.level01Score ?? 0;
      scene.round = data.round ?? scene.round ?? 1;
      scene.starBronzeAlpha = data.starBronzeAlpha ?? scene.starBronzeAlpha ?? 0;
    }
    scene.starAwarded = data.starAwarded ?? scene.starAwarded ?? false;
    scene.starBronzeBlackHorseAlpha = data.starBronzeBlackHorseAlpha ?? scene.starBronzeBlackHorseAlpha ?? 0;

    const lossUser = !!data.lossUser;
    const winUser = !!data.winUser;
    const newUser = !!data.newUser;

    if (scene.isGameOver && lossUser) {
      scene.showGameOverReturnMessage?.();
      scene.blur10PuzzleButton?.();
      scene.lockAllGameplayButtons?.();
    } else {
     // winUser/newUser/tidak game over → buka kunci
      scene.isGameOver = false;
      scene.unblur10PuzzleButton?.();
      scene.unlockAllGameplayButtons?.();
    }

    // persist snapshot (opsional)
    try {
      const snap = JSON.parse(localStorage.getItem(`gameData-${email}`) || '{}');
      snap.isGameOver = scene.isGameOver;
      snap.newUser = newUser;
      snap.winUser = winUser;
      snap.lossUser = lossUser;
      snap.gameProgress = snap.gameProgress || {};
      snap.gameProgress.level01Score = scene.level01Score;
      snap.gameProgress.round = scene.round;
      snap.gameProgress.starBronzeAlpha = scene.starBronzeAlpha;
      snap.gameProgress.starAwarded = scene.starAwarded;
      snap.gameProgress.starBronzeBlackHorseAlpha = scene.starBronzeBlackHorseAlpha;
      localStorage.setItem(`gameData-${email}`, JSON.stringify(snap));
    } catch {}

    return data;
  } catch (err) {
    console.error('❌ Error checking gameover:', err);
    return null;
  }
};

  // WINDOW FOR PAYMENT CHECK FROM BACKEND
  // 1. Fungsi cek status pembayaran dari backend (detail)
  window.checkPaymentStatusFromBackend = async function(email) {
    try {
      console.log('🔍 Checking payment status for:', email);
      const res = await axios.post(
        `${window.BACKEND_URL}/api/${encodeURIComponent(email)}/payment-status`,
        {},
        { timeout: 200000 }
      );
      const data = res.data;
      console.log('💳 Payment status response:', data);

      if (data && data.success) {
        return {
          isPaid: data.isPaid === true,
          supportAmount: data.supportAmount || 0,
          paymentMethods: data.paymentMethods || [],
          gameStats: data.gameStats || {},
          user: data.user || null
        };
      } else {
        console.log('⚠️ Payment check: no success flag in response');
        return {
          isPaid: false,
          supportAmount: 0,
          paymentMethods: [],
          gameStats: {},
          user: null
        };
      }
    } catch (err) {
      console.error('Failed to check payment status:', err);
      return {
        isPaid: false,
        supportAmount: 0,
        paymentMethods: [],
        gameStats: {},
        user: null
      };
    }
  }

  // 2. Fungsi cek status pembayaran (ringkas)
  window.checkPaymentStatus = async function(email) {
    let result = { paid: false, method: null };

    try {
      console.log('💳 Checking payment status for:', email);
      const response = await axios.post(
      `${window.BACKEND_URL}/api/${encodeURIComponent(email)}/payment-status`,
      {},
      { timeout: 20000 }
    );
      const urlParams = new URLSearchParams(window.location.search);

      // Check Xsolla payment
      if (urlParams.get('paid') === '1') {
        console.log('✅ Payment detected from Xsolla URL parameter');
        if (window.safeUpdatePaymentStatus) {
          window.safeUpdatePaymentStatus(true, 'xsolla');
        }
        result = { paid: true, method: 'xsolla' };
      } 
      // Check PayPal payment
      else if (urlParams.get('paypal_paid') === '1' || urlParams.get('paypal_success') === 'true') {
        console.log('✅ Payment detected from PayPal URL parameter');
        if (window.safeUpdatePaymentStatus) {
          window.safeUpdatePaymentStatus(true, 'paypal');
        }
        result = { paid: true, method: 'paypal' };
      }
        // Check PayPal token and PayerID
      else if (urlParams.get('token') && urlParams.get('PayerID')) {
        console.log('✅ PayPal token and PayerID detected');
        if (window.safeUpdatePaymentStatus) {
          window.safeUpdatePaymentStatus(true, 'paypal');
        }
        result = { paid: true, method: 'paypal' };
      }
    } catch (error) {
      console.error('❌ Payment check failed:', error);
      if (window.safeUpdatePaymentStatus) {
        window.safeUpdatePaymentStatus(false);
      }
      result = { paid: false, method: 'error' };
    }
    
    console.log('💳 Payment check result:', result);
    return result;
  }

  // 3. Fungsi update status pembayaran game
// ✅ ENHANCED GAME PAYMENT STATUS UPDATE WITH isPaid FLAG:
window.updateGamePaymentStatus = function(isPaid, method = null, additionalData = {}) {
    const email = localStorage.getItem("email");
    if (!email) {
      console.error('❌ email not defined in updateGamePaymentStatus');
      return;
    }
    
    // ✅ EXPLICIT isPaid FLAG
    const userData = JSON.parse(localStorage.getItem(`gameData-${email}`)) || {};
    userData.isPaid = isPaid === true; // Pastikan boolean
    userData.paymentMethod = method|| userData.paymentMethod;
    userData.paymentVerified = isPaid === true;
    userData.paymentDate = isPaid ? new Date().toISOString() : null;
    if (additionalData.transactionId) userData.transactionId = additionalData.transactionId;
    if (additionalData.amount != null) userData.paymentAmount = additionalData.amount;
    localStorage.setItem(`gameData-${email}`, JSON.stringify(userData));

    // Flag global
  window.isPaid = isPaid === true;

  // Sentuh scene aktif
  //const scene = window.game?.scene?.getScene('Level01Scene');
  //if (scene) scene.isPaid = isPaid === true;

  // ⛔ Jangan ubah UI jika masih dalam proses pembayaran
  const paying = localStorage.getItem('isPaying') === 'true';
  if (paying) {
    console.log('⏳ Payment pending: suppress UI unlock until verification completes');
    return; // hanya persist, jangan unlock UI dulu
  }

  // ⛔ Hanya izinkan unlock jika verifikasi sesi ini sukses
  if (isPaid === true && window.sessionPaymentOK !== true) {
    console.log('🛡️ Block unlock: sessionPaymentOK=false (not this session)');
    return;
  }

  // Drive UI
  const scene = window.getLevel01SceneSafe?.();

  // ✅ guard keras agar tidak akses Scene yang belum siap/ter-destroy
if (!scene) {
  console.log('⛔ Level01Scene not ready/destroyed. Skip UI update.');
  return;
}

  if (isPaid === true) {
    scene.hideGameLockMessage?.();
    scene.unblur10PuzzleButton?.(true);
    scene.unlockGameAfterPurchase?.(true);
    window.unlockPlayAndHideGameOver?.();
  } else {
    // Opsional: tetap kunci
    scene.blur10PuzzleButton?.();
    scene.lockAllGameplayButtons?.();
    // pastikan donasi juga terkunci
    if (scene.donationBtn) { scene.donationBtn.disableInteractive(); scene.donationBtn.setAlpha(0.5); }
    window.lockPlayAndShowGameOver?.();
  }

  console.log('💳 Payment status updated:', {
    isPaid: isPaid === true,
    method,
    transactionId: additionalData.transactionId,
    amount: additionalData.amount
  });
};

 // 8. LOCK LEVEL (async)
  window.lockLevel = async function (email, level) {
    try {
      const res = await axios.post(
        `${window.BACKEND_URL}/api/users/lock`,
        { email, level },
        { timeout: 200000 }
      );
      if (res.data.success) {
        this.isGameOver = true;
        this.blur10PuzzleButton();
        this.lockAllGameplayButtons();
        this.showGameOverReturnMessage();
        return true;
      }
      return false;
    } catch (err) {
      // Fallback ke localStorage jika backend gagal
      const isLocked = localStorage.getItem(`gameOver_${email}`) === 'true';
      if (isLocked) {
        this.isGameOver = true;
        this.blur10PuzzleButton();
        this.lockAllGameplayButtons();
        this.showGameOverReturnMessage();
        return true;
      }
      // Jika tidak game over, tidak perlu lock
      console.error('Error checking game over status:', err);
      return false;
    }
  }

    // 9. UNLOCK LEVEL (async)
  window.unlockedLevels = async function (email, level) {
  try {
    console.log('🔍 Checking unlock status for:', email);

   // ✅ USE EXISTING checkPaymentStatusFromBackend FUNCTION:
    const paymentData = await window.checkPaymentStatusFromBackend(email);
    
    if (!paymentData || paymentData.isPaid !== true) {
      console.warn('❌ User belum melakukan pembayaran atau payment status tidak valid.');
      console.log('Payment data:', paymentData);
      return false;
    }

    console.log('✅ Payment verified! Proceeding to unlock level...');
   
    // Jika sudah bayar, lanjut unlock level
    const unlockRes = await axios.post(
      `${window.BACKEND_URL}/api/users/unlock`,
      { email, level: 'Level01Scene', isPaid: true },
      { timeout: 200000 }
    );

    console.log('🔓 Unlock level response:', unlockRes.data);

   if (unlockRes.data.success || unlockRes.data.unlocked === true) { 
     this.unblur10PuzzleButton(); // Hapus blur tombol 10 puzzle
     this.unlockGameAfterPurchase(); // Aktifkan tombol Play & Puzzle
    } 
   
    // ✅ LOGIKA UNLOCK LEVEL:
    // Jika backend mengembalikan { success: true } atau { unlocked: true }
    const isUnlocked = unlockRes.data.success || unlockRes.data.unlocked === true;
    console.log('🎯 Final unlock result:', isUnlocked);
    return isUnlocked;
    // Response backend bisa { success: true, unlocked: true }
    //return res.data.success || res.data.unlocked === true;
  } catch (err) {
    console.error('Unlock level error:', err);

    // ✅ NO ALERT - JUST LOG:
    console.log('❌ Unlock process failed - user should refresh page');
    return false;
  } 
  }

// 10. LOGOUT DAN KEMBALI KE SPLASH SCREEN
window.logoutAndReturnToSplash = function() {
  // Hapus data login
  localStorage.removeItem("email");
  localStorage.removeItem("user_logged_in");
  // (opsional) Hapus data lain yang terkait user jika perlu

  // Sembunyikan tombol logout, tampilkan loginBox
  const loginBox = document.getElementById("loginBox");
  const logoutBtn = document.getElementById("logoutBtn");
  if (loginBox) loginBox.style.display = "block";
  if (logoutBtn) logoutBtn.style.display = "none";

  // Kembali ke SplashScene
  if (window.game && window.game.scene) {
    window.game.scene.start("SplashScene");
  } else {
    // Fallback: reload halaman
    window.location.reload();
  }
};

window.SplashScene = SplashScene;