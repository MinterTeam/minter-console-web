(window.webpackJsonp=window.webpackJsonp||[]).push([[3],{630:function(e,t,n){"use strict";function r(e){return"SELECT"===e.nodeName.toUpperCase()}function o(e){l(e.target)}function l(e){setTimeout((()=>{e.value.length?e.classList.add("is-not-empty"):e.classList.remove("is-not-empty")}),0)}t.a={bind(e,t,n){l(e),r(e)?e.addEventListener("change",o):e.addEventListener("input",o),t.value&&e.addEventListener(t.value,o)},componentUpdated(e,t){l(e),t.oldValue!==t.value&&e.removeEventListener(t.oldValue,o),t.value&&e.addEventListener(t.value,o)},unbind(e,t){r(e)?e.removeEventListener("change",o):e.removeEventListener("input",o),t.value&&e.removeEventListener(t.value,o)}}},632:function(e,t,n){"use strict";var r={props:{isLoading:{type:Boolean,default:!1}}},o=(n(671),n(41)),component=Object(o.a)(r,(function(){var e=this,t=e._self._c;return e.isLoading?t("svg",{staticClass:"loader",attrs:{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 28 28"}},[t("circle",{staticClass:"loader__path",attrs:{cx:"14",cy:"14",r:"12"}})]):e._e()}),[],!1,null,null,null);t.a=component.exports},640:function(e,t,n){"use strict";n.d(t,"h",(function(){return V})),n.d(t,"g",(function(){return x})),n.d(t,"f",(function(){return B})),n.d(t,"a",(function(){return T})),n.d(t,"c",(function(){return I})),n.d(t,"b",(function(){return R})),n.d(t,"d",(function(){return Q})),n.d(t,"i",(function(){return H})),n.d(t,"j",(function(){return U})),n.d(t,"e",(function(){return z}));var r=n(24),o=(n(27),n(8),n(12),n(623)),l=n(191),c=n(712),d=n(713),m=n(697),f=n(698),v=n(714),h=n(716),y=n(717),_=n(665),O=n(174),w=n(691),k=(n(699),n(700)),C=n(2),S=n(148),$=n(440),j=n(51);function M(object,e){var t=Object.keys(object);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(object);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(object,e).enumerable}))),t.push.apply(t,n)}return t}function P(e){for(var i=1;i<arguments.length;i++){var source=null!=arguments[i]?arguments[i]:{};i%2?M(Object(source),!0).forEach((function(t){Object(r.a)(e,t,source[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(source)):M(Object(source)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(source,t))}))}return e}var L=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:Object(S.a)();return e=Object(o.a)(e,{enabledByDefault:!1}),e=Object($.a)(e,{time:500,leading:!1})}(),E=new c.a({apiType:"gate",baseURL:C.r,chainId:C.i,adapter:L}),V=Object(d.b)(E),x=Object(m.a)(E),B=Object(f.a)(E),T=Object(d.a)(E),F=new l.a({ttl:5e3,max:100}),A=(e,t)=>e.sellAll?Object(h.a)(E,{cache:F})(e,t):Object(v.a)(E,{cache:F})(e,t),N=new y.a(E,{cache:F});function I(e,t){return e.valueToSell&&Number(e.valueToSell)?e.findRoute&&e.swapFrom!==O.c.BANCOR?Object(j.m)(e.coinToSell,e.coinToBuy,{sellAmount:e.valueToSell,swapFrom:e.swapFrom},P(P({},t),{},{cache:F})).then((n=>{var r;return Promise.all([A(P(P({},e),{},{route:null===(r=n.coins)||void 0===r?void 0:r.map((e=>e.id)).slice(1,-1),swapFrom:n.swapType}),t),Promise.resolve(n.coins)])})).then((e=>{var[t,n]=e;return P(P({},t),{},{route:n})})):A(e,t):Promise.reject(new Error("Value to sell not specified"))}function R(e,t){return e.valueToBuy&&Number(e.valueToBuy)?e.findRoute&&e.swapFrom!==O.c.BANCOR?Object(j.m)(e.coinToSell,e.coinToBuy,{buyAmount:e.valueToBuy,swapFrom:e.swapFrom},P(P({},t),{},{cache:F})).then((n=>{var r;return Promise.all([N(P(P({},e),{},{route:null===(r=n.coins)||void 0===r?void 0:r.map((e=>e.id)).slice(1,-1),swapFrom:n.swapType}),t),Promise.resolve(n.coins)])})).then((e=>{var[t,n]=e;return P(P({},t),{},{route:n})})):N(e,t):Promise.reject(new Error("Value to buy not specified"))}var D=new l.a({ttl:6e4,max:100}),Q=new _.b(E,{cache:F},{cache:D}),H=Object(w.b)(E,{cache:D}),U=Object(w.c)(E,{cache:D}),z=(new w.a(E,{cache:D}),new k.a(E,{cache:D}))},644:function(e,t,n){"use strict";var r=n(24),o=n(311),l=(n(702),n(722)),c=["input"];function d(object,e){var t=Object.keys(object);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(object);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(object,e).enumerable}))),t.push.apply(t,n)}return t}function m(e){for(var i=1;i<arguments.length;i++){var source=null!=arguments[i]?arguments[i]:{};i%2?d(Object(source),!0).forEach((function(t){Object(r.a)(e,t,source[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(source)):d(Object(source)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(source,t))}))}return e}var f={imaskAmount:{mask:Number,scale:18,signed:!1,thousandsSeparator:"",padFractionalZeros:!1,normalizeZeros:!1,radix:".",mapToRadix:[",","ю","Ю","б","Б"]},directives:{imask:l.a},props:{value:{type:[String,Number],default:""},scale:{type:[String,Number]}},emits:["input"],data:()=>({maskedValue:""}),computed:{listeners(){var e=this.$listeners,{input:input}=e;return Object(o.a)(e,c)},imaskOptions(){var e;return m(m({},this.$options.imaskAmount),{},{scale:null!==(e=this.scale)&&void 0!==e?e:this.$options.imaskAmount.scale})}},watch:{value(e){e!==this.maskedValue&&this.updateMaskState(e)}},mounted(){this.updateMaskState(this.value)},methods:{updateMaskState(e){if(this.$refs.input.maskRef){this.$refs.input.maskRef.typedValue=e;var t=this.$refs.input.maskRef._value.length;this.$refs.input.maskRef._selection={start:t,end:t}}},onAcceptInput(e){this.maskedValue=e.detail._unmaskedValue,this.$emit("input",e.detail._unmaskedValue)}}},v=n(41),component=Object(v.a)(f,(function(){var e=this;return(0,e._self._c)("input",e._g({directives:[{name:"imask",rawName:"v-imask",value:e.imaskOptions,expression:"imaskOptions"}],ref:"input",attrs:{type:"text",autocapitalize:"off",inputmode:"decimal"},on:{accept:function(t){return e.onAcceptInput(t)}}},e.listeners))}),[],!1,null,null,null);t.a=component.exports},649:function(e,t,n){"use strict";var r={props:{isOpen:{type:Boolean,default:!1},hideCloseButton:{type:Boolean,default:!1},modalClass:{type:String,default:""},modalContainerClass:{type:String,default:""},keepMarkup:{type:Boolean,default:!1}},data:()=>({elFocusedBeforeOpen:null}),watch:{isOpen(e){e?(this.elFocusedBeforeOpen=document.activeElement,setTimeout((()=>{if("function"==typeof this.$el.querySelector){var e=this.$el.querySelector("[data-focus-on-open]");e&&e.focus()}}),0)):setTimeout((()=>{this.elFocusedBeforeOpen&&setTimeout((()=>{this.elFocusedBeforeOpen.focus(),this.elFocusedBeforeOpen=null}),0)}),0)}},methods:{closeModal(){this.$emit("update:isOpen",!1),this.$emit("modal-close")},handleModalClick(e){this.hideCloseButton||this.$refs.modalContainer&&e.target!==this.$refs.modalContainer&&!this.$refs.modalContainer.contains(e.target)&&this.closeModal()},handleModalKeydown(e){this.hideCloseButton||"Escape"!==e.code&&27!==e.keyCode||(e.preventDefault(),this.closeModal())}}},o=n(41),component=Object(o.a)(r,(function(){var e=this,t=e._self._c;return t("transition",{attrs:{name:"v-transition-modal"}},[e.isOpen||e.keepMarkup?t("div",{staticClass:"modal-wrap"},[t("transition",{attrs:{name:"v-transition-modal"}},[t("div",{directives:[{name:"show",rawName:"v-show",value:e.isOpen||!e.keepMarkup,expression:"isOpen || !keepMarkup"}],staticClass:"modal u-container u-container--wide",class:e.modalClass,attrs:{tabindex:"-1",role:"dialog"},on:{click:e.handleModalClick,keydown:e.handleModalKeydown}},[e.hideCloseButton?e._e():t("button",{staticClass:"modal__close u-semantic-button link--opacity",attrs:{type:"button"}},[t("span",{staticClass:"modal__close-icon"},[e._v("Close")])]),e._v(" "),t("div",{staticClass:"modal__wrap"},[t("div",{ref:"modalContainer",staticClass:"modal__container",class:e.modalContainerClass},[e._t("default")],2)])])])],1):e._e()])}),[],!1,null,null,null);t.a=component.exports},650:function(e,t,n){"use strict";n(130);var r={components:{InputMaskedAmount:n(644).a},props:{value:{type:[String,Number],default:""}},computed:{inputListeners:function(){var e=Object.assign({},this.$listeners);return delete e.input,e}}},o=n(41),component=Object(o.a)(r,(function(){var e=this;return(0,e._self._c)("InputMaskedAmount",e._g({attrs:{inputmode:"numeric",value:e.value,scale:0},on:{input:function(t){return e.$emit("input",t)}}},e.inputListeners))}),[],!1,null,null,null);t.a=component.exports},654:function(e,t,n){"use strict";var r=n(669),o=n(630),l=n(676),c=n(677),d=n(632),m=n(649);l.a.WORKER_PATH=c.a;var f={components:{Loader:d.a,Modal:m.a},props:{qrVisible:{type:Boolean,default:!1}},data:()=>({qrScanner:null,cameraError:!1,isModalVisible:!1,isPlaying:!1}),mounted(){l.a.hasCamera().then((()=>{this.$emit("update:qrVisible",!0),this.qrScanner=new l.a(this.$refs.qrVideo,(e=>{this.stopScanQr(),this.isModalVisible=!1,this.$emit("qr-scanned",e)}))})).catch((()=>{this.$emit("update:qrVisible",!1)}))},destroyed(){this.qrScanner&&this.qrScanner.destroy()},methods:{scanQr(){this.isModalVisible=!0,this.$refs.qrVideo.addEventListener("canplay",this.handlePlayStart),this.qrScanner.start().then((()=>{this.cameraError=!1})).catch((()=>{this.cameraError=!0}))},stopScanQr(){this.qrScanner.stop(),this.isPlaying=!1,window.removeEventListener("resize",this.repositionOverlay)},handlePlayStart(){this.repositionOverlay(),this.isPlaying=!0,window.addEventListener("resize",this.repositionOverlay),this.$refs.qrVideo.removeEventListener("canplay",this.handlePlayStart)},repositionOverlay(){requestAnimationFrame((()=>{if(this.$refs.qrVideo){var e=this.$refs.qrVideo.offsetHeight,t=this.$refs.qrVideo.offsetWidth,n=Math.min(e,t);if(0!==n){var r=Math.ceil(2/3*n),o=this.$refs.overlay;o.style.width=r+"px",o.style.height=r+"px",o.style.top=(e-r)/2+"px",o.style.left=(t-r)/2+"px"}}}))}}},v=n(41),component=Object(v.a)(f,(function(){var e=this,t=e._self._c;return t("div",{directives:[{name:"show",rawName:"v-show",value:e.qrScanner,expression:"qrScanner"}],on:{click:function(e){e.preventDefault()}}},[t("button",{staticClass:"form-field__icon u-semantic-button link--opacity",attrs:{type:"button"},on:{click:function(t){return t.preventDefault(),e.scanQr.apply(null,arguments)}}},[t("img",{attrs:{src:"".concat(e.BASE_URL_PREFIX,"/img/icon-qr.svg"),alt:"Scan QR Code",width:"24",height:"24"}})]),e._v(" "),t("Modal",{staticClass:"qr-scan__modal",attrs:{"modal-container-class":"qr-scan__modal-container",isOpen:e.isModalVisible,keepMarkup:!0},on:{"update:isOpen":function(t){e.isModalVisible=t},"update:is-open":function(t){e.isModalVisible=t},"modal-close":e.stopScanQr}},[t("div",{staticClass:"qr-scan__wrap"},[t("div",{staticClass:"qr-scan__notice"},[t("Loader",{attrs:{isLoading:!0}}),e._v(" "),e.cameraError?t("div",[e._v("Allow camera access")]):e._e()],1),e._v(" "),t("video",{ref:"qrVideo",staticClass:"qr-scan__video",attrs:{autoplay:"",playsinline:"",muted:""},domProps:{muted:!0}}),e._v(" "),t("div",{directives:[{name:"show",rawName:"v-show",value:e.isPlaying,expression:"isPlaying"}],ref:"overlay",staticClass:"qr-scan__overlay"},[t("svg",{attrs:{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 238 238"}},[t("path",{attrs:{fill:"none","stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"3",d:"M31.3 2H10a8 8 0 0 0-8 8v21.3M206.8 2H228a8 8 0 0 1 8 8v21.3m0 175.4V228a8 8 0 0 1-8 8h-21.3m-175.4 0H10a8 8 0 0 1-8-8v-21.3"}})])])])])],1)}),[],!1,null,null,null),h=component.exports,y=n(650),_={ideFix:null,MAX_ITEM_COUNT:5,components:{VueSimpleSuggest:r.a,QrScan:h,Loader:d.a,InputMaskedInteger:y.a},directives:{checkEmpty:o.a},inheritAttrs:!1,props:{value:{type:[String,Number],required:!0},$value:{type:Object,required:!0},label:{type:String,required:!0},isInteger:{type:Boolean,default:!1},suggestionList:{type:Array,default:()=>[]},suggestionFilter:{type:Function,default:void 0},suggestionContent:{type:Function,default:void 0},suggestionMinInputLength:{type:Number,default:1}},data:()=>({hasCamera:!1}),methods:{handleQrScanned(e){this.$emit("input",e),this.$value.$touch()},handleSuggestionClick(e,t){t.preventDefault()}}},O=Object(v.a)(_,(function(){var e=this,t=e._self._c;return t("label",{staticClass:"form-field form-field--qr",class:{"is-error":e.$value.$error,"form-field--with-icon":e.hasCamera}},[e.suggestionList&&e.suggestionList.length?t("VueSimpleSuggest",e._b({attrs:{value:e.value,list:e.suggestionList.slice(0),"max-suggestions":e.$options.MAX_ITEM_COUNT,"min-length":e.suggestionMinInputLength,"filter-by-query":!0,filter:e.suggestionFilter,destyled:!0,controls:{showList:[38,40]},"value-attribute":"value","display-attribute":"value"},on:{input:function(t){return e.$emit("input",t)},blur:function(t){e.$value.$touch(),e.$emit("blur",t)},"suggestion-click":e.handleSuggestionClick},scopedSlots:e._u([e.suggestionContent?{key:"suggestion-item",fn:function(n){return[t("span",{domProps:{innerHTML:e._s(e.suggestionContent(n))}})]}}:null],null,!0)},"VueSimpleSuggest",e.$attrs,!1),[t("input",e._b({directives:[{name:"check-empty",rawName:"v-check-empty"}],staticClass:"form-field__input",attrs:{type:"text",spellcheck:"false"},domProps:{value:e.value}},"input",e.$attrs,!1)),e._v(" "),t("span",{staticClass:"form-field__label"},[e._v(e._s(e.label))])]):[e.isInteger?t("InputMaskedInteger",e._b({directives:[{name:"check-empty",rawName:"v-check-empty"}],staticClass:"form-field__input",attrs:{value:e.value},on:{input:function(t){return e.$emit("input",t)},blur:function(t){e.$value.$touch(),e.$emit("blur",t)}}},"InputMaskedInteger",e.$attrs,!1)):t("input",e._b({directives:[{name:"check-empty",rawName:"v-check-empty"}],staticClass:"form-field__input",attrs:{type:"text",autocapitalize:"off",spellcheck:"false"},domProps:{value:e.value},on:{input:function(t){return e.$emit("input",t.target.value)},blur:function(t){e.$value.$touch(),e.$emit("blur",t)}}},"input",e.$attrs,!1)),e._v(" "),t("span",{staticClass:"form-field__label"},[e._v(e._s(e.label))])],e._v(" "),t("Loader",{staticClass:"form-field__icon form-field__icon--loader form-field__icon--second",attrs:{isLoading:e.$value.$pending}}),e._v(" "),t("QrScan",{attrs:{qrVisible:e.hasCamera},on:{"qr-scanned":e.handleQrScanned,"update:qrVisible":function(t){e.hasCamera=t},"update:qr-visible":function(t){e.hasCamera=t}}})],2)}),[],!1,null,null,null);t.a=O.exports},655:function(e,t,n){"use strict";n.d(t,"a",(function(){return o}));var r=n(2);function o(text,e){var t="ru"===e?"Консоль":"Console";return text?r.d+t+". "+text+r.c:r.d+t+r.c}},656:function(e,t,n){e.exports={}},671:function(e,t,n){"use strict";n(656)},715:function(e,t){}}]);