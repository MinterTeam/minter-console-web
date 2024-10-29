(window.webpackJsonp=window.webpackJsonp||[]).push([[8],{1422:function(e,t,n){"use strict";n.r(t);n(1),n(21);var r=n(766),o=(n(7),n(788)),c=n(751),l=n(743),d=n(399),v=n(100),f=n(745),m={components:{QrcodeVue:o.a,Loader:f.a},directives:{checkEmpty:l.a},filters:{pretty:v.s,uppercase:function(e){return e?e.toUpperCase():e}},data:function(){return{isFormSending:!1,serverError:"",serverSuccess:""}},computed:{},methods:{submit:function(){var e=this;this.isFormSending||(this.isFormSending=!0,this.serverError="",this.serverSuccess="",Object(c.f)(this.$store.getters.address).then((function(t){e.isFormSending=!1,e.serverSuccess=t.toString()})).catch((function(t){console.log(t),e.isFormSending=!1,e.serverError=Object(d.a)(t)})))},getExplorerTxUrl:v.l}},h=n(60),component=Object(h.a)(m,(function(){var e=this,t=e._self._c;return t("form",{staticClass:"panel__section",attrs:{novalidate:""},on:{submit:function(t){return t.preventDefault(),e.submit.apply(null,arguments)}}},[t("div",{staticClass:"u-grid u-grid--small u-grid--vertical-margin--small"},[t("div",{staticClass:"u-cell"},[t("button",{staticClass:"button button--main button--full",class:{"is-loading":e.isFormSending}},[t("span",{staticClass:"button__content"},[e._v(e._s(e.$td("Get nonce","form.broadcast-nonce-button")))]),e._v(" "),t("Loader",{staticClass:"button__loader",attrs:{isLoading:!0}})],1),e._v(" "),e.serverError?t("div",{staticClass:"form-field__error"},[e._v(e._s(e.serverError))]):e._e()]),e._v(" "),e.serverSuccess?t("div",{staticClass:"u-cell"},[t("p",[t("strong",[e._v(e._s(e.$td("Nonce for a new transaction:","form.broadcast-nonce-got")))]),e._v(" "+e._s(e.serverSuccess)+"\n            ")]),e._v(" "),t("p",[t("qrcode-vue",{attrs:{value:e.serverSuccess,size:100,level:"L"}})],1)]):e._e()])])}),[],!1,null,null,null),_=component.exports,y=(n(266),n(748)),w=n(747),C={components:{FieldQr:n(764).a,Loader:f.a},directives:{checkEmpty:l.a},filters:{pretty:v.s,uppercase:function(e){return e?e.toUpperCase():e}},mixins:[y.a],data:function(){return{isFormSending:!1,serverError:"",serverSuccess:"",form:{signedTx:""}}},validations:function(){return{form:{signedTx:{required:w.a}}}},computed:{},methods:{submit:function(){var e=this;this.isFormSending||(this.$v.$invalid?this.$v.$touch():(this.isFormSending=!0,this.serverError="",this.serverSuccess="",Object(c.g)(this.form.signedTx).then((function(t){e.isFormSending=!1,e.serverSuccess=t.hash,e.clearForm()})).catch((function(t){console.log(t),e.isFormSending=!1,e.serverError=Object(d.a)(t)}))))},clearForm:function(){this.form.signedTx="",this.$v.$reset()},getExplorerTxUrl:v.l}},$=Object(h.a)(C,(function(){var e=this,t=e._self._c;return t("form",{staticClass:"panel__section",attrs:{novalidate:""},on:{submit:function(t){return t.preventDefault(),e.submit.apply(null,arguments)}}},[t("div",{staticClass:"u-grid u-grid--small u-grid--vertical-margin--small"},[t("div",{staticClass:"u-cell"},[t("FieldQr",{attrs:{$value:e.$v.form.signedTx,label:e.$td("Signed tx","form.broadcast-tx")},model:{value:e.form.signedTx,callback:function(t){e.$set(e.form,"signedTx","string"==typeof t?t.trim():t)},expression:"form.signedTx"}}),e._v(" "),e.$v.form.signedTx.$dirty&&!e.$v.form.signedTx.required?t("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Enter signed tx","form.broadcast-tx-error-required")))]):e._e()],1),e._v(" "),t("div",{staticClass:"u-cell"},[t("button",{staticClass:"button button--main button--full",class:{"is-loading":e.isFormSending,"is-disabled":e.$v.$invalid}},[t("span",{staticClass:"button__content"},[e._v(e._s(e.$td("Send","form.broadcast-tx-button")))]),e._v(" "),t("Loader",{staticClass:"button__loader",attrs:{isLoading:!0}})],1),e._v(" "),e.serverError?t("div",{staticClass:"form-field__error"},[e._v(e._s(e.serverError))]):e._e()]),e._v(" "),e.serverSuccess?t("div",{staticClass:"u-cell"},[t("strong",[e._v(e._s(e.$td("Tx sent:","form.tx-sent")))]),e._v(" "),t("a",{staticClass:"link--default u-text-break",attrs:{href:e.getExplorerTxUrl(e.serverSuccess),target:"_blank"}},[e._v(e._s(e.serverSuccess))])]):e._e()])])}),[],!1,null,null,null),O={components:{BroadcastNonceForm:_,BroadcastSendForm:$.exports},fetch:function(e){var t=e.app;return e.store.commit("SET_SECTION_NAME",t.$td("Broadcast","common.page-broadcast")),Promise.resolve()},head:function(){var title=Object(r.a)(this.$store.state.sectionName,this.$i18n.locale),e=this.$td("Send tx signed on the offline device","broadcast.seo-description"),t="en"===this.$i18n.locale?"":"-"+this.$i18n.locale;return{title:title,meta:[{hid:"og-title",name:"og:title",content:title},{hid:"description",name:"description",content:e},{hid:"og-description",name:"og:description",content:e},{hid:"og-image",name:"og:image",content:"".concat(this.BASE_URL_PREFIX,"/img/social-share-broadcast").concat(t,".png")}]}}},k=Object(h.a)(O,(function(){var e=this,t=e._self._c;return t("section",{staticClass:"u-section u-container"},[t("div",{staticClass:"panel"},[t("div",{staticClass:"panel__header"},[t("h1",{staticClass:"panel__header-title"},[e._v("\n                "+e._s(e.$td("Get nonce","broadcast.nonce-title"))+"\n            ")]),e._v(" "),t("p",{staticClass:"panel__header-description"},[e._v("\n                "+e._s(e.$td("Get nonce needed to generate a new tx on an offline device.","broadcast.nonce-description"))+"\n            ")])]),e._v(" "),t("BroadcastNonceForm")],1),e._v(" "),t("div",{staticClass:"panel"},[t("div",{staticClass:"panel__header"},[t("h1",{staticClass:"panel__header-title"},[e._v("\n                "+e._s(e.$td("Send signed tx","broadcast.tx-title"))+"\n            ")]),e._v(" "),t("p",{staticClass:"panel__header-description"},[e._v("\n                "+e._s(e.$td("Send a tx generated on an offline device.","broadcast.tx-description"))+"\n            ")])]),e._v(" "),t("BroadcastSendForm")],1)])}),[],!1,null,null,null);t.default=k.exports},743:function(e,t,n){"use strict";n(57);function r(e){return"SELECT"===e.nodeName.toUpperCase()}function o(e){c(e.target)}function c(e){setTimeout((function(){e.value.length?e.classList.add("is-not-empty"):e.classList.remove("is-not-empty")}),0)}t.a={bind:function(e,t,n){c(e),r(e)?e.addEventListener("change",o):e.addEventListener("input",o),t.value&&e.addEventListener(t.value,o)},componentUpdated:function(e,t){c(e),t.oldValue!==t.value&&e.removeEventListener(t.oldValue,o),t.value&&e.addEventListener(t.value,o)},unbind:function(e,t){r(e)?e.removeEventListener("change",o):e.removeEventListener("input",o),t.value&&e.removeEventListener(t.value,o)}}},745:function(e,t,n){"use strict";var r={props:{isLoading:{type:Boolean,default:!1}}},o=(n(774),n(60)),component=Object(o.a)(r,(function(){var e=this,t=e._self._c;return e.isLoading?t("svg",{staticClass:"loader",attrs:{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 28 28"}},[t("circle",{staticClass:"loader__path",attrs:{cx:"14",cy:"14",r:"12"}})]):e._e()}),[],!1,null,null,null);t.a=component.exports},751:function(e,t,n){"use strict";n.d(t,"h",(function(){return P})),n.d(t,"g",(function(){return F})),n.d(t,"f",(function(){return V})),n.d(t,"a",(function(){return I})),n.d(t,"c",(function(){return N})),n.d(t,"b",(function(){return D})),n.d(t,"d",(function(){return W})),n.d(t,"i",(function(){return Q})),n.d(t,"j",(function(){return H})),n.d(t,"e",(function(){return z}));n(31),n(32),n(35),n(48),n(30),n(52);var r=n(16),o=n(6),c=(n(49),n(1),n(42),n(41),n(14),n(36),n(736)),l=n(265),d=n(805),v=n(806),f=n(795),m=n(796),h=n(808),_=n(810),y=n(811),w=n(773),C=n(233),$=n(789),O=(n(797),n(799)),k=n(4),S=n(206),E=n(536),j=n(81);function L(object,e){var t=Object.keys(object);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(object);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(object,e).enumerable}))),t.push.apply(t,n)}return t}function x(e){for(var i=1;i<arguments.length;i++){var source=null!=arguments[i]?arguments[i]:{};i%2?L(Object(source),!0).forEach((function(t){Object(o.a)(e,t,source[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(source)):L(Object(source)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(source,t))}))}return e}var T=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:Object(S.a)();return e=Object(c.a)(e,{enabledByDefault:!1}),e=Object(E.a)(e,{time:500,leading:!1})}(),M=new d.a({apiType:"gate",baseURL:k.r,chainId:k.i,adapter:T}),P=Object(v.b)(M),F=Object(f.a)(M),V=Object(m.a)(M),I=Object(v.a)(M),R=new l.a({ttl:5e3,max:100}),B=function(e,t){return e.sellAll?Object(_.a)(M,{cache:R})(e,t):Object(h.a)(M,{cache:R})(e,t)},A=new y.a(M,{cache:R});function N(e,t){return e.valueToSell&&Number(e.valueToSell)?e.findRoute&&e.swapFrom!==C.c.BANCOR?Object(j.m)(e.coinToSell,e.coinToBuy,{sellAmount:e.valueToSell,swapFrom:e.swapFrom},x(x({},t),{},{cache:R})).then((function(n){var r;return Promise.all([B(x(x({},e),{},{route:null===(r=n.coins)||void 0===r?void 0:r.map((function(e){return e.id})).slice(1,-1),swapFrom:n.swapType}),t),Promise.resolve(n.coins)])})).then((function(e){var t=Object(r.a)(e,2),n=t[0],o=t[1];return x(x({},n),{},{route:o})})):B(e,t):Promise.reject(new Error("Value to sell not specified"))}function D(e,t){return e.valueToBuy&&Number(e.valueToBuy)?e.findRoute&&e.swapFrom!==C.c.BANCOR?Object(j.m)(e.coinToSell,e.coinToBuy,{buyAmount:e.valueToBuy,swapFrom:e.swapFrom},x(x({},t),{},{cache:R})).then((function(n){var r;return Promise.all([A(x(x({},e),{},{route:null===(r=n.coins)||void 0===r?void 0:r.map((function(e){return e.id})).slice(1,-1),swapFrom:n.swapType}),t),Promise.resolve(n.coins)])})).then((function(e){var t=Object(r.a)(e,2),n=t[0],o=t[1];return x(x({},n),{},{route:o})})):A(e,t):Promise.reject(new Error("Value to buy not specified"))}var U=new l.a({ttl:6e4,max:100}),W=new w.b(M,{cache:R},{cache:U}),Q=Object($.b)(M,{cache:U}),H=Object($.c)(M,{cache:U}),z=(new $.a(M,{cache:U}),new O.a(M,{cache:U}))},753:function(e,t,n){"use strict";var r=n(6),o=n(398),c=(n(49),n(31),n(32),n(35),n(1),n(48),n(30),n(52),n(802),n(813)),l=["input"];function d(object,e){var t=Object.keys(object);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(object);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(object,e).enumerable}))),t.push.apply(t,n)}return t}function v(e){for(var i=1;i<arguments.length;i++){var source=null!=arguments[i]?arguments[i]:{};i%2?d(Object(source),!0).forEach((function(t){Object(r.a)(e,t,source[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(source)):d(Object(source)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(source,t))}))}return e}var f={imaskAmount:{mask:Number,scale:18,signed:!1,thousandsSeparator:"",padFractionalZeros:!1,normalizeZeros:!1,radix:".",mapToRadix:[",","ю","Ю","б","Б"]},directives:{imask:c.a},props:{value:{type:[String,Number],default:""},scale:{type:[String,Number]}},emits:["input"],data:function(){return{maskedValue:""}},computed:{listeners:function(){var e=this.$listeners,t=(e.input,Object(o.a)(e,l));return t},imaskOptions:function(){var e;return v(v({},this.$options.imaskAmount),{},{scale:null!==(e=this.scale)&&void 0!==e?e:this.$options.imaskAmount.scale})}},watch:{value:function(e){e!==this.maskedValue&&this.updateMaskState(e)}},mounted:function(){this.updateMaskState(this.value)},methods:{updateMaskState:function(e){if(this.$refs.input.maskRef){this.$refs.input.maskRef.typedValue=e;var t=this.$refs.input.maskRef._value.length;this.$refs.input.maskRef._selection={start:t,end:t}}},onAcceptInput:function(e){this.maskedValue=e.detail._unmaskedValue,this.$emit("input",e.detail._unmaskedValue)}}},m=n(60),component=Object(m.a)(f,(function(){var e=this;return(0,e._self._c)("input",e._g({directives:[{name:"imask",rawName:"v-imask",value:e.imaskOptions,expression:"imaskOptions"}],ref:"input",attrs:{type:"text",autocapitalize:"off",inputmode:"decimal"},on:{accept:function(t){return e.onAcceptInput(t)}}},e.listeners))}),[],!1,null,null,null);t.a=component.exports},756:function(e,t,n){"use strict";n(57);var r={props:{isOpen:{type:Boolean,default:!1},hideCloseButton:{type:Boolean,default:!1},modalClass:{type:String,default:""},modalContainerClass:{type:String,default:""},keepMarkup:{type:Boolean,default:!1}},data:function(){return{elFocusedBeforeOpen:null}},watch:{isOpen:function(e){var t=this;e?(this.elFocusedBeforeOpen=document.activeElement,setTimeout((function(){if("function"==typeof t.$el.querySelector){var e=t.$el.querySelector("[data-focus-on-open]");e&&e.focus()}}),0)):setTimeout((function(){t.elFocusedBeforeOpen&&setTimeout((function(){t.elFocusedBeforeOpen.focus(),t.elFocusedBeforeOpen=null}),0)}),0)}},methods:{closeModal:function(){this.$emit("update:isOpen",!1),this.$emit("modal-close")},handleModalClick:function(e){this.hideCloseButton||this.$refs.modalContainer&&e.target!==this.$refs.modalContainer&&!this.$refs.modalContainer.contains(e.target)&&this.closeModal()},handleModalKeydown:function(e){this.hideCloseButton||"Escape"!==e.code&&27!==e.keyCode||(e.preventDefault(),this.closeModal())}}},o=n(60),component=Object(o.a)(r,(function(){var e=this,t=e._self._c;return t("transition",{attrs:{name:"v-transition-modal"}},[e.isOpen||e.keepMarkup?t("div",{staticClass:"modal-wrap"},[t("transition",{attrs:{name:"v-transition-modal"}},[t("div",{directives:[{name:"show",rawName:"v-show",value:e.isOpen||!e.keepMarkup,expression:"isOpen || !keepMarkup"}],staticClass:"modal u-container u-container--wide",class:e.modalClass,attrs:{tabindex:"-1",role:"dialog"},on:{click:e.handleModalClick,keydown:e.handleModalKeydown}},[e.hideCloseButton?e._e():t("button",{staticClass:"modal__close u-semantic-button link--opacity",attrs:{type:"button"}},[t("span",{staticClass:"modal__close-icon"},[e._v("Close")])]),e._v(" "),t("div",{staticClass:"modal__wrap"},[t("div",{ref:"modalContainer",staticClass:"modal__container",class:e.modalContainerClass},[e._t("default")],2)])])])],1):e._e()])}),[],!1,null,null,null);t.a=component.exports},758:function(e,t,n){"use strict";n(49);var r={components:{InputMaskedAmount:n(753).a},props:{value:{type:[String,Number],default:""}},computed:{inputListeners:function(){var e=Object.assign({},this.$listeners);return delete e.input,e}}},o=n(60),component=Object(o.a)(r,(function(){var e=this;return(0,e._self._c)("InputMaskedAmount",e._g({attrs:{inputmode:"numeric",value:e.value,scale:0},on:{input:function(t){return e.$emit("input",t)}}},e.inputListeners))}),[],!1,null,null,null);t.a=component.exports},759:function(e,t,n){e.exports={}},764:function(e,t,n){"use strict";n(14),n(49);var r=n(776),o=n(743),c=n(800),l=n(801),d=n(745),v=n(756);c.a.WORKER_PATH=l.a;var f={components:{Loader:d.a,Modal:v.a},props:{qrVisible:{type:Boolean,default:!1}},data:function(){return{qrScanner:null,cameraError:!1,isModalVisible:!1,isPlaying:!1}},mounted:function(){var e=this;c.a.hasCamera().then((function(){e.$emit("update:qrVisible",!0),e.qrScanner=new c.a(e.$refs.qrVideo,(function(t){e.stopScanQr(),e.isModalVisible=!1,e.$emit("qr-scanned",t)}))})).catch((function(){e.$emit("update:qrVisible",!1)}))},destroyed:function(){this.qrScanner&&this.qrScanner.destroy()},methods:{scanQr:function(){var e=this;this.isModalVisible=!0,this.$refs.qrVideo.addEventListener("canplay",this.handlePlayStart),this.qrScanner.start().then((function(){e.cameraError=!1})).catch((function(){e.cameraError=!0}))},stopScanQr:function(){this.qrScanner.stop(),this.isPlaying=!1,window.removeEventListener("resize",this.repositionOverlay)},handlePlayStart:function(){this.repositionOverlay(),this.isPlaying=!0,window.addEventListener("resize",this.repositionOverlay),this.$refs.qrVideo.removeEventListener("canplay",this.handlePlayStart)},repositionOverlay:function(){var e=this;requestAnimationFrame((function(){if(e.$refs.qrVideo){var t=e.$refs.qrVideo.offsetHeight,n=e.$refs.qrVideo.offsetWidth,r=Math.min(t,n);if(0!==r){var o=Math.ceil(2/3*r),c=e.$refs.overlay;c.style.width=o+"px",c.style.height=o+"px",c.style.top=(t-o)/2+"px",c.style.left=(n-o)/2+"px"}}}))}}},m=n(60),component=Object(m.a)(f,(function(){var e=this,t=e._self._c;return t("div",{directives:[{name:"show",rawName:"v-show",value:e.qrScanner,expression:"qrScanner"}],on:{click:function(e){e.preventDefault()}}},[t("button",{staticClass:"form-field__icon u-semantic-button link--opacity",attrs:{type:"button"},on:{click:function(t){return t.preventDefault(),e.scanQr.apply(null,arguments)}}},[t("img",{attrs:{src:"".concat(e.BASE_URL_PREFIX,"/img/icon-qr.svg"),alt:"Scan QR Code",width:"24",height:"24"}})]),e._v(" "),t("Modal",{staticClass:"qr-scan__modal",attrs:{"modal-container-class":"qr-scan__modal-container",isOpen:e.isModalVisible,keepMarkup:!0},on:{"update:isOpen":function(t){e.isModalVisible=t},"update:is-open":function(t){e.isModalVisible=t},"modal-close":e.stopScanQr}},[t("div",{staticClass:"qr-scan__wrap"},[t("div",{staticClass:"qr-scan__notice"},[t("Loader",{attrs:{isLoading:!0}}),e._v(" "),e.cameraError?t("div",[e._v("Allow camera access")]):e._e()],1),e._v(" "),t("video",{ref:"qrVideo",staticClass:"qr-scan__video",attrs:{autoplay:"",playsinline:"",muted:""},domProps:{muted:!0}}),e._v(" "),t("div",{directives:[{name:"show",rawName:"v-show",value:e.isPlaying,expression:"isPlaying"}],ref:"overlay",staticClass:"qr-scan__overlay"},[t("svg",{attrs:{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 238 238"}},[t("path",{attrs:{fill:"none","stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"3",d:"M31.3 2H10a8 8 0 0 0-8 8v21.3M206.8 2H228a8 8 0 0 1 8 8v21.3m0 175.4V228a8 8 0 0 1-8 8h-21.3m-175.4 0H10a8 8 0 0 1-8-8v-21.3"}})])])])])],1)}),[],!1,null,null,null),h=component.exports,_=n(758),y={ideFix:null,MAX_ITEM_COUNT:5,components:{VueSimpleSuggest:r.a,QrScan:h,Loader:d.a,InputMaskedInteger:_.a},directives:{checkEmpty:o.a},inheritAttrs:!1,props:{value:{type:[String,Number],required:!0},$value:{type:Object,required:!0},label:{type:String,required:!0},isInteger:{type:Boolean,default:!1},suggestionList:{type:Array,default:function(){return[]}},suggestionFilter:{type:Function,default:void 0},suggestionContent:{type:Function,default:void 0},suggestionMinInputLength:{type:Number,default:1}},data:function(){return{hasCamera:!1}},methods:{handleQrScanned:function(e){this.$emit("input",e),this.$value.$touch()},handleSuggestionClick:function(e,t){t.preventDefault()}}},w=Object(m.a)(y,(function(){var e=this,t=e._self._c;return t("label",{staticClass:"form-field form-field--qr",class:{"is-error":e.$value.$error,"form-field--with-icon":e.hasCamera}},[e.suggestionList&&e.suggestionList.length?t("VueSimpleSuggest",e._b({attrs:{value:e.value,list:e.suggestionList.slice(0),"max-suggestions":e.$options.MAX_ITEM_COUNT,"min-length":e.suggestionMinInputLength,"filter-by-query":!0,filter:e.suggestionFilter,destyled:!0,controls:{showList:[38,40]},"value-attribute":"value","display-attribute":"value"},on:{input:function(t){return e.$emit("input",t)},blur:function(t){e.$value.$touch(),e.$emit("blur",t)},"suggestion-click":e.handleSuggestionClick},scopedSlots:e._u([e.suggestionContent?{key:"suggestion-item",fn:function(n){return[t("span",{domProps:{innerHTML:e._s(e.suggestionContent(n))}})]}}:null],null,!0)},"VueSimpleSuggest",e.$attrs,!1),[t("input",e._b({directives:[{name:"check-empty",rawName:"v-check-empty"}],staticClass:"form-field__input",attrs:{type:"text",spellcheck:"false"},domProps:{value:e.value}},"input",e.$attrs,!1)),e._v(" "),t("span",{staticClass:"form-field__label"},[e._v(e._s(e.label))])]):[e.isInteger?t("InputMaskedInteger",e._b({directives:[{name:"check-empty",rawName:"v-check-empty"}],staticClass:"form-field__input",attrs:{value:e.value},on:{input:function(t){return e.$emit("input",t)},blur:function(t){e.$value.$touch(),e.$emit("blur",t)}}},"InputMaskedInteger",e.$attrs,!1)):t("input",e._b({directives:[{name:"check-empty",rawName:"v-check-empty"}],staticClass:"form-field__input",attrs:{type:"text",autocapitalize:"off",spellcheck:"false"},domProps:{value:e.value},on:{input:function(t){return e.$emit("input",t.target.value)},blur:function(t){e.$value.$touch(),e.$emit("blur",t)}}},"input",e.$attrs,!1)),e._v(" "),t("span",{staticClass:"form-field__label"},[e._v(e._s(e.label))])],e._v(" "),t("Loader",{staticClass:"form-field__icon form-field__icon--loader form-field__icon--second",attrs:{isLoading:e.$value.$pending}}),e._v(" "),t("QrScan",{attrs:{qrVisible:e.hasCamera},on:{"qr-scanned":e.handleQrScanned,"update:qrVisible":function(t){e.hasCamera=t},"update:qr-visible":function(t){e.hasCamera=t}}})],2)}),[],!1,null,null,null);t.a=w.exports},766:function(e,t,n){"use strict";n.d(t,"a",(function(){return o}));var r=n(4);function o(text,e){var t="ru"===e?"Консоль":"Console";return text?r.d+t+". "+text+r.c:r.d+t+r.c}},774:function(e,t,n){"use strict";n(759)},800:function(e,t,n){"use strict";n.d(t,"a",(function(){return c}));var r=n(55),o=n(56),c=(n(1),n(57),n(8),n(42),n(41),n(835),n(407),function(){function e(video,t){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:e.DEFAULT_CANVAS_SIZE;Object(r.a)(this,e),this.$video=video,this.$canvas=document.createElement("canvas"),this._onDecode=t,this._active=!1,this._paused=!1,this.$canvas.width=n,this.$canvas.height=n,this._sourceRect={x:0,y:0,width:n,height:n},this._onCanPlay=this._onCanPlay.bind(this),this._onPlay=this._onPlay.bind(this),this._onVisibilityChange=this._onVisibilityChange.bind(this),this.$video.addEventListener("canplay",this._onCanPlay),this.$video.addEventListener("play",this._onPlay),document.addEventListener("visibilitychange",this._onVisibilityChange),this._qrWorker=new Worker(e.WORKER_PATH)}return Object(o.a)(e,[{key:"destroy",value:function(){this.$video.removeEventListener("canplay",this._onCanPlay),this.$video.removeEventListener("play",this._onPlay),document.removeEventListener("visibilitychange",this._onVisibilityChange),this.stop(),this._qrWorker.postMessage({type:"close"})}},{key:"start",value:function(){var e=this;if(this._active&&!this._paused)return Promise.resolve();if("https:"!==window.location.protocol&&console.warn("The camera stream is only accessible if the page is transferred via https."),this._active=!0,this._paused=!1,document.hidden)return Promise.resolve();if(clearTimeout(this._offTimeout),this._offTimeout=null,this.$video.srcObject)return this.$video.play(),Promise.resolve();var t="environment";return this._getCameraStream("environment",!0).catch((function(){return t="user",e._getCameraStream()})).then((function(n){e._isUserFacing(n)&&(t="user"),e.$video.srcObject=n,e._setVideoMirror(t)})).catch((function(t){throw e._active=!1,t}))}},{key:"stop",value:function(){this.pause(),this._active=!1}},{key:"pause",value:function(){var e=this;this._paused=!0,this._active&&(this.$video.pause(),this._offTimeout||(this._offTimeout=setTimeout((function(){var track=e.$video.srcObject&&e.$video.srcObject.getTracks()[0];track&&(track.stop(),e.$video.srcObject=null,e._offTimeout=null)}),300)))}},{key:"setGrayscaleWeights",value:function(e,t,n){var r=!(arguments.length>3&&void 0!==arguments[3])||arguments[3];this._qrWorker.postMessage({type:"grayscaleWeights",data:{red:e,green:t,blue:n,useIntegerApproximation:r}})}},{key:"setInversionMode",value:function(e){this._qrWorker.postMessage({type:"inversionMode",data:e})}},{key:"_onCanPlay",value:function(){this._updateSourceRect(),this.$video.play()}},{key:"_onPlay",value:function(){this._updateSourceRect(),this._scanFrame()}},{key:"_onVisibilityChange",value:function(){document.hidden?this.pause():this._active&&this.start()}},{key:"_updateSourceRect",value:function(){var e=Math.min(this.$video.videoWidth,this.$video.videoHeight),t=Math.round(2/3*e);this._sourceRect.width=this._sourceRect.height=t,this._sourceRect.x=(this.$video.videoWidth-t)/2,this._sourceRect.y=(this.$video.videoHeight-t)/2}},{key:"_scanFrame",value:function(){var t=this;if(!this._active||this.$video.paused||this.$video.ended)return!1;requestAnimationFrame((function(){t.$video.readyState<=1?t._scanFrame():e.scanImage(t.$video,t._sourceRect,t._qrWorker,t.$canvas,!0).then(t._onDecode,(function(e){t._active&&"QR code not found."!==e&&console.error(e)})).then((function(){return t._scanFrame()}))}))}},{key:"_getCameraStream",value:function(e){var t=[{width:{min:1024}},{width:{min:768}},{}];return e&&(arguments.length>1&&void 0!==arguments[1]&&arguments[1]&&(e={exact:e}),t.forEach((function(t){return t.facingMode=e}))),this._getMatchingCameraStream(t)}},{key:"_getMatchingCameraStream",value:function(e){var t=this;return 0===e.length?Promise.reject("Camera not found."):navigator.mediaDevices.getUserMedia({video:e.shift()}).catch((function(){return t._getMatchingCameraStream(e)}))}},{key:"_setVideoMirror",value:function(e){var t="user"===e?-1:1;this.$video.style.transform="scaleX("+t+")"}},{key:"_isUserFacing",value:function(e){return/front|user|face/i.test(e.getVideoTracks()[0].label)}}],[{key:"hasCamera",value:function(){return navigator.mediaDevices?navigator.mediaDevices.enumerateDevices().then((function(e){return e.some((function(e){return"videoinput"===e.kind}))})).catch((function(){return!1})):Promise.reject(!1)}},{key:"scanImage",value:function(t){var n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:null,canvas=arguments.length>3&&void 0!==arguments[3]?arguments[3]:null,o=arguments.length>4&&void 0!==arguments[4]&&arguments[4],c=arguments.length>5&&void 0!==arguments[5]&&arguments[5],l=!1,d=new Promise((function(c,d){var v,f,m;r||(r=new Worker(e.WORKER_PATH),l=!0,r.postMessage({type:"inversionMode",data:"both"})),f=function(e){"qrResult"===e.data.type&&(r.removeEventListener("message",f),r.removeEventListener("error",m),clearTimeout(v),null!==e.data.data?c(e.data.data):d("QR code not found."))},m=function(e){r.removeEventListener("message",f),r.removeEventListener("error",m),clearTimeout(v);var t=e?e.message||e:"Unknown Error";d("Scanner error: "+t)},r.addEventListener("message",f),r.addEventListener("error",m),v=setTimeout((function(){return m("timeout")}),3e3),e._loadImage(t).then((function(image){var t=e._getImageData(image,n,canvas,o);r.postMessage({type:"decode",data:t},[t.data.buffer])})).catch(m)}));return n&&c&&(d=d.catch((function(){return e.scanImage(t,null,r,canvas,o)}))),d=d.finally((function(){l&&r.postMessage({type:"close"})}))}},{key:"_getImageData",value:function(image){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,canvas=arguments.length>2&&void 0!==arguments[2]?arguments[2]:null,t=arguments.length>3&&void 0!==arguments[3]&&arguments[3];canvas=canvas||document.createElement("canvas");var n=e&&e.x?e.x:0,r=e&&e.y?e.y:0,o=e&&e.width?e.width:image.width||image.videoWidth,c=e&&e.height?e.height:image.height||image.videoHeight;t||canvas.width===o&&canvas.height===c||(canvas.width=o,canvas.height=c);var l=canvas.getContext("2d",{alpha:!1});return l.imageSmoothingEnabled=!1,l.drawImage(image,n,r,o,c,0,0,canvas.width,canvas.height),l.getImageData(0,0,canvas.width,canvas.height)}},{key:"_loadImage",value:function(t){if(t instanceof HTMLCanvasElement||t instanceof HTMLVideoElement||window.ImageBitmap&&t instanceof window.ImageBitmap||window.OffscreenCanvas&&t instanceof window.OffscreenCanvas)return Promise.resolve(t);if(t instanceof Image)return e._awaitImageLoad(t).then((function(){return t}));if(t instanceof File||t instanceof URL||"string"==typeof t){var image=new Image;return t instanceof File?image.src=URL.createObjectURL(t):image.src=t,e._awaitImageLoad(image).then((function(){return t instanceof File&&URL.revokeObjectURL(image.src),image}))}return Promise.reject("Unsupported image type.")}},{key:"_awaitImageLoad",value:function(image){return new Promise((function(e,t){var n,r;image.complete&&0!==image.naturalWidth?e():(n=function(){image.removeEventListener("load",n),image.removeEventListener("error",r),e()},r=function(){image.removeEventListener("load",n),image.removeEventListener("error",r),t("Image load error")},image.addEventListener("load",n),image.addEventListener("error",r))}))}}]),e}());c.DEFAULT_CANVAS_SIZE=400,c.WORKER_PATH="qr-scanner-worker.min.js"},801:function(e,t,n){"use strict";t.a=n.p+"6b7d1afd4fb85864e691672bb54a14d3.js"},809:function(e,t){}}]);