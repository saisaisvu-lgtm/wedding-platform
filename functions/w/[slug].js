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

    /* ====== Invitation Card - Cute Style ====== */
    #invite-overlay{position:fixed;inset:0;z-index:160;display:none;align-items:center;justify-content:center;background:linear-gradient(135deg,rgba(255,228,225,0.95),rgba(255,218,220,0.95));backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);padding:20px;opacity:0;transition:opacity 0.5s}
    #invite-overlay.show{display:flex;opacity:1}
    .invite-card{width:360px;max-width:90vw;background:linear-gradient(160deg,#fff5f5 0%,#ffe8ec 40%,#ffd6dc 100%);border-radius:20px;position:relative;overflow:hidden;box-shadow:0 12px 48px rgba(196,30,58,0.15),0 0 0 3px rgba(255,182,193,0.5)}
    .invite-card::before{content:'';position:absolute;top:-30px;right:-30px;width:120px;height:120px;background:radial-gradient(circle,rgba(255,182,193,0.3) 0%,transparent 70%);pointer-events:none}
    .invite-card::after{content:'';position:absolute;bottom:-20px;left:-20px;width:100px;height:100px;background:radial-gradient(circle,rgba(255,218,220,0.4) 0%,transparent 70%);pointer-events:none}
    .invite-card .ic-border{position:absolute;top:10px;left:10px;right:10px;bottom:10px;border:2px dashed rgba(255,150,170,0.4);border-radius:16px;pointer-events:none;z-index:2}
    .invite-card .ic-content{position:relative;z-index:3;padding:32px 24px;display:flex;flex-direction:column;align-items:center;text-align:center}
    .invite-card .ic-xi{font-family:'Ma Shan Zheng',cursive,serif;font-size:42px;color:#e74c7b;text-shadow:0 2px 8px rgba(231,76,123,0.2);margin-bottom:4px}
    .invite-card .ic-title{font-family:'ZCOOL KuaiLe',cursive,sans-serif;font-size:13px;color:#e74c7b;letter-spacing:0.4em;margin-bottom:14px}
    .invite-card .ic-divider{width:40%;height:2px;background:linear-gradient(90deg,transparent,#ffb6c1,transparent);margin-bottom:14px;border-radius:1px}
    .invite-card .ic-avatars{display:flex;align-items:center;gap:12px;margin-bottom:12px}
    .invite-card .ic-avatar{width:68px;height:68px;border-radius:50%;object-fit:cover;border:3px solid #ffb6c1;background:#fff0f3;box-shadow:0 4px 12px rgba(255,182,193,0.4)}
    .invite-card .ic-heart{font-size:24px;color:#e74c7b;animation:heartBeat 1.2s ease-in-out infinite}
    @keyframes heartBeat{0%,100%{transform:scale(1)}15%{transform:scale(1.3)}30%{transform:scale(1)}}
    .invite-card .ic-names{font-family:'Ma Shan Zheng',cursive,serif;font-size:22px;color:#d4547a;letter-spacing:0.2em;margin-bottom:2px}
    .invite-card .ic-names-en{font-size:10px;color:rgba(212,84,122,0.5);letter-spacing:0.1em;margin-bottom:14px;text-transform:uppercase}
    .invite-card .ic-date-box{background:rgba(255,255,255,0.5);border:1px solid rgba(255,182,193,0.4);border-radius:12px;padding:10px 24px;margin-bottom:12px}
    .invite-card .ic-date{font-family:'ZCOOL KuaiLe',cursive,sans-serif;font-size:15px;color:#d4547a;letter-spacing:0.15em}
    .invite-card .ic-date-sub{font-size:10px;color:rgba(212,84,122,0.5);margin-top:3px}
    .invite-card .ic-info{font-size:12px;color:rgba(212,84,122,0.6);line-height:1.8;letter-spacing:0.05em;margin-bottom:12px}
    .invite-card .ic-thanks{font-family:'Ma Shan Zheng',cursive,serif;font-size:14px;color:#d4547a;line-height:2;letter-spacing:0.08em;margin-bottom:14px;opacity:0.8}
    .invite-card .ic-qr{text-align:center;margin-bottom:10px}
    .invite-card .ic-qr canvas,.invite-card .ic-qr svg{border-radius:8px}
    .invite-card .ic-qr-tip{font-size:10px;color:rgba(212,84,122,0.4);margin-top:4px}
    .invite-card .ic-deco{position:absolute;font-size:20px;pointer-events:none;opacity:0.6}
    .invite-card .ic-deco-1{top:15px;left:20px}
    .invite-card .ic-deco-2{top:15px;right:20px}
    .invite-card .ic-deco-3{bottom:15px;left:20px}
    .invite-card .ic-deco-4{bottom:15px;right:20px}
    .invite-card .ic-bottom{margin-top:6px}
    .invite-card .ic-bottom-xi{font-family:'Ma Shan Zheng',cursive,serif;font-size:18px;color:rgba(231,76,123,0.3)}
    .invite-card .ic-bottom-text{font-size:10px;color:rgba(212,84,122,0.3);letter-spacing:0.12em;margin-top:2px}
    .invite-actions{display:flex;gap:12px;margin-top:16px;flex-wrap:wrap;justify-content:center}
    .invite-actions button{padding:12px 28px;border-radius:25px;font-size:14px;cursor:pointer;transition:all 0.3s;font-family:inherit;letter-spacing:0.1em}
    .btn-invite-save{background:rgba(231,76,123,0.15);border:1.5px solid rgba(231,76,123,0.4);color:#d4547a}
    .btn-invite-save:active{transform:scale(0.96)}
    .btn-invite-enter{background:linear-gradient(135deg,#e74c7b,#d4547a);border:none;color:#fff;font-weight:500}
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
  <!-- Invitation Card -->
  <div id="invite-overlay">
    <div style="display:flex;flex-direction:column;align-items:center;">
      <div class="invite-card" id="invite-card">
        <div class="ic-border"></div>
        <div class="ic-deco ic-deco-1">🌸</div>
        <div class="ic-deco ic-deco-2">💖</div>
        <div class="ic-deco ic-deco-3">💕</div>
        <div class="ic-deco ic-deco-4">🌸</div>
        <div class="ic-content">
          <div class="ic-xi">囍</div>
          <div class="ic-title">婚 礼 请 帖</div>
          <div class="ic-divider"></div>
          <div class="ic-avatars" id="ic-avatars"></div>
          <div class="ic-names" id="ic-names"></div>
          <div class="ic-names-en" id="ic-names-en"></div>
          <div class="ic-date-box">
            <div class="ic-date" id="ic-date"></div>
            <div class="ic-date-sub" id="ic-date-sub"></div>
          </div>
          <div class="ic-info" id="ic-info"></div>
          <div class="ic-thanks">诚挚邀请您出席我们的婚礼<br>见证我们人生中最重要的时刻</div>
          <div class="ic-qr" id="ic-qr"></div>
          <div class="ic-qr-tip">扫码查看婚礼现场</div>
          <div id="ic-participation-box" style="display:none;margin-top:12px;text-align:center;">
            <div style="font-size:10px;color:rgba(212,175,55,0.5);letter-spacing:0.08em;">参与码</div>
            <div id="ic-participation-code" style="font-family:monospace;font-size:18px;color:#d4af37;letter-spacing:0.2em;margin-top:4px;"></div>
            <div style="font-size:9px;color:rgba(212,175,55,0.35);margin-top:3px;">请截图保存，用于后续活动参与</div>
          </div>
          <div class="ic-bottom">
            <div class="ic-bottom-xi">囍</div>
            <div class="ic-bottom-text">永结同心 · 百年好合</div>
          </div>
        </div>
      </div>
      <div class="invite-actions">
        <button class="btn-invite-save" onclick="saveInvite()">💾 保存请帖</button>
        <button class="btn-invite-enter" onclick="enterFromInvite()">进入婚礼现场 →</button>
      </div>
      <div style="text-align:center;margin-top:10px;font-size:11px;color:rgba(212,175,55,0.5);letter-spacing:0.05em;">💡 请保存请帖截图，参与码可用于后续抽奖活动</div>
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
    async function init() {
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
          const d = new Date(WEDDING.wedding_date + 'T00:00:00');
          document.getElementById('cd-date-label').textContent = '距离婚礼 · ' + WEDDING.wedding_date;
          const dp = WEDDING.wedding_date.split('-');
          document.getElementById('save-date-num').textContent = dp[0] + '.' + dp[1] + '.' + dp[2];
          const target = new Date(WEDDING.wedding_date + 'T11:58:00').getTime();
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
        document.getElementById('rsvp-screen').classList.remove('hidden');
      }, 600);
    }
    function showInviteCard() {
      document.getElementById('rsvp-screen').classList.add('hidden');
      // Populate invite card
      const avDiv = document.getElementById('ic-avatars');
      avDiv.innerHTML = '';
      if (AVATARS[0]) {
        const img1 = document.createElement('img'); img1.className = 'ic-avatar'; img1.src = AVATARS[0]; img1.alt = ''; avDiv.appendChild(img1);
      }
      if (AVATARS.length > 1) {
        const heart = document.createElement('span'); heart.className = 'ic-heart'; heart.textContent = '♥'; avDiv.appendChild(heart);
      }
      if (AVATARS[1] || AVATARS[0]) {
        const img2 = document.createElement('img'); img2.className = 'ic-avatar'; img2.src = AVATARS[1] || AVATARS[0]; img2.alt = ''; avDiv.appendChild(img2);
      }
      document.getElementById('ic-names').textContent = WEDDING.couple_name;
      document.getElementById('ic-names-en').textContent = WEDDING.couple_name.toUpperCase();
      if (WEDDING.wedding_date) {
        const d = new Date(WEDDING.wedding_date + 'T00:00:00');
        document.getElementById('ic-date').textContent = d.getFullYear() + '年' + (d.getMonth()+1) + '月' + d.getDate() + '日';
        const days = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
        document.getElementById('ic-date-sub').textContent = days[d.getDay()];
      }
      const infoArr = [];
      if (WEDDING.wedding_venue) infoArr.push('婚礼地点：' + WEDDING.wedding_venue);
      document.getElementById('ic-info').innerHTML = infoArr.join('<br>');
      // Generate QR code
      generateInviteQR();
      // Show overlay
      document.getElementById('invite-overlay').classList.add('show');
    }

    function generateInviteQR() {
      const box = document.getElementById('ic-qr');
      box.innerHTML = '';
      try {
        if (typeof qrcode === 'function') {
          const qr = qrcode(0, 'M');
          qr.addData(location.href); qr.make();
          const svg = qr.createSvgTag({ cellSize: 3, margin: 0 });
          box.innerHTML = svg;
          // 设置金色主题
          const svgEl = box.querySelector('svg');
          if (svgEl) {
            const rects = svgEl.querySelectorAll('rect');
            rects.forEach(r => {
              const fill = r.getAttribute('fill');
              if (fill === '#000000' || fill === '#000' || fill === 'black') {
                r.setAttribute('fill', '#d4af37');
              } else if (fill === '#ffffff' || fill === '#fff' || fill === 'white' || !fill || fill === 'none') {
                r.setAttribute('fill', 'transparent');
              }
            });
            svgEl.style.background = 'transparent';
          }
        }
      } catch (e) {}
    }

    window.saveInvite = function() {
      const card = document.getElementById('invite-card');
      if (typeof html2canvas !== 'function') { alert('保存功能加载中'); return; }
      html2canvas(card, { backgroundColor: '#5B0000', scale: 2, useCORS: true }).then(canvas => {
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
          // 显示参与码
          if (data.participation_code) {
            document.getElementById('ic-participation-box').style.display = 'block';
            document.getElementById('ic-participation-code').textContent = data.participation_code;
          }
          setTimeout(showInviteCard, 1200);
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
