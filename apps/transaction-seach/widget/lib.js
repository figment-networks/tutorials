 class SearchRequest {
    constructor(network, limit) {
        this.network = network;
        if (limit === undefined) {
            this.limit = 100;
        } else {
            this.limit = limit;
        }
    }

    stringify() {
        return JSON.stringify(this)
    }

    /**
     *
     * @param {Array.<string>} accounts
     */
    addAccounts(accounts) {
        this.account = accounts;
    }


    /**
     *
     * @param {Array.<Date>} time
     */
    timeAfter(date) {
        this.after_time = date.toISOString();
    }

    /**
     *
     * @param {Array.<Date>} time
     */
    timeBefore(date) {
        this.before_time = date.toISOString();
    }

    /**
     *
     * @param {Array.<string>} accounts
     */
    addSenders(accounts) {
        this.sender = accounts;
    }

    /**
     *
     * @param {Array.<string>} accounts
     */
    addReceivers(accounts) {
        this.receiver = accounts;
    }

    /**
     *
     * @param {Array.<string>} type
     */
    addType(types) {
        this.type = types;
    }

    page(number) {
        if (number > 0 ) {
            this.offset = this.limit*number;
        }
    }
}

class Widget {
    /**
     *
     * @param {string} targetID id of target div
     * @param {SearchRequest} initialConfig initial config for onload event
     */
  constructor(targetID, initialConfig) {
    this.targetID = targetID;
    this.transactions = new Array();
    this.transactionsMap = new Map();
    this.templates = new Map();
    this.initialConfig = initialConfig;

    this.lastPage = 0;
    this.pickedTypes = new Array();
  }

  setRequest(url) {
    this.ApiURL = url;
  }

  async fetchData(data) {
    const response = await fetch(this.ApiURL +"/transactions_search", {
        method: 'POST',
        headers: {"Content-Type": "application/json"},
        body: data.stringify(data)
    });

    if (!response.ok) {
      const message = `An error has occurred: ${response.status}`;
      throw new Error(message);
    }

    const list = await response.json();
    return list
  }

  /**
   *
   * @param {SearchRequest} sr
   */
  async makeRequest(sr) {
    const response = await this.fetchData(sr)
    if (response === null || response === undefined  ) {
        return
    }
    for (let i = 0; i < response.length; i++) {
        const tx = response[i];
        if ( !this.transactionsMap.has(tx.id)) {
            tx.dirty = true;
            this.transactionsMap.set(tx.id, tx);
            this.transactions.push(tx);
        }
    }
    this.transactions.sort(compareTransactions);
    this.render();
  }

  initialRequest() {
    this.makeRequest(this.initialConfig)
  }

  loadMoreRequests() {
    const sr = this.initialConfig;
    sr.page(this.lastPage+1);
    sr.addType(this.pickedTypes);
    this.makeRequest(sr);
    this.lastPage++;
  }

  linkTemplates() {
    if (this.templates.size !== 0) {
        return
    }
    this.templates.set("transactionTemplate", document.querySelector("#transactionRow"));
    this.templates.set("eventsRowTemplate", document.querySelector("#eventRow"));
    this.templates.set("subRowTemplate", document.querySelector("#subRow"));
    this.templates.set("accountRowTemplate", document.querySelector("#accountRow"));

    this.templates.set("bankElemTemplate", document.querySelector("#bankElem"));
    this.templates.set("distributionElemTemplate", document.querySelector("#distributionElem"));
    this.templates.set("stakingElemTemplate", document.querySelector("#stakingElem"));
  }

  render() {
    this.linkTemplates();

    let transactionsList = document.querySelector("#"+ this.targetID);
    for (let i = 0; i <  this.transactions.length; i++) {
        if (this.transactions[i].dirty === undefined) {
            continue;
        }

        const elem = createTransactionElem(this.transactions[i], this.templates)
        transactionsList.appendChild(elem);
        this.transactions[i].dirty = undefined;
    }
  }

  liveDates() {
    return setInterval(this.reformatDates, 10000)
  }

  changeType() {
    this.pickedTypes = new Array();
    this.lastPage = 0;

    const checked = document.querySelectorAll('input[name=type]:checked');
    for (let i = 0; i < checked.length; i++) {
        this.pickedTypes.push(checked[i].value);
    }


    // clear current list
    let transactionsList = document.querySelector("#"+ this.targetID);
    transactionsList.innerHTML = '';

    this.transactions = new Array();
    this.transactionsMap = new Map();

    sr.page(0);
    sr.addType(this.pickedTypes);
    this.makeRequest(sr);
  }

  attachEvents() {
    const more = document.querySelector("#transactions-more");
    more.addEventListener("click", ()=> this.loadMoreRequests());

    const types = document.querySelectorAll("input[name=type]");
    for (let i = 0; i < types.length; i++) {
        types[i].addEventListener("change", (ev)=> this.changeType());
    }
  }

  reformatDates() {
    const nodes = document.querySelectorAll(".humanTime");
    let node, hour;
    const now = Date.now()
    for (let i = 0; i < nodes.length; i++) {
        node = nodes[i];
        hour = humanizeDuration(node.getAttribute("title"), now);
        if (hour !== node.innerText) {
            node.innerText = hour
        }
    }
  }
}

function compareTransactions(a,b) {
    return  b.height-a.height   // in reverse order
}

function createTransactionElem(tx, templates) {
    const clone = templates.get("transactionTemplate").content.cloneNode(true);
    const height = clone.querySelector(".height");
    height.innerText = "H: " + shotForm(tx.height, 20);
    const hashA = clone.querySelector(".hash a");
    hashA.innerText = "#: " + shotForm(tx.hash, 20);
    hashA.title = "Hash: " + tx.hash;
    hashA.href = "https://hubble.figment.io/cosmos/chains/"+ tx.chain_id + "/blocks/"+ tx.height + "/transactions/" + tx.hash;

    const time = clone.querySelector(".humanTime");
    time.title =  tx.time;
    time.innerText = humanizeDuration(tx.time, Date.now());
    const a = clone.querySelector(".block a");
    a.href = "https://hubble.figment.io/cosmos/chains/"+ tx.chain_id + "/blocks/"+ tx.height
    a.title = "Block Hash: " + tx.block_hash;
    a.innerText = shotForm(tx.block_hash, 20);

    if (tx.memo  !== undefined) {
        const memo = clone.querySelector(".memo");
        memo.classList.add("filled");
        memo.innerText = "Memo: " +  tx.memo;
    }

    const events = clone.querySelector(".events");
    for (let i = 0; i < tx.events.length; i++) {
        events.appendChild(createEventsElem(tx.events[i],templates));
    }
    return clone
}

function createEventsElem(ev, templates) {
    const clone = templates.get("eventsRowTemplate").content.cloneNode(true);
    const sub = clone.querySelector(".sub");
    for (let i = 0; i < ev.sub.length; i++) {
        sub.appendChild(createSubElem(ev.sub[i] ,templates));
    }
    return clone
}

function createSubElem(sub, templates) {
    const clone = templates.get("subRowTemplate").content.cloneNode(true);
    const kind = clone.querySelector(".type");
    kind.innerText =  sub.module + " / " + sub.type.join(" , ");

    const elm = clone.querySelector(".module-element");
    switch (sub.module) {
        case "bank":
            elm.classList.add("bank");
            elm.appendChild(createBankElem(sub, templates));
        break;
        case "distribution":
            elm.classList.add("distribution");
            elm.appendChild(createDistributionElem(sub, templates));
            break;
        case "staking":
            elm.classList.add("staking");
            elm.appendChild(createStakingElem(sub, templates));
            break;
    }
    return clone
}

function createBankElem(sub, templates) {
    const clone = templates.get("bankElemTemplate").content.cloneNode(true);
    const accountTemplate = templates.get("accountRowTemplate").content;
    if ( sub.sender != undefined ) {
        const snd = clone.querySelector(".senders");
        const head = snd.querySelector("h4");
        head.innerText = "Senders";

        let s;
        for (let i = 0; i < sub.sender.length; i++) {
            s = sub.sender[i];
            let ac = accountTemplate.cloneNode(true);
            idN = ac.querySelector(".id");
            idN.title =  s.account.id;
            idN.innerText = shotForm(s.account.id, 20);

            if (s.amounts !== undefined) {
                amountN = ac.querySelector(".amount");
                amountN.innerText = amountsToText(s.amounts);
            }
            snd.appendChild(ac);
        }
    }

    if ( sub.recipient != undefined ) {
        const rec = clone.querySelector(".recipients");
        const head = rec.querySelector("h4");
        head.innerText = "Recipients";

        let r;
        for (let i = 0; i < sub.recipient.length; i++) {
            r = sub.recipient[i];
            let ac = accountTemplate.cloneNode(true);
            idN = ac.querySelector(".id");
            idN.title =  r.account.id;
            idN.innerText = shotForm(r.account.id, 20);

            if (r.amounts !== undefined) {
                amountN = ac.querySelector(".amount");
                amountN.innerText = amountsToText(r.amounts);
            }
            rec.appendChild(ac);
        }
    }
    return clone
}

function createDistributionElem(sub, templates) {
    const clone = templates.get("distributionElemTemplate").content.cloneNode(true);
    const accountTemplate = templates.get("accountRowTemplate").content;
    if ( sub.recipient != undefined ) {
        const rec = clone.querySelector(".recipients");
        const head = rec.querySelector("h4");
        head.innerText = "Recipients";

        let r;
        for (let i = 0; i < sub.recipient.length; i++) {
            r = sub.recipient[i];
            let ac = accountTemplate.cloneNode(true);
            idN = ac.querySelector(".id");
            idN.title =  r.account.id;
            idN.innerText = shotForm(r.account.id, 20);

            if (r.amounts !== undefined) {
                amountN = ac.querySelector(".amount");
                amountN.innerText = amountsToText(r.amounts);
            }
            rec.appendChild(ac);
        }
    }

    if ( sub.node != undefined ) {
        let elems, snd, head;
        for (const key in sub.node) {
            if (sub.node.hasOwnProperty(key)) {
                elems = sub.node[key];
                snd = clone.querySelector("."+ key);
                head = snd.querySelector("h4");
                head.innerText = key;

                for (let k = 0; k < elems.length; k++) {
                    newDiv = document.createElement("div");
                    newDiv.innerText = shotForm(elems[k].id, 20);
                    snd.appendChild(newDiv);
                }
            }
        }
    }
    return clone
}

function createStakingElem(sub, templates) {
    const clone = templates.get("stakingElemTemplate").content.cloneNode(true);
    if ( sub.node != undefined ) {
        let elems, snd, head;
        for (const key in sub.node) {
            if (sub.node.hasOwnProperty(key)) {
                elems = sub.node[key];
                snd = clone.querySelector("."+ key);
                head = snd.querySelector("h4");
                head.innerText = key;

                for (let k = 0; k < elems.length; k++) {
                    newDiv = document.createElement("div");
                    newDiv.innerText = shotForm(elems[k].id, 20);
                    snd.appendChild(newDiv);
                }
                snd.classList.add("visible")
            }
        }
    }

    if ( sub.amount != undefined ) {
        const rec = clone.querySelector(".amount");
        const head = rec.querySelector("h4");
        head.innerText = "Amounts";

        for (const key in sub.amount) {
            if (sub.amount.hasOwnProperty(key)) {
                amount = sub.amount[key];
                newDiv = document.createElement("div");
                newDiv.innerText = key + ":" + amountsToText([amount]);
                rec.appendChild(newDiv);
            }
        }
    }
    return clone
}

/**
 *
 * @param {Array.<Object>} amounts
 */
function amountsToText(amounts) {
    var str = "";
    for (let i = 0; i < amounts.length; i++) {
        const am = amounts[i];
        if (am.numeric !== undefined && am.numeric !== 0 ) {
            str += " " + am.numeric + am.currency;
        } else {
            str += " " + am.text;
        }
    }
    return str;
}

/**
 *
 * @param {string} str string to shorten
 * @param {number} len length after which we need to shorten.
 */
function shotForm(str, len) {
    if (str.length > len) {
        return str.substr(0,8) + "..." + str.substr(str.length-8,8);
    }
    return str;
}

/**
 *
 * @param {string} time string with parsable date
 */
function humanizeDuration(time, now) {
    const diff = now - Date.parse(time);
    if (diff > 2592000000) { // ~ a month
        const months = Math.floor(diff / 2592000000)
        return "more than " +  months + ( (months > 1) ? " months ago" : " month ago");
    } else if (diff > 86400000) { // a day
        const days = Math.floor(diff / 86400000)
        return "more than " + days + ( (days > 1) ? " days ago" : " day ago");
    } else if (diff > 3600000) { // an hour
        const hours = Math.floor(diff / 3600000)
        return "more than " + hours + ( (hours > 1) ? " hours ago" : " hour ago");
    } else if (diff > 60000) { // a minute
        const minutes = Math.floor(diff / 60000)
        return  "more than " + minutes + ( (minutes > 1) ? " minutes ago" : " minute ago");
    } else {
        return "less than a minute ago";
    }
}
