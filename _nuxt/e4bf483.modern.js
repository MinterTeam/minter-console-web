/*! For license information please see LICENSES */
(window.webpackJsonp=window.webpackJsonp||[]).push([[18],{1057:function(e,t,n){"use strict";var o=n(622),r=n(623),l=n.n(r),c=n(625),d=n.n(c),h=n(628),m=n(617),v=n(20),f=n(69),_=n(638),y=n(631),w=n(630),E=n(649),$=n(635),k={TX_TYPE:v.a,components:{BaseAmount:_.a,TxForm:y.a,FieldCoin:w.a,FieldUseMax:E.a,InputMaskedInteger:$.a},directives:{autosize:h.a,checkEmpty:m.a},mixins:[o.validationMixin],data:()=>({form:{value:"",coin:"",dueBlock:""}}),validations(){return{form:{value:{required:l.a},coin:{required:l.a,minLength:this.$store.getters.isOfflineMode?()=>!0:d()(3)},dueBlock:{required:l.a}}}},computed:{},methods:{prettyExact:f.t,clearForm(){this.form.value="",this.form.coin="",this.form.dueBlock="",this.$v.$reset()}}},C=n(46),component=Object(C.a)(k,(function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("TxForm",{attrs:{txData:e.form,$txData:e.$v.form,txType:e.$options.TX_TYPE.LOCK},on:{"clear-form":function(t){return e.clearForm()}},scopedSlots:e._u([{key:"panel-header",fn:function(){return[n("h1",{staticClass:"panel__header-title"},[e._v("\n            "+e._s(e.$td("Lock coins","lock.lock-title"))+"\n        ")]),e._v(" "),n("p",{staticClass:"panel__header-description"},[e._v("\n            "+e._s(e.$td("Lock your coins to proof that you will not move them for some time.","lock.lock-description"))+"\n        ")])]},proxy:!0},{key:"default",fn:function(t){var o=t.fee,r=t.addressBalance;return[n("div",{staticClass:"u-cell u-cell--large--1-3 u-cell--small--1-2"},[n("FieldCoin",{attrs:{"data-test-id":"walletSendInputCoin",$value:e.$v.form.coin,label:e.$td("Coin","form.coin"),"coin-list":r,"select-mode":!0},model:{value:e.form.coin,callback:function(t){e.$set(e.form,"coin",t)},expression:"form.coin"}}),e._v(" "),e.$v.form.coin.$dirty&&!e.$v.form.coin.required?n("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Enter coin symbol","form.coin-error-required")))]):e.$v.form.coin.$dirty&&!e.$v.form.coin.minLength?n("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Min 3 letters","form.coin-error-min")))]):e._e()],1),e._v(" "),n("div",{staticClass:"u-cell u-cell--large--1-3 u-cell--small--1-2"},[n("FieldUseMax",{attrs:{$value:e.$v.form.value,label:e.$td("Amount","form.lock-amount"),"selected-coin-symbol":e.form.coin,fee:o,"address-balance":r},model:{value:e.form.value,callback:function(t){e.$set(e.form,"value",t)},expression:"form.value"}}),e._v(" "),e.$v.form.value.$dirty&&!e.$v.form.value.required?n("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Enter amount","form.amount-error-required")))]):e._e()],1),e._v(" "),n("div",{staticClass:"u-cell u-cell--large--1-3"},[n("label",{staticClass:"form-field",class:{"is-error":e.$v.form.dueBlock.$error}},[n("InputMaskedInteger",{directives:[{name:"check-empty",rawName:"v-check-empty"}],staticClass:"form-field__input",on:{blur:function(t){return e.$v.form.dueBlock.$touch()}},model:{value:e.form.dueBlock,callback:function(t){e.$set(e.form,"dueBlock",t)},expression:"form.dueBlock"}}),e._v(" "),n("span",{staticClass:"form-field__label"},[e._v(e._s(e.$td("Due block","form.lock-due-block")))])],1),e._v(" "),e.$v.form.dueBlock.$dirty&&!e.$v.form.dueBlock.required?n("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Enter due block","form.lock-due-block-error-required")))]):e._e()])]}},{key:"confirm-modal-header",fn:function(){return[n("h1",{staticClass:"panel__header-title"},[n("img",{staticClass:"panel__header-title-icon",attrs:{src:e.BASE_URL_PREFIX+"/img/icon-send.svg",alt:"",role:"presentation",width:"40",height:"40"}}),e._v("\n            "+e._s(e.$td("Lock coins","lock.lock-title"))+"\n        ")])]},proxy:!0},{key:"confirm-modal-body",fn:function(){return[n("div",{staticClass:"u-grid u-grid--small u-grid--vertical-margin u-text-left"},[n("div",{staticClass:"u-cell"},[n("div",{staticClass:"form-field form-field--dashed"},[n("BaseAmount",{staticClass:"form-field__input is-not-empty",attrs:{tag:"div",coin:e.form.coin,amount:e.form.value,exact:!0}}),e._v(" "),n("div",{staticClass:"form-field__label"},[e._v(e._s(e.$td("You lock","form.lock-confirm-amount")))])],1)]),e._v(" "),n("div",{staticClass:"u-cell"},[n("div",{staticClass:"form-field form-field--dashed"},[n("div",{staticClass:"form-field__input is-not-empty"},[e._v(e._s(e.form.dueBlock))]),e._v(" "),n("span",{staticClass:"form-field__label"},[e._v(e._s(e.$td("Until block","form.lock-confirm-due-block")))])])])])]},proxy:!0}])})}),[],!1,null,null,null);t.a=component.exports},1184:function(e,t,n){"use strict";n.r(t);var o=n(640),r={components:{CoinLockForm:n(1057).a},fetch(e){var{app:t,store:n,redirect:o}=e;return o(t.i18nGetPreferredPath("coiner"))},head(){var title=Object(o.a)(this.$store.state.sectionName,this.$i18n.locale),e=this.$td("","lock.seo-description"),t="en"===this.$i18n.locale?"":"-"+this.$i18n.locale;return{title:title,meta:[{hid:"og-title",name:"og:title",content:title},{hid:"description",name:"description",content:e},{hid:"og-description",name:"og:description",content:e},{hid:"og-image",name:"og:image",content:"".concat(this.BASE_URL_PREFIX,"/img/social-share-delegation").concat(t,".png")}]}}},l=n(46),component=Object(l.a)(r,(function(){var e=this.$createElement,t=this._self._c||e;return t("section",{staticClass:"u-section u-container"},[t("CoinLockForm")],1)}),[],!1,null,null,null);t.default=component.exports},625:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var o=n(643);t.default=function(e){return(0,o.withParams)({type:"minLength",min:e},(function(t){return!(0,o.req)(t)||(0,o.len)(t)>=e}))}},627:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var o=n(643);t.default=function(e){return(0,o.withParams)({type:"maxLength",max:e},(function(t){return!(0,o.req)(t)||(0,o.len)(t)<=e}))}},628:function(e,t,n){"use strict";var o=n(669),r=n.n(o);t.a={bind(e,t,n){"TEXTAREA"===e.tagName&&n.context.$nextTick((()=>{r()(e)}))},componentUpdated(e,t,n){"TEXTAREA"===e.tagName&&n.context.$nextTick((()=>{r.a.update(e)}))},unbind(e){r.a.destroy(e)}}},646:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var o=n(643);t.default=function(e){return(0,o.withParams)({type:"minValue",min:e},(function(t){return!(0,o.req)(t)||(!/\s/.test(t)||t instanceof Date)&&+t>=+e}))}},654:function(e,t,n){"use strict";n.d(t,"a",(function(){return r}));n(113),n(112),n(23);var o={};var r={name:"InlineSvg",inheritAttrs:!1,render(e){return this.svgElSource?e("svg",{on:this.$listeners,attrs:Object.assign(this.getSvgAttrs(this.svgElSource),(t=this.$attrs,Object.keys(t).reduce(((e,n)=>(!1!==t[n]&&null!==t[n]&&void 0!==t[n]&&(e[n]=t[n]),e)),{}))),domProps:{innerHTML:this.getSvgContent(this.svgElSource)}}):null;var t},props:{src:{type:String,required:!0},title:{type:String},transformSource:{type:Function,default:svg=>svg},keepDuringLoading:{type:Boolean,default:!0}},data:()=>({svgElSource:null}),watch:{src(e){this.getSource(e)}},mounted(){this.getSource(this.src)},methods:{getSvgAttrs(e){var t={},n=e.attributes;if(!n)return t;for(var i=n.length-1;i>=0;i--)t[n[i].name]=n[i].value;return t},getSvgContent(e){return e=e.cloneNode(!0),e=this.transformSource(e),this.title&&function(svg,title){var e=svg.getElementsByTagName("title");if(e.length)e[0].textContent=title;else{var t=document.createElementNS("http://www.w3.org/2000/svg","title");t.textContent=title,svg.appendChild(t)}}(e,this.title),e.innerHTML},getSource(e){o[e]||(o[e]=this.download(e)),this.svgElSource&&o[e].isPending()&&!this.keepDuringLoading&&(this.svgElSource=null,this.$emit("unloaded")),o[e].then((svg=>{this.svgElSource=svg,this.$nextTick((()=>{this.$emit("loaded",this.$el)}))})).catch((t=>{this.svgElSource&&(this.svgElSource=null,this.$emit("unloaded")),delete o[e],this.$emit("error",t)}))},download:e=>function(e){if(e.isPending)return e;var t=!0,n=e.then((e=>(t=!1,e)),(e=>{throw t=!1,e}));return n.isPending=function(){return t},n}(new Promise(((t,n)=>{var o=new XMLHttpRequest;o.open("GET",e,!0),o.onload=()=>{if(o.status>=200&&o.status<400)try{var e=(new DOMParser).parseFromString(o.responseText,"text/xml").getElementsByTagName("svg")[0];e?t(e):n(new Error('Loaded file is not valid SVG"'))}catch(e){n(e)}else n(new Error("Error loading SVG"))},o.onerror=n,o.send()})))}}},658:function(e,t,n){"use strict";function o(e){var t=document.createElement("textarea");t.value=e,t.setAttribute("readonly",""),t.style.position="absolute",t.style.left="-9999px",document.body.appendChild(t);var n=document.getSelection(),o=n.rangeCount>0&&n.getRangeAt(0);t.select(),t.selectionStart=0,t.selectionEnd=e.length;var r=document.execCommand("copy");return document.body.removeChild(t),o&&(n.removeAllRanges(),n.addRange(o)),r}function r(){return"undefined"!=typeof document&&"function"==typeof document.queryCommandSupported&&document.queryCommandSupported("copy")}n.d(t,"a",(function(){return o})),n.d(t,"b",(function(){return r}))},660:function(e,t,n){"use strict";n.d(t,"a",(function(){return o}));n(23),n(701),n(4),n(9),n(14),n(704),n(416);class o{static hasCamera(){return navigator.mediaDevices?navigator.mediaDevices.enumerateDevices().then((e=>e.some((e=>"videoinput"===e.kind)))).catch((()=>!1)):Promise.reject(!1)}constructor(video,e){var t=arguments.length>2&&void 0!==arguments[2]?arguments[2]:o.DEFAULT_CANVAS_SIZE;this.$video=video,this.$canvas=document.createElement("canvas"),this._onDecode=e,this._active=!1,this._paused=!1,this.$canvas.width=t,this.$canvas.height=t,this._sourceRect={x:0,y:0,width:t,height:t},this._onCanPlay=this._onCanPlay.bind(this),this._onPlay=this._onPlay.bind(this),this._onVisibilityChange=this._onVisibilityChange.bind(this),this.$video.addEventListener("canplay",this._onCanPlay),this.$video.addEventListener("play",this._onPlay),document.addEventListener("visibilitychange",this._onVisibilityChange),this._qrWorker=new Worker(o.WORKER_PATH)}destroy(){this.$video.removeEventListener("canplay",this._onCanPlay),this.$video.removeEventListener("play",this._onPlay),document.removeEventListener("visibilitychange",this._onVisibilityChange),this.stop(),this._qrWorker.postMessage({type:"close"})}start(){if(this._active&&!this._paused)return Promise.resolve();if("https:"!==window.location.protocol&&console.warn("The camera stream is only accessible if the page is transferred via https."),this._active=!0,this._paused=!1,document.hidden)return Promise.resolve();if(clearTimeout(this._offTimeout),this._offTimeout=null,this.$video.srcObject)return this.$video.play(),Promise.resolve();var e="environment";return this._getCameraStream("environment",!0).catch((()=>(e="user",this._getCameraStream()))).then((t=>{this._isUserFacing(t)&&(e="user"),this.$video.srcObject=t,this._setVideoMirror(e)})).catch((e=>{throw this._active=!1,e}))}stop(){this.pause(),this._active=!1}pause(){this._paused=!0,this._active&&(this.$video.pause(),this._offTimeout||(this._offTimeout=setTimeout((()=>{var track=this.$video.srcObject&&this.$video.srcObject.getTracks()[0];track&&(track.stop(),this.$video.srcObject=null,this._offTimeout=null)}),300)))}static scanImage(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:null,canvas=arguments.length>3&&void 0!==arguments[3]?arguments[3]:null,r=arguments.length>4&&void 0!==arguments[4]&&arguments[4],l=arguments.length>5&&void 0!==arguments[5]&&arguments[5],c=!1,d=new Promise(((l,d)=>{var h,m,v;n||(n=new Worker(o.WORKER_PATH),c=!0,n.postMessage({type:"inversionMode",data:"both"})),m=e=>{"qrResult"===e.data.type&&(n.removeEventListener("message",m),n.removeEventListener("error",v),clearTimeout(h),null!==e.data.data?l(e.data.data):d("QR code not found."))},v=e=>{n.removeEventListener("message",m),n.removeEventListener("error",v),clearTimeout(h);var t=e?e.message||e:"Unknown Error";d("Scanner error: "+t)},n.addEventListener("message",m),n.addEventListener("error",v),h=setTimeout((()=>v("timeout")),3e3),o._loadImage(e).then((image=>{var e=o._getImageData(image,t,canvas,r);n.postMessage({type:"decode",data:e},[e.data.buffer])})).catch(v)}));return t&&l&&(d=d.catch((()=>o.scanImage(e,null,n,canvas,r)))),d=d.finally((()=>{c&&n.postMessage({type:"close"})}))}setGrayscaleWeights(e,t,n){var o=!(arguments.length>3&&void 0!==arguments[3])||arguments[3];this._qrWorker.postMessage({type:"grayscaleWeights",data:{red:e,green:t,blue:n,useIntegerApproximation:o}})}setInversionMode(e){this._qrWorker.postMessage({type:"inversionMode",data:e})}_onCanPlay(){this._updateSourceRect(),this.$video.play()}_onPlay(){this._updateSourceRect(),this._scanFrame()}_onVisibilityChange(){document.hidden?this.pause():this._active&&this.start()}_updateSourceRect(){var e=Math.min(this.$video.videoWidth,this.$video.videoHeight),t=Math.round(2/3*e);this._sourceRect.width=this._sourceRect.height=t,this._sourceRect.x=(this.$video.videoWidth-t)/2,this._sourceRect.y=(this.$video.videoHeight-t)/2}_scanFrame(){if(!this._active||this.$video.paused||this.$video.ended)return!1;requestAnimationFrame((()=>{this.$video.readyState<=1?this._scanFrame():o.scanImage(this.$video,this._sourceRect,this._qrWorker,this.$canvas,!0).then(this._onDecode,(e=>{this._active&&"QR code not found."!==e&&console.error(e)})).then((()=>this._scanFrame()))}))}_getCameraStream(e){var t=[{width:{min:1024}},{width:{min:768}},{}];return e&&(arguments.length>1&&void 0!==arguments[1]&&arguments[1]&&(e={exact:e}),t.forEach((t=>t.facingMode=e))),this._getMatchingCameraStream(t)}_getMatchingCameraStream(e){return 0===e.length?Promise.reject("Camera not found."):navigator.mediaDevices.getUserMedia({video:e.shift()}).catch((()=>this._getMatchingCameraStream(e)))}_setVideoMirror(e){var t="user"===e?-1:1;this.$video.style.transform="scaleX("+t+")"}_isUserFacing(e){return/front|user|face/i.test(e.getVideoTracks()[0].label)}static _getImageData(image){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,canvas=arguments.length>2&&void 0!==arguments[2]?arguments[2]:null,t=arguments.length>3&&void 0!==arguments[3]&&arguments[3];canvas=canvas||document.createElement("canvas");var n=e&&e.x?e.x:0,o=e&&e.y?e.y:0,r=e&&e.width?e.width:image.width||image.videoWidth,l=e&&e.height?e.height:image.height||image.videoHeight;t||canvas.width===r&&canvas.height===l||(canvas.width=r,canvas.height=l);var c=canvas.getContext("2d",{alpha:!1});return c.imageSmoothingEnabled=!1,c.drawImage(image,n,o,r,l,0,0,canvas.width,canvas.height),c.getImageData(0,0,canvas.width,canvas.height)}static _loadImage(e){if(e instanceof HTMLCanvasElement||e instanceof HTMLVideoElement||window.ImageBitmap&&e instanceof window.ImageBitmap||window.OffscreenCanvas&&e instanceof window.OffscreenCanvas)return Promise.resolve(e);if(e instanceof Image)return o._awaitImageLoad(e).then((()=>e));if(e instanceof File||e instanceof URL||"string"==typeof e){var image=new Image;return e instanceof File?image.src=URL.createObjectURL(e):image.src=e,o._awaitImageLoad(image).then((()=>(e instanceof File&&URL.revokeObjectURL(image.src),image)))}return Promise.reject("Unsupported image type.")}static _awaitImageLoad(image){return new Promise(((e,t)=>{var n,o;image.complete&&0!==image.naturalWidth?e():(n=()=>{image.removeEventListener("load",n),image.removeEventListener("error",o),e()},o=()=>{image.removeEventListener("load",n),image.removeEventListener("error",o),t("Image load error")},image.addEventListener("load",n),image.addEventListener("error",o))}))}}o.DEFAULT_CANVAS_SIZE=400,o.WORKER_PATH="qr-scanner-worker.min.js"},661:function(e,t,n){"use strict";t.a=n.p+"6b7d1afd4fb85864e691672bb54a14d3.js"},669:function(e,t,n){var o,r,l;r=[e,t],o=function(e,t){"use strict";var n,o,map="function"==typeof Map?new Map:(n=[],o=[],{has:function(e){return n.indexOf(e)>-1},get:function(e){return o[n.indexOf(e)]},set:function(e,t){-1===n.indexOf(e)&&(n.push(e),o.push(t))},delete:function(e){var t=n.indexOf(e);t>-1&&(n.splice(t,1),o.splice(t,1))}}),r=function(e){return new Event(e,{bubbles:!0})};try{new Event("test")}catch(e){r=function(e){var t=document.createEvent("Event");return t.initEvent(e,!0,!1),t}}function l(e){if(e&&e.nodeName&&"TEXTAREA"===e.nodeName&&!map.has(e)){var t=null,n=null,o=null,l=function(){e.clientWidth!==n&&f()},c=function(style){window.removeEventListener("resize",l,!1),e.removeEventListener("input",f,!1),e.removeEventListener("keyup",f,!1),e.removeEventListener("autosize:destroy",c,!1),e.removeEventListener("autosize:update",f,!1),Object.keys(style).forEach((function(t){e.style[t]=style[t]})),map.delete(e)}.bind(e,{height:e.style.height,resize:e.style.resize,overflowY:e.style.overflowY,overflowX:e.style.overflowX,wordWrap:e.style.wordWrap});e.addEventListener("autosize:destroy",c,!1),"onpropertychange"in e&&"oninput"in e&&e.addEventListener("keyup",f,!1),window.addEventListener("resize",l,!1),e.addEventListener("input",f,!1),e.addEventListener("autosize:update",f,!1),e.style.overflowX="hidden",e.style.wordWrap="break-word",map.set(e,{destroy:c,update:f}),d()}function d(){var style=window.getComputedStyle(e,null);"vertical"===style.resize?e.style.resize="none":"both"===style.resize&&(e.style.resize="horizontal"),t="content-box"===style.boxSizing?-(parseFloat(style.paddingTop)+parseFloat(style.paddingBottom)):parseFloat(style.borderTopWidth)+parseFloat(style.borderBottomWidth),isNaN(t)&&(t=0),f()}function h(t){var n=e.style.width;e.style.width="0px",e.offsetWidth,e.style.width=n,e.style.overflowY=t}function m(e){for(var t=[];e&&e.parentNode&&e.parentNode instanceof Element;)e.parentNode.scrollTop&&t.push({node:e.parentNode,scrollTop:e.parentNode.scrollTop}),e=e.parentNode;return t}function v(){if(0!==e.scrollHeight){var o=m(e),r=document.documentElement&&document.documentElement.scrollTop;e.style.height="",e.style.height=e.scrollHeight+t+"px",n=e.clientWidth,o.forEach((function(e){e.node.scrollTop=e.scrollTop})),r&&(document.documentElement.scrollTop=r)}}function f(){v();var t=Math.round(parseFloat(e.style.height)),n=window.getComputedStyle(e,null),l="content-box"===n.boxSizing?Math.round(parseFloat(n.height)):e.offsetHeight;if(l<t?"hidden"===n.overflowY&&(h("scroll"),v(),l="content-box"===n.boxSizing?Math.round(parseFloat(window.getComputedStyle(e,null).height)):e.offsetHeight):"hidden"!==n.overflowY&&(h("hidden"),v(),l="content-box"===n.boxSizing?Math.round(parseFloat(window.getComputedStyle(e,null).height)):e.offsetHeight),o!==l){o=l;var c=r("autosize:resized");try{e.dispatchEvent(c)}catch(e){}}}}function c(e){var t=map.get(e);t&&t.destroy()}function d(e){var t=map.get(e);t&&t.update()}var h=null;"undefined"==typeof window||"function"!=typeof window.getComputedStyle?((h=function(e){return e}).destroy=function(e){return e},h.update=function(e){return e}):((h=function(e,t){return e&&Array.prototype.forEach.call(e.length?e:[e],(function(e){return l(e,t)})),e}).destroy=function(e){return e&&Array.prototype.forEach.call(e.length?e:[e],c),e},h.update=function(e){return e&&Array.prototype.forEach.call(e.length?e:[e],d),e}),t.default=h,e.exports=t.default},void 0===(l="function"==typeof o?o.apply(t,r):o)||(e.exports=l)}}]);