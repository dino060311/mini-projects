var menus = [
  { id: "jja_n", name: "짜장면 일반", group: "짜장면", price: 7000, qty: 0 },
  { id: "jja_l", name: "짜장면 곱빼기", group: "짜장면", price: 8000, qty: 0 },
  { id: "jjam_n", name: "짬뽕 일반", group: "짬뽕", price: 8000, qty: 0 },
  { id: "jjam_l", name: "짬뽕 곱빼기", group: "짬뽕", price: 9000, qty: 0 },
  { id: "ud_n", name: "우동 일반", group: "우동", price: 7500, qty: 0 },
  { id: "ud_l", name: "우동 곱빼기", group: "우동", price: 8500, qty: 0 },
];
var orders = [];
var oid = 0;

function fmt(n) {
  return n.toLocaleString() + "원";
}
function now() {
  var d = new Date();
  return (
    ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2)
  );
}
function today() {
  var d = new Date();
  return (
    d.getFullYear() + "년 " + (d.getMonth() + 1) + "월 " + d.getDate() + "일"
  );
}

/* 토스트 메시지 함수 */
var toastTimer;
function showToast(msg) {
  var t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    t.classList.remove("show");
  }, 2000);
}

/* 커스텀 모달 함수 */
var modalCallback = null;
function showModal(title, msg, danger, cb) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalMsg").textContent = msg;
  var ok = document.getElementById("modalOk");
  ok.className = "modal-ok" + (danger ? " danger" : "");
  document.getElementById("modalBackdrop").classList.add("show");
  modalCallback = cb;
}

document.getElementById("modalOk").addEventListener("click", function () {
  document.getElementById("modalBackdrop").classList.remove("show");
  if (modalCallback) {
    modalCallback();
    modalCallback = null;
  }
});

document.getElementById("modalCancel").addEventListener("click", function () {
  document.getElementById("modalBackdrop").classList.remove("show");
  modalCallback = null;
});

/* 탭 전환 이벤트 */
document.querySelectorAll(".tab").forEach(function (tab) {
  tab.addEventListener("click", function () {
    var p = this.getAttribute("data-page");
    document.querySelectorAll(".tab").forEach(function (t) {
      t.classList.remove("active");
    });
    document.querySelectorAll(".page").forEach(function (el) {
      el.classList.remove("active");
    });
    this.classList.add("active");
    document.getElementById("page-" + p).classList.add("active");
    if (p === "settle") renderSettle();
  });
});

/* 수량 조절 버튼 (+) (-) */
document.addEventListener("click", function (e) {
  var btn = e.target.closest(".qbtn");
  if (!btn) return;
  var id = btn.getAttribute("data-id");
  var delta = parseInt(btn.getAttribute("data-delta"));
  var m = menus.find(function (item) {
    return item.id === id;
  });
  if (!m) return;
  m.qty = Math.max(0, m.qty + delta);
  var el = document.getElementById("q-" + id);
  el.textContent = m.qty;
  el.className = "qnum" + (m.qty === 0 ? " z" : "");
  updateSum();
});

/* 주문 목록에서 주문 취소 (X 버튼) */
document.getElementById("olist").addEventListener("click", function (e) {
  var btn = e.target.closest(".cancel-btn");
  if (!btn) return;
  var id = parseInt(btn.getAttribute("data-oid"));
  var o = orders.find(function (item) {
    return item.id === id;
  });
  if (!o || o.cancelled) return;
  showModal("주문 취소", "이 주문을 취소할까요?", true, function () {
    o.cancelled = true;
    renderOrders();
    showToast("주문이 취소되었습니다.");
    speakTTS("주문이 취소되었습니다.");
  });
});

/* 주문 접수 버튼 클릭 */
document.getElementById("sbtn").addEventListener("click", function () {
  var items = [];
  menus.forEach(function (m) {
    if (m.qty > 0)
      items.push({
        name: m.name,
        group: m.group,
        qty: m.qty,
        price: m.price,
        sub: m.price * m.qty,
      });
  });
  if (!items.length) return;
  var total = 0;
  items.forEach(function (i) {
    total += i.sub;
  });
  orders.unshift({
    id: oid++,
    items: items,
    time: now(),
    total: total,
    cancelled: false,
  });
  renderOrders();
  resetQty();
  showToast("주문이 접수되었습니다.");
  speakTTS("주문이 접수되었습니다.");
});

/* 선택 초기화 버튼 클릭 */
document.getElementById("resetBtn").addEventListener("click", resetQty);

/* 정산 페이지 - 하루 마감 버튼 클릭 */
document.getElementById("closeDayBtn").addEventListener("click", function () {
  if (!orders.length) {
    showToast("오늘 주문 내역이 없습니다.");
    return;
  }
  showModal(
    "하루 마감",
    "오늘 마감 처리하고 데이터를 초기화할까요?",
    true,
    function () {
      orders = [];
      oid = 0;
      renderOrders();
      renderSettle();
      document.querySelectorAll(".tab")[0].click();
      showToast("마감이 완료되었습니다.");
    },
  );
});

/* 유틸리티: 현재 선택된 메뉴 합계 업데이트 */
function updateSum() {
  var items = menus.filter(function (m) {
    return m.qty > 0;
  });
  var total = 0;
  items.forEach(function (m) {
    total += m.price * m.qty;
  });
  document.getElementById("curTotal").textContent = fmt(total);
  document.getElementById("sbtn").disabled = items.length === 0;
  document.getElementById("sumbox").textContent = items.length
    ? items
        .map(function (m) {
          return m.name + " " + m.qty + "개";
        })
        .join(" · ")
    : "메뉴를 선택하면 요약이 표시됩니다.";
}

/* 유틸리티: 메뉴 선택 수량 0으로 초기화 */
function resetQty() {
  menus.forEach(function (m) {
    m.qty = 0;
    var el = document.getElementById("q-" + m.id);
    if (el) {
      el.textContent = "0";
      el.className = "qnum z";
    }
  });
  updateSum();
}

/* 통계 계산 함수 */
function calcStats() {
  var valid = [],
    cancelled = [],
    totalSales = 0,
    totalBowls = 0;
  orders.forEach(function (o) {
    if (o.cancelled) {
      cancelled.push(o);
    } else {
      valid.push(o);
      totalSales += o.total;
      o.items.forEach(function (i) {
        totalBowls += i.qty;
      });
    }
  });
  return {
    valid: valid,
    cancelled: cancelled,
    totalSales: totalSales,
    totalBowls: totalBowls,
  };
}

/* 주문 리스트 화면 렌더링 */
function renderOrders() {
  var list = document.getElementById("olist");
  if (!orders.length) {
    list.innerHTML = '<p class="empty">아직 주문이 없습니다</p>';
    updateStatBar();
    return;
  }
  var html = "";
  orders.forEach(function (o) {
    var bowls = 0;
    o.items.forEach(function (i) {
      bowls += i.qty;
    });
    var menuText = o.items
      .map(function (i) {
        return i.name + " " + i.qty + "개";
      })
      .join(" · ");
    var right = o.cancelled
      ? '<span class="cancelled-tag">취소됨</span>'
      : '<button class="cancel-btn" data-oid="' + o.id + '">✕</button>';
    html +=
      '<div class="oitem' +
      (o.cancelled ? " cancelled" : "") +
      '">' +
      '<div class="oinfo"><div class="om">' +
      menuText +
      "</div>" +
      '<div class="ometa"><span>' +
      o.time +
      " · " +
      bowls +
      "그릇</span>" +
      '<span style="font-weight:500;' +
      (o.cancelled ? "text-decoration:line-through;" : "") +
      '">' +
      fmt(o.total) +
      "</span>" +
      "</div></div>" +
      right +
      "</div>";
  });
  list.innerHTML = html;
  updateStatBar();
}

/* 하단 실시간 통계 바 업데이트 */
function updateStatBar() {
  var st = calcStats();
  document.getElementById("cbadge").textContent = orders.length + "건";
  document.getElementById("tord").textContent = st.valid.length + "건";
  document.getElementById("tbowl").textContent = st.totalBowls + "개";
  document.getElementById("dayTotal").textContent = fmt(st.totalSales);
}

/* 정산 페이지 화면 렌더링 */
function renderSettle() {
  var st = calcStats();
  document.getElementById("closeDate").textContent = today();
  document.getElementById("closeSales").textContent = fmt(st.totalSales);
  document.getElementById("closeSub").textContent =
    "유효 주문 " + st.valid.length + "건 · " + st.totalBowls + "그릇";
  document.getElementById("s-sales").textContent = fmt(st.totalSales);
  document.getElementById("s-orders").textContent = st.valid.length + "건";
  document.getElementById("s-bowls").textContent = st.totalBowls + "개";
  document.getElementById("s-cancel").textContent = st.cancelled.length + "건";

  var tally = {
    짜장면: { qty: 0, amt: 0 },
    짬뽕: { qty: 0, amt: 0 },
    우동: { qty: 0, amt: 0 },
  };
  st.valid.forEach(function (o) {
    o.items.forEach(function (i) {
      if (tally[i.group]) {
        tally[i.group].qty += i.qty;
        tally[i.group].amt += i.sub;
      }
    });
  });
  var entries = [];
  Object.keys(tally).forEach(function (k) {
    if (tally[k].qty > 0) entries.push([k, tally[k]]);
  });
  var ms = document.getElementById("menuStats");
  if (!entries.length) {
    ms.innerHTML = '<p class="empty">주문 데이터가 없습니다</p>';
    return;
  }
  entries.sort(function (a, b) {
    return b[1].qty - a[1].qty;
  });
  var maxQty = entries[0][1].qty;
  ms.innerHTML = entries
    .map(function (e) {
      var pct = Math.round((e[1].qty / maxQty) * 100);
      return (
        '<div class="menu-stat-row">' +
        '<span class="msname">' +
        e[0] +
        "</span>" +
        '<div class="bar-wrap"><div class="bar" style="width:' +
        pct +
        '%"></div></div>' +
        '<span class="mscount">' +
        e[1].qty +
        "개</span>" +
        '<span class="msamt">' +
        fmt(e[1].amt) +
        "</span></div>"
      );
    })
    .join("");
}

// 초기 로딩 시 날짜 표시
document.getElementById("closeDate").textContent = today();

// 글자를 읽어주는 함수입니다.
function speakTTS(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR"; // 한국어로 설정
  window.speechSynthesis.speak(utterance);
}

// 1. 음성 인식 설정
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.lang = "ko-KR"; // 한국어 설정
recognition.continuous = true; // 계속 듣기
recognition.interimResults = true; // 중간 결과 확인

// 키워드 설정
const addressKeywords = ["옆", "상가", "집", "빌라", "동", "호"];
let currentDetectedAddress = "";

// 음성 인식 시작 함수
function startListening() {
    try {
        recognition.start();
        // UI 표시
        document.getElementById('voiceStatus').style.display = 'flex';
        showToast("🎤 마이크가 켜졌습니다.");
        speakTTS("네, 말씀하세요.");
    } catch (e) {
        showToast("이미 마이크가 켜져 있습니다.");
    }
}

// 음성 인식이 어떤 이유로든 멈췄을 때 (에러나 시간 초과 등)
recognition.onend = function() {
    // 2초 타이머가 돌고 있는 중이 아니라면(주문 완료 전이면) 다시 시작하게 하거나 상태를 숨깁니다.
    // 여기서는 일단 상태바를 숨기는 것으로 처리할게요.
    document.getElementById('voiceStatus').style.display = 'none';
    console.log("음성 인식 종료");
};

// 음성 인식 결과가 들어올 때 텍스트를 화면에 실시간으로 보여주기
recognition.onresult = function(event) {
    const result = event.results[event.results.length - 1];
    let text = result[0].transcript;
    
    // 할아버지가 내가 한 말을 확인할 수 있게 상태 텍스트 변경
    document.getElementById('statusText').textContent = "인식 중: " + text;

    if (!result.isFinal) return; 

    // ... (이후 기존의 메뉴/주소 인식 및 2초 타이머 로직 그대로 유지) ...
    
    // 최종 결과가 나왔을 때 다시 기본 문구로 변경
    setTimeout(() => {
        document.getElementById('statusText').textContent = "말씀하세요! 듣고 있어요...";
    }, 1000);
};