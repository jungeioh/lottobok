const functions = require("firebase-functions");
const axios = require("axios");

exports.recommendLotto = functions.https.onRequest(async (req, res) => {
  try {
    const maxDraw = 1160; // 최신 회차 번호 (필요시 수정)
    const frequency = {};

    for (let i = 1; i <= 45; i++) {
      frequency[i] = 0;
    }

    for (let draw = 1; draw <= maxDraw; draw++) {
      const url = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${draw}`;
      const response = await axios.get(url);

      if (response.data.returnValue === "success") {
        for (let i = 1; i <= 6; i++) {
          const num = response.data[`drwtNo${i}`];
          frequency[num]++;
        }
      }
    }

    const sorted = Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .map((item) => parseInt(item[0]));

    const recommended = sorted.slice(0, 6);

    res.json({
      recommended,
      frequency,
    });
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});
