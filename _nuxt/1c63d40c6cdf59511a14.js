(window.webpackJsonp=window.webpackJsonp||[]).push([[9],{525:function(e,t,r){"use strict";r(63);function n(e){return"SELECT"===e.nodeName.toUpperCase()}function o(e){l(e.target)}function l(e){setTimeout((function(){e.value.length?e.classList.add("is-not-empty"):e.classList.remove("is-not-empty")}),0)}t.a={bind:function(e,t,r){l(e),n(e)?e.addEventListener("change",o):e.addEventListener("input",o),t.value&&e.addEventListener(t.value,o)},componentUpdated:function(e,t){l(e),t.oldValue!==t.value&&e.removeEventListener(t.oldValue,o),t.value&&e.addEventListener(t.value,o)},unbind:function(e,t){n(e)?e.removeEventListener("change",o):e.removeEventListener("input",o),t.value&&e.removeEventListener(t.value,o)}}},526:function(e,t,r){"use strict";var n={props:{isLoading:{type:Boolean,default:!1}}},o=(r(555),r(34)),component=Object(o.a)(n,(function(){var e=this.$createElement,t=this._self._c||e;return this.isLoading?t("svg",{staticClass:"loader",attrs:{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 28 28"}},[t("circle",{staticClass:"loader__path",attrs:{cx:"14",cy:"14",r:"12"}})]):this._e()}),[],!1,null,null,null);t.a=component.exports},528:function(e,t,r){},529:function(e,t,r){"use strict";r.d(t,"f",(function(){return h})),r.d(t,"e",(function(){return _})),r.d(t,"d",(function(){return $})),r.d(t,"a",(function(){return y})),r.d(t,"c",(function(){return k})),r.d(t,"b",(function(){return C}));var n=r(562),o=r(563),l=r(566),c=r(561),d=r(564),m=r(571),f=r(9),v=new n.a({apiType:"gate",baseURL:f.k,chainId:f.f}),h=new o.b(v),_=new l.a(v),$=new c.a(v),y=Object(o.a)(v),k=new d.a(v),C=new m.a(v)},530:function(e,t,r){"use strict";r(80);var n=r(556),o={ideFix:null,imaskAmount:{mask:Number,scale:0,signed:!1,thousandsSeparator:"",padFractionalZeros:!1,normalizeZeros:!1,radix:".",mapToRadix:[","]},directives:{imask:n.a},props:{value:{type:[String,Number],default:""}},data:function(){return{maskedValue:""}},computed:{inputListeners:function(){var e=Object.assign({},this.$listeners);return delete e.input,e}},watch:{value:function(e){e!==this.maskedValue&&this.updateMaskState(e)}},mounted:function(){this.updateMaskState(this.value)},methods:{updateMaskState:function(e){this.$refs.input.maskRef.typedValue=e;var t=this.$refs.input.maskRef._value.length;this.$refs.input.maskRef._selection={start:t,end:t}},onAcceptInput:function(e){this.maskedValue=e.detail._unmaskedValue,this.$emit("input",e.detail._unmaskedValue)}}},l=r(34),component=Object(l.a)(o,(function(){var e=this.$createElement;return(this._self._c||e)("input",this._g({directives:[{name:"imask",rawName:"v-imask",value:this.$options.imaskAmount,expression:"$options.imaskAmount"}],ref:"input",attrs:{type:"text",autocapitalize:"off",inputmode:"numeric"},on:{accept:this.onAcceptInput}},this.inputListeners))}),[],!1,null,null,null);t.a=component.exports},531:function(e,t,r){"use strict";r(63);var n={props:{isOpen:{type:Boolean,default:!1},hideCloseButton:{type:Boolean,default:!1},modalClass:{type:String,default:""},modalContainerClass:{type:String,default:""},keepMarkup:{type:Boolean,default:!1}},data:function(){return{elFocusedBeforeOpen:null}},watch:{isOpen:function(e){var t=this;e?(this.elFocusedBeforeOpen=document.activeElement,setTimeout((function(){if("function"==typeof t.$el.querySelector){var e=t.$el.querySelector("[data-focus-on-open]");e&&e.focus()}}),0)):setTimeout((function(){t.elFocusedBeforeOpen&&setTimeout((function(){t.elFocusedBeforeOpen.focus(),t.elFocusedBeforeOpen=null}),0)}),0)}},methods:{closeModal:function(){this.$emit("update:isOpen",!1),this.$emit("modalClose")},handleModalClick:function(e){this.$refs.modalContainer&&e.target!==this.$refs.modalContainer&&!this.$refs.modalContainer.contains(e.target)&&this.closeModal()},handleModalKeydown:function(e){"Escape"!==e.code&&27!==e.keyCode||(e.preventDefault(),this.closeModal())}}},o=r(34),component=Object(o.a)(n,(function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("transition",{attrs:{name:"v-transition-modal"}},[e.isOpen||e.keepMarkup?r("div",{staticClass:"modal-wrap"},[r("transition",{attrs:{name:"v-transition-modal"}},[r("div",{directives:[{name:"show",rawName:"v-show",value:e.isOpen||!e.keepMarkup,expression:"isOpen || !keepMarkup"}],staticClass:"modal u-container u-container--wide",class:e.modalClass,attrs:{tabindex:"-1",role:"dialog"},on:{click:e.handleModalClick,keydown:e.handleModalKeydown}},[e.hideCloseButton?e._e():r("button",{staticClass:"modal__close u-semantic-button link--opacity",attrs:{type:"button"}},[r("span",{staticClass:"modal__close-icon"},[e._v("Close")])]),e._v(" "),r("div",{staticClass:"modal__wrap"},[r("div",{ref:"modalContainer",staticClass:"modal__container",class:e.modalContainerClass},[e._t("default")],2)])])])],1):e._e()])}),[],!1,null,null,null);t.a=component.exports},532:function(e,t,r){"use strict";r.d(t,"a",(function(){return o}));var n=r(9);function o(text,e){var t="ru"===e?"Консоль":"Console";return text?n.e+t+". "+text+n.d:n.e+t+n.d}},534:function(e,t,r){"use strict";r(80);var n=r(568),o=r(525),l=r(574),c=r(575),d=r.n(c),m=r(526),f=r(531);l.a.WORKER_PATH=d.a;var v={components:{Loader:m.a,Modal:f.a},props:{qrVisible:{type:Boolean,default:!1}},data:function(){return{qrScanner:null,cameraError:!1,isModalVisible:!1,isPlaying:!1}},mounted:function(){var e=this;l.a.hasCamera().then((function(){e.$emit("update:qrVisible",!0),e.qrScanner=new l.a(e.$refs.qrVideo,(function(t){e.stopScanQr(),e.isModalVisible=!1,e.$emit("qrScanned",t)}))})).catch((function(){e.$emit("update:qrVisible",!1)}))},destroyed:function(){this.qrScanner&&this.qrScanner.destroy()},methods:{scanQr:function(){var e=this;this.isModalVisible=!0,this.$refs.qrVideo.addEventListener("canplay",this.handlePlayStart),this.qrScanner.start().then((function(){e.cameraError=!1})).catch((function(){e.cameraError=!0}))},stopScanQr:function(){this.qrScanner.stop(),this.isPlaying=!1,window.removeEventListener("resize",this.repositionOverlay)},handlePlayStart:function(){this.repositionOverlay(),this.isPlaying=!0,window.addEventListener("resize",this.repositionOverlay),this.$refs.qrVideo.removeEventListener("canplay",this.handlePlayStart)},repositionOverlay:function(){var e=this;requestAnimationFrame((function(){if(e.$refs.qrVideo){var t=e.$refs.qrVideo.offsetHeight,r=e.$refs.qrVideo.offsetWidth,n=Math.min(t,r);if(0!==n){var o=Math.ceil(2/3*n),l=e.$refs.overlay;l.style.width=o+"px",l.style.height=o+"px",l.style.top=(t-o)/2+"px",l.style.left=(r-o)/2+"px"}}}))}}},h=r(34),_=Object(h.a)(v,(function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("div",{directives:[{name:"show",rawName:"v-show",value:e.qrScanner,expression:"qrScanner"}],on:{click:function(e){e.preventDefault()}}},[r("button",{staticClass:"form-field__icon u-semantic-button link--opacity",attrs:{type:"button"},on:{click:function(t){return t.preventDefault(),e.scanQr(t)}}},[r("img",{attrs:{src:e.BASE_URL_PREFIX+"/img/icon-qr.svg",alt:"Scan QR Code",width:"24",height:"24"}})]),e._v(" "),r("Modal",{staticClass:"qr-scan__modal",attrs:{"modal-container-class":"qr-scan__modal-container",isOpen:e.isModalVisible,keepMarkup:!0},on:{"update:isOpen":function(t){e.isModalVisible=t},"update:is-open":function(t){e.isModalVisible=t},modalClose:e.stopScanQr}},[r("div",{staticClass:"qr-scan__wrap"},[r("div",{staticClass:"qr-scan__notice"},[r("Loader",{attrs:{isLoading:!0}}),e._v(" "),e.cameraError?r("div",[e._v("Allow camera access")]):e._e()],1),e._v(" "),r("video",{ref:"qrVideo",staticClass:"qr-scan__video",attrs:{autoplay:"",playsinline:"",muted:""},domProps:{muted:!0}}),e._v(" "),r("div",{directives:[{name:"show",rawName:"v-show",value:e.isPlaying,expression:"isPlaying"}],ref:"overlay",staticClass:"qr-scan__overlay"},[r("svg",{attrs:{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 238 238"}},[r("path",{attrs:{fill:"none","stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"3",d:"M31.3 2H10a8 8 0 0 0-8 8v21.3M206.8 2H228a8 8 0 0 1 8 8v21.3m0 175.4V228a8 8 0 0 1-8 8h-21.3m-175.4 0H10a8 8 0 0 1-8-8v-21.3"}})])])])])],1)}),[],!1,null,null,null).exports,$=r(530),y={ideFix:null,MAX_ITEM_COUNT:5,components:{VueSimpleSuggest:n.a,QrScan:_,Loader:m.a,InputMaskedInteger:$.a},directives:{checkEmpty:o.a},inheritAttrs:!1,props:{value:{type:[String,Number],required:!0},$value:{type:Object,required:!0},label:{type:String,required:!0},isInteger:{type:Boolean,default:!1},suggestionList:{type:Array,default:function(){return[]}},suggestionFilter:{type:Function,default:void 0},suggestionContent:{type:Function,default:void 0},suggestionMinInputLength:{type:Number,default:1}},data:function(){return{hasCamera:!1}},methods:{handleQrScanned:function(e){this.$emit("input",e),this.$value.$touch()},handleSuggestionClick:function(e,t){t.preventDefault()}}},k=Object(h.a)(y,(function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("label",{staticClass:"form-field form-field--qr",class:{"is-error":e.$value.$error,"form-field--with-icon":e.hasCamera}},[e.suggestionList&&e.suggestionList.length?r("VueSimpleSuggest",e._b({attrs:{value:e.value,list:e.suggestionList,"max-suggestions":e.$options.MAX_ITEM_COUNT,"min-length":e.suggestionMinInputLength,"filter-by-query":!0,filter:e.suggestionFilter,destyled:!0,controls:{showList:[38,40]},"value-attribute":"value","display-attribute":"value"},on:{input:function(t){return e.$emit("input",t)},blur:function(t){e.$value.$touch(),e.$emit("blur",t)},"suggestion-click":e.handleSuggestionClick},scopedSlots:e._u([e.suggestionContent?{key:"suggestion-item",fn:function(t){return[r("span",{domProps:{innerHTML:e._s(e.suggestionContent(t))}})]}}:null],null,!0)},"VueSimpleSuggest",e.$attrs,!1),[r("input",e._b({directives:[{name:"check-empty",rawName:"v-check-empty"}],staticClass:"form-field__input",attrs:{type:"text",spellcheck:"false"},domProps:{value:e.value}},"input",e.$attrs,!1)),e._v(" "),r("span",{staticClass:"form-field__label"},[e._v(e._s(e.label))])]):[e.isInteger?r("InputMaskedInteger",e._b({directives:[{name:"check-empty",rawName:"v-check-empty"}],staticClass:"form-field__input",attrs:{value:e.value},on:{input:function(t){return e.$emit("input",t)},blur:function(t){e.$value.$touch(),e.$emit("blur",t)}}},"InputMaskedInteger",e.$attrs,!1)):r("input",e._b({directives:[{name:"check-empty",rawName:"v-check-empty"}],staticClass:"form-field__input",attrs:{type:"text",autocapitalize:"off",spellcheck:"false"},domProps:{value:e.value},on:{input:function(t){return e.$emit("input",t.target.value)},blur:function(t){e.$value.$touch(),e.$emit("blur",t)}}},"input",e.$attrs,!1)),e._v(" "),r("span",{staticClass:"form-field__label"},[e._v(e._s(e.label))])],e._v(" "),r("Loader",{staticClass:"form-field__icon form-field__icon--loader",attrs:{isLoading:e.$value.$pending}}),e._v(" "),r("QrScan",{attrs:{qrVisible:e.hasCamera},on:{qrScanned:e.handleQrScanned,"update:qrVisible":function(t){e.hasCamera=t},"update:qr-visible":function(t){e.hasCamera=t}}})],2)}),[],!1,null,null,null);t.a=k.exports},535:function(e,t,r){"use strict";var n=r(549),o=r(551),l={components:{InlineSvg:n.a,ButtonCopy:o.a},props:{copyText:{type:String,required:!0}}},c=r(34),component=Object(c.a)(l,(function(){var e=this.$createElement,t=this._self._c||e;return t("ButtonCopy",{staticClass:"u-icon u-semantic-button link--opacity",attrs:{"aria-label":"Copy","copy-text":this.copyText}},[t("InlineSvg",{attrs:{src:this.BASE_URL_PREFIX+"/img/icon-copy.svg"}})],1)}),[],!1,null,null,null);t.a=component.exports},541:function(e,t,r){"use strict";var n=r(219),o={props:{value:{type:String,default:""}},computed:{listeners:function(){var e=this.$listeners,t=(e.input,e.blur,e.focus,Object(n.a)(e,["input","blur","focus"]));return t}},mounted:function(){this.updateValue(this.$refs.input.value)},methods:{updateValue:function(e){(e=e.toUpperCase())!==this.value&&this.$emit("input",e)}}},l=r(34),component=Object(l.a)(o,(function(){var e=this,t=e.$createElement;return(e._self._c||t)("input",e._g({ref:"input",domProps:{value:e.value},on:{input:function(t){return e.updateValue(t.target.value)},blur:function(t){return e.$emit("blur",t)},focus:function(t){return e.$emit("focus",t)}}},e.listeners))}),[],!1,null,null,null);t.a=component.exports},551:function(e,t,r){"use strict";var n=r(554),o={props:{copyText:{type:String,required:!0}},computed:{isClipboardSupported:function(){return n.b()}},methods:{copy:function(e){n.a(e)&&this.$store.commit("SET_SNACKBAR_ACTIVE")}}},l=r(34),component=Object(l.a)(o,(function(){var e=this,t=e.$createElement,r=e._self._c||t;return e.isClipboardSupported?r("button",{attrs:{type:"button"},on:{click:function(t){return e.copy(e.copyText)}}},[e._t("default")],2):e._e()}),[],!1,null,null,null);t.a=component.exports},555:function(e,t,r){"use strict";var n=r(528);r.n(n).a},557:function(e,t,r){"use strict";r(80);var n=r(219),o=r(556),l={ideFix:null,imaskAmount:{mask:Number,scale:18,signed:!1,thousandsSeparator:"",padFractionalZeros:!1,normalizeZeros:!1,radix:".",mapToRadix:[","]},directives:{imask:o.a},props:{value:{type:[String,Number],default:""}},data:function(){return{maskedValue:""}},computed:{listeners:function(){var e=this.$listeners,t=(e.input,Object(n.a)(e,["input"]));return t}},watch:{value:function(e){e!==this.maskedValue&&this.updateMaskState(e)}},mounted:function(){this.updateMaskState(this.value)},methods:{updateMaskState:function(e){this.$refs.input.maskRef.typedValue=e;var t=this.$refs.input.maskRef._value.length;this.$refs.input.maskRef._selection={start:t,end:t}},onAcceptInput:function(e){this.maskedValue=e.detail._unmaskedValue,this.$emit("input",e.detail._unmaskedValue)}}},c=r(34),component=Object(c.a)(l,(function(){var e=this.$createElement;return(this._self._c||e)("input",this._g({directives:[{name:"imask",rawName:"v-imask",value:this.$options.imaskAmount,expression:"$options.imaskAmount"}],ref:"input",attrs:{type:"text",autocapitalize:"off",inputmode:"decimal"},on:{accept:this.onAcceptInput}},this.listeners))}),[],!1,null,null,null);t.a=component.exports},645:function(e,t,r){"use strict";(function(e){r(54),r(43),r(38),r(81),r(92),r(47),r(8),r(15),r(21),r(25),r(39);var n=r(14),o=r(173),l=r(548),c=r(549),d=r(539),m=r(540),f=r.n(m),v=r(546),h=r.n(v),_=r(547),$=r.n(_),y=r(570),k=r(610),C=r(611),w=r(599),S=r(525),x=r(222),O=r(106),E=r(9),M=r(531),I=r(541),L=r(557),V=r(530),j=r(535);function P(object,e){var t=Object.keys(object);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(object);e&&(r=r.filter((function(e){return Object.getOwnPropertyDescriptor(object,e).enumerable}))),t.push.apply(t,r)}return t}function F(e){for(var i=1;i<arguments.length;i++){var source=null!=arguments[i]?arguments[i]:{};i%2?P(Object(source),!0).forEach((function(t){Object(n.a)(e,t,source[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(source)):P(Object(source)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(source,t))}))}return e}t.a={components:{QrcodeVue:l.a,InlineSvg:c.a,Modal:M.a,InputUppercase:I.a,InputMaskedAmount:L.a,InputMaskedInteger:V.a,ButtonCopyIcon:j.a},directives:{checkEmpty:S.a},filters:{pretty:O.j,uppercase:function(e){return e?e.toUpperCase():e}},mixins:[d.validationMixin],data:function(){var e=this.$store.getters.balance;return{isFormSending:!1,serverError:"",check:null,password:"",form:{nonce:null,dueBlock:999999999,value:null,coinSymbol:e&&e.length?e[0].coin:"",password:"",feeCoinSymbol:e&&e.length?e[0].coin:""},deeplink:"",isCheckQrModalVisible:!1,isLinkQrModalVisible:!1}},validations:{form:{nonce:{required:f.a},dueBlock:{required:f.a},value:{required:f.a},coinSymbol:{required:f.a,minLength:h()(3),maxLength:$()(10)},password:{required:f.a},feeCoinSymbol:{minLength:h()(3),maxLength:$()(10)}}},computed:F({},Object(o.b)({balance:"balance"}),{deeplinkPretty:function(){return this.deeplink.replace("https://","")}}),methods:{submit:function(){var t=this;this.isFormSending||(this.$v.$invalid?this.$v.$touch():(this.check=null,this.password="",this.deeplink="",this.isFormSending=!0,this.serverError="",this.$store.dispatch("FETCH_ADDRESS_ENCRYPTED").then((function(){try{t.check=Object(y.b)(F({privateKey:t.$store.getters.privateKey,chainId:t.$store.getters.CHAIN_ID},t.form,{gasCoin:t.form.feeCoinSymbol})),t.password=t.form.password;var r=new C.a({privateKey:t.$store.getters.privateKey,check:t.check,password:t.form.password}),n=(l=r,(c=new w.a(l.txData)).proof=e.from([]),F({},l,{txData:c.serialize()}));delete n.privateKey,delete n.gasPrice;var o=E.p===E.q?"https://testnet.bip.to":void 0;t.deeplink=Object(k.a)(F({},n,{password:t.form.password}),o),t.clearForm()}catch(e){t.serverError=Object(x.a)(e)}var l,c;t.isFormSending=!1})).catch((function(e){t.isFormSending=!1,t.serverError=Object(x.a)(e)}))))},clearForm:function(){parseInt(this.form.nonce,10).toString()===this.form.nonce?this.form.nonce=(parseInt(this.form.nonce,10)+1).toString():this.form.nonce="",this.form.dueBlock=999999999,this.form.value=null,this.form.coinSymbol=this.balance&&this.balance.length?this.balance[0].coin:"",this.form.password="",this.form.feeCoinSymbol=this.balance&&this.balance.length?this.balance[0].coin:"",this.$v.$reset()}}}}).call(this,r(13).Buffer)},706:function(e,t,r){"use strict";r.r(t);r(62),r(8);var n=r(532),o=(r(54),r(43),r(38),r(81),r(92),r(47),r(21),r(39),r(14)),l=r(548),c=r(539),d=r(540),m=r.n(d),f=r(545),v=r.n(f),h=r(654),_=r(533),$=r(538),y=r(529),k=r(525),C=r(222),w=r(106),S=r(534),x=r(535),O=r(526);function E(object,e){var t=Object.keys(object);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(object);e&&(r=r.filter((function(e){return Object.getOwnPropertyDescriptor(object,e).enumerable}))),t.push.apply(t,r)}return t}function M(e){for(var i=1;i<arguments.length;i++){var source=null!=arguments[i]?arguments[i]:{};i%2?E(Object(source),!0).forEach((function(t){Object(o.a)(e,t,source[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(source)):E(Object(source)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(source,t))}))}return e}var I={components:{QrcodeVue:l.a,FieldQr:S.a,ButtonCopyIcon:x.a,Loader:O.a},directives:{checkEmpty:k.a},filters:{uppercase:function(e){return e?e.toUpperCase():e}},mixins:[c.validationMixin],data:function(){return{isFormSending:!1,serverError:"",serverSuccess:"",form:{check:"",password:"",nonce:""},signedTx:null}},validations:function(){var form={check:{required:m.a,validCheck:_.f},password:{required:m.a}};return this.$store.getters.isOfflineMode&&(form.nonce={required:m.a,minValue:v()(1)}),{form:form}},methods:{submit:function(){this.$store.getters.isOfflineMode?this.generateTx():this.postTx()},generateTx:function(){this.$v.$invalid?this.$v.$touch():(this.signedTx=null,this.serverError="",this.serverSuccess="",this.signedTx=Object($.a)(new h.a(M({privateKey:this.$store.getters.privateKey,chainId:this.$store.getters.CHAIN_ID},this.form)),{privateKey:this.$store.getters.privateKey}).serialize().toString("hex"),this.clearForm())},postTx:function(){var e=this;this.isFormSending||(this.$v.$invalid?this.$v.$touch():(this.isFormSending=!0,this.signedTx=null,this.serverError="",this.serverSuccess="",this.$store.dispatch("FETCH_ADDRESS_ENCRYPTED").then((function(){Object(y.f)(new h.a(M({privateKey:e.$store.getters.privateKey},e.form))).then((function(t){e.isFormSending=!1,e.serverSuccess=t,e.clearForm()})).catch((function(t){console.log(t),e.isFormSending=!1,e.serverError=Object(C.a)(t)}))})).catch((function(t){e.isFormSending=!1,e.serverError=Object(C.a)(t)}))))},clearForm:function(){this.form.check="",this.form.password="",this.form.nonce&&this.$store.getters.isOfflineMode?this.form.nonce+=1:this.form.nonce="",this.$v.$reset()},getExplorerTxUrl:w.d}},L=r(34),V=Object(L.a)(I,(function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("form",{staticClass:"panel__section",attrs:{novalidate:""},on:{submit:function(t){return t.preventDefault(),e.submit(t)}}},[r("div",{staticClass:"u-grid u-grid--small u-grid--vertical-margin--small"},[r("div",{staticClass:"u-cell"},[r("FieldQr",{attrs:{$value:e.$v.form.check,label:e.$td("Check","form.checks-redeem-check")},model:{value:e.form.check,callback:function(t){e.$set(e.form,"check","string"==typeof t?t.trim():t)},expression:"form.check"}}),e._v(" "),e.$v.form.check.$dirty&&!e.$v.form.check.required?r("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Check","form.checks-redeem-check-error-required")))]):e.$v.form.check.$dirty&&!e.$v.form.check.validCheck?r("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Check is invalid","form.checks-redeem-check-error-invalid")))]):e._e(),e._v(" "),r("div",{staticClass:"form-field__help"},[e._v(e._s(e.$td("The identifier the issuer gave you. Starts with","form.checks-redeem-check-help"))+" "),r("strong",[e._v("Mc")])])],1),e._v(" "),r("div",{staticClass:"u-cell"},[r("label",{staticClass:"form-field",class:{"is-error":e.$v.form.password.$error}},[r("input",{directives:[{name:"check-empty",rawName:"v-check-empty"},{name:"model",rawName:"v-model.trim",value:e.form.password,expression:"form.password",modifiers:{trim:!0}}],staticClass:"form-field__input",attrs:{type:"text",autocapitalize:"off",spellcheck:"false"},domProps:{value:e.form.password},on:{blur:[function(t){return e.$v.form.password.$touch()},function(t){return e.$forceUpdate()}],input:function(t){t.target.composing||e.$set(e.form,"password",t.target.value.trim())}}}),e._v(" "),r("span",{staticClass:"form-field__label"},[e._v(e._s(e.$td("Password","form.checks-redeem-password")))])]),e._v(" "),e.$v.form.password.$dirty&&!e.$v.form.password.required?r("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Enter password","form.checks-redeem-password-error-required")))]):e._e()]),e._v(" "),e.$store.getters.isOfflineMode?r("div",{staticClass:"u-cell u-cell--small--1-2"},[r("FieldQr",{attrs:{$value:e.$v.form.nonce,label:e.$td("Nonce","form.checks-issue-nonce"),isInteger:!0},model:{value:e.form.nonce,callback:function(t){e.$set(e.form,"nonce",t)},expression:"form.nonce"}}),e._v(" "),e.$v.form.nonce.$error&&!e.$v.form.nonce.required?r("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Enter nonce","form.checks-issue-nonce-error-required")))]):e.$v.form.nonce.$dirty&&!e.$v.form.nonce.minValue?r("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Minimum nonce is 1","form.generate-nonce-error-min")))]):e._e(),e._v(" "),r("div",{staticClass:"form-field__help"},[e._v(e._s(e.$td("Tx's unique ID. Should be: current user's tx count + 1","form.generate-nonce-help")))])],1):e._e(),e._v(" "),e.$store.getters.isOfflineMode?r("div",{staticClass:"u-cell u-cell--xlarge--1-2"},[r("button",{staticClass:"button button--main button--full",class:{"is-disabled":e.$v.$invalid}},[e._v("\n                "+e._s(e.$td("Generate","form.generate-button"))+"\n            ")])]):e._e(),e._v(" "),e.$store.getters.isOfflineMode?e._e():r("div",{staticClass:"u-cell"},[r("button",{staticClass:"button button--main button--full",class:{"is-loading":e.isFormSending,"is-disabled":e.$v.$invalid}},[r("span",{staticClass:"button__content"},[e._v(e._s(e.$td("Redeem","form.checks-redeem-button")))]),e._v(" "),r("Loader",{staticClass:"button__loader",attrs:{isLoading:!0}})],1),e._v(" "),e.serverError?r("div",{staticClass:"form-field__error"},[e._v(e._s(e.serverError))]):e._e()]),e._v(" "),e.serverSuccess?r("div",{staticClass:"u-cell"},[r("strong",[e._v(e._s(e.$td("Tx sent:","form.tx-sent")))]),e._v(" "),r("a",{staticClass:"link--default u-text-break",attrs:{href:e.getExplorerTxUrl(e.serverSuccess),target:"_blank"}},[e._v(e._s(e.serverSuccess))])]):e._e(),e._v(" "),e.signedTx?r("div",{staticClass:"u-cell u-cell--order-2"},[r("dl",[r("dt",[e._v(e._s(e.$td("Signed tx:","form.generate-result-tx")))]),e._v(" "),r("dd",{staticClass:"u-icon-wrap"},[r("span",{staticClass:"u-select-all u-icon-text"},[e._v("\n                            "+e._s(e.signedTx)+"\n                        ")]),e._v(" "),r("ButtonCopyIcon",{staticClass:"u-icon--copy--right",attrs:{"copy-text":e.signedTx}})],1)]),e._v(" "),r("br"),e._v(" "),r("qrcode-vue",{attrs:{value:e.signedTx,size:200,level:"L"}})],1):e._e()])])}),[],!1,null,null,null).exports,j=r(645).a,P={components:{CheckRedeemForm:V,CheckIssueForm:Object(L.a)(j,(function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("form",{staticClass:"panel__section",attrs:{novalidate:""},on:{submit:function(t){return t.preventDefault(),e.submit(t)}}},[r("div",{staticClass:"u-grid u-grid--small u-grid--vertical-margin--small"},[r("div",{staticClass:"u-cell u-cell--medium--1-3 u-cell--xlarge--1-2"},[r("label",{staticClass:"form-field",class:{"is-error":e.$v.form.nonce.$error}},[r("input",{directives:[{name:"check-empty",rawName:"v-check-empty"},{name:"model",rawName:"v-model",value:e.form.nonce,expression:"form.nonce"}],staticClass:"form-field__input",attrs:{type:"text"},domProps:{value:e.form.nonce},on:{blur:function(t){return e.$v.form.nonce.$touch()},input:function(t){t.target.composing||e.$set(e.form,"nonce",t.target.value)}}}),e._v(" "),r("span",{staticClass:"form-field__label"},[e._v(e._s(e.$td("Nonce","form.checks-issue-nonce")))])]),e._v(" "),e.$v.form.nonce.$dirty&&!e.$v.form.nonce.required?r("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Enter nonce","form.checks-issue-nonce-error-required")))]):e._e(),e._v(" "),r("div",{staticClass:"form-field__help"},[e._v(e._s(e.$td("Check's unique ID. Used for issuing several identical checks.","form.checks-issue-nonce-help")))])]),e._v(" "),r("div",{staticClass:"u-cell u-cell--medium--1-3 u-cell--xlarge--1-4"},[r("label",{staticClass:"form-field",class:{"is-error":e.$v.form.coinSymbol.$error}},[e.balance&&e.balance.length?r("select",{directives:[{name:"check-empty",rawName:"v-check-empty"},{name:"model",rawName:"v-model",value:e.form.coinSymbol,expression:"form.coinSymbol"}],staticClass:"form-field__input form-field__input--select",on:{blur:function(t){return e.$v.form.coinSymbol.$touch()},change:function(t){var r=Array.prototype.filter.call(t.target.options,(function(e){return e.selected})).map((function(e){return"_value"in e?e._value:e.value}));e.$set(e.form,"coinSymbol",t.target.multiple?r:r[0])}}},e._l(e.balance,(function(t){return r("option",{key:t.coin,domProps:{value:t.coin}},[e._v("\n                            "+e._s(e._f("uppercase")(t.coin))+" ("+e._s(e._f("pretty")(t.amount))+")\n                        ")])})),0):r("InputUppercase",{directives:[{name:"check-empty",rawName:"v-check-empty"}],staticClass:"form-field__input",attrs:{type:"text"},on:{blur:function(t){return e.$v.form.coinSymbol.$touch()}},model:{value:e.form.coinSymbol,callback:function(t){e.$set(e.form,"coinSymbol","string"==typeof t?t.trim():t)},expression:"form.coinSymbol"}}),e._v(" "),r("span",{staticClass:"form-field__label"},[e._v(e._s(e.$td("Coin","form.coin")))])],1),e._v(" "),e.$v.form.coinSymbol.$dirty&&!e.$v.form.coinSymbol.required?r("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Enter coin symbol","form.coin-error-required")))]):e.$v.form.coinSymbol.$dirty&&!e.$v.form.coinSymbol.minLength?r("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Min 3 letters","form.coin-error-min")))]):e.$v.form.coinSymbol.$dirty&&!e.$v.form.coinSymbol.maxLength?r("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Max 10 letters","form.coin-error-max")))]):e._e()]),e._v(" "),r("div",{staticClass:"u-cell u-cell--medium--1-3 u-cell--xlarge--1-4"},[r("label",{staticClass:"form-field",class:{"is-error":e.$v.form.value.$error}},[r("InputMaskedAmount",{directives:[{name:"check-empty",rawName:"v-check-empty"}],staticClass:"form-field__input",on:{blur:function(t){return e.$v.form.value.$touch()}},model:{value:e.form.value,callback:function(t){e.$set(e.form,"value",t)},expression:"form.value"}}),e._v(" "),r("span",{staticClass:"form-field__label"},[e._v(e._s(e.$td("Amount","form.checks-issue-amount")))])],1),e._v(" "),e.$v.form.value.$dirty&&!e.$v.form.value.required?r("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Enter amount","form.amount-error-required")))]):e._e()]),e._v(" "),r("div",{staticClass:"u-cell u-cell--medium--1-3 u-cell--xlarge--1-2"},[r("label",{staticClass:"form-field",class:{"is-error":e.$v.form.password.$error}},[r("input",{directives:[{name:"check-empty",rawName:"v-check-empty"},{name:"model",rawName:"v-model.trim",value:e.form.password,expression:"form.password",modifiers:{trim:!0}}],staticClass:"form-field__input",attrs:{type:"text",autocapitalize:"off",spellcheck:"false"},domProps:{value:e.form.password},on:{blur:[function(t){return e.$v.form.password.$touch()},function(t){return e.$forceUpdate()}],input:function(t){t.target.composing||e.$set(e.form,"password",t.target.value.trim())}}}),e._v(" "),r("span",{staticClass:"form-field__label"},[e._v(e._s(e.$td("Password","form.checks-issue-pass")))])]),e._v(" "),e.$v.form.password.$dirty&&!e.$v.form.password.required?r("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Enter password","form.checks-issue-pass-error-required")))]):e._e()]),e._v(" "),r("div",{staticClass:"u-cell u-cell--medium--1-3 u-cell--xlarge--1-4"},[r("label",{staticClass:"form-field",class:{"is-error":e.$v.form.feeCoinSymbol.$error}},[e.balance&&e.balance.length?r("select",{directives:[{name:"model",rawName:"v-model",value:e.form.feeCoinSymbol,expression:"form.feeCoinSymbol"}],staticClass:"form-field__input form-field__input--select is-not-empty",on:{change:function(t){var r=Array.prototype.filter.call(t.target.options,(function(e){return e.selected})).map((function(e){return"_value"in e?e._value:e.value}));e.$set(e.form,"feeCoinSymbol",t.target.multiple?r:r[0])}}},e._l(e.balance,(function(t){return r("option",{key:t.coin,domProps:{value:t.coin}},[e._v("\n                            "+e._s(e._f("uppercase")(t.coin))+" ("+e._s(e._f("pretty")(t.amount))+")\n                        ")])})),0):r("InputUppercase",{directives:[{name:"check-empty",rawName:"v-check-empty"}],staticClass:"form-field__input",attrs:{type:"text"},on:{blur:function(t){return e.$v.form.feeCoinSymbol.$touch()}},model:{value:e.form.feeCoinSymbol,callback:function(t){e.$set(e.form,"feeCoinSymbol","string"==typeof t?t.trim():t)},expression:"form.feeCoinSymbol"}}),e._v(" "),r("span",{staticClass:"form-field__label"},[e._v(e._s(e.$td("Coin to pay fee","form.fee")))])],1),e._v(" "),e.$v.form.feeCoinSymbol.$dirty&&!e.$v.form.feeCoinSymbol.minLength?r("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Min 3 letters","form.coin-error-min")))]):e.$v.form.feeCoinSymbol.$dirty&&!e.$v.form.feeCoinSymbol.maxLength?r("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Max 10 letters","form.coin-error-max")))]):e._e()]),e._v(" "),r("div",{staticClass:"u-cell u-cell--medium--1-3 u-cell--xlarge--1-4"},[r("label",{staticClass:"form-field",class:{"is-error":e.$v.form.dueBlock.$error}},[r("InputMaskedInteger",{directives:[{name:"check-empty",rawName:"v-check-empty"}],staticClass:"form-field__input",on:{blur:function(t){return e.$v.form.dueBlock.$touch()}},model:{value:e.form.dueBlock,callback:function(t){e.$set(e.form,"dueBlock",t)},expression:"form.dueBlock"}}),e._v(" "),r("span",{staticClass:"form-field__label"},[e._v(e._s(e.$td("Due block","form.checks-issue-due")))])],1),e._v(" "),e.$v.form.dueBlock.$dirty&&!e.$v.form.dueBlock.required?r("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Enter block number","form.checks-issue-due-error-required")))]):e._e()]),e._v(" "),r("div",{staticClass:"u-cell"},[r("button",{staticClass:"button button--main button--full",class:{"is-disabled":e.$v.$invalid}},[e._v(e._s(e.$td("Issue","form.checks-issue-button")))]),e._v(" "),e.serverError?r("div",{staticClass:"form-field__error"},[e._v(e._s(e.serverError))]):e._e()]),e._v(" "),e.check?r("div",{staticClass:"u-cell"},[r("dl",[r("dt",[e._v(e._s(e.$td("Signed check:","form.checks-issue-result-check")))]),e._v(" "),r("dd",{staticClass:"u-icon-wrap"},[r("span",{staticClass:"u-select-all u-icon-text"},[e._v("\n                            "+e._s(e.check)+"\n                        ")]),e._v(" "),r("ButtonCopyIcon",{staticClass:"u-icon--copy--right",attrs:{"copy-text":e.check}}),e._v(" "),r("button",{staticClass:"u-icon u-icon--qr--right u-semantic-button link--opacity",on:{click:function(t){e.isCheckQrModalVisible=!0}}},[r("InlineSvg",{attrs:{src:e.BASE_URL_PREFIX+"/img/icon-qr.svg",width:"24",height:"24"}})],1)],1),e._v(" "),r("dt",[e._v(e._s(e.$td("Password:","form.checks-issue-result-pass")))]),e._v(" "),r("dd",{staticClass:"u-select-all"},[e._v(e._s(e.password))]),e._v(" "),r("dt",[e._v("\n                        "+e._s(e.$td("Link to redeem.","form.checks-issue-result-link"))+" "),r("br"),e._v(" "),r("span",{staticClass:"u-emoji"},[e._v("⚠️")]),e._v(" "+e._s(e.$td("Warning! Password included in the link. Send the link only directly to the recipient.","form.checks-issue-result-link-warning"))+"\n                    ")]),e._v(" "),r("dd",{staticClass:"u-icon-wrap"},[r("span",{staticClass:"u-select-all u-icon-text u-text-break-all"},[r("a",{staticClass:"link--main link--hover",attrs:{href:e.deeplink,target:"_blank"}},[e._v(e._s(e.deeplinkPretty))])]),e._v(" "),r("ButtonCopyIcon",{staticClass:"u-icon--copy--right",attrs:{"copy-text":e.deeplink}}),e._v(" "),r("button",{staticClass:"u-icon u-icon--qr--right u-semantic-button link--opacity",on:{click:function(t){e.isLinkQrModalVisible=!0}}},[r("InlineSvg",{attrs:{src:e.BASE_URL_PREFIX+"/img/icon-qr.svg",width:"24",height:"24"}})],1)],1)])]):e._e()]),e._v(" "),r("Modal",{staticClass:"qr-modal",attrs:{isOpen:e.isCheckQrModalVisible},on:{"update:isOpen":function(t){e.isCheckQrModalVisible=t},"update:is-open":function(t){e.isCheckQrModalVisible=t}}},[r("QrcodeVue",{staticClass:"qr-modal__layer",attrs:{value:e.check,size:280,level:"L"}})],1),e._v(" "),r("Modal",{staticClass:"qr-modal",attrs:{isOpen:e.isLinkQrModalVisible},on:{"update:isOpen":function(t){e.isLinkQrModalVisible=t},"update:is-open":function(t){e.isLinkQrModalVisible=t}}},[r("QrcodeVue",{staticClass:"qr-modal__layer",attrs:{value:e.deeplink,size:280,level:"L"}})],1)],1)}),[],!1,null,null,null).exports},fetch:function(e){var t=e.app;return e.store.commit("SET_SECTION_NAME",t.$td("Checks","common.page-checks")),Promise.resolve()},head:function(){var title=Object(n.a)(this.$store.state.sectionName,this.$i18n.locale),e=this.$td("Issue a check that will later be redeemed by the person of your choice or claim a check someone has written out to you.","checks.seo-description"),t="en"===this.$i18n.locale?"":"-"+this.$i18n.locale;return{title:title,meta:[{hid:"og-title",name:"og:title",content:title},{hid:"description",name:"description",content:e},{hid:"og-description",name:"og:description",content:e},{hid:"og-image",name:"og:image",content:"".concat(this.BASE_URL_PREFIX,"/img/social-share-checks").concat(t,".png")}]}}},F=Object(L.a)(P,(function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("section",{staticClass:"u-section u-container"},[r("div",{staticClass:"panel"},[r("div",{staticClass:"panel__header"},[r("h1",{staticClass:"panel__header-title"},[e._v("\n                "+e._s(e.$td("Redeem check","checks.redeem-title"))+"\n            ")]),e._v(" "),r("p",{staticClass:"panel__header-description"},[e._v("\n                "+e._s(e.$td("Claim a check someone has written out to you.","checks.redeem-description"))+"\n            ")])]),e._v(" "),r("CheckRedeemForm")],1),e._v(" "),r("div",{staticClass:"panel"},[r("div",{staticClass:"panel__header"},[r("h1",{staticClass:"panel__header-title"},[e._v("\n                "+e._s(e.$td("Issue check","checks.issue-title"))+"\n            ")]),e._v(" "),r("p",{staticClass:"panel__header-description"},[e._v("\n                "+e._s(e.$td("Issue a check that will later be redeemed by the person of your choice.","checks.issue-description"))+"\n            ")])]),e._v(" "),r("CheckIssueForm")],1)])}),[],!1,null,null,null);t.default=F.exports}}]);