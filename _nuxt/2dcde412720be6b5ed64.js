(window.webpackJsonp=window.webpackJsonp||[]).push([[4],{455:function(e,t,n){"use strict";function r(e){return"SELECT"===e.nodeName.toUpperCase()}function o(e){l(e.target)}function l(e){setTimeout(()=>{e.value.length?e.classList.add("is-not-empty"):e.classList.remove("is-not-empty")},0)}t.a={bind(e,t,n){l(e),r(e)?e.addEventListener("change",o):e.addEventListener("input",o),t.value&&e.addEventListener(t.value,o)},componentUpdated(e,t){l(e),t.oldValue!==t.value&&e.removeEventListener(t.oldValue,o),t.value&&e.addEventListener(t.value,o)},unbind(e,t){r(e)?e.removeEventListener("change",o):e.removeEventListener("input",o),t.value&&e.removeEventListener(t.value,o)}}},456:function(e,t,n){"use strict";var r={props:{isLoading:{type:Boolean,default:!1}}},o=(n(484),n(23)),component=Object(o.a)(r,(function(){var e=this.$createElement,t=this._self._c||e;return this.isLoading?t("svg",{staticClass:"loader",attrs:{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 28 28"}},[t("circle",{staticClass:"loader__path",attrs:{cx:"14",cy:"14",r:"12"}})]):this._e()}),[],!1,null,null,null);t.a=component.exports},458:function(e,t,n){},459:function(e,t,n){"use strict";n.d(t,"f",(function(){return f})),n.d(t,"e",(function(){return _})),n.d(t,"d",(function(){return y})),n.d(t,"a",(function(){return C})),n.d(t,"c",(function(){return $})),n.d(t,"b",(function(){return S}));var r=n(491),o=n(492),l=n(495),d=n(490),c=n(493),m=n(500),h=n(7),v=new r.a({apiType:"gate",baseURL:h.k,chainId:h.f}),f=new o.b(v),_=new l.a(v),y=new d.a(v),C=Object(o.a)(v),$=new c.a(v),S=new m.a(v)},460:function(e,t,n){"use strict";n(84);var r=n(485),o={ideFix:null,imaskAmount:{mask:Number,scale:0,signed:!1,thousandsSeparator:"",padFractionalZeros:!1,normalizeZeros:!1,radix:".",mapToRadix:[","]},directives:{imask:r.a},props:{value:{type:[String,Number],default:""}},data:()=>({maskedValue:""}),computed:{inputListeners:function(){var e=Object.assign({},this.$listeners);return delete e.input,e}},watch:{value(e){e!==this.maskedValue&&this.updateMaskState(e)}},mounted(){this.updateMaskState(this.value)},methods:{updateMaskState(e){this.$refs.input.maskRef.typedValue=e;var t=this.$refs.input.maskRef._value.length;this.$refs.input.maskRef._selection={start:t,end:t}},onAcceptInput(e){this.maskedValue=e.detail._unmaskedValue,this.$emit("input",e.detail._unmaskedValue)}}},l=n(23),component=Object(l.a)(o,(function(){var e=this.$createElement;return(this._self._c||e)("input",this._g({directives:[{name:"imask",rawName:"v-imask",value:this.$options.imaskAmount,expression:"$options.imaskAmount"}],ref:"input",attrs:{type:"text",autocapitalize:"off",inputmode:"numeric"},on:{accept:this.onAcceptInput}},this.inputListeners))}),[],!1,null,null,null);t.a=component.exports},461:function(e,t,n){"use strict";var r={props:{isOpen:{type:Boolean,default:!1},hideCloseButton:{type:Boolean,default:!1},modalClass:{type:String,default:""},modalContainerClass:{type:String,default:""},keepMarkup:{type:Boolean,default:!1}},data:()=>({elFocusedBeforeOpen:null}),watch:{isOpen(e){e?(this.elFocusedBeforeOpen=document.activeElement,setTimeout(()=>{if("function"==typeof this.$el.querySelector){var e=this.$el.querySelector("[data-focus-on-open]");e&&e.focus()}},0)):setTimeout(()=>{this.elFocusedBeforeOpen&&setTimeout(()=>{this.elFocusedBeforeOpen.focus(),this.elFocusedBeforeOpen=null},0)},0)}},methods:{closeModal(){this.$emit("update:isOpen",!1),this.$emit("modalClose")},handleModalClick(e){this.$refs.modalContainer&&e.target!==this.$refs.modalContainer&&!this.$refs.modalContainer.contains(e.target)&&this.closeModal()},handleModalKeydown(e){"Escape"!==e.code&&27!==e.keyCode||(e.preventDefault(),this.closeModal())}}},o=n(23),component=Object(o.a)(r,(function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("transition",{attrs:{name:"v-transition-modal"}},[e.isOpen||e.keepMarkup?n("div",{staticClass:"modal-wrap"},[n("transition",{attrs:{name:"v-transition-modal"}},[n("div",{directives:[{name:"show",rawName:"v-show",value:e.isOpen||!e.keepMarkup,expression:"isOpen || !keepMarkup"}],staticClass:"modal u-container u-container--wide",class:e.modalClass,attrs:{tabindex:"-1",role:"dialog"},on:{click:e.handleModalClick,keydown:e.handleModalKeydown}},[e.hideCloseButton?e._e():n("button",{staticClass:"modal__close u-semantic-button link--opacity",attrs:{type:"button"}},[n("span",{staticClass:"modal__close-icon"},[e._v("Close")])]),e._v(" "),n("div",{staticClass:"modal__wrap"},[n("div",{ref:"modalContainer",staticClass:"modal__container",class:e.modalContainerClass},[e._t("default")],2)])])])],1):e._e()])}),[],!1,null,null,null);t.a=component.exports},462:function(e,t,n){"use strict";n.d(t,"a",(function(){return o}));var r=n(7);function o(text,e){var t="ru"===e?"Консоль":"Console";return text?r.e+t+". "+text+r.d:r.e+t+r.d}},464:function(e,t,n){"use strict";var r=n(497),o=n(455),l=n(503),d=n(504),c=n.n(d),m=n(456),h=n(461);l.a.WORKER_PATH=c.a;var v={components:{Loader:m.a,Modal:h.a},props:{qrVisible:{type:Boolean,default:!1}},data:()=>({qrScanner:null,cameraError:!1,isModalVisible:!1,isPlaying:!1}),mounted(){l.a.hasCamera().then(()=>{this.$emit("update:qrVisible",!0),this.qrScanner=new l.a(this.$refs.qrVideo,e=>{this.stopScanQr(),this.isModalVisible=!1,this.$emit("qrScanned",e)})}).catch(()=>{this.$emit("update:qrVisible",!1)})},destroyed(){this.qrScanner&&this.qrScanner.destroy()},methods:{scanQr(){this.isModalVisible=!0,this.$refs.qrVideo.addEventListener("canplay",this.handlePlayStart),this.qrScanner.start().then(()=>{this.cameraError=!1}).catch(()=>{this.cameraError=!0})},stopScanQr(){this.qrScanner.stop(),this.isPlaying=!1,window.removeEventListener("resize",this.repositionOverlay)},handlePlayStart(){this.repositionOverlay(),this.isPlaying=!0,window.addEventListener("resize",this.repositionOverlay),this.$refs.qrVideo.removeEventListener("canplay",this.handlePlayStart)},repositionOverlay(){requestAnimationFrame(()=>{if(this.$refs.qrVideo){var e=this.$refs.qrVideo.offsetHeight,t=this.$refs.qrVideo.offsetWidth,n=Math.min(e,t);if(0!==n){var r=Math.ceil(2/3*n),o=this.$refs.overlay;o.style.width=r+"px",o.style.height=r+"px",o.style.top=(e-r)/2+"px",o.style.left=(t-r)/2+"px"}}})}}},f=n(23),_=Object(f.a)(v,(function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{directives:[{name:"show",rawName:"v-show",value:e.qrScanner,expression:"qrScanner"}],on:{click:function(e){e.preventDefault()}}},[n("button",{staticClass:"form-field__icon u-semantic-button link--opacity",attrs:{type:"button"},on:{click:function(t){return t.preventDefault(),e.scanQr(t)}}},[n("img",{attrs:{src:e.BASE_URL_PREFIX+"/img/icon-qr.svg",alt:"Scan QR Code",width:"24",height:"24"}})]),e._v(" "),n("Modal",{staticClass:"qr-scan__modal",attrs:{"modal-container-class":"qr-scan__modal-container",isOpen:e.isModalVisible,keepMarkup:!0},on:{"update:isOpen":function(t){e.isModalVisible=t},"update:is-open":function(t){e.isModalVisible=t},modalClose:e.stopScanQr}},[n("div",{staticClass:"qr-scan__wrap"},[n("div",{staticClass:"qr-scan__notice"},[n("Loader",{attrs:{isLoading:!0}}),e._v(" "),e.cameraError?n("div",[e._v("Allow camera access")]):e._e()],1),e._v(" "),n("video",{ref:"qrVideo",staticClass:"qr-scan__video",attrs:{autoplay:"",playsinline:"",muted:""},domProps:{muted:!0}}),e._v(" "),n("div",{directives:[{name:"show",rawName:"v-show",value:e.isPlaying,expression:"isPlaying"}],ref:"overlay",staticClass:"qr-scan__overlay"},[n("svg",{attrs:{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 238 238"}},[n("path",{attrs:{fill:"none","stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"3",d:"M31.3 2H10a8 8 0 0 0-8 8v21.3M206.8 2H228a8 8 0 0 1 8 8v21.3m0 175.4V228a8 8 0 0 1-8 8h-21.3m-175.4 0H10a8 8 0 0 1-8-8v-21.3"}})])])])])],1)}),[],!1,null,null,null).exports,y=n(460),C={ideFix:null,MAX_ITEM_COUNT:5,components:{VueSimpleSuggest:r.a,QrScan:_,Loader:m.a,InputMaskedInteger:y.a},directives:{checkEmpty:o.a},inheritAttrs:!1,props:{value:{type:[String,Number],required:!0},$value:{type:Object,required:!0},label:{type:String,required:!0},isInteger:{type:Boolean,default:!1},suggestionList:{type:Array,default:()=>[]},suggestionFilter:{type:Function,default:void 0},suggestionContent:{type:Function,default:void 0},suggestionMinInputLength:{type:Number,default:1}},data:()=>({hasCamera:!1}),methods:{handleQrScanned(e){this.$emit("input",e),this.$value.$touch()},handleSuggestionClick(e,t){t.preventDefault()}}},$=Object(f.a)(C,(function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("label",{staticClass:"form-field form-field--qr",class:{"is-error":e.$value.$error,"form-field--with-icon":e.hasCamera}},[e.suggestionList&&e.suggestionList.length?n("VueSimpleSuggest",e._b({attrs:{value:e.value,list:e.suggestionList,"max-suggestions":e.$options.MAX_ITEM_COUNT,"min-length":e.suggestionMinInputLength,"filter-by-query":!0,filter:e.suggestionFilter,destyled:!0,controls:{showList:[38,40]},"value-attribute":"value","display-attribute":"value"},on:{input:function(t){return e.$emit("input",t)},blur:function(t){e.$value.$touch(),e.$emit("blur",t)},"suggestion-click":e.handleSuggestionClick},scopedSlots:e._u([e.suggestionContent?{key:"suggestion-item",fn:function(t){return[n("span",{domProps:{innerHTML:e._s(e.suggestionContent(t))}})]}}:null],null,!0)},"VueSimpleSuggest",e.$attrs,!1),[n("input",e._b({directives:[{name:"check-empty",rawName:"v-check-empty"}],staticClass:"form-field__input",attrs:{type:"text",spellcheck:"false"},domProps:{value:e.value}},"input",e.$attrs,!1)),e._v(" "),n("span",{staticClass:"form-field__label"},[e._v(e._s(e.label))])]):[e.isInteger?n("InputMaskedInteger",e._b({directives:[{name:"check-empty",rawName:"v-check-empty"}],staticClass:"form-field__input",attrs:{value:e.value},on:{input:function(t){return e.$emit("input",t)},blur:function(t){e.$value.$touch(),e.$emit("blur",t)}}},"InputMaskedInteger",e.$attrs,!1)):n("input",e._b({directives:[{name:"check-empty",rawName:"v-check-empty"}],staticClass:"form-field__input",attrs:{type:"text",autocapitalize:"off",spellcheck:"false"},domProps:{value:e.value},on:{input:function(t){return e.$emit("input",t.target.value)},blur:function(t){e.$value.$touch(),e.$emit("blur",t)}}},"input",e.$attrs,!1)),e._v(" "),n("span",{staticClass:"form-field__label"},[e._v(e._s(e.label))])],e._v(" "),n("Loader",{staticClass:"form-field__icon form-field__icon--loader",attrs:{isLoading:e.$value.$pending}}),e._v(" "),n("QrScan",{attrs:{qrVisible:e.hasCamera},on:{qrScanned:e.handleQrScanned,"update:qrVisible":function(t){e.hasCamera=t},"update:qr-visible":function(t){e.hasCamera=t}}})],2)}),[],!1,null,null,null);t.a=$.exports},465:function(e,t,n){"use strict";var r=n(479),o=n(480),l={components:{InlineSvg:r.a,ButtonCopy:o.a},props:{copyText:{type:String,required:!0}}},d=n(23),component=Object(d.a)(l,(function(){var e=this.$createElement,t=this._self._c||e;return t("ButtonCopy",{staticClass:"u-icon u-semantic-button link--opacity",attrs:{"aria-label":"Copy","copy-text":this.copyText}},[t("InlineSvg",{attrs:{src:this.BASE_URL_PREFIX+"/img/icon-copy.svg"}})],1)}),[],!1,null,null,null);t.a=component.exports},471:function(e,t,n){"use strict";var r=n(172),o={props:{value:{type:String,default:""}},computed:{listeners(){var e=this.$listeners,{input:input,blur:t,focus:n}=e;return Object(r.a)(e,["input","blur","focus"])}},mounted:function(){this.updateValue(this.$refs.input.value)},methods:{updateValue:function(e){(e=e.toUpperCase())!==this.value&&this.$emit("input",e)}}},l=n(23),component=Object(l.a)(o,(function(){var e=this,t=e.$createElement;return(e._self._c||t)("input",e._g({ref:"input",domProps:{value:e.value},on:{input:function(t){return e.updateValue(t.target.value)},blur:function(t){return e.$emit("blur",t)},focus:function(t){return e.$emit("focus",t)}}},e.listeners))}),[],!1,null,null,null);t.a=component.exports},480:function(e,t,n){"use strict";var r=n(483),o={props:{copyText:{type:String,required:!0}},computed:{isClipboardSupported:()=>r.b()},methods:{copy(e){r.a(e)&&this.$store.commit("SET_SNACKBAR_ACTIVE")}}},l=n(23),component=Object(l.a)(o,(function(){var e=this,t=e.$createElement,n=e._self._c||t;return e.isClipboardSupported?n("button",{attrs:{type:"button"},on:{click:function(t){return e.copy(e.copyText)}}},[e._t("default")],2):e._e()}),[],!1,null,null,null);t.a=component.exports},482:function(e,t,n){"use strict";n.d(t,"a",(function(){return h}));n(174);var r=n(1),o=n(25),l=n(502),d=n(7),c=n(459),m={};function h(e){var{txType:t,txFeeOptions:n,selectedCoinSymbol:h,selectedFeeCoinSymbol:v,baseCoinAmount:f=0,isOffline:_}=e;return new r.a({data:{txType:t,txFeeOptions:n,selectedCoinSymbol:h,selectedFeeCoinSymbol:v,baseCoinAmount:f,coinPriceList:{},isOffline:_},computed:{baseCoinFeeValue(){return Object(l.a)(this.txType,this.txFeeOptions)||0},isBaseCoinEnough(){return this.baseCoinAmount>=this.baseCoinFeeValue},isBaseCoinFee(){return this.selectedFeeCoinSymbol?this.selectedFeeCoinSymbol===d.g:!this.selectedCoinSymbol||(this.selectedCoinSymbol===d.g||this.isBaseCoinEnough)},feeValue(){if(this.isBaseCoinFee)return this.baseCoinFeeValue;var e=this.coinPriceList[this.feeCoinSymbol];return e?new o.a(e.coinAmount).div(e.baseCoinAmount).times(this.baseCoinFeeValue).toFixed():0},feeCoinSymbol(){return this.selectedFeeCoinSymbol?this.selectedFeeCoinSymbol:this.isBaseCoinFee?d.g:this.selectedCoinSymbol},fee(){return{baseCoinValue:this.baseCoinFeeValue,isBaseCoin:this.isBaseCoinFee,isBaseCoinEnough:this.isBaseCoinEnough,value:this.feeValue,coinSymbol:this.feeCoinSymbol}}},watch:{fee:{handler(e){this.$emit("updateFee",e)},deep:!0}},created(){this.$on("updateParams",(function(e){Object.keys(e).forEach(t=>{this[t]=e[t]}),this.isOffline||this.$nextTick(()=>{if(!this.isBaseCoinFee){var e=this.feeCoinSymbol;(function(e,t){if(m[e]&&(n=m[e],!(n.timestamp&&Date.now()-n.timestamp>6e4)))return m[e].promise;var n;return m[e]={},m[e].promise=Object(c.b)({coinToSell:e,valueToBuy:t,coinToBuy:d.g}).then(n=>(m[e].timestamp=Date.now(),{coinSymbol:e,coinAmount:n.will_pay,baseCoinAmount:t})).catch(t=>{throw delete m[e],t}),m[e].promise})(e,this.baseCoinFeeValue).then(t=>this.$set(this.coinPriceList,e,t))}})}))}})}},484:function(e,t,n){"use strict";var r=n(458);n.n(r).a},494:function(e,t,n){"use strict";n(176);var r=n(472),o=n(489),l=n(517),d=n(76),c=n(464),m={ADDRESS:"address",PUBLIC_KEY:"publicKey"},h={ideFix:null,VALUE_TYPE:m,components:{FieldQr:c.a},inheritAttrs:!1,suggestionValidatorFilter:d.s,suggestionValidatorContent:d.r,props:{valueType:{type:String,required:!0},value:{type:[String,Number],required:!0},$value:{type:Object,required:!0},label:{type:String,required:!0},help:{type:String,default:""},suggestionList:{type:Array,default:void 0},suggestionDisabled:{type:Boolean,default:!1},suggestionMinInputLength:{type:Number,default:void 0}},data(){return{domain:this.value,isResolving:0,mnsResolveDomain:Object(l.a)()}},computed:{validatorList(){if(this.valueType===m.PUBLIC_KEY)return this.$store.state.validatorList.map(e=>{var t="";return e.meta&&e.meta.name&&(t=e.meta.name),{name:t,value:e.public_key}})}},methods:{handleInput(e){e=e.trim(),Object(l.c)(e)?(this.resolveDomain(e,{throttle:!0}),this.$emit("input",""),this.$emit("update:domain",e),this.domain=e):(this.$emit("input",e),this.$emit("update:domain",""),this.domain="")},handleBlur(){this.domain&&this.resolveDomain(this.domain)},resolveDomain(e){var{throttle:t}=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};if(Object(l.d)(e))return this.isResolving+=1,this.$emit("update:resolving",!!this.isResolving),this.mnsResolveDomain(e,{throttle:t}).then(e=>{"address"===this.valueType&&Object(r.c)(e.address)&&Object(l.b)(e)?this.$emit("input",e.address):"publicKey"===this.valueType&&Object(o.a)(e.publickey)&&Object(l.b)(e)&&this.$emit("input",e.publickey),this.isResolving-=1,this.$emit("update:resolving",!!this.isResolving)}).catch(()=>{this.isResolving-=1,this.$emit("update:resolving",!!this.isResolving)})}}},v=n(23),component=Object(v.a)(h,(function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",[n("FieldQr",e._b({attrs:{value:e.domain?e.domain:e.value,$value:e.$value,label:e.label,suggestionList:!e.suggestionDisabled&&(e.suggestionList||e.validatorList),suggestionMinInputLength:e.suggestionMinInputLength,suggestionContent:e.$options.suggestionValidatorContent,suggestionFilter:e.$options.suggestionValidatorFilter},on:{input:e.handleInput,blur:e.handleBlur}},"FieldQr",e.$attrs,!1)),e._v(" "),e.valueType!==e.$options.VALUE_TYPE.ADDRESS||e.$value.$pending?e._e():[!e.$value.$dirty||e.$value.required||e.domain?!e.$value.$dirty||e.$value.validAddress||e.domain?e.$value.$dirty&&!e.$value.validAddress&&e.domain?n("span",{staticClass:"form-field__error"},[e._v("\n            "+e._s(e.$td("Address not found for such domain","form.wallet-send-domain-error-invalid"))+"\n        ")]):e._e():n("span",{staticClass:"form-field__error"},[e._v("\n            "+e._s(e.$td("Address is invalid","form.wallet-send-address-error-invalid"))+"\n        ")]):n("span",{staticClass:"form-field__error"},[e._v("\n            "+e._s(e.$td("Enter address","form.wallet-send-address-error-required"))+"\n        ")])],e._v(" "),e.valueType!==e.$options.VALUE_TYPE.PUBLIC_KEY||e.$value.$pending?e._e():[!e.$value.$dirty||e.$value.required||e.domain?!e.$value.$dirty||e.$value.validPublicKey||e.domain?e.$value.$dirty&&!e.$value.validPublicKey&&e.domain?n("span",{staticClass:"form-field__error"},[e._v("\n            "+e._s(e.$td("Public key not found for such domain","form.masternode-domain-error-invalid"))+"\n        ")]):e._e():n("span",{staticClass:"form-field__error"},[e._v("\n            "+e._s(e.$td("Public key is invalid","form.masternode-public-error-invalid"))+"\n        ")]):n("span",{staticClass:"form-field__error"},[e._v("\n            "+e._s(e.$td("Enter public key","form.masternode-public-error-required"))+"\n        ")])],e._v(" "),e.help?n("div",{staticClass:"form-field__help"},[e._v(e._s(e.help))]):e._e()],2)}),[],!1,null,null,null);t.a=component.exports},517:function(e,t,n){"use strict";(function(e){n.d(t,"a",(function(){return h})),n.d(t,"c",(function(){return y})),n.d(t,"d",(function(){return C})),n.d(t,"b",(function(){return $}));n(27),n(16);var r=n(64),o=n.n(r),l=n(85),d=n(498),c=n(7),m=o.a.create({baseURL:c.n});function h(){var e,t,n,r,l;return function(o){var{throttle:m}=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return e===o?(m||(v(n),n=null),t):(e=o,v(r,{isCancel:!0}),v(l,{isCancel:!0}),r=null,l=null,t=m?c(700).then(()=>d(o)):d(o))};function d(e){return m.get("resolve",{params:{domain:e},cancelToken:new o.a.CancelToken(e=>{l=e})}).then(e=>e.data)}function c(e){return new Promise((t,o)=>{n=t,r=o,setTimeout(t,e)})}}function v(e){var{isCancel:t}=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};"function"==typeof e&&e(t?"Request aborted":void 0)}var f=/^([a-z0-9][a-z0-9-_]*\.)+[a-z]*$/i,_=/^([a-z0-9][a-z0-9-_]*\.)+[a-z]{2,}$/i;function y(e){return f.test(e)}function C(e){return _.test(e)}function $(t){var{address:address,publickey:n,ticker:r,signature:o}=t,m=address+n+r,h=Object(l.keccak)(m),v=e.from(o.r,"hex"),s=e.from(o.s,"hex");return"Mp"+Object(d.ecrecover)(h,o.v,v,s).toString("hex")===c.o}}).call(this,n(9).Buffer)}}]);