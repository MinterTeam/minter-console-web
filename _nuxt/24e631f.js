(window.webpackJsonp=window.webpackJsonp||[]).push([[7],{1425:function(t,e,n){"use strict";n.r(e);n(31),n(32),n(35),n(1),n(48),n(30),n(52);var o=n(6),r=(n(21),n(237)),c=n(766),l=n(788),d=n(785),f=n(756),m=n(770);function v(object,t){var e=Object.keys(object);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(object);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(object,t).enumerable}))),e.push.apply(e,n)}return e}function h(t){for(var i=1;i<arguments.length;i++){var source=null!=arguments[i]?arguments[i]:{};i%2?v(Object(source),!0).forEach((function(e){Object(o.a)(t,e,source[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(source)):v(Object(source)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(source,e))}))}return t}var y={components:{QrcodeVue:l.a,InlineSvg:d.a,Modal:f.a,ButtonCopyIcon:m.a},fetch:function(t){var e=t.app;t.store.commit("SET_SECTION_NAME",e.$td("Account","common.page-account"))},head:function(){var title=Object(c.a)(this.$store.state.sectionName,this.$i18n.locale),t=this.$td("Get your account information, such as username, address, private key, and seed phrase.","account.seo-description"),e="en"===this.$i18n.locale?"":"-"+this.$i18n.locale;return{title:title,meta:[{hid:"og-title",name:"og:title",content:title},{hid:"description",name:"description",content:t},{hid:"og-description",name:"og:description",content:t},{hid:"og-image",name:"og:image",content:"".concat(this.BASE_URL_PREFIX,"/img/social-share-account").concat(e,".png")}]}},data:function(){return{visiblePrivate:!1,visibleMnemonic:!1,isAddressQrModalVisible:!1}},computed:h(h({},Object(r.b)(["privateKey","mnemonic","address","addressUrl"])),{},{username:function(){return this.$store.state.user.username},email:function(){return this.$store.state.user.email}})},_=n(60),component=Object(_.a)(y,(function(){var t=this,e=t._self._c;return e("section",{staticClass:"u-section u-container"},[e("div",{staticClass:"panel"},[e("div",{staticClass:"panel__header"},[e("h1",{staticClass:"panel__header-title"},[t._v("\n                    "+t._s(t.$td("Account","account.title"))+"\n                ")])]),t._v(" "),e("dl",{staticClass:"dl--table"},[t.username?e("dt",[t._v(t._s(t.$td("Username:","account.username")))]):t._e(),t._v(" "),t.username?e("dd",[t._v("@"+t._s(t.username))]):t._e(),t._v(" "),t.email?e("dt",[t._v(t._s(t.$td("Email:","account.email")))]):t._e(),t._v(" "),t.email?e("dd",[t._v(t._s(t.email))]):t._e(),t._v(" "),e("dt",[t._v(t._s(t.$td("Address:","account.address")))]),t._v(" "),e("dd",{staticClass:"u-icon-wrap"},[e("a",{staticClass:"link--default u-icon-text",attrs:{href:t.addressUrl,target:"_blank"}},[t._v(t._s(t.address))]),t._v(" "),e("ButtonCopyIcon",{staticClass:"u-icon--copy--right",attrs:{"copy-text":t.address}}),t._v(" "),e("button",{staticClass:"u-icon u-icon--qr--right u-semantic-button link--opacity",on:{click:function(e){t.isAddressQrModalVisible=!0}}},[e("InlineSvg",{attrs:{src:"".concat(t.BASE_URL_PREFIX,"/img/icon-qr.svg"),width:"24",height:"24"}})],1)],1)])]),t._v(" "),e("Modal",{staticClass:"qr-modal",attrs:{isOpen:t.isAddressQrModalVisible},on:{"update:isOpen":function(e){t.isAddressQrModalVisible=e},"update:is-open":function(e){t.isAddressQrModalVisible=e}}},[e("QrcodeVue",{staticClass:"qr-modal__layer",attrs:{value:t.address,size:280,level:"L"}})],1)],1)}),[],!1,null,null,null);e.default=component.exports},756:function(t,e,n){"use strict";n(57);var o={props:{isOpen:{type:Boolean,default:!1},hideCloseButton:{type:Boolean,default:!1},modalClass:{type:String,default:""},modalContainerClass:{type:String,default:""},keepMarkup:{type:Boolean,default:!1}},data:function(){return{elFocusedBeforeOpen:null}},watch:{isOpen:function(t){var e=this;t?(this.elFocusedBeforeOpen=document.activeElement,setTimeout((function(){if("function"==typeof e.$el.querySelector){var t=e.$el.querySelector("[data-focus-on-open]");t&&t.focus()}}),0)):setTimeout((function(){e.elFocusedBeforeOpen&&setTimeout((function(){e.elFocusedBeforeOpen.focus(),e.elFocusedBeforeOpen=null}),0)}),0)}},methods:{closeModal:function(){this.$emit("update:isOpen",!1),this.$emit("modal-close")},handleModalClick:function(t){this.hideCloseButton||this.$refs.modalContainer&&t.target!==this.$refs.modalContainer&&!this.$refs.modalContainer.contains(t.target)&&this.closeModal()},handleModalKeydown:function(t){this.hideCloseButton||"Escape"!==t.code&&27!==t.keyCode||(t.preventDefault(),this.closeModal())}}},r=n(60),component=Object(r.a)(o,(function(){var t=this,e=t._self._c;return e("transition",{attrs:{name:"v-transition-modal"}},[t.isOpen||t.keepMarkup?e("div",{staticClass:"modal-wrap"},[e("transition",{attrs:{name:"v-transition-modal"}},[e("div",{directives:[{name:"show",rawName:"v-show",value:t.isOpen||!t.keepMarkup,expression:"isOpen || !keepMarkup"}],staticClass:"modal u-container u-container--wide",class:t.modalClass,attrs:{tabindex:"-1",role:"dialog"},on:{click:t.handleModalClick,keydown:t.handleModalKeydown}},[t.hideCloseButton?t._e():e("button",{staticClass:"modal__close u-semantic-button link--opacity",attrs:{type:"button"}},[e("span",{staticClass:"modal__close-icon"},[t._v("Close")])]),t._v(" "),e("div",{staticClass:"modal__wrap"},[e("div",{ref:"modalContainer",staticClass:"modal__container",class:t.modalContainerClass},[t._t("default")],2)])])])],1):t._e()])}),[],!1,null,null,null);e.a=component.exports},766:function(t,e,n){"use strict";n.d(e,"a",(function(){return r}));var o=n(4);function r(text,t){var e="ru"===t?"Консоль":"Console";return text?o.d+e+". "+text+o.c:o.d+e+o.c}},770:function(t,e,n){"use strict";var o=n(785),r=n(771),c={components:{InlineSvg:o.a,ButtonCopy:r.a},props:{copyText:{type:String,required:!0}}},l=n(60),component=Object(l.a)(c,(function(){var t=this,e=t._self._c;return e("ButtonCopy",{staticClass:"u-icon u-semantic-button link--opacity",attrs:{"aria-label":"Copy","copy-text":t.copyText}},[e("InlineSvg",{attrs:{src:"".concat(t.BASE_URL_PREFIX,"/img/icon-copy.svg")}})],1)}),[],!1,null,null,null);e.a=component.exports},771:function(t,e,n){"use strict";n(1),n(7);var o=n(790),r={props:{copyText:{type:String,required:!0}},computed:{isClipboardSupported:function(){return o.b()}},methods:{copy:function(t){o.a(t.toString())&&this.$store.commit("SET_SNACKBAR_ACTIVE")}}},c=n(60),component=Object(c.a)(r,(function(){var t=this,e=t._self._c;return t.isClipboardSupported?e("button",{attrs:{type:"button"},on:{click:function(e){return t.copy(t.copyText)}}},[t._t("default")],2):t._e()}),[],!1,null,null,null);e.a=component.exports},785:function(t,e,n){"use strict";n.d(e,"a",(function(){return r}));n(1),n(31),n(39);var o={};var r={name:"InlineSvg",inheritAttrs:!1,render:function(t){return this.svgElSource?t("svg",{on:this.$listeners,attrs:Object.assign(this.getSvgAttrs(this.svgElSource),(e=this.$attrs,Object.keys(e).reduce((function(t,n){return!1!==e[n]&&null!==e[n]&&void 0!==e[n]&&(t[n]=e[n]),t}),{}))),domProps:{innerHTML:this.getSvgContent(this.svgElSource)}}):null;var e},props:{src:{type:String,required:!0},title:{type:String},transformSource:{type:Function,default:function(svg){return svg}},keepDuringLoading:{type:Boolean,default:!0}},data:function(){return{svgElSource:null}},watch:{src:function(t){this.getSource(t)}},mounted:function(){this.getSource(this.src)},methods:{getSvgAttrs:function(t){var e={},n=t.attributes;if(!n)return e;for(var i=n.length-1;i>=0;i--)e[n[i].name]=n[i].value;return e},getSvgContent:function(t){return t=t.cloneNode(!0),t=this.transformSource(t),this.title&&function(svg,title){var t=svg.getElementsByTagName("title");if(t.length)t[0].textContent=title;else{var e=document.createElementNS("http://www.w3.org/2000/svg","title");e.textContent=title,svg.insertBefore(e,svg.firstChild)}}(t,this.title),t.innerHTML},getSource:function(t){var e=this;o[t]||(o[t]=this.download(t)),this.svgElSource&&o[t].getIsPending()&&!this.keepDuringLoading&&(this.svgElSource=null,this.$emit("unloaded")),o[t].then((function(svg){e.svgElSource=svg,e.$nextTick((function(){e.$emit("loaded",e.$el)}))})).catch((function(n){e.svgElSource&&(e.svgElSource=null,e.$emit("unloaded")),delete o[t],e.$emit("error",n)}))},download:function(t){return function(t){if(t.getIsPending)return t;var e=!0,n=t.then((function(t){return e=!1,t}),(function(t){throw e=!1,t}));return n.getIsPending=function(){return e},n}(new Promise((function(e,n){var o=new XMLHttpRequest;o.open("GET",t,!0),o.onload=function(){if(o.status>=200&&o.status<400)try{var t=(new DOMParser).parseFromString(o.responseText,"text/xml").getElementsByTagName("svg")[0];t?e(t):n(new Error('Loaded file is not valid SVG"'))}catch(t){n(t)}else n(new Error("Error loading SVG"))},o.onerror=n,o.send()})))}}}},790:function(t,e,n){"use strict";function o(t){var e=document.createElement("textarea");e.value=t,e.setAttribute("readonly",""),e.style.position="absolute",e.style.left="-9999px",document.body.appendChild(e);var n=document.getSelection(),o=n.rangeCount>0&&n.getRangeAt(0);e.select(),e.selectionStart=0,e.selectionEnd=t.length;var r=document.execCommand("copy");return document.body.removeChild(e),o&&(n.removeAllRanges(),n.addRange(o)),r}function r(){return"undefined"!=typeof document&&"function"==typeof document.queryCommandSupported&&document.queryCommandSupported("copy")}n.d(e,"a",(function(){return o})),n.d(e,"b",(function(){return r}))}}]);