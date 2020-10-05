!function(){"use strict";try{self["workbox:core:5.1.3"]&&_()}catch(e){}const e=(e,...t)=>{let s=e;return t.length>0&&(s+=" :: "+JSON.stringify(t)),s};class t extends Error{constructor(t,s){super(e(t,s)),this.name=t,this.details=s}}const s=e=>new URL(String(e),location.href).href.replace(new RegExp("^"+location.origin),"");class n{constructor(e,t,{onupgradeneeded:s,onversionchange:n}={}){this._db=null,this._name=e,this._version=t,this._onupgradeneeded=s,this._onversionchange=n||(()=>this.close())}get db(){return this._db}async open(){if(!this._db)return this._db=await new Promise((e,t)=>{let s=!1;setTimeout(()=>{s=!0,t(new Error("The open request was blocked and timed out"))},this.OPEN_TIMEOUT);const n=indexedDB.open(this._name,this._version);n.onerror=()=>t(n.error),n.onupgradeneeded=e=>{s?(n.transaction.abort(),n.result.close()):"function"==typeof this._onupgradeneeded&&this._onupgradeneeded(e)},n.onsuccess=()=>{const t=n.result;s?t.close():(t.onversionchange=this._onversionchange.bind(this),e(t))}}),this}async getKey(e,t){return(await this.getAllKeys(e,t,1))[0]}async getAll(e,t,s){return await this.getAllMatching(e,{query:t,count:s})}async getAllKeys(e,t,s){return(await this.getAllMatching(e,{query:t,count:s,includeKeys:!0})).map(e=>e.key)}async getAllMatching(e,{index:t,query:s=null,direction:n="next",count:i,includeKeys:a=!1}={}){return await this.transaction([e],"readonly",(r,c)=>{const o=r.objectStore(e),l=t?o.index(t):o,h=[],u=l.openCursor(s,n);u.onsuccess=()=>{const e=u.result;e?(h.push(a?e:e.value),i&&h.length>=i?c(h):e.continue()):c(h)}})}async transaction(e,t,s){return await this.open(),await new Promise((n,i)=>{const a=this._db.transaction(e,t);a.onabort=()=>i(a.error),a.oncomplete=()=>n(),s(a,e=>n(e))})}async _call(e,t,s,...n){return await this.transaction([t],s,(s,i)=>{const a=s.objectStore(t),r=a[e].apply(a,n);r.onsuccess=()=>i(r.result)})}close(){this._db&&(this._db.close(),this._db=null)}}n.prototype.OPEN_TIMEOUT=2e3;const i={readonly:["get","count","getKey","getAll","getAllKeys"],readwrite:["add","put","clear","delete"]};for(const[e,t]of Object.entries(i))for(const s of t)s in IDBObjectStore.prototype&&(n.prototype[s]=async function(t,...n){return await this._call(s,t,e,...n)});try{self["workbox:background-sync:5.1.3"]&&_()}catch(e){}class a{constructor(e){this._queueName=e,this._db=new n("workbox-background-sync",3,{onupgradeneeded:this._upgradeDb})}async pushEntry(e){delete e.id,e.queueName=this._queueName,await this._db.add("requests",e)}async unshiftEntry(e){const[t]=await this._db.getAllMatching("requests",{count:1});t?e.id=t.id-1:delete e.id,e.queueName=this._queueName,await this._db.add("requests",e)}async popEntry(){return this._removeEntry({direction:"prev"})}async shiftEntry(){return this._removeEntry({direction:"next"})}async getAll(){return await this._db.getAllMatching("requests",{index:"queueName",query:IDBKeyRange.only(this._queueName)})}async deleteEntry(e){await this._db.delete("requests",e)}async _removeEntry({direction:e}){const[t]=await this._db.getAllMatching("requests",{direction:e,index:"queueName",query:IDBKeyRange.only(this._queueName),count:1});if(t)return await this.deleteEntry(t.id),t}_upgradeDb(e){const t=e.target.result;e.oldVersion>0&&e.oldVersion<3&&t.objectStoreNames.contains("requests")&&t.deleteObjectStore("requests");t.createObjectStore("requests",{autoIncrement:!0,keyPath:"id"}).createIndex("queueName","queueName",{unique:!1})}}const r=["method","referrer","referrerPolicy","mode","credentials","cache","redirect","integrity","keepalive"];class c{constructor(e){"navigate"===e.mode&&(e.mode="same-origin"),this._requestData=e}static async fromRequest(e){const t={url:e.url,headers:{}};"GET"!==e.method&&(t.body=await e.clone().arrayBuffer());for(const[s,n]of e.headers.entries())t.headers[s]=n;for(const s of r)void 0!==e[s]&&(t[s]=e[s]);return new c(t)}toObject(){const e=Object.assign({},this._requestData);return e.headers=Object.assign({},this._requestData.headers),e.body&&(e.body=e.body.slice(0)),e}toRequest(){return new Request(this._requestData.url,this._requestData)}clone(){return new c(this.toObject())}}const o=new Set,l=e=>{const t={request:new c(e.requestData).toRequest(),timestamp:e.timestamp};return e.metadata&&(t.metadata=e.metadata),t};class h{constructor(e,{onSync:s,maxRetentionTime:n}={}){if(this._syncInProgress=!1,this._requestsAddedDuringSync=!1,o.has(e))throw new t("duplicate-queue-name",{name:e});o.add(e),this._name=e,this._onSync=s||this.replayRequests,this._maxRetentionTime=n||10080,this._queueStore=new a(this._name),this._addSyncListener()}get name(){return this._name}async pushRequest(e){await this._addRequest(e,"push")}async unshiftRequest(e){await this._addRequest(e,"unshift")}async popRequest(){return this._removeRequest("pop")}async shiftRequest(){return this._removeRequest("shift")}async getAll(){const e=await this._queueStore.getAll(),t=Date.now(),s=[];for(const n of e){const e=60*this._maxRetentionTime*1e3;t-n.timestamp>e?await this._queueStore.deleteEntry(n.id):s.push(l(n))}return s}async _addRequest({request:e,metadata:t,timestamp:s=Date.now()},n){const i={requestData:(await c.fromRequest(e.clone())).toObject(),timestamp:s};t&&(i.metadata=t),await this._queueStore[n+"Entry"](i),this._syncInProgress?this._requestsAddedDuringSync=!0:await this.registerSync()}async _removeRequest(e){const t=Date.now(),s=await this._queueStore[e+"Entry"]();if(s){const n=60*this._maxRetentionTime*1e3;return t-s.timestamp>n?this._removeRequest(e):l(s)}}async replayRequests(){let e;for(;e=await this.shiftRequest();)try{await fetch(e.request.clone())}catch(s){throw await this.unshiftRequest(e),new t("queue-replay-failed",{name:this._name})}}async registerSync(){if("sync"in self.registration)try{await self.registration.sync.register("workbox-background-sync:"+this._name)}catch(e){}}_addSyncListener(){"sync"in self.registration?self.addEventListener("sync",e=>{if(e.tag==="workbox-background-sync:"+this._name){const t=async()=>{let t;this._syncInProgress=!0;try{await this._onSync({queue:this})}catch(e){throw t=e,t}finally{!this._requestsAddedDuringSync||t&&!e.lastChance||await this.registerSync(),this._syncInProgress=!1,this._requestsAddedDuringSync=!1}};e.waitUntil(t())}}):this._onSync({queue:this})}static get _queueNames(){return o}}class u{constructor(e,t){this.fetchDidFail=async({request:e})=>{await this._queue.pushRequest({request:e})},this._queue=new h(e,t)}}const d={googleAnalytics:"googleAnalytics",precache:"precache-v2",prefix:"workbox",runtime:"runtime",suffix:"undefined"!=typeof registration?registration.scope:""},f=e=>[d.prefix,e,d.suffix].filter(e=>e&&e.length>0).join("-"),m=e=>e||f(d.googleAnalytics),p=e=>e||f(d.precache),g=e=>e||f(d.runtime);try{self["workbox:routing:5.1.3"]&&_()}catch(e){}const b=e=>e&&"object"==typeof e?e:{handle:e};class w{constructor(e,t,s="GET"){this.handler=b(t),this.match=e,this.method=s}}class y{constructor(){this._routes=new Map}get routes(){return this._routes}addFetchListener(){self.addEventListener("fetch",e=>{const{request:t}=e,s=this.handleRequest({request:t,event:e});s&&e.respondWith(s)})}addCacheListener(){self.addEventListener("message",e=>{if(e.data&&"CACHE_URLS"===e.data.type){const{payload:t}=e.data,s=Promise.all(t.urlsToCache.map(e=>{"string"==typeof e&&(e=[e]);const t=new Request(...e);return this.handleRequest({request:t})}));e.waitUntil(s),e.ports&&e.ports[0]&&s.then(()=>e.ports[0].postMessage(!0))}})}handleRequest({request:e,event:t}){const s=new URL(e.url,location.href);if(!s.protocol.startsWith("http"))return;const{params:n,route:i}=this.findMatchingRoute({url:s,request:e,event:t});let a,r=i&&i.handler;if(!r&&this._defaultHandler&&(r=this._defaultHandler),r){try{a=r.handle({url:s,request:e,event:t,params:n})}catch(e){a=Promise.reject(e)}return a instanceof Promise&&this._catchHandler&&(a=a.catch(n=>this._catchHandler.handle({url:s,request:e,event:t}))),a}}findMatchingRoute({url:e,request:t,event:s}){const n=this._routes.get(t.method)||[];for(const i of n){let n;const a=i.match({url:e,request:t,event:s});if(a)return n=a,(Array.isArray(a)&&0===a.length||a.constructor===Object&&0===Object.keys(a).length||"boolean"==typeof a)&&(n=void 0),{route:i,params:n}}return{}}setDefaultHandler(e){this._defaultHandler=b(e)}setCatchHandler(e){this._catchHandler=b(e)}registerRoute(e){this._routes.has(e.method)||this._routes.set(e.method,[]),this._routes.get(e.method).push(e)}unregisterRoute(e){if(!this._routes.has(e.method))throw new t("unregister-route-but-not-found-with-method",{method:e.method});const s=this._routes.get(e.method).indexOf(e);if(!(s>-1))throw new t("unregister-route-route-not-registered");this._routes.get(e.method).splice(s,1)}}const v=new Set;const q=(e,t)=>e.filter(e=>t in e),x=async({request:e,mode:t,plugins:s=[]})=>{const n=q(s,"cacheKeyWillBeUsed");let i=e;for(const e of n)i=await e.cacheKeyWillBeUsed.call(e,{mode:t,request:i}),"string"==typeof i&&(i=new Request(i));return i},R=async({cacheName:e,request:t,event:s,matchOptions:n,plugins:i=[]})=>{const a=await self.caches.open(e),r=await x({plugins:i,request:t,mode:"read"});let c=await a.match(r,n);for(const t of i)if("cachedResponseWillBeUsed"in t){const i=t.cachedResponseWillBeUsed;c=await i.call(t,{cacheName:e,event:s,matchOptions:n,cachedResponse:c,request:r})}return c},k=async({cacheName:e,request:n,response:i,event:a,plugins:r=[],matchOptions:c})=>{const o=await x({plugins:r,request:n,mode:"write"});if(!i)throw new t("cache-put-with-no-response",{url:s(o.url)});const l=await(async({request:e,response:t,event:s,plugins:n=[]})=>{let i=t,a=!1;for(const t of n)if("cacheWillUpdate"in t){a=!0;const n=t.cacheWillUpdate;if(i=await n.call(t,{request:e,response:i,event:s}),!i)break}return a||(i=i&&200===i.status?i:void 0),i||null})({event:a,plugins:r,response:i,request:o});if(!l)return;const h=await self.caches.open(e),u=q(r,"cacheDidUpdate"),d=u.length>0?await R({cacheName:e,matchOptions:c,request:o}):null;try{await h.put(o,l)}catch(e){throw"QuotaExceededError"===e.name&&await async function(){for(const e of v)await e()}(),e}for(const t of u)await t.cacheDidUpdate.call(t,{cacheName:e,event:a,oldResponse:d,newResponse:l,request:o})},N=R,E=async({request:e,fetchOptions:s,event:n,plugins:i=[]})=>{if("string"==typeof e&&(e=new Request(e)),n instanceof FetchEvent&&n.preloadResponse){const e=await n.preloadResponse;if(e)return e}const a=q(i,"fetchDidFail"),r=a.length>0?e.clone():null;try{for(const t of i)if("requestWillFetch"in t){const s=t.requestWillFetch,i=e.clone();e=await s.call(t,{request:i,event:n})}}catch(e){throw new t("plugin-error-request-will-fetch",{thrownError:e})}const c=e.clone();try{let t;t="navigate"===e.mode?await fetch(e):await fetch(e,s);for(const e of i)"fetchDidSucceed"in e&&(t=await e.fetchDidSucceed.call(e,{event:n,request:c,response:t}));return t}catch(e){for(const t of a)await t.fetchDidFail.call(t,{error:e,event:n,originalRequest:r.clone(),request:c.clone()});throw e}};try{self["workbox:strategies:5.1.3"]&&_()}catch(e){}const T={cacheWillUpdate:async({response:e})=>200===e.status||0===e.status?e:null};class U{constructor(e={}){if(this._cacheName=g(e.cacheName),e.plugins){const t=e.plugins.some(e=>!!e.cacheWillUpdate);this._plugins=t?e.plugins:[T,...e.plugins]}else this._plugins=[T];this._networkTimeoutSeconds=e.networkTimeoutSeconds||0,this._fetchOptions=e.fetchOptions,this._matchOptions=e.matchOptions}async handle({event:e,request:s}){const n=[];"string"==typeof s&&(s=new Request(s));const i=[];let a;if(this._networkTimeoutSeconds){const{id:t,promise:r}=this._getTimeoutPromise({request:s,event:e,logs:n});a=t,i.push(r)}const r=this._getNetworkPromise({timeoutId:a,request:s,event:e,logs:n});i.push(r);let c=await Promise.race(i);if(c||(c=await r),!c)throw new t("no-response",{url:s.url});return c}_getTimeoutPromise({request:e,logs:t,event:s}){let n;return{promise:new Promise(t=>{n=setTimeout(async()=>{t(await this._respondFromCache({request:e,event:s}))},1e3*this._networkTimeoutSeconds)}),id:n}}async _getNetworkPromise({timeoutId:e,request:t,logs:s,event:n}){let i,a;try{a=await E({request:t,event:n,fetchOptions:this._fetchOptions,plugins:this._plugins})}catch(e){i=e}if(e&&clearTimeout(e),i||!a)a=await this._respondFromCache({request:t,event:n});else{const e=a.clone(),s=k({cacheName:this._cacheName,request:t,response:e,event:n,plugins:this._plugins});if(n)try{n.waitUntil(s)}catch(e){}}return a}_respondFromCache({event:e,request:t}){return N({cacheName:this._cacheName,request:t,event:e,matchOptions:this._matchOptions,plugins:this._plugins})}}class S{constructor(e={}){this._plugins=e.plugins||[],this._fetchOptions=e.fetchOptions}async handle({event:e,request:s}){let n,i;"string"==typeof s&&(s=new Request(s));try{i=await E({request:s,event:e,fetchOptions:this._fetchOptions,plugins:this._plugins})}catch(e){n=e}if(!i)throw new t("no-response",{url:s.url,error:n});return i}}try{self["workbox:google-analytics:5.1.3"]&&_()}catch(e){}const O=/^\/(\w+\/)?collect/,L=e=>{const t=({url:e})=>"www.google-analytics.com"===e.hostname&&O.test(e.pathname),s=new S({plugins:[e]});return[new w(t,s,"GET"),new w(t,s,"POST")]},D=e=>{const t=new U({cacheName:e});return new w(({url:e})=>"www.google-analytics.com"===e.hostname&&"/analytics.js"===e.pathname,t,"GET")},C=e=>{const t=new U({cacheName:e});return new w(({url:e})=>"www.googletagmanager.com"===e.hostname&&"/gtag/js"===e.pathname,t,"GET")},K=e=>{const t=new U({cacheName:e});return new w(({url:e})=>"www.googletagmanager.com"===e.hostname&&"/gtm.js"===e.pathname,t,"GET")};try{self["workbox:precaching:5.1.3"]&&_()}catch(e){}const A=[],P={get:()=>A,add(e){A.push(...e)}};let M;async function j(e,t){const s=e.clone(),n={headers:new Headers(s.headers),status:s.status,statusText:s.statusText},i=t?t(n):n,a=function(){if(void 0===M){const e=new Response("");if("body"in e)try{new Response(e.body),M=!0}catch(e){M=!1}M=!1}return M}()?s.body:await s.blob();return new Response(a,i)}function W(e){if(!e)throw new t("add-to-cache-list-unexpected-type",{entry:e});if("string"==typeof e){const t=new URL(e,location.href);return{cacheKey:t.href,url:t.href}}const{revision:s,url:n}=e;if(!n)throw new t("add-to-cache-list-unexpected-type",{entry:e});if(!s){const e=new URL(n,location.href);return{cacheKey:e.href,url:e.href}}const i=new URL(n,location.href),a=new URL(n,location.href);return i.searchParams.set("__WB_REVISION__",s),{cacheKey:i.href,url:a.href}}class I{constructor(e){this._cacheName=p(e),this._urlsToCacheKeys=new Map,this._urlsToCacheModes=new Map,this._cacheKeysToIntegrities=new Map}addToCacheList(e){const s=[];for(const n of e){"string"==typeof n?s.push(n):n&&void 0===n.revision&&s.push(n.url);const{cacheKey:e,url:i}=W(n),a="string"!=typeof n&&n.revision?"reload":"default";if(this._urlsToCacheKeys.has(i)&&this._urlsToCacheKeys.get(i)!==e)throw new t("add-to-cache-list-conflicting-entries",{firstEntry:this._urlsToCacheKeys.get(i),secondEntry:e});if("string"!=typeof n&&n.integrity){if(this._cacheKeysToIntegrities.has(e)&&this._cacheKeysToIntegrities.get(e)!==n.integrity)throw new t("add-to-cache-list-conflicting-integrities",{url:i});this._cacheKeysToIntegrities.set(e,n.integrity)}if(this._urlsToCacheKeys.set(i,e),this._urlsToCacheModes.set(i,a),s.length>0){const e=`Workbox is precaching URLs without revision info: ${s.join(", ")}\nThis is generally NOT safe. Learn more at https://bit.ly/wb-precache`;console.warn(e)}}}async install({event:e,plugins:t}={}){const s=[],n=[],i=await self.caches.open(this._cacheName),a=await i.keys(),r=new Set(a.map(e=>e.url));for(const[e,t]of this._urlsToCacheKeys)r.has(t)?n.push(e):s.push({cacheKey:t,url:e});const c=s.map(({cacheKey:s,url:n})=>{const i=this._cacheKeysToIntegrities.get(s),a=this._urlsToCacheModes.get(n);return this._addURLToCache({cacheKey:s,cacheMode:a,event:e,integrity:i,plugins:t,url:n})});await Promise.all(c);return{updatedURLs:s.map(e=>e.url),notUpdatedURLs:n}}async activate(){const e=await self.caches.open(this._cacheName),t=await e.keys(),s=new Set(this._urlsToCacheKeys.values()),n=[];for(const i of t)s.has(i.url)||(await e.delete(i),n.push(i.url));return{deletedURLs:n}}async _addURLToCache({cacheKey:e,url:s,cacheMode:n,event:i,plugins:a,integrity:r}){const c=new Request(s,{integrity:r,cache:n,credentials:"same-origin"});let o,l=await E({event:i,plugins:a,request:c});for(const e of a||[])"cacheWillUpdate"in e&&(o=e);if(!(o?await o.cacheWillUpdate({event:i,request:c,response:l}):l.status<400))throw new t("bad-precaching-response",{url:s,status:l.status});l.redirected&&(l=await j(l)),await k({event:i,plugins:a,response:l,request:e===s?c:new Request(e),cacheName:this._cacheName,matchOptions:{ignoreSearch:!0}})}getURLsToCacheKeys(){return this._urlsToCacheKeys}getCachedURLs(){return[...this._urlsToCacheKeys.keys()]}getCacheKeyForURL(e){const t=new URL(e,location.href);return this._urlsToCacheKeys.get(t.href)}async matchPrecache(e){const t=e instanceof Request?e.url:e,s=this.getCacheKeyForURL(t);if(s){return(await self.caches.open(this._cacheName)).match(s)}}createHandler(e=!0){return async({request:s})=>{try{const e=await this.matchPrecache(s);if(e)return e;throw new t("missing-precache-entry",{cacheName:this._cacheName,url:s instanceof Request?s.url:s})}catch(t){if(e)return fetch(s);throw t}}}createHandlerBoundToURL(e,s=!0){if(!this.getCacheKeyForURL(e))throw new t("non-precached-url",{url:e});const n=this.createHandler(s),i=new Request(e);return()=>n({request:i})}}let F;const H=()=>(F||(F=new I),F);const B=(e,t)=>{const s=H().getURLsToCacheKeys();for(const n of function*(e,{ignoreURLParametersMatching:t,directoryIndex:s,cleanURLs:n,urlManipulation:i}={}){const a=new URL(e,location.href);a.hash="",yield a.href;const r=function(e,t=[]){for(const s of[...e.searchParams.keys()])t.some(e=>e.test(s))&&e.searchParams.delete(s);return e}(a,t);if(yield r.href,s&&r.pathname.endsWith("/")){const e=new URL(r.href);e.pathname+=s,yield e.href}if(n){const e=new URL(r.href);e.pathname+=".html",yield e.href}if(i){const e=i({url:a});for(const t of e)yield t.href}}(e,t)){const e=s.get(n);if(e)return e}};let z=!1;function G(e){z||((({ignoreURLParametersMatching:e=[/^utm_/],directoryIndex:t="index.html",cleanURLs:s=!0,urlManipulation:n}={})=>{const i=p();self.addEventListener("fetch",a=>{const r=B(a.request.url,{cleanURLs:s,directoryIndex:t,ignoreURLParametersMatching:e,urlManipulation:n});if(!r)return;let c=self.caches.open(i).then(e=>e.match(r)).then(e=>e||fetch(r));a.respondWith(c)})})(e),z=!0)}const Q=e=>{const t=H(),s=P.get();e.waitUntil(t.install({event:e,plugins:s}).catch(e=>{throw e}))},V=e=>{const t=H();e.waitUntil(t.activate())};class J extends w{constructor(e,t,s){super(({url:t})=>{const s=e.exec(t.href);if(s&&(t.origin===location.origin||0===s.index))return s.slice(1)},t,s)}}let $;const X=()=>($||($=new y,$.addFetchListener(),$.addCacheListener()),$);function Y(e,s,n){let i;if("string"==typeof e){const t=new URL(e,location.href);i=new w(({url:e})=>e.href===t.href,s,n)}else if(e instanceof RegExp)i=new J(e,s,n);else if("function"==typeof e)i=new w(e,s,n);else{if(!(e instanceof w))throw new t("unsupported-route-type",{moduleName:"workbox-routing",funcName:"registerRoute",paramName:"capture"});i=e}return X().registerRoute(i),i}function Z(e){e.then(()=>{})}try{self["workbox:expiration:5.1.3"]&&_()}catch(e){}const ee=e=>{const t=new URL(e,location.href);return t.hash="",t.href};class te{constructor(e){this._cacheName=e,this._db=new n("workbox-expiration",1,{onupgradeneeded:e=>this._handleUpgrade(e)})}_handleUpgrade(e){const t=e.target.result.createObjectStore("cache-entries",{keyPath:"id"});t.createIndex("cacheName","cacheName",{unique:!1}),t.createIndex("timestamp","timestamp",{unique:!1}),(async e=>{await new Promise((t,s)=>{const n=indexedDB.deleteDatabase(e);n.onerror=()=>{s(n.error)},n.onblocked=()=>{s(new Error("Delete blocked"))},n.onsuccess=()=>{t()}})})(this._cacheName)}async setTimestamp(e,t){const s={url:e=ee(e),timestamp:t,cacheName:this._cacheName,id:this._getId(e)};await this._db.put("cache-entries",s)}async getTimestamp(e){return(await this._db.get("cache-entries",this._getId(e))).timestamp}async expireEntries(e,t){const s=await this._db.transaction("cache-entries","readwrite",(s,n)=>{const i=s.objectStore("cache-entries").index("timestamp").openCursor(null,"prev"),a=[];let r=0;i.onsuccess=()=>{const s=i.result;if(s){const n=s.value;n.cacheName===this._cacheName&&(e&&n.timestamp<e||t&&r>=t?a.push(s.value):r++),s.continue()}else n(a)}}),n=[];for(const e of s)await this._db.delete("cache-entries",e.id),n.push(e.url);return n}_getId(e){return this._cacheName+"|"+ee(e)}}class se{constructor(e,t={}){this._isRunning=!1,this._rerunRequested=!1,this._maxEntries=t.maxEntries,this._maxAgeSeconds=t.maxAgeSeconds,this._cacheName=e,this._timestampModel=new te(e)}async expireEntries(){if(this._isRunning)return void(this._rerunRequested=!0);this._isRunning=!0;const e=this._maxAgeSeconds?Date.now()-1e3*this._maxAgeSeconds:0,t=await this._timestampModel.expireEntries(e,this._maxEntries),s=await self.caches.open(this._cacheName);for(const e of t)await s.delete(e);this._isRunning=!1,this._rerunRequested&&(this._rerunRequested=!1,Z(this.expireEntries()))}async updateTimestamp(e){await this._timestampModel.setTimestamp(e,Date.now())}async isURLExpired(e){if(this._maxAgeSeconds){return await this._timestampModel.getTimestamp(e)<Date.now()-1e3*this._maxAgeSeconds}return!1}async delete(){this._rerunRequested=!1,await this._timestampModel.expireEntries(1/0)}}class ne{constructor(e={}){var t;this.cachedResponseWillBeUsed=async({event:e,request:t,cacheName:s,cachedResponse:n})=>{if(!n)return null;const i=this._isResponseDateFresh(n),a=this._getCacheExpiration(s);Z(a.expireEntries());const r=a.updateTimestamp(t.url);if(e)try{e.waitUntil(r)}catch(e){}return i?n:null},this.cacheDidUpdate=async({cacheName:e,request:t})=>{const s=this._getCacheExpiration(e);await s.updateTimestamp(t.url),await s.expireEntries()},this._config=e,this._maxAgeSeconds=e.maxAgeSeconds,this._cacheExpirations=new Map,e.purgeOnQuotaError&&(t=()=>this.deleteCacheAndMetadata(),v.add(t))}_getCacheExpiration(e){if(e===g())throw new t("expire-custom-caches-only");let s=this._cacheExpirations.get(e);return s||(s=new se(e,this._config),this._cacheExpirations.set(e,s)),s}_isResponseDateFresh(e){if(!this._maxAgeSeconds)return!0;const t=this._getDateHeaderTimestamp(e);if(null===t)return!0;return t>=Date.now()-1e3*this._maxAgeSeconds}_getDateHeaderTimestamp(e){if(!e.headers.has("date"))return null;const t=e.headers.get("date"),s=new Date(t).getTime();return isNaN(s)?null:s}async deleteCacheAndMetadata(){for(const[e,t]of this._cacheExpirations)await self.caches.delete(e),await t.delete();this._cacheExpirations=new Map}}var ie;((e={})=>{const t=m(e.cacheName),s=new u("workbox-google-analytics",{maxRetentionTime:2880,onSync:(n=e,async({queue:e})=>{let t;for(;t=await e.shiftRequest();){const{request:s,timestamp:i}=t,a=new URL(s.url);try{const e="POST"===s.method?new URLSearchParams(await s.clone().text()):a.searchParams,t=i-(Number(e.get("qt"))||0),r=Date.now()-t;if(e.set("qt",String(r)),n.parameterOverrides)for(const t of Object.keys(n.parameterOverrides)){const s=n.parameterOverrides[t];e.set(t,s)}"function"==typeof n.hitFilter&&n.hitFilter.call(null,e),await fetch(new Request(a.origin+a.pathname,{body:e.toString(),method:"POST",mode:"cors",credentials:"omit",headers:{"Content-Type":"text/plain"}}))}catch(s){throw await e.unshiftRequest(t),s}}})});var n;const i=[K(t),D(t),C(t),...L(s)],a=new y;for(const e of i)a.registerRoute(e);a.addFetchListener()})(),self.addEventListener("install",()=>self.skipWaiting()),self.addEventListener("activate",()=>self.clients.claim()),ie={urlManipulation:({url:e})=>[e],ignoreURLParametersMatching:[/.*/]},function(e){H().addToCacheList(e),e.length>0&&(self.addEventListener("install",Q),self.addEventListener("activate",V))}([{revision:"71b57eb2e7cbd2b643288e88eb065ba7",url:"404.html"},{revision:"485a89212d2f71829962cba61a98e38f",url:"blog/get-ready-for-2020/index.html"},{revision:"ba96eb78c28e77d0c20d219e656dbf58",url:"blog/index.html"},{revision:"812364ab6f8e4cabde52b2b71c7fd511",url:"code-of-conduct/index.html"},{revision:"8fcac1241ad81fd3200f0ae245f01640",url:"faq/index.html"},{revision:"6f9c8f7666a9ae458886b3355c97fee0",url:"index.html"},{revision:"ce53a4f23c24aee10e0da8996d5b7f08",url:"partners/communities/gdg_bergen/index.html"},{revision:"03b2256c045dc1527f9bdbbda5ab10b0",url:"partners/communities/gdg_cloud_oslo/index.html"},{revision:"76748555d933440f48e64050ab7bc165",url:"partners/communities/gdg_oslo/index.html"},{revision:"08007f3c10050acdca24bb8a7dc3a4ea",url:"partners/communities/gdg_sorlandet/index.html"},{revision:"035f6b3d65b849ac4e34c823fd0e341a",url:"partners/communities/gdg_stavanger/index.html"},{revision:"ae1001a498e6b333b806e8daee65f70d",url:"partners/communities/gdg_trondheim/index.html"},{revision:"00f61fa9afa8eedca7aca8958b782daf",url:"partners/index.html"},{revision:"bd13658fca134132373c1598f449291a",url:"partners/organizers/gdg_bergen/index.html"},{revision:"4698bffb50eb57a85e1e3a961e53db23",url:"partners/organizers/gdg_cloud_oslo/index.html"},{revision:"a49d2f0e1a2d02f72c76ae71b2b38ba3",url:"partners/organizers/gdg_oslo/index.html"},{revision:"7d56cba10f2ef008a03e334cff8e772d",url:"partners/organizers/gdg_sorlandet/index.html"},{revision:"3a48c44424d6de644e01ae8246c1fbdc",url:"partners/organizers/gdg_stavanger/index.html"},{revision:"e96399e3b409dcfb270dddb4a5a57bf1",url:"partners/organizers/gdg_trondheim/index.html"},{revision:"08b3b0a0ac5248406fac226ec5f3bb80",url:"partners/sponsors/google/index.html"},{revision:"270f4e27c2868057a129679e6a9725d8",url:"schedule/index.html"},{revision:"fd80ca54bf9990c0b42bab05dec89f0e",url:"sessions/__break/index.html"},{revision:"556f7e386ca9e79f03563fdf0c2ec589",url:"sessions/__close/index.html"},{revision:"f4aeaf82bcc691e12343f16c021a9060",url:"sessions/__hero/index.html"},{revision:"7b70ff9ab1b39bc5a15c15e5e386f462",url:"sessions/__open/index.html"},{revision:"9a2c5a3aed42b135e24add9dabb4d7ca",url:"sessions/__quiz/index.html"},{revision:"c0b3d7d60959892e6167b44863140abe",url:"sessions/angular_material_design/index.html"},{revision:"ad5a016f86878f94e520a2798dce04e0",url:"sessions/beyond_es6/index.html"},{revision:"74d8cb078a21ec1a5418302a6338d20d",url:"sessions/directives_in_angular/index.html"},{revision:"8c766afccb541cbb5b730a0ab7797509",url:"sessions/fair_ml_models/index.html"},{revision:"3b28060221d81096153e531943658a66",url:"sessions/famous_app_uis_in_flutter/index.html"},{revision:"9bb323b495c989bae0dff29de2c109c2",url:"sessions/flutter_ecosystem/index.html"},{revision:"3ff886d9081f469d36b78371ba7e95fe",url:"sessions/index.html"},{revision:"d9c60079a6d8cb0a181d06f024649190",url:"sessions/istio/index.html"},{revision:"6a212fb1ee05dff46e2c3f53f34b7519",url:"sessions/make_flutter_secure/index.html"},{revision:"e0ba22b89be226698b6e5c3c07399334",url:"sessions/memory_leaking/index.html"},{revision:"1aada01fc48f5d395b16744ddebc3c91",url:"sessions/ml_using_tensorflow_lite/index.html"},{revision:"3a6a29cd01c011566e5679f8013ddffd",url:"sessions/mobile_devops/index.html"},{revision:"5246ce3059e91b423eaff8f552b344ac",url:"sessions/multiplatform_triatholin_in_kotlin/index.html"},{revision:"dc4fb441d8b3dde6f807e2613a39d5e0",url:"sessions/no_way_jose/index.html"},{revision:"6fd28c8c7f79884b09c967bc1c1d73ab",url:"sessions/robots/index.html"},{revision:"dd8aece65783cb4b1fbebc9627eb0261",url:"sessions/serverless_on_cloudrun/index.html"},{revision:"cac9babbaccc5ace9b6af05d9b1fe31b",url:"sessions/vue3/index.html"},{revision:"3be8d1edb065bbfeafb5fba2eb2ac2a6",url:"sessions/want_more_from_your_frontend/index.html"},{revision:"1ebb12e50333bbbd8e3c323b6a3df8f0",url:"speakers/ashita_prasad/index.html"},{revision:"66b6842b05a19b4bcede76bed6d246f5",url:"speakers/carlos_mota/index.html"},{revision:"475c76e264f2fc1ef5abf6c4c756b064",url:"speakers/dharmesh_vaya/index.html"},{revision:"7d564c4ad19f6e6f2041257494c8ad46",url:"speakers/emma_twersky/index.html"},{revision:"f243bbded79b8b7ba24779a7fa7a6b0f",url:"speakers/gaute_meek_olsen/index.html"},{revision:"b1939f79150a05845ff85e8df13a352f",url:"speakers/gil_fink/index.html"},{revision:"f8affdf6a039a19e7d20ba15da4d3e80",url:"speakers/hakon_silfvernagel/index.html"},{revision:"3db774e53fb5f013f1a212e218377b8a",url:"speakers/index.html"},{revision:"4ffc760a38cd512e29b3495757a83871",url:"speakers/jakub_holy/index.html"},{revision:"4b50c3651a0a342d1142f98d6e23dd90",url:"speakers/kevin_davin/index.html"},{revision:"bb83e6a6bc407e48f3359cf9d4e2c10e",url:"speakers/nicola_corti/index.html"},{revision:"559aaf69fab8b4ad56f55bb90ec63001",url:"speakers/nivetha_maran/index.html"},{revision:"c13109a67d08f86ec55e19b3f0619fc7",url:"speakers/sakina_abbas/index.html"},{revision:"98182df086b171ec4f0c404abf8621f9",url:"speakers/sam_bellen/index.html"},{revision:"2c83c1ef85fcca33a0bc2660470385b1",url:"speakers/selina_ornek/index.html"},{revision:"f34e05a44334a89ce49f6a3589fe205f",url:"speakers/sharmistha_chatterjee/index.html"},{revision:"84de10916267a8365a92e015fdd1829b",url:"speakers/waleed_arshad/index.html"},{revision:"26ea9f51a416aa6024b79c4bfdb367be",url:"tags/_ai/index.html"},{revision:"f5ba6efaa9b547bca84863dd536e4ac1",url:"tags/_backend/index.html"},{revision:"a1b976ce07feaf4e5972965330091f45",url:"tags/_mobile/index.html"},{revision:"1e44e9614c062738e406d07d0320cbe0",url:"tags/_web/index.html"},{revision:"f0b9f81fa9f0466f2fdb77e3ac22b9b2",url:"tags/break/index.html"},{revision:"80d3bf029a1ad4ffd02b13f59820d89e",url:"tags/close/index.html"},{revision:"040b82c25ebb9b9bae913f9c8dae195c",url:"tags/hero/index.html"},{revision:"a36c71fe42c8178e323551eb13bb22b6",url:"tags/index.html"},{revision:"b254fb057a9b9ce94aded97437421acb",url:"tags/open/index.html"},{revision:"406c896271a37761dc0675b66ded6590",url:"tags/quiz/index.html"},{revision:"5890d2212e64c9602dfc9561565645a8",url:"team/index.html"},{revision:"3fb59ed24867a8dcb39ae6b7776de9ad",url:"styles/blog-page.css"},{revision:"b12c09a3800e95d1c41cab553c23bedb",url:"styles/blog-section.css"},{revision:"3ffbaa4ad3f43cc5c0a8b0e4f2e9129c",url:"styles/home.css"},{revision:"3ffbaa4ad3f43cc5c0a8b0e4f2e9129c",url:"styles/page-home.css"},{revision:"5c45f5cd8fd863e55a4d85da325fa920",url:"styles/page-page.css"},{revision:"5c45f5cd8fd863e55a4d85da325fa920",url:"styles/page.css"},{revision:"e3b5b458f160f82745495f82b12565db",url:"styles/partners-page.css"},{revision:"d2111b68db2eb76c7dcfc9f2078e6c60",url:"styles/partners-section.css"},{revision:"8bd826f6eb14b82c0772941c7aab8302",url:"styles/schedule-section.css"},{revision:"0c53ce922a1df4690b7ca8419c912a11",url:"styles/sessions-page.css"},{revision:"924faa5cf127788f1b3754efc6d39b7e",url:"styles/sessions-section.css"},{revision:"4096a013ff01135a96d5c4d740188815",url:"styles/speakers-page.css"},{revision:"8b110a41ff5c9838ae1b2edca6aa59bb",url:"styles/speakers-section.css"},{revision:"d41a0cc2f9b8521db470598106c77504",url:"styles/team-section.css"},{revision:"cdf476293c49c6f090f3efc863567edc",url:"images/logos/logo.png"},{revision:"09cc2e80070c40a17d93404fa8d15786",url:"manifest/icon-72.png"},{revision:"1fe42cd1c7f954d0dc587fe7e3a6d6c4",url:"manifest/icon-large.png"},{revision:"327414c23ea5d7737b9b0e2b12b0ae5b",url:"favicon.ico"},{revision:"65ded980651e608a6bb4ea76ab5f1b74",url:"icons.svg"},{revision:"e987cfbb3395532e02a036462e5105c7",url:"main.js"},{revision:"925b1cfb3ff415d8a781c0a026a8f096",url:"modernizr-webp.js"},{revision:"4096931795e0179a8fc0fd413b63ec53",url:"service-worker.js"},{revision:"d9d8983feecdafc2ffead31d18dc0934",url:"sw-noop.js"},{revision:"e987cfbb3395532e02a036462e5105c7",url:"theme.js"},{revision:"a11e27ed15bcc43e5ebf6220bf0ebf33",url:"social-share.png"}]),G(ie),Y(({request:e})=>"image"===e.destination,new class{constructor(e={}){this._cacheName=g(e.cacheName),this._plugins=e.plugins||[],this._fetchOptions=e.fetchOptions,this._matchOptions=e.matchOptions}async handle({event:e,request:s}){"string"==typeof s&&(s=new Request(s));let n,i=await N({cacheName:this._cacheName,request:s,event:e,matchOptions:this._matchOptions,plugins:this._plugins});if(!i)try{i=await this._getFromNetwork(s,e)}catch(e){n=e}if(!i)throw new t("no-response",{url:s.url,error:n});return i}async _getFromNetwork(e,t){const s=await E({request:e,event:t,fetchOptions:this._fetchOptions,plugins:this._plugins}),n=s.clone(),i=k({cacheName:this._cacheName,request:e,response:n,event:t,plugins:this._plugins});if(t)try{t.waitUntil(i)}catch(e){}return s}}({cacheName:"images",plugins:[new ne({maxEntries:100,maxAgeSeconds:2592e3,purgeOnQuotaError:!0})]})),Y(new RegExp("https://fonts.(?:googleapis|gstatic).com/(.*)"),new class{constructor(e={}){if(this._cacheName=g(e.cacheName),this._plugins=e.plugins||[],e.plugins){const t=e.plugins.some(e=>!!e.cacheWillUpdate);this._plugins=t?e.plugins:[T,...e.plugins]}else this._plugins=[T];this._fetchOptions=e.fetchOptions,this._matchOptions=e.matchOptions}async handle({event:e,request:s}){"string"==typeof s&&(s=new Request(s));const n=this._getFromNetwork({request:s,event:e});let i,a=await N({cacheName:this._cacheName,request:s,event:e,matchOptions:this._matchOptions,plugins:this._plugins});if(a){if(e)try{e.waitUntil(n)}catch(i){}}else try{a=await n}catch(e){i=e}if(!a)throw new t("no-response",{url:s.url,error:i});return a}async _getFromNetwork({request:e,event:t}){const s=await E({request:e,event:t,fetchOptions:this._fetchOptions,plugins:this._plugins}),n=k({cacheName:this._cacheName,request:e,response:s.clone(),event:t,plugins:this._plugins});if(t)try{t.waitUntil(n)}catch(e){}return s}}({cacheName:"googleapis",plugins:[new ne({maxEntries:30})]})),self.addEventListener("push",(function(e){console.log("[Service Worker]: Received push event",e);var t={};t=e.data.json()?e.data.json().notification:{title:"Something Has Happened",message:"Something you might want to check out",icon:"/assets/images/logo.png"},self.registration.showNotification(t.title,t)})),self.addEventListener("notificationclick",(function(e){console.log("[Service Worker]: Received notificationclick event"),e.notification.close(),"opentweet"==e.action?(console.log("[Service Worker]: Performing action opentweet"),e.waitUntil(clients.openWindow(e.notification.data).then((function(e){})))):(console.log("[Service Worker]: Performing default click action"),e.waitUntil(clients.matchAll({includeUncontrolled:!0,type:"window"}).then((function(e){for(var t=0;t<e.length;t++){var s=e[t];if("/"==s.url&&"focus"in s)return s.focus()}if(clients.openWindow)return clients.openWindow("/")}))))})),self.addEventListener("notificationclose",(function(e){log("[Service Worker]: Received notificationclose event")}))}();
