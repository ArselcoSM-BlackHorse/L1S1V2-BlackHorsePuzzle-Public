// File: GitHub-ArselcoSM/L1S1V2-BlackHorsePuzzle-Public/GameLoad.js

  window.GameLoad = {
  /**
   * Fungsi Terpusat untuk Preload Seluruh Aset Game
   * @param {Phaser.Scene} scene - Konteks 'this' dari Scene Phaser yang memanggil
   */
  preloadAllAssets(scene) {
    // 1. Puzzle pieces
    for (let i = 1; i <= 10; i++) {
      const num = i.toString().padStart(2, '0');
      //this.load.image(`hex${i}`, `${window.BACKEND_URL}/assets/Level01/Lv01_Hex_${num}.webp`);
      this.load.image(`hex${i}`, `./Puzzle-Assets/Level01/Lv01_Hex01_${num}.webp`);
    }

    // 2. Puzzle pieces Series02 // check kode puzzle di frontend
    for (let i = 1; i <= 20; i++) {
      const num = i.toString().padStart(2, '0');
      this.load.image(`hexS2_${i}`, `./Puzzle-Assets/Level01/Lv01_Hex02_${num}.webp`); //Series02 di frontend
    }

    // 3. BOARD & UI BACKGROUND 
    scene.load.image('boardLevel01', './Puzzle-Assets/Level01/Board_Game_Puzzle_Level_01.webp');

    // 4. PUZZLE PIECES / UTAMA (FAVORIT)
    // Elemen Air (Water)
    scene.load.image('water1', './Puzzle-Assets/UI/FW Water1.webp');
    scene.load.image('water2', './Puzzle-Assets/UI/FW Water2.webp');
    scene.load.image('water3', './Puzzle-Assets/UI/FW Water3.webp');
    
    // Elemen Tanah/Rumput
    scene.load.image('grassL1', './Puzzle-Assets/UI/FG Grass04.webp');
    
    // Elemen Makanan/Buah
    scene.load.image('carrot', './Puzzle-Assets/UI/FC Carrot.webp');
    scene.load.image('apple1', './Puzzle-Assets/UI/FA Appel1.webp');
    scene.load.image('apple2', './Puzzle-Assets/UI/FA Appel2.webp');
    scene.load.image('apple3', './Puzzle-Assets/UI/FA Appel3.webp');
    scene.load.image('apple4', './Puzzle-Assets/UI/FA Appel4.webp');
    
    // Elemen Nada Musik (Music Notes)
    scene.load.image('musicNoteB', './Puzzle-Assets/UI/FN Not Blue Cyan.webp');
    scene.load.image('musicNoteG', './Puzzle-Assets/UI/FN Not Green.webp');
    scene.load.image('musicNoteR', './Puzzle-Assets/UI/FN Not Red.webp');

    this.load.image('help_en_1', './Puzzle-Assets/Level01/Lv01_Help_English_Page1.webp');
    this.load.image('help_en_2', './Puzzle-Assets/Level01/Lv01_Help_English_Page2.webp');
    this.load.image('help_id_1', './Puzzle-Assets/Level01/Lv01_Help_Indonesia_Page1.webp');
    this.load.image('help_id_2', './Puzzle-Assets/Level01/Lv01_Help_Indonesia_Page2.webp');
    this.load.image('help_other_0', './Puzzle-Assets/Level01/Lv01_Help_Other_Code.webp');  
    this.load.image('help_other_1', './Puzzle-Assets/Level01/Lv01_Help_Other_Page1.webp');  
    this.load.image('help_other_2', './Puzzle-Assets/Level01/Lv01_Help_Other_Page2.webp');    
    this.load.image('helpBtn', './Puzzle-Assets/UI/GM Help.webp');
    this.load.image('back', './Puzzle-Assets/UI/GM Back.webp');
    this.load.image('next', './Puzzle-Assets/UI/GM Next.webp');
    this.load.image('playSheriff', './Puzzle-Assets/UI/GM Play.webp');
    this.load.image('playSheriffL', './Puzzle-Assets/UI/GM Play Light.webp');
    this.load.image('starBronzeBlackHorse', './Puzzle-Assets/UI/Star_Bronze_Black_Horse.webp');
    this.load.image('starSilverBlackHorse', './Puzzle-Assets/UI/Star_Silver_Black_Horse.webp');
  // this.load.image('starBronzeBlackHorse', `${window.BACKEND_URL}/assets/UI/Star_Bronze_Black_Horse.webp`);
  // this.load.image('starSilverBlackHorse', `${window.BACKEND_URL}/assets/UI/Star_Silver_Black_Horse.webp`);
  // Future: this.load.image('starGoldHorse', './Puzzle-Assets/UI/GM. Star Gold Black Horse.png');
  // Future: this.load.image('starPlatinumHorse', './Puzzle-Assets/UI/GM. Star Platinum Black Horse.png');
  // Future: this.load.image('starDiamondHorse', './Puzzle-Assets/UI/GM. Star Diamond Black Horse.png');
    this.load.image('lv01Puzzle10', './Puzzle-Assets/UI/GM L01_10 Puzzle.webp');
    this.load.image('lv01Puzzle20', './Puzzle-Assets/UI/GM L01_20 Puzzle.webp');
    this.load.image('paypalQR', `${window.BACKEND_URL}/assets/UI/Black_Horse_Pu_qrcode.png`);
  //this.load.audio('gameoverSound', './Puzzle-Assets/Sfx/scenes/game-over-elements-impact.mp3'); // utk 20 Puzzle
    this.load.image('textGlow02', './Puzzle-Assets/UI/Sp Text Level 02 Glow.webp');
    this.load.image('hexSlot01', './Puzzle-Assets/UI/GM Slot Hexa01.webp');
    this.load.image('hexSlot02', './Puzzle-Assets/UI/GM Slot Hexa02.webp');
    this.load.image('hexSlot03', './Puzzle-Assets/UI/GM Slot Hexa03.webp');
    this.load.image('hexSlot04', './Puzzle-Assets/UI/GM Slot Hexa04.webp');
    this.load.image('hexSlot05', './Puzzle-Assets/UI/GM Slot Hexa05.webp');
    this.load.image('hexSlot06', './Puzzle-Assets/UI/GM Slot Hexa06.webp');
    this.load.image('hexSlot07', './Puzzle-Assets/UI/GM Slot Hexa07.webp');
    this.load.image('hexSlot08', './Puzzle-Assets/UI/GM Slot Hexa08.webp');
    this.load.image('hexSlot09', './Puzzle-Assets/UI/GM Slot Hexa09.webp');
    this.load.image('hexSlot010', './Puzzle-Assets/UI/GM Slot Hexa10.webp');
    // Tambahan Slox untuk Series02 Hexa11 - 20 (perlu rubah dari png ke webp)
    this.load.image('hexSlot201', './Puzzle-Assets/UI/GM Slot02 Hexa01.webp');
    this.load.image('hexSlot202', './Puzzle-Assets/UI/GM Slot02 Hexa02.webp');
    this.load.image('hexSlot203', './Puzzle-Assets/UI/GM Slot02 Hexa03.webp');
    this.load.image('hexSlot204', './Puzzle-Assets/UI/GM Slot02 Hexa04.webp');
    this.load.image('hexSlot205', './Puzzle-Assets/UI/GM Slot02 Hexa05.webp');
    this.load.image('hexSlot206', './Puzzle-Assets/UI/GM Slot02 Hexa06.webp');
    this.load.image('hexSlot207', './Puzzle-Assets/UI/GM Slot02 Hexa07.webp');
    this.load.image('hexSlot208', './Puzzle-Assets/UI/GM Slot02 Hexa08.webp');
    this.load.image('hexSlot209', './Puzzle-Assets/UI/GM Slot02 Hexa09.webp');
    this.load.image('hexSlot210', './Puzzle-Assets/UI/GM Slot02 Hexa10.webp');
    this.load.image('hexSlot211', './Puzzle-Assets/UI/GM Slot02 Hexa11.webp');
    this.load.image('hexSlot212', './Puzzle-Assets/UI/GM Slot02 Hexa12.webp');
    this.load.image('hexSlot213', './Puzzle-Assets/UI/GM Slot02 Hexa13.webp');
    this.load.image('hexSlot214', './Puzzle-Assets/UI/GM Slot02 Hexa14.webp');
    this.load.image('hexSlot215', './Puzzle-Assets/UI/GM Slot02 Hexa15.webp');
    this.load.image('hexSlot216', './Puzzle-Assets/UI/GM Slot02 Hexa16.webp');
    this.load.image('hexSlot217', './Puzzle-Assets/UI/GM Slot02 Hexa17.webp');
    this.load.image('hexSlot218', './Puzzle-Assets/UI/GM Slot02 Hexa18.webp');
    this.load.image('hexSlot219', './Puzzle-Assets/UI/GM Slot02 Hexa19.webp');
    this.load.image('hexSlot220', './Puzzle-Assets/UI/GM Slot02 Hexa20.webp');
    //this.load.image('horse', './Puzzle-Assets/UI/GM. Black Horse Run Behind.webp');
    this.load.image('blankBhL1', './Puzzle-Assets/UI/Blank Black Horse Level01.webp');
    this.load.image('bhAngguk1', './Puzzle-Assets/UI/GM BH Head Angguk1.webp');
    this.load.image('bhAngguk2', './Puzzle-Assets/UI/GM BH Head Angguk2.webp');
    this.load.image('bhAngguk3', './Puzzle-Assets/UI/GM BH Head Angguk3.webp');
    this.load.image('bhGeleng1', './Puzzle-Assets/UI/GM BH Head Geleng1.webp');
    this.load.image('bhGeleng2', './Puzzle-Assets/UI/GM BH Head Geleng2.webp');
    this.load.image('bhGeleng3', './Puzzle-Assets/UI/GM BH Head Geleng3.webp');
    this.load.image('bhClosedEyes', './Puzzle-Assets/UI/GM BH Head Closed Eyes.webp');
    this.load.image('download', './Puzzle-Assets/UI/GM Cowboy_brown_hat_win.png');
    this.load.image('claimHat', './Puzzle-Assets/UI/GM Claim Hat.webp')
    this.load.image('claimHatC', './Puzzle-Assets/UI/GM Claim Hat Coklat.webp');
    this.load.image('candySunset', './Puzzle-Assets/UI/GM CandySunset.webp');
    this.load.image('candyCyan', './Puzzle-Assets/UI/GM CandyCyan.webp');
  //this.load.image('gameOver', './Puzzle-Assets/UI/GM. Game Over.webp');
  //Audio and Sound
    this.load.image('soundOn', './Puzzle-Assets/UI/GM Sound On.webp');
    this.load.image('soundOnL', './Puzzle-Assets/UI/GM Sound On Light.webp');
    this.load.image('soundOff', './Puzzle-Assets/UI/GM Sound Off.webp');
    this.load.image('soundOffL', './Puzzle-Assets/UI/GM Sound Off Light.webp');
    this.load.audio('introMusic', './Puzzle-Assets/Sfx/scenes/level01_1_herdhorses_guitar_intro_ident.mp3');
    this.load.audio('mainMusic', './Puzzle-Assets/Sfx/scenes/level01_2 music_favorite_sunset_dreams.mp3');
    this.load.audio('winMusic', './Puzzle-Assets/Sfx/scenes/win_in_the_video_game.mp3');
    this.load.audio('horseNeigh', './Puzzle-Assets/Sfx/sound/horse_neigh.mp3');
    this.load.audio('horseSnort', './Puzzle-Assets/Sfx/sound/horse_snort.mp3');
    this.load.audio('horseHoof', './Puzzle-Assets/Sfx/sound/hoof_run.mp3');
    this.load.audio('horsehoofstep', './Puzzle-Assets/Sfx/sound/hoof_step.mp3');
    this.load.audio('horseGallop', './Puzzle-Assets/Sfx/sound/blackhorse_gallop.mp3');
    this.load.audio('herdGallop', './Puzzle-Assets/Sfx/sound/herd_gallop.mp3');
  // SERIES 02 Blank and head Black Horse 
    this.load.image('blankBhL2', './Puzzle-Assets/UI/Blank Black Horse Level01S02.webp'); 
    this.load.image('displayBhL2', './Puzzle-Assets/UI/GM BH DisplayS02.webp');
    this.load.image('displayBhL2ClosedEyes', './Puzzle-Assets/UI/GM BH DisplayS02 Closed Eyes.webp');
    this.load.image('displayBhL2SuckPuzzle', './Puzzle-Assets/UI/GM BH DisplayS02 Suck Puzzle.webp');
    this.load.image('bhGeleng1S2', './Puzzle-Assets/UI/GM BH ShakeHead1S2.webp');
    this.load.image('bhGeleng2S2', './Puzzle-Assets/UI/GM BH ShakeHead2S2.webp');
    this.load.image('bhGeleng3S2', './Puzzle-Assets/UI/GM BH ShakeHead3S2.webp');
    this.load.image('bhGeleng4S2', './Puzzle-Assets/UI/GM BH ShakeHead4S2.webp');
    this.load.image('bhGeleng4S2ClosedEyes', './Puzzle-Assets/UI/GM BH ShakeHead4S2 Closed Eyes.webp');
  // SERIES 02 Black Horse Mini (untuk animasi kecil di panel info)
    this.load.image('bhMiniS2_1', './Puzzle-Assets/UI/GM BH Mini S02 1 SleepLeft.webp');
    this.load.image('bhMiniS2_2', './Puzzle-Assets/UI/GM BH Mini S02 2 SleepCenter.webp');
    this.load.image('bhMiniS2_3', './Puzzle-Assets/UI/GM BH Mini S02 3 SleepRight.webp');
    this.load.image('bhMiniS2_4', './Puzzle-Assets/UI/GM BH Mini S02 4 Awake1.webp');
    this.load.image('bhMiniS2_5', './Puzzle-Assets/UI/GM BH Mini S02 5 SleepBehind.webp');
    this.load.image('bhMiniS2_6', './Puzzle-Assets/UI/GM BH Mini S02 6 Awake2.webp'); 
    this.load.image('bhMiniS2_7', './Puzzle-Assets/UI/GM BH Mini S02 7 Awake3.webp');
    this.load.image('bhMiniS2_8', './Puzzle-Assets/UI/GM BH Mini S02 8 oh Blocked.webp');
    this.load.image('bhMiniS2_8NQ', './Puzzle-Assets/UI/GM BH Mini S02 8 oh Blocked No Question Mark.webp');
    this.load.image('bhMiniS2_8CE', './Puzzle-Assets/UI/GM BH Mini S02 8 oh Blocked Closed Eyes.webp');
    this.load.image('bhMiniS2_8CENQ', './Puzzle-Assets/UI/GM BH Mini S02 8 oh Blocked Closed Eyes NQ.webp');
    this.load.image('bhMiniS2_9AC', './Puzzle-Assets/UI/GM BH Mini S02 9 Happy Accept Candy.webp');
    this.load.image('bhMiniS2_9', './Puzzle-Assets/UI/GM BH Mini S02 9 Happy.webp');
    this.load.image('bhMiniS2_10', './Puzzle-Assets/UI/GM BH Mini S02 10 Closed Eye Happy.webp');
    this.load.image('bhMiniS2_9F', './Puzzle-Assets/UI/GM BH Mini S02 9 Happy Free.webp');
    this.load.image('bhMiniS2_9FCE', './Puzzle-Assets/UI/GM BH Mini S02 9 Happy Free Closed Eyes.webp');
    this.load.image('bhMiniS2_11', './Puzzle-Assets/UI/GM BH Mini S02 11 Back Sit.webp');
    this.load.image('bhMiniS2_Z1', './Puzzle-Assets/UI/GM BH Mini S02 Icon Sleep Z1.webp');
    this.load.image('bhMiniS2_Z2', './Puzzle-Assets/UI/GM BH Mini S02 Icon Sleep Z2.webp');
    this.load.image('bhMiniS2_Z3', './Puzzle-Assets/UI/GM BH Mini S02 Icon Sleep Z3.webp');
    this.load.image('bhMiniS2_GM1FBC', './Puzzle-Assets/UI/GM 1 Futuristic Bag Closed.webp');
    this.load.image('bhMiniS2_GM2AFBO', './Puzzle-Assets/UI/GM 2A Futuristic Bag Open.webp');
    this.load.image('bhMiniS2_GM2BFBBS', './Puzzle-Assets/UI/GM 2B Futuristic Bag Bhimbie Show.webp');
    this.load.image('bhMiniS2_GM3BFBTE', './Puzzle-Assets/UI/GM 3 Bhimbie into Futuristic Bag Teary eyes.webp');
    this.load.image('bhMiniS2_GM4BFBTE', './Puzzle-Assets/UI/GM 4 Bhimbie into Futuristic Bag Shed a Tear.webp');
    this.load.image('bhMiniS2_GM5BFBCVS', './Puzzle-Assets/UI/GM 5 Bhimbie into Futuristic Bag Closed Very Sad.webp');
    this.load.image('bhMiniS2_GM5BFBCVS1', './Puzzle-Assets/UI/GM 5 Bhimbie into Futuristic Bag Closed Very Sad1.webp');
    this.load.image('bhMiniS2_GM5BFBCVS2', './Puzzle-Assets/UI/GM 5 Bhimbie into Futuristic Bag Closed Very Sad2.webp');
    this.load.image('bhMiniS2_GM6FBEO', './Puzzle-Assets/UI/GM 6 Futuristic Bag Empty Open.webp');
    this.load.image('bhMiniS2_GM6FBBO', './Puzzle-Assets/UI/GM 6 Futuristic Bag with Bhimbie Open.webp');
    this.load.image('bhMiniS2_GM7BGF', './Puzzle-Assets/UI/GM 7 Bhimbie GetOut Free.webp');
  }
};