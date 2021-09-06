(window.webpackJsonp=window.webpackJsonp||[]).push([[24],{1055:function(t,e,n){"use strict";n.r(e);var l=n(29),r=n(123),o=n(47),d=n(540),c=n(74),_=n(3),m=n(569),v=n(567),h=n(542),f=n(554),x=(n(27),n(530)),y=n(531),C=n.n(y),w=n(537),k=n.n(w),$=n(544),T=n(2),S=n(37),L=n(550),A=n(539),O=n(541),M=n(547),E=n(555),P={TX_TYPE:T.a,components:{BaseAmount:L.a,TxForm:A.a,FieldCoin:O.a,FieldDomain:M.a,FieldUseMax:E.a},directives:{autosize:$.a},mixins:[x.validationMixin],data:()=>({form:{address:"",amount:"",coinSymbol:""},domain:"",isDomainResolving:!1}),validations(){return{form:{address:{required:C.a,validAddress:this.isDomainResolving?()=>new Promise((()=>0)):S.c},amount:{required:C.a},coinSymbol:{required:C.a,minLength:this.$store.getters.isOfflineMode?()=>!0:k()(3)}}}},computed:{},methods:{prettyExact:c.s,clearForm(){this.form.address="",this.form.amount="",this.form.coinSymbol="",this.$v.$reset()}}},B=n(42),D=Object(B.a)(P,(function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("TxForm",{attrs:{"data-test-id":"walletSend",txData:{to:t.form.address,value:t.form.amount,coin:t.form.coinSymbol},$txData:t.$v.form,txType:t.$options.TX_TYPE.SEND},on:{"clear-form":function(e){return t.clearForm()}},scopedSlots:t._u([{key:"panel-header",fn:function(){return[n("h1",{staticClass:"panel__header-title"},[t._v("\n            "+t._s(t.$td("Send Coins","wallet.send-title"))+"\n        ")]),t._v(" "),n("p",{staticClass:"panel__header-description"},[t._v("\n            "+t._s(t.$td("Transfer your coins to whomever you want—friends, family members, or business partners.","wallet.send-description"))+"\n        ")])]},proxy:!0},{key:"default",fn:function(e){var l=e.fee,r=e.addressBalance;return[n("div",{staticClass:"u-cell u-cell--xlarge--1-2"},[n("FieldDomain",{attrs:{"data-test-id":"walletSendInputAddress",$value:t.$v.form.address,valueType:"address",label:t.$td("Address or domain","form.wallet-send-address")},on:{"update:domain":function(e){t.domain=e},"update:resolving":function(e){t.isDomainResolving=e}},model:{value:t.form.address,callback:function(e){t.$set(t.form,"address","string"==typeof e?e.trim():e)},expression:"form.address"}})],1),t._v(" "),n("div",{staticClass:"u-cell u-cell--xlarge--1-4 u-cell--small--1-2"},[n("FieldCoin",{attrs:{"data-test-id":"walletSendInputCoin",$value:t.$v.form.coinSymbol,label:t.$td("Coin","form.coin"),"coin-list":r},model:{value:t.form.coinSymbol,callback:function(e){t.$set(t.form,"coinSymbol",e)},expression:"form.coinSymbol"}}),t._v(" "),t.$v.form.coinSymbol.$dirty&&!t.$v.form.coinSymbol.required?n("span",{staticClass:"form-field__error"},[t._v(t._s(t.$td("Enter coin symbol","form.coin-error-required")))]):t.$v.form.coinSymbol.$dirty&&!t.$v.form.coinSymbol.minLength?n("span",{staticClass:"form-field__error"},[t._v(t._s(t.$td("Min 3 letters","form.coin-error-min")))]):t._e()],1),t._v(" "),n("div",{staticClass:"u-cell u-cell--xlarge--1-4 u-cell--small--1-2"},[n("FieldUseMax",{attrs:{"data-test-id":"walletSendInputAmount",$value:t.$v.form.amount,label:t.$td("Amount","form.wallet-send-amount"),"selected-coin-symbol":t.form.coinSymbol,fee:l,"address-balance":r},model:{value:t.form.amount,callback:function(e){t.$set(t.form,"amount",e)},expression:"form.amount"}}),t._v(" "),t.$v.form.amount.$dirty&&!t.$v.form.amount.required?n("span",{staticClass:"form-field__error"},[t._v(t._s(t.$td("Enter amount","form.amount-error-required")))]):t._e()],1)]}},{key:"confirm-modal-header",fn:function(){return[n("h1",{staticClass:"panel__header-title"},[n("img",{staticClass:"panel__header-title-icon",attrs:{src:t.BASE_URL_PREFIX+"/img/icon-send.svg",alt:"",role:"presentation",width:"40",height:"40"}}),t._v("\n            "+t._s(t.$td("Send Coins","wallet.send-title"))+"\n        ")])]},proxy:!0},{key:"confirm-modal-body",fn:function(){return[n("div",{staticClass:"u-grid u-grid--small u-grid--vertical-margin u-text-left"},[n("div",{staticClass:"u-cell"},[n("div",{staticClass:"form-field form-field--dashed"},[n("BaseAmount",{staticClass:"form-field__input is-not-empty",attrs:{tag:"div",coin:t.form.coinSymbol,amount:t.form.amount,exact:!0}}),t._v(" "),n("div",{staticClass:"form-field__label"},[t._v(t._s(t.$td("You send","form.wallet-send-confirm-amount")))])],1)]),t._v(" "),n("div",{staticClass:"u-cell"},[n("label",{staticClass:"form-field form-field--dashed"},[n("textarea",{directives:[{name:"autosize",rawName:"v-autosize"}],staticClass:"form-field__input is-not-empty",attrs:{autocapitalize:"off",spellcheck:"false",readonly:"",tabindex:"-1",rows:"1"},domProps:{value:t.form.address+(t.domain?"\n("+t.domain+")":"")}}),t._v(" "),n("span",{staticClass:"form-field__label"},[t._v(t._s(t.$td("To the address","form.wallet-send-confirm-address")))])])])])]},proxy:!0}])})}),[],!1,null,null,null).exports,V=n(532),U={components:{Loader:V.a},props:{isLoading:{type:Boolean,default:!1}},data:()=>({isFullListActive:!1}),computed:{hasCustomCoins(){return this.$store.getters.balance.filter((t=>t.coin.symbol!==this.$store.getters.COIN_NAME)).length},coinList(){return this.isFullListActive?this.$store.getters.balance:this.$store.getters.balance.slice(0,5)}},methods:{pretty:c.r,getCoinIconUrl(t){return this.$store.getters["explorer/getCoinIcon"](t)}}},j=Object(B.a)(U,(function(){var t=this,e=t.$createElement,n=t._self._c||e;return t.hasCustomCoins?n("section",{staticClass:"panel"},[n("div",{staticClass:"table-wrap"},[t.coinList.length?n("table",[n("thead",[n("tr",{staticClass:"u-text-nowrap"},[n("th",[t._v(t._s(t.$td("My coins","wallet.coin-table-name")))]),t._v(" "),n("th",{attrs:{width:"30%"}},[t._v(t._s(t.$td("Balance","wallet.coin-table-balance")))])])]),t._v(" "),n("tbody",t._l(t.coinList,(function(e){return n("tr",{key:e.coin.id,staticClass:"u-text-nowrap"},[n("td",[n("img",{staticClass:"wallet__coin-icon",attrs:{src:t.getCoinIconUrl(e.coin.symbol),width:"28",height:"28",alt:"",role:"presentation"}}),t._v(" "),n("span",{staticClass:"wallet__coin-name"},[t._v(t._s(e.coin.symbol))]),t._v(" "),e.coin.verified?n("img",{staticClass:"wallet__coin-verified",attrs:{src:t.BASE_URL_PREFIX+"/img/icon-verified.svg",width:"12",height:"12",alt:"",role:"presentation"}}):t._e()]),t._v(" "),n("td",[t._v("\n                        "+t._s(t.pretty(e.amount))+"\n                    ")])])})),0)]):t.isLoading?n("div",{staticClass:"panel__content panel__section u-text-center"},[n("Loader",{attrs:{isLoading:!0}})],1):n("div",{staticClass:"panel__content panel__section u-text-center"},[t._v("No Coins")])]),t._v(" "),t.coinList.length<t.$store.state.balance.length?n("div",{staticClass:"panel__section u-text-center"},[n("button",{staticClass:"button button--ghost-main",on:{click:function(e){t.isFullListActive=!0}}},[t._v(t._s(t.$td("Show all coins","wallet.coin-show-all")))])]):t._e()]):t._e()}),[],!1,null,null,null).exports,I=(n(8),n(120),n(171)),R=n(627);function N(object,t){var e=Object.keys(object);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(object);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(object,t).enumerable}))),e.push.apply(e,n)}return e}function F(t){for(var i=1;i<arguments.length;i++){var source=null!=arguments[i]?arguments[i]:{};i%2?N(Object(source),!0).forEach((function(e){Object(l.a)(t,e,source[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(source)):N(Object(source)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(source,e))}))}return t}var Q={components:{Loader:V.a,TableLink:R.a},filters:{pretty:c.r,txType:c.B,short:c.y,time:c.o},props:{txList:{type:Array,required:!0},isLoading:{type:Boolean,default:!1}},data:()=>({isTxExpanded:{}}),computed:F(F({},Object(r.b)(["address"])),{},{timeZone:()=>Object(c.p)(new Date)}),methods:{isDefined:t=>void 0!==t,toggleTx(t){this.isTxExpanded={[t]:!this.isTxExpanded[t]}},isTxType:(t,e)=>t.type===Number(e),isSell(t){return this.isTxType(t,T.a.SELL)||this.isTxType(t,T.a.SELL_ALL)},isSellPool(t){return this.isTxType(t,T.a.SELL_SWAP_POOL)||this.isTxType(t,T.a.SELL_ALL_SWAP_POOL)},isBuy(t){return this.isTxType(t,T.a.BUY)},isBuyPool(t){return this.isTxType(t,T.a.BUY_SWAP_POOL)},isMultisend(t){return this.isTxType(t,T.a.MULTISEND)},isIncomeMultisend(t){if(this.isMultisend(t))return!(this.address===t.from)},isIncomeSend(t){return this.address===t.data.to},isReceive(t){return this.isIncomeSend(t)||this.isIncomeMultisend(t)},getAmount(t){return t.data.value||this.getConvertValue(t)||t.data.stake||t.data.initialAmount||t.data.check&&t.data.check.value||this.getMultisendValue(t)},hasAmount(t){return void 0!==this.getAmount(t)},getAmountWithCoin(t){return this.isMultisend(t)&&this.isMultisendMultipleCoin(t)?"Multiple coins":((null===(e=t.data.coin)||void 0===e?void 0:e.symbol)||t.data.symbol||this.getConvertCoinSymbol(t)||(null===(n=t.data.check)||void 0===n?void 0:n.coin.symbol)||this.getMultisendCoinSymbol(t))+" "+Object(c.r)(this.getAmount(t)||0);var e,n},getConvertCoinSymbol(t){return this.isSell(t)?t.data.coinToSell.symbol:this.isBuy(t)?t.data.coinToBuy.symbol:this.isSellPool(t)?t.data.coins[0].symbol:this.isBuyPool(t)?t.data.coins[t.data.coins.length-1].symbol:void 0},getConvertValue(t){return this.isSell(t)||this.isSellPool(t)?t.data.valueToSell:this.isBuy(t)||this.isBuyPool(t)?t.data.valueToBuy:void 0},isEditPool(t){return this.isTxType(t,T.a.CREATE_SWAP_POOL)||this.isTxType(t,T.a.ADD_LIQUIDITY)||this.isTxType(t,T.a.REMOVE_LIQUIDITY)},getPoolCoins(t){var e,n;return t.data.coin0.id<t.data.coin1.id?(e=t.data.coin0.symbol,n=t.data.coin1.symbol):(e=t.data.coin1.symbol,n=t.data.coin0.symbol),"".concat(e," / ").concat(n)},getMultisendDeliveryList(t){return!this.isIncomeMultisend(t)?t.data.list:t.data.list.filter((t=>this.address===t.to))},isMultisendMultipleCoin(t){if(this.isMultisend(t)){var e=this.getMultisendDeliveryList(t);return e.some((t=>t.coin.id!==e[0].coin.id))}},getMultisendCoinSymbol(t){if(this.isMultisend(t))return this.isMultisendMultipleCoin(t)?void 0:this.getMultisendDeliveryList(t)[0].coin.symbol},getMultisendValue(t){if(this.isMultisend(t)){var e=this.getMultisendDeliveryList(t);return this.isMultisendMultipleCoin(t)?"...":e.reduce(((t,e)=>t.plus(e.value)),new I.a(0)).toString()}},getValidatorName(t){if(t.data.pubKey){var e=this.$store.state.validatorMetaList.find((e=>e.publicKey===t.data.pubKey));return null==e?void 0:e.name}},fromBase64:c.d,getExplorerBlockUrl:c.h,getExplorerTxUrl:c.k,getExplorerAddressUrl:c.g,getExplorerValidatorUrl:c.l}},W=Object(B.a)(Q,(function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("section",{staticClass:"panel"},[n("div",{staticClass:"table-wrap"},[t.txList.length?n("table",[n("thead",[n("tr",{staticClass:"u-text-nowrap"},[n("th",{staticClass:"u-hidden-small-down"},[t._v(t._s(t.$td("Latest Transactions","wallet.tx-title")))]),t._v(" "),n("th",{staticClass:"u-hidden-small-up",attrs:{colspan:"3"}},[t._v(t._s(t.$td("Latest Transactions","wallet.tx-title")))]),t._v(" "),n("th",{staticClass:"u-hidden-small-down"},[t._v(t._s(t.$td("Block","wallet.tx-table-block")))]),t._v(" "),n("th",{staticClass:"u-hidden-xlarge-down"},[t._v(t._s(t.$td("TimeStamp","wallet.tx-table-time"))+" ("+t._s(t.timeZone)+")")]),t._v(" "),n("th",{staticClass:"u-hidden-xlarge-down"},[t._v(t._s(t.$td("From","wallet.tx-table-from")))]),t._v(" "),n("th",{staticClass:"u-hidden-large-down"},[t._v(t._s(t.$td("Type","wallet.tx-table-type")))]),t._v(" "),n("th",{staticClass:"u-hidden-large-down"},[t._v(t._s(t.$td("Amount","wallet.tx-table-amount")))]),t._v(" "),n("th",{staticClass:"u-hidden-large-up u-hidden-small-down"},[t._v(t._s(t.$td("Value","wallet.tx-table-value")))]),t._v(" "),n("th",{staticClass:"table__controls-cell u-hidden-small-down"})])]),t._v(" "),n("tbody",[t._l(t.txList,(function(e){return[n("tr",{key:e.txn,staticClass:"u-text-nowrap",class:{"is-expanded":t.isTxExpanded[e.txn]}},[n("td",[n("TableLink",{attrs:{"data-test-id":"walletTxHash","link-text":e.hash,"link-path":t.getExplorerTxUrl(e.hash)}})],1),t._v(" "),n("td",{staticClass:"u-hidden-small-down"},[n("TableLink",{attrs:{"link-text":e.height,"link-path":t.getExplorerBlockUrl(e.height),"should-not-shorten":!0}})],1),t._v(" "),n("td",{staticClass:"u-hidden-xlarge-down"},[t._v(t._s(t._f("time")(e.timestamp)))]),t._v(" "),n("td",{staticClass:"u-hidden-xlarge-down"},[n("TableLink",{attrs:{"link-text":e.from,"link-path":t.getExplorerAddressUrl(e.from)}})],1),t._v(" "),n("td",{staticClass:"u-hidden-large-down"},[t.isReceive(e)?n("span",[t._v("Receive")]):n("span",[t._v(t._s(t._f("txType")(e.type)))])]),t._v(" "),n("td",{staticClass:"u-hidden-large-down"},[t.hasAmount(e)?[t._v("\n                                    "+t._s(t.getAmountWithCoin(e))+"\n                                ")]:t.isEditPool(e)?[t._v("\n                                    "+t._s(t.getPoolCoins(e))+"\n                                ")]:t._e()],2),t._v(" "),n("td",{staticClass:"u-hidden-large-up"},[t.isReceive(e)?n("span",[t._v("Receive")]):n("span",[t._v(t._s(t._f("txType")(e.type)))]),t._v(" "),t.hasAmount(e)?n("span",[t._v("\n                                    "+t._s(t.getAmountWithCoin(e))+"\n                                ")]):t._e()]),t._v(" "),n("td",{staticClass:"table__controls-cell"},[n("button",{staticClass:"table__controls-button table__controls-button--expand u-semantic-button link--opacity",class:{"is-expanded":t.isTxExpanded[e.txn]},on:{click:function(n){return t.toggleTx(e.txn)}}},[t._v("Show Tx Data")])])]),t._v(" "),t.isTxExpanded[e.txn]?n("tr",{key:"exp"+e.txn,staticClass:"table__row-expanded-data"},[n("td",{attrs:{colspan:"7"}},[n("div",{staticClass:"table__inner"},[n("div",{staticClass:"table__inner-item u-hidden-xlarge-up"},[n("strong",[t._v(t._s(t.$td("From","wallet.tx-table-from")))]),t._v(" "),n("br"),t._v(" "),n("TableLink",{attrs:{"link-text":e.from,"link-path":t.getExplorerAddressUrl(e.from),"should-not-shorten":!0}})],1),t._v(" "),e.data.to?n("div",{staticClass:"table__inner-item"},[n("strong",[t._v(t._s(t.$td("To","wallet.tx-table-to")))]),t._v(" "),n("br"),t._v(" "),n("TableLink",{attrs:{"link-text":e.data.to,"link-path":t.getExplorerAddressUrl(e.data.to),"should-not-shorten":!0}})],1):t._e(),t._v(" "),t.isSell(e)?n("div",{staticClass:"table__inner-item"},[n("strong",[t._v(t._s(t.$td("Sell coins","wallet.tx-table-sell")))]),t._v(" "),n("br"),t._v("\n                                        "+t._s(e.data.coinToSell.symbol)+" "+t._s(t._f("pretty")(e.data.valueToSell))+"\n                                    ")]):t._e(),t._v(" "),t.isSell(e)?n("div",{staticClass:"table__inner-item"},[n("strong",[t._v(t._s(t.$td("Get coins","wallet.tx-table-get")))]),t._v(" "),n("br"),t._v("\n                                        "+t._s(e.data.coinToBuy.symbol)+" "+t._s(t._f("pretty")(e.data.valueToBuy))+"\n                                    ")]):t._e(),t._v(" "),t.isSellPool(e)?n("div",{staticClass:"table__inner-item"},[n("strong",[t._v(t._s(t.$td("Sell coins","wallet.tx-table-sell")))]),t._v(" "),n("br"),t._v("\n                                        "+t._s(e.data.coins[0].symbol)+" "+t._s(t._f("pretty")(e.data.valueToSell))+"\n                                    ")]):t._e(),t._v(" "),t.isSellPool(e)?n("div",{staticClass:"table__inner-item"},[n("strong",[t._v(t._s(t.$td("Get coins","wallet.tx-table-get")))]),t._v(" "),n("br"),t._v("\n                                        "+t._s(e.data.coins[e.data.coins.length-1].symbol)+" "+t._s(t._f("pretty")(e.data.valueToBuy))+"\n                                    ")]):t._e(),t._v(" "),t.isBuy(e)?n("div",{staticClass:"table__inner-item"},[n("strong",[t._v(t._s(t.$td("Buy coins","wallet.tx-table-buy")))]),t._v(" "),n("br"),t._v("\n                                        "+t._s(e.data.coinToBuy.symbol)+" "+t._s(t._f("pretty")(e.data.valueToBuy))+"\n                                    ")]):t._e(),t._v(" "),t.isBuy(e)?n("div",{staticClass:"table__inner-item"},[n("strong",[t._v(t._s(t.$td("Spend coins","wallet.tx-table-spend")))]),t._v(" "),n("br"),t._v("\n                                        "+t._s(e.data.coinToSell.symbol)+" "+t._s(t._f("pretty")(e.data.valueToSell))+"\n                                    ")]):t._e(),t._v(" "),t.isBuyPool(e)?n("div",{staticClass:"table__inner-item"},[n("strong",[t._v(t._s(t.$td("Buy coins","wallet.tx-table-buy")))]),t._v(" "),n("br"),t._v("\n                                        "+t._s(e.data.coins[e.data.coins.length-1].symbol)+" "+t._s(t._f("pretty")(e.data.valueToBuy))+"\n                                    ")]):t._e(),t._v(" "),t.isBuyPool(e)?n("div",{staticClass:"table__inner-item"},[n("strong",[t._v(t._s(t.$td("Spend coins","wallet.tx-table-spend")))]),t._v(" "),n("br"),t._v("\n                                        "+t._s(e.data.coins[0].symbol)+" "+t._s(t._f("pretty")(e.data.valueToSell))+"\n                                    ")]):t._e(),t._v(" "),e.data.name?n("div",{staticClass:"table__inner-item"},[n("strong",[t._v(t._s(t.$td("Name","wallet.tx-table-name")))]),t._v(" "),n("br"),t._v("\n                                        "+t._s(e.data.name)+"\n                                    ")]):t._e(),t._v(" "),e.data.symbol?n("div",{staticClass:"table__inner-item"},[n("strong",[t._v(t._s(t.$td("Symbol","wallet.tx-table-symbol")))]),t._v(" "),n("br"),t._v("\n                                        "+t._s(e.data.symbol)+"\n                                    ")]):t._e(),t._v(" "),e.data.initialAmount?n("div",{staticClass:"table__inner-item"},[n("strong",[t._v(t._s(t.$td("Initial amount","wallet.tx-table-initial-amount")))]),t._v(" "),n("br"),t._v("\n                                        "+t._s(t._f("pretty")(e.data.initialAmount))+"\n                                    ")]):t._e(),t._v(" "),e.data.initialReserve?n("div",{staticClass:"table__inner-item"},[n("strong",[t._v(t._s(t.$td("Initial reserve","wallet.tx-table-reserve")))]),t._v(" "),n("br"),t._v("\n                                        "+t._s(t._f("pretty")(e.data.initialReserve))+"\n                                    ")]):t._e(),t._v(" "),e.data.constantReserveRatio?n("div",{staticClass:"table__inner-item"},[n("strong",[t._v(t._s(t.$td("CRR","wallet.tx-table-crr")))]),t._v(" "),n("br"),t._v("\n                                        "+t._s(e.data.constantReserveRatio)+" %\n                                    ")]):t._e(),t._v(" "),t.getValidatorName(e)?n("div",{staticClass:"table__inner-item"},[n("strong",[t._v("Validator")]),t._v(" "),n("br"),t._v(" "),n("TableLink",{attrs:{"link-text":t.getValidatorName(e),"link-path":t.getExplorerValidatorUrl(e.data.pubKey),"should-not-shorten":!0}})],1):t._e(),t._v(" "),e.data.pubKey?n("div",{staticClass:"table__inner-item"},[n("strong",[t._v(t._s(t.$td("Public key","wallet.tx-table-public")))]),t._v(" "),n("br"),t._v(" "),n("TableLink",{attrs:{"link-text":e.data.pubKey,"link-path":t.getExplorerValidatorUrl(e.data.pubKey),"should-not-shorten":!0}})],1):t._e(),t._v(" "),t.isDefined(e.data.stake)?n("div",{staticClass:"table__inner-item"},[n("strong",[t._v(t._s(t.$td("Stake","wallet.tx-table-stake")))]),t._v(" "),n("br"),t._v("\n                                        "+t._s(e.data.coin.symbol)+" "+t._s(t._f("pretty")(e.data.stake))+"\n                                    ")]):t._e(),t._v(" "),t.isDefined(e.data.commission)?n("div",{staticClass:"table__inner-item"},[n("strong",[t._v(t._s(t.$td("Commission","wallet.tx-table-commission")))]),t._v(" "),n("br"),t._v("\n                                        "+t._s(e.data.commission)+" %\n                                    ")]):t._e(),t._v(" "),e.data.ownerAddress?n("div",{staticClass:"table__inner-item"},[n("strong",[t._v(t._s(t.$td("Owner address","wallet.tx-table-owner-address")))]),t._v(" "),n("br"),t._v(" "),n("TableLink",{attrs:{"link-text":e.data.ownerAddress,"link-path":t.getExplorerAddressUrl(e.data.ownerAddress),"should-not-shorten":!0}})],1):t._e(),t._v(" "),e.data.rewardAddress?n("div",{staticClass:"table__inner-item"},[n("strong",[t._v(t._s(t.$td("Reward address","wallet.tx-table-reward-address")))]),t._v(" "),n("br"),t._v(" "),n("TableLink",{attrs:{"link-text":e.data.rewardAddress,"link-path":t.getExplorerAddressUrl(e.data.rewardAddress),"should-not-shorten":!0}})],1):t._e(),t._v(" "),e.data.controlAddress?n("div",{staticClass:"table__inner-item"},[n("strong",[t._v(t._s(t.$td("Control address","wallet.tx-table-control-address")))]),t._v(" "),n("br"),t._v(" "),n("TableLink",{attrs:{"link-text":e.data.controlAddress,"link-path":t.getExplorerAddressUrl(e.data.controlAddress),"should-not-shorten":!0}})],1):t._e(),t._v(" "),e.data.check&&e.data.check.sender?n("div",{staticClass:"table__inner-item"},[n("strong",[t._v(t._s(t.$td("Check issuer","wallet.tx-table-check-issuer")))]),t._v(" "),n("br"),t._v(" "),n("TableLink",{attrs:{"link-text":e.data.check.sender,"link-path":t.getExplorerAddressUrl(e.data.check.sender),"should-not-shorten":!0}})],1):t._e(),t._v(" "),e.data.check&&e.data.check.nonce?n("div",{staticClass:"table__inner-item"},[n("strong",[t._v(t._s(t.$td("Check nonce","wallet.tx-table-check-nonce")))]),t._v(" "),n("br"),t._v("\n                                        "+t._s(t.fromBase64(e.data.check.nonce))+"\n                                    ")]):t._e(),t._v(" "),e.data.check&&e.data.check.dueBlock?n("div",{staticClass:"table__inner-item"},[n("strong",[t._v(t._s(t.$td("Due block","wallet.tx-table-due-block")))]),t._v(" "),n("br"),t._v("\n                                        "+t._s(e.data.check.dueBlock)+"\n                                    ")]):t._e(),t._v(" "),e.data.multisigAddress?n("div",{staticClass:"table__inner-item"},[n("strong",[t._v(t._s(t.$td("Created multisig address","wallet.tx-table-multisig-address")))]),t._v(" "),n("br"),t._v(" "),n("TableLink",{attrs:{"link-text":e.data.multisigAddress,"link-path":t.getExplorerAddressUrl(e.data.multisigAddress),"should-not-shorten":!0}})],1):t._e(),t._v(" "),n("div",{staticClass:"table__inner-item u-hidden-small-up"},[n("strong",[t._v(t._s(t.$td("Block","wallet.tx-table-block")))]),t._v(" "),n("br"),t._v(" "),n("TableLink",{attrs:{"link-text":e.height,"link-path":t.getExplorerBlockUrl(e.height)}})],1),t._v(" "),n("div",{staticClass:"table__inner-item u-hidden-xlarge-up"},[n("strong",[t._v(t._s(t.$td("Timestamp","wallet.tx-table-time"))+" ("+t._s(t.timeZone)+")")]),t._v(" "),n("br"),t._v("\n                                        "+t._s(t._f("time")(e.timestamp))+"\n                                    ")]),t._v(" "),n("div",{staticClass:"table__inner-item"},[n("strong",[t._v(t._s(t.$td("Fee","wallet.tx-table-fee")))]),t._v(" "),n("br"),t._v("\n                                        "+t._s(t.$store.getters.COIN_NAME)+" "+t._s(t._f("pretty")(e.fee))+"\n                                    ")]),t._v(" "),e.payload?n("div",{staticClass:"table__inner-item"},[n("strong",[t._v("Message")]),t._v(" "),n("br"),t._v("\n                                        "+t._s(t.fromBase64(e.payload))+"\n                                    ")]):t._e()])])]):t._e()]}))],2)]):t.isLoading?n("div",{staticClass:"panel__content panel__section u-text-center"},[n("Loader",{attrs:{isLoading:!0}})],1):n("div",{staticClass:"panel__content panel__section u-text-center"},[t._v("No transactions")])]),t._v(" "),n("div",{staticClass:"panel__section u-text-center"},[n("a",{staticClass:"button button--ghost-main",attrs:{href:t.getExplorerAddressUrl(t.address),target:"_blank",tabindex:"0"}},[t._v(t._s(t.$td("Show All Transactions","wallet.explore-tx")))])])])}),[],!1,null,null,null).exports;function X(object,t){var e=Object.keys(object);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(object);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(object,t).enumerable}))),e.push.apply(e,n)}return e}function z(t){for(var i=1;i<arguments.length;i++){var source=null!=arguments[i]?arguments[i]:{};i%2?X(Object(source),!0).forEach((function(e){Object(l.a)(t,e,source[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(source)):X(Object(source)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(source,e))}))}return t}var K=null;function Y(t){return Object(o.b)(t,{limit:5})}var Z={components:{QrcodeVue:m.a,InlineSvg:v.a,Modal:h.a,ButtonCopyIcon:f.a,CoinSendForm:D,CoinList:j,TransactionLatestList:W},filters:{pretty:c.r},fetch(t){var{app:e,store:n}=t;n.commit("SET_SECTION_NAME",e.$td("Wallet","common.page-wallet")),n.getters.isOfflineMode||n.dispatch("FETCH_VALIDATOR_META_LIST")},asyncData(t){var{store:e}=t;if(!e.getters.isOfflineMode)return Y(e.getters.address).then((t=>({txList:t.data})))},head(){var title=Object(d.a)(this.$store.state.sectionName,this.$i18n.locale),t=this.$td("Transact MNT and other coins issued in the Minter ".concat(this.isTestnet?"test ":"","network. Almost instantly and fee-free."),this.isTestnet?"wallet.seo-description-testnet":"wallet.seo-description"),e="en"===this.$i18n.locale?"":"-"+this.$i18n.locale;return{title:title,meta:[{hid:"og-title",name:"og:title",content:title},{hid:"description",name:"description",content:t},{hid:"og-description",name:"og:description",content:t},{hid:"og-image",name:"og:image",content:"".concat(this.BASE_URL_PREFIX,"/img/social-share-wallet").concat(e,".png")}]}},data(){return{txList:[],isAddressQrModalVisible:!1,lastUpdateTimeDistance:this.getLastUpdateTimeDistance()}},computed:z(z({},Object(r.b)(["address","addressUrl","baseCoin"])),{},{isTestnet:()=>_.D===_.H}),watch:{"$store.state.balance":function(){Y(this.address).then((t=>{this.txList=t.data}))}},beforeMount(){K=setInterval((()=>{this.lastUpdateTimeDistance=this.getLastUpdateTimeDistance()}),1e3)},destroyed(){clearInterval(K)},methods:{getLastUpdateTimeDistance(){return Object(c.n)(this.$store.state.lastUpdateTime)}}},H=Object(B.a)(Z,(function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("section",{staticClass:"u-section u-container"},[n("div",{staticClass:"panel panel__header wallet__info"},[n("div",{staticClass:"wallet__address"},[n("img",{staticClass:"wallet__address-icon u-hidden-small-down",attrs:{src:t.BASE_URL_PREFIX+"/img/icon-wallet.svg",width:"40",height:"40",alt:"",role:"presentation"}}),t._v(" "),n("div",{staticClass:"wallet__address-content"},[n("div",[t._v(t._s(t.$td("Wallet address","wallet.address")))]),t._v(" "),n("div",{staticClass:"wallet__value u-icon-wrap"},[n("a",{staticClass:"link--default u-icon-text",attrs:{href:t.addressUrl,target:"_blank","data-test-id":"walletAddressLink"}},[t._v(t._s(t.address))]),t._v(" "),n("ButtonCopyIcon",{staticClass:"u-icon--copy--right u-text-white",attrs:{"copy-text":t.address}}),t._v(" "),n("button",{staticClass:"u-icon u-icon--qr--right u-text-white u-semantic-button link--opacity",on:{click:function(e){t.isAddressQrModalVisible=!0}}},[n("InlineSvg",{attrs:{src:t.BASE_URL_PREFIX+"/img/icon-qr.svg",width:"24",height:"24"}})],1)],1)])]),t._v(" "),t.$store.getters.isOfflineMode?t._e():n("div",{staticClass:"wallet__balance"},[n("div",{staticClass:"wallet__balance-caption"},[n("div",[t._v(t._s(t.$td("Balance","wallet.balance")))]),t._v(" "),n("nuxt-link",{staticClass:"link--default",attrs:{to:t.$i18nGetPreferredPath({name:"buy",query:{coin:t.$store.getters.BASE_COIN}})}},[t._v(t._s(t.$td("Top-up with ETH","wallet.top-up")))])],1),t._v(" "),n("div",{staticClass:"wallet__value",attrs:{"data-test-id":"walletBalanceValue"}},[t._v("\n                "+t._s(t._f("pretty")(t.baseCoin?t.baseCoin.amount:0))+" "+t._s(t.$store.getters.COIN_NAME)+"\n            ")]),t._v(" "),t.lastUpdateTimeDistance?n("div",{staticClass:"wallet__time"},[n("img",{staticClass:"wallet__time-icon",attrs:{src:t.BASE_URL_PREFIX+"/img/icon-time.svg",width:"14",height:"14",alt:"",role:"presentation"}}),t._v(" "),n("span",{staticClass:"wallet__time-text"},[t._v("Last updated "),n("strong",[t._v(t._s(t.lastUpdateTimeDistance))]),t._v(" ago")])]):t._e()])]),t._v(" "),n("CoinSendForm"),t._v(" "),n("CoinList"),t._v(" "),t.txList.length?n("TransactionLatestList",{attrs:{"tx-list":t.txList}}):t._e(),t._v(" "),n("Modal",{staticClass:"qr-modal",attrs:{isOpen:t.isAddressQrModalVisible},on:{"update:isOpen":function(e){t.isAddressQrModalVisible=e},"update:is-open":function(e){t.isAddressQrModalVisible=e}}},[n("QrcodeVue",{staticClass:"qr-modal__layer",attrs:{value:t.address,size:280,level:"L"}})],1)],1)}),[],!1,null,null,null);e.default=H.exports},545:function(t,e,n){"use strict";var l=n(226),r=(n(556),n(558)),o=["input"],d={ideFix:null,imaskAmount:{mask:Number,scale:18,signed:!1,thousandsSeparator:"",padFractionalZeros:!1,normalizeZeros:!1,radix:".",mapToRadix:[","]},directives:{imask:r.a},props:{value:{type:[String,Number],default:""}},data:()=>({maskedValue:""}),computed:{listeners(){var t=this.$listeners,{input:input}=t;return Object(l.a)(t,o)}},watch:{value(t){t!==this.maskedValue&&this.updateMaskState(t)}},mounted(){this.updateMaskState(this.value)},methods:{updateMaskState(t){this.$refs.input.maskRef.typedValue=t;var e=this.$refs.input.maskRef._value.length;this.$refs.input.maskRef._selection={start:e,end:e}},onAcceptInput(t){this.maskedValue=t.detail._unmaskedValue,this.$emit("input",t.detail._unmaskedValue)}}},c=n(42),component=Object(c.a)(d,(function(){var t=this,e=t.$createElement;return(t._self._c||e)("input",t._g({directives:[{name:"imask",rawName:"v-imask",value:t.$options.imaskAmount,expression:"$options.imaskAmount"}],ref:"input",attrs:{type:"text",autocapitalize:"off",inputmode:"decimal"},on:{accept:t.onAcceptInput}},t.listeners))}),[],!1,null,null,null);e.a=component.exports},555:function(t,e,n){"use strict";n(8),n(7),n(19);var l=n(171),r=n(344),o=n(529),d=n(74);var c={components:{InputMaskedAmount:n(545).a},directives:{checkEmpty:o.a},inheritAttrs:!1,props:{value:{type:[String,Number],required:!0},$value:{type:Object,required:!0},label:{type:String,required:!0},maxValue:{type:[String,Number],default:void 0},addressBalance:{type:Array,default:()=>[]},selectedCoinSymbol:{type:String,default:""},fee:{type:[Object,null],default:null}},data:()=>({isUseMax:!1}),computed:{maxValueComputed(){var t,e;if(void 0!==this.maxValue)return this.maxValue;var n=this.addressBalance.find((t=>t.coin.symbol===this.selectedCoinSymbol));if(n){if(!function(t,e){var n=Object(r.h)(e);if(!n&&t.symbol===e)return!0;if(n&&t.id===e)return!0;return!1}(n.coin,null===(t=this.fee)||void 0===t?void 0:t.coin))return n.amount;var o=(null===(e=this.fee)||void 0===e?void 0:e.value)||0,d=new l.a(n.amount).minus(o).toString();return d>0?d:"0"}},isMaxValueDefined(){return void 0!==this.maxValueComputed&&this.maxValueComputed>0},isMaxValueRounded(){return this.isMaxValueDefined&&!new l.a(this.maxValueComputed).eq(Object(d.r)(this.maxValueComputed).replace(/\s/g,""))}},watch:{value(t){(t||0===t)&&this.isMaxValueDefined&&new l.a(t).eq(this.maxValueComputed)||(this.isUseMax=!1)},maxValueComputed(t){this.isMaxValueDefined&&this.isUseMax&&this.useMax()}},methods:{pretty:d.r,useMax(){if(!this.isMaxValueDefined)return!1;this.isUseMax=!0,this.$emit("input",this.maxValueComputed),this.$emit("use-max"),this.$value.$touch()}}},_=n(42),component=Object(_.a)(c,(function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("label",{staticClass:"form-field",class:{"is-error":t.$value.$error,"form-field--with-use-max":t.isMaxValueDefined}},[n("InputMaskedAmount",t._b({directives:[{name:"check-empty",rawName:"v-check-empty"}],staticClass:"form-field__input",attrs:{type:"text",inputmode:"decimal",value:t.value},on:{input:function(e){return t.$emit("input",e)},blur:function(e){t.$value.$touch(),t.$emit("blur",e)}}},"InputMaskedAmount",t.$attrs,!1)),t._v(" "),t.isMaxValueDefined?n("button",{staticClass:"form-field__use-max link--main link--opacity u-semantic-button",attrs:{type:"button"},on:{click:t.useMax}},[t._v("Use max")]):t._e(),t._v(" "),t.isMaxValueDefined&&!t.isUseMax?n("span",{staticClass:"form-field__max-available"},[t._v("\n        "+t._s(t.isMaxValueRounded?"≈":"")+t._s(t.pretty(t.maxValueComputed))+"\n    ")]):t._e(),t._v(" "),n("span",{staticClass:"form-field__label"},[t._v(t._s(t.label))])],1)}),[],!1,null,null,null);e.a=component.exports},627:function(t,e,n){"use strict";var l=n(74),r={props:{linkText:{type:[String,Number],required:!0},linkPath:{type:String,required:!0},isNotLink:{type:Boolean,default:!1},shouldNotShorten:{type:Boolean,default:!1}},computed:{shortText(){return this.shouldNotShorten?this.linkText:Object(l.y)(this.linkText)},isExternal(){return 0===this.linkPath.indexOf("http")||0===this.linkPath.indexOf("//")},elementTag(){return this.isNotLink?"div":this.isExternal?"a":"nuxt-link"},elementData(){var t={class:{"link--default":!this.isNotLink}};return this.isNotLink||(this.isExternal?t.attrs={href:this.linkPath,target:"_blank"}:t.props={to:this.linkPath}),t}},render(t){return t(this.elementTag,this.elementData,[this.shortText])}},o=n(42),component=Object(o.a)(r,undefined,undefined,!1,null,null,null);e.a=component.exports}}]);