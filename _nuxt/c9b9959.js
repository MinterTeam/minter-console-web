(window.webpackJsonp=window.webpackJsonp||[]).push([[2],{735:function(e,t,n){"use strict";n(67);function r(e){return"SELECT"===e.nodeName.toUpperCase()}function o(e){l(e.target)}function l(e){setTimeout((function(){e.value.length?e.classList.add("is-not-empty"):e.classList.remove("is-not-empty")}),0)}t.a={bind:function(e,t,n){l(e),r(e)?e.addEventListener("change",o):e.addEventListener("input",o),t.value&&e.addEventListener(t.value,o)},componentUpdated:function(e,t){l(e),t.oldValue!==t.value&&e.removeEventListener(t.oldValue,o),t.value&&e.addEventListener(t.value,o)},unbind:function(e,t){r(e)?e.removeEventListener("change",o):e.removeEventListener("input",o),t.value&&e.removeEventListener(t.value,o)}}},748:function(e,t,n){"use strict";var r={props:{isLoading:{type:Boolean,default:!1}}},o=(n(828),n(59)),component=Object(o.a)(r,(function(){var e=this,t=e.$createElement,n=e._self._c||t;return e.isLoading?n("svg",{staticClass:"loader",attrs:{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 28 28"}},[n("circle",{staticClass:"loader__path",attrs:{cx:"14",cy:"14",r:"12"}})]):e._e()}),[],!1,null,null,null);t.a=component.exports},750:function(e,t,n){"use strict";n.d(t,"i",(function(){return B})),n.d(t,"h",(function(){return A})),n.d(t,"g",(function(){return T})),n.d(t,"a",(function(){return F})),n.d(t,"c",(function(){return Q})),n.d(t,"b",(function(){return D})),n.d(t,"d",(function(){return H})),n.d(t,"j",(function(){return z})),n.d(t,"k",(function(){return K})),n.d(t,"e",(function(){return X})),n.d(t,"f",(function(){return W}));var r=n(0),o=n(30),l=(n(1),n(34),n(39),n(47),n(37),n(32),n(33),n(60),n(16),n(63),n(15)),c=n(110),d=n.n(c),f=n(481),m=n(146),v=n.n(m),h=n(855),_=n(920),y=n(815),w=n(816),O=n(861),k=n(864),C=n(826),$=n(921),S=n(806),j=n(813),L=(n(817),n(827)),M=n(7),E=n(80);function x(object,e){var t=Object.keys(object);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(object);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(object,e).enumerable}))),t.push.apply(t,n)}return t}function P(e){for(var i=1;i<arguments.length;i++){var source=null!=arguments[i]?arguments[i]:{};i%2?x(Object(source),!0).forEach((function(t){Object(r.a)(e,t,source[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(source)):x(Object(source)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(source,t))}))}return e}var V=new h.a({apiType:"gate",baseURL:M.r,chainId:M.g,adapter:Object(f.a)(d.a.defaults.adapter,{enabledByDefault:!1})}),B=Object(_.b)(V),A=Object(y.a)(V),T=Object(w.a)(V),F=Object(_.a)(V),I=new v.a({maxAge:3e4}),N=function(e,t){return e.sellAll?Object(k.a)(V)(e):Object(O.a)(V)(e)},R=function(e,t){return Object(C.a)(V)(e)};function Q(e){if(e.findRoute&&e.swapFrom!==S.c.BANCOR){var t,n=N(e).catch((function(e){t=e})),r=Object(E.k)(e.coinToSell,e.coinToBuy,{sellAmount:e.valueToSell}).catch((function(e){console.log(e)}));return Promise.all([n,r]).then((function(n){var r=Object(o.a)(n,2),c=r[0],d=r[1];if(t&&!d)throw t;var f=d&&t,m=c&&d&&new l.a(c.will_get).lt(d.amountOut)&&d.coins.length>2;if(f||m){var v=d.coins.map((function(e){return e.id}));return v.pop(),v.shift(),Promise.all([N(P(P({},e),{},{route:v,swapFrom:S.c.POOL})),Promise.resolve(d.coins)]).then((function(e){var t=Object(o.a)(e,2),n=t[0],r=t[1];n=P(P({},n),{},{route:r});var d=c&&n&&new l.a(c.will_get).lt(n.will_get);return f||d?n:c}))}return c}))}return N(e)}function D(e){if(e.findRoute&&e.swapFrom!==S.c.BANCOR){var t,n=R(e).catch((function(e){t=e})),r=Object(E.k)(e.coinToSell,e.coinToBuy,{buyAmount:e.valueToBuy}).catch((function(e){console.log(e)}));return Promise.all([n,r]).then((function(n){var r=Object(o.a)(n,2),c=r[0],d=r[1];if(t&&!d)throw t;var f=d&&t,m=c&&d&&new l.a(c.will_pay).gt(d.amountIn)&&d.coins.length>2;if(f||m){var v=d.coins.map((function(e){return e.id}));return v.pop(),v.shift(),Promise.all([R(P(P({},e),{},{route:v,swapFrom:S.c.POOL})),Promise.resolve(d.coins)]).then((function(e){var t=Object(o.a)(e,2),n=t[0],r=t[1];n=P(P({},n),{},{route:r});var d=c&&n&&new l.a(c.will_pay).gt(n.will_pay);return f||d?n:c}))}return c}))}return R(e)}var H=function(e,t){return Object($.a)(V)(e,{direct:!1},P(P({},t),{},{cache:I}))},U=new v.a({maxAge:6e4}),z=Object(j.b)(V),K=Object(j.c)(V),X=function(symbol){return Object(j.a)(V)(symbol,void 0,{cache:U})},J=new v.a({maxAge:36e5}),W=function(){return Object(L.a)(V)({cache:J})}},753:function(e,t,n){"use strict";n.d(t,"a",(function(){return o}));var r=n(7);function o(text,e){var t="ru"===e?"Консоль":"Console";return text?r.e+t+". "+text+r.d:r.e+t+r.d}},758:function(e,t,n){"use strict";n(79);var r=n(786),o=n(735),l=n(866),c=n(867),d=n(748),f=n(761);l.a.WORKER_PATH=c.a;var m={components:{Loader:d.a,Modal:f.a},props:{qrVisible:{type:Boolean,default:!1}},data:function(){return{qrScanner:null,cameraError:!1,isModalVisible:!1,isPlaying:!1}},mounted:function(){var e=this;l.a.hasCamera().then((function(){e.$emit("update:qrVisible",!0),e.qrScanner=new l.a(e.$refs.qrVideo,(function(t){e.stopScanQr(),e.isModalVisible=!1,e.$emit("qr-scanned",t)}))})).catch((function(){e.$emit("update:qrVisible",!1)}))},destroyed:function(){this.qrScanner&&this.qrScanner.destroy()},methods:{scanQr:function(){var e=this;this.isModalVisible=!0,this.$refs.qrVideo.addEventListener("canplay",this.handlePlayStart),this.qrScanner.start().then((function(){e.cameraError=!1})).catch((function(){e.cameraError=!0}))},stopScanQr:function(){this.qrScanner.stop(),this.isPlaying=!1,window.removeEventListener("resize",this.repositionOverlay)},handlePlayStart:function(){this.repositionOverlay(),this.isPlaying=!0,window.addEventListener("resize",this.repositionOverlay),this.$refs.qrVideo.removeEventListener("canplay",this.handlePlayStart)},repositionOverlay:function(){var e=this;requestAnimationFrame((function(){if(e.$refs.qrVideo){var t=e.$refs.qrVideo.offsetHeight,n=e.$refs.qrVideo.offsetWidth,r=Math.min(t,n);if(0!==r){var o=Math.ceil(2/3*r),l=e.$refs.overlay;l.style.width=o+"px",l.style.height=o+"px",l.style.top=(t-o)/2+"px",l.style.left=(n-o)/2+"px"}}}))}}},v=n(59),h=Object(v.a)(m,(function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{directives:[{name:"show",rawName:"v-show",value:e.qrScanner,expression:"qrScanner"}],on:{click:function(e){e.preventDefault()}}},[n("button",{staticClass:"form-field__icon u-semantic-button link--opacity",attrs:{type:"button"},on:{click:function(t){return t.preventDefault(),e.scanQr(t)}}},[n("img",{attrs:{src:e.BASE_URL_PREFIX+"/img/icon-qr.svg",alt:"Scan QR Code",width:"24",height:"24"}})]),e._v(" "),n("Modal",{staticClass:"qr-scan__modal",attrs:{"modal-container-class":"qr-scan__modal-container",isOpen:e.isModalVisible,keepMarkup:!0},on:{"update:isOpen":function(t){e.isModalVisible=t},"update:is-open":function(t){e.isModalVisible=t},"modal-close":e.stopScanQr}},[n("div",{staticClass:"qr-scan__wrap"},[n("div",{staticClass:"qr-scan__notice"},[n("Loader",{attrs:{isLoading:!0}}),e._v(" "),e.cameraError?n("div",[e._v("Allow camera access")]):e._e()],1),e._v(" "),n("video",{ref:"qrVideo",staticClass:"qr-scan__video",attrs:{autoplay:"",playsinline:"",muted:""},domProps:{muted:!0}}),e._v(" "),n("div",{directives:[{name:"show",rawName:"v-show",value:e.isPlaying,expression:"isPlaying"}],ref:"overlay",staticClass:"qr-scan__overlay"},[n("svg",{attrs:{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 238 238"}},[n("path",{attrs:{fill:"none","stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"3",d:"M31.3 2H10a8 8 0 0 0-8 8v21.3M206.8 2H228a8 8 0 0 1 8 8v21.3m0 175.4V228a8 8 0 0 1-8 8h-21.3m-175.4 0H10a8 8 0 0 1-8-8v-21.3"}})])])])])],1)}),[],!1,null,null,null).exports,_=n(769),y={ideFix:null,MAX_ITEM_COUNT:5,components:{VueSimpleSuggest:r.a,QrScan:h,Loader:d.a,InputMaskedInteger:_.a},directives:{checkEmpty:o.a},inheritAttrs:!1,props:{value:{type:[String,Number],required:!0},$value:{type:Object,required:!0},label:{type:String,required:!0},isInteger:{type:Boolean,default:!1},suggestionList:{type:Array,default:function(){return[]}},suggestionFilter:{type:Function,default:void 0},suggestionContent:{type:Function,default:void 0},suggestionMinInputLength:{type:Number,default:1}},data:function(){return{hasCamera:!1}},methods:{handleQrScanned:function(e){this.$emit("input",e),this.$value.$touch()},handleSuggestionClick:function(e,t){t.preventDefault()}}},w=Object(v.a)(y,(function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("label",{staticClass:"form-field form-field--qr",class:{"is-error":e.$value.$error,"form-field--with-icon":e.hasCamera}},[e.suggestionList&&e.suggestionList.length?n("VueSimpleSuggest",e._b({attrs:{value:e.value,list:e.suggestionList.slice(0),"max-suggestions":e.$options.MAX_ITEM_COUNT,"min-length":e.suggestionMinInputLength,"filter-by-query":!0,filter:e.suggestionFilter,destyled:!0,controls:{showList:[38,40]},"value-attribute":"value","display-attribute":"value"},on:{input:function(t){return e.$emit("input",t)},blur:function(t){e.$value.$touch(),e.$emit("blur",t)},"suggestion-click":e.handleSuggestionClick},scopedSlots:e._u([e.suggestionContent?{key:"suggestion-item",fn:function(t){return[n("span",{domProps:{innerHTML:e._s(e.suggestionContent(t))}})]}}:null],null,!0)},"VueSimpleSuggest",e.$attrs,!1),[n("input",e._b({directives:[{name:"check-empty",rawName:"v-check-empty"}],staticClass:"form-field__input",attrs:{type:"text",spellcheck:"false"},domProps:{value:e.value}},"input",e.$attrs,!1)),e._v(" "),n("span",{staticClass:"form-field__label"},[e._v(e._s(e.label))])]):[e.isInteger?n("InputMaskedInteger",e._b({directives:[{name:"check-empty",rawName:"v-check-empty"}],staticClass:"form-field__input",attrs:{value:e.value},on:{input:function(t){return e.$emit("input",t)},blur:function(t){e.$value.$touch(),e.$emit("blur",t)}}},"InputMaskedInteger",e.$attrs,!1)):n("input",e._b({directives:[{name:"check-empty",rawName:"v-check-empty"}],staticClass:"form-field__input",attrs:{type:"text",autocapitalize:"off",spellcheck:"false"},domProps:{value:e.value},on:{input:function(t){return e.$emit("input",t.target.value)},blur:function(t){e.$value.$touch(),e.$emit("blur",t)}}},"input",e.$attrs,!1)),e._v(" "),n("span",{staticClass:"form-field__label"},[e._v(e._s(e.label))])],e._v(" "),n("Loader",{staticClass:"form-field__icon form-field__icon--loader form-field__icon--second",attrs:{isLoading:e.$value.$pending}}),e._v(" "),n("QrScan",{attrs:{qrVisible:e.hasCamera},on:{"qr-scanned":e.handleQrScanned,"update:qrVisible":function(t){e.hasCamera=t},"update:qr-visible":function(t){e.hasCamera=t}}})],2)}),[],!1,null,null,null);t.a=w.exports},761:function(e,t,n){"use strict";n(67);var r={props:{isOpen:{type:Boolean,default:!1},hideCloseButton:{type:Boolean,default:!1},modalClass:{type:String,default:""},modalContainerClass:{type:String,default:""},keepMarkup:{type:Boolean,default:!1}},data:function(){return{elFocusedBeforeOpen:null}},watch:{isOpen:function(e){var t=this;e?(this.elFocusedBeforeOpen=document.activeElement,setTimeout((function(){if("function"==typeof t.$el.querySelector){var e=t.$el.querySelector("[data-focus-on-open]");e&&e.focus()}}),0)):setTimeout((function(){t.elFocusedBeforeOpen&&setTimeout((function(){t.elFocusedBeforeOpen.focus(),t.elFocusedBeforeOpen=null}),0)}),0)}},methods:{closeModal:function(){this.$emit("update:isOpen",!1),this.$emit("modal-close")},handleModalClick:function(e){this.hideCloseButton||this.$refs.modalContainer&&e.target!==this.$refs.modalContainer&&!this.$refs.modalContainer.contains(e.target)&&this.closeModal()},handleModalKeydown:function(e){this.hideCloseButton||"Escape"!==e.code&&27!==e.keyCode||(e.preventDefault(),this.closeModal())}}},o=n(59),component=Object(o.a)(r,(function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("transition",{attrs:{name:"v-transition-modal"}},[e.isOpen||e.keepMarkup?n("div",{staticClass:"modal-wrap"},[n("transition",{attrs:{name:"v-transition-modal"}},[n("div",{directives:[{name:"show",rawName:"v-show",value:e.isOpen||!e.keepMarkup,expression:"isOpen || !keepMarkup"}],staticClass:"modal u-container u-container--wide",class:e.modalClass,attrs:{tabindex:"-1",role:"dialog"},on:{click:e.handleModalClick,keydown:e.handleModalKeydown}},[e.hideCloseButton?e._e():n("button",{staticClass:"modal__close u-semantic-button link--opacity",attrs:{type:"button"}},[n("span",{staticClass:"modal__close-icon"},[e._v("Close")])]),e._v(" "),n("div",{staticClass:"modal__wrap"},[n("div",{ref:"modalContainer",staticClass:"modal__container",class:e.modalContainerClass},[e._t("default")],2)])])])],1):e._e()])}),[],!1,null,null,null);t.a=component.exports},769:function(e,t,n){"use strict";n(79),n(774);var r=n(777),o={ideFix:null,imaskAmount:{mask:Number,scale:0,signed:!1,thousandsSeparator:"",padFractionalZeros:!1,normalizeZeros:!1,radix:".",mapToRadix:[","]},directives:{imask:r.a},props:{value:{type:[String,Number],default:""}},data:function(){return{maskedValue:""}},computed:{inputListeners:function(){var e=Object.assign({},this.$listeners);return delete e.input,e}},watch:{value:function(e){e!==this.maskedValue&&this.updateMaskState(e)}},mounted:function(){this.updateMaskState(this.value)},methods:{updateMaskState:function(e){this.$refs.input.maskRef.typedValue=e;var t=this.$refs.input.maskRef._value.length;this.$refs.input.maskRef._selection={start:t,end:t}},onAcceptInput:function(e){this.maskedValue=e.detail._unmaskedValue,this.$emit("input",e.detail._unmaskedValue)}}},l=n(59),component=Object(l.a)(o,(function(){var e=this,t=e.$createElement;return(e._self._c||t)("input",e._g({directives:[{name:"imask",rawName:"v-imask",value:e.$options.imaskAmount,expression:"$options.imaskAmount"}],ref:"input",attrs:{type:"text",autocapitalize:"off",inputmode:"numeric"},on:{accept:e.onAcceptInput}},e.inputListeners))}),[],!1,null,null,null);t.a=component.exports},796:function(e,t,n){},828:function(e,t,n){"use strict";n(796)},857:function(e,t){},859:function(e,t){},862:function(e,t){}}]);