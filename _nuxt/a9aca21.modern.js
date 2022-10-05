/*! For license information please see LICENSES */
(window.webpackJsonp=window.webpackJsonp||[]).push([[30],{1038:function(e,t,n){"use strict";var r=n(3),o=n(1039).start;r({target:"String",proto:!0,forced:n(1040)},{padStart:function(e){return o(this,e,arguments.length>1?arguments[1]:void 0)}})},1039:function(e,t,n){var r=n(6),o=n(66),d=n(34),c=n(425),h=n(50),l=r(c),v=r("".slice),m=Math.ceil,f=function(e){return function(t,n,r){var c,f,y=d(h(t)),w=o(n),E=y.length,_=void 0===r?" ":d(r);return w<=E||""==_?y:((f=l(_,m((c=w-E)/_.length))).length>c&&(f=v(f,0,c)),e?y+f:f+y)}};e.exports={start:f(!1),end:f(!0)}},1040:function(e,t,n){var r=n(95);e.exports=/Version\/10(?:\.\d+){1,2}(?: [\w./]+)?(?: Mobile\/\w+)? Safari\//.test(r)},619:function(e,t,n){"use strict";var r=n(172),o=n(636);t.a=e=>Object(r.a)({type:"minLength",min:e},(t=>!Object(o.c)(t)||Object(o.a)(t)>=e))},620:function(e,t,n){"use strict";var r=n(172),o=n(636);t.a=e=>Object(r.a)({type:"maxLength",max:e},(t=>!Object(o.c)(t)||Object(o.a)(t)<=e))},621:function(e,t,n){"use strict";var r=n(663),o=n.n(r);t.a={bind(e,t,n){"TEXTAREA"===e.tagName&&n.context.$nextTick((()=>{o()(e)}))},componentUpdated(e,t,n){"TEXTAREA"===e.tagName&&n.context.$nextTick((()=>{o.a.update(e)}))},unbind(e){o.a.destroy(e)}}},641:function(e,t,n){"use strict";n(4);var r=n(172),o=n(636);t.a=e=>Object(r.a)({type:"minValue",min:e},(t=>!Object(o.c)(t)||(!/\s/.test(t)||t instanceof Date)&&+t>=+e))},647:function(e,t,n){"use strict";n.d(t,"a",(function(){return o}));n(108),n(107),n(22);var r={};var o={name:"InlineSvg",inheritAttrs:!1,render(e){return this.svgElSource?e("svg",{on:this.$listeners,attrs:Object.assign(this.getSvgAttrs(this.svgElSource),(t=this.$attrs,Object.keys(t).reduce(((e,n)=>(!1!==t[n]&&null!==t[n]&&void 0!==t[n]&&(e[n]=t[n]),e)),{}))),domProps:{innerHTML:this.getSvgContent(this.svgElSource)}}):null;var t},props:{src:{type:String,required:!0},title:{type:String},transformSource:{type:Function,default:svg=>svg},keepDuringLoading:{type:Boolean,default:!0}},data:()=>({svgElSource:null}),watch:{src(e){this.getSource(e)}},mounted(){this.getSource(this.src)},methods:{getSvgAttrs(e){var t={},n=e.attributes;if(!n)return t;for(var i=n.length-1;i>=0;i--)t[n[i].name]=n[i].value;return t},getSvgContent(e){return e=e.cloneNode(!0),e=this.transformSource(e),this.title&&function(svg,title){var e=svg.getElementsByTagName("title");if(e.length)e[0].textContent=title;else{var t=document.createElementNS("http://www.w3.org/2000/svg","title");t.textContent=title,svg.appendChild(t)}}(e,this.title),e.innerHTML},getSource(e){r[e]||(r[e]=this.download(e)),this.svgElSource&&r[e].isPending()&&!this.keepDuringLoading&&(this.svgElSource=null,this.$emit("unloaded")),r[e].then((svg=>{this.svgElSource=svg,this.$nextTick((()=>{this.$emit("loaded",this.$el)}))})).catch((t=>{this.svgElSource&&(this.svgElSource=null,this.$emit("unloaded")),delete r[e],this.$emit("error",t)}))},download:e=>function(e){if(e.isPending)return e;var t=!0,n=e.then((e=>(t=!1,e)),(e=>{throw t=!1,e}));return n.isPending=function(){return t},n}(new Promise(((t,n)=>{var r=new XMLHttpRequest;r.open("GET",e,!0),r.onload=()=>{if(r.status>=200&&r.status<400)try{var e=(new DOMParser).parseFromString(r.responseText,"text/xml").getElementsByTagName("svg")[0];e?t(e):n(new Error('Loaded file is not valid SVG"'))}catch(e){n(e)}else n(new Error("Error loading SVG"))},r.onerror=n,r.send()})))}}},651:function(e,t,n){"use strict";function r(e){var t=document.createElement("textarea");t.value=e,t.setAttribute("readonly",""),t.style.position="absolute",t.style.left="-9999px",document.body.appendChild(t);var n=document.getSelection(),r=n.rangeCount>0&&n.getRangeAt(0);t.select(),t.selectionStart=0,t.selectionEnd=e.length;var o=document.execCommand("copy");return document.body.removeChild(t),r&&(n.removeAllRanges(),n.addRange(r)),o}function o(){return"undefined"!=typeof document&&"function"==typeof document.queryCommandSupported&&document.queryCommandSupported("copy")}n.d(t,"a",(function(){return r})),n.d(t,"b",(function(){return o}))},659:function(e,t,n){"use strict";n.d(t,"a",(function(){return r}));n(22),n(696),n(4),n(9),n(13),n(702),n(412);class r{static hasCamera(){return navigator.mediaDevices?navigator.mediaDevices.enumerateDevices().then((e=>e.some((e=>"videoinput"===e.kind)))).catch((()=>!1)):Promise.reject(!1)}constructor(video,e){var t=arguments.length>2&&void 0!==arguments[2]?arguments[2]:r.DEFAULT_CANVAS_SIZE;this.$video=video,this.$canvas=document.createElement("canvas"),this._onDecode=e,this._active=!1,this._paused=!1,this.$canvas.width=t,this.$canvas.height=t,this._sourceRect={x:0,y:0,width:t,height:t},this._onCanPlay=this._onCanPlay.bind(this),this._onPlay=this._onPlay.bind(this),this._onVisibilityChange=this._onVisibilityChange.bind(this),this.$video.addEventListener("canplay",this._onCanPlay),this.$video.addEventListener("play",this._onPlay),document.addEventListener("visibilitychange",this._onVisibilityChange),this._qrWorker=new Worker(r.WORKER_PATH)}destroy(){this.$video.removeEventListener("canplay",this._onCanPlay),this.$video.removeEventListener("play",this._onPlay),document.removeEventListener("visibilitychange",this._onVisibilityChange),this.stop(),this._qrWorker.postMessage({type:"close"})}start(){if(this._active&&!this._paused)return Promise.resolve();if("https:"!==window.location.protocol&&console.warn("The camera stream is only accessible if the page is transferred via https."),this._active=!0,this._paused=!1,document.hidden)return Promise.resolve();if(clearTimeout(this._offTimeout),this._offTimeout=null,this.$video.srcObject)return this.$video.play(),Promise.resolve();var e="environment";return this._getCameraStream("environment",!0).catch((()=>(e="user",this._getCameraStream()))).then((t=>{this._isUserFacing(t)&&(e="user"),this.$video.srcObject=t,this._setVideoMirror(e)})).catch((e=>{throw this._active=!1,e}))}stop(){this.pause(),this._active=!1}pause(){this._paused=!0,this._active&&(this.$video.pause(),this._offTimeout||(this._offTimeout=setTimeout((()=>{var track=this.$video.srcObject&&this.$video.srcObject.getTracks()[0];track&&(track.stop(),this.$video.srcObject=null,this._offTimeout=null)}),300)))}static scanImage(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:null,canvas=arguments.length>3&&void 0!==arguments[3]?arguments[3]:null,o=arguments.length>4&&void 0!==arguments[4]&&arguments[4],d=arguments.length>5&&void 0!==arguments[5]&&arguments[5],c=!1,h=new Promise(((d,h)=>{var l,v,m;n||(n=new Worker(r.WORKER_PATH),c=!0,n.postMessage({type:"inversionMode",data:"both"})),v=e=>{"qrResult"===e.data.type&&(n.removeEventListener("message",v),n.removeEventListener("error",m),clearTimeout(l),null!==e.data.data?d(e.data.data):h("QR code not found."))},m=e=>{n.removeEventListener("message",v),n.removeEventListener("error",m),clearTimeout(l);var t=e?e.message||e:"Unknown Error";h("Scanner error: "+t)},n.addEventListener("message",v),n.addEventListener("error",m),l=setTimeout((()=>m("timeout")),3e3),r._loadImage(e).then((image=>{var e=r._getImageData(image,t,canvas,o);n.postMessage({type:"decode",data:e},[e.data.buffer])})).catch(m)}));return t&&d&&(h=h.catch((()=>r.scanImage(e,null,n,canvas,o)))),h=h.finally((()=>{c&&n.postMessage({type:"close"})}))}setGrayscaleWeights(e,t,n){var r=!(arguments.length>3&&void 0!==arguments[3])||arguments[3];this._qrWorker.postMessage({type:"grayscaleWeights",data:{red:e,green:t,blue:n,useIntegerApproximation:r}})}setInversionMode(e){this._qrWorker.postMessage({type:"inversionMode",data:e})}_onCanPlay(){this._updateSourceRect(),this.$video.play()}_onPlay(){this._updateSourceRect(),this._scanFrame()}_onVisibilityChange(){document.hidden?this.pause():this._active&&this.start()}_updateSourceRect(){var e=Math.min(this.$video.videoWidth,this.$video.videoHeight),t=Math.round(2/3*e);this._sourceRect.width=this._sourceRect.height=t,this._sourceRect.x=(this.$video.videoWidth-t)/2,this._sourceRect.y=(this.$video.videoHeight-t)/2}_scanFrame(){if(!this._active||this.$video.paused||this.$video.ended)return!1;requestAnimationFrame((()=>{this.$video.readyState<=1?this._scanFrame():r.scanImage(this.$video,this._sourceRect,this._qrWorker,this.$canvas,!0).then(this._onDecode,(e=>{this._active&&"QR code not found."!==e&&console.error(e)})).then((()=>this._scanFrame()))}))}_getCameraStream(e){var t=[{width:{min:1024}},{width:{min:768}},{}];return e&&(arguments.length>1&&void 0!==arguments[1]&&arguments[1]&&(e={exact:e}),t.forEach((t=>t.facingMode=e))),this._getMatchingCameraStream(t)}_getMatchingCameraStream(e){return 0===e.length?Promise.reject("Camera not found."):navigator.mediaDevices.getUserMedia({video:e.shift()}).catch((()=>this._getMatchingCameraStream(e)))}_setVideoMirror(e){var t="user"===e?-1:1;this.$video.style.transform="scaleX("+t+")"}_isUserFacing(e){return/front|user|face/i.test(e.getVideoTracks()[0].label)}static _getImageData(image){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,canvas=arguments.length>2&&void 0!==arguments[2]?arguments[2]:null,t=arguments.length>3&&void 0!==arguments[3]&&arguments[3];canvas=canvas||document.createElement("canvas");var n=e&&e.x?e.x:0,r=e&&e.y?e.y:0,o=e&&e.width?e.width:image.width||image.videoWidth,d=e&&e.height?e.height:image.height||image.videoHeight;t||canvas.width===o&&canvas.height===d||(canvas.width=o,canvas.height=d);var c=canvas.getContext("2d",{alpha:!1});return c.imageSmoothingEnabled=!1,c.drawImage(image,n,r,o,d,0,0,canvas.width,canvas.height),c.getImageData(0,0,canvas.width,canvas.height)}static _loadImage(e){if(e instanceof HTMLCanvasElement||e instanceof HTMLVideoElement||window.ImageBitmap&&e instanceof window.ImageBitmap||window.OffscreenCanvas&&e instanceof window.OffscreenCanvas)return Promise.resolve(e);if(e instanceof Image)return r._awaitImageLoad(e).then((()=>e));if(e instanceof File||e instanceof URL||"string"==typeof e){var image=new Image;return e instanceof File?image.src=URL.createObjectURL(e):image.src=e,r._awaitImageLoad(image).then((()=>(e instanceof File&&URL.revokeObjectURL(image.src),image)))}return Promise.reject("Unsupported image type.")}static _awaitImageLoad(image){return new Promise(((e,t)=>{var n,r;image.complete&&0!==image.naturalWidth?e():(n=()=>{image.removeEventListener("load",n),image.removeEventListener("error",r),e()},r=()=>{image.removeEventListener("load",n),image.removeEventListener("error",r),t("Image load error")},image.addEventListener("load",n),image.addEventListener("error",r))}))}}r.DEFAULT_CANVAS_SIZE=400,r.WORKER_PATH="qr-scanner-worker.min.js"},660:function(e,t,n){"use strict";t.a=n.p+"6b7d1afd4fb85864e691672bb54a14d3.js"},663:function(e,t,n){var r,o,d;o=[e,t],r=function(e,t){"use strict";var n,r,map="function"==typeof Map?new Map:(n=[],r=[],{has:function(e){return n.indexOf(e)>-1},get:function(e){return r[n.indexOf(e)]},set:function(e,t){-1===n.indexOf(e)&&(n.push(e),r.push(t))},delete:function(e){var t=n.indexOf(e);t>-1&&(n.splice(t,1),r.splice(t,1))}}),o=function(e){return new Event(e,{bubbles:!0})};try{new Event("test")}catch(e){o=function(e){var t=document.createEvent("Event");return t.initEvent(e,!0,!1),t}}function d(e){if(e&&e.nodeName&&"TEXTAREA"===e.nodeName&&!map.has(e)){var t=null,n=null,r=null,d=function(){e.clientWidth!==n&&f()},c=function(style){window.removeEventListener("resize",d,!1),e.removeEventListener("input",f,!1),e.removeEventListener("keyup",f,!1),e.removeEventListener("autosize:destroy",c,!1),e.removeEventListener("autosize:update",f,!1),Object.keys(style).forEach((function(t){e.style[t]=style[t]})),map.delete(e)}.bind(e,{height:e.style.height,resize:e.style.resize,overflowY:e.style.overflowY,overflowX:e.style.overflowX,wordWrap:e.style.wordWrap});e.addEventListener("autosize:destroy",c,!1),"onpropertychange"in e&&"oninput"in e&&e.addEventListener("keyup",f,!1),window.addEventListener("resize",d,!1),e.addEventListener("input",f,!1),e.addEventListener("autosize:update",f,!1),e.style.overflowX="hidden",e.style.wordWrap="break-word",map.set(e,{destroy:c,update:f}),h()}function h(){var style=window.getComputedStyle(e,null);"vertical"===style.resize?e.style.resize="none":"both"===style.resize&&(e.style.resize="horizontal"),t="content-box"===style.boxSizing?-(parseFloat(style.paddingTop)+parseFloat(style.paddingBottom)):parseFloat(style.borderTopWidth)+parseFloat(style.borderBottomWidth),isNaN(t)&&(t=0),f()}function l(t){var n=e.style.width;e.style.width="0px",e.offsetWidth,e.style.width=n,e.style.overflowY=t}function v(e){for(var t=[];e&&e.parentNode&&e.parentNode instanceof Element;)e.parentNode.scrollTop&&t.push({node:e.parentNode,scrollTop:e.parentNode.scrollTop}),e=e.parentNode;return t}function m(){if(0!==e.scrollHeight){var r=v(e),o=document.documentElement&&document.documentElement.scrollTop;e.style.height="",e.style.height=e.scrollHeight+t+"px",n=e.clientWidth,r.forEach((function(e){e.node.scrollTop=e.scrollTop})),o&&(document.documentElement.scrollTop=o)}}function f(){m();var t=Math.round(parseFloat(e.style.height)),n=window.getComputedStyle(e,null),d="content-box"===n.boxSizing?Math.round(parseFloat(n.height)):e.offsetHeight;if(d<t?"hidden"===n.overflowY&&(l("scroll"),m(),d="content-box"===n.boxSizing?Math.round(parseFloat(window.getComputedStyle(e,null).height)):e.offsetHeight):"hidden"!==n.overflowY&&(l("hidden"),m(),d="content-box"===n.boxSizing?Math.round(parseFloat(window.getComputedStyle(e,null).height)):e.offsetHeight),r!==d){r=d;var c=o("autosize:resized");try{e.dispatchEvent(c)}catch(e){}}}}function c(e){var t=map.get(e);t&&t.destroy()}function h(e){var t=map.get(e);t&&t.update()}var l=null;"undefined"==typeof window||"function"!=typeof window.getComputedStyle?((l=function(e){return e}).destroy=function(e){return e},l.update=function(e){return e}):((l=function(e,t){return e&&Array.prototype.forEach.call(e.length?e:[e],(function(e){return d(e,t)})),e}).destroy=function(e){return e&&Array.prototype.forEach.call(e.length?e:[e],c),e},l.update=function(e){return e&&Array.prototype.forEach.call(e.length?e:[e],h),e}),t.default=l,e.exports=t.default},void 0===(d="function"==typeof r?r.apply(t,o):r)||(e.exports=d)}}]);