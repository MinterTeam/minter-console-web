/*! For license information please see LICENSES */
(window.webpackJsonp=window.webpackJsonp||[]).push([[9],{1060:function(e,t,r){"use strict";r.r(t);r(21);var o=r(653),n=r(640),l=r(641),c=r.n(l),d=r(248),f=r(2),m=r(638),h=r(647),v=r(659),_={TX_TYPE:f.a,components:{TxForm:h.a,FieldQr:v.a},directives:{checkEmpty:m.a},mixins:[n.validationMixin],data:()=>({form:{check:"",password:""}}),validations:()=>({form:{check:{required:c.a,validCheck:d.m},password:{required:c.a}}}),methods:{clearForm(){this.form.check="",this.form.password="",this.$v.$reset()}}},y=r(41),k=Object(y.a)(_,(function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("TxForm",{attrs:{txData:e.form,$txData:e.$v.form,txType:e.$options.TX_TYPE.REDEEM_CHECK},on:{"clear-form":function(t){return e.clearForm()}},scopedSlots:e._u([{key:"panel-header",fn:function(){return[r("h1",{staticClass:"panel__header-title"},[e._v("\n            "+e._s(e.$td("Redeem check","checks.redeem-title"))+"\n        ")]),e._v(" "),r("p",{staticClass:"panel__header-description"},[e._v("\n            "+e._s(e.$td("Claim a check someone has written out to you.","checks.redeem-description"))+"\n        ")])]},proxy:!0},{key:"default",fn:function(t){t.fee,t.addressBalance;return[r("div",{staticClass:"u-cell"},[r("FieldQr",{attrs:{$value:e.$v.form.check,label:e.$td("Check","form.checks-redeem-check")},model:{value:e.form.check,callback:function(t){e.$set(e.form,"check","string"==typeof t?t.trim():t)},expression:"form.check"}}),e._v(" "),e.$v.form.check.$dirty&&!e.$v.form.check.required?r("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Check","form.checks-redeem-check-error-required")))]):e.$v.form.check.$dirty&&!e.$v.form.check.validCheck?r("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Check is invalid","form.checks-redeem-check-error-invalid")))]):e._e(),e._v(" "),r("div",{staticClass:"form-field__help"},[e._v(e._s(e.$td("The identifier the issuer gave you. Starts with","form.checks-redeem-check-help"))+" "),r("strong",[e._v("Mc")])])],1),e._v(" "),r("div",{staticClass:"u-cell"},[r("label",{staticClass:"form-field",class:{"is-error":e.$v.form.password.$error}},[r("input",{directives:[{name:"check-empty",rawName:"v-check-empty"},{name:"model",rawName:"v-model.trim",value:e.form.password,expression:"form.password",modifiers:{trim:!0}}],staticClass:"form-field__input",attrs:{type:"text",autocapitalize:"off",spellcheck:"false"},domProps:{value:e.form.password},on:{blur:[function(t){return e.$v.form.password.$touch()},function(t){return e.$forceUpdate()}],input:function(t){t.target.composing||e.$set(e.form,"password",t.target.value.trim())}}}),e._v(" "),r("span",{staticClass:"form-field__label"},[e._v(e._s(e.$td("Password","form.checks-redeem-password")))])]),e._v(" "),e.$v.form.password.$dirty&&!e.$v.form.password.required?r("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Enter password","form.checks-redeem-password-error-required")))]):e._e()])]}},{key:"submit-title",fn:function(){return[e._v("\n        "+e._s(e.$td("Redeem","form.checks-redeem-button"))+"\n    ")]},proxy:!0},{key:"confirm-modal-header",fn:function(){return[r("h1",{staticClass:"panel__header-title"},[r("img",{staticClass:"panel__header-title-icon",attrs:{src:e.BASE_URL_PREFIX+"/img/icon-feature-check.svg",alt:"",role:"presentation",width:"40",height:"40"}}),e._v("\n            "+e._s(e.$td("Redeem check","checks.redeem-title"))+"\n        ")])]},proxy:!0}])})}),[],!1,null,null,null).exports,$=r(24),C=(r(14),r(17),r(22),r(7),r(117)),w=r(676),E=r(662),x=r(642),S=r.n(x),O=r(728),M=r(847),P=r(651),j=r(677),N=r(249),T=r(75),A=r(4),F=r(660),L=r(654),B=r(655),I=r(665),R=r(664);function z(object,e){var t=Object.keys(object);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(object);e&&(r=r.filter((function(e){return Object.getOwnPropertyDescriptor(object,e).enumerable}))),t.push.apply(t,r)}return t}function V(e){for(var i=1;i<arguments.length;i++){var source=null!=arguments[i]?arguments[i]:{};i%2?z(Object(source),!0).forEach((function(t){Object($.a)(e,t,source[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(source)):z(Object(source)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(source,t))}))}return e}var D={feeBus:null,components:{QrcodeVue:w.a,InlineSvg:E.a,Modal:F.a,FieldCoin:L.a,InputMaskedAmount:B.a,InputMaskedInteger:I.a,ButtonCopyIcon:R.a},directives:{checkEmpty:m.a},mixins:[n.validationMixin],data:()=>({isFormSending:!1,serverError:"",check:null,password:"",form:{nonce:null,dueBlock:"",value:null,coinSymbol:"",password:"",gasCoin:""},fee:{},deeplink:"",isCheckQrModalVisible:!1,isLinkQrModalVisible:!1}),validations(){return{form:{nonce:{required:c.a},dueBlock:{},value:{required:c.a},coinSymbol:{required:c.a,minLength:this.$store.getters.isOfflineMode?()=>!0:S()(3)},password:{required:c.a},gasCoin:{minLength:this.$store.getters.isOfflineMode?()=>!0:S()(3)}}}},computed:V(V({},Object(C.b)({balance:"balance"})),{},{feeBusParams(){var e;return{txParams:{type:f.a.REDEEM_CHECK,gasCoin:this.form.gasCoin},baseCoinAmount:null===(e=this.$store.getters.baseCoin)||void 0===e?void 0:e.amount,isOffline:this.$store.getters.isOfflineMode}},deeplinkPretty(){return this.deeplink.replace("https://","")}}),watch:{feeBusParams:{handler(e){this.$options.feeBus&&"function"==typeof this.$options.feeBus.$emit&&this.$options.feeBus.$emit("update-params",e)},deep:!0}},created(){this.$options.feeBus=new j.a(this.feeBusParams),this.fee=this.$options.feeBus.fee,this.$options.feeBus.$on("update-fee",(e=>{this.fee=e}))},methods:{pretty:e=>Object(T.p)(e,void 0,!0),submit(){if(!this.isFormSending)if(this.$v.$invalid)this.$v.$touch();else{this.check=null,this.password="",this.deeplink="",this.isFormSending=!0,this.serverError="";var e,t,r=V(V({privateKey:this.$store.getters.privateKey,chainId:this.$store.getters.CHAIN_ID},(e=this.form,t={},Object.keys(e).forEach((r=>{(e[r]||0===e[r]||!1===e[r])&&(t[r]=e[r])})),t)),{},{coin:this.form.coinSymbol,gasCoin:this.fee.coin});Promise.all([Object(P.k)(r,["gasCoin","coin"]),this.$store.dispatch("FETCH_ADDRESS_ENCRYPTED")]).then((()=>{try{this.check=Object(O.b)(r),this.password=this.form.password;var e=A.A===A.C?"https://testnet.bip.to":void 0;this.deeplink=Object(M.a)({data:{check:this.check},type:f.a.REDEEM_CHECK,password:this.form.password},e),this.clearForm()}catch(e){this.serverError=Object(N.a)(e)}this.isFormSending=!1})).catch((e=>{this.isFormSending=!1,this.serverError=Object(N.a)(e)}))}},clearForm(){parseInt(this.form.nonce,10).toString()===this.form.nonce?this.form.nonce=(parseInt(this.form.nonce,10)+1).toString():this.form.nonce="",this.form.dueBlock="",this.form.value=null,this.form.coinSymbol="",this.form.password="",this.form.gasCoin="",this.$v.$reset()}}},Q={components:{CheckRedeemForm:k,CheckIssueForm:Object(y.a)(D,(function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("form",{staticClass:"panel__section",attrs:{novalidate:""},on:{submit:function(t){return t.preventDefault(),e.submit(t)}}},[r("div",{staticClass:"u-grid u-grid--small u-grid--vertical-margin--small"},[r("div",{staticClass:"u-cell u-cell--medium--1-3 u-cell--xlarge--1-2"},[r("label",{staticClass:"form-field",class:{"is-error":e.$v.form.nonce.$error}},[r("input",{directives:[{name:"check-empty",rawName:"v-check-empty"},{name:"model",rawName:"v-model",value:e.form.nonce,expression:"form.nonce"}],staticClass:"form-field__input",attrs:{type:"text"},domProps:{value:e.form.nonce},on:{blur:function(t){return e.$v.form.nonce.$touch()},input:function(t){t.target.composing||e.$set(e.form,"nonce",t.target.value)}}}),e._v(" "),r("span",{staticClass:"form-field__label"},[e._v(e._s(e.$td("Nonce","form.checks-issue-nonce")))])]),e._v(" "),e.$v.form.nonce.$dirty&&!e.$v.form.nonce.required?r("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Enter nonce","form.checks-issue-nonce-error-required")))]):e._e(),e._v(" "),r("div",{staticClass:"form-field__help"},[e._v(e._s(e.$td("Check's unique ID. Used for issuing several identical checks.","form.checks-issue-nonce-help")))])]),e._v(" "),r("div",{staticClass:"u-cell u-cell--medium--1-3 u-cell--xlarge--1-4"},[r("FieldCoin",{attrs:{$value:e.$v.form.coinSymbol,label:e.$td("Coin","form.coin"),"coin-list":e.balance},model:{value:e.form.coinSymbol,callback:function(t){e.$set(e.form,"coinSymbol",t)},expression:"form.coinSymbol"}}),e._v(" "),e.$v.form.coinSymbol.$dirty&&!e.$v.form.coinSymbol.required?r("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Enter coin symbol","form.coin-error-required")))]):e.$v.form.coinSymbol.$dirty&&!e.$v.form.coinSymbol.minLength?r("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Min 3 letters","form.coin-error-min")))]):e._e()],1),e._v(" "),r("div",{staticClass:"u-cell u-cell--medium--1-3 u-cell--xlarge--1-4"},[r("label",{staticClass:"form-field",class:{"is-error":e.$v.form.value.$error}},[r("InputMaskedAmount",{directives:[{name:"check-empty",rawName:"v-check-empty"}],staticClass:"form-field__input",on:{blur:function(t){return e.$v.form.value.$touch()}},model:{value:e.form.value,callback:function(t){e.$set(e.form,"value",t)},expression:"form.value"}}),e._v(" "),r("span",{staticClass:"form-field__label"},[e._v(e._s(e.$td("Amount","form.checks-issue-amount")))])],1),e._v(" "),e.$v.form.value.$dirty&&!e.$v.form.value.required?r("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Enter amount","form.amount-error-required")))]):e._e()]),e._v(" "),r("div",{staticClass:"u-cell u-cell--medium--1-3 u-cell--xlarge--1-2"},[r("label",{staticClass:"form-field",class:{"is-error":e.$v.form.password.$error}},[r("input",{directives:[{name:"check-empty",rawName:"v-check-empty"},{name:"model",rawName:"v-model.trim",value:e.form.password,expression:"form.password",modifiers:{trim:!0}}],staticClass:"form-field__input",attrs:{type:"text",autocapitalize:"off",spellcheck:"false"},domProps:{value:e.form.password},on:{blur:[function(t){return e.$v.form.password.$touch()},function(t){return e.$forceUpdate()}],input:function(t){t.target.composing||e.$set(e.form,"password",t.target.value.trim())}}}),e._v(" "),r("span",{staticClass:"form-field__label"},[e._v(e._s(e.$td("Password","form.checks-issue-pass")))])]),e._v(" "),e.$v.form.password.$dirty&&!e.$v.form.password.required?r("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Enter password","form.checks-issue-pass-error-required")))]):e._e()]),e._v(" "),r("div",{staticClass:"u-cell u-cell--medium--1-3 u-cell--xlarge--1-4"},[r("FieldCoin",{attrs:{$value:e.$v.form.gasCoin,label:e.$td("Coin to pay fee (optional)","form.fee"),"coin-list":e.balance},model:{value:e.form.gasCoin,callback:function(t){e.$set(e.form,"gasCoin",t)},expression:"form.gasCoin"}}),e._v(" "),e.$v.form.gasCoin.$dirty&&!e.$v.form.gasCoin.minLength?r("span",{staticClass:"form-field__error"},[e._v(e._s(e.$td("Min 3 letters","form.coin-error-min")))]):e.$store.getters.isOfflineMode?r("div",{staticClass:"form-field__help"},[e._v(e._s(e.$td("Equivalent of "+e.$store.getters.COIN_NAME+" "+e.pretty(e.fee.baseCoinValue),"form.fee-help",{value:e.pretty(e.fee.baseCoinValue),coin:e.$store.getters.COIN_NAME})))]):r("div",{staticClass:"form-field__help"},[e._v("\n                "+e._s(e.fee.coinSymbol)+" "+e._s(e.pretty(e.fee.value))+"\n                "),e.fee.isBaseCoin?e._e():r("span",{staticClass:"u-display-ib"},[e._v("("+e._s(e.$store.getters.COIN_NAME)+" "+e._s(e.pretty(e.fee.baseCoinValue))+")")]),e._v(" "),r("br"),e._v("\n                "+e._s(e.$td("Default:","form.help-default"))+" "+e._s(e.fee.isBaseCoinEnough?e.$store.getters.COIN_NAME:e.$td("same as coin to transfer","form.wallet-send-fee-same"))+"\n            ")])],1),e._v(" "),r("div",{staticClass:"u-cell u-cell--medium--1-3 u-cell--xlarge--1-4"},[r("label",{staticClass:"form-field",class:{"is-error":e.$v.form.dueBlock.$error}},[r("InputMaskedInteger",{directives:[{name:"check-empty",rawName:"v-check-empty"}],staticClass:"form-field__input",on:{blur:function(t){return e.$v.form.dueBlock.$touch()}},model:{value:e.form.dueBlock,callback:function(t){e.$set(e.form,"dueBlock",t)},expression:"form.dueBlock"}}),e._v(" "),r("span",{staticClass:"form-field__label"},[e._v(e._s(e.$td("Due block (optional)","form.checks-issue-due")))])],1),e._v(" "),r("div",{staticClass:"form-field__help"},[e._v("\n                "+e._s(e.$td("Default:","form.help-default"))+" 999999999\n            ")])]),e._v(" "),r("div",{staticClass:"u-cell"},[r("button",{staticClass:"button button--main button--full",class:{"is-disabled":e.$v.$invalid}},[e._v(e._s(e.$td("Issue","form.checks-issue-button")))]),e._v(" "),e.serverError?r("div",{staticClass:"form-field__error"},[e._v(e._s(e.serverError))]):e._e()]),e._v(" "),e.check?r("div",{staticClass:"u-cell"},[r("dl",[r("dt",[e._v(e._s(e.$td("Signed check:","form.checks-issue-result-check")))]),e._v(" "),r("dd",{staticClass:"u-icon-wrap"},[r("span",{staticClass:"u-select-all u-icon-text"},[e._v("\n                        "+e._s(e.check)+"\n                    ")]),e._v(" "),r("ButtonCopyIcon",{staticClass:"u-icon--copy--right",attrs:{"copy-text":e.check}}),e._v(" "),r("button",{staticClass:"u-icon u-icon--qr--right u-semantic-button link--opacity",on:{click:function(t){e.isCheckQrModalVisible=!0}}},[r("InlineSvg",{attrs:{src:e.BASE_URL_PREFIX+"/img/icon-qr.svg",width:"24",height:"24"}})],1)],1),e._v(" "),r("dt",[e._v(e._s(e.$td("Password:","form.checks-issue-result-pass")))]),e._v(" "),r("dd",{staticClass:"u-select-all"},[e._v(e._s(e.password))]),e._v(" "),r("dt",[e._v("\n                    "+e._s(e.$td("Link to redeem:","form.checks-issue-result-link"))+" "),r("br"),e._v(" "),r("span",{staticClass:"u-emoji"},[e._v("⚠️")]),e._v(" "+e._s(e.$td("Warning! Password included in the link. Send the link only directly to the recipient.","form.checks-issue-result-link-warning"))+"\n                ")]),e._v(" "),r("dd",{staticClass:"u-icon-wrap"},[r("span",{staticClass:"u-select-all u-icon-text u-text-break-all"},[r("a",{staticClass:"link--main link--hover",attrs:{href:e.deeplink,target:"_blank"}},[e._v(e._s(e.deeplinkPretty))])]),e._v(" "),r("ButtonCopyIcon",{staticClass:"u-icon--copy--right",attrs:{"copy-text":e.deeplink}}),e._v(" "),r("button",{staticClass:"u-icon u-icon--qr--right u-semantic-button link--opacity",on:{click:function(t){e.isLinkQrModalVisible=!0}}},[r("InlineSvg",{attrs:{src:e.BASE_URL_PREFIX+"/img/icon-qr.svg",width:"24",height:"24"}})],1)],1)])]):e._e()]),e._v(" "),r("Modal",{staticClass:"qr-modal",attrs:{isOpen:e.isCheckQrModalVisible},on:{"update:isOpen":function(t){e.isCheckQrModalVisible=t},"update:is-open":function(t){e.isCheckQrModalVisible=t}}},[r("QrcodeVue",{staticClass:"qr-modal__layer",attrs:{value:e.check,size:280,level:"L"}})],1),e._v(" "),r("Modal",{staticClass:"qr-modal",attrs:{isOpen:e.isLinkQrModalVisible},on:{"update:isOpen":function(t){e.isLinkQrModalVisible=t},"update:is-open":function(t){e.isLinkQrModalVisible=t}}},[r("QrcodeVue",{staticClass:"qr-modal__layer",attrs:{value:e.deeplink,size:280,level:"L"}})],1)],1)}),[],!1,null,null,null).exports},fetch(e){var{app:t,store:r}=e;return r.commit("SET_SECTION_NAME",t.$td("Checks","common.page-checks")),Promise.resolve()},head(){var title=Object(o.a)(this.$store.state.sectionName,this.$i18n.locale),e=this.$td("Issue a check that will later be redeemed by the person of your choice or claim a check someone has written out to you.","checks.seo-description"),t="en"===this.$i18n.locale?"":"-"+this.$i18n.locale;return{title:title,meta:[{hid:"og-title",name:"og:title",content:title},{hid:"description",name:"description",content:e},{hid:"og-description",name:"og:description",content:e},{hid:"og-image",name:"og:image",content:"".concat(this.BASE_URL_PREFIX,"/img/social-share-checks").concat(t,".png")}]}}},H=Object(y.a)(Q,(function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("section",{staticClass:"u-section u-container"},[r("CheckRedeemForm"),e._v(" "),r("div",{staticClass:"panel"},[r("div",{staticClass:"panel__header"},[r("h1",{staticClass:"panel__header-title"},[e._v("\n                "+e._s(e.$td("Issue check","checks.issue-title"))+"\n            ")]),e._v(" "),r("p",{staticClass:"panel__header-description"},[e._v("\n                "+e._s(e.$td("Issue a check that will later be redeemed by the person of your choice.","checks.issue-description"))+"\n            ")])]),e._v(" "),r("CheckIssueForm")],1)],1)}),[],!1,null,null,null);t.default=H.exports},642:function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var o=r(648);t.default=function(e){return(0,o.withParams)({type:"minLength",min:e},(function(t){return!(0,o.req)(t)||(0,o.len)(t)>=e}))}},645:function(e,t,r){"use strict";var o=r(663),n=r.n(o);t.a={bind(e,t,r){"TEXTAREA"===e.tagName&&r.context.$nextTick((()=>{n()(e)}))},componentUpdated(e,t,r){"TEXTAREA"===e.tagName&&r.context.$nextTick((()=>{n.a.update(e)}))},unbind(e){n.a.destroy(e)}}},646:function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var o=r(648);t.default=function(e){return(0,o.withParams)({type:"maxLength",max:e},(function(t){return!(0,o.req)(t)||(0,o.len)(t)<=e}))}},655:function(e,t,r){"use strict";var o=r(250),n=(r(673),r(675)),l=["input"],c={ideFix:null,imaskAmount:{mask:Number,scale:18,signed:!1,thousandsSeparator:"",padFractionalZeros:!1,normalizeZeros:!1,radix:".",mapToRadix:[","]},directives:{imask:n.a},props:{value:{type:[String,Number],default:""}},data:()=>({maskedValue:""}),computed:{listeners(){var e=this.$listeners,{input:input}=e;return Object(o.a)(e,l)}},watch:{value(e){e!==this.maskedValue&&this.updateMaskState(e)}},mounted(){this.updateMaskState(this.value)},methods:{updateMaskState(e){this.$refs.input.maskRef.typedValue=e;var t=this.$refs.input.maskRef._value.length;this.$refs.input.maskRef._selection={start:t,end:t}},onAcceptInput(e){this.maskedValue=e.detail._unmaskedValue,this.$emit("input",e.detail._unmaskedValue)}}},d=r(41),component=Object(d.a)(c,(function(){var e=this,t=e.$createElement;return(e._self._c||t)("input",e._g({directives:[{name:"imask",rawName:"v-imask",value:e.$options.imaskAmount,expression:"$options.imaskAmount"}],ref:"input",attrs:{type:"text",autocapitalize:"off",inputmode:"decimal"},on:{accept:e.onAcceptInput}},e.listeners))}),[],!1,null,null,null);t.a=component.exports},656:function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var o=r(648);t.default=function(e){return(0,o.withParams)({type:"minValue",min:e},(function(t){return!(0,o.req)(t)||(!/\s/.test(t)||t instanceof Date)&&+t>=+e}))}},662:function(e,t,r){"use strict";r.d(t,"a",(function(){return n}));r(115),r(99),r(21);var o={};var n={inheritAttrs:!1,render(e){return this.svgElSource?e("svg",{on:this.$listeners,attrs:Object.assign(this.getSvgAttrs(this.svgElSource),(t=this.$attrs,Object.keys(t).reduce(((e,r)=>(!1!==t[r]&&null!==t[r]&&void 0!==t[r]&&(e[r]=t[r]),e)),{}))),domProps:{innerHTML:this.getSvgContent(this.svgElSource)}}):null;var t},props:{src:{type:String,required:!0},title:{type:String},transformSource:{type:Function,default:svg=>svg},keepDuringLoading:{type:Boolean,default:!0}},data:()=>({svgElSource:null}),watch:{src(e){this.getSource(e)}},mounted(){this.getSource(this.src)},methods:{getSvgAttrs(e){var t={},r=e.attributes;if(!r)return t;for(var i=r.length-1;i>=0;i--)t[r[i].name]=r[i].value;return t},getSvgContent(e){return e=e.cloneNode(!0),e=this.transformSource(e),this.title&&function(svg,title){var e=svg.getElementsByTagName("title");if(e.length)e[0].textContent=title;else{var t=document.createElementNS("http://www.w3.org/2000/svg","title");t.textContent=title,svg.appendChild(t)}}(e,this.title),e.innerHTML},getSource(e){o[e]||(o[e]=this.download(e)),this.svgElSource&&o[e].isPending()&&!this.keepDuringLoading&&(this.svgElSource=null,this.$emit("unloaded")),o[e].then((svg=>{this.svgElSource=svg,this.$nextTick((()=>{this.$emit("loaded",this.$el)}))})).catch((t=>{this.svgElSource&&(this.svgElSource=null,this.$emit("unloaded")),delete o[e],this.$emit("error",t)}))},download:e=>function(e){if(e.isPending)return e;var t=!0,r=e.then((e=>(t=!1,e)),(e=>{throw t=!1,e}));return r.isPending=function(){return t},r}(new Promise(((t,r)=>{var o=new XMLHttpRequest;o.open("GET",e,!0),o.onload=()=>{if(o.status>=200&&o.status<400)try{var e=(new DOMParser).parseFromString(o.responseText,"text/xml").getElementsByTagName("svg")[0];e?t(e):r(new Error('Loaded file is not valid SVG"'))}catch(e){r(e)}else r(new Error("Error loading SVG"))},o.onerror=r,o.send()})))}}},663:function(e,t,r){var o,n,l;n=[e,t],void 0===(l="function"==typeof(o=function(e,t){"use strict";var r,o,map="function"==typeof Map?new Map:(r=[],o=[],{has:function(e){return r.indexOf(e)>-1},get:function(e){return o[r.indexOf(e)]},set:function(e,t){-1===r.indexOf(e)&&(r.push(e),o.push(t))},delete:function(e){var t=r.indexOf(e);t>-1&&(r.splice(t,1),o.splice(t,1))}}),n=function(e){return new Event(e,{bubbles:!0})};try{new Event("test")}catch(e){n=function(e){var t=document.createEvent("Event");return t.initEvent(e,!0,!1),t}}function l(e){if(e&&e.nodeName&&"TEXTAREA"===e.nodeName&&!map.has(e)){var t=null,r=null,o=null,l=function(){e.clientWidth!==r&&v()},c=function(style){window.removeEventListener("resize",l,!1),e.removeEventListener("input",v,!1),e.removeEventListener("keyup",v,!1),e.removeEventListener("autosize:destroy",c,!1),e.removeEventListener("autosize:update",v,!1),Object.keys(style).forEach((function(t){e.style[t]=style[t]})),map.delete(e)}.bind(e,{height:e.style.height,resize:e.style.resize,overflowY:e.style.overflowY,overflowX:e.style.overflowX,wordWrap:e.style.wordWrap});e.addEventListener("autosize:destroy",c,!1),"onpropertychange"in e&&"oninput"in e&&e.addEventListener("keyup",v,!1),window.addEventListener("resize",l,!1),e.addEventListener("input",v,!1),e.addEventListener("autosize:update",v,!1),e.style.overflowX="hidden",e.style.wordWrap="break-word",map.set(e,{destroy:c,update:v}),d()}function d(){var style=window.getComputedStyle(e,null);"vertical"===style.resize?e.style.resize="none":"both"===style.resize&&(e.style.resize="horizontal"),t="content-box"===style.boxSizing?-(parseFloat(style.paddingTop)+parseFloat(style.paddingBottom)):parseFloat(style.borderTopWidth)+parseFloat(style.borderBottomWidth),isNaN(t)&&(t=0),v()}function f(t){var r=e.style.width;e.style.width="0px",e.offsetWidth,e.style.width=r,e.style.overflowY=t}function m(e){for(var t=[];e&&e.parentNode&&e.parentNode instanceof Element;)e.parentNode.scrollTop&&t.push({node:e.parentNode,scrollTop:e.parentNode.scrollTop}),e=e.parentNode;return t}function h(){if(0!==e.scrollHeight){var o=m(e),n=document.documentElement&&document.documentElement.scrollTop;e.style.height="",e.style.height=e.scrollHeight+t+"px",r=e.clientWidth,o.forEach((function(e){e.node.scrollTop=e.scrollTop})),n&&(document.documentElement.scrollTop=n)}}function v(){h();var t=Math.round(parseFloat(e.style.height)),r=window.getComputedStyle(e,null),l="content-box"===r.boxSizing?Math.round(parseFloat(r.height)):e.offsetHeight;if(l<t?"hidden"===r.overflowY&&(f("scroll"),h(),l="content-box"===r.boxSizing?Math.round(parseFloat(window.getComputedStyle(e,null).height)):e.offsetHeight):"hidden"!==r.overflowY&&(f("hidden"),h(),l="content-box"===r.boxSizing?Math.round(parseFloat(window.getComputedStyle(e,null).height)):e.offsetHeight),o!==l){o=l;var c=n("autosize:resized");try{e.dispatchEvent(c)}catch(e){}}}}function c(e){var t=map.get(e);t&&t.destroy()}function d(e){var t=map.get(e);t&&t.update()}var f=null;"undefined"==typeof window||"function"!=typeof window.getComputedStyle?((f=function(e){return e}).destroy=function(e){return e},f.update=function(e){return e}):((f=function(e,t){return e&&Array.prototype.forEach.call(e.length?e:[e],(function(e){return l(e,t)})),e}).destroy=function(e){return e&&Array.prototype.forEach.call(e.length?e:[e],c),e},f.update=function(e){return e&&Array.prototype.forEach.call(e.length?e:[e],d),e}),t.default=f,e.exports=t.default})?o.apply(t,n):o)||(e.exports=l)},668:function(e,t,r){"use strict";function o(e){var t=document.createElement("textarea");t.value=e,t.setAttribute("readonly",""),t.style.position="absolute",t.style.left="-9999px",document.body.appendChild(t);var r=document.getSelection(),o=r.rangeCount>0&&r.getRangeAt(0);t.select(),t.selectionStart=0,t.selectionEnd=e.length;var n=document.execCommand("copy");return document.body.removeChild(t),o&&(r.removeAllRanges(),r.addRange(o)),n}function n(){return"undefined"!=typeof document&&"function"==typeof document.queryCommandSupported&&document.queryCommandSupported("copy")}r.d(t,"a",(function(){return o})),r.d(t,"b",(function(){return n}))},674:function(e,t,r){"use strict";var o=r(5),n=r(26),l=r(251),c=r(393),d=r(25);o({target:"Promise",stat:!0},{allSettled:function(e){var t=this,r=l.f(t),o=r.resolve,f=r.reject,m=c((function(){var r=n(t.resolve),l=[],c=0,f=1;d(e,(function(e){var n=c++,d=!1;l.push(void 0),f++,r.call(t,e).then((function(e){d||(d=!0,l[n]={status:"fulfilled",value:e},--f||o(l))}),(function(e){d||(d=!0,l[n]={status:"rejected",reason:e},--f||o(l))}))})),--f||o(l)}));return m.error&&f(m.value),r.promise}})},678:function(e,t,r){r(674)},847:function(e,t,r){"use strict";(function(e){r.d(t,"a",(function(){return h}));r(14),r(153),r(7);var o=r(89),n=(r(182),r(16)),l=r(643),c=(r(248),r(818)),d=(r(729),r(639)),f="https://bip.to";class m{constructor(data){data=data||{};var t=[{name:"type",length:1},{name:"data",alias:"input"},{name:"payload",allowZero:!0,default:e.from([])},{name:"nonce",length:32,allowLess:!0},{name:"gasPrice",length:32,allowLess:!0},{name:"gasCoin",length:4,allowLess:!0,allowNonBinaryArray:!0,default:[]}];Object(l.K)(this,t,data)}}function h(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:f,{nonce:o,gasPrice:n,gasCoin:l,type:h,txType:y,data:data,txData:k,password:$}=t,C={nonce:o||0===o?Object(d.f)(o):[],gasPrice:n||0===n?Object(d.f)(n):[],gasCoin:l||0===l?Object(d.f)(l):[],type:h||y,data:Object(c.b)(data||k,h||y)},w=t.message||t.payload;w&&("string"==typeof w&&(w=e.from(w,"utf-8")),C.payload=w),-1===(r=r.replace(/\/$/,"")).indexOf("://")&&(r="https://".concat(r));var E=new m(C),x="".concat(r,"/tx/").concat(v(E.serialize()));return $&&(x+="?p=".concat(v(_($)))),x}function v(t){return e.from(t).toString("base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"")}function _(t){return"string"!=typeof t||Object(n.isHexPrefixed)(t)?Object(o.toBuffer)(t):e.from(t,"utf8")}}).call(this,r(3).Buffer)}}]);