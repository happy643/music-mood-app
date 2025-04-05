
// ✅ 請替換成你自己的 Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyA8Rt8oTApoAp3Hlz4UGzqQ5OwjZcpYZQg",
  authDomain: "music-mood-app-fb90b.firebaseapp.com",
  projectId: "music-mood-app-fb90b",
  storageBucket: "music-mood-app-fb90b.firebasestorage.app",
  messagingSenderId: "120675637099",
  appId: "1:120675637099:web:aee813a8cd5260d83c9e2e"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

const moodMusicMap = {
  "開心": "https://youtu.be/ZbZSe6N_BXs",
  "放鬆": "https://youtu.be/2OEL4P1Rz04",
  "失落": "https://youtu.be/hLQl3WQQoQ0",
  "努力": "https://youtu.be/2vjPBrBU-TM",
  "想跳舞": "https://youtu.be/CevxZvSJLk8"
};

auth.signInAnonymously()
  .then(() => {
    logToConsole("✅ 匿名登入成功！");
    loadHistory();
    loadMoodChart();
  })
  .catch(err => logToConsole(`❌ 匿名登入失敗：${err.message}`));

function recommendMusic() {
  const mood = document.getElementById("moodInput").value.trim();
  const link = moodMusicMap[mood];
  const linkBox = document.getElementById("musicLink");

  if (!link) {
    linkBox.innerHTML = `找不到與「${mood}」相關的音樂 😢`;
    logToConsole(`⚠️ 無對應音樂：「${mood}」`);
    return;
  }

  linkBox.innerHTML = `<a href="${link}" target="_blank">${link}</a>`;
  logToConsole(`🎵 推薦音樂給「${mood}」心情！`);

  const user = auth.currentUser;
  if (user) {
    db.collection("mood_music").add({
      mood: mood,
      music: link,
      uid: user.uid,
      timestamp: new Date()
    }).then(() => {
      logToConsole("✅ 已將推薦結果儲存到 Firestore！");
      loadHistory();
      loadMoodChart();
    }).catch(err => {
      logToConsole(`❌ 儲存失敗：${err.message}`);
    });
  }
}

function loadHistory() {
  const list = document.getElementById("historyList");
  list.innerHTML = "";

  db.collection("mood_music")
    .orderBy("timestamp", "desc")
    .limit(10)
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const data = doc.data();
        const time = data.timestamp?.toDate().toLocaleString();
        const li = document.createElement("li");
        li.innerHTML = `🕒 ${time}：<strong>${data.mood}</strong> → <a href="${data.music}" target="_blank">音樂</a>`;
        list.appendChild(li);
      });
      logToConsole("📜 已載入歷史紀錄");
    })
    .catch(err => logToConsole(`❌ 歷史載入失敗：${err.message}`));
}

function loadMoodChart() {
  db.collection("mood_music")
    .get()
    .then(snapshot => {
      const counter = {};
      snapshot.forEach(doc => {
        const mood = doc.data().mood;
        counter[mood] = (counter[mood] || 0) + 1;
      });

      const ctx = document.getElementById("moodChart").getContext("2d");
      if (window.moodChartInstance) window.moodChartInstance.destroy();

      window.moodChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
          labels: Object.keys(counter),
          datasets: [{
            label: "推薦次數",
            data: Object.values(counter),
            backgroundColor: "#66c"
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          }
        }
      });
      logToConsole("📊 已更新排行榜");
    })
    .catch(err => logToConsole(`❌ 排行榜載入失敗：${err.message}`));
}

function logToConsole(msg) {
  const box = document.getElementById("customConsole");
  const time = new Date().toLocaleTimeString();
  box.textContent += `[${time}] ${msg}\n`;
  box.scrollTop = box.scrollHeight;
}

