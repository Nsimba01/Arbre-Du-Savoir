/* =========================================================
   JEU PÉDAGOGIQUE – VERSION FINALE COMPLÈTE
   ========================================================= */

(function() {

    /* ---------------------------------------------------------
       1) Overlay plein écran
       --------------------------------------------------------- */

    const overlay = document.createElement("div");
    overlay.id = "gameOverlay";
    // rendre l'overlay focalisable pour capter la touche Échap
    overlay.tabIndex = -1;
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: #d7bc8e; 
        display: none;
        flex-direction: column;
        font-family: "Comic Sans MS";
        z-index: 9999;
        cursor: default !important;
    `;
    document.body.appendChild(overlay);

    const veil = document.createElement("div");
veil.style.cssText = `
    position:absolute;
    inset:0;
    background:rgba(255,255,255,0.35); /* transparence */
    pointer-events:none; /* ne bloque pas les clics */
`;
overlay.appendChild(veil);

    /* ---------------------------------------------------------
       Bouton Quitter (✖)
       --------------------------------------------------------- */

    const closeButtonStyle = `
        position:absolute;
        top:15px;
        right:15px;
        width:54px;
        height:54px;
        display:flex;
        align-items:center;
        justify-content:center;
        background: linear-gradient(145deg, #ff4b4b, #d82828);
        color:#000;
        border:none;
        border-radius:50%;
        font-size:32px;
        font-weight:700;
        cursor:pointer;
        box-shadow:0 8px 18px rgba(0,0,0,0.28), inset 0 1px 2px rgba(255,255,255,0.35);
        transition:transform 0.2s, box-shadow 0.2s;
    `;

    const restartButtonStyle = `
        width:108px;
        height:108px;
        display:grid;
        place-items:center;
        padding:0;
        background: linear-gradient(135deg, #ffd75f, #ff8a00);
        border:none;
        border-radius:50%;
        font-size:72px;
        line-height:1;
        font-weight:900;
        color:#1f1f1f;
        letter-spacing:-1px;
        cursor:pointer;
        text-align:center;
        text-shadow:0 1px 2px rgba(0,0,0,0.28);
        box-shadow:0 8px 18px rgba(0,0,0,0.24), inset 0 1px 3px rgba(255,255,255,0.45);
        transition: transform 0.2s, box-shadow 0.2s;
    `;

    const exitBtn = document.createElement("button");
    exitBtn.type = "button";
    exitBtn.innerHTML = "✖";
    exitBtn.title = "Fermer";
    exitBtn.style.cssText = closeButtonStyle;
    exitBtn.style.zIndex = "10050";
    exitBtn.onmouseover = () => exitBtn.style.transform = "scale(1.08)";
    exitBtn.onmouseout  = () => exitBtn.style.transform = "scale(1)";
    // append du bouton global déplacé plus bas pour éviter d'être masqué

    /* ---------------------------------------------------------
       2) CONSIGNES
       --------------------------------------------------------- */

    const consignes = document.createElement("div");
    consignes.style.cssText = `
        position:absolute;
        top:50%;
        left:50%;
        transform:translate(-50%, -50%);
        width:75%;
        max-width:950px;
        background: rgb(153,102,51);
        border-radius:25px;
        padding:60px 70px;
        text-align:center;
        box-shadow:0 0 30px rgba(0,0,0,0.45);
        opacity:0;
        color:#000;
        animation: consigneFadeIn 0.8s forwards;
        z-index:10002;
    `;
    consignes.innerHTML = `
        <h2 style="font-size:60px; margin-bottom:45px; color:#000;">Consignes</h2>

        <div id="audioControls"
             style="display:flex; justify-content:center; gap:30px; margin-bottom:40px;">
            <span id="playBtn" class="audio-icon" title="Lire"
                style="font-size:60px; cursor:pointer;">
                🔊
            </span>
        </div>

        <p id="consigneText"
           style="font-size:40px; line-height:1.5; margin-bottom:60px; color:#000;">
            Déplace la souris afin de toucher les ballons.
        </p>

        <button id="okBtn" title="Commencer"
            style="
                display:block;
                margin:0 auto;
                width:120px;
                height:120px;
                line-height:120px;
                font-size:64px;
                font-weight:900;
                background: rgb(51,204,51);
                color:black;
                border:none;
                border-radius:50%;
                cursor:pointer;
                box-shadow:
                    inset 0 0 18px rgba(255,255,255,0.45),
                    0 0 22px rgba(0,0,0,0.55);
                transition:transform 0.2s;
            ">
            ✓
        </button>
    `;
    // Bouton de fermeture rapide dans la fenêtre des consignes
    const consigneClose = document.createElement("button");
    consigneClose.type = "button";
    consigneClose.innerHTML = "✖";
    consigneClose.title = "Fermer";
    consigneClose.style.cssText = closeButtonStyle;
    consigneClose.style.zIndex = "10003";
    consigneClose.onmouseover = () => consigneClose.style.transform = "scale(1.08)";
    consigneClose.onmouseout  = () => consigneClose.style.transform = "scale(1)";
    consignes.appendChild(consigneClose);

    consigneClose.addEventListener("click", () => {
        // fermer uniquement la fenêtre des consignes et démarrer la sortie du jeu
        quitGame();
    });

    overlay.appendChild(consignes);

    // Attacher le bouton global après la fenêtre des consignes
    exitBtn.style.zIndex = "10050";
    exitBtn.style.pointerEvents = "auto";
    overlay.appendChild(exitBtn);

    const okBtn = consignes.querySelector("#okBtn");
    if (okBtn) {
        okBtn.type = "button";
        okBtn.onmouseover = () => okBtn.style.transform = "scale(1.08)";
        okBtn.onmouseout = () => okBtn.style.transform = "scale(1)";
    }

    /* ---------------------------------------------------------
       Animations CSS
       --------------------------------------------------------- */

    const animStyle = document.createElement("style");
    animStyle.textContent = `
        @keyframes consigneFadeIn {
            0% { opacity:0; transform:translate(-50%, -60%); }
            100% { opacity:1; transform:translate(-50%, -50%); }
        }
        @keyframes countdownPop {
            0% { transform:scale(0.2); opacity:0; }
            60% { transform:scale(1.3); opacity:1; }
            100% { transform:scale(1); opacity:1; }
        }
        @keyframes magicPulse {
            0% { box-shadow:0 0 15px rgba(255,255,255,0.4); }
            50% { box-shadow:0 0 35px rgba(255,255,255,0.8); }
            100% { box-shadow:0 0 15px rgba(255,255,255,0.4); }
        }

        @keyframes shatterPiece {
            0% {
                transform: translate(0, 0) rotate(0deg) scale(1);
                opacity: 1;
            }
            100% {
                transform: translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(0.2);
                opacity: 0;
            }
        }

        /* Style du bouton de fermeture dans les consignes */
        .consigne-close { display:none; }

        /* Réduire la taille des gros boutons sur petits écrans */
        @media (max-width:600px) {
            button[title="Quitter"] {
                width:44px !important;
                height:44px !important;
                font-size:24px !important;
            }
            button[title="Recommencer"] {
                width:60px !important;
                height:60px !important;
                font-size:28px !important;
            }
            /* Ajuste le padding des consignes pour petits écrans */
            div[style*="max-width:950px"] {
                width:90% !important;
                padding:30px 20px !important;
            }
        }
    `;
    document.head.appendChild(animStyle);

    /* ---------------------------------------------------------
       3) HUD + zone de jeu
       --------------------------------------------------------- */

    const hud = document.createElement("div");
    hud.style.cssText = `
        position:absolute;
        top:10px;
        left:10px;
        right:10px;
        display:none;
        justify-content:center;
        font-size:34px;
        font-weight:bold;
        color:#000;
        text-shadow:none;
    `;
    hud.innerHTML = `
        <span id="triesLabel" style="position:absolute; left:10px;">Reste : 10</span>
        <span id="timerLabel">Temps : 0 s</span>
    `;
    overlay.appendChild(hud);

    const gameArea = document.createElement("div");
    gameArea.style.cssText = `
        position:relative;
        flex:1;
        overflow:hidden;
        cursor:default !important;
    `;
    overlay.appendChild(gameArea);

    /* ---------------------------------------------------------
       4) Compte à rebours
       --------------------------------------------------------- */

    const countdown = document.createElement("div");
    countdown.style.cssText = `
        position:absolute;
        inset:0;
        display:none;
        align-items:center;
        justify-content:center;
        font-size:120px;
        font-weight:bold;
        color:#000;
        text-shadow:none;
        animation:countdownPop 0.6s;
    `;
    overlay.appendChild(countdown);

    /* ---------------------------------------------------------
       5) Bouton Recommencer
       --------------------------------------------------------- */

    const restartBtn = document.createElement("button");
    restartBtn.innerHTML = "⟲";
    restartBtn.title = "Recommencer";
    restartBtn.style.cssText = restartButtonStyle + `
        position:absolute;
        bottom:20px;
        right:20px;
        display:none;
        z-index:10001;
    `;
    restartBtn.onmouseover = () => restartBtn.style.transform = "scale(1.1)";
    restartBtn.onmouseout  = () => restartBtn.style.transform = "scale(1)";
    overlay.appendChild(restartBtn);

    restartBtn.addEventListener("click", () => {
        resetGame();
        startGame();
    });

    /* ---------------------------------------------------------
       6) Écran de fin
       --------------------------------------------------------- */

    const endMessage = document.createElement("div");
    endMessage.style.cssText = `
        position:absolute;
        inset:0;
        display:none;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        font-size:40px;
        color:#fff;
        background:rgba(0,0,0,0.6);
        text-align:center;
        padding:20px;
    `;
    overlay.appendChild(endMessage);

    const trophyImage = document.createElement("img");
    trophyImage.style.cssText = `
        width:260px;
        max-width:80%;
        height:auto;
        margin-bottom:20px;
        object-fit:contain;
    `;
    trophyImage.alt = "Trophée";
    endMessage.appendChild(trophyImage);

    const recordText = document.createElement("div");
    recordText.style.cssText = `
        font-size:36px;
        margin-top:20px;
        font-weight:bold;
        color:#000;
    `;
    endMessage.appendChild(recordText);

    const endButtons = document.createElement("div");
    endButtons.style.cssText = `
        margin-top:30px;
        display:flex;
        gap:30px;
        justify-content:center;
        align-items:center;
    `;
    endMessage.appendChild(endButtons);

    const endQuitBtn = document.createElement("button");
    endQuitBtn.type = "button";
    endQuitBtn.innerHTML = "✓";
    endQuitBtn.title = "Quitter";
    endQuitBtn.style.cssText = `
        width:108px;
        height:108px;
        display:grid;
        place-items:center;
        padding:0;
        background: rgb(51,204,51);
        border:none;
        border-radius:50%;
        font-size:72px;
        line-height:1;
        font-weight:900;
        color:black;
        letter-spacing:-1px;
        cursor:pointer;
        text-align:center;
        box-shadow:0 8px 18px rgba(0,0,0,0.24), inset 0 1px 3px rgba(255,255,255,0.45);
        transition: transform 0.2s, box-shadow 0.2s;
        z-index:10050;
    `;

    const endRestartBtn = document.createElement("button");
    endRestartBtn.innerHTML = "⟲";
    endRestartBtn.title = "Recommencer";
    endRestartBtn.style.cssText = restartButtonStyle;
    endRestartBtn.onmouseover = () => endRestartBtn.style.transform = "scale(1.1)";
    endRestartBtn.onmouseout  = () => endRestartBtn.style.transform = "scale(1)";
    endButtons.appendChild(endRestartBtn);

    endQuitBtn.onmouseover = () => endQuitBtn.style.transform = "scale(1.08)";
    endQuitBtn.onmouseout  = () => endQuitBtn.style.transform = "scale(1)";
    endButtons.appendChild(endQuitBtn);
    
    endQuitBtn.addEventListener("click", quitGame);
    endRestartBtn.addEventListener("click", () => {
        resetGame();
        startGame();
    });

    /* ---------------------------------------------------------
       7) Lancement via #start-btn
       --------------------------------------------------------- */

    const startBtn = document.getElementById("start-btn");

    if (startBtn) {
        startBtn.addEventListener("click", () => {
            overlay.style.display = "flex";
            // cacher le bouton global pendant l'affichage des consignes
            exitBtn.style.display = "none";
            // focuser l'overlay pour recevoir les événements clavier
            try { overlay.focus(); } catch (e) {}
            if (overlay.requestFullscreen) overlay.requestFullscreen();

            consignes.style.display = "block";
            consignes.style.animation = "none";
            void consignes.offsetWidth;
            consignes.style.animation = "consigneFadeIn 0.8s forwards";
            // (ré)attacher les handlers clavier/fullscreen au démarrage
            try { document.addEventListener("keydown", handleKeydown, true); } catch (e) {}
            try { window.addEventListener("keydown", handleKeydown, true); } catch (e) {}
            try { window.addEventListener("keyup", handleKeyup, true); } catch (e) {}
            try { document.addEventListener("fullscreenchange", handleFullscreenChange); } catch (e) {}
        });
    }

    /* ---------------------------------------------------------
       8) Quitter (Échap + bouton + sortie plein écran)
       --------------------------------------------------------- */

    function quitGame() {

        // stopper synthèse vocale si en cours
        try { speechSynthesis.cancel(); } catch (e) {}
        isPlaying = false;
        if (utterance) { try { utterance.onend = null; } catch (e) {} utterance = null; }

        // stopper les sons
        try { hitSound.pause(); hitSound.currentTime = 0; } catch (e) {}

        // annuler timers
        clearInterval(timerInterval);
        timerInterval = null;
        if (countdownTimeout) { clearTimeout(countdownTimeout); countdownTimeout = null; }

        gameArea.removeEventListener("mousemove", onMouseMove);

        consignes.style.display = "none";
        hud.style.display = "none";
        endMessage.style.display = "none";
        countdown.style.display = "none";
        restartBtn.style.display = "none";
        exitBtn.style.display = "none";

        removeBalloon();

        if (document.fullscreenElement) {
            document.exitFullscreen();
        }

        overlay.style.display = "none";

        gameRunning = false;
        tries = 10;
        timer = 0;

        // retirer écouteurs globaux
        try { document.removeEventListener("keydown", handleKeydown, true); } catch (e) {}
        try { window.removeEventListener("keydown", handleKeydown, true); } catch (e) {}
        try { window.removeEventListener("keyup", handleKeyup, true); } catch (e) {}
        try { document.removeEventListener("fullscreenchange", handleFullscreenChange); } catch (e) {}
    }

    exitBtn.addEventListener("click", quitGame);

    // Handlers nommés pour permettre leur suppression lors de la fermeture
    function handleKeydown(e) {
        console.debug("handleKeydown:", e.key, e.keyCode);
        if (e.key === "Escape" || e.key === "Esc" || e.keyCode === 27) {
            quitGame();
        }
    }

    function handleKeyup(e) {
        console.debug("handleKeyup:", e.key, e.keyCode);
        if (e.key === "Escape" || e.key === "Esc" || e.keyCode === 27) {
            quitGame();
        }
    }

    function handleFullscreenChange() {
        console.debug("fullscreenchange, fullscreenElement=", !!document.fullscreenElement);
        if (!document.fullscreenElement) quitGame();
    }

    document.addEventListener("keydown", handleKeydown, true);
    // backup: écouter aussi sur la window pour s'assurer de capter Échap
    window.addEventListener("keydown", handleKeydown, true);
    // écouter aussi keyup en capture
    window.addEventListener("keyup", handleKeyup, true);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    /* ---------------------------------------------------------
       9) Synthèse vocale
       --------------------------------------------------------- */

    const audioControls = consignes.querySelector("#audioControls");
    const consigneText = consignes.querySelector("#consigneText");

    let utterance = null;
    let isPlaying = false;

    function restorePlayButton() {
        audioControls.innerHTML = `
            <span id="playBtn" class="audio-icon" title="Lire" style="font-size:60px; cursor:pointer;">
                🔊
            </span>
        `;
        consignes.querySelector("#playBtn").addEventListener("click", handlePlayClick);
    }

    function createPauseStopButtons() {
        audioControls.innerHTML = `
            <span id="pauseBtn" class="audio-icon" title="Pause" style="font-size:60px; cursor:pointer;">⏸</span>
            <span id="stopBtn" class="audio-icon" title="Stop" style="font-size:60px; cursor:pointer;">⏹</span>
        `;

        consignes.querySelector("#pauseBtn").addEventListener("click", () => {
            if (isPlaying) {
                speechSynthesis.pause();
                isPlaying = false;
            } else {
                speechSynthesis.resume();
                isPlaying = true;
            }
        });

        consignes.querySelector("#stopBtn").addEventListener("click", () => {
            speechSynthesis.cancel();
            isPlaying = false;
            restorePlayButton();
        });
    }

    function handlePlayClick() {
        speechSynthesis.cancel();
        utterance = new SpeechSynthesisUtterance(consigneText.textContent);
        utterance.lang = "fr-FR";
        isPlaying = true;
        speechSynthesis.speak(utterance);
        createPauseStopButtons();

        utterance.onend = () => {
            isPlaying = false;
            restorePlayButton();
        };
    }

    consignes.querySelector("#playBtn").addEventListener("click", handlePlayClick);

    /* ---------------------------------------------------------
       10) Logique du jeu + compte à rebours
       --------------------------------------------------------- */

    let tries = 10;
    let timer = 0;
    let timerInterval = null;
    let countdownTimeout = null;
    let currentBalloon = null;
    let gameRunning = false;

    // Chargement résilient du son de hit : on teste plusieurs chemins possibles
    const hitSound = new Audio();
    let hitSoundAvailable = false;
    (function probeHitSound() {
        const candidates = [
            "medias/fiche_001/jeu/hit.mp3",
            "medias/fiche_001/sons/hit.mp3",
            "medias/fiche_001/sons/japplique.m4a",
            "medias/fiche_001/sons/japprends.m4a",
            "medias/fiche_001/sons/jeretiens.m4a"
        ];

        function tryNext(i) {
            if (i >= candidates.length) return;
            const url = candidates[i];
            fetch(url, { method: 'HEAD' }).then(res => {
                if (res.ok) {
                    hitSound.src = url;
                    hitSoundAvailable = true;
                } else {
                    tryNext(i + 1);
                }
            }).catch(() => tryNext(i + 1));
        }

        tryNext(0);
    })();

    consignes.addEventListener("click", e => {
        if (e.target && e.target.id === "okBtn") {
            consignes.style.display = "none";
            // afficher le bouton global identique au X des consignes
            exitBtn.style.display = "block";
            launchCountdown();
        }
    });

    function launchCountdown() {
        countdown.style.display = "flex";

        let count = 3;

        function step() {
            countdown.textContent = count;
            countdown.style.animation = "none";
            void countdown.offsetWidth;
            countdown.style.animation = "countdownPop 0.6s";

            if (count === 0) {
                countdown.style.display = "none";
                startGame();
            } else {
                count--;
                countdownTimeout = setTimeout(step, 900);
            }
        }

        step();
    }

    function startGame() {
        gameRunning = true;
        tries = 10;
        timer = 0;

        hud.style.display = "flex";
        hud.querySelector("#triesLabel").textContent = "Reste : 10";
        hud.querySelector("#timerLabel").textContent = "Temps : 0 s";
        endMessage.style.display = "none";

        restartBtn.style.display = "block";

        spawnBalloon();

        timerInterval = setInterval(() => {
            timer++;
            hud.querySelector("#timerLabel").textContent = "Temps : " + timer + " s";
        }, 1000);

        gameArea.addEventListener("mousemove", onMouseMove);
    }

    function endGame() {
        gameRunning = false;
        clearInterval(timerInterval);
        timerInterval = null;
        removeBalloon();
        gameArea.removeEventListener("mousemove", onMouseMove);

        restartBtn.style.display = "none";

        endMessage.style.display = "flex";

        const trophyFile = timer < 10 ? "Trophée - Or.png"
            : timer < 15 ? "Trophée - Argent.png"
            : "Trophée - Bronze.png"

        const trophyDirs = [
            "../../../medias/images/",
            "../../medias/images/",
            "medias/images/"
        ];
        let trophyAttempt = 0;

        trophyImage.onerror = () => {
            trophyAttempt++;
            if (trophyAttempt < trophyDirs.length) {
                trophyImage.src = trophyDirs[trophyAttempt] + trophyFile;
            }
        };
        trophyImage.src = trophyDirs[trophyAttempt] + trophyFile;

        recordText.textContent = "Record : " + timer + " s";
    }

    function resetGame() {
        consignes.style.display = "none";
        hud.style.display = "none";
        endMessage.style.display = "none";
        countdown.style.display = "none";
        clearInterval(timerInterval);
        timerInterval = null;
        removeBalloon();
        gameArea.removeEventListener("mousemove", onMouseMove);
        tries = 10;
        timer = 0;
        if (hud.querySelector("#triesLabel")) {
            hud.querySelector("#triesLabel").textContent = "Reste : 10";
        }
        if (hud.querySelector("#timerLabel")) {
            hud.querySelector("#timerLabel").textContent = "Temps : 0 s";
        }
    }

    /* ---------------------------------------------------------
       11) Ballons améliorés + effet magique
       --------------------------------------------------------- */

    function randomFantasyColor() {
        const colors = [
            "#ff4dd2", "#ff884d", "#4dffb8", "#4dd2ff",
            "#b84dff", "#ff4d4d", "#ffd24d"
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    function spawnBalloon() {
        removeBalloon();

        const balloon = document.createElement("div");

        balloon.style.cssText = `
            position:absolute;
            width:160px;
            height:210px;
            background: ${randomFantasyColor()};
            border-radius:50% 50% 45% 45%;
            border:6px solid #000;
            transform: rotate(${Math.random() * 20 - 10}deg);
        `;

        const areaRect = gameArea.getBoundingClientRect();
        const x = Math.random() * (areaRect.width - 200) + 20;
        const y = Math.random() * (areaRect.height - 250) + 40;

        balloon.style.left = x + "px";
        balloon.style.top = y + "px";

        gameArea.appendChild(balloon);
        currentBalloon = balloon;
    }

    function removeBalloon() {
        if (currentBalloon && currentBalloon.parentNode) {
            currentBalloon.parentNode.removeChild(currentBalloon);
        }
        currentBalloon = null;
    }

    function explodeBalloon(balloon) {
        if (!balloon) return;

        const balloonRect = balloon.getBoundingClientRect();
        const areaRect = gameArea.getBoundingClientRect();
        const pieceCount = 24;

        for (let i = 0; i < pieceCount; i++) {
            const piece = document.createElement("div");
            const size = 8 + Math.random() * 10;
            const angle = Math.random() * Math.PI * 2;
            const distance = 80 + Math.random() * 100;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;
            const rot = Math.random() * 720 - 360;

            piece.style.cssText = `
                position:absolute;
                left:${balloonRect.left - areaRect.left + balloonRect.width / 2 - size / 2}px;
                top:${balloonRect.top - areaRect.top + balloonRect.height / 2 - size / 2}px;
                width:${size}px;
                height:${size}px;
                background:${randomFantasyColor()};
                border-radius:50%;
                pointer-events:none;
                transform: translate(0, 0) rotate(0deg) scale(1);
                opacity:1;
                animation: shatterPiece 0.8s ease-out forwards;
            `;
            piece.style.setProperty("--dx", `${dx}px`);
            piece.style.setProperty("--dy", `${dy}px`);
            piece.style.setProperty("--rot", `${rot}deg`);
            gameArea.appendChild(piece);
            piece.addEventListener("animationend", () => {
                if (piece.parentNode) piece.parentNode.removeChild(piece);
            });
        }

        if (balloon.parentNode) {
            balloon.parentNode.removeChild(balloon);
        }
        if (balloon === currentBalloon) {
            currentBalloon = null;
        }
    }

    function onMouseMove(e) {
        if (!gameRunning || !currentBalloon) return;

        const rect = currentBalloon.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 60) {
            if (hitSoundAvailable && hitSound.src) {
                try { hitSound.currentTime = 0; hitSound.play(); } catch (e) {}
            }

            tries--;
            hud.querySelector("#triesLabel").textContent = "Reste : " + tries;
            explodeBalloon(currentBalloon);

            if (tries <= 0) {
                setTimeout(endGame, 220);
            } else {
                setTimeout(() => {
                    if (gameRunning) spawnBalloon();
                }, 220);
            }
        }
    }
})();
