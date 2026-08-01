(function () {
  'use strict';

  var canvas = document.getElementById('soulx-canvas');
  var ctx = canvas.getContext('2d', { alpha: true });
  var statusOverlay = document.getElementById('status-overlay');
  var statusText = document.getElementById('status-text');
  var controlPanel = document.getElementById('control-panel');
  var subtitleContainer = document.getElementById('subtitle-container');

  var ttsWs = null;
  var flashheadWs = null;
  var audioCtx = null;
  var isLocked = false;
  var isHidden = false;
  var isReady = false;
  var isConnecting = false;
  var windowClosing = false;
  var reconnectTimer = null;

  var flashheadUrl = 'ws://127.0.0.1:8765';
  var condImageB64 = '';
  var soulxImages = [];
  var soulxImagesDir = '';
  var selectedImageId = '';
  var condImageSrc = '';
  var transparentBg = true;
  var frameFormat = 'image/jpeg';

  // ---- 视频帧渲染 ----
  var targetFps = 25;
  var frameQueue = [];
  var lastFrameTime = 0;
  var frameInterval = 1000 / 25;
  var animFrameId = null;
  var expectedWidth = 512;
  var expectedHeight = 512;
  var condImageDrawn = false;
  var condImageEl = null;   // 缓存的参考图片 Image 元素
  var showingCond = false;  // 当前是否正在显示参考图
  var renderLoopStarted = false;

  // ---- 音画同步状态 ----
  // 音频立即调度播放，帧异步到达入队。渲染循环以音频时钟为基准展示帧。
  var chunkAudioSamples = 15360;
  var samplesSent = 0;
  var samplesProcessed = 0;
  var sessionStarted = false;
  var decodedAudioQueue = [];
  var frameGeneration = 0;
  var framesShown = 0;
  var framesShownTotal = 0;
  var audioChain = Promise.resolve();
  var sendChain = Promise.resolve();  // 发送独立链，不阻塞解码
  var pendingSends = 0;    // 尚未真正写入 FlashHead 的音频块数
  var pendingFlush = false; // audioInputComplete 到达时，等发送链排空后再 flush 尾帧
  var holdDrain = false;    // 等待 FlashHead 尾帧(flushed)期间，暂缓排期剩余音频
  var holdDrainTimer = null;
  var sessionEnded = false; // 本次会话播放已结束，丢弃迟到的补零/尾帧
  var nextPlayTime = 0;
  var audioClockStart = 0;
  var scheduledDuration = 0;
  var ttsSessionId = 0;
  var processedChunks = new Set();
  var sessionChunkStamp = 0;   // 随 ttsStarted 递增，跨会话去重隔离
  var nextExpectedChunkIdx = 0;  // 排序缓冲：期望的下一个 chunkIndex
  var chunkSortBuffer = {};      // 排序缓冲：暂存乱序到达的 chunk { chunkIndex: { audioBytes, subtitleText } }
  var activeSources = [];
  var MAX_INFLIGHT_CHUNKS = 12;
  var subtitleTimer = null;
  var isSubtitleEnabled = true;
  var pttVisible = false;
  var textInputVisible = false;
  var pttWs = null;
  var mediaRecorder = null;
  var pttRecording = false;

  setStatus('正在加载配置...');

  Promise.all([fetchSoulxConfig(), fetchSoulxImages()]).then(function (results) {
    var data = results[0];
    var imgData = results[1] || {};
    var cfg = data.SoulxConfig || data || {};
    flashheadUrl = cfg.serverUrl || flashheadUrl;
    condImageB64 = cfg.condImage || '';
    transparentBg = cfg.transparentBg !== false;
    soulxImages = imgData.images || [];
    soulxImagesDir = imgData.dir || '';
    selectedImageId = cfg.selectedImageId || '';

    var selected = null;
    for (var i = 0; i < soulxImages.length; i++) {
      if (soulxImages[i].id === selectedImageId) { selected = soulxImages[i]; break; }
    }
    if (!selected && soulxImages.length > 0) {
      selected = soulxImages[0];
      selectedImageId = selected.id;
    }

    if (selected) {
      condImageSrc = selected.url;
    } else if (condImageB64) {
      condImageSrc = 'data:image/png;base64,' + condImageB64;
    }
    if (!condImageSrc) {
      setError('未配置参考图片，请在主界面设置中上传一张人物照片');
      return;
    }

    // 一律转 base64 发送，跨平台无需担心路径或网络权限
    var resolvedUrl = condImageSrc;
    if (!/^https?:\/\//i.test(resolvedUrl) && !/^data:/i.test(resolvedUrl)) {
      resolvedUrl = location.origin + resolvedUrl;
    }
    fetch(resolvedUrl).then(function (r) { return r.blob(); }).then(function (blob) {
      var reader = new FileReader();
      reader.onload = function () {
        condImageB64 = String(reader.result).split(',')[1] || '';
        // 预载参考图片，用于空闲时显示
        condImageEl = new Image();
        condImageEl.onload = function () { condImageEl._loaded = true; };
        condImageEl.src = resolvedUrl;
        if (/^data:/i.test(resolvedUrl)) condImageEl._loaded = true;
        startRenderLoop();
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (!transparentBg) drawCondImage();
        connectFlashHead();
        connectTTS();
      };
      reader.readAsDataURL(blob);
    }).catch(function (err) {
      setError('读取参考图片失败: ' + err.message);
    });
  }).catch(function (err) {
    setError('加载配置失败: ' + err.message);
  });

  function fetchSoulxConfig() {
    var protocol = location.protocol;
    return fetch(protocol + '//' + location.host + '/soulx_config')
      .then(function (r) { return r.json(); })
      .catch(function () {
        return fetch(protocol + '//' + location.host + '/api/soulx_config')
          .then(function (r) { return r.json(); });
      });
  }

  function fetchSoulxImages() {
    return fetch(location.protocol + '//' + location.host + '/get_soulx_images')
      .then(function (r) { return r.json(); })
      .catch(function () { return { success: false, images: [], dir: '' }; });
  }

  function drawCondImage() {
    if (!condImageSrc || condImageDrawn) return;
    var img = new Image();
    img.onload = function () {
      if (!isReady) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        expectedWidth = img.naturalWidth;
        expectedHeight = img.naturalHeight;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      condImageDrawn = true;
    };
    img.src = condImageSrc;
  }

  // ==================== FlashHead 连接 ====================

  function connectFlashHead() {
    if (isConnecting || windowClosing) return;
    if (flashheadWs && (flashheadWs.readyState === WebSocket.OPEN || flashheadWs.readyState === WebSocket.CONNECTING)) return;
    isConnecting = true;

    var wsUrl = flashheadUrl.replace(/^http/, 'ws');
    if (wsUrl.indexOf('://') === -1) {
      wsUrl = 'ws://' + wsUrl;
    }
    if (wsUrl.indexOf('/ws/stream') === -1) {
      wsUrl = wsUrl.replace(/\/$/, '') + '/ws/stream';
    }

    setStatus('正在连接 FlashHead 服务...');

    try {
      flashheadWs = new WebSocket(wsUrl);
    } catch (e) {
      isConnecting = false;
      scheduleReconnect();
      return;
    }
    flashheadWs.binaryType = 'arraybuffer';

    flashheadWs.onopen = function () {
      var initMsg = {
        type: 'init',
        cond_image: condImageB64,
        base_seed: 42,
        use_face_crop: false,
        transparent_bg: transparentBg
      };
      flashheadWs.send(JSON.stringify(initMsg));
      setStatus('正在初始化模型...');
    };

    flashheadWs.onmessage = function (event) {
      if (typeof event.data === 'string') {
        var msg = JSON.parse(event.data);
        switch (msg.type) {
          case 'ready':
            targetFps = msg.tgt_fps || 25;
            frameInterval = 1000 / targetFps;
            chunkAudioSamples = msg.chunk_audio_samples || 15360;
            expectedWidth = msg.width || 512;
            expectedHeight = msg.height || 512;
            canvas.width = expectedWidth * srScale();
            canvas.height = expectedHeight * srScale();
            samplesSent = 0;
            samplesProcessed = 0;
            framesShownTotal = 0;
            isReady = true;
            isConnecting = false;
            if (msg.cond_preview) {
              condImageSrc = 'data:image/png;base64,' + msg.cond_preview;
              // 更新缓存的参考图为 matted 版本（透明背景）
              condImageEl = new Image();
              condImageEl.onload = function () { condImageEl._loaded = true; };
              condImageEl.src = condImageSrc;
              condImageEl._loaded = true; // data: URL 同步可用
              showingCond = false;
            }
            condImageDrawn = false;
            drawCondImage();
            hideOverlay();
            // 本地路径模式：直接传文件路径，WSL2 后端自动转换为 /mnt/... 路径
            break;
          case 'frames_meta':
            if (msg.width && msg.height && (msg.width !== canvas.width || msg.height !== canvas.height)) {
              canvas.width = msg.width;
              canvas.height = msg.height;
            }
            if (msg.fmt) frameFormat = 'image/' + msg.fmt;
            samplesProcessed = (msg.chunk_idx + 1) * chunkAudioSamples;
            if (!sessionStarted) {
              startSessionAudio();
            }
            break;
          case 'flushed':
            // FlashHead 已补零生成尾部尾帧，解除暂缓，排期剩余音频
            if (holdDrain) {
              holdDrain = false;
              clearTimeout(holdDrainTimer);
              drainDecodedAudio();
              // 若音频此刻已播完（没有可排期的尾部音频），
              // 直接丢弃这些补零尾帧，避免回图后再闪一下
              if (audioClockStart === 0 && scheduledDuration === 0) {
                sessionEnded = true;
                clearFrameQueue();
              }
            }
            break;
          case 'cleared':
          case 'finished':
          case 'reset_ok':
            break;
          case 'error':
            setError('FlashHead 错误: ' + (msg.message || '未知错误'));
            break;
        }
      } else {
        handleFlashheadFrames(event.data);
      }
    };

    flashheadWs.onclose = function () {
      isReady = false;
      isConnecting = false;
      flashheadWs = null;
      if (!windowClosing) {
        setStatus('FlashHead 连接已断开，正在重连...');
        scheduleReconnect();
      }
    };

    flashheadWs.onerror = function () {
      isConnecting = false;
    };
  }

  function scheduleReconnect() {
    if (windowClosing) return;
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(function () {
      connectFlashHead();
    }, 2000);
  }

  var frameDecodeChain = Promise.resolve();

  // ==================== Anime4K 超分（WebGPU，可选开关） ====================
  var SR = {
    device: null, adapter: null, pipe: null, inTex: null,
    inCanvas: null, outCanvas: null, blitObj: null, Klass: null,
    enabled: false, ready: false, inited: false, W: 0, H: 0,

    init: async function () {
      if (this.inited) return this.ready;
      this.inited = true;
      try {
        var mod = await import('/libs/anime4k-sr.bundle.js');
        this.Klass = mod.CNNx2VL;
        if (navigator.gpu) {
          this.adapter = await navigator.gpu.requestAdapter();
          this.device = await this.adapter.requestDevice();
          this.ready = !!(this.Klass && this.device);
        }
      } catch (e) {
        console.warn('[SR] init fail:', e);
        this.ready = false;
      }
      return this.ready;
    },

    _setup: function (w, h) {
      this.W = w; this.H = h;
      var usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT;
      this.inTex = this.device.createTexture({ size: [w, h], format: 'rgba8unorm', usage });
      this.pipe = new this.Klass({ device: this.device, inputTexture: this.inTex });
      this.inCanvas = { gpu: new OffscreenCanvas(w * 2, h * 2) };
      this.inCanvas.ctx = this.inCanvas.gpu.getContext('webgpu');
      this.inCanvas.fmt = navigator.gpu.getPreferredCanvasFormat();
      this.inCanvas.ctx.configure({ device: this.device, format: this.inCanvas.fmt, alphaMode: 'premultiplied' });
      this.blitObj = this._buildBlit();
      this.outCanvas = { c2d: new OffscreenCanvas(w * 2, h * 2) };
      this.outCanvas.ctx = this.outCanvas.c2d.getContext('2d', { willReadFrequently: true });
    },

    upscale: async function (bitmap, w, h, hasAlpha) {
      if (!this.ready) return bitmap;
      try {
        if (!this.inCanvas || this.W !== w || this.H !== h) this._setup(w, h);
        this.device.queue.copyExternalImageToTexture(
          { source: bitmap, origin: [0, 0] },
          { texture: this.inTex, origin: [0, 0] },
          [w, h]
        );
        var e = this.device.createCommandEncoder();
        this.pipe.pass(e);
        this.device.queue.submit([e.finish()]);
        this._blit(this.pipe.getOutputTexture());
        await this.device.queue.onSubmittedWorkDone();
        var octx = this.outCanvas.ctx;
        octx.globalCompositeOperation = 'source-over';
        octx.clearRect(0, 0, w * 2, h * 2);
        octx.drawImage(this.inCanvas.gpu, 0, 0);
        if (hasAlpha) {
          octx.globalCompositeOperation = 'destination-in';
          octx.drawImage(bitmap, 0, 0, w * 2, h * 2);
          octx.globalCompositeOperation = 'source-over';
        }
        return createImageBitmap(this.outCanvas.c2d);
      } catch (e) {
        console.warn('[SR] upscale fail:', e);
        return bitmap;
      }
    },

    _buildBlit: function () {
      var code = `
        @group(0) @binding(0) var samp: sampler;
        @group(0) @binding(1) var tex: texture_2d<f32>;
        struct VO { @builtin(position) pos: vec4f, @location(0) uv: vec2f };
        @vertex fn vs(@builtin(vertex_index) i: u32) -> VO {
          var p = array<vec2f,6>(vec2f(-1,-1),vec2f(1,-1),vec2f(-1,1),vec2f(-1,1),vec2f(1,-1),vec2f(1,1));
          var o: VO; o.pos = vec4f(p[i],0,1); o.uv = vec2f((p[i].x+1)/2,(1-p[i].y)/2); return o;
        }
        @fragment fn fs(@location(0) uv: vec2f) -> @location(0) vec4f { return textureSample(tex, samp, uv); }`;
      var shader = this.device.createShaderModule({ code: code });
      var pipeline = this.device.createRenderPipeline({
        layout: 'auto',
        vertex: { module: shader, entryPoint: 'vs' },
        fragment: { module: shader, entryPoint: 'fs', targets: [{ format: this.inCanvas.fmt }] },
        primitive: { topology: 'triangle-list' }
      });
      return { pipeline: pipeline, sampler: this.device.createSampler({ magFilter: 'linear', minFilter: 'linear' }) };
    },

    _blit: function (tex) {
      var bg = this.device.createBindGroup({
        layout: this.blitObj.pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: this.blitObj.sampler },
          { binding: 1, resource: tex.createView() }
        ]
      });
      var enc = this.device.createCommandEncoder();
      var pass = enc.beginRenderPass({
        colorAttachments: [{
          view: this.inCanvas.ctx.getCurrentTexture().createView(),
          loadOp: 'clear', storeOp: 'store', clearValue: { r: 0, g: 0, b: 0, a: 0 }
        }]
      });
      pass.setPipeline(this.blitObj.pipeline);
      pass.setBindGroup(0, bg);
      pass.draw(6);
      pass.end();
      this.device.queue.submit([enc.finish()]);
    }
  };

  function srScale() {
    return (SR.enabled && SR.ready) ? 2 : 1;
  }

  // JPEG/WebP 批量格式: [4B count][4B len][frame]...
  function handleFlashheadFrames(buffer) {
    if (!isReady) return;
    var decodeGeneration = frameGeneration;
    var view = new DataView(buffer);
    var count = view.getUint32(0, true);
    var offset = 4;
    var blobs = [];
    for (var i = 0; i < count; i++) {
      var len = view.getUint32(offset, true);
      offset += 4;
      blobs.push(new Blob([new Uint8Array(buffer, offset, len)], { type: frameFormat }));
      offset += len;
    }
    frameDecodeChain = frameDecodeChain.then(async function () {
      var bitmaps = await Promise.all(blobs.map(function (b) {
        return createImageBitmap(b).catch(function () { return null; });
      }));
      if (decodeGeneration !== frameGeneration) {
        bitmaps.forEach(function (bm) { if (bm) bm.close(); });
        return;
      }
      for (var i = 0; i < bitmaps.length; i++) {
        var bm = bitmaps[i];
        if (!bm) continue;
        if (sessionEnded) { bm.close(); continue; }
        frameQueue.push(bm);
      }
      // 帧到达时排出队列中所有已解码的音频，首次整批排，后续增量排。
      // 等待 FlashHead 尾帧(flushed)期间暂缓排期，保证尾部音频有帧可播。
      if (!holdDrain) {
        drainDecodedAudio();
      }
    });
  }

  function drainDecodedAudio() {
    if (decodedAudioQueue.length === 0) return;
    if (!sessionStarted) {
      flushAudioQueue();
    } else {
      while (decodedAudioQueue.length > 0) {
        var entry = decodedAudioQueue.shift();
        scheduleChunk(entry.buffer, entry.text, ttsSessionId);
      }
    }
  }

  function startRenderLoop() {
    if (renderLoopStarted) return;
    renderLoopStarted = true;
    lastFrameTime = performance.now();
    var samplesPerFrame = 16000 / targetFps;

    function tick(ts) {
      // 音频驱动模式下：根据已播放音频位置决定应显示第几帧
      if (audioClockStart > 0 && scheduledDuration > 0) {
        showingCond = false;
        var elapsed = audioCtx.currentTime - audioClockStart;
        if (elapsed < 0) elapsed = 0;
        if (elapsed > scheduledDuration) {
          // 音频播完，切回回退模式继续消费队列中的尾帧
          audioClockStart = 0;
          scheduledDuration = 0;
          lastFrameTime = performance.now();
          if (!holdDrain) {
            // 丢弃补零/迟到的尾帧，直接过渡到静态图，避免回图后“再闪一下”
            sessionEnded = true;
            clearFrameQueue();
          }
        } else {
          var targetFrame = Math.floor(elapsed * 16000 / samplesPerFrame);
          while (framesShown < targetFrame && frameQueue.length > 0) {
            var f = frameQueue.shift();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(f, 0, 0, canvas.width, canvas.height);
            f.close();
            framesShown++;
            framesShownTotal++;
          }
        }
      } else {
        // 无音频时的回退：按目标帧率消费帧（等待尾帧期间暂停消费）
        var dt = ts - lastFrameTime;
        if (dt >= frameInterval && frameQueue.length > 0 && !holdDrain) {
          showingCond = false;
          var ff = frameQueue.shift();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(ff, 0, 0, canvas.width, canvas.height);
          ff.close();
          framesShown++;
          framesShownTotal++;
          lastFrameTime = ts;
        } else if (frameQueue.length === 0) {
          lastFrameTime = ts;
          // 队列空了，显示参考图片（仅在 FlashHead 就绪后，且不处于等待尾帧状态）
          if (!showingCond && isReady && condImageEl && condImageEl._loaded && !holdDrain) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(condImageEl, 0, 0, canvas.width, canvas.height);
            showingCond = true;
            sessionEnded = true;
          }
        }
      }
      // 安全阀
      var maxBacklog = targetFps * 8;
      while (frameQueue.length > maxBacklog) {
        var fb = frameQueue.shift();
        if (fb) fb.close();
        framesShownTotal++;
      }
      animFrameId = requestAnimationFrame(tick);
    }
    animFrameId = requestAnimationFrame(tick);
  }

  // ==================== TTS 音频通道 ====================

  function connectTTS() {
    var protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    var wsUrl = protocol + '//' + location.host + '/ws/vrm';
    ttsWs = new WebSocket(wsUrl);
    ttsWs.binaryType = 'arraybuffer';

    ttsWs.onmessage = function (event) {
      if (event.data instanceof ArrayBuffer) {
        handleTTSBinary(event.data);
      } else if (typeof event.data === 'string') {
        handleTTSText(event.data);
      }
    };

    ttsWs.onclose = function () {
      setTimeout(function () {
        if (!windowClosing) connectTTS();
      }, 3000);
    };
  }

  function handleTTSBinary(buffer) {
    try {
      var view = new DataView(buffer);
      var jsonLen = view.getUint32(0, true);
      var metaBytes = new Uint8Array(buffer, 4, jsonLen);
      var metadata = JSON.parse(new TextDecoder().decode(metaBytes));
      var audioBytes = new Uint8Array(buffer, 4 + jsonLen);

      if (metadata.type === 'audio_chunk' || metadata.type === 'omni_chunk') {
        if (metadata.chunkIndex !== undefined) {
          var chunkKey = sessionChunkStamp + '_' + metadata.chunkIndex;
          if (processedChunks.has(chunkKey)) return;
          processedChunks.add(chunkKey);
          var subtitleText = (metadata.type === 'audio_chunk') ? (metadata.text || '') : '';
          var chunkIdx = metadata.chunkIndex;
          if (chunkIdx === nextExpectedChunkIdx) {
            enqueueAudio(audioBytes.slice(), subtitleText);
            nextExpectedChunkIdx++;
            while (chunkSortBuffer[nextExpectedChunkIdx]) {
              var entry = chunkSortBuffer[nextExpectedChunkIdx];
              delete chunkSortBuffer[nextExpectedChunkIdx];
              enqueueAudio(entry.audioBytes, entry.subtitleText);
              nextExpectedChunkIdx++;
            }
          } else if (chunkIdx > nextExpectedChunkIdx) {
            chunkSortBuffer[chunkIdx] = { audioBytes: audioBytes.slice(), subtitleText: subtitleText };
          }
        } else {
          enqueueAudio(audioBytes, '');
        }
      }
    } catch (e) {}
  }

  // 串行链：解码 → 缓冲；发送异步，不阻塞解码。帧到位后才调度播放。
  function enqueueAudio(audioBytes, subtitleText) {
    var sessionId = ttsSessionId;
    pendingSends++;
    audioChain = audioChain.then(function () {
      return new Promise(function (resolve) {
        if (sessionId !== ttsSessionId) { pendingSends--; resolve(); return; }
        if (audioCtx.state === 'suspended') {
          audioCtx.resume().catch(function () {});
        }
        var arrayBuf = audioBytes.buffer.slice(audioBytes.byteOffset, audioBytes.byteOffset + audioBytes.byteLength);
        audioCtx.decodeAudioData(arrayBuf, function (audioBuffer) {
          if (sessionId !== ttsSessionId) { pendingSends--; resolve(); return; }
          decodedAudioQueue.push({ buffer: audioBuffer, text: subtitleText });
          resolve();
          var float32Data = resampleToFloat32Sync(audioBuffer, 16000);
          if (!float32Data || float32Data.length === 0) { pendingSends--; return; }
          sendChain = sendChain.then(function () {
            return new Promise(function (sendResolve) {
              paceInFlight(sessionId, function () {
                if (sessionId !== ttsSessionId) { pendingSends--; sendResolve(); return; }
                if (isReady && flashheadWs && flashheadWs.readyState === WebSocket.OPEN) {
                  flashheadWs.send(JSON.stringify({
                    type: 'audio_chunk',
                    audio: arrayBufferToBase64(float32Data.buffer),
                    audio_format: 'float32'
                  }));
                  samplesSent += float32Data.length;
                }
                pendingSends--;
                // audioInputComplete 到达时若还有音频未写完 FlashHead，等全部写完再 flush
                if (pendingFlush && pendingSends <= 0) {
                  pendingFlush = false;
                  sendToFlashhead({ type: 'flush' });
                }
                sendResolve();
              });
            });
          });
        }, function () { pendingSends--; resolve(); });
      });
    });
  }

  // 流控：限制发送领先处理量不超过 4 个 chunk，防止 FlashHead 积压
  function paceInFlight(sessionId, done) {
    var MAX_LEAD_SAMPLES = chunkAudioSamples * 4;
    var sentAhead = samplesSent - samplesProcessed;
    if (sentAhead <= MAX_LEAD_SAMPLES) {
      done();
    } else {
      setTimeout(function () {
        if (sessionId !== ttsSessionId) { done(); return; }
        paceInFlight(sessionId, done);
      }, 50);
    }
  }

  function startSessionAudio() {
  }

  function flushAudioQueue() {
    sessionStarted = true;
    while (decodedAudioQueue.length > 0) {
      var entry = decodedAudioQueue.shift();
      scheduleChunk(entry.buffer, entry.text, ttsSessionId);
    }
  }

  function scheduleChunk(audioBuffer, subtitleText, sessionId) {
    // 有新音频被排期，说明会话仍在播放中
    sessionEnded = false;
    var startTime = Math.max(audioCtx.currentTime + 0.03, nextPlayTime);
    if (!audioClockStart || audioClockStart === 0) {
      audioClockStart = startTime;
      scheduledDuration = 0;
    }
    scheduledDuration += audioBuffer.duration;
    try {
      var source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.onended = function () {
        var idx = activeSources.indexOf(source);
        if (idx !== -1) activeSources.splice(idx, 1);
      };
      activeSources.push(source);
      source.start(startTime);
    } catch (e) {}
    nextPlayTime = startTime + audioBuffer.duration;

    if (subtitleText) {
      var delayMs = Math.max(0, (startTime - audioCtx.currentTime) * 1000);
      setTimeout(function () {
        if (sessionId === ttsSessionId) showSubtitle(subtitleText);
      }, delayMs);
    }
  }

  function stopAllAudio() {
    ttsSessionId++;
    nextPlayTime = 0;
    decodedAudioQueue = [];
    audioClockStart = 0;
    scheduledDuration = 0;
    framesShown = 0;
    clearFrameQueue();
    sendChain = Promise.resolve();
    pendingSends = 0;
    pendingFlush = false;
    holdDrain = false;
    sessionEnded = false;
    clearTimeout(holdDrainTimer);
    for (var i = 0; i < activeSources.length; i++) {
      try { activeSources[i].stop(); } catch (e) {}
    }
    activeSources = [];
  }

  function clearFrameQueue() {
    while (frameQueue.length > 0) {
      var f = frameQueue.shift();
      if (f) f.close();
    }
  }

  function resampleToFloat32Sync(audioBuffer, targetRate) {
    var sourceRate = audioBuffer.sampleRate;
    var sourceData = audioBuffer.getChannelData(0);
    var ratio = sourceRate / targetRate;
    var newLength = Math.round(sourceData.length / ratio);
    var result = new Float32Array(newLength);
    for (var i = 0; i < newLength; i++) {
      var srcIndex = i * ratio;
      var srcFloor = Math.floor(srcIndex);
      var srcCeil = Math.min(srcFloor + 1, sourceData.length - 1);
      var t = srcIndex - srcFloor;
      result[i] = sourceData[srcFloor] * (1 - t) + sourceData[srcCeil] * t;
    }
    return result;
  }

  function handleTTSText(text) {
    try {
      var msg = JSON.parse(text);
      var data = msg.data || {};
      if (msg.type === 'ttsStarted') {
        ttsSessionId++;
        sessionChunkStamp++;
        frameGeneration++;
        nextPlayTime = 0;
        decodedAudioQueue = [];
        audioClockStart = 0;
        scheduledDuration = 0;
        framesShown = 0;
        sessionStarted = false;
        processedChunks.clear();
        nextExpectedChunkIdx = 0;
        chunkSortBuffer = {};
        samplesSent = samplesProcessed;
        pendingSends = 0;
        pendingFlush = false;
        holdDrain = false;
        sessionEnded = false;
        clearTimeout(holdDrainTimer);
        clearFrameQueue();
        lastFrameTime = performance.now();
      } else if (msg.type === 'omniStreaming') {
        if (data.text) showSubtitle(data.text);
      } else if (msg.type === 'audioInputComplete') {
        // 主窗口已把全部音频送出：让 FlashHead 提前补零生成尾帧，
        // 若还有音频未写完 FlashHead，则在发送链排空后再 flush。
        if (pendingSends <= 0) {
          sendToFlashhead({ type: 'flush' });
        } else {
          pendingFlush = true;
        }
        // 等待 FlashHead 尾帧(flushed)期间暂缓排期剩余音频，保证尾部有帧可播
        holdDrain = true;
        clearTimeout(holdDrainTimer);
        holdDrainTimer = setTimeout(function () {
          if (holdDrain) {
            holdDrain = false;
            drainDecodedAudio();
          }
        }, 2000);
      } else if (msg.type === 'allChunksCompleted') {
        hideSubtitle();
        // 让 FlashHead 把剩余不足一个 chunk 的尾部音频补零生成尾帧，避免结尾画面定格
        sendToFlashhead({ type: 'flush' });
      } else if (msg.type === 'stopSpeaking') {
        hideSubtitle();
        stopAllAudio();
        sessionStarted = false;
        processedChunks.clear();
        nextExpectedChunkIdx = 0;
        chunkSortBuffer = {};
        sendToFlashhead({ type: 'clear' });
        samplesSent = framesShownTotal * (16000 / targetFps);
      }
    } catch (e) {}
  }

  function sendToFlashhead(obj) {
    if (flashheadWs && flashheadWs.readyState === WebSocket.OPEN && isReady) {
      flashheadWs.send(JSON.stringify(obj));
    }
  }

  function showSubtitle(text) {
    subtitleContainer.textContent = text;
    subtitleContainer.style.opacity = '1';
    clearTimeout(subtitleTimer);
    subtitleTimer = setTimeout(hideSubtitle, 4000);
  }

  function hideSubtitle() {
    subtitleContainer.style.opacity = '0';
  }

  function arrayBufferToBase64(buffer) {
    var bytes = new Uint8Array(buffer);
    var binary = '';
    var chunk = 8192;
    for (var i = 0; i < bytes.byteLength; i += chunk) {
      var end = Math.min(i + chunk, bytes.byteLength);
      for (var j = i; j < end; j++) {
        binary += String.fromCharCode(bytes[j]);
      }
    }
    return btoa(binary);
  }

  // ==================== 状态提示 ====================

  function setStatus(text) {
    statusText.textContent = text;
    statusOverlay.style.display = 'flex';
    var errEl = document.getElementById('error-overlay');
    if (errEl) errEl.remove();
  }

  function setError(text) {
    hideOverlay();
    var existing = document.getElementById('error-overlay');
    if (existing) existing.remove();
    var el = document.createElement('div');
    el.id = 'error-overlay';
    el.textContent = text;
    el.onclick = function () { el.remove(); };
    document.body.appendChild(el);
  }

  function hideOverlay() {
    statusOverlay.style.display = 'none';
  }

  // DOM
  var lockBtn = document.getElementById('lock-btn');
  var hideBtn = document.getElementById('hide-btn');
  var voiceBtn = document.getElementById('voice-btn');
  var textBtn = document.getElementById('text-btn');
  var subtitleBtn = document.getElementById('subtitle-btn');
  var refreshBtn = document.getElementById('refresh-btn');
  var closeBtn = document.getElementById('close-btn');
  var pttBtn = document.getElementById('ptt-floating-btn');
  var textContainer = document.getElementById('text-input-container');
  var textField = document.getElementById('text-input-field');
  var sendBtn = document.getElementById('text-send-btn');

  // ==================== 控制面板（鼠标移动显示，静止后自动隐藏，与 THA 一致） ====================
  var isPanelHovered = false;
  var hideTimeout = null;

  function showPanel() {
    clearTimeout(hideTimeout);
    controlPanel.classList.remove('hidden');
    controlPanel.style.opacity = '1';
    controlPanel.style.transform = 'translateX(0)';
  }
  function hidePanel() {
    if (!isPanelHovered) {
      controlPanel.classList.add('hidden');
      controlPanel.style.opacity = '0';
      controlPanel.style.transform = 'translateX(20px)';
    }
  }
  function scheduleHide() {
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(hidePanel, isLocked ? 200 : 1200);
  }
  document.body.addEventListener('mouseenter', function () { showPanel(); });
  document.body.addEventListener('mousemove', function () { showPanel(); scheduleHide(); });
  document.body.addEventListener('mouseleave', function () { if (!isPanelHovered) scheduleHide(); });
  document.body.addEventListener('touchstart', function (e) {
    if (!controlPanel.contains(e.target)) { showPanel(); scheduleHide(); }
  }, { passive: true });
  controlPanel.addEventListener('mouseenter', function () {
    isPanelHovered = true; clearTimeout(hideTimeout); showPanel();
    if (isLocked && window.electronAPI) window.electronAPI.setIgnoreMouseEvents(false);
  });
  controlPanel.addEventListener('mouseleave', function () {
    isPanelHovered = false; scheduleHide();
    if (isLocked && window.electronAPI) window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
  });
  scheduleHide();

  function bindTapEvent(element, callback) {
    if (!element) return;
    element.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); callback(e);
    });
  }

  // --- 锁定穿透 ---
  bindTapEvent(lockBtn, function () {
    isLocked = !isLocked;
    var icon = lockBtn.querySelector('i');
    if (isLocked) {
      icon.className = 'fas fa-lock';
      lockBtn.style.color = '#dc3545';
      if (window.electronAPI) window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
      controlPanel.querySelectorAll('.ctrl-btn').forEach(function (b) { if (b !== lockBtn) b.style.display = 'none'; });
    } else {
      icon.className = 'fas fa-lock-open';
      lockBtn.style.color = '#333';
      if (window.electronAPI) window.electronAPI.setIgnoreMouseEvents(false);
      controlPanel.querySelectorAll('.ctrl-btn').forEach(function (b) { b.style.display = 'flex'; });
    }
  });

  // --- 隐藏画面 ---
  bindTapEvent(hideBtn, function () {
    isHidden = !isHidden;
    var icon = hideBtn.querySelector('i');
    if (isHidden) {
      icon.className = 'fas fa-eye-slash';
      hideBtn.style.color = '#ffc107';
      canvas.style.opacity = '0';
    } else {
      icon.className = 'fas fa-eye';
      hideBtn.style.color = '#333';
      canvas.style.opacity = '1';
    }
  });

  // --- 语音输入（PTT） ---
  bindTapEvent(voiceBtn, function () {
    pttVisible = !pttVisible;
    var icon = voiceBtn.querySelector('i');
    if (pttVisible) {
      pttBtn.classList.add('visible');
      icon.style.color = '#ff6b35';
    } else {
      pttBtn.classList.remove('visible');
      pttBtn.classList.remove('recording');
      icon.style.color = '#333';
    }
  });

  // --- 文字输入 ---
  bindTapEvent(textBtn, function () {
    textInputVisible = !textInputVisible;
    var icon = textBtn.querySelector('i');
    if (textInputVisible) {
      textContainer.classList.add('visible');
      textField.focus();
      icon.style.color = '#007bff';
    } else {
      textContainer.classList.remove('visible');
      icon.style.color = '#333';
    }
  });

  // --- 字幕开关 ---
  bindTapEvent(subtitleBtn, function () {
    isSubtitleEnabled = !isSubtitleEnabled;
    subtitleContainer.style.display = isSubtitleEnabled ? 'block' : 'none';
    subtitleBtn.style.color = isSubtitleEnabled ? '#28a745' : '#dc3545';
  });

  // --- 刷新 ---
  bindTapEvent(refreshBtn, function () {
    location.reload();
  });

  // --- 关闭 ---
  bindTapEvent(closeBtn, function () {
    windowClosing = true;
    if (window.electronAPI && window.electronAPI.stopSoulxWindow) {
      window.electronAPI.stopSoulxWindow();
    } else {
      window.close();
    }
  });

  // ==================== PTT 录音 ====================

  function initPttWs() {
    if (pttWs && pttWs.readyState === WebSocket.OPEN) return;
    var protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    pttWs = new WebSocket(protocol + '//' + location.host + '/ws');
    pttWs.onclose = function () { setTimeout(initPttWs, 3000); };
  }

  pttBtn.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    if (pttRecording) return;
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      var chunks = [];
      mediaRecorder.ondataavailable = function (ev) { chunks.push(ev.data); };
      mediaRecorder.onstop = function () {
        stream.getTracks().forEach(function (t) { t.stop(); });
        pttBtn.classList.remove('recording');
        var blob = new Blob(chunks, { type: 'audio/webm' });
        encodeWav(blob).then(function (wav) {
          initPttWs();
          var check = function () {
            if (pttWs && pttWs.readyState === WebSocket.OPEN) {
              pttWs.send(JSON.stringify({ type: 'asr_audio', audio: wav }));
            } else setTimeout(check, 200);
          };
          check();
        });
        pttRecording = false;
      };
      mediaRecorder.start();
      pttBtn.classList.add('recording');
      pttRecording = true;
    }).catch(function () { pttRecording = false; });
  });
  pttBtn.addEventListener('pointerup', function () { if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop(); });
  pttBtn.addEventListener('pointerleave', function () { if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop(); });

  function encodeWav(blob) {
    return blob.arrayBuffer().then(function (ab) {
      var offCtx = new OfflineAudioContext(1, 1, 16000);
      return offCtx.decodeAudioData(ab).then(function (buf) {
        var len = buf.length;
        var wav = new ArrayBuffer(44 + len * 2);
        var v = new DataView(wav);
        var ws = function (o, s) { for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
        ws(0, 'RIFF'); v.setUint32(4, 36 + len * 2, true); ws(8, 'WAVE'); ws(12, 'fmt ');
        v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
        v.setUint32(24, 16000, true); v.setUint32(28, 32000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
        ws(36, 'data'); v.setUint32(40, len * 2, true);
        var ch = buf.getChannelData(0);
        for (var i = 0; i < len; i++) {
          var s = Math.max(-1, Math.min(1, ch[i]));
          v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
        return arrayBufferToBase64(wav);
      });
    });
  }

  // ==================== 文字发送 ====================

  function sendTextMessage() {
    var text = textField.value.trim();
    if (!text) return;
    initPttWs();
    var check = function () {
      if (pttWs && pttWs.readyState === WebSocket.OPEN) {
        pttWs.send(JSON.stringify({ type: 'set_user_input', data: { text: text } }));
        pttWs.send(JSON.stringify({ type: 'trigger_send_message' }));
      } else setTimeout(check, 200);
    };
    check();
    textField.value = '';
  }
  bindTapEvent(sendBtn, sendTextMessage);
  textField.addEventListener('keydown', function (e) { if (e.key === 'Enter') sendTextMessage(); });

  function reconnectFlashhead() {
    if (flashheadWs) {
      flashheadWs.onclose = null;
      try { flashheadWs.close(); } catch (e) {}
      flashheadWs = null;
    }
    isReady = false;
    isConnecting = false;
    clearTimeout(reconnectTimer);
    stopAllAudio();
    sessionStarted = false;
    clearFrameQueue();
    condImageDrawn = false;
    drawCondImage();
    connectFlashHead();
  }

  window.addEventListener('beforeunload', function () {
    windowClosing = true;
    clearTimeout(reconnectTimer);
    if (flashheadWs && flashheadWs.readyState === WebSocket.OPEN) {
      try { flashheadWs.send(JSON.stringify({ type: 'finish' })); } catch (e) {}
      flashheadWs.close();
    }
    if (ttsWs && ttsWs.readyState === WebSocket.OPEN) {
      ttsWs.close();
    }
    if (pttWs && pttWs.readyState === WebSocket.OPEN) {
      pttWs.close();
    }
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
    }
    if (audioCtx) {
      audioCtx.close();
    }
  });
})();
