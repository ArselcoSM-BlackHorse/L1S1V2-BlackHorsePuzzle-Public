// Level02Scene.js
// Non-module version with CDN tanpa import Phaser from "phaser";

class Level02Scene extends Phaser.Scene {
  constructor() {
    super("Level02Scene");
    this.donationTimer = null;
    this.autoSaveInterval = null;
    this._isShuttingDown = false;
    this._isTransitioning = false;
    this._escKeyHandler = null;
    this.SCORE_DIGITS = 6;
  }

  formatScore(v) {
    return String(Number(v) || 0).padStart(this.SCORE_DIGITS, '0');
  }

  isSceneUsable() {
    return !!(this.sys && !this.sys.isDestroyed && !this._isShuttingDown);
  }

  restoreProgressFromCacheEarly(email) {
    try {
      const userData = JSON.parse(localStorage.getItem(`gameData-${email}`)) || {};
      const gp = userData.gameProgress || {};
      if (Number(gp.selectedSeries) === 1 || Number(gp.selectedSeries) === 2) this.selectedSeries = Number(gp.selectedSeries);
      if (typeof gp.round === 'number' && gp.round >= 1) this.round = gp.round;
      if (typeof gp.starBronzeAlpha === 'number') this.starBronzeAlpha = gp.starBronzeAlpha;
      if (typeof gp.starSilverBlackHorseAlpha === 'number') this.starSilverAlpha = gp.starSilverBlackHorseAlpha;
      if (typeof gp.level01Score === 'number') this.level01Score = gp.level01Score;
      this.registry.set('selectedSeries', this.selectedSeries ?? null);
      this.registry.set('round', this.round || 1);
      this.registry.set('starBronzeAlpha', this.starBronzeAlpha || 0);
      this.registry.set('starSilverBlackHorseAlpha', this.starSilverAlpha || 0);
      this.registry.set('level01Score', this.level01Score || 0);
      console.log('🗂️ Early restore from cache:', { selectedSeries: this.selectedSeries, round: this.round, starBronzeAlpha: this.starBronzeAlpha, starSilverBlackHorseAlpha: this.starSilverAlpha, score: this.level01Score });
    } catch (_) {
      // ignore
    }
  }

  saveRoundStarToCache() {
    const emailSnap = localStorage.getItem('email');
    if (!emailSnap) return;
    const ud = JSON.parse(localStorage.getItem(`gameData-${emailSnap}`)) || {};
    ud.gameProgress = ud.gameProgress || {};
    ud.gameProgress.selectedSeries = (this.selectedSeries === 1 || this.selectedSeries === 2) ? this.selectedSeries : (ud.gameProgress.selectedSeries ?? null);
    ud.gameProgress.round = this.round ?? 1;
    ud.gameProgress.starBronzeAlpha = this.starBronzeAlpha ?? 0;
    ud.gameProgress.starSilverBlackHorseAlpha = this.starSilverAlpha ?? (ud.gameProgress.starSilverBlackHorseAlpha ?? 0);
    ud.gameProgress.level01Score = this.level01Score ?? 0;
    ud.gameProgress.lastSaved = new Date().toISOString();
    localStorage.setItem(`gameData-${emailSnap}`, JSON.stringify(ud));
  }

  preload() {
    document.getElementById('loader').style.display = 'flex';

    this.load.image('board', './Puzzle-Assets/Level02/Bord Game Puzzle Level-02.webp');
    this.load.image('donationPanel', `${window.BACKEND_URL}/assets/UI/Black_Horse_Donation_Panel.png`);
    this.load.on('filecomplete-image-donationPanel', () => {
      console.log('✅ donationPanel loaded!');
    });

    this.load.audio('neigh', './Puzzle-Assets/Sfx/sound/horse_neigh.mp3');
    this.load.audio('snort', './Puzzle-Assets/Sfx/sound/horse_snort.mp3');
    this.load.audio('hoof', './Puzzle-Assets/Sfx/sound/hoof_step.mp3');
    this.load.audio('gallop', './Puzzle-Assets/Sfx/sound/blackhorse_gallop.mp3');
    this.load.audio('win', './Puzzle-Assets/Sfx/scenes/win_in_the_video_game.mp3');
    this.load.audio('cowboyRiding', './Puzzle-Assets/Sfx/scenes/level02_cowboy_riding_on_the_horse.mp3');

    this.load.on('complete', () => {
      document.getElementById('loader').style.display = 'none';

      if (!localStorage.getItem('email')) {
        document.getElementById('loginBox').style.display = 'block';
        document.getElementById('logoutBtn').style.display = 'none';
      } else {
        document.getElementById('loginBox').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'inline-block';
        document.getElementById('logoutBtn').style.display = 'inline-block';
      }
    });
  }

  create(data = {}) {
    this._isShuttingDown = false;
    this._isTransitioning = false;
    this.events.once('shutdown', this.shutdown, this);
    ['introMusic', 'mainMusic', 'winMusic', 'musicfav03', 'musicfav04', 'musicfav05', 'musicfav06', 'musicfav07']
      .forEach((key) => this.sound.stopByKey(key));

    console.log('Level01Scene create called with data:', data);
    console.log('Level02 create, login:', localStorage.getItem('email'));

    const email = localStorage.getItem('email');
    if (!email) {
      console.log('Belum login, kembali ke SplashScene');
      this.scene.start('SplashScene');
      return;
    }

    this.restoreProgressFromCacheEarly(email);

    if (Number(data.selectedSeries) === 1 || Number(data.selectedSeries) === 2) {
      this.selectedSeries = Number(data.selectedSeries);
    }
    if (typeof data.starSilverBlackHorseAlpha === 'number') {
      this.starSilverAlpha = data.starSilverBlackHorseAlpha;
    }
    if (typeof data.starAwarded === 'boolean') {
      this.starAwarded = data.starAwarded;
    }
    this.registry.set('selectedSeries', this.selectedSeries ?? null);
    this.registry.set('starSilverBlackHorseAlpha', this.starSilverAlpha || 0);

    if (data.preserveScore && typeof data.level01Score === 'number') {
      this.level01Score = data.level01Score;
      window.level01Score = data.level01Score;
      this.registry.set('level01Score', data.level01Score);
      console.log(`🔄 Score preserved from scene transition: ${data.level01Score}`);
    }

    if (email) {
      this.initUserData(email).then((initResult) => {
        if (!this.isSceneUsable()) return;
        if (initResult && initResult.success) {
          console.log('✅ User data initialization completed:', initResult);

          if (!data.preserveScore) {
            this.level01Score = initResult.progress.level01Score || 0;
            window.level01Score = this.level01Score;
          }

          this.starBronzeAlpha = initResult.progress.starBronzeAlpha || 0;
          window.starBronzeAlpha = this.starBronzeAlpha;

          this.registry.set('level01Score', this.level01Score);
          this.registry.set('starBronzeAlpha', this.starBronzeAlpha);

          console.log(`🔄 Score safely initialized: ${this.level01Score}`);

          if (initResult.userStatus.lossUser && initResult.userStatus.isGameOver) {
            this.showGameOverReturnMessage();
            this.blur10PuzzleButton();
            this.lockAllGameplayButtons();
          } else if (initResult.userStatus.newUser || initResult.userStatus.winUser) {
            this.unblur10PuzzleButton();
            this.unlockAllGameplayButtons();
          }

          this.setupAutoSave(email);
        }
      }).catch((error) => {
        if (!this.isSceneUsable()) return;
        console.error('❌ User data initialization failed:', error);
        this.setupAutoSave(email);
      });
    }

    this.isExitPanelShown = false;
    if (this._escKeyHandler) {
      this.input.keyboard.off('keydown-ESC', this._escKeyHandler, this);
    }
    this._escKeyHandler = () => {
      if (!this.isSceneUsable() || this._isTransitioning) return;
      if (this.isExitPanelShown) {
        if (this.exitPanelGroup && typeof this.exitPanelGroup.clear === 'function') {
          try {
            this.exitPanelGroup.clear(true, true);
          } catch (err) {
            console.warn('exitPanelGroup clear error:', err);
          }
          this.exitPanelGroup = null;
        }
        this.isExitPanelShown = false;
      } else {
        this.showExitPanelOnly();
        this.isExitPanelShown = true;
      }
    };
    this.input.keyboard.on('keydown-ESC', this._escKeyHandler, this);

    this.setupLogoutHandler();
    this.setupSceneElements();
    this.setupButtons();
    this.setupSoundEvents();

    if (this.scene.settings.data && this.scene.settings.data.showDonation) {
      this.showDonationDisplay();
    }
  }

  setupLogoutHandler() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.onclick = null;

      logoutBtn.onclick = async () => {
        if (this._isTransitioning) return;
        this._isTransitioning = true;
        const email = localStorage.getItem('email');
        if (email) {
          try {
            await this.saveScorePersistent();
            console.log('💾 Score saved before logout');
          } catch (error) {
            console.warn('❌ Error saving before logout:', error);
          }
        }

        localStorage.removeItem('email');
        this.cleanupBeforeTransition();
        this.scene.start('SplashScene');
      };
    }
  }

  setupSceneElements() {
    this.add.image(960, 640, 'board');

    this.add.text(960, 640, 'Coming Soon', {
      font: 'bold 80px Segoe UI',
      fill: '#fff',
      stroke: '#00eaff',
      strokeThickness: 8,
      align: 'center'
    }).setOrigin(0.5).setDepth(2000);

    this.gallopSound = this.sound.add('gallop', { volume: 0.5 });
    this.cowboyMusic = this.sound.add('cowboyRiding', { loop: true, volume: 0.8 });
    this.cowboyMusic.play();
  }

  setupButtons() {
    const backBtn = this.add.image(100, 1010, 'back').setScale(0.9).setDepth(6001).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', async () => {
      if (!this.isSceneUsable() || this._isTransitioning) return;
      this._isTransitioning = true;
      backBtn.disableInteractive();

      this.saveRoundStarToCache();

      const email = localStorage.getItem('email');
      if (!email) {
        this.startLevel01Scene({
          preserveScore: true,
          level01Score: this.level01Score,
          starBronzeAlpha: this.starBronzeAlpha,
          round: this.round,
          returnFromLevel02: true
        });
        return;
      }

      try {
        await this.saveScorePersistent();
      } catch (error) {
        console.warn('❌ Error saving before back:', error);
      }
      if (!this.isSceneUsable()) return;

      if (this.isGameOver) {
        this.showGameOverReturnMessage();
        this.showHoldMessageAboveNotes();
        backBtn.setInteractive();
        this._isTransitioning = false;
        return;
      }

      this.startLevel01Scene({
        preserveScore: true,
        level01Score: this.registry.get('level01Score') ?? this.level01Score ?? 0,
        round: this.registry.get('round') ?? this.round ?? 1,
        starBronzeAlpha: this.registry.get('starBronzeAlpha') ?? this.starBronzeAlpha ?? 0,
        starSilverBlackHorseAlpha: this.registry.get('starSilverBlackHorseAlpha') ?? this.starSilverAlpha ?? 0,
        selectedSeries: this.registry.get('selectedSeries') ?? this.selectedSeries ?? null,
        starAwarded: this.registry.get('starAwarded') ?? this.starAwarded ?? false,
        returnFromLevel02: true
      });
    });
  }

  setupSoundEvents() {
    this.time.addEvent({ delay: 3000, callback: () => this.sound.play('neigh'), repeat: 3 });
    this.time.addEvent({ delay: 6000, callback: () => this.sound.play('snort'), repeat: 2 });
    this.time.addEvent({ delay: 9000, callback: () => this.sound.play('hoof'), repeat: 4 });
    this.time.addEvent({ delay: 12000, callback: () => this.sound.play('gallop'), repeat: 2 });
  }

  cleanupBeforeTransition() {
    if (this._escKeyHandler) {
      this.input.keyboard.off('keydown-ESC', this._escKeyHandler, this);
    }

    if (this.donationTimer) {
      this.donationTimer.destroy();
      this.donationTimer = null;
      console.log('⏰ Donation timer stopped');
    }

    if (this.donationOverlay) {
      console.log('🧹 Cleaning donation display...');
      this.closeDonationDisplay();
    }

    this.sound.stopAll();
  }

  startLevel01Scene(data = {}) {
    if (!this.isSceneUsable()) return;
    const mergedData = {
      ...data,
      selectedSeries: (Number(data.selectedSeries) === 1 || Number(data.selectedSeries) === 2)
        ? Number(data.selectedSeries)
        : ((this.selectedSeries === 1 || this.selectedSeries === 2)
          ? this.selectedSeries
          : ((Number(this.registry.get('selectedSeries')) === 1 || Number(this.registry.get('selectedSeries')) === 2)
            ? Number(this.registry.get('selectedSeries'))
            : null)),
      starSilverBlackHorseAlpha: typeof data.starSilverBlackHorseAlpha === 'number'
        ? data.starSilverBlackHorseAlpha
        : (this.registry.get('starSilverBlackHorseAlpha') ?? this.starSilverAlpha ?? 0),
      starAwarded: typeof data.starAwarded === 'boolean'
        ? data.starAwarded
        : (this.registry.get('starAwarded') ?? this.starAwarded ?? false)
    };
    this.cleanupBeforeTransition();
    this.scene.start('Level01Scene', mergedData);
  }

  async initializeUserData(email) {
    try {
      const initResult = await this.initUserData(email);
      if (initResult && initResult.success) {
        console.log('✅ User data initialization completed:', initResult);

        this.level01Score = this.level01Score || window.level01Score || 0;
        this.starBronzeAlpha = this.starBronzeAlpha || window.starBronzeAlpha || 0;

        this.registry.set('level01Score', this.level01Score);
        this.registry.set('starBronzeAlpha', this.starBronzeAlpha);

        console.log(`🔄 Score safely initialized: ${this.level01Score}`);

        if (initResult.userStatus.lossUser && initResult.userStatus.isGameOver) {
          this.showGameOverReturnMessage();
          this.blur10PuzzleButton();
          this.lockAllGameplayButtons();
        } else if (initResult.userStatus.newUser || initResult.userStatus.winUser) {
          this.unblur10PuzzleButton();
          this.unlockAllGameplayButtons();
        }
      }
    } catch (initError) {
      console.error('❌ User data initialization failed:', initError);
    }
  }

  async saveScoreBeforeTransition(email) {
    try {
      await this.saveScorePersistent();
      console.log(`💾 Score ${this.level01Score} saved successfully before BACK`);
    } catch (saveError) {
      console.warn('❌ Error saving before BACK:', saveError);
    }
  }

  transitionToLevel01() {
    console.log(`🔙 BACK from Level02: Score ${this.level01Score} transition starting`);
    if (!this.isSceneUsable() || this._isTransitioning) return;
    this._isTransitioning = true;
    const currentData = this.scene.settings.data || {};
    console.log('🔄 Transitioning to Level01Scene with data:', {
      preserveScore: true,
      level01Score: this.level01Score,
      preserveGameOver: currentData.preserveGameOver || false,
      returnFromLevel02: true
    });

    this.startLevel01Scene({
      preserveScore: true,
      level01Score: this.level01Score,
      round: this.registry.get('round') ?? this.round ?? 1,
      starBronzeAlpha: this.registry.get('starBronzeAlpha') ?? this.starBronzeAlpha ?? 0,
      starSilverBlackHorseAlpha: this.registry.get('starSilverBlackHorseAlpha') ?? this.starSilverAlpha ?? 0,
      selectedSeries: this.registry.get('selectedSeries') ?? this.selectedSeries ?? null,
      starAwarded: this.registry.get('starAwarded') ?? this.starAwarded ?? false,
      preserveGameOver: currentData.preserveGameOver || false,
      returnFromLevel02: true
    });
  }

  emergencyTransitionToLevel01() {
    if (!this.isSceneUsable() || this._isTransitioning) return;
    this._isTransitioning = true;
    this.startLevel01Scene({
      preserveScore: true,
      level01Score: this.level01Score || window.level01Score || 0,
      round: this.registry.get('round') ?? this.round ?? 1,
      starBronzeAlpha: this.registry.get('starBronzeAlpha') ?? this.starBronzeAlpha ?? 0,
      starSilverBlackHorseAlpha: this.registry.get('starSilverBlackHorseAlpha') ?? this.starSilverAlpha ?? 0,
      selectedSeries: this.registry.get('selectedSeries') ?? this.selectedSeries ?? null,
      starAwarded: this.registry.get('starAwarded') ?? this.starAwarded ?? false
    });
  }

  showDonationDisplay() {
    this.donationOverlay = this.add.rectangle(960, 640, 1920, 1280, 0x000000, 0.88)
      .setDepth(5000);

    this.donationImage = this.add.image(960, 640, 'donationPanel')
      .setScale(1)
      .setDepth(5001)
      .setInteractive({ useHandCursor: true });

    this.donationImage.on('pointerdown', () => {
      const paypalLink = 'https://paypal.me/arselco';
      window.open(paypalLink, '_blank');
      this.showDonationThankYou();
    });

    this.donationImage.on('pointerover', () => {
      this.donationImage.setTint(0xdddddd);
    });

    this.donationImage.on('pointerout', () => {
      this.donationImage.clearTint();
    });

    const welcomeMsg = this.add.text(960, 110,
      '🎉 WELCOME TO LEVEL 02! 🎉', {
        font: 'bold 48px Segoe UI',
        fill: '#ffd700',
        align: 'center',
        stroke: '#000',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(5002);

    const clickInstruction = this.add.text(960, 200,
      '👇 CLICK DONATION IMAGE BELOW TO SUPPORT US! 👇', {
        font: 'bold 32px Segoe UI',
        fill: '#00eaff',
        align: 'center',
        stroke: '#000',
        strokeThickness: 2
      }).setOrigin(0.5).setDepth(5002);

    const arrow = this.add.text(960, 1170, '👆', {
      font: '60px Arial',
      fill: '#ff6b6b'
    }).setOrigin(0.5).setDepth(5005);

    this.tweens.add({
      targets: arrow,
      alpha: { from: 1, to: 0.3 },
      duration: 800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    const paypalBtn = this.add.text(960, 1100, '💳 PAYPAL.ME - CLICK TO DONATE', {
      font: 'bold 36px Segoe UI',
      fill: '#ffffff',
      backgroundColor: '#0070ba',
      padding: { left: 30, right: 30, top: 12, bottom: 12 }
    })
      .setOrigin(0.5)
      .setDepth(5002)
      .setInteractive({ useHandCursor: true });

    paypalBtn.on('pointerover', () => {
      paypalBtn.setScale(1.05);
      paypalBtn.setBackgroundColor('#005ea6');
    });

    paypalBtn.on('pointerout', () => {
      paypalBtn.setScale(1);
      paypalBtn.setBackgroundColor('#0070ba');
    });

    paypalBtn.on('pointerdown', () => {
      const paypalLink = 'https://paypal.me/arselco';
      window.open(paypalLink, '_blank');
      this.showDonationThankYou();
    });

    const instructions = this.add.text(960, 1180,
      '🚀 Your donations help us develop more amazing puzzle levels!', {
        font: 'bold 24px Segoe UI',
        fill: '#ffffff',
        align: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: { left: 20, right: 20, top: 8, bottom: 8 }
      }).setOrigin(0.5).setDepth(5002);

    const closeBtn = this.add.text(1650, 120, '✕', {
      font: 'bold 56px Arial',
      fill: '#fff',
      backgroundColor: '#e00',
      padding: { left: 12, right: 12, top: 4, bottom: 4 }
    }).setOrigin(0.5).setDepth(5002).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      console.log('❌ Close button clicked');
      closeBtn.removeInteractive();

      if (this.donationTimer) {
        this.donationTimer.destroy();
        this.donationTimer = null;
        console.log('⏰ Timer stopped by close button');
      }

      this.closeDonationDisplay();
    });

    this.donationElements = [
      this.donationImage, welcomeMsg, clickInstruction, arrow,
      paypalBtn, instructions, closeBtn
    ];

    this.donationTimer = this.time.delayedCall(20000, () => {
      console.log('⏰ Auto-close timer triggered');

      if (this.scene.isActive('Level02Scene') && this.donationOverlay) {
        console.log('🧹 Auto-closing donation display...');
        this.closeDonationDisplay();
      } else {
        console.log('⚠️ Scene changed or donation already closed');
      }
    });

    this.tweens.add({
      targets: this.donationElements,
      scale: { from: 0.1, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 800,
      ease: 'Back.easeOut'
    });
  }

  showDonationThankYou() {
    if (this.thankYouText) this.thankYouText.destroy();

    this.thankYouText = this.add.text(960, 400,
      '🙏 THANK YOU FOR YOUR SUPPORT!\n' +
      '💰 Opening PayPal.me...\n' +
      '🚀 You\'re helping us create LEVEL 02!', {
        font: 'bold 42px Segoe UI',
        fill: '#ffd700',
        align: 'center',
        backgroundColor: 'rgba(0,0,0,0.95)',
        padding: { left: 30, right: 30, top: 20, bottom: 20 },
        stroke: '#fff',
        strokeThickness: 2
      }).setOrigin(0.5).setDepth(5010);

    this.tweens.add({
      targets: this.thankYouText,
      scale: { from: 0.1, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 600,
      ease: 'Back.easeOut'
    });

    this.time.delayedCall(5000, () => {
      if (this.thankYouText) {
        this.tweens.add({
          targets: this.thankYouText,
          alpha: 0,
          duration: 500,
          onComplete: () => {
            this.thankYouText.destroy();
            this.thankYouText = null;
          }
        });
      }
    });
  }

  closeDonationDisplay() {
    console.log('🧹 closeDonationDisplay() called');

    if (this.donationTimer) {
      this.donationTimer.destroy();
      this.donationTimer = null;
      console.log('⏰ Donation timer destroyed');
    }

    if (this.donationOverlay) {
      this.donationOverlay.removeInteractive();
      this.donationOverlay.destroy();
      this.donationOverlay = null;
      console.log('✅ Donation overlay destroyed');
    }

    if (this.donationImage) {
      this.donationImage.removeAllListeners();
      this.donationImage.destroy();
      this.donationImage = null;
      console.log('✅ Donation image destroyed');
    }

    if (this.donationElements) {
      this.donationElements.forEach((element) => {
        if (element && element.destroy) {
          element.removeAllListeners();
          element.destroy();
        }
      });
      this.donationElements = null;
    }

    if (this.thankYouText) {
      this.thankYouText.destroy();
      this.thankYouText = null;
      console.log('✅ Thank you text destroyed');
    }

    console.log('✅ All donation elements cleaned up');
  }

  showExitPanelOnly() {
    if (this.exitPanelGroup) {
      try {
        this.exitPanelGroup.clear(true, true);
      } catch (err) {
        console.warn('exitPanelGroup clear error:', err);
      }
      this.exitPanelGroup = null;
      this.isExitPanelShown = false;
    }

    this.exitPanelGroup = this.add.group();

    const panel = this.add.rectangle(960, 640, 400, 170, 0x023d3f, 0.98)
      .setStrokeStyle(4, 0xffffff)
      .setDepth(7000);
    this.exitPanelGroup.add(panel);

    const title = this.add.text(960, 600, 'Exit Game?', {
      font: 'bold 40px Segoe UI',
      fill: '#fff',
      align: 'center'
    }).setOrigin(0.5).setDepth(7001);
    this.exitPanelGroup.add(title);

    const exitBtn = this.add.text(960, 690, 'EXIT', {
      font: 'bold 36px Segoe UI',
      fill: '#fff',
      padding: { left: 32, right: 32, top: 12, bottom: 12 }
    }).setOrigin(0.5).setDepth(7001).setInteractive({ useHandCursor: true });
    this.exitPanelGroup.add(exitBtn);

    exitBtn.on('pointerdown', async () => {
      if (!this.isSceneUsable()) return;
      const email = localStorage.getItem('email');
      this.saveRoundStarToCache();
      if (email) {
        try {
          await this.saveScorePersistent();
          console.log('💾 Score saved before exit');
        } catch (error) {
          console.warn('❌ Error saving score before exit:', error);
        }
      }

      if (!this.isSceneUsable()) return;
      this.cleanupBeforeTransition();
      this.scene.start('SplashScene', {
        preserveScore: true,
        level01Score: this.level01Score,
        starBronzeAlpha: this.starBronzeAlpha,
        starAwarded: this.starAwarded,
        round: this.round,
        returnFromLevel02: true,
        saveRoundSceneToCache: true
      });
    });
  }

  showGameOverReturnMessage() {
    console.log('💀 GAME OVER: Showing return message');
  }

  blur10PuzzleButton() {
    console.log('🔒 Blurring 10 puzzle button');
  }

  lockAllGameplayButtons() {
    console.log('🔒 Locking all gameplay buttons');
  }

  unblur10PuzzleButton() {
    console.log('✅ Unblurring 10 puzzle button');
  }

  unlockAllGameplayButtons() {
    console.log('✅ Unlocking all gameplay buttons');
  }

  showHoldMessageAboveNotes() {
    console.log('💀 GAME OVER: Showing hold message');
  }

  async getUserProgress(email) {
    try {
      const em = localStorage.getItem('email') || email;
      if (!em) return { success: false, progress: null };

      const { data: progRes } = await axios.post(
        `${(window.BACKEND_URL || '').trim().replace(/\/+$/, '')}/api/users/${encodeURIComponent(em)}/progress`,
        { level: 'Level01Scene' },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const progress = progRes?.data?.progress || {};
      const user = progRes?.data?.user || {};

      this.applyStarFromProgress(progress);

      return {
        success: progRes?.success === true,
        progress,
        user,
        newUser: !progress || (progress.totalPlays || 0) === 0,
        winUser: progress && (progress.totalPlays || 0) >= 1 && (progress.level01Score || 0) > 0,
        lossUser: progress && (progress.totalPlays || 0) >= 3 && (progress.level01Score || 0) === 0,
        totalPlays: progress.totalPlays ?? 0,
        round: progress.round ?? 1,
        level01Score: progress.level01Score ?? 0,
        level01HighScore: progress.level01HighScore ?? 0,
        starBronzeAlpha: progress.starBronzeAlpha ?? 0,
        starAwarded: progress.starAwarded ?? false,
        starBronzeBlackHorseAlpha: progress.starBronzeBlackHorseAlpha ?? 0,
        level01Completed: progress.level01Completed ?? false,
        bestTime: progress.bestTime ?? 0,
        averageTime: progress.averageTime ?? 0,
        completionRate: progress.completionRate ?? 0,
        perfectGames: progress.perfectGames ?? false,
        totalAttempts: progress.totalAttempts ?? 0,
        completionTime: progress.completionTime ?? 0,
        isPerfectGame: progress.isPerfectGame ?? false
      };
    } catch (err) {
      console.error('❌ Get user progress error:', err);
      return { success: false, progress: null };
    }
  }

  async updateUserProgress(email, progress) {
    try {
      const level01Completed = progress.level01Completed ?? false;
      const level01Score = progress.level01Score ?? 0;
      const level01HighScore = progress.level01HighScore ?? 0;
      const totalPlays = progress.totalPlays ?? 0;
      const starBronzeAlpha = progress.starBronzeAlpha ?? 0;
      const starAwarded = progress.starAwarded ?? false;
      const starBronzeBlackHorseAlpha = progress.starBronzeBlackHorseAlpha ?? 0;
      const bestTime = progress.bestTime ?? 0;
      const averageTime = progress.averageTime ?? 0;
      const completionRate = progress.completionRate ?? 0;
      const perfectGames = progress.perfectGames ?? false;
      const totalAttempts = progress.totalAttempts ?? 0;
      const completionTime = progress.completionTime ?? 0;
      const isPerfectGame = progress.isPerfectGame ?? false;

      const res = await axios.post(
        `${window.BACKEND_URL}/api/users/${encodeURIComponent(email)}/update-progress`,
        {
          email,
          level01Completed,
          level01Score,
          level01HighScore,
          totalPlays,
          starBronzeAlpha,
          starAwarded,
          starBronzeBlackHorseAlpha,
          bestTime,
          averageTime,
          completionRate,
          perfectGames,
          totalAttempts,
          completionTime,
          isPerfectGame
        },
        { timeout: 200000 }
      );

      return {
        success: res.data.success,
        user: res.data.user,
        newUser: res.data.newUser ?? false,
        winUser: res.data.winUser ?? false,
        lossUser: res.data.lossUser ?? false,
        message: res.data.message,
        isGameOver: res.data.isGameOver ?? false,
        lockLevel: res.data.lockLevel ?? false,
        gameProgress: res.data.user?.gameProgress || {},
        level01Score: res.data.user?.gameProgress?.level01Score ?? 0,
        level01HighScore: res.data.user?.gameProgress?.level01HighScore ?? 0,
        level01Completed: res.data.user?.gameProgress?.level01Completed ?? false,
        totalPlays: res.data.user?.gameProgress?.totalPlays ?? 0,
        starBronzeAlpha: res.data.user?.gameProgress?.starBronzeAlpha ?? 0,
        starAwarded: res.data.user?.gameProgress?.starAwarded ?? false,
        starBronzeBlackHorseAlpha: res.data.user?.gameProgress?.starBronzeBlackHorseAlpha ?? 0,
        bestTime: res.data.user?.gameProgress?.bestTime ?? 0,
        averageTime: res.data.user?.gameProgress?.averageTime ?? 0,
        completionRate: res.data.user?.gameProgress?.completionRate ?? 0,
        perfectGames: res.data.user?.gameProgress?.perfectGames ?? false,
        totalAttempts: res.data.user?.gameProgress?.totalAttempts ?? 0,
        completionTime: res.data.user?.gameProgress?.completionTime ?? 0,
        isPerfectGame: res.data.user?.gameProgress?.isPerfectGame ?? false
      };
    } catch (err) {
      console.error('❌ Update user progress error:', err);
      return {
        success: false,
        error: err.message,
        newUser: false,
        winUser: false,
        lossUser: false,
        gameProgress: {},
        level01Score: 0,
        level01HighScore: 0,
        level01Completed: false,
        totalPlays: 0,
        starBronzeAlpha: 0,
        starAwarded: false,
        starBronzeBlackHorseAlpha: 0,
        bestTime: 0,
        averageTime: 0,
        completionRate: 0,
        perfectGames: false,
        totalAttempts: 0,
        completionTime: 0,
        isPerfectGame: false
      };
    }
  }

  async saveScorePersistent() {
    const email = localStorage.getItem('email');
    if (!email) {
      console.warn('❌ Email tidak ditemukan untuk saveScorePersistent');
      return;
    }

    const userData = JSON.parse(localStorage.getItem(`gameData-${email}`)) || {};
    const gameProgress = userData.gameProgress || {};
    const cachedHighScore = Number(gameProgress.level01HighScore) || 0;
    const cachedTotalPlays = Number(gameProgress.totalPlays) || 0;
    const cachedTotalAttempts = Number(gameProgress.totalAttempts) || 0;
    const cachedClaimedCandyCapacity = Number(gameProgress.claimedCandyCapacity) || 0;
    const cachedScoreCandy = Number(gameProgress.scoreCandy) || 0;
    const cachedBuyCandy = Number(gameProgress.buyCandy) || 0;
    const cachedCandyCount = Number(gameProgress.candyCount) || 0;

    this.claimedCandyCapacity = Number(this.claimedCandyCapacity ?? cachedClaimedCandyCapacity) || 0;
    this.scoreCandy = Number(this.scoreCandy ?? cachedScoreCandy) || 0;
    this.buyCandy = Number(this.buyCandy ?? cachedBuyCandy) || 0;
    this.candyCount = Number(this.candyCount ?? (this.scoreCandy + this.buyCandy) ?? cachedCandyCount) || 0;
    const persistedSelectedSeries = (this.selectedSeries === 1 || this.selectedSeries === 2)
      ? this.selectedSeries
      : ((Number(gameProgress.selectedSeries) === 1 || Number(gameProgress.selectedSeries) === 2)
        ? Number(gameProgress.selectedSeries)
        : null);
    const persistedSilverStarAlpha = (typeof this.starSilverAlpha === 'number')
      ? this.starSilverAlpha
      : (typeof gameProgress.starSilverBlackHorseAlpha === 'number' ? gameProgress.starSilverBlackHorseAlpha : 0);

    const lastSaved = new Date().toISOString();

    try {
      window.level01Score = this.level01Score;
      window.starBronzeAlpha = this.starBronzeAlpha;
      window.starSilverAlpha = persistedSilverStarAlpha;
      window.starAwarded = this.starAwarded;
      window.starBronzeBlackHorseAlpha = this.starBronzeBlackHorseAlpha || 0;
      window.round = this.round;

      await window.updateUserProgress(email, {
        level01Completed: true,
        level01Score: this.level01Score,
        level01HighScore: Math.max(this.level01Score, this.level01HighScore || 0, cachedHighScore),
        totalPlays: Math.max(this.totalPlays || 0, cachedTotalPlays),
        round: this.round || 1,
        selectedSeries: persistedSelectedSeries,
        starBronzeAlpha: this.starBronzeAlpha,
        starSilverBlackHorseAlpha: persistedSilverStarAlpha,
        starAwarded: this.starAwarded,
        claimedCandyCapacity: this.claimedCandyCapacity,
        scoreCandy: this.scoreCandy,
        buyCandy: this.buyCandy,
        candyCount: this.candyCount,
        averageTime: this.completionTime || 0,
        completionTime: this.completionTime || 0,
        isPerfectGame: false,
        perfectGames: false,
        totalAttempts: Math.max(this.totalAttempts || 0, cachedTotalAttempts),
        bestTime: this.completionTime || 0,
        completionRate: 100,
        lastSaved
      });
      console.log(`💾 Score saved to BACKEND: ${this.level01Score}`);

      userData.gameProgress = userData.gameProgress || {};
      userData.gameProgress.level01Score = this.level01Score;
      userData.gameProgress.level01HighScore = Math.max(this.level01Score, this.level01HighScore || 0, cachedHighScore);
      userData.gameProgress.totalPlays = Math.max(this.totalPlays || 0, cachedTotalPlays);
      userData.gameProgress.round = this.round || 1;
      userData.gameProgress.selectedSeries = persistedSelectedSeries;
      userData.gameProgress.starBronzeAlpha = this.starBronzeAlpha || 0;
      userData.gameProgress.starSilverBlackHorseAlpha = persistedSilverStarAlpha;
      userData.gameProgress.starAwarded = this.starAwarded || false;
      userData.gameProgress.starBronzeBlackHorseAlpha = this.starBronzeBlackHorseAlpha || 0;
      userData.gameProgress.claimedCandyCapacity = this.claimedCandyCapacity || 0;
      userData.gameProgress.scoreCandy = this.scoreCandy || 0;
      userData.gameProgress.buyCandy = this.buyCandy || 0;
      userData.gameProgress.candyCount = this.candyCount || 0;
      userData.gameProgress.lastSyncFromBackend = new Date().toISOString();
      userData.gameProgress.backendSyncSuccess = true;
      userData.gameProgress.lastSaved = lastSaved;
      localStorage.setItem(`gameData-${email}`, JSON.stringify(userData));
      console.log(`💾 Score backup to localStorage: ${this.level01Score}`);
    } catch (error) {
      console.warn('❌ Backend save failed, using localStorage only:', error);

      userData.gameProgress = userData.gameProgress || {};
      userData.gameProgress.level01Score = this.level01Score;
      userData.gameProgress.level01HighScore = Math.max(this.level01Score, this.level01HighScore || 0, cachedHighScore);
      userData.gameProgress.totalPlays = Math.max(this.totalPlays || 0, cachedTotalPlays);
      userData.gameProgress.round = this.round || 1;
      userData.gameProgress.selectedSeries = persistedSelectedSeries;
      userData.gameProgress.starBronzeAlpha = this.starBronzeAlpha || 0;
      userData.gameProgress.starSilverBlackHorseAlpha = persistedSilverStarAlpha;
      userData.gameProgress.starAwarded = this.starAwarded || false;
      userData.gameProgress.starBronzeBlackHorseAlpha = this.starBronzeBlackHorseAlpha || 0;
      userData.gameProgress.claimedCandyCapacity = this.claimedCandyCapacity || 0;
      userData.gameProgress.scoreCandy = this.scoreCandy || 0;
      userData.gameProgress.buyCandy = this.buyCandy || 0;
      userData.gameProgress.candyCount = this.candyCount || 0;
      userData.gameProgress.lastSyncFromBackend = new Date().toISOString();
      userData.gameProgress.backendSyncFailed = true;
      userData.gameProgress.lastSaved = lastSaved;
      localStorage.setItem(`gameData-${email}`, JSON.stringify(userData));
      console.log(`💾 Score saved to localStorage (fallback): ${this.level01Score}`);
      window.level01Score = this.level01Score;
    }

    if (this.scoreText) {
      this.scoreText.setText(this.formatScore(this.level01Score));
    }
  }

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
        const readBoolean = (source, key) => (typeof source?.[key] === 'boolean' ? source[key] : null);

        const backendSavedAt = parseSavedTime(progress.lastSaved);
        const localSavedAt = parseSavedTime(localProgress.lastSaved);
        const latestProgress = localSavedAt > backendSavedAt ? localProgress : progress;
        const fallbackProgress = localSavedAt > backendSavedAt ? progress : localProgress;

        const pickLatestNumber = (key, fallbackValue = 0) => {
          const latestValue = readNumber(latestProgress, key);
          if (latestValue !== null) return latestValue;

          const fallbackCandidate = readNumber(fallbackProgress, key);
          if (fallbackCandidate !== null) return fallbackCandidate;

          const ownValue = Number(fallbackValue);
          return Number.isFinite(ownValue) ? ownValue : 0;
        };

        const pickLatestBoolean = (key, fallbackValue = false) => {
          const latestValue = readBoolean(latestProgress, key);
          if (latestValue !== null) return latestValue;

          const fallbackCandidate = readBoolean(fallbackProgress, key);
          if (fallbackCandidate !== null) return fallbackCandidate;

          return fallbackValue === true;
        };

      const pickLatestSelectedSeries = (fallbackValue = null) => {
        const latestValue = Number(latestProgress?.selectedSeries);
        if (latestValue === 1 || latestValue === 2) return latestValue;

        const fallbackCandidate = Number(fallbackProgress?.selectedSeries);
        if (fallbackCandidate === 1 || fallbackCandidate === 2) return fallbackCandidate;

        const ownValue = Number(fallbackValue);
        return ownValue === 1 || ownValue === 2 ? ownValue : null;
      };

        this.level01Score = pickLatestNumber('level01Score', this.level01Score ?? window.level01Score ?? 0);
      this.selectedSeries = pickLatestSelectedSeries(this.selectedSeries ?? this.registry.get('selectedSeries'));
        this.starBronzeAlpha = pickLatestNumber('starBronzeAlpha', this.starBronzeAlpha ?? 0);
      this.starSilverAlpha = pickLatestNumber('starSilverBlackHorseAlpha', this.starSilverAlpha ?? window.starSilverAlpha ?? 0);
        this.starAwarded = pickLatestBoolean('starAwarded', this.starAwarded === true);
        this.starBronzeBlackHorseAlpha = pickLatestNumber('starBronzeBlackHorseAlpha', this.starBronzeBlackHorseAlpha ?? 0);
        this.round = Math.max(1, pickLatestNumber('round', this.round ?? window.round ?? 1));
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
        this.bestTime = pickLatestNumber('bestTime', this.bestTime ?? 0);
        this.averageTime = pickLatestNumber('averageTime', this.averageTime ?? 0);
        this.completionRate = pickLatestNumber('completionRate', this.completionRate ?? 0);
        this.perfectGames = pickLatestBoolean('perfectGames', this.perfectGames === true);
        this.totalAttempts = pickLatestNumber('totalAttempts', this.totalAttempts ?? 0);
        this.completionTime = pickLatestNumber('completionTime', this.completionTime ?? 0);
        this.isPerfectGame = pickLatestBoolean('isPerfectGame', this.isPerfectGame === true);
        this.level01Completed = pickLatestBoolean('level01Completed', this.level01Completed === true);
        this.claimedCandyCapacity = pickLatestNumber('claimedCandyCapacity', this.claimedCandyCapacity ?? 0);
        this.scoreCandy = pickLatestNumber('scoreCandy', this.scoreCandy ?? 0);
        this.buyCandy = pickLatestNumber('buyCandy', this.buyCandy ?? 0);
        this.candyCount = pickLatestNumber('candyCount', this.candyCount ?? (this.scoreCandy + this.buyCandy));

        this.newUser = progressRes.newUser || false;
        this.winUser = progressRes.winUser || false;
        this.lossUser = progressRes.lossUser || false;
        this.isGameOver = progressRes.isGameOver || false;

        window.level01Score = this.level01Score;
        window.starBronzeAlpha = this.starBronzeAlpha;
        window.starSilverAlpha = this.starSilverAlpha;
        window.starAwarded = this.starAwarded;
        window.starBronzeBlackHorseAlpha = this.starBronzeBlackHorseAlpha || 0;
        window.round = this.round;

        if (this.scoreText) {
          this.scoreText.setText(this.formatScore(this.level01Score));
        }
        if (this.starBronzeBlackHorse && this.starBronzeAlpha > 0) {
          this.starBronzeBlackHorse.setAlpha(this.starBronzeAlpha);
        }

        const resolvedProgress = {
          ...progress,
          ...localProgress,
          level01Score: this.level01Score,
          level01HighScore: this.level01HighScore,
          totalPlays: this.totalPlays,
          round: this.round,
          selectedSeries: this.selectedSeries,
          starBronzeAlpha: this.starBronzeAlpha,
          starSilverBlackHorseAlpha: this.starSilverAlpha,
          starAwarded: this.starAwarded,
          starBronzeBlackHorseAlpha: this.starBronzeBlackHorseAlpha,
          claimedCandyCapacity: this.claimedCandyCapacity,
          scoreCandy: this.scoreCandy,
          buyCandy: this.buyCandy,
          candyCount: this.candyCount,
          bestTime: this.bestTime,
          averageTime: this.averageTime,
          completionRate: this.completionRate,
          perfectGames: this.perfectGames,
          totalAttempts: this.totalAttempts,
          completionTime: this.completionTime,
          isPerfectGame: this.isPerfectGame,
          level01Completed: this.level01Completed,
          lastSaved: latestProgress.lastSaved || fallbackProgress.lastSaved || progress.lastSaved || localProgress.lastSaved || null
        };

        const syncedUserData = {
          gameProgress: resolvedProgress,
          newUser: progressRes.newUser,
          winUser: progressRes.winUser,
          lossUser: progressRes.lossUser,
          isGameOver: progressRes.isGameOver,
          lastSyncFromBackend: new Date().toISOString(),
          backendSyncSuccess: true
        };
        localStorage.setItem(`gameData-${email}`, JSON.stringify(syncedUserData));

        console.log('✅ User data initialized from backend:', {
          level01Score: this.level01Score,
          selectedSeries: this.selectedSeries,
          starSilverBlackHorseAlpha: this.starSilverAlpha,
          totalPlays: this.totalPlays,
          newUser: this.newUser,
          winUser: this.winUser,
          lossUser: this.lossUser,
          isGameOver: this.isGameOver
        });

        return {
          success: true,
          source: 'backend',
          progress,
          userStatus: {
            newUser: this.newUser,
            winUser: this.winUser,
            lossUser: this.lossUser,
            isGameOver: this.isGameOver
          }
        };
      }

      console.warn('❌ Backend response invalid, using fallback initialization');
      throw new Error('Backend response invalid');
    } catch (error) {
      console.warn('❌ Backend initialization failed, using localStorage fallback:', error);

      let fallbackUserData = JSON.parse(localStorage.getItem(`gameData-${email}`)) || {};

      if (fallbackUserData.gameProgress) {
        this.level01Score = fallbackUserData.gameProgress.level01Score || 0;
        this.selectedSeries = (Number(fallbackUserData.gameProgress.selectedSeries) === 1 || Number(fallbackUserData.gameProgress.selectedSeries) === 2)
          ? Number(fallbackUserData.gameProgress.selectedSeries)
          : this.selectedSeries;
        this.starBronzeAlpha = fallbackUserData.gameProgress.starBronzeAlpha || 0;
        this.starSilverAlpha = fallbackUserData.gameProgress.starSilverBlackHorseAlpha || 0;
        this.starAwarded = fallbackUserData.gameProgress.starAwarded || 0;
        this.starBronzeBlackHorseAlpha = fallbackUserData.gameProgress.starBronzeBlackHorseAlpha || 0;
        this.round = fallbackUserData.gameProgress.round || 1;
        this.level01HighScore = fallbackUserData.gameProgress.level01HighScore || 0;
        this.totalPlays = fallbackUserData.gameProgress.totalPlays || 0;

        this.newUser = !fallbackUserData.gameProgress || fallbackUserData.gameProgress.totalPlays === 0;
        this.winUser = fallbackUserData.gameProgress && fallbackUserData.gameProgress.totalPlays >= 1 && (fallbackUserData.gameProgress.level01Score || 0) > 0;
        this.lossUser = fallbackUserData.gameProgress && fallbackUserData.gameProgress.totalPlays >= 3 && (fallbackUserData.gameProgress.level01Score || 0) === 0;
        this.isGameOver = this.lossUser;

        console.log('📥 User data loaded from localStorage fallback:', {
          level01Score: this.level01Score,
          totalPlays: this.totalPlays,
          newUser: this.newUser,
          winUser: this.winUser,
          lossUser: this.lossUser
        });
      } else {
        this.level01Score = 0;
        this.starBronzeAlpha = 0;
        this.starAwarded = 0;
        this.starBronzeBlackHorseAlpha = 0;
        this.level01HighScore = 0;
        this.round = 1;
        this.totalPlays = 0;
        this.bestTime = 0;
        this.averageTime = 0;
        this.completionRate = 0;
        this.perfectGames = false;
        this.totalAttempts = 0;
        this.completionTime = 0;
        this.isPerfectGame = false;
        this.level01Completed = false;

        this.newUser = true;
        this.winUser = false;
        this.lossUser = false;
        this.isGameOver = false;

        fallbackUserData = {
          gameProgress: {
            level01Completed: false,
            level01Score: 0,
            level01HighScore: 0,
            level01BestTime: 0,
            level01Attempts: 0,
            round: this.round,
            selectedSeries: this.selectedSeries ?? null,
            totalPlays: 0,
            bestTime: 0,
            averageTime: 0,
            completionRate: 0,
            perfectGames: false,
            totalAttempts: 0,
            completionTime: 0,
            isPerfectGame: false,
            starBronzeAlpha: 0,
            starSilverBlackHorseAlpha: 0,
            starAwarded: 0,
            starBronzeBlackHorseAlpha: 0,
          },
          newUser: true,
          winUser: false,
          lossUser: false,
          isGameOver: false,
          initializedFromDefault: true,
          lastSyncFromBackend: new Date().toISOString()
        };
        localStorage.setItem(`gameData-${email}`, JSON.stringify(fallbackUserData));

        try {
          await window.updateUserProgress(email, fallbackUserData.gameProgress);
          console.log(`✅ Default user data synced to backend for new user: ${email}`);
        } catch (syncError) {
          console.warn('❌ Failed to sync default data to backend:', syncError);
        }

        console.log(`🆕 New user initialized with default data: ${email}`);
      }

      return {
        success: true,
        source: 'fallback',
        progress: fallbackUserData.gameProgress,
        userStatus: {
          newUser: this.newUser,
          winUser: this.winUser,
          lossUser: this.lossUser,
          isGameOver: this.isGameOver
        }
      };
    }
  }

  setupAutoSave(email) {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = setInterval(() => {
      if (!this.isSceneUsable()) {
        clearInterval(this.autoSaveInterval);
        this.autoSaveInterval = null;
        return;
      }
      const currentEmail = localStorage.getItem('email');
      if (!currentEmail) return;
      const userData = JSON.parse(localStorage.getItem(`gameData-${currentEmail}`)) || {};
      const gameProgress = userData.gameProgress || {};
      const persistedSelectedSeries = (this.selectedSeries === 1 || this.selectedSeries === 2)
        ? this.selectedSeries
        : ((Number(gameProgress.selectedSeries) === 1 || Number(gameProgress.selectedSeries) === 2)
          ? Number(gameProgress.selectedSeries)
          : null);
      const persistedSilverStarAlpha = (typeof this.starSilverAlpha === 'number')
        ? this.starSilverAlpha
        : (typeof gameProgress.starSilverBlackHorseAlpha === 'number' ? gameProgress.starSilverBlackHorseAlpha : 0);
      window.updateUserProgress(currentEmail, {
        level01Completed: true,
        level01Score: this.level01Score,
        level01HighScore: Math.max(this.level01Score, this.level01HighScore || 0, gameProgress.level01HighScore || 0),
        totalPlays: Math.max(this.totalPlays || 0, gameProgress.totalPlays || 0),
        round: this.round,
        selectedSeries: persistedSelectedSeries,
        starBronzeAlpha: this.starBronzeAlpha,
        starSilverBlackHorseAlpha: persistedSilverStarAlpha,
        starAwarded: this.starAwarded,
        claimedCandyCapacity: this.claimedCandyCapacity || gameProgress.claimedCandyCapacity || 0,
        scoreCandy: this.scoreCandy || gameProgress.scoreCandy || 0,
        buyCandy: this.buyCandy || gameProgress.buyCandy || 0,
        candyCount: this.candyCount || gameProgress.candyCount || ((this.scoreCandy || 0) + (this.buyCandy || 0)),
        bestTime: this.timeElapsed,
        averageTime: typeof this.timeElapsed === 'number' ? this.timeElapsed : 0,
        completionRate: 100,
        perfectGames: true,
        totalAttempts: Math.max(this.totalAttempts || 0, gameProgress.totalAttempts || 0)
      });
      userData.gameProgress = userData.gameProgress || {};
      userData.gameProgress.selectedSeries = persistedSelectedSeries;
      userData.gameProgress.starSilverBlackHorseAlpha = persistedSilverStarAlpha;
      userData.gameProgress.lastSaved = new Date().toISOString();
      localStorage.setItem(`gameData-${currentEmail}`, JSON.stringify(userData));
    }, 5000);

    console.log('🔄 Auto-save setup completed for:', email);
  }

  destroy() {
    this.shutdown();
    if (this.events) this.events.off('shutdown', this.shutdown, this);
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log('🛑 Auto-save interval cleared');
    }

    if (this.donationTimer) {
      this.donationTimer.destroy();
      this.donationTimer = null;
      console.log('🛑 Donation timer cleared');
    }

    super.destroy();
  }

  shutdown() {
    if (this._isShuttingDown) return;
    this._isShuttingDown = true;
    this._isTransitioning = false;
    console.log('🛑 Level02Scene shutting down...');

    if (this._escKeyHandler) {
      this.input.keyboard.off('keydown-ESC', this._escKeyHandler, this);
    }

    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }

    if (this.donationTimer) {
      this.donationTimer.destroy();
      this.donationTimer = null;
      console.log('⏰ Timer destroyed on shutdown');
    }

    this.closeDonationDisplay();
    this.sound.stopAll();
    this.time.removeAllEvents();

    console.log('✅ Level02Scene shutdown complete');
  }
}

window.Level02Scene = Level02Scene;