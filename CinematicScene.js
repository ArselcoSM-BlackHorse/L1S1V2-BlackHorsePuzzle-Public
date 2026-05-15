class CinematicScene extends Phaser.Scene {
  constructor() {
    super('CinematicScene');
  }

  preload() {
    this.load.video(
      'bh-cinematic',
      'Puzzle-Assets/Video/BlackHorseCinematic.mp4',
      'loadeddata',
      false,
      true
    );
  }

  create() {
    if (localStorage.getItem('email')) {
      const loginBox = document.getElementById('loginBox');
      const logoutBtn = document.getElementById('logoutBtn');
      if (loginBox) loginBox.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'inline-block';
    }

    const cam = this.cameras.main;
    cam.fadeIn(800, 0, 0, 0);

    const splashMusic = this.sound && this.sound.get('cinematic');
    if (splashMusic && splashMusic.isPlaying) {
      splashMusic.stop();
      splashMusic.destroy();
    }

    const bgMusic = this.sound && this.sound.get('music');
    if (bgMusic && bgMusic.isPlaying) {
      bgMusic.stop();
      bgMusic.destroy();
    }

    let escText;
    const showEscText = () => {
      if (escText) escText.destroy();
      escText = this.add.text(20, 20, 'ESC(EXIT)', {
        font: '18px Arial',
        color: '#fff',
        backgroundColor: '#222',
        padding: { x: 10, y: 5 }
      }).setOrigin(0, 0);
      this.time.delayedCall(5000, () => escText.setVisible(false));
    };

    const video = this.add.video(cam.centerX, cam.centerY, 'bh-cinematic');
    video.setOrigin(0.5);

    video.once('play', () => {
      const scale = Math.max(
        cam.width / video.width,
        cam.height / video.height
      );
      video.setScale(scale);
      video.setInteractive();
      showEscText();
    });

    video.setMute(false);
    video.play(false);

    video.once('play', () => {
      const duration = video.getDuration ? video.getDuration() : 20;
      const showAt = Math.max(0, (duration - 5) * 1000);
      void showAt;
    });

    video.on('complete', () => {
      if (localStorage.getItem('email')) {
        this.scene.start('Level01Scene');
      } else {
        this.scene.start('SplashScene');
      }
    });

    this.input.keyboard.on('keydown-ESC', () => {
      if (video && video.destroy) video.destroy();
      this.scene.start('SplashScene');
    });

    window.onCinematicLoginSuccess = () => {
      hideLoginBox();
      this.finishCinematic(video);
    };
  }

  finishCinematic(video) {
    localStorage.setItem('bh_cinematic_seen', 'true');
    this.cameras.main.fadeOut(800, 0, 0, 0);
    if (video && video.destroy) video.destroy();
    this.scene.start('Level01Scene');
  }
}