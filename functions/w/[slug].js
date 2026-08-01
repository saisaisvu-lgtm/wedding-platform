// functions/w/[slug].js
// 光影婚礼墙 — 全屏照片墙 + 杂志翻页 + RSVP

export async function onRequest(context) {
  const { params } = context;
  const slug = params.slug;

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <title>囍 · 婚礼</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&family=Ma+Shan+Zheng&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
  <style>
    *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
    html,body{width:100%;height:100%;overflow:hidden;font-family:'Noto Serif SC','PingFang SC',serif;background:#faf9f7;color:#3a2a1a;-webkit-tap-highlight-color:transparent;-webkit-font-smoothing:antialiased;user-select:none;position:fixed;top:0;left:0}

    /* ====== 加载 ====== */
    #loading-screen{position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(160deg,#fdf2f0 0%,#f5e6e0 30%,#f0d6cc 60%,#e8c4b8 100%);transition:opacity 0.8s ease;padding:20px;overflow:hidden}
    #loading-screen .xi{font-size:min(22vw,22vh,100px);color:#b8860b;text-shadow:0 0 30px rgba(184,134,11,0.2);animation:xiPulse 2s ease-in-out infinite;line-height:1}
    #loading-screen .title{font-size:clamp(18px,5vw,28px);color:#8b6914;letter-spacing:0.4em;margin-top:2vh;text-align:center;font-weight:600}
    #loading-screen .progress-container{margin-top:3vh;width:min(70%,320px);height:3px;background:rgba(184,134,11,0.15);border-radius:2px;overflow:hidden}
    #loading-screen .progress-bar{width:0%;height:100%;background:linear-gradient(90deg,#b8860b,#d4a843);border-radius:2px;transition:width 0.3s ease}
    #loading-screen .progress-text{margin-top:1.5vh;font-size:12px;color:#a08060;letter-spacing:0.1em}
    #loading-screen .enter-btns{display:none;margin-top:4vh;gap:12px;flex-wrap:wrap;justify-content:center}
    #loading-screen .enter-btns.show{display:flex}
    #loading-screen .enter-btns button{background:rgba(184,134,11,0.12);border:1px solid rgba(184,134,11,0.5);color:#8b6914;padding:12px 28px;border-radius:30px;font-size:15px;cursor:pointer;transition:all 0.3s;font-family:inherit;letter-spacing:0.1em;font-weight:500}
    #loading-screen .enter-btns button:active{background:rgba(184,134,11,0.25);transform:scale(0.96)}
    @keyframes xiPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}

    /* ====== RSVP ====== */
    #rsvp-screen{position:fixed;inset:0;z-index:150;display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,#fdf6e3 0%,#f5ede0 40%,#ede1d0 100%);transition:opacity 0.6s ease;overflow-y:auto;padding:20px}
    #rsvp-screen.hidden{display:none}
    .rsvp-card{max-width:420px;width:100%;text-align:center;padding:32px 24px;background:#ffffff;border:1px solid rgba(184,134,11,0.15);border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.06)}
    .rsvp-card .rsvp-xi{font-size:48px;color:#b8860b;text-shadow:0 0 30px rgba(184,134,11,0.2);margin-bottom:8px}
    .rsvp-card .rsvp-title{font-size:18px;color:#8b6914;letter-spacing:0.2em;margin-bottom:4px}
    .rsvp-card .rsvp-subtitle{font-size:13px;color:#a08060;margin-bottom:24px}
    .rsvp-field{margin-bottom:14px;text-align:left}
    .rsvp-field label{display:block;font-size:13px;color:#8b6914;margin-bottom:5px;letter-spacing:0.1em;font-weight:500}
    .rsvp-field input,.rsvp-field select{width:100%;padding:11px 14px;background:#faf9f7;border:1px solid rgba(184,134,11,0.2);border-radius:8px;color:#3a2a1a;font-size:15px;outline:none;font-family:inherit;transition:border-color 0.2s}
    .rsvp-field input:focus,.rsvp-field select:focus{border-color:#b8860b;box-shadow:0 0 0 3px rgba(184,134,11,0.1)}
    .rsvp-field input::placeholder{color:#b0a090}
    .rsvp-field select option{background:#fff;color:#3a2a1a}
    .rsvp-submit{width:100%;padding:13px;background:linear-gradient(135deg,#b8860b,#d4a843);border:none;border-radius:8px;color:#fff;font-size:16px;cursor:pointer;letter-spacing:0.15em;font-family:inherit;transition:all 0.3s;margin-top:8px;font-weight:500}
    .rsvp-submit:active{transform:scale(0.97)}
    .rsvp-msg{margin-top:12px;font-size:13px;min-height:20px}
    .rsvp-msg.ok{color:#16a34a}
    .rsvp-msg.err{color:#dc2626}
    .rsvp-skip{margin-top:16px;font-size:13px}
    .rsvp-skip a{color:#a08060;cursor:pointer;text-decoration:none;border-bottom:1px solid rgba(184,134,11,0.2);padding-bottom:2px}
    .rsvp-skip a:hover{color:#8b6914}
    .rsvp-names{margin-top:20px;font-size:12px;color:#b0a090;letter-spacing:0.1em}

    /* ====== Invitation Card - Anime Pink Style ====== */
    #invite-overlay{position:fixed;inset:0;z-index:160;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);padding:20px;opacity:0;transition:opacity 0.5s}
    #invite-overlay.show{display:flex;opacity:1}
    .invite-card{width:380px;max-width:92vw;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 16px 60px rgba(219,112,147,0.25),0 4px 20px rgba(0,0,0,0.1);position:relative;border:2px solid rgba(255,182,193,0.4)}
    .ic-header{width:100%;padding:24px 24px 16px;text-align:center;background:linear-gradient(160deg,#fff0f5 0%,#ffe4ec 40%,#ffd6e0 100%);position:relative;overflow:hidden}
    .ic-header::before{content:'';position:absolute;top:-30px;right:-30px;width:100px;height:100px;background:radial-gradient(circle,rgba(255,182,193,0.3),transparent 70%);border-radius:50%}
    .ic-header::after{content:'';position:absolute;bottom:-20px;left:-20px;width:80px;height:80px;background:radial-gradient(circle,rgba(255,192,203,0.25),transparent 70%);border-radius:50%}
    .ic-sparkle{position:absolute;font-size:14px;opacity:0.6;animation:sparkleFloat 2s ease-in-out infinite}
    .ic-sparkle:nth-child(1){top:12px;left:20px;animation-delay:0s}
    .ic-sparkle:nth-child(2){top:20px;right:25px;animation-delay:0.7s}
    .ic-sparkle:nth-child(3){bottom:15px;left:40px;animation-delay:1.4s}
    .ic-sparkle:nth-child(4){bottom:10px;right:45px;animation-delay:0.3s}
    @keyframes sparkleFloat{0%,100%{transform:scale(1) rotate(0deg);opacity:0.6}50%{transform:scale(1.3) rotate(15deg);opacity:1}}
    .ic-title{font-size:18px;color:#db7093;letter-spacing:0.3em;font-weight:600;margin-bottom:2px}
    .ic-title-en{font-size:10px;color:rgba(219,112,147,0.5);letter-spacing:0.15em;text-transform:uppercase}
    .ic-avatars{display:flex;align-items:center;justify-content:center;gap:0;margin:14px 0 10px;position:relative}
    .ic-avatar{width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,182,193,0.6);box-shadow:0 4px 16px rgba(219,112,147,0.2);background:#fff5f8;position:relative;z-index:1}
    .ic-avatar-heart{font-size:28px;margin:0 -10px;z-index:2;filter:drop-shadow(0 2px 4px rgba(219,112,147,0.3));position:relative}
    .ic-illust{width:100%;height:180px;position:relative;overflow:hidden;background:linear-gradient(180deg,#fff5f8 0%,#fff 100%)}
    .ic-illust img{width:100%;height:100%;object-fit:cover;object-position:center top}
    .ic-illust::after{content:'';position:absolute;bottom:0;left:0;right:0;height:50px;background:linear-gradient(0deg,#fff,transparent)}
    .ic-body{padding:0 24px 20px;text-align:center}
    .ic-date{font-size:14px;color:#999;letter-spacing:0.15em;margin-bottom:8px}
    .ic-names{font-family:'Ma Shan Zheng',cursive,serif;font-size:28px;color:#e75480;letter-spacing:0.2em;margin-bottom:4px;text-shadow:0 2px 8px rgba(231,84,128,0.15)}
    .ic-names-en{font-size:11px;color:rgba(219,112,147,0.45);letter-spacing:0.12em;margin-bottom:14px;text-transform:uppercase}
    .ic-msg{font-size:13px;color:#777;line-height:2;letter-spacing:0.06em;margin-bottom:6px}
    .ic-venue{font-size:12px;color:#aaa;letter-spacing:0.05em;margin-bottom:16px}
    .ic-divider{width:60px;height:1px;background:linear-gradient(90deg,transparent,#ffb6c1,transparent);margin:0 auto 16px}
    .ic-code-section{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px;background:linear-gradient(135deg,#fff5f8,#fff0f5);border-radius:16px;margin-bottom:14px;border:1px solid rgba(255,182,193,0.3)}
    .ic-code-left{text-align:left;flex:1}
    .ic-code-label{font-size:11px;color:#db7093;letter-spacing:0.1em;margin-bottom:6px;font-weight:500}
    .ic-code-num{font-family:'Courier New',monospace;font-size:26px;color:#e75480;letter-spacing:0.2em;font-weight:700}
    .ic-code-hint{font-size:9px;color:#ccc;margin-top:4px}
    .ic-qr{flex-shrink:0}
    .ic-qr canvas{border-radius:8px}
    .ic-footer{font-size:10px;color:#ddd;letter-spacing:0.08em;margin-top:8px}
    .invite-actions{display:flex;gap:12px;margin-top:16px;flex-wrap:wrap;justify-content:center}
    .invite-actions button{padding:12px 28px;border-radius:25px;font-size:14px;cursor:pointer;transition:all 0.3s;font-family:inherit;letter-spacing:0.1em;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
    .btn-invite-save{background:rgba(231,84,128,0.08);border:1.5px solid rgba(231,84,128,0.4);color:#e75480}
    .btn-invite-save:active{transform:scale(0.96)}
    .btn-invite-enter{background:linear-gradient(135deg,#ff69b4,#db7093);border:none;color:#fff;font-weight:500;box-shadow:0 4px 15px rgba(219,112,147,0.3);letter-spacing:0.15em}
    .btn-invite-enter:active{transform:scale(0.96)}

    /* ====== 控制栏 ====== */
    .controls{position:fixed;top:0;left:0;right:0;z-index:100;display:none;align-items:center;justify-content:center;gap:4px;padding:8px;padding-top:max(8px,env(safe-area-inset-top));background:rgba(255,255,255,0.85);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(184,134,11,0.1);flex-wrap:wrap;min-height:44px;opacity:0;transform:translateY(-100%);transition:opacity 0.4s,transform 0.4s}
    .controls.show{display:flex;opacity:1;transform:translateY(0)}
    .controls button{background:rgba(184,134,11,0.08);border:1px solid rgba(184,134,11,0.25);color:#6b5a4a;padding:6px 12px;border-radius:20px;font-size:11px;cursor:pointer;transition:all 0.3s;font-family:inherit;white-space:nowrap;min-height:32px;display:flex;align-items:center;justify-content:center}
    .controls button:active{background:rgba(184,134,11,0.2);border-color:#b8860b;transform:scale(0.95)}
    .controls button.active{background:rgba(184,134,11,0.2);border-color:#b8860b;color:#8b6914}
    .controls .sep{width:1px;height:14px;background:rgba(184,134,11,0.15);margin:0 2px}
    .controls .speed-label{font-size:10px;color:#8b7a6a;margin-left:2px}

    /* ====== 照片墙 ====== */
    #gridwall{position:fixed;inset:0;z-index:10;overflow:hidden;background:#f5f3ef;display:none}
    #gridwall .grid-track{display:flex;flex-direction:column;gap:3px;animation:gridScrollUp var(--scroll-duration,50s) linear infinite;will-change:transform}
    #gridwall .grid-track.paused{animation-play-state:paused}
    #gridwall .grid-row{display:flex;gap:3px;height:22vh;flex-shrink:0}
    #gridwall .grid-row:nth-child(even){animation:gridScrollL var(--row-duration,40s) linear infinite}
    #gridwall .grid-row:nth-child(odd){animation:gridScrollR var(--row-duration,40s) linear infinite}
    #gridwall .grid-row:nth-child(even),#gridwall .grid-row:nth-child(odd){will-change:transform}
    #gridwall .grid-item{flex:none;height:100%;aspect-ratio:3/2;border-radius:6px;overflow:hidden;position:relative;display:flex;align-items:center;justify-content:center;background:#e8e4dd}
    #gridwall .grid-item .blur-fill{position:absolute;inset:-15px;background-size:cover;background-position:center;filter:blur(20px) brightness(0.9);z-index:0}
    #gridwall .grid-item img{position:relative;z-index:2;max-width:92%;max-height:92%;object-fit:contain;border-radius:3px;-webkit-user-drag:none}
    @keyframes gridScrollL{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    @keyframes gridScrollR{0%{transform:translateX(-50%)}100%{transform:translateX(0)}}
    @keyframes gridScrollUp{0%{transform:translateY(0)}100%{transform:translateY(-50%)}}

    /* ====== 杂志 ====== */
    #magazine{position:fixed;inset:0;z-index:10;display:none;overflow:hidden;background:#f5f3ef;touch-action:pan-x}
    .mag-container{position:absolute;inset:0;display:flex}
    .mag-img-area{flex:1;position:relative;overflow:hidden}
    .mag-img-area .blur-bg{position:absolute;inset:-20px;background-size:cover;background-position:center;filter:blur(50px) brightness(0.8) saturate(0.8);z-index:0}
    .mag-img-page{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0;transform:translateX(30px);transition:all 0.5s cubic-bezier(0.4,0,0.2,1)}
    .mag-img-page.active{opacity:1;transform:translateX(0);z-index:2}
    .mag-img-page.prev{opacity:0;transform:translateX(-30px);z-index:1}
    .mag-img-page.next{opacity:0;transform:translateX(30px);z-index:1}
    @media(min-width:769px){
      .mag-img-area{perspective:2000px}
      .mag-img-page{transform:rotateY(0deg);transition:none}
      .mag-img-page.active{z-index:3;opacity:1;transform:rotateY(0deg)}
      .mag-img-page.next{z-index:2;opacity:1}
      .mag-img-page.prev{z-index:1;opacity:0;transform:rotateY(-30deg)}
      .mag-img-page.flip-out-left{animation:flipOutLeft 0.8s cubic-bezier(0.4,0,0.2,1) forwards;z-index:4}
      .mag-img-page.flip-in-right{animation:flipInRight 0.8s cubic-bezier(0.4,0,0.2,1) forwards;z-index:3}
      @keyframes flipOutLeft{0%{transform:rotateY(0deg);opacity:1}100%{transform:rotateY(-90deg);opacity:0.3}}
      @keyframes flipInRight{0%{transform:rotateY(90deg);opacity:0.3}100%{transform:rotateY(0deg);opacity:1}}
    }
    .mag-img-page img{position:relative;z-index:2;max-width:90%;max-height:90%;object-fit:contain;border-radius:4px;box-shadow:0 8px 40px rgba(0,0,0,0.15)}
    .mag-text-area{width:35%;min-width:200px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;background:linear-gradient(160deg,#fdf6e3 0%,#f5ede0 40%,#ede1d0 100%);position:relative;z-index:2;transition:opacity 0.4s ease}
    .mag-text-area .mag-xi{font-size:clamp(40px,8vw,72px);color:#b8860b;text-shadow:0 0 20px rgba(184,134,11,0.15);margin-bottom:16px;animation:xiPulse 3s ease-in-out infinite}
    .mag-text-area .mag-quote{font-size:clamp(13px,2vw,16px);color:#5a4a3a;line-height:1.8;text-align:center;margin-bottom:16px;letter-spacing:0.05em;font-style:italic;transition:opacity 0.3s}
    .mag-text-area .avatar-container{display:flex;gap:12px;margin-bottom:12px}
    .mag-text-area .avatar{width:56px;height:56px;border-radius:50%;border:2px solid rgba(184,134,11,0.4);object-fit:cover;box-shadow:0 2px 8px rgba(0,0,0,0.1)}
    .mag-text-area .names-label{font-size:14px;color:#8b6914;letter-spacing:0.1em;background:rgba(184,134,11,0.06);padding:4px 16px;border-radius:16px;border:1px solid rgba(184,134,11,0.15)}
    .mag-text-area .mag-thanks{font-size:12px;color:#a08060;letter-spacing:0.1em;font-style:italic;margin-top:8px;opacity:0.8;transition:opacity 0.3s}
    /* ====== Lyrics Player ====== */
    .lyrics-player{position:fixed;bottom:0;left:0;right:0;z-index:90;background:linear-gradient(0deg,rgba(253,246,227,0.95) 0%,rgba(253,246,227,0.7) 70%,transparent 100%);padding:12px 20px 16px;display:none;flex-direction:column;align-items:center;gap:8px}
    .lyrics-player.active{display:flex}
    .lyrics-player-inner{display:flex;align-items:center;gap:16px;max-width:600px;width:100%}
    .lyrics-singer-avatar{width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid rgba(184,134,11,0.4);flex-shrink:0;transition:all 0.3s;opacity:0.5}
    .lyrics-singer-avatar.active{border-color:#b8860b;opacity:1;box-shadow:0 0 12px rgba(184,134,11,0.3);animation:singerPulse 1s ease-in-out infinite}
    @keyframes singerPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
    .lyrics-text-display{flex:1;text-align:center;font-size:clamp(14px,2.5vw,18px);color:#3a2a1a;letter-spacing:0.06em;line-height:1.6;min-height:1.5em}
    .lyrics-text-display .char{display:inline;opacity:0;transform:translateY(4px);transition:opacity 0.15s,transform 0.15s}
    .lyrics-text-display .char.visible{opacity:1;transform:translateY(0)}
    .lyrics-text-display .cursor{display:inline-block;width:2px;height:1em;background:#b8860b;margin-left:2px;animation:blink 0.6s step-end infinite;vertical-align:middle}
    @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
    .lyrics-note{position:absolute;font-size:18px;animation:noteFloat 1.5s ease-out forwards;pointer-events:none}
    @keyframes noteFloat{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-40px) scale(0.5)}}
    .lyrics-song-info{font-size:11px;color:#a08060;letter-spacing:0.05em}
    @media(max-width:768px){
      .mag-container{flex-direction:column}
      .mag-text-area{width:100%;min-width:0;padding:20px;order:2}
      .mag-img-area{order:1;min-height:50vh}
      .mag-text-area .avatar{width:44px;height:44px}
    }

    /* ====== 粒子 ====== */
    .particles{position:fixed;inset:0;z-index:5;pointer-events:none;overflow:hidden}
    .particle{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(184,134,11,0.5),rgba(212,175,55,0.2));pointer-events:none;animation:particleFloat linear infinite}
    @keyframes particleFloat{0%{transform:translateY(100vh) rotate(0deg);opacity:0}10%{opacity:0.6}90%{opacity:0.3}100%{transform:translateY(-10vh) rotate(360deg);opacity:0}}

    /* ====== 致谢 ====== */
    #credits-overlay{position:fixed;inset:0;z-index:120;background:rgba(253,246,227,0.95);display:none;align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:40px;opacity:0;transition:opacity 0.5s;backdrop-filter:blur(8px)}
    #credits-overlay.show{display:flex;opacity:1}
    #credits-overlay .credits-xi{font-size:48px;color:#b8860b;margin-bottom:20px}
    #credits-overlay .credits-text{font-size:15px;color:#5a4a3a;line-height:2;letter-spacing:0.05em;max-width:500px}
    #credits-overlay .credits-names{margin-top:24px;font-size:16px;color:#8b6914;letter-spacing:0.15em}
    #credits-overlay .credits-close{margin-top:32px;background:rgba(184,134,11,0.1);border:1px solid rgba(184,134,11,0.4);color:#8b6914;padding:10px 28px;border-radius:24px;font-size:14px;cursor:pointer;font-family:inherit}
    #credits-overlay .credits-close:active{background:rgba(184,134,11,0.2)}

    /* ====== 热区提示 ====== */
    .hotzone{position:fixed;top:0;left:50%;transform:translateX(-50%);width:60px;height:3px;background:rgba(184,134,11,0.3);border-radius:0 0 3px 3px;z-index:101;opacity:0;transition:opacity 0.3s;pointer-events:none}
    .hotzone.visible{opacity:1}
    .fullscreen-hint{position:fixed;bottom:60px;left:50%;transform:translateX(-50%);z-index:99;background:rgba(0,0,0,0.6);color:#fff;padding:8px 20px;border-radius:20px;font-size:13px;letter-spacing:0.05em;opacity:0;transition:opacity 0.5s;pointer-events:none;white-space:nowrap}
    .fullscreen-hint.show{opacity:1}
    .fullscreen-hint.hide{opacity:0}
  </style>
</head>
<body>
  <!-- 加载 -->
  <div id="loading-screen">
    <div class="xi">囍</div>
    <div class="title" id="loading-title">WEDDING DAY</div>
    <div class="countdown" id="countdown" style="margin-top:2vh;display:flex;align-items:flex-start;justify-content:center;gap:clamp(12px,3vw,24px);">
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;min-width:clamp(48px,12vw,80px)"><span id="cd-days" style="font-family:'Noto Serif SC',serif;font-size:clamp(36px,10vw,64px);color:#8b6914;line-height:1;font-weight:700;text-align:center">--</span><span style="font-size:clamp(10px,2.5vw,14px);color:#a08060;letter-spacing:0.15em">days</span></div>
      <span style="font-size:clamp(24px,6vw,40px);color:#b8860b;margin-top:2px">:</span>
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;min-width:clamp(48px,12vw,80px)"><span id="cd-hours" style="font-family:'Noto Serif SC',serif;font-size:clamp(36px,10vw,64px);color:#8b6914;line-height:1;font-weight:700;text-align:center">--</span><span style="font-size:clamp(10px,2.5vw,14px);color:#a08060;letter-spacing:0.15em">hrs</span></div>
      <span style="font-size:clamp(24px,6vw,40px);color:#b8860b;margin-top:2px">:</span>
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;min-width:clamp(48px,12vw,80px)"><span id="cd-mins" style="font-family:'Noto Serif SC',serif;font-size:clamp(36px,10vw,64px);color:#8b6914;line-height:1;font-weight:700;text-align:center">--</span><span style="font-size:clamp(10px,2.5vw,14px);color:#a08060;letter-spacing:0.15em">min</span></div>
      <span style="font-size:clamp(24px,6vw,40px);color:#b8860b;margin-top:2px">:</span>
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;min-width:clamp(48px,12vw,80px)"><span id="cd-secs" style="font-family:'Noto Serif SC',serif;font-size:clamp(36px,10vw,64px);color:#8b6914;line-height:1;font-weight:700;text-align:center">--</span><span style="font-size:clamp(10px,2.5vw,14px);color:#a08060;letter-spacing:0.15em">sec</span></div>
    </div>
    <div id="cd-date-label" style="font-size:clamp(13px,3vw,16px);color:#a08060;letter-spacing:0.3em;margin-top:1.5vh">距离婚礼</div>
    <div style="font-family:'Noto Serif SC',serif;font-size:clamp(14px,3.5vw,20px);color:#8b6914;letter-spacing:0.3em;margin-top:2vh;font-weight:600">Save the Date</div>
    <div id="save-date-num" style="font-family:'Noto Serif SC',serif;font-size:clamp(16px,4vw,22px);color:#a08060;letter-spacing:0.4em;margin-top:0.5vh"></div>
    <div class="progress-container"><div class="progress-bar" id="progress-bar"></div></div>
    <div class="progress-text" id="progress-text">0%</div>
    <div class="enter-btns" id="enter-btns">
      <button onclick="enterGallery()">进入婚礼现场 →</button>
    </div>
  </div>

  <!-- RSVP -->
  <div id="rsvp-screen" class="hidden">
    <div class="rsvp-card">
      <div class="rsvp-xi">囍</div>
      <div class="rsvp-title">诚邀您的出席</div>
      <div class="rsvp-subtitle" id="rsvp-couple"></div>
      <form class="rsvp-form" id="rsvp-form" onsubmit="return false;">
        <div class="rsvp-field"><label>您的姓名</label><input type="text" id="rsvp-name" placeholder="请输入您的姓名" maxlength="20" required></div>
        <div class="rsvp-field"><label>联系电话</label><input type="tel" id="rsvp-phone" placeholder="请输入您的手机号" maxlength="20" required></div>
        <div class="rsvp-field"><label>出席人数</label><input type="number" id="rsvp-guests" value="1" min="1" max="20"></div>
        <div class="rsvp-field"><label>到达时间</label><select id="rsvp-arrival" required><option value="" disabled selected>请选择</option></select></div>
        <div class="rsvp-field"><label>出行方式</label><select id="rsvp-transport" required><option value="" disabled selected>请选择</option></select></div>
        <button type="submit" class="rsvp-submit" onclick="submitRSVP()">确认提交</button>
        <div class="rsvp-msg" id="rsvp-msg"></div>
      </form>
      <div class="rsvp-skip"><a onclick="skipRSVP()">直接进入婚礼现场 →</a></div>
      <div class="rsvp-names" id="rsvp-bottom-names"></div>
    </div>
  </div>

  <!-- 控制栏 -->
  <div class="controls" id="controls-bar">
    <button id="btn-gridwall" class="active" onclick="switchMode('gridwall')">🧱 照片墙</button>
    <button id="btn-magazine" onclick="switchMode('magazine')">📖 杂志</button>
    <div class="sep"></div>
    <button onclick="togglePause()" id="btnPause">⏸</button>
    <div class="sep"></div>
    <span class="speed-label">节奏</span>
    <button onclick="setSpeed(0.5,this)" class="speed-btn" data-speed="slow">慢</button>
    <button onclick="setSpeed(1,this)" class="speed-btn active" data-speed="normal">正常</button>
    <button onclick="setSpeed(2,this)" class="speed-btn" data-speed="fast">快</button>
    <div class="sep"></div>
    <button onclick="toggleMusic()" id="btnMusic">🎵 音乐</button>
    <button onclick="showCredits()">🎬 致谢</button>
  </div>
  <div class="hotzone" id="hotzone"></div>
  <div class="fullscreen-hint" id="fullscreen-hint">双击进入全屏</div>

  <!-- 照片墙 -->
  <div id="gridwall"></div>

  <!-- 杂志 -->
  <div id="magazine"></div>

  <!-- 粒子 -->
  <div class="particles" id="particles"></div>

  <!-- 致谢 -->
  <!-- Invitation Card - Anime Pink Style -->
  <div id="invite-overlay">
    <div style="display:flex;flex-direction:column;align-items:center;">
      <div class="invite-card" id="invite-card">
        <div class="ic-header">
          <span class="ic-sparkle">✨</span>
          <span class="ic-sparkle">💖</span>
          <span class="ic-sparkle">✨</span>
          <span class="ic-sparkle">💫</span>
          <div class="ic-title">电子请帖</div>
          <div class="ic-title-en">Wedding Invitation</div>
          <div class="ic-avatars">
            <img class="ic-avatar" id="ic-avatar1" src="" alt="">
            <span class="ic-avatar-heart">❤️</span>
            <img class="ic-avatar" id="ic-avatar2" src="" alt="">
          </div>
        </div>
        <div class="ic-illust">
          <img src="https://img.icons8.com/external-flatart-icons-flat-flatarticons/512/external-wedding-love-flatart-icons-flat-flatarticons.png" alt="wedding" crossorigin="anonymous" onerror="this.style.display='none'">
        </div>
        <div class="ic-body">
          <div class="ic-date" id="ic-date"></div>
          <div class="ic-names" id="ic-names"></div>
          <div class="ic-names-en" id="ic-names-en"></div>
          <div class="ic-msg">诚挚邀请您出席我们的婚礼<br>见证我们人生中最重要的时刻</div>
          <div class="ic-venue" id="ic-info"></div>
          <div class="ic-divider"></div>
          <div class="ic-code-section">
            <div class="ic-code-left">
              <div class="ic-code-label">🎫 参与码</div>
              <div class="ic-code-num" id="ic-participation-code">------</div>
              <div class="ic-code-hint">请截图保存 · 用于后续活动</div>
            </div>
            <div class="ic-qr" id="ic-qr"></div>
          </div>
          <div class="ic-footer">光影婚礼墙 · 永结同心 💕</div>
        </div>
      </div>
      <div class="invite-actions">
        <button class="btn-invite-save" onclick="saveInvite()">💾 保存请帖</button>
        <button class="btn-invite-enter" onclick="enterFromInvite()">进入婚礼现场 →</button>
      </div>
    </div>
  </div>

  <!-- Lyrics Player -->
  <div class="lyrics-player" id="lyrics-player">
    <div class="lyrics-player-inner">
      <img class="lyrics-singer-avatar" id="lyrics-avatar-1" src="" alt="">
      <div class="lyrics-text-display" id="lyrics-display"></div>
      <img class="lyrics-singer-avatar" id="lyrics-avatar-2" src="" alt="">
    </div>
    <div class="lyrics-song-info" id="lyrics-song-info"></div>
  </div>

  <div id="credits-overlay">
    <div class="credits-xi">囍</div>
    <div class="credits-text">感谢每一位亲朋好友<br>在这个特别的日子里<br>见证我们的婚礼</div>
    <div class="credits-names" id="credits-names"></div>
    <button class="credits-close" onclick="hideCredits()">返回</button>
  </div>

  <audio id="bgm" loop></audio>

  <script>
    const slug = '${slug}';
    let PHOTOS = [];
    let AVATARS = [];
    let WEDDING = {};
    let currentMode = 'gridwall';
    let isPaused = false;
    let currentSpeed = 1;
    let magIndex = 0;
    let touchStartX = 0, touchStartY = 0;
    let musicPlaying = false;
    let magTimer = null;
    let magInterval = 4000;

    // ====== 加载 ======
    const isDirect = new URLSearchParams(location.search).has('direct');
    async function init() {
      if (isDirect) {
        // Direct mode: load data and go straight to gallery
        try {
          const res = await fetch('/api/wedding/' + slug);
          const data = await res.json();
          if (!data.ok) return;
          WEDDING = data.wedding;
          WEDDING._songs = data.songs || [];
          PHOTOS = data.images.gallery.map(img => ({ src: img.url, label: img.filename, quote: '' }));
          AVATARS = data.images.avatars.map(img => img.url);
          document.getElementById('loading-screen').style.display = 'none';
          document.getElementById('rsvp-screen').classList.add('hidden');
          buildGridwall();
          buildMagazine();
          showGallery();
          return;
        } catch {}
      }
      updateProgress(10);
      try {
        const res = await fetch('/api/wedding/' + slug);
        const data = await res.json();
        if (!data.ok) { showError(data.error); return; }
        WEDDING = data.wedding;
        WEDDING._songs = data.songs || [];
        PHOTOS = data.images.gallery.map(img => ({ src: img.url, label: img.filename, quote: '' }));
        AVATARS = data.images.avatars.map(img => img.url);
        updateProgress(40);
        document.title = '囍 · ' + WEDDING.couple_name;
        // Update countdown
        if (WEDDING.wedding_date) {
          const datePart = WEDDING.wedding_date.split(' ')[0];
          const timePart = WEDDING.wedding_date.includes(' ') ? WEDDING.wedding_date.split(' ')[1] : '00:00';
          const d = new Date(datePart + 'T' + timePart);
          document.getElementById('cd-date-label').textContent = '距离婚礼 · ' + WEDDING.wedding_date;
          const dp = datePart.split('-');
          document.getElementById('save-date-num').textContent = dp[0] + '.' + dp[1] + '.' + dp[2];
          const target = d.getTime();
          function tickCd() {
            const diff = target - Date.now();
            if (diff <= 0) { document.getElementById('cd-days').textContent = '0'; document.getElementById('cd-hours').textContent = '00'; document.getElementById('cd-mins').textContent = '00'; document.getElementById('cd-secs').textContent = '00'; return; }
            document.getElementById('cd-days').textContent = Math.floor(diff / 86400000);
            document.getElementById('cd-hours').textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
            document.getElementById('cd-mins').textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
            document.getElementById('cd-secs').textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
          }
          tickCd(); setInterval(tickCd, 1000);
        }
        // RSVP
        document.getElementById('rsvp-couple').textContent = WEDDING.couple_name + ' · 婚礼出席确认';
        document.getElementById('rsvp-bottom-names').textContent = WEDDING.couple_name;
        document.getElementById('credits-names').textContent = WEDDING.couple_name;
        // 到达时间选项
        {
          const sel = document.getElementById('rsvp-arrival');
          const opts = WEDDING.arrival_options || [];
          if (opts.length > 0) {
            opts.forEach(o => sel.add(new Option(o, o)));
          } else if (WEDDING.wedding_date) {
            const d = new Date(WEDDING.wedding_date + 'T00:00:00');
            for (let offset = -3; offset <= 1; offset++) {
              const date = new Date(d); date.setDate(date.getDate() + offset);
              const label = (date.getMonth()+1)+'月'+date.getDate()+'日';
              sel.add(new Option(label+' 上午', label+' 上午'));
              sel.add(new Option(label+' 下午', label+' 下午'));
            }
          }
        }
        // 出行方式选项
        {
          const sel = document.getElementById('rsvp-transport');
          const opts = WEDDING.transport_options || [];
          if (opts.length > 0) {
            opts.forEach(o => sel.add(new Option(o, o)));
          } else {
            ['🚗 自驾','🚕 打车','🚇 公交/地铁','🚶 步行','🚌 其他'].forEach(o => sel.add(new Option(o, o)));
          }
        }
        updateProgress(60);
        await preloadImages();
        updateProgress(90);
        buildGridwall();
        buildMagazine();
        initParticles();
        setSpeed(1);
        updateProgress(100);
        setTimeout(() => {
          document.getElementById('loading-title').textContent = WEDDING.couple_name;
          document.getElementById('enter-btns').classList.add('show');
        }, 500);
      } catch (err) { showError('加载失败'); }
    }

    function showError(msg) {
      document.getElementById('loading-title').textContent = msg || '加载失败';
      document.getElementById('progress-text').textContent = '';
    }

    function updateProgress(pct) {
      document.getElementById('progress-bar').style.width = pct + '%';
      document.getElementById('progress-text').textContent = Math.round(pct) + '%';
    }

    async function preloadImages() {
      const allSrcs = [...PHOTOS.map(p=>p.src), ...AVATARS];
      let loaded = 0;
      await Promise.all(allSrcs.map(src => new Promise(resolve => {
        const img = new Image();
        img.onload = img.onerror = () => { loaded++; updateProgress(60 + (loaded/allSrcs.length)*30); resolve(); };
        img.src = src;
      })));
    }

    // ====== 进入 ======
    function enterGallery() {
      document.getElementById('loading-screen').style.opacity = '0';
      setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        showGallery();
      }, 600);
    }
    function showInviteCard() {
      document.getElementById('rsvp-screen').classList.add('hidden');
      // Populate avatars
      const av1 = document.getElementById('ic-avatar1');
      const av2 = document.getElementById('ic-avatar2');
      if (AVATARS[0]) { av1.src = AVATARS[0]; } else { av1.style.display = 'none'; }
      if (AVATARS.length > 1) { av2.src = AVATARS[1]; } else { av2.src = AVATARS[0] || ''; }
      if (!AVATARS[0] && !AVATARS[1]) { av1.style.display = 'none'; av2.style.display = 'none'; }
      // Populate info
      document.getElementById('ic-names').textContent = WEDDING.couple_name;
      document.getElementById('ic-names-en').textContent = WEDDING.couple_name.toUpperCase();
      if (WEDDING.wedding_date) {
        const d = new Date(WEDDING.wedding_date + 'T00:00:00');
        const days = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
        document.getElementById('ic-date').textContent = d.getFullYear() + '年' + (d.getMonth()+1) + '月' + d.getDate() + '日 ' + days[d.getDay()];
      }
      const infoArr = [];
      if (WEDDING.wedding_venue) infoArr.push('📍 ' + WEDDING.wedding_venue);
      document.getElementById('ic-info').innerHTML = infoArr.join('<br>');
      generateInviteQR();
      document.getElementById('invite-overlay').classList.add('show');
    }

    function generateInviteQR() {
      const box = document.getElementById('ic-qr');
      box.innerHTML = '';
      try {
        if (typeof qrcode === 'function') {
          const qr = qrcode(0, 'M');
          qr.addData(location.href);
          qr.make();
          const size = 100;
          const cellSize = Math.floor(size / qr.getModuleCount());
          const margin = Math.floor((size - cellSize * qr.getModuleCount()) / 2);
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#e75480';
          ctx.globalAlpha = 0.9;
          for (let row = 0; row < qr.getModuleCount(); row++) {
            for (let col = 0; col < qr.getModuleCount(); col++) {
              if (qr.isDark(row, col)) {
                ctx.fillRect(margin + col * cellSize, margin + row * cellSize, cellSize, cellSize);
              }
            }
          }
          box.appendChild(canvas);
        }
      } catch (e) { console.log('QR generation failed:', e); }
    }

    window.saveInvite = function() {
      const card = document.getElementById('invite-card');
      if (typeof html2canvas !== 'function') { alert('保存功能加载中'); return; }
      html2canvas(card, { backgroundColor: '#fff5f8', scale: 3, useCORS: true, allowTaint: true }).then(canvas => {
        const a = document.createElement('a');
        a.download = 'wedding-invitation.png';
        a.href = canvas.toDataURL('image/png');
        a.click();
      }).catch(() => alert('保存失败'));
    };

    window.enterFromInvite = function() {
      document.getElementById('invite-overlay').classList.remove('show');
      showGallery();
    };

    function skipRSVP() {
      document.getElementById('rsvp-screen').classList.add('hidden');
      showGallery();
    }
    function showGallery() {
      document.getElementById('gridwall').style.display = 'block';
      document.getElementById('controls-bar').classList.add('show');
      const bgmSrc = WEDDING.bgm_url || WEDDING.bgm_data;
      if (bgmSrc) { document.getElementById('bgm').src = bgmSrc; }
    }

    // ====== RSVP ======
    async function submitRSVP() {
      const msg = document.getElementById('rsvp-msg');
      const name = document.getElementById('rsvp-name').value.trim();
      const phone = document.getElementById('rsvp-phone').value.trim();
      if (!name || !phone) { msg.textContent = '请填写姓名和电话'; msg.className = 'rsvp-msg err'; return; }
      msg.textContent = '提交中...'; msg.className = 'rsvp-msg';
      try {
        const res = await fetch('/api/rsvp', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
          slug, name, phone,
          guests: document.getElementById('rsvp-guests').value,
          arrival_time: document.getElementById('rsvp-arrival').value,
          transport: document.getElementById('rsvp-transport').value
        })});
        const data = await res.json();
        if (data.ok) {
          msg.textContent = '✅ 提交成功！';
          msg.className = 'rsvp-msg ok';
          // 存储宾客名并跳转请帖页
          try { sessionStorage.setItem('rsvp_name', name); } catch {}
          setTimeout(function() {
            window.location.href = '/invite.html?slug=' + encodeURIComponent(slug) + '&guest=' + encodeURIComponent(name);
          }, 800);
        }
        else { msg.textContent = data.error || '提交失败'; msg.className = 'rsvp-msg err'; }
      } catch { msg.textContent = '网络错误'; msg.className = 'rsvp-msg err'; }
    }

    // ====== 照片墙 ======
    function buildGridwall() {
      const el = document.getElementById('gridwall');
      el.innerHTML = '';
      const track = document.createElement('div');
      track.className = 'grid-track';
      const perRow = window.innerWidth < 768 ? 4 : 6;
      const rowsNeeded = Math.ceil(PHOTOS.length / perRow);
      for (let rep = 0; rep < 2; rep++) {
        for (let r = 0; r < rowsNeeded; r++) {
          const row = document.createElement('div');
          row.className = 'grid-row';
          const startIdx = (r * perRow) % PHOTOS.length;
          for (let dup = 0; dup < 2; dup++) {
            for (let j = 0; j < perRow; j++) {
              const photo = PHOTOS[(startIdx + j) % PHOTOS.length];
              const item = document.createElement('div');
              item.className = 'grid-item';
              const blur = document.createElement('div');
              blur.className = 'blur-fill';
              blur.style.backgroundImage = 'url('+photo.src+')';
              item.appendChild(blur);
              const img = document.createElement('img');
              img.src = photo.src; img.alt = photo.label; img.loading = 'lazy';
              item.appendChild(img);
              row.appendChild(item);
            }
          }
          track.appendChild(row);
        }
      }
      el.appendChild(track);
    }

    // ====== 杂志 ======
    const ALL_QUOTES = ['愿得一心人，白首不相离','执子之手，与子偕老','两情若是久长时，又岂在朝朝暮暮','在天愿作比翼鸟，在地愿为连理枝','春风十里不如你','往后余生，风雪是你，平淡是你','一生一世一双人','你是我最美的风景','山有木兮木有枝，心悦君兮君不知','只缘感君一回顾，使我思君朝与暮','曾经沧海难为水，除却巫山不是云','身无彩凤双飞翼，心有灵犀一点通','衣带渐宽终不悔，为伊消得人憔悴','众里寻他千百度，蓦然回首，那人却在灯火阑珊处','此情可待成追忆，只是当时已惘然','人生若只如初见，何事秋风悲画扇','玲珑骰子安红豆，入骨相思知不知','天涯地角有穷时，只有相思无尽处','似此星辰非昨夜，为谁风露立中宵','愿我如星君如月，夜夜流光相皎洁','结发为夫妻，恩爱两不疑','金风玉露一相逢，便胜却人间无数','柔情似水，佳期如梦','海底月是天上月，眼前人是心上人','死生契阔，与子成说'];
    const ALL_THANKS = ['感谢每一位亲朋好友','在这个特别的日子里','见证我们的婚礼'];

    function buildMagazine() {
      const el = document.getElementById('magazine');
      el.innerHTML = '';
      const shuffledQuotes = [...ALL_QUOTES].sort(() => Math.random() - 0.5);

      // Container with image area + text area
      const container = document.createElement('div');
      container.className = 'mag-container';

      // Image area (contains flipping pages)
      const imgArea = document.createElement('div');
      imgArea.className = 'mag-img-area';
      const blurBg = document.createElement('div');
      blurBg.className = 'blur-bg';
      blurBg.id = 'mag-blur-bg';
      if (PHOTOS[0]) blurBg.style.backgroundImage = 'url('+PHOTOS[0].src+')';
      imgArea.appendChild(blurBg);
      PHOTOS.forEach((p, i) => {
        const page = document.createElement('div');
        page.className = 'mag-img-page' + (i === 0 ? ' active' : '');
        page.dataset.index = i;
        const img = document.createElement('img');
        img.src = p.src; img.alt = p.label; img.loading = 'lazy';
        page.appendChild(img);
        imgArea.appendChild(page);
      });
      container.appendChild(imgArea);

      // Text area (fixed, content updates on flip)
      const textArea = document.createElement('div');
      textArea.className = 'mag-text-area';
      textArea.id = 'mag-text-area';
      const avatarHtml = AVATARS.length >= 2
        ? '<div class="avatar-container"><img class="avatar" src="'+AVATARS[0]+'" alt=""><img class="avatar" src="'+AVATARS[1]+'" alt=""></div>'
        : (AVATARS.length === 1 ? '<div class="avatar-container"><img class="avatar" src="'+AVATARS[0]+'" alt=""></div>' : '');
      textArea.innerHTML = '<div class="mag-xi">囍</div>'
        + '<div class="mag-quote" id="mag-quote">'+shuffledQuotes[0]+'</div>'
        + avatarHtml
        + '<div class="names-label">'+WEDDING.couple_name+'</div>'
        + '<div class="mag-thanks" id="mag-thanks">感谢每一位亲朋好友<br>在这个特别的日子里<br>见证我们的婚礼</div>';
      container.appendChild(textArea);

      el.appendChild(container);
      // Store quotes for random switching
      el._quotes = shuffledQuotes;
      el._thanks = ALL_THANKS;
    }

    function updateMagText() {
      const el = document.getElementById('magazine');
      const quotes = el._quotes || ALL_QUOTES;
      const thanks = el._thanks || ALL_THANKS;
      const quoteEl = document.getElementById('mag-quote');
      const thanksEl = document.getElementById('mag-thanks');
      const blurBg = document.getElementById('mag-blur-bg');
      if (quoteEl) {
        quoteEl.style.opacity = '0';
        setTimeout(() => {
          quoteEl.textContent = quotes[Math.floor(Math.random()*quotes.length)];
          quoteEl.style.opacity = '1';
        }, 200);
      }
      // Update blur bg to match current image
      if (blurBg && PHOTOS[magIndex]) {
        blurBg.style.backgroundImage = 'url('+PHOTOS[magIndex].src+')';
      }
    }

    function magazineNav(dir) {
      const pages = document.querySelectorAll('.mag-img-page');
      if (pages.length === 0) return;
      const old = magIndex;
      magIndex += dir;
      if (magIndex < 0) magIndex = pages.length - 1;
      if (magIndex >= pages.length) magIndex = 0;
      if (window.innerWidth >= 768) {
        pages[old].className = 'mag-img-page ' + (dir > 0 ? 'flip-out-left' : 'flip-in-left');
        pages[magIndex].className = 'mag-img-page active';
        setTimeout(() => { pages[old].className = 'mag-img-page'; }, 800);
      } else {
        pages[old].className = 'mag-img-page ' + (dir > 0 ? 'prev' : 'next');
        pages[magIndex].className = 'mag-img-page active';
      }
      updateMagText();
    }

    // Touch
    document.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; }, {passive:true});
    document.addEventListener('touchend', e => {
      const dx = touchStartX - e.changedTouches[0].clientX;
      const dy = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && currentMode === 'magazine') {
        stopMagAuto(); magazineNav(dx > 0 ? 1 : -1); if (!isPaused) startMagAuto();
      }
    }, {passive:true});
    document.addEventListener('keydown', e => {
      if (currentMode !== 'magazine') return;
      if (e.key === 'ArrowLeft') { stopMagAuto(); magazineNav(-1); if (!isPaused) startMagAuto(); }
      if (e.key === 'ArrowRight') { stopMagAuto(); magazineNav(1); if (!isPaused) startMagAuto(); }
    });

    // ====== 杂志自动播放 ======
    function startMagAuto() {
      stopMagAuto();
      magTimer = setInterval(() => { magazineNav(1); }, magInterval);
    }
    function stopMagAuto() {
      if (magTimer) { clearInterval(magTimer); magTimer = null; }
    }

    // ====== 模式切换 ======
    function switchMode(mode) {
      currentMode = mode;
      document.getElementById('gridwall').style.display = mode === 'gridwall' ? 'block' : 'none';
      document.getElementById('magazine').style.display = mode === 'magazine' ? 'block' : 'none';
      document.getElementById('btn-gridwall').classList.toggle('active', mode === 'gridwall');
      document.getElementById('btn-magazine').classList.toggle('active', mode === 'magazine');
      stopMagAuto();
      if (mode === 'magazine') {
        magIndex = 0;
        document.querySelectorAll('.mag-img-page').forEach((p,i) => p.className = 'mag-img-page'+(i===0?' active':''));
        if (!isPaused) startMagAuto();
      }
    }

    // ====== 暂停/速度 ======
    function togglePause() {
      isPaused = !isPaused;
      document.getElementById('btnPause').textContent = isPaused ? '▶' : '⏸';
      document.querySelectorAll('#gridwall .grid-track').forEach(t => t.classList.toggle('paused', isPaused));
      if (currentMode === 'magazine') {
        if (isPaused) stopMagAuto(); else startMagAuto();
      }
    }
    function setSpeed(mult, btn) {
      currentSpeed = mult;
      const base = 50 / mult;
      const rowBase = 40 / mult;
      document.documentElement.style.setProperty('--scroll-duration', base + 's');
      document.documentElement.style.setProperty('--row-duration', rowBase + 's');
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      // 杂志速度
      magInterval = Math.round(4000 / mult);
      if (currentMode === 'magazine' && !isPaused) { stopMagAuto(); startMagAuto(); }
    }

    // ====== 音乐 ======
    function toggleMusic() {
      const bgm = document.getElementById('bgm');
      const btn = document.getElementById('btnMusic');
      if (musicPlaying) {
        bgm.pause(); btn.classList.remove('active'); btn.textContent = '🎵 音乐';
        stopLyricsPlayer();
      } else {
        bgm.play().catch(()=>{}); btn.classList.add('active'); btn.textContent = '🎵 播放中';
        startLyricsPlayer();
      }
      musicPlaying = !musicPlaying;
    }

    // === Lyrics Player ===
    let lyricsPlayerTimer = null;
    let lyricsLineIdx = 0;
    let lyricsCharIdx = 0;
    let currentSongLyrics = [];
    let currentSongOffset = 0;

    function startLyricsPlayer() {
      // Find first song with lyrics
      const songs = WEDDING._songs || [];
      const songWithLyrics = songs.find(s => s.lyrics && s.lyrics.length > 0);
      if (!songWithLyrics) return;
      currentSongLyrics = songWithLyrics.lyrics;
      currentSongOffset = songWithLyrics.lyrics_offset || 0;
      // Set avatars
      if (AVATARS[0]) document.getElementById('lyrics-avatar-1').src = AVATARS[0];
      if (AVATARS[1]) document.getElementById('lyrics-avatar-2').src = AVATARS[1] || AVATARS[0];
      document.getElementById('lyrics-song-info').textContent = songWithLyrics.song_name + (songWithLyrics.artist ? ' · ' + songWithLyrics.artist : '');
      document.getElementById('lyrics-player').classList.add('active');
      lyricsLineIdx = 0; lyricsCharIdx = 0;
      typeLyricsChar();
    }

    function stopLyricsPlayer() {
      clearTimeout(lyricsPlayerTimer);
      document.getElementById('lyrics-player').classList.remove('active');
    }

    function typeLyricsChar() {
      if (!currentSongLyrics || lyricsLineIdx >= currentSongLyrics.length) {
        // Song finished, restart
        lyricsLineIdx = 0; lyricsCharIdx = 0;
        lyricsPlayerTimer = setTimeout(typeLyricsChar, 3000);
        return;
      }
      const line = currentSongLyrics[lyricsLineIdx];
      const text = line.text || '';
      const singer = line.singer || 'partner1';
      const display = document.getElementById('lyrics-display');
      const av1 = document.getElementById('lyrics-avatar-1');
      const av2 = document.getElementById('lyrics-avatar-2');

      // Update singer avatar
      if (singer === 'partner1') {
        av1.classList.add('active'); av2.classList.remove('active');
      } else {
        av1.classList.remove('active'); av2.classList.add('active');
      }

      if (lyricsCharIdx === 0) {
        display.innerHTML = '<span class="cursor"></span>';
        // Spawn music notes
        spawnNote();
      }

      if (lyricsCharIdx < text.length) {
        const charSpan = document.createElement('span');
        charSpan.className = 'char';
        charSpan.textContent = text[lyricsCharIdx];
        const cursor = display.querySelector('.cursor');
        if (cursor) display.insertBefore(charSpan, cursor);
        requestAnimationFrame(() => charSpan.classList.add('visible'));
        lyricsCharIdx++;
        lyricsPlayerTimer = setTimeout(typeLyricsChar, Math.max(60, 120));
      } else {
        const cursor = display.querySelector('.cursor');
        if (cursor) cursor.remove();
        lyricsLineIdx++; lyricsCharIdx = 0;
        const delay = Math.max(1500, (line.duration || 3000));
        lyricsPlayerTimer = setTimeout(() => {
          display.style.transition = 'opacity 0.3s'; display.style.opacity = '0';
          setTimeout(() => { display.style.opacity = '1'; typeLyricsChar(); }, 350);
        }, delay);
      }
    }

    function spawnNote() {
      const player = document.getElementById('lyrics-player');
      const notes = ['♪', '♫', '♬', '♩'];
      const note = document.createElement('span');
      note.className = 'lyrics-note';
      note.textContent = notes[Math.floor(Math.random() * notes.length)];
      note.style.left = (20 + Math.random() * 60) + '%';
      note.style.bottom = '100%';
      note.style.color = '#b8860b';
      player.appendChild(note);
      setTimeout(() => note.remove(), 1500);
    }

    // ====== 致谢 ======
    function showCredits() { document.getElementById('credits-overlay').classList.add('show'); }
    function hideCredits() { document.getElementById('credits-overlay').classList.remove('show'); }

    // ====== 粒子 ======
    function initParticles() {
      const c = document.getElementById('particles');
      for (let i = 0; i < 15; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const size = 2 + Math.random() * 4;
        p.style.cssText = 'width:'+size+'px;height:'+size+'px;left:'+Math.random()*100+'%;animation-duration:'+(8+Math.random()*12)+'s;animation-delay:'+Math.random()*10+'s';
        c.appendChild(p);
      }
    }

    // ====== 控制栏热区 ======
    const hotzone = document.getElementById('hotzone');
    document.addEventListener('mousemove', e => {
      const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
      if (e.clientY < 60) {
        hotzone.classList.add('visible');
        const controls = document.getElementById('controls-bar');
        controls.classList.add('show');
        if (isFS) { controls.style.opacity = '1'; controls.style.transform = 'translateY(0)'; }
      } else if (isFS && e.clientY > 100) {
        const controls = document.getElementById('controls-bar');
        controls.classList.remove('show');
        controls.style.opacity = '0';
        controls.style.transform = 'translateY(-100%)';
      }
    });
    document.addEventListener('touchstart', e => { if (e.touches[0].clientY < 40) { hotzone.classList.add('visible'); document.getElementById('controls-bar').classList.add('show'); setTimeout(()=>hotzone.classList.remove('visible'),2000); } }, {passive:true});

    // Double-click fullscreen
    let lastTap = 0;
    document.addEventListener('dblclick', e => {
      if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select') || e.target.closest('textarea')) return;
      toggleFullscreen();
    });
    // Mobile double-tap
    document.addEventListener('touchend', e => {
      if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return;
      const now = Date.now();
      if (now - lastTap < 300) { toggleFullscreen(); }
      lastTap = now;
    }, {passive:true});

    function toggleFullscreen() {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen).call(document.documentElement);
      } else {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      }
    }

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);

    function onFullscreenChange() {
      const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
      const controls = document.getElementById('controls-bar');
      const hint = document.getElementById('fullscreen-hint');
      if (isFS) {
        // Auto-hide controls in fullscreen
        controls.classList.remove('show');
        controls.style.transition = 'opacity 0.4s, transform 0.4s';
        controls.style.opacity = '0';
        controls.style.transform = 'translateY(-100%)';
        // Show hint briefly
        hint.textContent = '🖱️ 移到顶部显示控制栏 · 双击退出全屏';
        hint.classList.add('show');
        setTimeout(() => hint.classList.remove('show'), 3000);
      } else {
        controls.style.opacity = '';
        controls.style.transform = '';
        controls.classList.add('show');
      }
    }

    // Show fullscreen hint on first enter
    let hintShown = false;
    function showFullscreenHint() {
      if (hintShown) return;
      hintShown = true;
      const hint = document.getElementById('fullscreen-hint');
      hint.textContent = '💡 双击屏幕可进入全屏';
      hint.classList.add('show');
      setTimeout(() => hint.classList.remove('show'), 4000);
    }

    // Show hint after entering gallery
    const origShowGallery = showGallery;
    showGallery = function() {
      origShowGallery();
      setTimeout(showFullscreenHint, 1500);
    };

    init();
  </script>
</body>
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
